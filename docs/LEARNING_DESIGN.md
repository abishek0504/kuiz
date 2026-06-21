# Kuiz Learning Design

Kuiz should be a Korean practice system, not a flashcard wrapper. The app should keep moving toward three product rules:

1. Practice meaning in context before isolated recall.
2. Ask learners to produce language, not only recognize it.
3. Treat particles, grammar, vocab, numbers, and connectors as interacting sentence systems.

## Research Baseline

- CEFR frames proficiency through communicative language activities: reception, production, interaction, and mediation, plus linguistic, sociolinguistic, and pragmatic competence. Kuiz should therefore include reading/listening comprehension, sentence production, repair, and future interaction tasks, not just word lookup. Source: Council of Europe, *CEFR Companion Volume* (2020), https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4.
- ACTFL's World-Readiness Standards connect communication with cultures, connections, comparisons, and communities. Kuiz content should eventually include context and register notes instead of treating every sentence as a literal translation item. Source: ACTFL World-Readiness Standards, https://www.actfl.org/educator-resources/world-readiness-standards-for-learning-languages.
- Retrieval practice improves delayed retention more than restudying alone. Multiple-choice is useful only when distractors are plausible and feedback repairs the misconception. Source: Roediger & Karpicke, "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention," https://doi.org/10.1111/j.1467-9280.2006.01693.x.
- Nation's four-strands model argues for balance across meaning-focused input, meaning-focused output, language-focused learning, and fluency development. Kuiz should balance explicit grammar/particle study with reading/listening, sentence building, correction, and fast review of familiar material. Source overview: https://en.wikipedia.org/wiki/Paul_Nation.

## Current Product Rules

- Study focus lanes are learner-facing categories: `전체`, `어휘`, `숫자·시간`, `문법`, `조사`, `연결어`, and `혼합`.
- `혼합` means integrated sentence practice: sentence builder, correction, time/action, and multi-tag sentence patterns.
- MCQs must use same-granularity choices. Full-sentence Korean prompts need full-sentence English choices.
- Number distractors must stay in the same number system and be near enough to require real recall.
- Grammar references should explain separate particle jobs instead of inventing fake monolithic templates.
- Audio should remain Korean-only.
- Progress, mistakes, and import history stay local-first.

## Next Product Direction

- Add a lesson path that moves from input to output: read/listen, notice form, produce sentence, repair mistake, then fluency review.
- Add minimal-dialogue and scenario practice for interaction, especially particles and connectors in context.
- Add native-speaker naturalness notes for register, politeness, and when a literal English translation is misleading.
- Add a smarter session planner that picks a balanced mix from due reviews, weak categories, and mixed sentence work.
- Expand import validation so future lesson JSON must include examples, misconception-based distractors, and at least one production task per new grammar point.
