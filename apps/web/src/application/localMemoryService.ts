import {
  assertActiveConfirmedMemoryRecord,
  assertPendingMemoryProposal,
  confirmDecisionProposal,
  confirmMemoryFactProposal,
  createAuditEntry,
  createDecision,
  createMemoryFact,
  type CreateDecisionInput,
  type CreateMemoryFactInput,
  type Decision,
  type MemoryFact,
  RepositoryError,
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

export type NewMemoryFactInput = Omit<CreateMemoryFactInput, "supersedesId">;
export type NewDecisionInput = Omit<CreateDecisionInput, "supersedesId">;

export interface MemoryHistory<TEntity extends MemoryFact | Decision> {
  requestedId: string;
  activeVersion: TEntity | null;
  versions: TEntity[];
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

      const confirmed = await repositories.memoryFacts.replace(
        confirmMemoryFactProposal(current, {
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
            summary: "Gedächtnisvorschlag von Sir bestätigt.",
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

  private requireExpectedRevision(actualRevision: number, expectedRevision: number): void {
    if (actualRevision !== expectedRevision) {
      throw new RepositoryError(
        "REVISION_CONFLICT",
        `Revision ${expectedRevision} ist veraltet; aktuell ist Revision ${actualRevision}.`,
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
}
