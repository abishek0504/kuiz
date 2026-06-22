import type { KuizDatabase } from "../db/db";
import type { EntryRecord, ExerciseRecord, PackRecord } from "../db/schema";
import { exportAllTables } from "../db/db";
import { fallbackFingerprint, normalizeEnglish, normalizeKorean, simpleHash } from "../engine/normalize";
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

function modelAnswerFor(exercise: Exercise): string {
  if ("modelAnswer" in exercise) return exercise.modelAnswer;
  if ("corrected" in exercise) return exercise.corrected;
  if ("choices" in exercise) return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  return "";
}

function semanticIdentities(item: Entry | Exercise): string[] {
  const primary = dedupeIdentity(item);
  if ("kind" in item) {
    if (item.kind === "vocab") {
      return [primary, `vocab:${normalizeKorean(item.ko)}:${normalizeEnglish(item.en)}`];
    }
    if (item.kind === "particle") {
      return [primary, `particle:${normalizeKorean(item.form)}:${normalizeEnglish(item.meaning)}`];
    }
    return [primary, `grammar:${normalizeKorean(item.pattern)}:${normalizeEnglish(item.meaning)}`];
  }

  return [
    primary,
    `exercise:${item.type}:${normalizeKorean(item.prompt.stemKo ?? item.prompt.stem)}:${normalizeKorean(modelAnswerFor(item))}`,
  ];
}

function entrySearchText(entry: Entry): string {
  if (entry.kind === "vocab") return `${entry.ko} ${entry.en} ${entry.tags.join(" ")}`;
  if (entry.kind === "particle") return `${entry.form} ${entry.meaning} ${entry.usage} ${entry.tags.join(" ")}`;
  return `${entry.title} ${entry.pattern} ${entry.meaning} ${entry.tags.join(" ")}`;
}

function exerciseSearchText(exercise: Exercise): string {
  const model = modelAnswerFor(exercise);
  const passage = exercise.type === "reading" ? exercise.passage.ko : "";
  const dialogue = exercise.type === "dialogue" ? exercise.turns.map((turn) => turn.ko).join(" ") : "";
  return `${exercise.prompt.stem} ${exercise.prompt.stemKo ?? ""} ${passage} ${dialogue} ${model} ${exercise.tags.join(" ")}`;
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

function stripEntryMetadata(record: EntryRecord): Entry {
  const { packId: _packId, searchText: _searchText, ...entry } = record;
  return entry;
}

function stripExerciseMetadata(record: ExerciseRecord): Exercise {
  const { packId: _packId, searchText: _searchText, ...exercise } = record;
  return exercise;
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

  const existingByKey = new Map<string, { id: string; kind: string; hash: string }>();
  for (const entry of existingEntries) {
    for (const key of semanticIdentities(stripEntryMetadata(entry))) {
      existingByKey.set(key, {
        id: entry.id,
        kind: entry.kind,
        hash: simpleHash(stripEntryMetadata(entry)),
      });
    }
  }
  for (const exercise of existingExercises) {
    for (const key of semanticIdentities(stripExerciseMetadata(exercise))) {
      existingByKey.set(key, {
        id: exercise.id,
        kind: exercise.type,
        hash: simpleHash(stripExerciseMetadata(exercise)),
      });
    }
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
    const existing = semanticIdentities(item).map((candidate) => existingByKey.get(candidate)).find(Boolean);
    if (!existing) {
      preview.creates.push(key);
      continue;
    }

    const kind = "kind" in item ? item.kind : item.type;
    if (existing.kind !== kind) {
      preview.conflicts.push(key);
    } else if (existing.hash !== simpleHash(item)) {
      preview.updates.push(key);
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
  const updateKeys = new Set(resolvedPreview.updates);
  const packId = pack.pack.packId;
  const now = new Date().toISOString();

  const snapshot = await exportAllTables(database);
  const [existingEntries, existingExercises] = await Promise.all([
    database.entries.toArray(),
    database.exercises.toArray(),
  ]);
  const existingIdByKey = new Map<string, string>();
  for (const entry of existingEntries) {
    for (const key of semanticIdentities(stripEntryMetadata(entry))) {
      existingIdByKey.set(key, entry.id);
    }
  }
  for (const exercise of existingExercises) {
    for (const key of semanticIdentities(stripExerciseMetadata(exercise))) {
      existingIdByKey.set(key, exercise.id);
    }
  }

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
        .filter((entry) => createKeys.has(dedupeIdentity(entry)) || updateKeys.has(dedupeIdentity(entry)))
        .map((entry) => ({
          ...entry,
          id: semanticIdentities(entry).map((key) => existingIdByKey.get(key)).find(Boolean) ?? entry.id,
        }))
        .map((entry) => toEntryRecord(packId, entry));
      if (entryRecords.length > 0) {
        await database.entries.bulkPut(entryRecords);
      }

      const exerciseRecords = pack.exercises
        .filter((exercise) => createKeys.has(dedupeIdentity(exercise)) || updateKeys.has(dedupeIdentity(exercise)))
        .map((exercise) => ({
          ...exercise,
          id: semanticIdentities(exercise).map((key) => existingIdByKey.get(key)).find(Boolean) ?? exercise.id,
        }))
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
