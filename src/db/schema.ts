import type { DistractorGroup, Entry, Exercise, SourceRef } from "../schemas/contentPack";
import type { ReviewState } from "../engine/scheduler";

export type ParticleCoverage = "core" | "all";
export type ParticleStrictness = "strict" | "relaxed";

export type UserSettings = {
  particleCoverage: ParticleCoverage;
  particleStrictness: ParticleStrictness;
  focusTags: string[];
  autoAudio: boolean;
  speechRate: number;
  voiceURI?: string;
};

export const defaultSettings: UserSettings = {
  particleCoverage: "all",
  particleStrictness: "strict",
  focusTags: [],
  autoAudio: false,
  speechRate: 0.9,
};

export type PackRecord = {
  packId: string;
  version: string;
  title: string;
  locale: string;
  createdAt: string;
  importedAt: string;
  hash: string;
  includes: string[];
  sourceRefs: SourceRef[];
};

export type EntryRecord = Entry & {
  packId: string;
  searchText: string;
};

export type ExerciseRecord = Exercise & {
  packId: string;
  searchText: string;
};

export type DistractorGroupRecord = DistractorGroup & {
  packId: string;
};

export type SettingRecord = {
  key: string;
  value: unknown;
  updatedAt: string;
};

export type SnapshotRecord = {
  id: string;
  createdAt: string;
  reason: string;
  data: unknown;
};

export type ImportLogRecord = {
  id: string;
  packId: string;
  importedAt: string;
  creates: number;
  updates: number;
  skips: number;
  conflicts: number;
};

export type BackupPayload = {
  schema: "kuiz-backup@1" | "ace-backup@1";
  exportedAt: string;
  packs: PackRecord[];
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  distractorGroups: DistractorGroupRecord[];
  reviewState: ReviewState[];
  settings: SettingRecord[];
  importLog: ImportLogRecord[];
};
