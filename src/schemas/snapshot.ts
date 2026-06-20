import { z } from "zod";

export const SnapshotSchema = z.object({
  schema: z.literal("ace-snapshot@1"),
  appVersion: z.string(),
  installedPackIds: z.array(z.string()),
  dedupeKeys: z.array(z.string()),
  tags: z.array(z.string()),
  settings: z.object({
    particleCoverage: z.enum(["core", "all"]),
    particleStrictness: z.enum(["strict", "relaxed"]),
  }),
});

export type AuthoringSnapshot = z.infer<typeof SnapshotSchema>;
