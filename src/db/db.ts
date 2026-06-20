import Dexie, { type Table } from "dexie";
import type {
  BackupPayload,
  DistractorGroupRecord,
  EntryRecord,
  ExerciseRecord,
  ImportLogRecord,
  PackRecord,
  SettingRecord,
  SnapshotRecord,
  UserSettings,
} from "./schema";
import { defaultSettings } from "./schema";
import type { ReviewState } from "../engine/scheduler";

export class KuizDatabase extends Dexie {
  packs!: Table<PackRecord, string>;
  entries!: Table<EntryRecord, string>;
  exercises!: Table<ExerciseRecord, string>;
  distractorGroups!: Table<DistractorGroupRecord, string>;
  reviewState!: Table<ReviewState, string>;
  settings!: Table<SettingRecord, string>;
  snapshots!: Table<SnapshotRecord, string>;
  importLog!: Table<ImportLogRecord, string>;

  constructor() {
    super("kuiz");
    this.version(1).stores({
      packs: "packId, version, importedAt",
      entries: "id, dedupeKey, kind, packId, *tags",
      exercises: "id, dedupeKey, type, packId, dueAt, *tags",
      distractorGroups: "id, kind, packId",
      reviewState: "cardId, dueAt, lastGrade",
      settings: "key, updatedAt",
      snapshots: "id, createdAt",
      importLog: "id, packId, importedAt",
    });
  }
}

export const db = new KuizDatabase();

export async function getSettings(database = db): Promise<UserSettings> {
  const record = await database.settings.get("user");
  return { ...defaultSettings, ...(record?.value as Partial<UserSettings> | undefined) };
}

export async function saveSettings(patch: Partial<UserSettings>, database = db): Promise<UserSettings> {
  const current = await getSettings(database);
  const next = { ...current, ...patch };
  await database.settings.put({
    key: "user",
    value: next,
    updatedAt: new Date().toISOString(),
  });
  return next;
}

export async function exportAllTables(database = db): Promise<BackupPayload> {
  const [packs, entries, exercises, distractorGroups, reviewState, settings, importLog] = await Promise.all([
    database.packs.toArray(),
    database.entries.toArray(),
    database.exercises.toArray(),
    database.distractorGroups.toArray(),
    database.reviewState.toArray(),
    database.settings.toArray(),
    database.importLog.toArray(),
  ]);

  return {
    schema: "kuiz-backup@1",
    exportedAt: new Date().toISOString(),
    packs,
    entries,
    exercises,
    distractorGroups,
    reviewState,
    settings,
    importLog,
  };
}
