import type { KuizDatabase } from "../db/db";
import { exportAllTables } from "../db/db";
import type { BackupPayload } from "../db/schema";

export async function exportBackup(database: KuizDatabase): Promise<BackupPayload> {
  return exportAllTables(database);
}

export async function restoreBackup(database: KuizDatabase, backup: BackupPayload): Promise<void> {
  if (backup.schema !== "kuiz-backup@1" && backup.schema !== "ace-backup@1") {
    throw new Error("Unsupported backup schema.");
  }

  await database.transaction(
    "rw",
    [
      database.packs,
      database.entries,
      database.exercises,
      database.distractorGroups,
      database.reviewState,
      database.settings,
      database.importLog,
    ],
    async () => {
      await Promise.all([
        database.packs.clear(),
        database.entries.clear(),
        database.exercises.clear(),
        database.distractorGroups.clear(),
        database.reviewState.clear(),
        database.settings.clear(),
        database.importLog.clear(),
      ]);

      await Promise.all([
        database.packs.bulkPut(backup.packs),
        database.entries.bulkPut(backup.entries),
        database.exercises.bulkPut(backup.exercises),
        database.distractorGroups.bulkPut(backup.distractorGroups),
        database.reviewState.bulkPut(backup.reviewState),
        database.settings.bulkPut(backup.settings),
        database.importLog.bulkPut(backup.importLog),
      ]);
    },
  );
}
