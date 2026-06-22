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
- TOPIK I emphasizes reading/listening foundations, while TOPIK II adds writing. Kuiz beginner content should therefore pair reception with typed Korean production instead of treating recognition as the end goal. Source overview: https://en.wikipedia.org/wiki/Test_of_Proficiency_in_Korean.
- NIKL learner dictionary infrastructure is the right reference target for future lexical review, example validation, and native-speaker QA. Sources: https://krdict.korean.go.kr/eng/mainAction and https://stdict.korean.go.kr/main/main.do.
- King Sejong Institute provides official Korean learning and assessment infrastructure; Kuiz should remain compatible with this broader beginner-learning ecosystem rather than inventing isolated categories. Source: https://www.ksif.or.kr/index.do.

## Current Product Rules

- Study focus lanes are learner-facing categories: `전체`, `어휘`, `숫자·시간`, `문법`, `조사`, `연결어`, and `혼합`.
- `혼합` means integrated sentence practice: sentence builder, correction, time/action, and multi-tag sentence patterns.
- Quiz uses the same learner-facing focus lanes. Internal tags such as `sino-numbers`, `native-numbers`, `mcq`, and `card` are storage/search labels, not UI labels.
- Recommended is the default quiz session. Session intents are recommended, practice, review, sentence, and listening; they should stay learner-facing rather than exposing low-level task slugs.
- The content schema supports recognition and production tasks: MCQ, fill blank, sentence builder, correction, conjugation, dialogue, reading, listening, dictation, roleplay, ordering, and minimal-pair practice.
- Recommended sessions should include meaning-focused input, form noticing, production or repair, due or weak review, and a fluency item when the content pool allows it.
- Recommendations must be evidence-based: start broad when there is no review history, then prioritize categories with due or weak review pressure before adding more new material.
- Progress should show category diagnostics so learners can see why a focus is recommended.
- MCQs must use same-granularity choices. Full-sentence Korean prompts need full-sentence English choices.
- MCQ source data must not put the correct answer first; UI ordering also shuffles deterministically as a second layer of protection.
- Distractors should encode a plausible misconception in `why`, not just be random wrong answers.
- Number distractors must stay in the same number system and be near enough to require real recall.
- Grammar references should explain separate particle jobs instead of inventing fake monolithic templates.
- Feedback should explain the actual Korean sentence roles when possible: topic, subject, object, time, place, source/recipient, connector, predicate, and other useful particle jobs.
- Audio should remain Korean-only.
- Progress, mistakes, and import history stay local-first.
- Imported grammar, particle, and connector lessons must contain output or repair tasks, not MCQs only.

## Next Product Direction

- Continue expanding lesson paths that move from input to output: read/listen, notice form, produce sentence, repair mistake, then fluency review.
- Expand minimal-dialogue and scenario practice for interaction, especially particles and connectors in context.
- Add native-speaker naturalness notes for register, politeness, and when a literal English translation is misleading.
- Add a smarter session planner that picks a balanced mix from due reviews, weak categories, and mixed sentence work.
- Expand import validation from the current quality gate into a fuller rubric: each new grammar point should include input examples, a misconception-based MCQ, a production task, a repair task, and a naturalness/register note.
