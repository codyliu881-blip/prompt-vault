"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Star,
  LayoutGrid,
  Palette,
  Clapperboard,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import type { Category, NavSelection, Prompt, PromptType } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function countFor(prompts: Prompt[], predicate: (p: Prompt) => boolean) {
  return prompts.reduce((n, p) => (predicate(p) ? n + 1 : n), 0);
}

function navEquals(a: NavSelection, b: NavSelection) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "category" && b.kind === "category") {
    return a.type === b.type && a.categoryId === b.categoryId;
  }
  if (a.kind === "type" && b.kind === "type") return a.type === b.type;
  if (a.kind === "uncategorized" && b.kind === "uncategorized") return a.type === b.type;
  return true;
}

export function Sidebar({
  categories,
  prompts,
  nav,
  onNavChange,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategory,
  mobileOpen,
  onMobileClose,
}: {
  categories: Category[];
  prompts: Prompt[];
  nav: NavSelection;
  onNavChange: (nav: NavSelection) => void;
  onCreateCategory: (type: PromptType, name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (type: PromptType, id: string, direction: "up" | "down") => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const content = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div>
        <div className="px-2 text-xs font-medium uppercase tracking-wide text-text-dim">
          PromptVault
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <NavItem
          active={navEquals(nav, { kind: "favorites" })}
          onClick={() => onNavChange({ kind: "favorites" })}
          icon={<Star size={16} className="text-accent" />}
          label="收藏夹"
          count={countFor(prompts, (p) => p.is_favorite)}
        />
        <NavItem
          active={navEquals(nav, { kind: "all" })}
          onClick={() => onNavChange({ kind: "all" })}
          icon={<LayoutGrid size={16} className="text-text-dim" />}
          label="全部"
          count={prompts.length}
        />
      </nav>

      <TypeSection
        type="image"
        title="作图"
        icon={<Palette size={16} className="text-image" />}
        dotClassName="bg-image"
        categories={categories.filter((c) => c.type === "image")}
        prompts={prompts}
        nav={nav}
        onNavChange={onNavChange}
        onCreateCategory={onCreateCategory}
        onRenameCategory={onRenameCategory}
        onDeleteCategory={onDeleteCategory}
        onReorderCategory={onReorderCategory}
      />

      <TypeSection
        type="video"
        title="视频"
        icon={<Clapperboard size={16} className="text-video" />}
        dotClassName="bg-video"
        categories={categories.filter((c) => c.type === "video")}
        prompts={prompts}
        nav={nav}
        onNavChange={onNavChange}
        onCreateCategory={onCreateCategory}
        onRenameCategory={onRenameCategory}
        onDeleteCategory={onDeleteCategory}
        onReorderCategory={onReorderCategory}
      />
    </div>
  );

  return (
    <>
      {/* 桌面端：固定侧栏 */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
        {content}
      </aside>

      {/* 移动端：抽屉 */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              onClick={onMobileClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 bg-surface shadow-2xl md:hidden"
              initial={{ x: reduceMotion ? 0 : -288 }}
              animate={{ x: 0 }}
              exit={{ x: reduceMotion ? 0 : -288 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={onMobileClose}
                  className="rounded-btn p-2 text-text-dim hover:bg-card hover:text-text"
                  aria-label="关闭菜单"
                >
                  <X size={18} />
                </button>
              </div>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-btn px-2.5 py-2 text-sm transition ${
        active ? "bg-card text-text" : "text-text-dim hover:bg-card/60 hover:text-text"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-xs text-text-dim">{count}</span>
    </button>
  );
}

function TypeSection({
  type,
  title,
  icon,
  dotClassName,
  categories,
  prompts,
  nav,
  onNavChange,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategory,
}: {
  type: PromptType;
  title: string;
  icon: React.ReactNode;
  dotClassName: string;
  categories: Category[];
  prompts: Prompt[];
  nav: NavSelection;
  onNavChange: (nav: NavSelection) => void;
  onCreateCategory: (type: PromptType, name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (type: PromptType, id: string, direction: "up" | "down") => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const uncategorizedCount = countFor(
    prompts,
    (p) => p.type === type && p.category_id === null
  );

  function submitNew() {
    const trimmed = newName.trim();
    if (trimmed) onCreateCategory(type, trimmed);
    setNewName("");
    setAdding(false);
  }

  function submitRename(id: string) {
    const trimmed = editingName.trim();
    if (trimmed) onRenameCategory(id, trimmed);
    setEditingId(null);
  }

  return (
    <div>
      <button
        className={`flex w-full items-center justify-between rounded-btn px-2.5 py-2 text-sm font-medium transition ${
          navEquals(nav, { kind: "type", type }) ? "bg-card text-text" : "text-text hover:bg-card/60"
        }`}
        onClick={() => onNavChange({ kind: "type", type })}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}提示词
        </span>
      </button>

      <div className="mt-1 flex flex-col gap-0.5 pl-3">
        {categories.map((c) => (
          <div key={c.id} className="group flex items-center gap-1">
            {editingId === c.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => submitRename(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename(c.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 rounded-btn border border-accent bg-card px-2 py-1 text-sm text-text outline-none"
              />
            ) : (
              <button
                onDoubleClick={() => {
                  setEditingId(c.id);
                  setEditingName(c.name);
                }}
                onClick={() => onNavChange({ kind: "category", type, categoryId: c.id })}
                className={`flex flex-1 items-center gap-2 rounded-btn px-2.5 py-1.5 text-left text-sm transition ${
                  navEquals(nav, { kind: "category", type, categoryId: c.id })
                    ? "bg-card text-text"
                    : "text-text-dim hover:bg-card/60 hover:text-text"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-text-dim">
                  {countFor(prompts, (p) => p.category_id === c.id)}
                </span>
              </button>
            )}

            <div className="hidden items-center gap-0.5 group-hover:flex">
              <button
                title="上移"
                onClick={() => onReorderCategory(type, c.id, "up")}
                className="rounded p-1 text-text-dim hover:bg-card hover:text-text"
              >
                <ChevronUp size={14} />
              </button>
              <button
                title="下移"
                onClick={() => onReorderCategory(type, c.id, "down")}
                className="rounded p-1 text-text-dim hover:bg-card hover:text-text"
              >
                <ChevronDown size={14} />
              </button>
              <button
                title="重命名"
                onClick={() => {
                  setEditingId(c.id);
                  setEditingName(c.name);
                }}
                className="rounded p-1 text-text-dim hover:bg-card hover:text-text"
              >
                <Pencil size={14} />
              </button>
              <button
                title="删除"
                onClick={() => setDeletingId(c.id)}
                className="rounded p-1 text-text-dim hover:bg-card hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {uncategorizedCount > 0 && (
          <button
            onClick={() => onNavChange({ kind: "uncategorized", type })}
            className={`flex items-center gap-2 rounded-btn px-2.5 py-1.5 text-left text-sm transition ${
              navEquals(nav, { kind: "uncategorized", type })
                ? "bg-card text-text"
                : "text-text-dim hover:bg-card/60 hover:text-text"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-text-dim" />
            <span className="flex-1 truncate">未分类</span>
            <span className="text-xs text-text-dim">{uncategorizedCount}</span>
          </button>
        )}

        {adding ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={submitNew}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNew();
              if (e.key === "Escape") {
                setAdding(false);
                setNewName("");
              }
            }}
            placeholder="分类名称"
            className="rounded-btn border border-accent bg-card px-2 py-1 text-sm text-text outline-none"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-btn px-2.5 py-1.5 text-left text-sm text-text-dim transition hover:bg-card/60 hover:text-text"
          >
            <Plus size={14} />
            新分类
          </button>
        )}
      </div>

      <ConfirmDeleteCategory
        open={deletingId !== null}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) onDeleteCategory(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}

function ConfirmDeleteCategory({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title="删除分类"
      description="删除分类后，该分类下的提示词会归入「未分类」，提示词本身不会被删除。"
      confirmLabel="删除"
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
