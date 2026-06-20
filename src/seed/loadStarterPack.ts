import starterPackJson from "../../content-packs/starter.core.v1.json";
import type { KuizDatabase } from "../db/db";
import type { ContentPack } from "../schemas/contentPack";
import { dedupeIdentity, mergeContentPack, packEntries, previewContentPack } from "../importExport/mergePack";

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
    await mergeContentPack(database, starterPack, {
      packId,
      title: starterPack.pack.title,
      creates: [...starterEntries, ...starterPack.exercises].map((item) => dedupeIdentity(item)),
      updates: [],
      skips: [],
      conflicts: [],
    });
    return;
  }

  const preview = await previewContentPack(database, starterPack);
  const hasChanges = preview.creates.length > 0 || preview.updates.length > 0;
  if (!hasChanges || preview.conflicts.length > 0) return;
  await mergeContentPack(database, starterPack, preview);
}
