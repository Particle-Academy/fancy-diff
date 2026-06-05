// ---------------------------------------------------------------------------
// @particle-academy/fancy-diff — public surface
// ---------------------------------------------------------------------------

// React component + imperative handle.
export { FancyDiff } from "./components/FancyDiff";
export type { FancyDiffHandle } from "./components/FancyDiff";
export type {
  FancyDiffProps,
  DiffViewMode,
  MergedResult,
  AcceptanceChangeInfo,
  DiffProposal,
  HunkRenderArgs,
  ToolbarRenderArgs,
  GutterRenderArgs,
} from "./components/FancyDiff.types";

// Diff engine (pure, zero-dep).
export { computeDiff, buildDiff, splitLines, hunkId } from "./diff/engine";
export type { ComputeDiffOptions } from "./diff/engine";
export { diffSequences } from "./diff/lcs";
export type { EditOp } from "./diff/lcs";
export { diffLineSegments, defaultWordTokenizer } from "./diff/segments";
export { hash32 } from "./diff/hash";

// Unified-diff datasource.
export { parseUnifiedDiff } from "./diff/unified";
export type { ParseUnifiedOptions } from "./diff/unified";

// Source resolution (the discriminated union).
export {
  resolveSource,
  isDocumentsSource,
  isUnifiedSource,
  isPrebuiltSource,
} from "./diff/source";
export type {
  DiffSource,
  DocumentsSource,
  UnifiedSource,
  PrebuiltSource,
  ResolveSourceOptions,
} from "./diff/source";

// Merge resolution.
export { mergeResult, mergeLines, setAllStatus } from "./diff/merge";
export type { MergeOptions } from "./diff/merge";

// Observable activity (optional fancy-auto-common integration).
export { setDiffActivityEmitter, emitHunkActivity } from "./activity";
export type {
  DiffActivityEvent,
  DiffActivityEmitter,
  DiffActor,
  EmitHunkActivityArgs,
} from "./activity";

// Structured model types.
export type {
  Diff,
  DiffFileMeta,
  Hunk,
  HunkType,
  DiffLine,
  LineSide,
  LineRange,
  DiffSegment,
  SegmentOp,
  SegmentPair,
  AcceptanceState,
  AcceptanceStatus,
  WordTokenizer,
} from "./diff/types";
