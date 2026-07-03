"use client";

import { useState } from "react";
import { GitCompare, RotateCcw } from "lucide-react";
import type { PromptVersion } from "@/lib/types";
import { VersionDiff } from "@/components/version-diff";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function VersionHistory({
  versions,
  onSetAsCurrent,
}: {
  versions: PromptVersion[];
  onSetAsCurrent: (versionId: string) => void;
}) {
  const [compareMode, setCompareMode] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [leftId, setLeftId] = useState<string>(versions[0]?.id ?? "");
  const [rightId, setRightId] = useState<string>(versions[versions.length - 1]?.id ?? "");

  const viewing = versions.find((v) => v.id === viewingId) ?? versions[versions.length - 1];
  const left = versions.find((v) => v.id === leftId);
  const right = versions.find((v) => v.id === rightId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewingId(v.id)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                !compareMode && (viewingId ?? versions[versions.length - 1]?.id) === v.id
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-text-dim hover:text-text"
              }`}
            >
              v{v.version_no} {v.label}
            </button>
          ))}
        </div>
        {versions.length > 1 && (
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={`flex shrink-0 items-center gap-1 rounded-btn px-2 py-1 text-xs transition ${
              compareMode ? "bg-accent text-accent-fg" : "text-text-dim hover:bg-card hover:text-text"
            }`}
          >
            <GitCompare size={14} />
            对比
          </button>
        )}
      </div>

      {compareMode ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-text-dim">
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="rounded-btn border border-border bg-card px-2 py-1 text-text-dim"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version_no} {v.label}
                </option>
              ))}
            </select>
            <span>对比</span>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="rounded-btn border border-border bg-card px-2 py-1 text-text-dim"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version_no} {v.label}
                </option>
              ))}
            </select>
          </div>
          {left && right && <VersionDiff before={left.body} after={right.body} />}
        </div>
      ) : (
        viewing && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-text-dim">
              <span>{formatDateTime(viewing.created_at)}</span>
              <button
                onClick={() => onSetAsCurrent(viewing.id)}
                className="flex items-center gap-1 rounded-btn px-2 py-1 text-accent transition hover:bg-accent/10"
              >
                <RotateCcw size={13} />
                设为当前版
              </button>
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-btn border border-border bg-bg p-3 text-sm leading-relaxed text-text">
              {viewing.body}
            </pre>
          </div>
        )
      )}
    </div>
  );
}
