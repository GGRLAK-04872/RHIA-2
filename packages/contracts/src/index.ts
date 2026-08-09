import {
  ENTITY_TYPES,
  RHIA_SCHEMA_VERSION,
  type Area,
  type AuditEntry,
  type Decision,
  type MemoryConflict,
  type MemoryFact,
  type Note,
  type PersistedEntity,
  type Source,
} from "@rhia/domain";
import { z } from "zod";

export const entityIdSchema = z.string().uuid();
export const timestampSchema = z.string().datetime({ offset: true });
export const originDeviceIdSchema = z.string().trim().min(1).max(160);
export const conflictKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9._:/-]*$/, "Konfliktschlüssel muss stabil und normalisiert sein.");

const entityBaseShape = {
  id: entityIdSchema,
  schemaVersion: z.literal(RHIA_SCHEMA_VERSION),
  revision: z.number().int().positive(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
};

function validateTimeline(
  entity: { createdAt: string; updatedAt: string; deletedAt: string | null },
  context: z.RefinementCtx,
) {
  const createdAt = Date.parse(entity.createdAt);
  const updatedAt = Date.parse(entity.updatedAt);

  if (updatedAt < createdAt) {
    context.addIssue({
      code: "custom",
      path: ["updatedAt"],
      message: "updatedAt darf nicht vor createdAt liegen.",
    });
  }

  if (entity.deletedAt !== null && Date.parse(entity.deletedAt) < createdAt) {
    context.addIssue({
      code: "custom",
      path: ["deletedAt"],
      message: "deletedAt darf nicht vor createdAt liegen.",
    });
  }
}

function validateValidityWindow(
  entity: { validFrom: string | null; validUntil: string | null },
  context: z.RefinementCtx,
) {
  if (
    entity.validFrom !== null &&
    entity.validUntil !== null &&
    Date.parse(entity.validUntil) < Date.parse(entity.validFrom)
  ) {
    context.addIssue({
      code: "custom",
      path: ["validUntil"],
      message: "validUntil darf nicht vor validFrom liegen.",
    });
  }
}

function validateConfirmation(
  entity: {
    status: string;
    createdAt: string;
    confirmedAt: string | null;
    confirmedBy: "sir" | null;
    deletedAt: string | null;
  },
  context: z.RefinementCtx,
) {
  if ((entity.confirmedAt === null) !== (entity.confirmedBy === null)) {
    context.addIssue({
      code: "custom",
      path: ["confirmedAt"],
      message: "Bestätigungszeitpunkt und bestätigende Person müssen gemeinsam gesetzt sein.",
    });
  }

  const confirmationRequiredStatuses = new Set(["confirmed", "disputed", "superseded", "revoked"]);
  if (confirmationRequiredStatuses.has(entity.status) && entity.confirmedAt === null) {
    context.addIssue({
      code: "custom",
      path: ["confirmedAt"],
      message: "Bestätigtes Wissen benötigt eine ausdrückliche Bestätigung.",
    });
  }

  if (entity.status === "proposed" && entity.confirmedAt !== null) {
    context.addIssue({
      code: "custom",
      path: ["confirmedAt"],
      message: "Ein Vorschlag darf noch keine Bestätigung enthalten.",
    });
  }

  if (
    entity.confirmedAt !== null &&
    Date.parse(entity.confirmedAt) < Date.parse(entity.createdAt)
  ) {
    context.addIssue({
      code: "custom",
      path: ["confirmedAt"],
      message: "confirmedAt darf nicht vor createdAt liegen.",
    });
  }

  if ((entity.status === "deleted") !== (entity.deletedAt !== null)) {
    context.addIssue({
      code: "custom",
      path: ["deletedAt"],
      message: "Status und Löschzeitpunkt widersprechen sich.",
    });
  }
}

const sourceIdsSchema = z
  .array(entityIdSchema)
  .min(1)
  .max(50)
  .superRefine((sourceIds, context) => {
    if (new Set(sourceIds).size !== sourceIds.length) {
      context.addIssue({
        code: "custom",
        message: "Quellen dürfen nicht doppelt verknüpft werden.",
      });
    }
  });

export const areaSchema: z.ZodType<Area> = z
  .object({
    ...entityBaseShape,
    type: z.literal("area"),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2_000).nullable(),
    status: z.enum(["active", "archived"]),
  })
  .strict()
  .superRefine(validateTimeline);

