/**
 * Long lines scroll; they do not break mid-identifier.
 *
 * The stylesheet has always set `[data-fancy-diff-body] { overflow-x: auto }`,
 * but every line row was rendered with `whitespace-pre-wrap break-words`, so
 * nothing could ever overflow and that rule was dead. What consumers actually
 * got was `$plan->amount` broken across two lines after the hyphen, which
 * destroys the line-for-line correspondence a diff exists to show — and does it
 * silently, because a wrapped diff still looks like a diff.
 *
 * The two rules contradicted each other, and `overflow-x` is the one that says
 * what was intended.
 */
import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { FancyDiff } from "../src/index";

const BEFORE = "public function monthly(Plan $plan): int\n{\n    return $plan->amount;\n}\n";
const AFTER = "public function monthly(Plan $plan): int\n{\n    return $plan->interval === 'year' ? intdiv($plan->amount, 12) : $plan->amount;\n}\n";

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<FancyDiff source={{ before: BEFORE, after: AFTER }} {...props} />);

test("does not wrap by default, so the body can actually scroll", () => {
  const html = render();

  // The rows must not carry their own whitespace class -- five render paths
  // used to repeat one, and a diff whose sides disagree about wrapping is worse
  // than either choice.
  assert.ok(!html.includes("break-words"), "a row still carries `break-words`");
  assert.ok(!html.includes("whitespace-pre"), "a row still sets whitespace itself");

  // Wrapping is off unless asked for.
  assert.ok(!html.includes("data-fancy-diff-wrap"), "default render should not opt into wrapping");
});

test("wrap opts back into the old behaviour", () => {
  assert.ok(
    render({ wrap: true }).includes("data-fancy-diff-wrap"),
    "`wrap` should mark the root so the stylesheet can wrap long lines",
  );
});

test("the stylesheet, not Tailwind, owns the whitespace", () => {
  // This package is absent from most consumers' Tailwind `@source` list, so a
  // utility class here is generated only if some OTHER scanned file happens to
  // use the same one. The stylesheet is already a required import, which makes
  // it the only thing guaranteed to be present.
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\[data-fancy-diff\]\s*\{[^}]*white-space:\s*pre;/,
    "styles.css must default the root to `white-space: pre`");
  assert.match(css, /\[data-fancy-diff-wrap\]\s*\{[^}]*white-space:\s*pre-wrap/,
    "styles.css must honour the wrap opt-in");
  assert.match(css, /\[data-fancy-diff-body\]\s*\{[^}]*overflow-x:\s*auto/,
    "the body must still scroll -- that rule is the point of not wrapping");
});
