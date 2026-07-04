// ---------------------------------------------------------------------------
// @particle-academy/fancy-diff — public surface
// ---------------------------------------------------------------------------

// React component + imperative handle.
export { FancyDiff } from "./components/FancyDiff";
export type { FancyDiffHandle } from "./components/FancyDiff";
export type {
  FancyDiffProps,
  DiffVariant,
  DiffViewMode,
  MergedResult,
  AcceptanceChangeInfo,
  DiffProposal,
  HunkRenderArgs,
  ToolbarRenderArgs,
  GutterRenderArgs,
} from "./components/FancyDiff.types";

// Diff core — lives in @particle-academy/fancy-file-commons (the shared pure
// core for the Fancy file packages: editors, viewers, writers, diff surfaces)
// and is re-exported here verbatim, so the fancy-diff public surface is
// unchanged and existing consumers keep a single import.
export {
  computeDiff,
  buildDiff,
  splitLines,
  hunkId,
  diffSequences,
  diffLineSegments,
  defaultWordTokenizer,
  hash32,
} from "@particle-academy/fancy-file-commons";
export type { ComputeDiffOptions, EditOp } from "@particle-academy/fancy-file-commons";

// Unified-diff datasource.
export { parseUnifiedDiff } from "@particle-academy/fancy-file-commons";
export type { ParseUnifiedOptions } from "@particle-academy/fancy-file-commons";

// Source resolution (the discriminated union).
export {
  resolveSource,
  isDocumentsSource,
  isUnifiedSource,
  isPrebuiltSource,
} from "@particle-academy/fancy-file-commons";
export type {
  DiffSource,
  DocumentsSource,
  UnifiedSource,
  PrebuiltSource,
  ResolveSourceOptions,
} from "@particle-academy/fancy-file-commons";

// Merge resolution.
export { mergeResult, mergeLines, setAllStatus } from "@particle-academy/fancy-file-commons";
export type { MergeOptions } from "@particle-academy/fancy-file-commons";

// Per-line gutter annotations (editor gutters, diff rails, minimaps).
export { diffAnnotations, annotateLines } from "@particle-academy/fancy-file-commons";
export type {
  DiffAnnotations,
  LineAnnotation,
  LineChangeType,
} from "@particle-academy/fancy-file-commons";

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
} from "@particle-academy/fancy-file-commons";
export { fileLabel } from "@particle-academy/fancy-file-commons";
