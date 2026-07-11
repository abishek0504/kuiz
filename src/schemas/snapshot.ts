import { z } from "zod";

export const SnapshotSchema = z.object({
  schema: z.literal("kuiz-snapshot@1"),
  appVersion: z.string(),
  installedPackIds: z.array(z.string()),
  installedPacks: z
    .array(
      z.object({
        packId: z.string(),
        version: z.string(),
        title: z.string(),
      }),
    )
    .default([]),
  dedupeKeys: z.array(z.string()),
  tags: z.array(z.string()),
  settings: z.object({
    particleCoverage: z.enum(["core", "all"]),
    particleStrictness: z.enum(["strict", "relaxed"]),
    focusTags: z.array(z.string()).default([]),
  }),
});

export type AuthoringSnapshot = z.infer<typeof SnapshotSchema>;
