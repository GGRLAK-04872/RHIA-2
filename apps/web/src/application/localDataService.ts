import { createArea, createAuditEntry, createNote, createSource, type Note } from "@rhia/domain";
import {
  DELETE_ALL_CONFIRMATION,
  createRhiaBrowserStorage,
  type ImportPreview,
  type RhiaBrowserStorage,
} from "@rhia/storage-browser";

export { DELETE_ALL_CONFIRMATION };

export interface LocalNoteView {
  note: Note;
  areaName: string;
}

export interface LocalDataSnapshot {
  activeNotes: LocalNoteView[];
  deletedNotes: LocalNoteView[];
  counts: {
    areas: number;
    sources: number;
    notes: number;
    auditEntries: number;
  };
}

export interface NewLocalNote {
  areaName: string;
  title: string;
  body: string;
}

export interface BackupDownload {
  content: string;
  filename: string;
}

export class LocalDataService {
  private readonly storage: RhiaBrowserStorage;
  private opened = false;

  constructor(storage: RhiaBrowserStorage = createRhiaBrowserStorage()) {
    this.storage = storage;
  }

  async initialize(): Promise<LocalDataSnapshot> {
    if (!this.opened) {
      await this.storage.open();
      this.opened = true;
    }
    await this.storage.purgeExpiredTrash();
    return this.getSnapshot();
  }

  async getSnapshot(): Promise<LocalDataSnapshot> {
    const [areas, sources, notes, auditEntries] = await Promise.all([
      this.storage.areas.list({ includeDeleted: true }),
      this.storage.sources.list({ includeDeleted: true }),
      this.storage.notes.list({ includeDeleted: true }),
      this.storage.auditEntries.list({ includeDeleted: true }),
    ]);
    const areaNames = new Map(areas.map((area) => [area.id, area.name]));
    const noteViews = notes.map((note) => ({
      note,
      areaName: areaNames.get(note.areaId) ?? "Unbekannter Bereich",
    }));

    return {
      activeNotes: noteViews.filter(({ note }) => note.deletedAt === null),
      deletedNotes: noteViews.filter(({ note }) => note.deletedAt !== null),
      counts: {
        areas: areas.length,
        sources: sources.length,
        notes: notes.length,
        auditEntries: auditEntries.length,
      },
    };
  }

  async createNote(input: NewLocalNote): Promise<LocalDataSnapshot> {
    const area = createArea({ name: input.areaName });
    const source = createSource({ kind: "manual", label: "Direkte Eingabe in RHIA" });
    const note = createNote({
      areaId: area.id,
      sourceId: source.id,
      title: input.title,
      body: input.body,
    });
    const auditEntries = [area, source, note].map((entity) =>
      createAuditEntry({
        entityType: entity.type,
        entityId: entity.id,
        entityRevision: entity.revision,
        action: "create",
      }),
    );

    await this.storage.transaction(async (repositories) => {
      await repositories.areas.create(area);
      await repositories.sources.create(source);
      await repositories.notes.create(note);
      for (const auditEntry of auditEntries) {
        await repositories.auditEntries.create(auditEntry);
      }
    });

    return this.getSnapshot();
  }

  async moveNoteToTrash(noteId: string, revision: number): Promise<LocalDataSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const deleted = await repositories.notes.softDelete(noteId, revision);
      await repositories.auditEntries.create(
        createAuditEntry({
          entityType: deleted.type,
          entityId: deleted.id,
          entityRevision: deleted.revision,
          action: "delete",
        }),
      );
    });
    return this.getSnapshot();
  }

  async restoreNote(noteId: string, revision: number): Promise<LocalDataSnapshot> {
    await this.storage.transaction(async (repositories) => {
      const restored = await repositories.notes.restore(noteId, revision);
      await repositories.auditEntries.create(
        createAuditEntry({
          entityType: restored.type,
          entityId: restored.id,
          entityRevision: restored.revision,
          action: "restore",
        }),
      );
    });
    return this.getSnapshot();
  }

  async createBackupDownload(): Promise<BackupDownload> {
    const backup = await this.storage.createBackup();
    const compactDate = backup.manifest.createdAt.slice(0, 10);
    return {
      content: this.storage.serializeBackup(backup),
      filename: `rhia-backup-${compactDate}.json`,
    };
  }

  previewImport(content: string): Promise<ImportPreview> {
    return this.storage.previewImport(content);
  }

  async importBackup(preview: ImportPreview): Promise<LocalDataSnapshot> {
    await this.storage.importBackup(preview, "abort");
    return this.getSnapshot();
  }

  async clearAllData(confirmation: string): Promise<LocalDataSnapshot> {
    await this.storage.clearAllData(confirmation);
    return this.getSnapshot();
  }
}

export const localDataService = new LocalDataService();
