# @particle-academy/fancy-diff

[![Fancified](art/fancified.svg)](https://particle.academy)

Client-side React UI for **side-by-side document diffs** with per-hunk
accept / reject and a merged result — built for the Fancy UI **Human+**
mission, where humans and agents share the same surface and trade control
fluidly.

- **No server processing.** The diff algorithm (line-level LCS + intra-line
  word/char diff) runs in-browser, in-house. **Zero third-party runtime
  dependencies.**
- **Three datasources.** Diff two documents, parse a git **unified diff**, or
  pass a pre-built structured diff.
- **Composes react-fancy.** Toolbar, buttons, badges, cards, separators are
  all react-fancy primitives — no bespoke chrome.
- **Human+ contract.** Controlled `value`/`onChange`, stable per-hunk handles
  (`data-fancy-diff-hunk`), JSON-friendly inputs, observable activity,
  trust-but-verify `pendingMode`, and a sketched MCP bridge.

```bash
npm i @particle-academy/fancy-diff
# peers:
npm i react react-dom @particle-academy/react-fancy
# optional (observable activity):
npm i @particle-academy/fancy-auto-common
```

```tsx
import { FancyDiff } from "@particle-academy/fancy-diff";
import "@particle-academy/fancy-diff/styles.css";
```

## Usage — all three datasources

```tsx
// 1) Diff two in-memory documents (engine computes the diff in-house)
<FancyDiff source={{ before, after, label: "README.md" }} />

// 2) Parse a git unified diff (one Diff per file; documents are PARTIAL)
const unified = `diff --git a/config.yml b/config.yml
--- a/config.yml
+++ b/config.yml
@@ -1,3 +1,3 @@
 name: atlas
-region: us-east-1
+region: eu-west-1
 replicas: 2
`;
<FancyDiff source={{ unified }} mode="inline" />

// 3) Use a pre-built structured Diff (or Diff[])
<FancyDiff source={{ diff: myDiff }} />
```

Controlled acceptance + merged output:

```tsx
const [value, setValue] = useState<AcceptanceState>({});
const ref = useRef<FancyDiffHandle>(null);

<FancyDiff
  ref={ref}
  source={{ before, after }}
  value={value}
  onChange={(next) => setValue(next)}
  onResult={(r) => console.log(r.text)}   // merged doc on every change
/>;

// imperatively:
const { text } = ref.current!.getMergedResult();
```

See [`demo.tsx`](./demo.tsx) for a full working example.

## `<FancyDiff>` props

| Prop | Type | Notes |
| --- | --- | --- |
| `source` | `{ before, after } \| { unified } \| { diff }` | Discriminated union, JSON-friendly. |
| `variant` | `"review" \| "compare"` | `"review"` (default) is the accept/reject loop; `"compare"` is a read-only comparison with the acceptance UX removed. See below. |
| `value` | `Record<hunkId, "accepted"\|"rejected"\|"pending">` | Controlled acceptance state. |
| `onChange` | `(next, info) => void` | Fired on every accept/reject. |
| `defaultValue` | `AcceptanceState` | Initial state when uncontrolled. |
| `defaultStatus` | `"accepted"\|"rejected"\|"pending"` | Status for hunks absent from `value`. Default `"pending"`. |
| `mode` | `"split" \| "inline"` | Side-by-side vs single column. Default `"split"`. |
| `onModeChange` | `(mode) => void` | Controlled view toggle. |
| `pendingMode` | `boolean` | Trust-but-verify: accept/reject become **proposals** (`onProposal`). |
| `onProposal` | `(proposal) => void` | Fired in `pendingMode`. |
| `onResult` | `(MergedResult) => void` | Merged document on every change. |
| `renderHunk` | `(HunkRenderArgs) => ReactNode` | Wrap/replace a hunk row (return `null` to fall back). |
| `renderToolbar` | `(ToolbarRenderArgs) => ReactNode` | Wrap/replace the toolbar. |
| `renderGutter` | `(GutterRenderArgs) => ReactNode` | Replace the line-number cell. |
| `tokenizer` | `(line) => string[]` | Custom intra-line tokenizer (word/char/lang-aware). |
| `actor` | `{ source?, id?, name?, color? }` | Stamped onto emitted activity (agent vs human). |
| `activity` | `DiffActivityEmitter \| null` | Per-instance activity sink. |
| `showToolbar` / `showGutter` | `boolean` | Default `true`. |
| `className` / `theme` / `header` | — | Passthrough / `"light"\|"dark"\|"auto"` / extra header node. |

Ref handle: `getMergedResult()`, `getDiffs()`, `getAcceptance()`.

## Two variants: review vs. compare

`<FancyDiff>` does two jobs, picked with `variant`:

- **`variant="review"`** (default) — the **trust-but-verify acceptance loop**: per-hunk accept/reject, accept-all / reject-all, acceptance status, and a merged result. This is the Human+ flow where an agent proposes an edit and a human ratifies it hunk by hunk.
- **`variant="compare"`** — a **read-only comparison**. Same diff engine, same split/inline views and intra-line highlighting, but the accept/reject affordances are stripped out entirely: no per-hunk buttons, no accept-all/reject-all, no acceptance state. Hunk borders mark the change *type* (add / remove / replace) instead of an acceptance status. Acceptance props (`value`, `onChange`, `pendingMode`, …) are ignored.

```tsx
// Just show me what changed — no acceptance UI.
<FancyDiff variant="compare" source={{ before, after }} />
```

Use `compare` for read-only side-by-sides — code review summaries, "what changed" panels, version history — and `review` when a human (or an embedded agent) needs to actually accept or reject the changes. The root carries a `data-fancy-diff-variant` handle for styling/automation.

## Customization points

Mirrors the specialized editors (fancy-code, fancy-slides):

- **Render-prop slots** — `renderHunk`, `renderToolbar`, `renderGutter`. Each
  receives the `defaultNode` so you can wrap rather than fully replace.
- **Custom tokenizer** — swap word-level highlighting for char-level or
  language-aware segmentation via `tokenizer`.
- **Theme / className passthrough** — `theme="dark"`, plus `className` on the
  root react-fancy `<Card>`.
- **View mode** — `split` ↔ `inline`, controlled or uncontrolled.
- **Datasource adapters** — the pure engine (`computeDiff`, `parseUnifiedDiff`,
  `resolveSource`) is exported, so you can pre-process diffs however you like
  and feed `{ diff }`.

## The diff model

```ts
type Diff = { hunks: Hunk[]; file?: DiffFileMeta };
type Hunk = {
  id: string;                 // deterministic, content-derived (no Math.random)
  type: "equal" | "add" | "remove" | "replace";
  beforeRange: { start; end };
  afterRange: { start; end };
  lines: DiffLine[];
  segments?: SegmentPair[];   // intra-line word/char diff for `replace`
};
```

`getMergedResult()` folds the diff + acceptance state into a document:
`add` accepted → include; `remove` accepted → drop; `replace` accepted →
use after-lines; anything pending/rejected → keep the original.

## Git unified-diff datasource & its limitation

`parseUnifiedDiff(text)` understands standard git output — multi-file
`diff --git`, `---` / `+++` headers, and `@@ -a,b +c,d @@` hunk headers — and
maps each file into the **same** `Diff` model (`+`→add, `-`→remove,
contiguous `-`+`+`→replace with inline word segments, context→equal). Hunk
ids are namespaced per file (`f0-…`) so they never collide.

**Limitation (documented & flagged).** A unified diff contains only the
**changed hunks plus a few context lines — not the full documents.** Every
parsed `Diff` is therefore marked `file.partial = true` (rendered as a
`partial` badge):

- line numbers come from the `@@` header, not a re-scan of a complete file;
- `getMergedResult()` over a partial diff reconstructs **only the lines
  present in the diff window**, not an entire file.

If you need a fully merged file, supply the complete `before` document via the
`{ before, after }` datasource instead — the in-house engine then has the
whole document to merge against.

## Observable activity

When [`@particle-academy/fancy-auto-common`](https://www.npmjs.com/package/@particle-academy/fancy-auto-common)
is present, wire its emitter once and every accept/reject broadcasts an
`AutoActivityEvent` (target kind `"diff"`) so presence / undo / coaching
layers compose for free:

```ts
import { emitActivity } from "@particle-academy/fancy-auto-common";
import { setDiffActivityEmitter } from "@particle-academy/fancy-diff";
setDiffActivityEmitter(emitActivity);
```

It is an **optional peer** — never a hard import. With nothing wired, emitting
is a no-op and the runtime dependency count stays at zero.

## Agent bridge (one-sitting sketch)

The component is bridgeable: agents read/write acceptance via stable hunk ids,
never the DOM. A minimal MCP bridge:

```ts
import type { FancyDiffHandle } from "@particle-academy/fancy-diff";

interface DiffAdapter {
  getState: () => FancyDiffHandle;
  setStatus: (hunkId: string, status: "accepted" | "rejected" | "pending") => void;
}

export function registerDiffBridge(server: McpServer, { adapter }: { adapter: DiffAdapter }) {
  server.tool("diff_list_hunks", {}, async () => ({
    hunks: adapter.getState().getDiffs().flatMap((d) => d.hunks),
  }));
  server.tool("diff_accept_hunk", { hunkId: z.string() }, async ({ hunkId }) => {
    adapter.setStatus(hunkId, "accepted");
    return { ok: true };
  });
  server.tool("diff_reject_hunk", { hunkId: z.string() }, async ({ hunkId }) => {
    adapter.setStatus(hunkId, "rejected");
    return { ok: true };
  });
  server.tool("diff_get_result", {}, async () => adapter.getState().getMergedResult());
}
```

The adapter just maps tool calls onto the same controlled `value`/`onChange`
loop a human uses — agents and humans drive identical state.

## License

MIT
