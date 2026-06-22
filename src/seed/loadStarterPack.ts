import starterPackJson from "../../content-packs/starter.core.v1.json";
import type { KuizDatabase } from "../db/db";
import type { ContentPack, Entry, Exercise } from "../schemas/contentPack";
import { mergeContentPack, packEntries, previewContentPack } from "../importExport/mergePack";
import { simpleHash } from "../engine/normalize";

let starterLoadPromise: Promise<void> | undefined;

export async function loadStarterPack(database: KuizDatabase): Promise<void> {
  if (starterLoadPromise) return starterLoadPromise;

  starterLoadPromise = loadStarterPackOnce(database).catch((error) => {
    starterLoadPromise = undefined;
    throw error;
  });
  return starterLoadPromise;
}

async function loadStarterPackOnce(database: KuizDatabase): Promise<void> {
  const starterPack = starterPackJson as ContentPack;
  const packId = starterPack.pack.packId;
  const starterEntries = packEntries(starterPack);
  const existingPack = await database.packs.get(packId);
  if (existingPack?.version === starterPack.pack.version) {
    const [entryCount, exerciseCount] = await Promise.all([
      database.entries.where("packId").equals(packId).count(),
      database.exercises.where("packId").equals(packId).count(),
    ]);
    if (entryCount >= starterEntries.length && exerciseCount >= starterPack.exercises.length) return;
  }

  const [totalEntries, totalExercises] = await Promise.all([
    database.entries.count(),
    database.exercises.count(),
  ]);
  if (totalEntries === 0 && totalExercises === 0) {
    await installFreshStarterPack(database, starterPack);
    return;
  }

  const preview = await previewContentPack(database, starterPack);
  const hasChanges = preview.creates.length > 0 || preview.updates.length > 0;
  if (!hasChanges || preview.conflicts.length > 0) return;
  await mergeContentPack(database, starterPack, preview);
}

function entrySearchText(entry: Entry): string {
  if (entry.kind === "vocab") return `${entry.ko} ${entry.en} ${entry.tags.join(" ")}`;
  if (entry.kind === "particle") return `${entry.form} ${entry.meaning} ${entry.usage} ${entry.tags.join(" ")}`;
  return `${entry.title} ${entry.pattern} ${entry.meaning} ${entry.tags.join(" ")}`;
}

function modelAnswerFor(exercise: Exercise): string {
  if ("modelAnswer" in exercise) return exercise.modelAnswer;
  if ("corrected" in exercise) return exercise.corrected;
  if ("choices" in exercise) return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  return "";
}

function exerciseSearchText(exercise: Exercise): string {
  const passage = exercise.type === "reading" ? exercise.passage.ko : "";
  const dialogue = exercise.type === "dialogue" ? exercise.turns.map((turn) => turn.ko).join(" ") : "";
  return `${exercise.prompt.stem} ${exercise.prompt.stemKo ?? ""} ${passage} ${dialogue} ${modelAnswerFor(exercise)} ${exercise.tags.join(" ")}`;
}

async function installFreshStarterPack(database: KuizDatabase, starterPack: ContentPack): Promise<void> {
  const packId = starterPack.pack.packId;
  const now = new Date().toISOString();

  await database.transaction(
    "rw",
    [database.packs, database.entries, database.exercises, database.distractorGroups, database.importLog],
    async () => {
      await database.packs.put({
        packId,
        version: starterPack.pack.version,
        title: starterPack.pack.title,
        locale: starterPack.pack.locale,
        createdAt: starterPack.pack.createdAt,
        importedAt: now,
        hash: simpleHash(starterPack),
        includes: starterPack.pack.includes,
        sourceRefs: starterPack.sourceRefs,
      });

      const entries = packEntries(starterPack).map((entry) => ({
        ...entry,
        packId,
        searchText: entrySearchText(entry),
      }));
      const exercises = starterPack.exercises.map((exercise) => ({
        ...exercise,
        packId,
        searchText: exerciseSearchText(exercise),
      }));
      const distractorGroups = starterPack.distractorGroups.map((group) => ({
        ...group,
        packId,
      }));

      await database.entries.bulkPut(entries);
      await database.exercises.bulkPut(exercises);
      if (distractorGroups.length > 0) await database.distractorGroups.bulkPut(distractorGroups);
      await database.importLog.put({
        id: `${packId}-${Date.now()}`,
        packId,
        importedAt: now,
        creates: entries.length + exercises.length,
        updates: 0,
        skips: 0,
        conflicts: 0,
      });
    },
  );
}
