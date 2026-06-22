import { z } from "zod";

const Tag = z.string().min(1).max(48);
const DedupeKey = z.string().min(3).max(120);
const SkillSchema = z.enum(["reception", "production", "interaction", "mediation", "languageFocus", "fluency"]);
const LevelSchema = z.enum(["A0", "A1", "A2", "TOPIK1", "TOPIK2"]);
const RegisterSchema = z.enum(["casual", "polite", "formal", "neutral"]);
const IsoDate = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
]);

export const SourceRefSchema = z.object({
  sourceId: z.string().min(1),
  label: z.string().min(1),
  locator: z.string().optional(),
  inferred: z.boolean().default(false),
  note: z.string().optional(),
});

export const ExampleSchema = z.object({
  ko: z.string().optional(),
  en: z.string().optional(),
  audioText: z.string().optional(),
  romanization: z.string().optional(),
  note: z.string().optional(),
});

export const AcceptedAnswersSchema = z.object({
  strict: z.array(z.string()).default([]),
  relaxed: z.array(z.string()).default([]),
  regex: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const EntryBaseSchema = z.object({
  id: z.string().min(1),
  dedupeKey: DedupeKey,
  tags: z.array(Tag).default([]),
  sourceRefIds: z.array(z.string()).default([]),
  inferred: z.boolean().default(false),
  lookup: z
    .object({
      naverQuery: z.string().optional(),
    })
    .optional(),
});

export const VocabEntrySchema = EntryBaseSchema.extend({
  kind: z.literal("vocab"),
  ko: z.string().min(1),
  en: z.string().min(1),
  pos: z.enum(["noun", "verb", "adjective", "adverb", "expression"]),
  romanization: z.string().optional(),
  examples: z.array(ExampleSchema).default([]),
  notes: z.string().optional(),
});

export const ParticleEntrySchema = EntryBaseSchema.extend({
  kind: z.literal("particle"),
  form: z.string().min(1),
  forms: z.array(z.string()).default([]),
  meaning: z.string().min(1),
  usage: z.string().min(1),
  contrastsWith: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).default([]),
  notes: z.string().optional(),
});

export const GrammarEntrySchema = EntryBaseSchema.extend({
  kind: z.literal("grammar"),
  title: z.string().min(1),
  pattern: z.string().min(1),
  meaning: z.string().min(1),
  formation: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).default([]),
  pitfalls: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const DistractorGroupSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["particle", "meaning", "register", "time", "grammar-form", "connector", "vocab", "sentence-meaning"]),
  members: z.array(z.string()).min(2),
  rules: z.array(z.string()).default([]),
});

const ExerciseBaseSchema = z.object({
  id: z.string().min(1),
  dedupeKey: DedupeKey,
  tags: z.array(Tag).default([]),
  sourceRefIds: z.array(z.string()).default([]),
  inferred: z.boolean().default(false),
  prompt: z.object({
    stem: z.string().min(1),
    stemKo: z.string().optional(),
    stemEn: z.string().optional(),
    audioText: z.string().optional(),
    context: z.string().optional(),
  }),
  skill: SkillSchema.optional(),
  level: LevelSchema.optional(),
  scenario: z.string().min(1).max(80).optional(),
  register: RegisterSchema.optional(),
  communicativeGoal: z.string().min(1).max(160).optional(),
  rubric: z.array(z.string().min(1).max(180)).optional(),
  explanation: z.string().optional(),
  naturalnessNote: z.string().optional(),
  particleNote: z.string().optional(),
});

export const MCQExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("mcq"),
  choiceKind: z.enum([
    "particle",
    "full-sentence-meaning",
    "phrase-meaning",
    "grammar-form",
    "naturalness",
    "connector",
    "vocab",
  ]),
  choices: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean(),
        why: z.string().optional(),
      }),
    )
    .min(2)
    .max(5)
    .refine((choices) => choices.filter((choice) => choice.isCorrect).length === 1, {
      message: "MCQ exercises must have exactly one correct choice.",
    }),
  distractorGroupId: z.string().optional(),
});

export const FillBlankExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("fillBlank"),
  answerPresentation: z.enum(["particle", "word", "phrase", "sentence"]),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const SentenceBuilderExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("sentenceBuilder"),
  tokens: z.array(z.string()).default([]),
  targetMeaning: z.string().min(1),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const CorrectionExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("correction"),
  incorrect: z.string().min(1),
  corrected: z.string().min(1),
  acceptedAnswers: AcceptedAnswersSchema,
});

