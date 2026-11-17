# Contributing to @particle-academy/fancy-diff

Notes for anyone, human or agent, working ON this package's code. How to USE the
package is in [AGENTS.md](./AGENTS.md); what it is, is in [README.md](./README.md).
`CLAUDE.md` is a symlink to this file, so Claude Code reads these notes when it
works in this repo.

## Layout

- `src/` — the `<FancyDiff>` component and its activity emitter. The diff
  engine (compute, unified-diff parsing, merge, annotations) lives in
  `@particle-academy/fancy-file-commons` and is re-exported from `src/index.ts`
  verbatim, so fancy-code's diff gutter and this viewer agree on every hunk.
- `test/` — tests (`*.test.ts`, `*.test.tsx`), run with Node's test runner via `tsx`.
- `docs/FancyDiff.md` — the component reference doc that ships in the package.
- `demo.tsx` — a full working example.

## Commands

```bash
npm run build   # tsup
npm run dev     # tsup --watch
npm run lint    # tsc --noEmit && eslint .
npm test        # node --import tsx --test "test/*.test.ts" "test/*.test.tsx"
```

## Changelog

Update `CHANGELOG.md` in the same commit as the change.
