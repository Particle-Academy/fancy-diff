/**
 * fancy-diff demo — exercises all three datasources and the controlled
 * acceptance loop. Drop into any react-fancy host (or a Vite playground) and
 * render <Demo />. Requires `import "@particle-academy/fancy-diff/styles.css"`.
 */
import { useRef, useState } from "react";
import { Button, Card } from "@particle-academy/react-fancy";
import {
  FancyDiff,
  type FancyDiffHandle,
  type AcceptanceState,
} from "@particle-academy/fancy-diff";

const BEFORE = `# Project Atlas
A tool for mapping the world.

## Features
- fast rendering
- offline tiles
- shared cursors`;

const AFTER = `# Project Atlas
A tool for mapping the whole world.

## Features
- blazing fast rendering
- offline tiles
- shared cursors
- agent presence`;

// A real git unified diff (note: partial — only changed hunks + context).
const UNIFIED = `diff --git a/config.yml b/config.yml
index 1a2b3c4..5d6e7f8 100644
--- a/config.yml
+++ b/config.yml
@@ -1,5 +1,5 @@
 name: atlas
-region: us-east-1
+region: eu-west-1
 replicas: 2
 cache: true
 debug: false
@@ -10,3 +10,4 @@ logging:
   level: info
   format: json
+  sampling: 0.1
`;

export function Demo() {
  const [acceptance, setAcceptance] = useState<AcceptanceState>({});
  const ref = useRef<FancyDiffHandle>(null);
  const [merged, setMerged] = useState<string>("");

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2>1 · Documents source ({"{ before, after }"})</h2>
      <FancyDiff
        ref={ref}
        source={{ before: BEFORE, after: AFTER, label: "README.md" }}
        value={acceptance}
        onChange={(next) => setAcceptance(next)}
        onResult={(r) => setMerged(r.text)}
        mode="split"
        actor={{ source: "human", name: "You" }}
      />
      <Button onClick={() => setMerged(ref.current!.getMergedResult().text)}>
        Get merged result
      </Button>
      {merged && (
        <Card variant="flat">
          <pre style={{ whiteSpace: "pre-wrap" }}>{merged}</pre>
        </Card>
      )}

      <h2>2 · Unified-diff source ({"{ unified }"}) — partial documents</h2>
      <FancyDiff source={{ unified: UNIFIED }} mode="inline" />

      <h2>3 · Pre-built diff source ({"{ diff }"})</h2>
      <FancyDiff
        source={{
          diff: {
            file: { newPath: "notes.txt" },
            hunks: [
              {
                id: "static-0",
                type: "add",
                beforeRange: { start: 0, end: 0 },
                afterRange: { start: 0, end: 1 },
                lines: [{ side: "after", text: "hand-authored hunk", afterLineNo: 1 }],
              },
            ],
          },
        }}
        pendingMode
        onProposal={(p) => console.log("proposed", p)}
      />
    </div>
  );
}
