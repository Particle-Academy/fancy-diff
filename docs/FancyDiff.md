# FancyDiff

A Human+ document diff with per-hunk accept/reject. Agents propose changes,
humans confirm them, and the merged document falls out of the acceptance state.

## Import

```tsx
import { FancyDiff } from "@particle-academy/fancy-diff";
```

## Basic Usage

```tsx
<FancyDiff
  source={{ before: original, after: proposed }}
  onResult={(r) => setMerged(r.text)}
/>
```

## Where the diff comes from

`source` is a JSON-friendly discriminated union, so an agent can emit any of
the three without constructing objects:

| Shape | Meaning |
|---|---|
| `{ before, after }` | Compute the diff here from two documents. |
| `{ unified }` | Parse a git unified diff. Handles partial documents. |
| `{ diff }` | Use a pre-built structured `Diff` (or `Diff[]` for many files). |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| source | `DiffSource` | — | Where the diff comes from (above). |
| variant | `"review" \| "compare"` | `"review"` | `compare` strips the acceptance UX and is read-only. |
| value | `AcceptanceState` | — | Controlled: `hunkId -> "accepted" \| "rejected" \| "pending"`. |
| onChange | `(next, info) => void` | — | Fires on every accept/reject with the next state. |
| defaultValue | `AcceptanceState` | — | Initial state when uncontrolled. |
| defaultStatus | `AcceptanceStatus` | `"pending"` | Status for hunks with no entry in `value`. |
| mode | `"split" \| "inline"` | `"split"` | Side-by-side or inline. |
| onModeChange | `(mode) => void` | — | Supplying it renders a view toggle in the toolbar. |
| pendingMode | `boolean` | `false` | Trust-but-verify — see below. |
| onProposal | `(proposal: DiffProposal) => void` | — | Fires when a proposal is made in `pendingMode`. |
| onResult | `(result: MergedResult) => void` | — | Called with the merged document whenever acceptance changes. |
| renderHunk | `(args: HunkRenderArgs) => ReactNode` | — | Replace/wrap the per-hunk row. Return `null` to fall back. |
| renderToolbar | `(args: ToolbarRenderArgs) => ReactNode` | — | Replace/wrap the toolbar. |
| renderGutter | `(args: GutterRenderArgs) => ReactNode` | — | Replace the line-number cell. |
| tokenizer | `WordTokenizer` | — | Custom intra-line tokenizer for word/char highlighting. |
| actor | `DiffActor` | — | Stamped onto emitted activity — agent vs human. |
| activity | `DiffActivityEmitter \| null` | global | Per-instance activity emitter. |
| showToolbar | `boolean` | `true` | The accept-all / reject-all toolbar. |
| showGutter | `boolean` | `true` | Line-number gutters. |
| wrap | `boolean` | `false` | Wrap long lines — see the warning below. |
| className | `string` | — | Root passthrough. |
| theme | `"light" \| "dark" \| "auto"` | `"auto"` | Inherits by default. |
| header | `ReactNode` | — | Rendered above the toolbar. |

## Trust-but-verify: `pendingMode`

With `pendingMode`, accept/reject are treated as **proposals**. The status still
flips so the UI stays responsive, but every proposal is reported through
`onProposal`, and a consumer can render a confirm affordance and gate
`getMergedResult` behind it.

This is the contract for a surface an agent can write to: the agent proposes,
the human confirms, and nothing reaches the document in between.

## `wrap` defaults to false on purpose

A diff is read line-against-line, so a wrapped line silently breaks the
correspondence the view exists to show — and it wraps *inside* tokens, turning
`$plan->amount` into `$plan-` / `>amount;`. The default keeps each source line
on one row and scrolls the body horizontally instead.

## Imperative handle

```tsx
const ref = useRef<FancyDiffHandle>(null);
ref.current?.getMergedResult();
```

| Method | Returns | Description |
|---|---|---|
| getMergedResult | `MergedResult` | The merged document for the current acceptance state. |
| getDiffs | `Diff[]` | The resolved diffs, one per file. |
| getAcceptance | `AcceptanceState` | Current acceptance state. |

## The diff core is shared, and re-exported here

`computeDiff`, `buildDiff`, `parseUnifiedDiff`, `mergeResult`, `resolveSource`,
`diffAnnotations` and friends live in
[`@particle-academy/fancy-file-commons`](https://www.npmjs.com/package/@particle-academy/fancy-file-commons)
— the shared pure core for the Fancy file packages — and are re-exported from
`fancy-diff` verbatim. The public surface is unchanged and you keep one import.

Use them directly when you want the merge without the UI:

```ts
import { computeDiff, mergeResult } from "@particle-academy/fancy-diff";
```
