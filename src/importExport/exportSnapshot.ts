import type { KuizDatabase } from "../db/db";
import { getSettings } from "../db/db";
import type { AuthoringSnapshot } from "../schemas/snapshot";

export async function exportAuthoringSnapshot(database: KuizDatabase): Promise<AuthoringSnapshot> {
  const [packs, entries, exercises, settings] = await Promise.all([
    database.packs.toArray(),
    database.entries.toArray(),
    database.exercises.toArray(),
    getSettings(database),
  ]);

  const dedupeKeys = Array.from(new Set([...entries, ...exercises].map((item) => item.dedupeKey))).sort();
  const tags = Array.from(new Set([...entries, ...exercises].flatMap((item) => item.tags))).sort();

  return {
    schema: "kuiz-snapshot@1",
    appVersion: "1.0.0",
    installedPackIds: packs.map((pack) => pack.packId).sort(),
    dedupeKeys,
    tags,
    settings: {
      particleCoverage: settings.particleCoverage,
      particleStrictness: settings.particleStrictness,
      focusTags: settings.focusTags,
    },
  };
}
