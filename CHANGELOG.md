# Changelog

All notable changes to `@particle-academy/fancy-diff` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **Pre-1.0:** breaking changes land in MINOR releases. Until 1.0 the minor
> number is not a compatibility promise — read the entry, not the version.

> This file starts here. Earlier releases predate it and were never written up;
> `git log` is the record for those. It is not backfilled rather than
> guessed-at, because a changelog that invents its own history is worse than one
> that admits where it begins.

## [Unreleased]

## 0.5.0 — 2026-08-18

### Fixed

- **Long lines no longer break mid-token.** The stylesheet has always set
  `[data-fancy-diff-body] { overflow-x: auto }`, but every line row rendered
  with `whitespace-pre-wrap break-words` — so nothing could ever overflow and
  that rule was dead. What you actually got was `$plan->amount` split across two
  rows after the hyphen, which destroys the line-against-line correspondence a
  diff exists to show, and does it silently, because a wrapped diff still looks
  like a diff.

  The two rules contradicted each other; `overflow-x` is the one that said what
  was intended. Each source line now stays on one row and the body scrolls.

  **This is a visible change.** If you preferred wrapping, pass the new `wrap`
  prop — nothing else moves.

  ```tsx
  <FancyDiff source={{ before, after }} wrap />
  ```

### Changed

- **Whitespace is owned by `styles.css`, not a Tailwind utility.** This package
  is absent from most consumers' Tailwind `@source` list, so a utility class
  here is generated only when some *other* scanned file happens to use the same
  one — it worked by coincidence or not at all. The stylesheet is already a
  required import, which makes it the only thing guaranteed to be present.

  It is declared once on the root (`white-space` inherits) rather than repeated
  across the five places rows are rendered, where one path keeping a stale value
  is exactly the drift that survives review. The root carries
  `data-fancy-diff-wrap` when wrapping is on, so you can style against it.


## [0.4.0] — 2026-08-07

### Changed

- **BREAKING — Node 22 is now declared as the floor.** `engines.node` is `>=22`, where this package previously declared **nothing at all**.

  Declaring nothing was not the same as supporting old Node: a consumer on 18 installed cleanly and found out at runtime.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.


## [0.3.2] — 2026-07-28

### Fixed

- **0.3.1 did not actually contain the range widen its entry describes.** The
  `@particle-academy/fancy-file-commons` requirement went out as a caret, not
  `>=0.2 <2.0`. The widen was real when it was written and was then
  silently reverted before the tag: verifying it meant running
  `npm install @particle-academy/fancy-file-commons@latest` to prove the
  package builds against the newest sibling, and that command **rewrites the
  range in `package.json` to a caret on whatever it just installed**. The
  verification step overwrote the thing it was verifying.

  0.3.1 is still an improvement on what came before it — the caret it shipped
  points at the current sibling rather than a stale one, so the install that was
  failing now succeeds. It just re-imposes the same cap one minor later. 0.3.2
  carries the range the entry promised.

  `devDependencies` deliberately keeps a caret: that pin is the version the
  suite is built and tested against, and it is what makes the wide runtime range
  a tested claim rather than a hopeful one.

## [0.3.1] — 2026-07-28

### Changed

- Widened the `@particle-academy/fancy-file-commons` requirement from `^0.1.0` to `>=0.2 <2.0`, so a
  sibling minor release is an upgrade and not a resolver conflict. **No action
  needed** — widening a range only adds candidates; the version you have today
  still resolves.

  A caret on a `0.x` range locks the MINOR, so this pinned a sibling at
  whatever it happened to be on the day it was written, and each sibling
  release then read as a conflict to the resolver rather than an upgrade.
  Nothing here was using an API the newer minors removed — the range was the
  whole problem.

  This one was **already blocking**: the sibling had shipped past the cap,
  so installing the two together resolved to an old copy or refused
  outright. Nothing reported it, because a resolver quietly picking an older
  version looks exactly like success.
