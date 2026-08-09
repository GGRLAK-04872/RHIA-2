import {
  ENTITY_TYPES,
  RHIA_SCHEMA_VERSION,
  type Area,
  type AuditEntry,
  type Note,
  type PersistedEntity,
  type Source,
} from "@rhia/domain";
import { z } from "zod";

export const entityIdSchema = z.string().uuid();
export const timestampSchema = z.string().datetime({ offset: true });

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

export const persistedEntitySchema: z.ZodType<PersistedEntity> = z.union([
  areaSchema,
  sourceSchema,
  noteSchema,
  auditEntrySchema,
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

export const appStatusSchema = z.discriminatedUnion("stage", [
  stageZeroAppStatusSchema,
  stageOneAppStatusSchema,
]);

export type AppStatus = z.infer<typeof appStatusSchema>;

export const backupDataSchema = z
  .object({
    areas: z.array(areaSchema),
    sources: z.array(sourceSchema),
    notes: z.array(noteSchema),
    auditEntries: z.array(auditEntrySchema),
  })
  .strict();

export const backupRecordCountsSchema = z
  .object({
    areas: z.number().int().nonnegative(),
    sources: z.number().int().nonnegative(),
    notes: z.number().int().nonnegative(),
    auditEntries: z.number().int().nonnegative(),
  })
  .strict();

export const backupManifestSchema = z
  .object({
    format: z.literal("rhia-backup"),
    formatVersion: z.literal(1),
    schemaVersion: z.literal(RHIA_SCHEMA_VERSION),
    createdAt: timestampSchema,
    checksumAlgorithm: z.literal("SHA-256"),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
    recordCounts: backupRecordCountsSchema,
  })
  .strict();

export const rhiaBackupPackageSchema = z
  .object({
    manifest: backupManifestSchema,
    data: backupDataSchema,
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

export type RhiaBackupData = z.infer<typeof backupDataSchema>;
export type RhiaBackupPackage = z.infer<typeof rhiaBackupPackageSchema>;
