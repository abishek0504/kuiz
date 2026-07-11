import type { KuizDatabase } from "../db/db";
import { getSettings } from "../db/db";
import type { AuthoringSnapshot } from "../schemas/snapshot";
import { appVersion } from "../appVersion";

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
    appVersion,
    installedPackIds: packs.map((pack) => pack.packId).sort(),
    installedPacks: packs
      .map((pack) => ({ packId: pack.packId, version: pack.version, title: pack.title }))
      .sort((left, right) => left.packId.localeCompare(right.packId)),
    dedupeKeys,
    tags,
    settings: {
      particleCoverage: settings.particleCoverage,
      particleStrictness: settings.particleStrictness,
      focusTags: settings.focusTags,
    },
  };
}
