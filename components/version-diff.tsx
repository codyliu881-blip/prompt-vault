"use client";

import { diffWordsWithSpace } from "diff";
import { useMemo } from "react";

export function VersionDiff({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => diffWordsWithSpace(before, after), [before, after]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <pre className="whitespace-pre-wrap break-words rounded-btn border border-border bg-bg p-3 text-sm leading-relaxed text-text">
        {parts
          .filter((p) => !p.added)
          .map((p, i) => (
            <span
              key={i}
              className={p.removed ? "bg-danger/20 text-danger line-through" : undefined}
            >
              {p.value}
            </span>
          ))}
      </pre>
      <pre className="whitespace-pre-wrap break-words rounded-btn border border-border bg-bg p-3 text-sm leading-relaxed text-text">
        {parts
          .filter((p) => !p.removed)
          .map((p, i) => (
            <span
              key={i}
              className={p.added ? "bg-accent/20 text-accent" : undefined}
            >
              {p.value}
            </span>
          ))}
      </pre>
    </div>
  );
}
