import {
  type Area,
  type AuditEntry,
  type AvailabilityWindow,
  type Briefing,
  createArea,
  createAuditEntry,
  createEveningReview,
  createPlanningFeedback,
  createPlanningProposal,
  getMissingWorkHubAreaNames,
  type PlanningFeedback,
  type PlanningFeedbackReason,
  type PlanningFeedbackResult,
  type PlanningWorkspace,
  RepositoryError,
  type WorkBlock,
} from "@rhia/domain";
import { createRhiaBrowserStorage, type RhiaBrowserStorage } from "@rhia/storage-browser";

export interface PlanningTrash {
  briefings: Briefing[];
  workBlocks: WorkBlock[];
  feedback: PlanningFeedback[];
}

export interface LocalPlanningSnapshot {
  workspace: PlanningWorkspace;
  briefings: Briefing[];
  workBlocks: WorkBlock[];
  feedback: PlanningFeedback[];
  trash: PlanningTrash;
}

export interface GeneratePlanInput {
  kind: "morning" | "week";
  periodStart: string;
  periodEnd: string;
  availability: AvailabilityWindow[];
  generatedAt?: string;
}

export interface RecordPlanningFeedbackInput {
  workBlockId: string;
  result: PlanningFeedbackResult;
  reason: PlanningFeedbackReason;
  actualMinutes?: number | null;
  note?: string | null;
  recordedAt?: string;
}

export class LocalPlanningService {
  private readonly storage: RhiaBrowserStorage;
  private opened = false;

  constructor(storage: RhiaBrowserStorage = createRhiaBrowserStorage()) {
    this.storage = storage;
  }

  async initialize(): Promise<LocalPlanningSnapshot> {
    if (!this.opened) {
      await this.storage.open();
      this.opened = true;
    }
    await this.storage.purgeExpiredTrash();
    await this.ensureRequiredAreas();
    return this.getSnapshot();
  }

  async getSnapshot(): Promise<LocalPlanningSnapshot> {
    const [areas, tasks, dependencies, workBlocks, briefings, feedback] = await Promise.all([
      this.storage.areas.list({ includeDeleted: true }),
      this.storage.tasks.list({ includeDeleted: true }),
      this.storage.taskDependencies.list({ includeDeleted: true }),
      this.storage.workBlocks.list({ includeDeleted: true }),
      this.storage.briefings.list({ includeDeleted: true }),
      this.storage.planningFeedback.list({ includeDeleted: true }),
    ]);
    const activeWorkBlocks = workBlocks.filter((block) => block.deletedAt === null);
    const activeFeedback = feedback.filter((entry) => entry.deletedAt === null);

    return {
      workspace: {
        areas: areas.filter((area) => area.deletedAt === null),
        tasks: tasks.filter((task) => task.deletedAt === null),
        dependencies: dependencies.filter((dependency) => dependency.deletedAt === null),
        workBlocks: activeWorkBlocks,
        feedback: activeFeedback,
      },
      briefings: briefings.filter((briefing) => briefing.deletedAt === null),
      workBlocks: activeWorkBlocks,
      feedback: activeFeedback,
      trash: {
        briefings: briefings.filter((briefing) => briefing.deletedAt !== null),
        workBlocks: workBlocks.filter((block) => block.deletedAt !== null),
        feedback: feedback.filter((entry) => entry.deletedAt !== null),
      },
    };
  }

  async generatePlan(input: GeneratePlanInput): Promise<LocalPlanningSnapshot> {
    const snapshot = await this.getSnapshot();
    const generatedAt = input.generatedAt ?? new Date().toISOString();
    const proposal = createPlanningProposal(
      {
        kind: input.kind,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        availability: input.availability,
        generatedAt,
      },
      snapshot.workspace,
    );
    const briefing = proposal.warnings.length
      ? {
          ...proposal.briefing,
          explanation: `${proposal.briefing.explanation} Hinweise: ${proposal.warnings.join(" ")}`,
        }
      : proposal.briefing;

    await this.storage.transaction(async (repositories) => {
      await repositories.briefings.create(briefing);
      await repositories.auditEntries.create(this.audit(briefing, "create"));
      for (const block of proposal.workBlocks) {
        await repositories.workBlocks.create(block);
        await repositories.auditEntries.create(this.audit(block, "create"));
      }
    });
    return this.getSnapshot();
  }

