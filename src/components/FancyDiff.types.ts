import type { ReactNode } from "react";
import type {
  AcceptanceState,
  AcceptanceStatus,
  Diff,
  Hunk,
  WordTokenizer,
} from "@particle-academy/fancy-file-commons";
import type { DiffSource } from "@particle-academy/fancy-file-commons";
import type { DiffActivityEmitter, DiffActor } from "../activity";

/** Split = side-by-side; inline = single column with +/- rows. */
export type DiffViewMode = "split" | "inline";

/** Args passed to a custom hunk renderer. */
export interface HunkRenderArgs {
  hunk: Hunk;
  /** Index of the file this hunk belongs to. */
  fileIndex: number;
  status: AcceptanceStatus;
  mode: DiffViewMode;
  /** Whether this hunk has a pending proposal (pendingMode). */
  pending: boolean;
  accept: () => void;
  reject: () => void;
  /** The default rendered row (so custom renderers can wrap, not replace). */
  defaultNode: ReactNode;
}

/** Args passed to a custom toolbar renderer. */
export interface ToolbarRenderArgs {
  acceptAll: () => void;
  rejectAll: () => void;
  /** Counts across all files. */
  counts: { total: number; accepted: number; rejected: number; pending: number };
  mode: DiffViewMode;
  setMode: (mode: DiffViewMode) => void;
  defaultNode: ReactNode;
}

/** Args passed to a custom gutter (per-line number cell) renderer. */
export interface GutterRenderArgs {
  beforeLineNo?: number;
  afterLineNo?: number;
  side: "before" | "after" | "both";
}

/**
 * What the viewer is *for*:
 *   - `"review"`  — the trust-but-verify acceptance loop (per-hunk accept/reject,
 *     accept-all/reject-all, acceptance status + merged result). The default.
 *   - `"compare"` — a read-only comparison: no accept/reject affordances, no
 *     acceptance state — just the diff. Acceptance props (`value`/`onChange`/
 *     `pendingMode`/…) are ignored in this variant.
 */
export type DiffVariant = "review" | "compare";

export interface FancyDiffProps {
  /**
   * Source of the diff (JSON-friendly discriminated union):
   *   - `{ before, after }`  — compute the diff in-house
   *   - `{ unified }`        — parse a git unified diff (partial documents)
   *   - `{ diff }`           — use a pre-built structured Diff (or Diff[])
   */
  source: DiffSource;

  /**
   * `"review"` (default) — accept/reject acceptance UX. `"compare"` — read-only
   * comparison with the acceptance UX stripped out.
   */
  variant?: DiffVariant;

  /** Controlled acceptance state: hunkId -> "accepted" | "rejected" | "pending". */
  value?: AcceptanceState;
  /** Fired with the next acceptance state on every accept/reject. */
  onChange?: (next: AcceptanceState, info: AcceptanceChangeInfo) => void;
  /** Initial acceptance state when uncontrolled. */
  defaultValue?: AcceptanceState;

  /** Status applied to hunks with no entry in `value`. Default "pending". */
  defaultStatus?: AcceptanceStatus;

  /** "split" (side-by-side) or "inline". Default "split". */
  mode?: DiffViewMode;
  /** Controlled mode change handler (renders a view toggle in the toolbar). */
  onModeChange?: (mode: DiffViewMode) => void;

  /**
   * Trust-but-verify: when true, accept/reject are treated as *proposals*.
   * The status still flips, but consumers can render a confirm affordance and
   * gate `getMergedResult`. Pending proposals are reported via `onProposal`.
   */
  pendingMode?: boolean;
  /** Fired when a proposal is made in pendingMode (before any confirm step). */
  onProposal?: (proposal: DiffProposal) => void;

  /** Called with the merged document whenever acceptance changes. */
  onResult?: (result: MergedResult) => void;

  // --- Customization (mirror the specialized editors) -------------------
  /** Replace/wrap the per-hunk row. Return null to fall back to default. */
  renderHunk?: (args: HunkRenderArgs) => ReactNode;
  /** Replace/wrap the toolbar. */
  renderToolbar?: (args: ToolbarRenderArgs) => ReactNode;
  /** Replace the per-line gutter (line-number cell). */
  renderGutter?: (args: GutterRenderArgs) => ReactNode;
  /** Custom intra-line tokenizer for word/char segment highlighting. */
  tokenizer?: WordTokenizer;

  /** Actor metadata stamped onto emitted activity (agent vs human). */
  actor?: DiffActor;
  /** Per-instance activity emitter (defaults to the global one if set). */
  activity?: DiffActivityEmitter | null;

  /** Show the accept-all / reject-all toolbar. Default true. */
  showToolbar?: boolean;
  /** Show line-number gutters. Default true. */
  showGutter?: boolean;
  /**
   * Wrap long lines instead of scrolling them. Default **false**.
   *
   * A diff is read line-against-line, so a wrapped line silently breaks the
   * correspondence the view exists to show -- and it breaks INSIDE tokens,
   * turning `$plan->amount` into `$plan-` / `>amount;`. The default keeps each
   * source line on one row and lets the body scroll horizontally.
   */
  wrap?: boolean;

  /** Root className passthrough. */
  className?: string;
  /** Theme accent — "light" | "dark" | "auto". Default "auto" (inherits). */
  theme?: "light" | "dark" | "auto";
  /** Extra content rendered above the toolbar (e.g. a title). */
  header?: ReactNode;
}

export interface AcceptanceChangeInfo {
  hunkId: string;
  status: AcceptanceStatus;
  /** "accept" | "reject" | "accept-all" | "reject-all". */
  action: string;
}

export interface DiffProposal {
  hunkId: string;
  proposedStatus: AcceptanceStatus;
  actor?: DiffActor;
}

export interface MergedResult {
  /** Per-file merged documents (index-aligned with the resolved files). */
  files: { meta?: Diff["file"]; merged: string }[];
  /** Convenience: the first file's merged text (common single-file case). */
  text: string;
}
