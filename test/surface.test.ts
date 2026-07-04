/**
 * Public-surface smoke tests. The diff core moved to
 * @particle-academy/fancy-file-commons (its full suites live there); these
 * verify the fancy-diff root still re-exports a WORKING core — the
 * backward-compat contract for existing consumers.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeDiff,
  splitLines,
  parseUnifiedDiff,
  resolveSource,
  mergeResult,
  setAllStatus,
  annotateLines,
  fileLabel,
  hash32,
  defaultWordTokenizer,
} from "../src/index";

test("computeDiff re-export works end-to-end", () => {
  const diff = computeDiff("a\nb\nc", "a\nB\nc");
  assert.equal(diff.hunks.length, 3);
  assert.equal(diff.hunks[1].type, "replace");
});

test("merge flow: accept all -> after document", () => {
  const diff = computeDiff("one\ntwo", "one\n2\nthree");
  assert.equal(mergeResult(diff, setAllStatus(diff, "accepted")), "one\n2\nthree");
  assert.equal(mergeResult(diff, setAllStatus(diff, "rejected")), "one\ntwo");
});

test("unified parser re-export works", () => {
  const unified = [
    "--- a/f.txt",
    "+++ b/f.txt",
    "@@ -1,2 +1,2 @@",
    " keep",
    "-old",
    "+new",
  ].join("\n");
  const diffs = parseUnifiedDiff(unified);
  assert.equal(diffs.length, 1);
  assert.equal(diffs[0].file?.partial, true);
  assert.equal(fileLabel(diffs[0].file), "f.txt");
});

test("resolveSource handles the documents union", () => {
  const [diff] = resolveSource({ before: "x", after: "y", label: "doc.txt" });
  assert.equal(diff.file?.newPath, "doc.txt");
});

test("annotateLines (gutter model) is exported", () => {
  const ann = annotateLines("a\nb\nz", "a\nB\nz\nc");
  assert.equal(ann.byLine[2]?.type, "modified"); // b -> B
  assert.equal(ann.byLine[4]?.type, "added"); // c appended after z
});

test("helpers stay exported", () => {
  assert.equal(splitLines("a\nb\n").length, 2);
  assert.equal(typeof hash32("x"), "string");
  assert.deepEqual(defaultWordTokenizer("a b"), ["a", " ", "b"]);
});
