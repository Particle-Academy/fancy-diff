/**
 * Observable activity — emits `AutoActivityEvent`s when hunks are accepted or
 * rejected, so presence / undo / coaching layers compose for free.
 *
 * fancy-auto-common is an OPTIONAL peer. We never hard-import it: instead the
 * host injects an emitter (via `<FancyDiff activity={...}>`), or registers a
 * global one. If nothing is wired, emitting is a no-op. This keeps the
 * package's runtime dependency count at zero.
 */

/** Minimal shape we depend on from fancy-auto-common's AutoActivityEvent. */
export interface DiffActivityEvent {
  agentId: string;
  agentName?: string;
  agentColor?: string;
  target: {
    kind: string;
    elementId?: string;
    label?: string;
    screenId?: string;
  };
  action: string;
  timestamp: number;
  meta?: Record<string, unknown>;
  source?: string;
}

export type DiffActivityEmitter = (event: DiffActivityEvent) => void;

let globalEmitter: DiffActivityEmitter | null = null;

/**
 * Wire a global activity emitter once at app startup, e.g.:
 *
 *   import { emitActivity } from "@particle-academy/fancy-auto-common";
 *   setDiffActivityEmitter(emitActivity);
 */
export function setDiffActivityEmitter(emitter: DiffActivityEmitter | null): void {
  globalEmitter = emitter;
}

/** Actor metadata describing who performed an accept/reject. */
export interface DiffActor {
  /** "agent" | "human" (free-form). Defaults to "human". */
  source?: string;
  id?: string;
  name?: string;
  color?: string;
}

export interface EmitHunkActivityArgs {
  action: "diff_accept_hunk" | "diff_reject_hunk" | "diff_accept_all" | "diff_reject_all";
  hunkId?: string;
  fileId?: string;
  actor?: DiffActor;
  /** Per-instance emitter override (takes precedence over the global one). */
  emitter?: DiffActivityEmitter | null;
  meta?: Record<string, unknown>;
}

/** Emit a diff activity event through the per-instance or global emitter. */
export function emitHunkActivity({
  action,
  hunkId,
  fileId,
  actor,
  emitter,
  meta,
}: EmitHunkActivityArgs): void {
  const sink = emitter ?? globalEmitter;
  if (!sink) return;
  const a = actor ?? {};
  sink({
    agentId: a.id ?? (a.source === "agent" ? "agent" : "human"),
    agentName: a.name,
    agentColor: a.color,
    target: {
      kind: "diff",
      elementId: hunkId,
      label: fileId ? `hunk ${hunkId ?? ""} in ${fileId}` : hunkId,
    },
    action,
    timestamp: Date.now(),
    source: a.source ?? "human",
    meta: { ...meta, fileId, hunkId },
  });
}