export const sourceSchema: z.ZodType<Source> = z
  .object({
    ...entityBaseShape,
    type: z.literal("source"),
    kind: z.enum(["manual", "import", "system"]),
    label: z.string().trim().min(1).max(160),
    reference: z.string().trim().max(2_000).nullable(),
  })
  .strict()
  .superRefine(validateTimeline);

export const noteSchema: z.ZodType<Note> = z
  .object({
    ...entityBaseShape,
    type: z.literal("note"),
    areaId: entityIdSchema,
    sourceId: entityIdSchema.nullable(),
    title: z.string().trim().min(1).max(240),
    body: z.string().max(100_000),
    status: z.enum(["active", "archived"]),
  })
  .strict()
  .superRefine(validateTimeline);

export const auditEntrySchema: z.ZodType<AuditEntry> = z
  .object({
    ...entityBaseShape,
    type: z.literal("audit-entry"),
    entityType: z.enum(ENTITY_TYPES),
    entityId: entityIdSchema,
    entityRevision: z.number().int().positive(),
    action: z.enum(["create", "update", "delete", "restore", "purge"]),
    occurredAt: timestampSchema,
    summary: z.string().trim().max(500).nullable(),
  })
  .strict()
  .superRefine((entity, context) => {
    validateTimeline(entity, context);
    if (Date.parse(entity.occurredAt) < Date.parse(entity.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["occurredAt"],
        message: "occurredAt darf nicht vor createdAt liegen.",
      });
    }
  });

export const memoryFactSchema: z.ZodType<MemoryFact> = z
  .object({
    ...entityBaseShape,
    type: z.literal("memory-fact"),
    areaId: entityIdSchema,
    sourceIds: sourceIdsSchema,
    originDeviceId: originDeviceIdSchema,
    knowledgeType: z.string().trim().min(1).max(80),
    subject: z.string().trim().min(1).max(240),
    predicate: z.string().trim().min(1).max(160),
    value: z.string().min(1).max(100_000),
    conflictKey: conflictKeySchema,
    displayText: z.string().trim().min(1).max(10_000),
    status: z.enum(["proposed", "confirmed", "disputed", "superseded", "deleted"]),
    validFrom: timestampSchema.nullable(),
    validUntil: timestampSchema.nullable(),
    confirmedAt: timestampSchema.nullable(),
    confirmedBy: z.literal("sir").nullable(),
    supersedesId: entityIdSchema.nullable(),
  })
  .strict()
  .superRefine((entity, context) => {
    validateTimeline(entity, context);
    validateValidityWindow(entity, context);
    validateConfirmation(entity, context);
    if (entity.supersedesId === entity.id) {
      context.addIssue({
        code: "custom",
        path: ["supersedesId"],
        message: "Ein Fakt darf sich nicht selbst ersetzen.",
      });
    }
  });

export const decisionSchema: z.ZodType<Decision> = z
  .object({
    ...entityBaseShape,
    type: z.literal("decision"),
    areaId: entityIdSchema,
    sourceIds: sourceIdsSchema,
    originDeviceId: originDeviceIdSchema,
    title: z.string().trim().min(1).max(240),
    decisionText: z.string().trim().min(1).max(10_000),
    rationale: z.string().trim().min(1).max(10_000),
    status: z.enum(["proposed", "confirmed", "superseded", "revoked", "deleted"]),
    validFrom: timestampSchema.nullable(),
    validUntil: timestampSchema.nullable(),
    confirmedAt: timestampSchema.nullable(),
    confirmedBy: z.literal("sir").nullable(),
    supersedesId: entityIdSchema.nullable(),
  })
  .strict()
  .superRefine((entity, context) => {
    validateTimeline(entity, context);
    validateValidityWindow(entity, context);
    validateConfirmation(entity, context);
    if (entity.supersedesId === entity.id) {
      context.addIssue({
        code: "custom",
        path: ["supersedesId"],
        message: "Eine Entscheidung darf sich nicht selbst ersetzen.",
      });
    }
  });