  async createEveningReview(
    periodStart: string,
    periodEnd: string,
    generatedAt = new Date().toISOString(),
  ): Promise<LocalPlanningSnapshot> {
    const snapshot = await this.getSnapshot();
    const briefing = createEveningReview({
      periodStart,
      periodEnd,
      generatedAt,
      workBlocks: snapshot.workBlocks,
      feedback: snapshot.feedback,
    });
    await this.storage.transaction(async (repositories) => {
      await repositories.briefings.create(briefing);
      await repositories.auditEntries.create(this.audit(briefing, "create"));
    });
    return this.getSnapshot();
  }

  async recordFeedback(input: RecordPlanningFeedbackInput): Promise<LocalPlanningSnapshot> {
    const recordedAt = input.recordedAt ?? new Date().toISOString();
    await this.storage.transaction(async (repositories) => {
      const block = await repositories.workBlocks.getById(input.workBlockId);
      if (!block) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Der Arbeitsblock wurde nicht gefunden.");
      }
      const briefing = await repositories.briefings.getById(block.briefingId);
      if (!briefing) {
        throw new RepositoryError("RECORD_NOT_FOUND", "Das zugehörige Briefing fehlt.");
      }
      const feedback = createPlanningFeedback({
        briefingId: briefing.id,
        workBlockId: block.id,
        taskId: block.taskId,
        result: input.result,
        reason: input.reason,
        actualMinutes: input.actualMinutes ?? null,
        note: input.note ?? null,
        recordedBy: "sir",
        recordedAt,
      });
      const updatedBlock = await repositories.workBlocks.replace(
        { ...block, status: input.result },
        block.revision,
      );
      await repositories.planningFeedback.create(feedback);
      await repositories.auditEntries.create(this.audit(updatedBlock, "update"));
      await repositories.auditEntries.create(this.audit(feedback, "create"));
    });
    return this.getSnapshot();
  }

  async moveBriefingToTrash(
    briefingId: string,
    expectedRevision: number,
  ): Promise<LocalPlanningSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const deleted = await repositories.briefings.softDelete(briefingId, expectedRevision);
      await repositories.auditEntries.create(this.audit(deleted, "delete"));
      const blocks = (await repositories.workBlocks.list()).filter(
        (block) => block.briefingId === briefingId,
      );
      for (const block of blocks) {
        const deletedBlock = await repositories.workBlocks.softDelete(block.id, block.revision);
        await repositories.auditEntries.create(this.audit(deletedBlock, "delete"));
        const feedbackEntries = (await repositories.planningFeedback.list()).filter(
          (entry) => entry.workBlockId === block.id,
        );
        for (const entry of feedbackEntries) {
          const deletedFeedback = await repositories.planningFeedback.softDelete(
            entry.id,
            entry.revision,
          );
          await repositories.auditEntries.create(this.audit(deletedFeedback, "delete"));
        }
      }
    });
    return this.getSnapshot();
  }

  async restoreBriefing(
    briefingId: string,
    expectedRevision: number,
  ): Promise<LocalPlanningSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const restored = await repositories.briefings.restore(briefingId, expectedRevision);
      await repositories.auditEntries.create(this.audit(restored, "restore"));
      const blocks = (await repositories.workBlocks.list({ includeDeleted: true })).filter(
        (block) => block.briefingId === briefingId && block.deletedAt !== null,
      );
      for (const block of blocks) {
        const restoredBlock = await repositories.workBlocks.restore(block.id, block.revision);
        await repositories.auditEntries.create(this.audit(restoredBlock, "restore"));
        const feedbackEntries = (
          await repositories.planningFeedback.list({ includeDeleted: true })
        ).filter((entry) => entry.workBlockId === block.id && entry.deletedAt !== null);
        for (const entry of feedbackEntries) {
          const restoredFeedback = await repositories.planningFeedback.restore(
            entry.id,
            entry.revision,
          );
          await repositories.auditEntries.create(this.audit(restoredFeedback, "restore"));
        }
      }
    });
    return this.getSnapshot();
  }

  private async ensureRequiredAreas(): Promise<void> {
    await this.storage.transaction(async (repositories) => {
      const areas = await repositories.areas.list();
      for (const name of getMissingWorkHubAreaNames(areas)) {
        const area = createArea({
          name,
          description: "Verbindlicher Bereich der lokalen RHIA-Arbeitszentrale.",
        });
        await repositories.areas.create(area);
        await repositories.auditEntries.create(this.audit(area, "create"));
      }
    });
  }

  private audit(
    entity: Area | Briefing | WorkBlock | PlanningFeedback,
    action: "create" | "update" | "delete" | "restore",
  ): AuditEntry {
    return createAuditEntry({
      entityType: entity.type,
      entityId: entity.id,
      entityRevision: entity.revision,
      action,
      summary: "Lokale Planung und Briefings.",
    });
  }
}

export const localPlanningService = new LocalPlanningService();
