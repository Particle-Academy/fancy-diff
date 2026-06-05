import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button, Badge, Card, Separator } from "@particle-academy/react-fancy";
import { resolveSource } from "../diff/source";
import { mergeResult } from "../diff/merge";
import type {
  AcceptanceState,
  AcceptanceStatus,
  Diff,
  DiffSegment,
  Hunk,
} from "../diff/types";
import { emitHunkActivity } from "../activity";
import type {
  FancyDiffProps,
  DiffViewMode,
  MergedResult,
  HunkRenderArgs,
  ToolbarRenderArgs,
  GutterRenderArgs,
} from "./FancyDiff.types";

/** Imperative handle exposed via ref. */
export interface FancyDiffHandle {
  /** Compute the merged result from the current acceptance state. */
  getMergedResult: () => MergedResult;
  /** The resolved diffs (one per file). */
  getDiffs: () => Diff[];
  /** Current acceptance state. */
  getAcceptance: () => AcceptanceState;
}

const statusBadge: Record<AcceptanceStatus, { color: string; label: string }> = {
  accepted: { color: "emerald", label: "accepted" },
  rejected: { color: "rose", label: "rejected" },
  pending: { color: "amber", label: "pending" },
};

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

export const FancyDiff = forwardRef<FancyDiffHandle, FancyDiffProps>(
  function FancyDiff(props, ref) {
    const {
      source,
      value,
      onChange,
      defaultValue,
      defaultStatus = "pending",
      mode: modeProp,
      onModeChange,
      pendingMode = false,
      onProposal,
      onResult,
      renderHunk,
      renderToolbar,
      renderGutter,
      tokenizer,
      actor,
      activity,
      showToolbar = true,
      showGutter = true,
      className,
      theme = "auto",
      header,
    } = props;

    // Resolve source -> diffs. Memoized on identity of source + tokenizer.
    const diffs = useMemo(
      () => resolveSource(source, { tokenizer }),
      [source, tokenizer],
    );

    // Controlled / uncontrolled acceptance state.
    const [internal, setInternal] = useState<AcceptanceState>(
      () => defaultValue ?? {},
    );
    const acceptance = value ?? internal;

    // Controlled / uncontrolled view mode.
    const [internalMode, setInternalMode] = useState<DiffViewMode>(
      modeProp ?? "split",
    );
    const mode = modeProp ?? internalMode;
    const setMode = useCallback(
      (m: DiffViewMode) => {
        if (modeProp === undefined) setInternalMode(m);
        onModeChange?.(m);
      },
      [modeProp, onModeChange],
    );

    const allHunks = useMemo(() => {
      const list: { hunk: Hunk; fileIndex: number }[] = [];
      diffs.forEach((d, fi) =>
        d.hunks.forEach((h) => {
          if (h.type !== "equal") list.push({ hunk: h, fileIndex: fi });
        }),
      );
      return list;
    }, [diffs]);

    const statusOf = useCallback(
      (id: string): AcceptanceStatus => acceptance[id] ?? defaultStatus,
      [acceptance, defaultStatus],
    );

    const computeMerged = useCallback(
      (state: AcceptanceState): MergedResult => {
        const files = diffs.map((d) => ({
          meta: d.file,
          merged: mergeResult(d, state, { defaultStatus }),
        }));
        return { files, text: files[0]?.merged ?? "" };
      },
      [diffs, defaultStatus],
    );

    const apply = useCallback(
      (hunkId: string, status: AcceptanceStatus, action: string, fileIndex?: number) => {
        if (pendingMode) {
          onProposal?.({ hunkId, proposedStatus: status, actor });
        }
        const next: AcceptanceState = { ...acceptance, [hunkId]: status };

        emitHunkActivity({
          action: status === "accepted" ? "diff_accept_hunk" : "diff_reject_hunk",
          hunkId,
          fileId: fileIndex !== undefined ? diffs[fileIndex]?.file?.newPath : undefined,
          actor,
          emitter: activity,
        });

        if (value === undefined) setInternal(next);
        onChange?.(next, { hunkId, status, action });
        onResult?.(computeMerged(next));
      },
      [acceptance, pendingMode, onProposal, actor, activity, value, onChange, onResult, computeMerged, diffs],
    );

    const setAll = useCallback(
      (status: AcceptanceStatus, action: string) => {
        const next: AcceptanceState = { ...acceptance };
        for (const { hunk } of allHunks) next[hunk.id] = status;
        emitHunkActivity({
          action: status === "accepted" ? "diff_accept_all" : "diff_reject_all",
          actor,
          emitter: activity,
        });
        if (value === undefined) setInternal(next);
        onChange?.(next, { hunkId: "*", status, action });
        onResult?.(computeMerged(next));
      },
      [acceptance, allHunks, actor, activity, value, onChange, onResult, computeMerged],
    );

    useImperativeHandle(
      ref,
      () => ({
        getMergedResult: () => computeMerged(acceptance),
        getDiffs: () => diffs,
        getAcceptance: () => acceptance,
      }),
      [computeMerged, acceptance, diffs],
    );

    const counts = useMemo(() => {
      let accepted = 0;
      let rejected = 0;
      let pending = 0;
      for (const { hunk } of allHunks) {
        const s = statusOf(hunk.id);
        if (s === "accepted") accepted++;
        else if (s === "rejected") rejected++;
        else pending++;
      }
      return { total: allHunks.length, accepted, rejected, pending };
    }, [allHunks, statusOf]);

    // ---- Toolbar ----
    const defaultToolbar: ReactNode = showToolbar ? (
      <div
        data-fancy-diff-toolbar=""
        role="toolbar"
        aria-label="Diff actions"
        className="flex items-center gap-2 flex-wrap px-3 py-2"
      >
        <Badge color="zinc" variant="soft" size="sm">
          {counts.total} change{counts.total === 1 ? "" : "s"}
        </Badge>
        <Badge color="emerald" variant="soft" size="sm">
          {counts.accepted} accepted
        </Badge>
        <Badge color="amber" variant="soft" size="sm">
          {counts.pending} pending
        </Badge>
        <span className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          icon={mode === "split" ? "columns" : "list"}
          onClick={() => setMode(mode === "split" ? "inline" : "split")}
          data-fancy-diff-mode-toggle=""
        >
          {mode === "split" ? "Split" : "Inline"}
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Button
          size="sm"
          variant="ghost"
          icon="check"
          onClick={() => setAll("accepted", "accept-all")}
          data-fancy-diff-accept-all=""
        >
          Accept all
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon="x"
          onClick={() => setAll("rejected", "reject-all")}
          data-fancy-diff-reject-all=""
        >
          Reject all
        </Button>
      </div>
    ) : null;

    const toolbar: ReactNode = renderToolbar
      ? renderToolbar({
          acceptAll: () => setAll("accepted", "accept-all"),
          rejectAll: () => setAll("rejected", "reject-all"),
          counts,
          mode,
          setMode,
          defaultNode: defaultToolbar,
        })
      : defaultToolbar;

    const renderGutterCell = (args: GutterRenderArgs): ReactNode => {
      if (renderGutter) return renderGutter(args);
      return (
        <span className="select-none tabular-nums text-zinc-400 dark:text-zinc-600 text-[11px] pr-2 text-right inline-block min-w-[2.5rem]">
          {args.side === "after"
            ? args.afterLineNo ?? ""
            : args.beforeLineNo ?? args.afterLineNo ?? ""}
        </span>
      );
    };

    return (
      <Card
        variant="outlined"
        padding="none"
        className={cx(
          "fancy-diff overflow-hidden font-mono text-[13px]",
          theme === "dark" && "dark",
          className,
        )}
        data-fancy-diff=""
        data-fancy-diff-mode={mode}
      >
        {header}
        {toolbar}
        {(header || toolbar) && <Separator />}
        <div data-fancy-diff-body="" role="table" aria-label="Diff">
          {diffs.map((diff, fileIndex) => (
            <FileBlock
              key={fileIndex}
              diff={diff}
              fileIndex={fileIndex}
              mode={mode}
              statusOf={statusOf}
              pendingMode={pendingMode}
              showGutter={showGutter}
              renderGutterCell={renderGutterCell}
              renderHunk={renderHunk}
              accept={(id) => apply(id, "accepted", "accept", fileIndex)}
              reject={(id) => apply(id, "rejected", "reject", fileIndex)}
            />
          ))}
        </div>
      </Card>
    );
  },
);

