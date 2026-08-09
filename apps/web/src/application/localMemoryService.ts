import {
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
    input: CreateMemoryFactInput,
    context: MemoryProposalContext,
  ): Promise<MemoryFact> {
    await this.initialize();
    const proposedAt = this.now();
    const fact = createMemoryFact(input, {
      originDeviceId: context.originDeviceId,
      timestamp: proposedAt,
    });

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
    input: CreateDecisionInput,
    context: MemoryProposalContext,
  ): Promise<Decision> {
    await this.initialize();
    const proposedAt = this.now();
    const decision = createDecision(input, {
      originDeviceId: context.originDeviceId,
      timestamp: proposedAt,
    });

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
}
