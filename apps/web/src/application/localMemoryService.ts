import {
  assertActiveConfirmedMemoryRecord,
  assertPendingMemoryProposal,
  confirmDecisionProposal,
  confirmMemoryFactProposal,
  createArea,
  createAuditEntry,
  createDecision,
  createMemoryConflict,
  createMemoryFact,
  createSource,
  type Area,
  type CreateDecisionInput,
  type CreateMemoryFactInput,
  type Decision,
  type DecisionStatus,
  type MemoryConflict,
  type MemoryFact,
  type MemoryFactStatus,
  RepositoryError,
  type Source,
  revokeDecision,
  supersedeDecision,
  supersedeMemoryFact,
} from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";

type Clock = () => string;

export interface MemoryProposalContext {
  originDeviceId: string;
}

export interface ExplicitSirConfirmation {
  actor: "sir";
  explicitlyConfirmed: true;
}

export interface ExplicitSirRejection {
  actor: "sir";
  explicitlyRejected: true;
}

export interface ExplicitSirDiscard {
  actor: "sir";
  explicitlyDiscarded: true;
}

export interface ExplicitSirConflictResolution {
  actor: "sir";
  explicitlyResolved: true;
  note?: string | null;
}

export interface ExplicitSirRestore {
  actor: "sir";
  explicitlyRestored: true;
}

export type NewMemoryFactInput = Omit<CreateMemoryFactInput, "supersedesId">;
export type NewDecisionInput = Omit<CreateDecisionInput, "supersedesId">;

export interface MemoryHistory<TEntity extends MemoryFact | Decision> {
  requestedId: string;
  activeVersion: TEntity | null;
  versions: TEntity[];
}

export type MemoryRecordType = "fact" | "decision";
export type MemoryValidity = "current" | "future" | "expired";
export type MemoryRecordStatus = MemoryFactStatus | DecisionStatus;

export interface MemorySearchFilters {
  query?: string;
  areaId?: string;
  recordTypes?: MemoryRecordType[];
  statuses?: MemoryRecordStatus[];
  sourceIds?: string[];
  validity?: MemoryValidity;
  validAt?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  includeDeleted?: boolean;
}

export interface MemorySearchHit {
  recordType: MemoryRecordType;
  record: MemoryFact | Decision;
  areaName: string;
  sources: Source[];
  validity: MemoryValidity;
}

export interface MemoryWorkspace {
  areas: Area[];
  sources: Source[];
  hits: MemorySearchHit[];
  openConflicts: MemoryConflict[];
  conflictFacts: MemoryFact[];
}

export interface LocalMemoryServiceOptions {
  storage?: RhiaBrowserStorage;
  now?: Clock;
}

export class LocalMemoryService {
  private readonly storage: RhiaBrowserStorage;
  private readonly now: Clock;
  private opened = false;