interface FileBlockProps {
  diff: Diff;
  fileIndex: number;
  mode: DiffViewMode;
  statusOf: (id: string) => AcceptanceStatus;
  pendingMode: boolean;
  showGutter: boolean;
  renderGutterCell: (args: GutterRenderArgs) => ReactNode;
  renderHunk?: FancyDiffProps["renderHunk"];
  accept: (id: string) => void;
  reject: (id: string) => void;
}

function FileBlock({
  diff,
  fileIndex,
  mode,
  statusOf,
  pendingMode,
  showGutter,
  renderGutterCell,
  renderHunk,
  accept,
  reject,
}: FileBlockProps) {
  const label = diff.file?.newPath ?? diff.file?.oldPath;
  return (
    <div data-fancy-diff-file={fileIndex} role="rowgroup">
      {label && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
          {diff.file?.partial && (
            <Badge color="amber" variant="soft" size="sm" title="Unified diff: only changed hunks + context are present">
              partial
            </Badge>
          )}
        </div>
      )}
      {diff.hunks.map((hunk) => {
        const status = statusOf(hunk.id);
        const defaultNode = (
          <HunkRow
            hunk={hunk}
            mode={mode}
            status={status}
            pendingMode={pendingMode}
            showGutter={showGutter}
            renderGutterCell={renderGutterCell}
            accept={() => accept(hunk.id)}
            reject={() => reject(hunk.id)}
          />
        );
        if (renderHunk && hunk.type !== "equal") {
          const args: HunkRenderArgs = {
            hunk,
            fileIndex,
            status,
            mode,
            pending: pendingMode && status === "pending",
            accept: () => accept(hunk.id),
            reject: () => reject(hunk.id),
            defaultNode,
          };
          const custom = renderHunk(args);
          return <div key={hunk.id}>{custom ?? defaultNode}</div>;
        }
        return <div key={hunk.id}>{defaultNode}</div>;
      })}
    </div>
  );
}

