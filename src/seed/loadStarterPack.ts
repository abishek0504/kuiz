import starterPackJson from "../../content-packs/starter.core.v1.json";
import type { KuizDatabase } from "../db/db";
import { ContentPackSchema } from "../schemas/contentPack";
import { mergeContentPack, previewContentPack } from "../importExport/mergePack";

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
  const count = await database.packs.count();
  if (count > 0) return;

  const starterPack = ContentPackSchema.parse(starterPackJson);
  const preview = await previewContentPack(database, starterPack);
  await mergeContentPack(database, starterPack, preview);
}
