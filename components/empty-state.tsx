"use client";

import { Plus, Search } from "lucide-react";
import type { Prompt } from "@/lib/types";

export function EmptyState({
  prompts,
  onCreateNew,
}: {
  prompts: Prompt[];
  onCreateNew: () => void;
}) {
  const isFirstRun = prompts.length === 0;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      {isFirstRun ? (
        <>
          <div className="rounded-full bg-card p-4">
            <Plus size={22} className="text-text-dim" />
          </div>
          <p className="max-w-xs text-sm text-text-dim">
            还没有提示词。先在左侧建一个分类，或者直接新增一条提示词开始使用。
          </p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-card p-4">
            <Search size={22} className="text-text-dim" />
          </div>
          <p className="max-w-xs text-sm text-text-dim">没有匹配的提示词，换个关键词试试</p>
        </>
      )}
      <button
        onClick={onCreateNew}
        className="mt-2 flex items-center gap-1 rounded-btn bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition hover:brightness-110"
      >
        <Plus size={15} />
        新增提示词
      </button>
    </div>
  );
}
