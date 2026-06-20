import type { KuizDatabase } from "../db/db";
import type { EntryRecord, ExerciseRecord, PackRecord } from "../db/schema";
import { exportAllTables } from "../db/db";
import { fallbackFingerprint, simpleHash } from "../engine/normalize";
import { initialReviewState } from "../engine/scheduler";
import type { ContentPack, Entry, Exercise } from "../schemas/contentPack";

export type ImportPreview = {
  packId: string;
  title: string;
  creates: string[];
  updates: string[];
  skips: string[];
  conflicts: string[];
};

export function packEntries(pack: ContentPack): Entry[] {
  return [...pack.vocab, ...pack.particles, ...pack.grammar];
}

export function dedupeIdentity(item: Pick<Entry | Exercise, "dedupeKey"> | Partial<Entry>): string {
  return "dedupeKey" in item && item.dedupeKey ? item.dedupeKey : fallbackFingerprint(item as Partial<Entry>);
}

function entrySearchText(entry: Entry): string {
  if (entry.kind === "vocab") return `${entry.ko} ${entry.en} ${entry.tags.join(" ")}`;
  if (entry.kind === "particle") return `${entry.form} ${entry.meaning} ${entry.usage} ${entry.tags.join(" ")}`;
  return `${entry.title} ${entry.pattern} ${entry.meaning} ${entry.tags.join(" ")}`;
}

function exerciseSearchText(exercise: Exercise): string {
  const model =
    "modelAnswer" in exercise
      ? exercise.modelAnswer
      : "corrected" in exercise
        ? exercise.corrected
        : exercise.type === "mcq"
          ? exercise.choices.find((choice) => choice.isCorrect)?.text ?? ""
          : "";
  return `${exercise.prompt.stem} ${exercise.prompt.stemKo ?? ""} ${model} ${exercise.tags.join(" ")}`;
}

function toEntryRecord(packId: string, entry: Entry): EntryRecord {
  return {
    ...entry,
    packId,
    searchText: entrySearchText(entry),
  };
}

function toExerciseRecord(packId: string, exercise: Exercise): ExerciseRecord {
  return {
    ...exercise,
    packId,
    searchText: exerciseSearchText(exercise),
  };
}

function toPackRecord(pack: ContentPack): PackRecord {
  return {
    packId: pack.pack.packId,
    version: pack.pack.version,
    title: pack.pack.title,
    locale: pack.pack.locale,
    createdAt: pack.pack.createdAt,
    importedAt: new Date().toISOString(),
    hash: simpleHash(pack),
    includes: pack.pack.includes,
    sourceRefs: pack.sourceRefs,
  };
}

export async function previewContentPack(
  database: KuizDatabase,
  pack: ContentPack,
): Promise<ImportPreview> {
  const incomingEntries = packEntries(pack);
  const incomingExercises = pack.exercises;
  const [existingEntries, existingExercises] = await Promise.all([
    database.entries.toArray(),
    database.exercises.toArray(),
  ]);

  const existingByKey = new Map<string, { id: string; kind: string }>();
  for (const entry of existingEntries) {
    existingByKey.set(dedupeIdentity(entry), { id: entry.id, kind: entry.kind });
  }
  for (const exercise of existingExercises) {
    existingByKey.set(dedupeIdentity(exercise), { id: exercise.id, kind: exercise.type });
  }

  const preview: ImportPreview = {
    packId: pack.pack.packId,
    title: pack.pack.title,
    creates: [],
    updates: [],
    skips: [],
    conflicts: [],
  };

  for (const item of [...incomingEntries, ...incomingExercises]) {
    const key = dedupeIdentity(item);
    const existing = existingByKey.get(key);
    if (!existing) {
      preview.creates.push(key);
      continue;
    }

    const kind = "kind" in item ? item.kind : item.type;
    if (existing.kind !== kind) {
      preview.conflicts.push(key);
    } else {
      preview.skips.push(key);
    }
  }

  return preview;
}

export async function mergeContentPack(
  database: KuizDatabase,
  pack: ContentPack,
  preview?: ImportPreview,
): Promise<ImportPreview> {
  const resolvedPreview = preview ?? (await previewContentPack(database, pack));
  if (resolvedPreview.conflicts.length > 0) {
    throw new Error("Import has conflicts and was not merged.");
  }

  const createKeys = new Set(resolvedPreview.creates);
  const packId = pack.pack.packId;
  const now = new Date().toISOString();

  const snapshot = await exportAllTables(database);

  await database.transaction(
    "rw",
    [
      database.packs,
      database.entries,
      database.exercises,
      database.distractorGroups,
      database.reviewState,
      database.snapshots,
      database.importLog,
    ],
    async () => {
      await database.snapshots.put({
        id: `pre-import-${packId}-${Date.now()}`,
        createdAt: now,
        reason: `Before importing ${packId}`,
        data: snapshot,
      });

      await database.packs.put(toPackRecord(pack));
      await database.distractorGroups.bulkPut(
        pack.distractorGroups.map((group) => ({
          ...group,
          packId,
        })),
      );

      const entryRecords = packEntries(pack)
        .filter((entry) => createKeys.has(dedupeIdentity(entry)))
        .map((entry) => toEntryRecord(packId, entry));
      if (entryRecords.length > 0) {
        await database.entries.bulkPut(entryRecords);
      }

      const exerciseRecords = pack.exercises
        .filter((exercise) => createKeys.has(dedupeIdentity(exercise)))
        .map((exercise) => toExerciseRecord(packId, exercise));
      if (exerciseRecords.length > 0) {
        await database.exercises.bulkPut(exerciseRecords);
        const existingReviewKeys = new Set((await database.reviewState.toArray()).map((state) => state.cardId));
        const newStates = exerciseRecords
          .filter((exercise) => !existingReviewKeys.has(exercise.id))
          .map((exercise) => initialReviewState(exercise.id));
        if (newStates.length > 0) {
          await database.reviewState.bulkPut(newStates);
        }
      }

      await database.importLog.put({
        id: `${packId}-${Date.now()}`,
        packId,
        importedAt: now,
        creates: resolvedPreview.creates.length,
        updates: resolvedPreview.updates.length,
        skips: resolvedPreview.skips.length,
        conflicts: resolvedPreview.conflicts.length,
      });
    },
  );

  return resolvedPreview;
}