export const ConjugationExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("conjugation"),
  dictionaryForm: z.string().min(1),
  targetFormLabel: z.string().min(1),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const DialogueTurnSchema = z.object({
  speaker: z.string().min(1),
  ko: z.string().min(1),
  en: z.string().optional(),
  audioText: z.string().optional(),
});

export const DialogueExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("dialogue"),
  turns: z.array(DialogueTurnSchema).min(2).max(5),
  question: z.string().min(1),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const ReadingExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("reading"),
  passage: z.object({
    title: z.string().optional(),
    ko: z.string().min(1),
    en: z.string().optional(),
  }),
  question: z.string().min(1),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const ListeningExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("listening"),
  question: z.string().min(1),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const DictationExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("dictation"),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const RoleplayExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("roleplay"),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const OrderingExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("ordering"),
  chunks: z.array(z.string().min(1)).min(2),
  acceptedAnswers: AcceptedAnswersSchema,
  modelAnswer: z.string().min(1),
});

export const MinimalPairExerciseSchema = ExerciseBaseSchema.extend({
  type: z.literal("minimalPair"),
  contrast: z.string().min(1),
  choiceKind: z.enum(["particle", "grammar-form", "naturalness", "connector"]),
  choices: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean(),
        why: z.string().optional(),
      }),
    )
    .min(2)
    .max(5)
    .refine((choices) => choices.filter((choice) => choice.isCorrect).length === 1, {
      message: "Minimal-pair exercises must have exactly one correct choice.",
    }),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  MCQExerciseSchema,
  FillBlankExerciseSchema,
  SentenceBuilderExerciseSchema,
  CorrectionExerciseSchema,
  ConjugationExerciseSchema,
  DialogueExerciseSchema,
  ReadingExerciseSchema,
  ListeningExerciseSchema,
  DictationExerciseSchema,
  RoleplayExerciseSchema,
  OrderingExerciseSchema,
  MinimalPairExerciseSchema,
]);

export const ContentPackSchema = z.object({
  schema: z.literal("kuiz-pack@1"),
  pack: z.object({
    packId: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    locale: z.literal("en-CA").default("en-CA"),
    createdAt: IsoDate,
    appMinVersion: z.string().default("1.0.0"),
    includes: z.array(Tag).default([]),
  }),
  sourceRefs: z.array(SourceRefSchema).default([]),
  vocab: z.array(VocabEntrySchema).default([]),
  particles: z.array(ParticleEntrySchema).default([]),
  grammar: z.array(GrammarEntrySchema).default([]),
  distractorGroups: z.array(DistractorGroupSchema).default([]),
  exercises: z.array(ExerciseSchema).default([]),
});

export type SourceRef = z.infer<typeof SourceRefSchema>;
export type VocabEntry = z.infer<typeof VocabEntrySchema>;
export type ParticleEntry = z.infer<typeof ParticleEntrySchema>;
export type GrammarEntry = z.infer<typeof GrammarEntrySchema>;
export type Entry = VocabEntry | ParticleEntry | GrammarEntry;
export type DistractorGroup = z.infer<typeof DistractorGroupSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type MCQExercise = z.infer<typeof MCQExerciseSchema>;
export type FillBlankExercise = z.infer<typeof FillBlankExerciseSchema>;
export type SentenceBuilderExercise = z.infer<typeof SentenceBuilderExerciseSchema>;
export type CorrectionExercise = z.infer<typeof CorrectionExerciseSchema>;
export type ConjugationExercise = z.infer<typeof ConjugationExerciseSchema>;
export type DialogueExercise = z.infer<typeof DialogueExerciseSchema>;
export type ReadingExercise = z.infer<typeof ReadingExerciseSchema>;
export type ListeningExercise = z.infer<typeof ListeningExerciseSchema>;
export type DictationExercise = z.infer<typeof DictationExerciseSchema>;
export type RoleplayExercise = z.infer<typeof RoleplayExerciseSchema>;
export type OrderingExercise = z.infer<typeof OrderingExerciseSchema>;
export type MinimalPairExercise = z.infer<typeof MinimalPairExerciseSchema>;
export type ContentPack = z.infer<typeof ContentPackSchema>;