interface HunkRowProps {
  hunk: Hunk;
  mode: DiffViewMode;
  status: AcceptanceStatus;
  pendingMode: boolean;
  showGutter: boolean;
  renderGutterCell: (args: GutterRenderArgs) => ReactNode;
  accept: () => void;
  reject: () => void;
}

const sideBg: Record<string, string> = {
  add: "bg-emerald-50 dark:bg-emerald-950/30",
  remove: "bg-rose-50 dark:bg-rose-950/30",
  replaceBefore: "bg-rose-50 dark:bg-rose-950/30",
  replaceAfter: "bg-emerald-50 dark:bg-emerald-950/30",
};

function HunkRow({
  hunk,
  mode,
  status,
  pendingMode,
  showGutter,
  renderGutterCell,
  accept,
  reject,
}: HunkRowProps) {
  const isChange = hunk.type !== "equal";
  const dimmed = isChange && status === "rejected";

  return (
    <div
      data-fancy-diff-hunk={hunk.id}
      data-fancy-diff-hunk-type={hunk.type}
      data-fancy-diff-hunk-status={isChange ? status : undefined}
      role="row"
      className={cx(
        "group relative",
        dimmed && "opacity-50",
        isChange && "border-l-2",
        isChange && status === "accepted" && "border-emerald-400",
        isChange && status === "rejected" && "border-rose-300",
        isChange && status === "pending" && "border-amber-300",
        !isChange && "border-l-2 border-transparent",
      )}
    >
      {mode === "split" && hunk.type === "replace" ? (
        <SplitReplace hunk={hunk} showGutter={showGutter} renderGutterCell={renderGutterCell} />
      ) : mode === "split" ? (
        <SplitSimple hunk={hunk} showGutter={showGutter} renderGutterCell={renderGutterCell} />
      ) : (
        <Inline hunk={hunk} showGutter={showGutter} renderGutterCell={renderGutterCell} />
      )}

      {isChange && (
        <div
          data-fancy-diff-hunk-actions=""
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
        >
          <Button
            size="xs"
            variant="circle"
            icon="check"
            color={status === "accepted" ? "emerald" : undefined}
            checked={status === "accepted"}
            aria-label={pendingMode ? "Propose accept" : "Accept change"}
            title={pendingMode ? "Propose accept" : "Accept change"}
            onClick={accept}
            data-fancy-diff-accept={hunk.id}
          />
          <Button
            size="xs"
            variant="circle"
            icon="x"
            warn={status === "rejected"}
            aria-label={pendingMode ? "Propose reject" : "Reject change"}
            title={pendingMode ? "Propose reject" : "Reject change"}
            onClick={reject}
            data-fancy-diff-reject={hunk.id}
          />
        </div>
      )}
    </div>
  );
}

function gutterArgs(
  side: "before" | "after" | "both",
  beforeLineNo?: number,
  afterLineNo?: number,
): GutterRenderArgs {
  return { side, beforeLineNo, afterLineNo };
}