export const memoryConflictSchema: z.ZodType<MemoryConflict> = z
  .object({
    ...entityBaseShape,
    type: z.literal("memory-conflict"),
    areaId: entityIdSchema,
    originDeviceId: originDeviceIdSchema,
    conflictKey: conflictKeySchema,
    factIds: z.array(entityIdSchema).min(2).max(10),
    status: z.enum(["open", "resolved", "dismissed"]),
    detectedAt: timestampSchema,
    resolvedAt: timestampSchema.nullable(),
    resolvedBy: z.literal("sir").nullable(),
    resolution: z.enum(["keep-fact", "replace-both", "not-a-conflict"]).nullable(),
    resolvedFactId: entityIdSchema.nullable(),
    note: z.string().trim().max(2_000).nullable(),
  })
  .strict()
  .superRefine((entity, context) => {
    validateTimeline(entity, context);

    if (new Set(entity.factIds).size !== entity.factIds.length) {
      context.addIssue({
        code: "custom",
        path: ["factIds"],
        message: "Ein Konflikt benötigt unterschiedliche Fakten.",
      });
    }

    if (Date.parse(entity.detectedAt) < Date.parse(entity.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["detectedAt"],
        message: "detectedAt darf nicht vor createdAt liegen.",
      });
    }

    if (
      entity.resolvedAt !== null &&
      Date.parse(entity.resolvedAt) < Date.parse(entity.detectedAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["resolvedAt"],
        message: "resolvedAt darf nicht vor detectedAt liegen.",
      });
    }

    const resolutionFields = [entity.resolvedAt, entity.resolvedBy, entity.resolution];
    const hasAnyResolution = resolutionFields.some((field) => field !== null);
    const hasCompleteResolution = resolutionFields.every((field) => field !== null);
    if (entity.status === "open" && (hasAnyResolution || entity.resolvedFactId !== null)) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Ein offener Konflikt darf keine Auflösung enthalten.",
      });
    }
    if (entity.status !== "open" && !hasCompleteResolution) {
      context.addIssue({
        code: "custom",
        path: ["resolution"],
        message: "Ein geschlossener Konflikt benötigt eine vollständige Auflösung.",
      });
    }
    if (entity.status === "dismissed" && entity.resolution !== "not-a-conflict") {
      context.addIssue({
        code: "custom",
        path: ["resolution"],
        message: "Ein verworfener Konflikt muss als Nicht-Konflikt begründet sein.",
      });
    }
    if (entity.resolution === "not-a-conflict" && entity.status !== "dismissed") {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Ein Nicht-Konflikt muss als verworfen markiert sein.",
      });
    }
    if (
      entity.resolution === "keep-fact" &&
      (entity.resolvedFactId === null || !entity.factIds.includes(entity.resolvedFactId))
    ) {
      context.addIssue({
        code: "custom",
        path: ["resolvedFactId"],
        message: "Der beibehaltene Fakt muss zum Konflikt gehören.",
      });
    }
  });

export const persistedEntitySchema: z.ZodType<PersistedEntity> = z.union([
  areaSchema,
  sourceSchema,
  noteSchema,
  auditEntrySchema,
  memoryFactSchema,
  decisionSchema,
  memoryConflictSchema,
]);

export const stageZeroAppStatusSchema = z.object({
  version: z.string().min(1),
  stage: z.literal(0),
  mode: z.literal("local-only"),
  apiEnabled: z.literal(false),
  persistenceEnabled: z.literal(false),
});

export const stageOneAppStatusSchema = z.object({
  version: z.string().min(1),
  stage: z.literal(1),
  mode: z.literal("local-first"),
  apiEnabled: z.literal(false),
  persistenceEnabled: z.literal(true),
});

export const stageTwoAppStatusSchema = z.object({
  version: z.string().min(1),
  stage: z.literal(2),
  mode: z.literal("local-first"),
  apiEnabled: z.literal(false),
  persistenceEnabled: z.literal(true),
});

export const appStatusSchema = z.discriminatedUnion("stage", [
  stageZeroAppStatusSchema,
  stageOneAppStatusSchema,
  stageTwoAppStatusSchema,
]);

