"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Settings } from "lucide-react";
import type { Category, NavSelection, Prompt, PromptType, PromptVersion, SortKey } from "@/lib/types";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { filterAndSortPrompts } from "@/lib/filter";
import { Sidebar } from "@/components/sidebar";
import { PromptList } from "@/components/prompt-list";
import { DetailPanel } from "@/components/detail-panel";
import { ImportExportPanel } from "@/components/import-export-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from "@/lib/actions/categories";
import {
  createPrompt,
  deletePrompt,
  toggleFavorite,
  updatePromptMeta,
  type CreatePromptInput,
  type UpdatePromptMetaInput,
} from "@/lib/actions/prompts";
import {
  listVersions,
  saveAsNewVersion,
  saveWithoutNewVersion,
  setVersionAsCurrent,
} from "@/lib/actions/versions";
import { getAllData } from "@/lib/actions/refresh";

type Panel = { mode: "closed" } | { mode: "create" } | { mode: "edit"; promptId: string };

export function AppShell({
  initialCategories,
  initialPrompts,
}: {
  initialCategories: Category[];
  initialPrompts: Prompt[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [prompts, setPrompts] = useState(initialPrompts);
  const [nav, setNav] = useState<NavSelection>({ kind: "all" });
  const [keyword, setKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("updated_at");
  const [panel, setPanel] = useState<Panel>({ mode: "closed" });
  const [versions, setVersions] = useState<PromptVersion[] | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const exportScopeIds = useMemo(
    () =>
      filterAndSortPrompts(prompts, { nav, keyword: debouncedKeyword, tags: selectedTags, sort }).map(
        (p) => p.id
      ),
    [prompts, nav, debouncedKeyword, selectedTags, sort]
  );

  const currentPrompt =
    panel.mode === "edit" ? prompts.find((p) => p.id === panel.promptId) ?? null : null;

  function handleNavChange(next: NavSelection) {
    setNav(next);
    setSelectedTags([]);
    setMobileDrawerOpen(false);
  }

  function handleToggleTag(tag: string) {
    setSelectedTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  // ---- 分类 ----
  async function handleCreateCategory(type: PromptType, name: string): Promise<Category> {
    try {
      const cat = await createCategory(type, name);
      setCategories((cs) => [...cs, cat]);
      return cat;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建分类失败");
      throw e;
    }
  }

  async function handleRenameCategory(id: string, name: string) {
    const prev = categories;
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
    try {
      await renameCategory(id, name);
    } catch (e) {
      setCategories(prev);
      toast.error(e instanceof Error ? e.message : "重命名失败");
    }
  }

  async function handleDeleteCategory(id: string) {
    const prevCats = categories;
    const prevPrompts = prompts;
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setPrompts((ps) => ps.map((p) => (p.category_id === id ? { ...p, category_id: null } : p)));
    if (nav.kind === "category" && nav.categoryId === id) setNav({ kind: "all" });
    try {
      await deleteCategory(id);
      toast.success("已删除分类");
    } catch (e) {
      setCategories(prevCats);
      setPrompts(prevPrompts);
      toast.error(e instanceof Error ? e.message : "删除分类失败");
    }
  }

  async function handleReorderCategory(type: PromptType, id: string, direction: "up" | "down") {
    const list = categories.filter((c) => c.type === type).sort((a, b) => a.sort_order - b.sort_order);
    const idx = list.findIndex((c) => c.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;

    const reordered = [...list];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const orderedIds = reordered.map((c) => c.id);

    const prev = categories;
    setCategories((cs) =>
      cs.map((c) => {
        const newIdx = orderedIds.indexOf(c.id);
        return newIdx === -1 ? c : { ...c, sort_order: newIdx };
      })
    );
    try {
      await reorderCategories(orderedIds);
    } catch (e) {
      setCategories(prev);
      toast.error(e instanceof Error ? e.message : "排序失败");
    }
  }

  // ---- 提示词 ----
  async function handleToggleFavorite(id: string) {
    const target = prompts.find((p) => p.id === id);
    if (!target) return;
    const next = !target.is_favorite;
    setPrompts((ps) => ps.map((p) => (p.id === id ? { ...p, is_favorite: next } : p)));
    try {
      await toggleFavorite(id, next);
    } catch (e) {
      setPrompts((ps) => ps.map((p) => (p.id === id ? { ...p, is_favorite: !next } : p)));
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function handleCreatePrompt(input: CreatePromptInput) {
    try {
      const created = await createPrompt(input);
      setPrompts((ps) => [created, ...ps]);
      setPanel({ mode: "closed" });
      toast.success("已创建提示词");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败");
    }
  }

  async function handleSaveMeta(id: string, patch: UpdatePromptMetaInput) {
    try {
      const updated = await updatePromptMeta(id, patch);
      setPrompts((ps) => ps.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
      throw e;
    }
  }

  async function handleSaveWithoutVersion(id: string, body: string) {
    try {
      const { prompt, version } = await saveWithoutNewVersion(id, body);
      setPrompts((ps) => ps.map((p) => (p.id === id ? prompt : p)));
      setVersions((vs) => (vs ? vs.map((v) => (v.id === version.id ? version : v)) : vs));
      toast.success("已保存修改");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    }
  }

  async function handleSaveAsNewVersion(id: string, body: string, label: string) {
    try {
      const { prompt, version } = await saveAsNewVersion(id, body, label);
      setPrompts((ps) => ps.map((p) => (p.id === id ? prompt : p)));
      setVersions((vs) => (vs ? [...vs, version] : [version]));
      toast.success(`已保存为新版本 v${version.version_no}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    }
  }

  async function handleSetVersionAsCurrent(id: string, versionId: string) {
    try {
      const updated = await setVersionAsCurrent(id, versionId);
      setPrompts((ps) => ps.map((p) => (p.id === id ? updated : p)));
      toast.success("已设为当前版");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function handleConfirmDelete() {
    const id = deletingPromptId;
    if (!id) return;
    setDeletingPromptId(null);
    const prev = prompts;
    setPrompts((ps) => ps.filter((p) => p.id !== id));
    if (panel.mode === "edit" && panel.promptId === id) setPanel({ mode: "closed" });
    try {
      await deletePrompt(id);
      toast.success("已删除");
    } catch (e) {
      setPrompts(prev);
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function handleOpenPrompt(id: string) {
    setPanel({ mode: "edit", promptId: id });
    setVersions(null);
    try {
      const vs = await listVersions(id);
      setVersions(vs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载版本历史失败");
    }
  }

  async function handleImported() {
    try {
      const data = await getAllData();
      setCategories(data.categories);
      setPrompts(data.prompts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "刷新数据失败");
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg">
      <Sidebar
        categories={categories}
        prompts={prompts}
        nav={nav}
        onNavChange={handleNavChange}
        onCreateCategory={handleCreateCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategory={handleReorderCategory}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PromptList
          prompts={prompts}
          categories={categories}
          nav={nav}
          keyword={keyword}
          onKeywordChange={setKeyword}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          sort={sort}
          onSortChange={setSort}
          onOpenPrompt={handleOpenPrompt}
          onToggleFavorite={handleToggleFavorite}
          onDeletePrompt={setDeletingPromptId}
          onCreateNew={() => setPanel({ mode: "create" })}
          onOpenImportExport={() => setImportExportOpen(true)}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />
        <Link
          href="/settings"
          className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs text-text-dim shadow-lg transition hover:text-text"
        >
          <Settings size={14} />
          设置
        </Link>
      </div>

      <DetailPanel
        open={panel.mode !== "closed"}
        mode={panel.mode === "create" ? "create" : "edit"}
        prompt={currentPrompt}
        versions={versions}
        categories={categories}
        onClose={() => setPanel({ mode: "closed" })}
        onCreate={handleCreatePrompt}
        onSaveMeta={handleSaveMeta}
        onSaveWithoutVersion={handleSaveWithoutVersion}
        onSaveAsNewVersion={handleSaveAsNewVersion}
        onSetVersionAsCurrent={handleSetVersionAsCurrent}
        onDelete={setDeletingPromptId}
        onToggleFavorite={handleToggleFavorite}
        onCreateCategory={handleCreateCategory}
      />

      <ImportExportPanel
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        currentFilteredIds={exportScopeIds}
        totalCount={prompts.length}
        onImported={handleImported}
      />

      <ConfirmDialog
        open={deletingPromptId !== null}
        title="删除提示词"
        description="删除后将无法恢复，包括其全部版本历史。确定要删除吗？"
        confirmLabel="删除"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPromptId(null)}
      />
    </div>
  );
}
