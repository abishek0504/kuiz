# Contributing

Kuiz is currently a focused portfolio project, so changes should keep the app mobile-first, local-first, and test-backed.

## Local Setup

```bash
npm install
npm run dev
```

## Quality Gate

Before opening a pull request, run:

```bash
npm audit
npm run validate:pack
npm run test:run
npm run build
npm run e2e
```

## Content Packs

Content changes should be made through JSON packs that pass `npm run validate:pack`. Every imported item needs a stable `dedupeKey`, tags, and source references.
