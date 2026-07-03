"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Plus, Search, Upload, X } from "lucide-react";
import type { Category, NavSelection, Prompt, SortKey } from "@/lib/types";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { filterAndSortPrompts } from "@/lib/filter";
import { PromptCard } from "@/components/prompt-card";
import { EmptyState } from "@/components/empty-state";

const SORT_LABEL: Record<SortKey, string> = {
  updated_at: "按更新时间",
  created_at: "按创建时间",
  title: "按标题",
};

function navTitle(nav: NavSelection, categories: Category[]): string {
  if (nav.kind === "all") return "全部";
  if (nav.kind === "favorites") return "收藏夹";
  if (nav.kind === "type") return nav.type === "image" ? "作图提示词" : "视频提示词";
  if (nav.kind === "uncategorized") return "未分类";
  return categories.find((c) => c.id === nav.categoryId)?.name ?? "分类";
}

export function PromptList({
  prompts,
  categories,
  nav,
  keyword,
  onKeywordChange,
  selectedTags,
  onToggleTag,
  sort,
  onSortChange,
  onOpenPrompt,
  onToggleFavorite,
  onDeletePrompt,
  onCreateNew,
  onOpenImportExport,
  onOpenMobileDrawer,
}: {
  prompts: Prompt[];
  categories: Category[];
  nav: NavSelection;
  keyword: string;
  onKeywordChange: (v: string) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  onOpenPrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onCreateNew: () => void;
  onOpenImportExport: () => void;
  onOpenMobileDrawer: () => void;
}) {
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const scopedPrompts = useMemo(
    () => filterAndSortPrompts(prompts, { nav, keyword: "", tags: [], sort }),
    [prompts, nav, sort]
  );

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of scopedPrompts) {
      for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [scopedPrompts]);

  const visiblePrompts = useMemo(
    () =>
      filterAndSortPrompts(prompts, {
        nav,
        keyword: debouncedKeyword,
        tags: selectedTags,
        sort,
      }),
    [prompts, nav, debouncedKeyword, selectedTags, sort]
  );

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:px-6">
        <button
          onClick={onOpenMobileDrawer}
          className="rounded-btn p-1.5 text-text-dim hover:bg-card hover:text-text md:hidden"
          aria-label="打开菜单"
        >
          <Menu size={18} />
        </button>
        <h1 className="truncate text-sm font-medium text-text-dim">
          {navTitle(nav, categories)}
          <span className="ml-1.5 text-text-dim/70">({visiblePrompts.length})</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenImportExport}
            title="导入 / 导出"
            className="rounded-btn p-1.5 text-text-dim transition hover:bg-card hover:text-text"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1 rounded-btn bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition hover:brightness-110"
          >
            <Plus size={15} />
            新增
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
            />
            <input
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="搜索标题 / 正文 / 备注 / 标签…"
              className="w-full rounded-btn border border-border bg-card py-2 pl-9 pr-8 text-sm text-text placeholder:text-text-dim outline-none focus:border-accent"
            />
            {keyword && (
              <button
                onClick={() => onKeywordChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                aria-label="清空搜索"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="rounded-btn border border-border bg-card px-2 py-2 text-sm text-text-dim outline-none focus:border-accent"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((t) => (
              <button
                key={t}
                onClick={() => onToggleTag(t)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                  selectedTags.includes(t)
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-text-dim hover:text-text"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {visiblePrompts.length === 0 ? (
          <EmptyState prompts={prompts} onCreateNew={onCreateNew} />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {visiblePrompts.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                >
                  <PromptCard
                    prompt={p}
                    category={p.category_id ? categoryById.get(p.category_id) ?? null : null}
                    onOpen={() => onOpenPrompt(p.id)}
                    onToggleFavorite={() => onToggleFavorite(p.id)}
                    onDelete={() => onDeletePrompt(p.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