export type AppStatus = z.infer<typeof appStatusSchema>;

export const backupDataV1Schema = z
  .object({
    areas: z.array(areaSchema),
    sources: z.array(sourceSchema),
    notes: z.array(noteSchema),
    auditEntries: z.array(auditEntrySchema),
  })
  .strict();

export const backupRecordCountsV1Schema = z
  .object({
    areas: z.number().int().nonnegative(),
    sources: z.number().int().nonnegative(),
    notes: z.number().int().nonnegative(),
    auditEntries: z.number().int().nonnegative(),
  })
  .strict();

export const backupManifestV1Schema = z
  .object({
    format: z.literal("rhia-backup"),
    formatVersion: z.literal(1),
    schemaVersion: z.literal(RHIA_SCHEMA_VERSION),
    createdAt: timestampSchema,
    checksumAlgorithm: z.literal("SHA-256"),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
    recordCounts: backupRecordCountsV1Schema,
  })
  .strict();

export const rhiaBackupPackageV1Schema = z
  .object({
    manifest: backupManifestV1Schema,
    data: backupDataV1Schema,
  })
  .strict()
  .superRefine((backup, context) => {
    for (const key of ["areas", "sources", "notes", "auditEntries"] as const) {
      if (backup.manifest.recordCounts[key] !== backup.data[key].length) {
        context.addIssue({
          code: "custom",
          path: ["manifest", "recordCounts", key],
          message: `Die Datensatzanzahl für ${key} stimmt nicht.`,
        });
      }
    }
  });

export const backupDataV2Schema = z
  .object({
    areas: z.array(areaSchema),
    sources: z.array(sourceSchema),
    notes: z.array(noteSchema),
    auditEntries: z.array(auditEntrySchema),
    memoryFacts: z.array(memoryFactSchema),
    decisions: z.array(decisionSchema),
    memoryConflicts: z.array(memoryConflictSchema),
  })
  .strict();

export const backupRecordCountsV2Schema = z
  .object({
    areas: z.number().int().nonnegative(),
    sources: z.number().int().nonnegative(),
    notes: z.number().int().nonnegative(),
    auditEntries: z.number().int().nonnegative(),
    memoryFacts: z.number().int().nonnegative(),
    decisions: z.number().int().nonnegative(),
    memoryConflicts: z.number().int().nonnegative(),
  })
  .strict();

export const backupManifestV2Schema = z
  .object({
    format: z.literal("rhia-backup"),
    formatVersion: z.literal(2),
    schemaVersion: z.literal(RHIA_SCHEMA_VERSION),
    createdAt: timestampSchema,
    checksumAlgorithm: z.literal("SHA-256"),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
    recordCounts: backupRecordCountsV2Schema,
  })
  .strict();

export const rhiaBackupPackageV2Schema = z
  .object({
    manifest: backupManifestV2Schema,
    data: backupDataV2Schema,
  })
  .strict()
  .superRefine((backup, context) => {
    for (const key of [
      "areas",
      "sources",
      "notes",
      "auditEntries",
      "memoryFacts",
      "decisions",
      "memoryConflicts",
    ] as const) {
      if (backup.manifest.recordCounts[key] !== backup.data[key].length) {
        context.addIssue({
          code: "custom",
          path: ["manifest", "recordCounts", key],
          message: `Die Datensatzanzahl für ${key} stimmt nicht.`,
        });
      }
    }
  });

export const backupDataSchema = backupDataV2Schema;
export const backupRecordCountsSchema = backupRecordCountsV2Schema;
export const backupManifestSchema = backupManifestV2Schema;
export const rhiaBackupPackageSchema = z.union([
  rhiaBackupPackageV1Schema,
  rhiaBackupPackageV2Schema,
]);

export type RhiaBackupDataV1 = z.infer<typeof backupDataV1Schema>;
export type RhiaBackupPackageV1 = z.infer<typeof rhiaBackupPackageV1Schema>;
export type RhiaBackupData = z.infer<typeof backupDataV2Schema>;
export type RhiaBackupPackageV2 = z.infer<typeof rhiaBackupPackageV2Schema>;
export type RhiaBackupPackage = z.infer<typeof rhiaBackupPackageSchema>;
