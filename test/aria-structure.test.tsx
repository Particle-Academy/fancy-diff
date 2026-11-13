/**
 * The diff body's table semantics are valid ARIA.
 *
 * Lab run 601 (K30) recorded axe `aria-required-children` and
 * `aria-required-parent`, both critical: each hunk was `role="row"` and held
 * the line rows plus the accept/reject buttons (a row inside a row), and each
 * line row held bare divs and spans instead of cells. A screen reader's table
 * navigation had nothing coherent to walk.
 *
 * No DOM library is installed here, so this walks the server markup with a
 * small tag stack. React's static markup is well-formed, which is all it needs.
 */
import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { FancyDiff } from "../src/index";

interface Node {
  tag: string;
  role: string | null;
  attrs: string;
  children: Node[];
  parent: Node | null;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function parse(html: string): Node {
  const root: Node = { tag: "#root", role: null, attrs: "", children: [], parent: null };
  let cur = root;
  // Quoted attribute values may contain ">" (Tailwind's `[&>svg]:` variants).
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [, closing, tag, attrs, selfClose] = m;
    if (closing) {
      while (cur.tag !== tag && cur.parent) cur = cur.parent;
      if (cur.parent) cur = cur.parent;
      continue;
    }
    const role = /\brole="([^"]+)"/.exec(attrs)?.[1] ?? (tag === "button" ? "button" : null);
    const node: Node = { tag, role, attrs, children: [], parent: cur };
    cur.children.push(node);
    if (!selfClose && !VOID.has(tag.toLowerCase())) cur = node;
  }
  return root;
}

function all(n: Node, out: Node[] = []): Node[] {
  for (const c of n.children) {
    out.push(c);
    all(c, out);
  }
  return out;
}

/** Nearest ancestor that carries a role (generic divs are transparent). */
function roleParent(n: Node): Node | null {
  for (let p = n.parent; p; p = p.parent) if (p.role && p.role !== "presentation" && p.role !== "none") return p;
  return null;
}

/** Role-bearing descendants reached without crossing another role. */
function ownedRoles(n: Node): Node[] {
  const out: Node[] = [];
  const walk = (x: Node) => {
    for (const c of x.children) {
      if (c.role && c.role !== "presentation" && c.role !== "none") out.push(c);
      else walk(c);
    }
  };
  walk(n);
  return out;
}

const CELLS = new Set(["cell", "columnheader", "rowheader", "gridcell"]);

function assertValidTable(html: string, label: string) {
  const nodes = all(parse(html));
  const rows = nodes.filter((n) => n.role === "row");
  assert.ok(rows.length > 0, `${label}: expected some rows`);

  for (const row of rows) {
    const parent = roleParent(row);
    assert.ok(parent && ["table", "rowgroup", "grid", "treegrid"].includes(parent.role!), `${label}: row inside ${parent?.role ?? "nothing"}: ${row.attrs}`);
    const owned = ownedRoles(row);
    assert.ok(owned.length > 0, `${label}: row with no cells: ${row.attrs}`);
    for (const o of owned) assert.ok(CELLS.has(o.role!), `${label}: row owns a ${o.role}: ${row.attrs}`);
  }

  for (const n of nodes.filter((x) => x.role === "rowgroup" || x.role === "table")) {
    for (const o of ownedRoles(n)) {
      assert.ok(["row", "rowgroup"].includes(o.role!), `${label}: ${n.role} owns a ${o.role}`);
    }
  }
}

const BEFORE = "one\ntwo\nthree\nfour\n";
const AFTER = "one\nTWO\nthree\nfour\nfive\n";

for (const mode of ["split", "inline"] as const) {
  for (const variant of ["review", "compare"] as const) {
    test(`${mode}/${variant}: every row sits in a table and holds only cells`, () => {
      const html = renderToStaticMarkup(<FancyDiff source={{ before: BEFORE, after: AFTER }} mode={mode} variant={variant} />);
      assertValidTable(html, `${mode}/${variant}`);
    });
  }
}

test("the accept/reject controls survive, inside a cell", () => {
  const html = renderToStaticMarkup(<FancyDiff source={{ before: BEFORE, after: AFTER }} />);
  const nodes = all(parse(html));
  const buttons = nodes.filter((n) => /data-fancy-diff-(accept|reject)=/.test(n.attrs));
  assert.ok(buttons.length >= 2, "expected accept and reject buttons");
  for (const b of buttons) assert.equal(roleParent(b)?.role, "cell");
});

test("a file label is a row of the file's rowgroup", () => {
  const html = renderToStaticMarkup(
    <FancyDiff
      source={{ unified: "--- a/x.txt\n+++ b/x.txt\n@@ -1,2 +1,2 @@\n one\n-two\n+TWO\n" }}
    />,
  );
  assert.ok(html.includes("x.txt"), "the file label should render");
  assertValidTable(html, "unified");
});