/** Split view for add/remove/equal hunks (no intra-line segments). */
function SplitSimple({
  hunk,
  showGutter,
  renderGutterCell,
}: {
  hunk: Hunk;
  showGutter: boolean;
  renderGutterCell: (a: GutterRenderArgs) => ReactNode;
}) {
  return (
    <>
      {hunk.lines.map((line, i) => {
        const leftText = line.side === "before" || line.side === "both" ? line.text : "";
        const rightText = line.side === "after" || line.side === "both" ? line.text : "";
        const leftFilled = line.side === "before" || line.side === "both";
        const rightFilled = line.side === "after" || line.side === "both";
        return (
          <div key={i} className="grid grid-cols-2" role="row">
            <div
              className={cx(
                "flex items-start gap-1 px-2 py-0.5 whitespace-pre-wrap break-words min-h-[1.4em] border-r border-zinc-100 dark:border-zinc-800",
                line.side === "before" && sideBg.remove,
              )}
            >
              {showGutter && renderGutterCell(gutterArgs("before", line.beforeLineNo))}
              {line.side === "before" && <span className="text-rose-500 select-none">-</span>}
              <span>{leftFilled ? leftText : ""}</span>
            </div>
            <div
              className={cx(
                "flex items-start gap-1 px-2 py-0.5 whitespace-pre-wrap break-words min-h-[1.4em]",
                line.side === "after" && sideBg.add,
              )}
            >
              {showGutter && renderGutterCell(gutterArgs("after", undefined, line.afterLineNo))}
              {line.side === "after" && <span className="text-emerald-500 select-none">+</span>}
              <span>{rightFilled ? rightText : ""}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Split view for replace hunks, pairing before/after rows with segment highlights. */
function SplitReplace({
  hunk,
  showGutter,
  renderGutterCell,
}: {
  hunk: Hunk;
  showGutter: boolean;
  renderGutterCell: (a: GutterRenderArgs) => ReactNode;
}) {
  const before = hunk.lines.filter((l) => l.side === "before");
  const after = hunk.lines.filter((l) => l.side === "after");
  const rows = Math.max(before.length, after.length);
  const segs = hunk.segments ?? [];

  return (
    <>
      {Array.from({ length: rows }).map((_, i) => {
        const b = before[i];
        const a = after[i];
        const seg = segs.find((s) => s.pairIndex === i);
        return (
          <div key={i} className="grid grid-cols-2" role="row">
            <div
              className={cx(
                "flex items-start gap-1 px-2 py-0.5 whitespace-pre-wrap break-words min-h-[1.4em] border-r border-zinc-100 dark:border-zinc-800",
                b && sideBg.replaceBefore,
              )}
            >
              {showGutter && renderGutterCell(gutterArgs("before", b?.beforeLineNo))}
              {b && <span className="text-rose-500 select-none">-</span>}
              <span>{b ? (seg ? renderSegments(seg.before, "remove") : b.text) : ""}</span>
            </div>
            <div
              className={cx(
                "flex items-start gap-1 px-2 py-0.5 whitespace-pre-wrap break-words min-h-[1.4em]",
                a && sideBg.replaceAfter,
              )}
            >
              {showGutter && renderGutterCell(gutterArgs("after", undefined, a?.afterLineNo))}
              {a && <span className="text-emerald-500 select-none">+</span>}
              <span>{a ? (seg ? renderSegments(seg.after, "add") : a.text) : ""}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Inline (single-column) view. */
function Inline({
  hunk,
  showGutter,
  renderGutterCell,
}: {
  hunk: Hunk;
  showGutter: boolean;
  renderGutterCell: (a: GutterRenderArgs) => ReactNode;
}) {
  const segs = hunk.segments ?? [];
  let removeIdx = 0;
  let addIdx = 0;
  return (
    <>
      {hunk.lines.map((line, i) => {
        const sign = line.side === "before" ? "-" : line.side === "after" ? "+" : " ";
        const bg =
          line.side === "before"
            ? sideBg.remove
            : line.side === "after"
              ? sideBg.add
              : "";
        let content: ReactNode = line.text;
        if (hunk.type === "replace") {
          if (line.side === "before") {
            const seg = segs.find((s) => s.pairIndex === removeIdx++);
            if (seg) content = renderSegments(seg.before, "remove");
          } else if (line.side === "after") {
            const seg = segs.find((s) => s.pairIndex === addIdx++);
            if (seg) content = renderSegments(seg.after, "add");
          }
        }
        return (
          <div
            key={i}
            role="row"
            className={cx(
              "flex items-start gap-1 px-2 py-0.5 whitespace-pre-wrap break-words min-h-[1.4em]",
              bg,
            )}
          >
            {showGutter &&
              renderGutterCell(
                gutterArgs(line.side, line.beforeLineNo, line.afterLineNo),
              )}
            <span
              className={cx(
                "select-none w-3",
                sign === "-" && "text-rose-500",
                sign === "+" && "text-emerald-500",
              )}
            >
              {sign}
            </span>
            <span>{content}</span>
          </div>
        );
      })}
    </>
  );
}

/** Render intra-line segments with add/remove emphasis. */
function renderSegments(segments: DiffSegment[], emphasis: "add" | "remove"): ReactNode {
  return segments.map((s, i) => {
    if (s.op === "equal") return <span key={i}>{s.text}</span>;
    const cls =
      emphasis === "add"
        ? "bg-emerald-200/70 dark:bg-emerald-700/50 rounded-sm"
        : "bg-rose-200/70 dark:bg-rose-700/50 rounded-sm";
    return (
      <span key={i} className={cls} data-fancy-diff-seg={s.op}>
        {s.text}
      </span>
    );
  });
}