  constructor(options: LocalMemoryServiceOptions = {}) {
    this.storage = options.storage ?? createRhiaBrowserStorage();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async initialize(): Promise<void> {
    if (!this.opened) {
      await this.storage.open();
      this.opened = true;
    }
  }

  async getMemoryWorkspace(filters: MemorySearchFilters = {}): Promise<MemoryWorkspace> {
    const { areas, sources } = await this.ensureMemoryReferences();
    const [hits, openConflicts] = await Promise.all([
      this.searchMemory(filters),
      this.listOpenMemoryConflicts(),
    ]);
    const conflictIds = new Set(openConflicts.flatMap((conflict) => conflict.factIds));
    const conflictFacts = (await this.storage.memoryFacts.list()).filter((fact) =>
      conflictIds.has(fact.id),
    );
    return { areas, sources, hits, openConflicts, conflictFacts };
  }

  async proposeMemoryFact(
    input: NewMemoryFactInput,
    context: MemoryProposalContext,
  ): Promise<MemoryFact> {
    await this.initialize();
    const proposedAt = this.now();
    const fact = createMemoryFact(
      { ...input, supersedesId: null },
      {
        originDeviceId: context.originDeviceId,
        timestamp: proposedAt,
      },
    );

    return this.storage.transaction(async (repositories) => {
      await this.requireReferences(input.areaId, input.sourceIds, repositories);
      const stored = await repositories.memoryFacts.create(fact);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: stored.type,
            entityId: stored.id,
            entityRevision: stored.revision,
            action: "create",
            summary: "Gedächtnisfakt als Vorschlag gespeichert.",
          },
          { timestamp: proposedAt },
        ),
      );
      return stored;
    });
  }

  async proposeDecision(
    input: NewDecisionInput,
    context: MemoryProposalContext,
  ): Promise<Decision> {
    await this.initialize();
    const proposedAt = this.now();
    const decision = createDecision(
      { ...input, supersedesId: null },
      {
        originDeviceId: context.originDeviceId,
        timestamp: proposedAt,
      },
    );

    return this.storage.transaction(async (repositories) => {
      await this.requireReferences(input.areaId, input.sourceIds, repositories);
      const stored = await repositories.decisions.create(decision);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: stored.type,
            entityId: stored.id,
            entityRevision: stored.revision,
            action: "create",
            summary: "Entscheidung als Vorschlag gespeichert.",
          },
          { timestamp: proposedAt },
        ),
      );
      return stored;
    });
  }

  async correctMemoryFact(
    id: string,
    expectedRevision: number,
    input: NewMemoryFactInput,
    context: MemoryProposalContext,
  ): Promise<MemoryFact> {
    await this.initialize();
    const proposedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.memoryFacts.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Der Gedächtnisfakt wurde nicht gefunden.");
      }
      assertActiveConfirmedMemoryRecord(current);
      this.requireExpectedRevision(current.revision, expectedRevision);
      this.requireNoOpenSuccessor(
        current.id,
        await repositories.memoryFacts.list({ includeDeleted: true }),
      );
      await this.requireReferences(input.areaId, input.sourceIds, repositories);

      const correction = createMemoryFact(
        { ...input, supersedesId: current.id },
        { originDeviceId: context.originDeviceId, timestamp: proposedAt },
      );
      const stored = await repositories.memoryFacts.create(correction);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: stored.type,
            entityId: stored.id,
            entityRevision: stored.revision,
            action: "create",
            summary: "Korrekturvorschlag für Gedächtnisfakt gespeichert.",
          },
          { timestamp: proposedAt },
        ),
      );
      return stored;
    });
  }

  async correctDecision(
    id: string,
    expectedRevision: number,
    input: NewDecisionInput,
    context: MemoryProposalContext,
  ): Promise<Decision> {
    await this.initialize();
    const proposedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.decisions.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Entscheidung wurde nicht gefunden.");
      }
      assertActiveConfirmedMemoryRecord(current);
      this.requireExpectedRevision(current.revision, expectedRevision);
      this.requireNoOpenSuccessor(
        current.id,
        await repositories.decisions.list({ includeDeleted: true }),
      );
      await this.requireReferences(input.areaId, input.sourceIds, repositories);

      const correction = createDecision(
        { ...input, supersedesId: current.id },
        { originDeviceId: context.originDeviceId, timestamp: proposedAt },
      );
      const stored = await repositories.decisions.create(correction);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: stored.type,
            entityId: stored.id,
            entityRevision: stored.revision,
            action: "create",
            summary: "Korrekturvorschlag für Entscheidung gespeichert.",
          },
          { timestamp: proposedAt },
        ),
      );
      return stored;
    });
  }

  async confirmMemoryFact(
    id: string,
    expectedRevision: number,
    confirmation: ExplicitSirConfirmation,
  ): Promise<MemoryFact> {
    this.requireExplicitConfirmation(confirmation);
    await this.initialize();
    const confirmedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.memoryFacts.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Der Gedächtnisfakt wurde nicht gefunden.");
      }
      assertPendingMemoryProposal(current);
      this.requireExpectedRevision(current.revision, expectedRevision);

      let superseded: MemoryFact | null = null;
      if (current.supersedesId !== null) {
        const predecessor = await repositories.memoryFacts.getById(current.supersedesId);
        if (!predecessor) {
          throw new RepositoryError(
            "RECORD_NOT_FOUND",
            "Die vorherige Gedächtnisfassung wurde nicht gefunden.",
          );
        }
        superseded = await repositories.memoryFacts.replace(
          supersedeMemoryFact(predecessor),
          predecessor.revision,
        );
      }

      const confirmedProposal = confirmMemoryFactProposal(current, {
        actor: confirmation.actor,
        explicitlyConfirmed: true,
        confirmedAt,
      });
      const conflictingFacts = (await repositories.memoryFacts.list())
        .filter(
          (fact) =>
            fact.id !== current.id &&
            fact.id !== current.supersedesId &&
            fact.conflictKey === current.conflictKey &&
            fact.value !== current.value &&
            (fact.status === "confirmed" || fact.status === "disputed"),
        )
        .toSorted((left, right) => left.id.localeCompare(right.id));
      const nextProposal =
        conflictingFacts.length > 0
          ? { ...confirmedProposal, status: "disputed" as const }
          : confirmedProposal;
      const confirmed = await repositories.memoryFacts.replace(nextProposal, expectedRevision);
      let openConflict: MemoryConflict | null = null;
      if (conflictingFacts.length > 0) {
        const disputedFacts: MemoryFact[] = [];
        for (const fact of conflictingFacts) {
          disputedFacts.push(
            fact.status === "disputed"
              ? fact
              : await repositories.memoryFacts.replace(
                  { ...fact, status: "disputed" },
                  fact.revision,
                ),
          );
        }

        const existingConflict = (await repositories.memoryConflicts.list()).find(
          (conflict) => conflict.conflictKey === current.conflictKey && conflict.status === "open",
        );
        const factIds = [...new Set([confirmed.id, ...disputedFacts.map((fact) => fact.id)])]
          .toSorted()
          .slice(0, 10);
        openConflict = existingConflict
          ? await repositories.memoryConflicts.replace(
              { ...existingConflict, factIds },
              existingConflict.revision,
            )
          : await repositories.memoryConflicts.create(
              createMemoryConflict(
                {
                  areaId: confirmed.areaId,
                  conflictKey: confirmed.conflictKey,
                  factIds,
                },
                { originDeviceId: confirmed.originDeviceId, timestamp: confirmedAt },
              ),
            );
      }
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: confirmed.type,
            entityId: confirmed.id,
            entityRevision: confirmed.revision,
            action: "update",
            summary: openConflict
              ? "Gedächtnisvorschlag bestätigt; sichtbarer Widerspruch erkannt."
              : "Gedächtnisvorschlag von Sir bestätigt.",
          },
          { timestamp: confirmedAt },
        ),
      );
      if (superseded) {
        await repositories.auditEntries.create(
          createAuditEntry(
            {
              entityType: superseded.type,
              entityId: superseded.id,
              entityRevision: superseded.revision,
              action: "update",
              summary: "Vorherige Gedächtnisfassung nachvollziehbar ersetzt.",
            },
            { timestamp: confirmedAt },
          ),
        );
      }
      return confirmed;
    });
  }

  async listOpenMemoryConflicts(): Promise<MemoryConflict[]> {
    await this.initialize();
    return (await this.storage.memoryConflicts.list()).filter(
      (conflict) => conflict.status === "open",
    );
  }

  async resolveMemoryConflictKeepingFact(
    conflictId: string,
    expectedRevision: number,
    keptFactId: string,
    resolution: ExplicitSirConflictResolution,
  ): Promise<MemoryConflict> {
    this.requireExplicitConflictResolution(resolution);
    await this.initialize();
    const resolvedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const conflict = await repositories.memoryConflicts.getById(conflictId);
      if (!conflict) {
        throw new RepositoryError(
          "RECORD_NOT_FOUND",
          "Der Gedächtniskonflikt wurde nicht gefunden.",
        );
      }
      this.requireOpenConflict(conflict, expectedRevision);
      if (!conflict.factIds.includes(keptFactId)) {
        throw new RepositoryError(
          "INVALID_STATE_TRANSITION",
          "Der beizubehaltende Fakt gehört nicht zu diesem Konflikt.",
        );
      }

      for (const factId of conflict.factIds) {
        const fact = await repositories.memoryFacts.getById(factId);
        if (fact?.status !== "disputed") {
          throw new RepositoryError(
            "INVALID_STATE_TRANSITION",
            "Der Konflikt enthält keinen vollständig auflösbaren Faktenstand.",
          );
        }
        const nextStatus = fact.id === keptFactId ? "confirmed" : "superseded";
        await repositories.memoryFacts.replace({ ...fact, status: nextStatus }, fact.revision);
      }

      const resolved = await repositories.memoryConflicts.replace(
        {
          ...conflict,
          status: "resolved",
          resolvedAt,
          resolvedBy: "sir",
          resolution: "keep-fact",
          resolvedFactId: keptFactId,
          note: resolution.note ?? null,
        },
        expectedRevision,
      );
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: resolved.type,
            entityId: resolved.id,
            entityRevision: resolved.revision,
            action: "update",
            summary: "Gedächtniskonflikt von Sir durch Beibehalten eines Fakts aufgelöst.",
          },
          { timestamp: resolvedAt },
        ),
      );
      return resolved;
    });
  }

  async dismissMemoryConflict(
    conflictId: string,
    expectedRevision: number,
    resolution: ExplicitSirConflictResolution,
  ): Promise<MemoryConflict> {
    this.requireExplicitConflictResolution(resolution);
    await this.initialize();
    const resolvedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const conflict = await repositories.memoryConflicts.getById(conflictId);
      if (!conflict) {
        throw new RepositoryError(
          "RECORD_NOT_FOUND",
          "Der Gedächtniskonflikt wurde nicht gefunden.",
        );
      }
      this.requireOpenConflict(conflict, expectedRevision);

      for (const factId of conflict.factIds) {
        const fact = await repositories.memoryFacts.getById(factId);
        if (fact?.status !== "disputed") {
          throw new RepositoryError(
            "INVALID_STATE_TRANSITION",
            "Der Konflikt enthält keinen vollständig verwerfbaren Faktenstand.",
          );
        }
        await repositories.memoryFacts.replace({ ...fact, status: "confirmed" }, fact.revision);
      }

      const dismissed = await repositories.memoryConflicts.replace(
        {
          ...conflict,
          status: "dismissed",
          resolvedAt,
          resolvedBy: "sir",
          resolution: "not-a-conflict",
          resolvedFactId: null,
          note: resolution.note ?? null,
        },
        expectedRevision,
      );
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: dismissed.type,
            entityId: dismissed.id,
            entityRevision: dismissed.revision,
            action: "update",
            summary: "Gedächtniskonflikt von Sir ausdrücklich als Nicht-Konflikt verworfen.",
          },
          { timestamp: resolvedAt },
        ),
      );
      return dismissed;
    });
  }

  async confirmDecision(
    id: string,
    expectedRevision: number,
    confirmation: ExplicitSirConfirmation,
  ): Promise<Decision> {
    this.requireExplicitConfirmation(confirmation);
    await this.initialize();
    const confirmedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.decisions.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Entscheidung wurde nicht gefunden.");
      }

      let superseded: Decision | null = null;
      if (current.supersedesId !== null) {
        const predecessor = await repositories.decisions.getById(current.supersedesId);
        if (!predecessor) {
          throw new RepositoryError(
            "RECORD_NOT_FOUND",
            "Die vorherige Entscheidungsfassung wurde nicht gefunden.",
          );
        }
        superseded = await repositories.decisions.replace(
          supersedeDecision(predecessor),
          predecessor.revision,
        );
      }

      const confirmed = await repositories.decisions.replace(
        confirmDecisionProposal(current, {
          actor: confirmation.actor,
          explicitlyConfirmed: true,
          confirmedAt,
        }),
        expectedRevision,
      );
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: confirmed.type,
            entityId: confirmed.id,
            entityRevision: confirmed.revision,
            action: "update",
            summary: "Entscheidungsvorschlag von Sir bestätigt.",
          },
          { timestamp: confirmedAt },
        ),
      );
      if (superseded) {
        await repositories.auditEntries.create(
          createAuditEntry(
            {
              entityType: superseded.type,
              entityId: superseded.id,
              entityRevision: superseded.revision,
              action: "update",
              summary: "Vorherige Entscheidungsfassung nachvollziehbar ersetzt.",
            },
            { timestamp: confirmedAt },
          ),
        );
      }
      return confirmed;
    });
  }

  async rejectMemoryFact(
    id: string,
    expectedRevision: number,
    rejection: ExplicitSirRejection,
  ): Promise<MemoryFact> {
    this.requireExplicitRejection(rejection);
    await this.initialize();
    const rejectedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.memoryFacts.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Der Gedächtnisfakt wurde nicht gefunden.");
      }
      assertPendingMemoryProposal(current);

      const rejected = await repositories.memoryFacts.softDelete(id, expectedRevision);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: rejected.type,
            entityId: rejected.id,
            entityRevision: rejected.revision,
            action: "delete",
            summary: "Gedächtnisvorschlag von Sir abgelehnt.",
          },
          { timestamp: rejectedAt },
        ),
      );
      return rejected;
    });
  }

  async rejectDecision(
    id: string,
    expectedRevision: number,
    rejection: ExplicitSirRejection,
  ): Promise<Decision> {
    this.requireExplicitRejection(rejection);
    await this.initialize();
    const rejectedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.decisions.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Entscheidung wurde nicht gefunden.");
      }
      assertPendingMemoryProposal(current);

      const rejected = await repositories.decisions.softDelete(id, expectedRevision);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: rejected.type,
            entityId: rejected.id,
            entityRevision: rejected.revision,
            action: "delete",
            summary: "Entscheidungsvorschlag von Sir abgelehnt.",
          },
          { timestamp: rejectedAt },
        ),
      );
      return rejected;
    });
  }

  async discardMemoryFact(
    id: string,
    expectedRevision: number,
    discard: ExplicitSirDiscard,
  ): Promise<MemoryFact> {
    this.requireExplicitDiscard(discard);
    await this.initialize();
    const discardedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.memoryFacts.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Der Gedächtnisfakt wurde nicht gefunden.");
      }
      assertActiveConfirmedMemoryRecord(current);

      const discarded = await repositories.memoryFacts.softDelete(id, expectedRevision);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: discarded.type,
            entityId: discarded.id,
            entityRevision: discarded.revision,
            action: "delete",
            summary: "Bestätigter Gedächtnisfakt von Sir verworfen.",
          },
          { timestamp: discardedAt },
        ),
      );
      return discarded;
    });
  }

  async discardDecision(
    id: string,
    expectedRevision: number,
    discard: ExplicitSirDiscard,
  ): Promise<Decision> {
    this.requireExplicitDiscard(discard);
    await this.initialize();
    const discardedAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.decisions.getById(id);
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Entscheidung wurde nicht gefunden.");
      }

      const revoked = await repositories.decisions.replace(
        revokeDecision(current),
        expectedRevision,
      );
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: revoked.type,
            entityId: revoked.id,
            entityRevision: revoked.revision,
            action: "update",
            summary: "Bestätigte Entscheidung von Sir verworfen.",
          },
          { timestamp: discardedAt },
        ),
      );
      return revoked;
    });
  }

  async restoreMemoryFact(
    id: string,
    expectedRevision: number,
    restore: ExplicitSirRestore,
  ): Promise<MemoryFact> {
    this.requireExplicitRestore(restore);
    await this.initialize();
    const restoredAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.memoryFacts.getById(id, { includeDeleted: true });
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Der Gedächtnisfakt wurde nicht gefunden.");
      }
      if (current.status !== "deleted" || current.deletedAt === null) {
        throw new RepositoryError(
          "INVALID_STATE_TRANSITION",
          "Nur ein gelöschter Gedächtnisfakt kann wiederhergestellt werden.",
        );
      }
      const restored = await repositories.memoryFacts.restore(id, expectedRevision);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: restored.type,
            entityId: restored.id,
            entityRevision: restored.revision,
            action: "restore",
            summary: "Gedächtnisfakt von Sir als neuer Vorschlag wiederhergestellt.",
          },
          { timestamp: restoredAt },
        ),
      );
      return restored;
    });
  }

  async restoreDecision(
    id: string,
    expectedRevision: number,
    restore: ExplicitSirRestore,
  ): Promise<Decision> {
    this.requireExplicitRestore(restore);
    await this.initialize();
    const restoredAt = this.now();

    return this.storage.transaction(async (repositories) => {
      const current = await repositories.decisions.getById(id, { includeDeleted: true });
      if (!current) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Die Entscheidung wurde nicht gefunden.");
      }
      if (current.status !== "deleted" || current.deletedAt === null) {
        throw new RepositoryError(
          "INVALID_STATE_TRANSITION",
          "Nur eine gelöschte Entscheidung kann wiederhergestellt werden.",
        );
      }
      const restored = await repositories.decisions.restore(id, expectedRevision);
      await repositories.auditEntries.create(
        createAuditEntry(
          {
            entityType: restored.type,
            entityId: restored.id,
            entityRevision: restored.revision,
            action: "restore",
            summary: "Entscheidung von Sir als neuer Vorschlag wiederhergestellt.",
          },
          { timestamp: restoredAt },
        ),
      );
      return restored;
    });
  }

  async getMemoryFactHistory(id: string): Promise<MemoryHistory<MemoryFact>> {
    await this.initialize();
    return this.buildHistory(
      id,
      await this.storage.memoryFacts.list({ includeDeleted: true }),
      "Der Gedächtnisfakt wurde nicht gefunden.",
    );
  }

  async getDecisionHistory(id: string): Promise<MemoryHistory<Decision>> {
    await this.initialize();
    return this.buildHistory(
      id,
      await this.storage.decisions.list({ includeDeleted: true }),
      "Die Entscheidung wurde nicht gefunden.",
    );
  }

  async searchMemory(filters: MemorySearchFilters = {}): Promise<MemorySearchHit[]> {
    await this.initialize();
    const [facts, decisions, areas, sources] = await Promise.all([
      this.storage.memoryFacts.list({ includeDeleted: true }),
      this.storage.decisions.list({ includeDeleted: true }),
      this.storage.areas.list({ includeDeleted: true }),
      this.storage.sources.list({ includeDeleted: true }),
    ]);
    const areaNames = new Map(areas.map((area) => [area.id, area.name]));
    const sourcesById = new Map(sources.map((source) => [source.id, source]));
    const queryTokens = this.normalizeSearchText(filters.query ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const validAt = filters.validAt ?? this.now();

    return [
      ...facts.map((record) => ({ recordType: "fact" as const, record })),
      ...decisions.map((record) => ({ recordType: "decision" as const, record })),
    ]
      .filter(({ record }) => filters.includeDeleted === true || record.deletedAt === null)
      .filter(({ recordType }) => !filters.recordTypes || filters.recordTypes.includes(recordType))
      .filter(({ record }) => !filters.areaId || record.areaId === filters.areaId)
      .filter(({ record }) => !filters.statuses || filters.statuses.includes(record.status))
      .filter(
        ({ record }) =>
          !filters.sourceIds ||
          filters.sourceIds.every((sourceId) => record.sourceIds.includes(sourceId)),
      )
      .filter(({ record }) => !filters.updatedAfter || record.updatedAt >= filters.updatedAfter)
      .filter(({ record }) => !filters.updatedBefore || record.updatedAt <= filters.updatedBefore)
      .map(({ recordType, record }): MemorySearchHit => {
        const linkedSources = record.sourceIds
          .map((sourceId) => sourcesById.get(sourceId))
          .filter((source): source is Source => source !== undefined);
        return {
          recordType,
          record,
          areaName: areaNames.get(record.areaId) ?? "Unbekannter Bereich",
          sources: linkedSources,
          validity: this.memoryValidity(record, validAt),
        };
      })
      .filter((hit) => !filters.validity || hit.validity === filters.validity)
      .filter((hit) => {
        if (queryTokens.length === 0) return true;
        const recordText =
          hit.record.type === "memory-fact"
            ? [
                hit.record.knowledgeType,
                hit.record.subject,
                hit.record.predicate,
                hit.record.value,
                hit.record.displayText,
                hit.record.conflictKey,
              ]
            : [hit.record.title, hit.record.decisionText, hit.record.rationale];
        const searchText = this.normalizeSearchText(
          [...recordText, hit.areaName, ...hit.sources.map((source) => source.label)].join(" "),
        );
        return queryTokens.every((token) => searchText.includes(token));
      })
      .toSorted(
        (left, right) =>
          right.record.updatedAt.localeCompare(left.record.updatedAt) ||
          left.record.id.localeCompare(right.record.id),
      );
  }

  private async requireReferences(
    areaId: string,
    sourceIds: string[],
    repositories: RhiaBrowserStorage,
  ): Promise<void> {
    const [area, sources] = await Promise.all([
      repositories.areas.getById(areaId),
      Promise.all(sourceIds.map((sourceId) => repositories.sources.getById(sourceId))),
    ]);

    if (!area) {
      throw new RepositoryError("RECORD_NOT_FOUND", "Der Gedächtnisbereich wurde nicht gefunden.");
    }
    if (sources.some((source) => !source)) {
      throw new RepositoryError("RECORD_NOT_FOUND", "Mindestens eine Gedächtnisquelle fehlt.");
    }
  }

  private async ensureMemoryReferences(): Promise<{ areas: Area[]; sources: Source[] }> {
    await this.initialize();
    let [areas, sources] = await Promise.all([
      this.storage.areas.list(),
      this.storage.sources.list(),
    ]);
    if (areas.length > 0 && sources.length > 0) {
      return { areas, sources };
    }

    await this.storage.transaction(async (repositories) => {
      const [currentAreas, currentSources] = await Promise.all([
        repositories.areas.list(),
        repositories.sources.list(),
      ]);
      if (currentAreas.length === 0) {
        await repositories.areas.create(
          createArea({ name: "Allgemein", description: "Lokales RHIA-Gedächtnis" }),
        );
      }
      if (currentSources.length === 0) {
        await repositories.sources.create(
          createSource({ kind: "manual", label: "Direkte Eingabe durch Sir" }),
        );
      }
    });
    [areas, sources] = await Promise.all([this.storage.areas.list(), this.storage.sources.list()]);
    return { areas, sources };
  }

  private memoryValidity(
    record: Pick<MemoryFact | Decision, "validFrom" | "validUntil">,
    validAt: string,
  ): MemoryValidity {
    if (record.validFrom !== null && record.validFrom > validAt) {
      return "future";
    }
    if (record.validUntil !== null && record.validUntil < validAt) {
      return "expired";
    }
    return "current";
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9._:/-]+/g, " ")
      .trim();
  }

  private requireExpectedRevision(actualRevision: number, expectedRevision: number): void {
    if (actualRevision !== expectedRevision) {
      throw new RepositoryError(
        "REVISION_CONFLICT",
        `Revision ${expectedRevision} ist veraltet; aktuell ist Revision ${actualRevision}.`,
      );
    }
  }

  private requireOpenConflict(conflict: MemoryConflict, expectedRevision: number): void {
    this.requireExpectedRevision(conflict.revision, expectedRevision);
    if (conflict.status !== "open" || conflict.deletedAt !== null) {
      throw new RepositoryError(
        "INVALID_STATE_TRANSITION",
        "Nur ein offener Gedächtniskonflikt kann aufgelöst werden.",
      );
    }
  }

  private requireNoOpenSuccessor(
    predecessorId: string,
    records: Array<MemoryFact | Decision>,
  ): void {
    const existingSuccessor = records.find(
      (record) => record.supersedesId === predecessorId && record.deletedAt === null,
    );
    if (existingSuccessor) {
      throw new RepositoryError(
        "INVALID_STATE_TRANSITION",
        "Für diese Fassung existiert bereits ein offener oder aktiver Korrekturstand.",
      );
    }
  }

  private buildHistory<TEntity extends MemoryFact | Decision>(
    requestedId: string,
    records: TEntity[],
    notFoundMessage: string,
  ): MemoryHistory<TEntity> {
    const byId = new Map(records.map((record) => [record.id, record]));
    if (!byId.has(requestedId)) {
      throw new RepositoryError("RECORD_NOT_FOUND", notFoundMessage);
    }

    const connectedIds = new Set<string>();
    const pending = [requestedId];
    while (pending.length > 0) {
      const currentId = pending.pop();
      if (!currentId || connectedIds.has(currentId)) {
        continue;
      }
      connectedIds.add(currentId);
      const current = byId.get(currentId);
      if (current?.supersedesId && byId.has(current.supersedesId)) {
        pending.push(current.supersedesId);
      }
      for (const candidate of records) {
        if (candidate.supersedesId === currentId) {
          pending.push(candidate.id);
        }
      }
    }

    const versions = records
      .filter((record) => connectedIds.has(record.id))
      .toSorted(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
      );
    const activeVersions = versions.filter(
      (record) => record.status === "confirmed" && record.deletedAt === null,
    );
    if (activeVersions.length > 1) {
      throw new RepositoryError(
        "INVALID_STATE_TRANSITION",
        "Die Gedächtnishistorie enthält mehr als eine aktive bestätigte Fassung.",
      );
    }

    return {
      requestedId,
      activeVersion: activeVersions[0] ?? null,
      versions,
    };
  }

  private requireExplicitConfirmation(confirmation: ExplicitSirConfirmation): void {
    if (confirmation.actor !== "sir" || confirmation.explicitlyConfirmed !== true) {
      throw new RepositoryError(
        "CONFIRMATION_REQUIRED",
        "Gedächtniswissen wird erst nach ausdrücklicher Bestätigung durch Sir aktiviert.",
      );
    }
  }

  private requireExplicitRejection(rejection: ExplicitSirRejection): void {
    if (rejection.actor !== "sir" || rejection.explicitlyRejected !== true) {
      throw new RepositoryError(
        "CONFIRMATION_REQUIRED",
        "Das Ablehnen eines Gedächtnisvorschlags muss Sir ausdrücklich bestätigen.",
      );
    }
  }

  private requireExplicitDiscard(discard: ExplicitSirDiscard): void {
    if (discard.actor !== "sir" || discard.explicitlyDiscarded !== true) {
      throw new RepositoryError(
        "CONFIRMATION_REQUIRED",
        "Das Verwerfen bestätigten Gedächtniswissens muss Sir ausdrücklich bestätigen.",
      );
    }
  }

  private requireExplicitConflictResolution(resolution: ExplicitSirConflictResolution): void {
    if (resolution.actor !== "sir" || resolution.explicitlyResolved !== true) {
      throw new RepositoryError(
        "CONFIRMATION_REQUIRED",
        "Die Konfliktauflösung muss Sir ausdrücklich bestätigen.",
      );
    }
  }

  private requireExplicitRestore(restore: ExplicitSirRestore): void {
    if (restore.actor !== "sir" || restore.explicitlyRestored !== true) {
      throw new RepositoryError(
        "CONFIRMATION_REQUIRED",
        "Die Wiederherstellung muss Sir ausdrücklich bestätigen.",
      );
    }
  }
}

export const localMemoryService = new LocalMemoryService();
