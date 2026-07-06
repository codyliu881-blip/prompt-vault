"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Star, Trash2, Play, Type } from "lucide-react";
import type { Category, Prompt, PromptType, PromptVersion } from "@/lib/types";
import type { CreatePromptInput, UpdatePromptMetaInput } from "@/lib/actions/prompts";
import { VersionHistory } from "@/components/version-history";
import { Modal } from "@/components/ui/modal";
import { testPrompt } from "@/lib/test-prompt";

type Draft = {
  title: string;
  type: PromptType;
  category_id: string | null;
  tags: string[];
  source_url: string;
  notes: string;
  body: string;
};

function emptyDraft(type: PromptType = "image"): Draft {
  return { title: "", type, category_id: null, tags: [], source_url: "", notes: "", body: "" };
}

function draftFromPrompt(p: Prompt): Draft {
  return {
    title: p.title,
    type: p.type,
    category_id: p.category_id,
    tags: p.tags,
    source_url: p.source_url ?? "",
    notes: p.notes ?? "",
    body: p.body,
  };
}

function suggestedVersionLabel(count: number) {
  if (count <= 1) return "修改版";
  return "最终版";
}

type DetailPanelProps = {
  open: boolean;
  mode: "create" | "edit";
  prompt: Prompt | null;
  versions: PromptVersion[] | null;
  categories: Category[];
  onClose: () => void;
  onCreate: (input: CreatePromptInput) => Promise<void>;
  onSaveMeta: (id: string, patch: UpdatePromptMetaInput) => Promise<void>;
  onSaveWithoutVersion: (id: string, body: string) => Promise<void>;
  onSaveAsNewVersion: (id: string, body: string, label: string) => Promise<void>;
  onSetVersionAsCurrent: (id: string, versionId: string) => Promise<void>;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCreateCategory: (type: PromptType, name: string) => Promise<Category>;
};

export function DetailPanel(props: DetailPanelProps) {
  const { open, mode, prompt } = props;
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            onClick={props.onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl sm:w-[520px] lg:w-[600px]"
            initial={{ x: reduceMotion ? 0 : 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduceMotion ? 0 : 24, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            <DetailPanelForm key={`${mode}:${prompt?.id ?? "new"}`} {...props} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailPanelForm({
  mode,
  prompt,
  versions,
  categories,
  onClose,
  onCreate,
  onSaveMeta,
  onSaveWithoutVersion,
  onSaveAsNewVersion,
  onSetVersionAsCurrent,
  onDelete,
  onToggleFavorite,
  onCreateCategory,
}: DetailPanelProps) {
  const [draft, setDraft] = useState<Draft>(() =>
    mode === "create" || !prompt ? emptyDraft() : draftFromPrompt(prompt)
  );
  const [mono, setMono] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [versionLabelPrompt, setVersionLabelPrompt] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft.body]);

  const categoryOptions = categories.filter((c) => c.type === draft.type);

  const titleMissing = mode === "create" && !draft.title.trim();
  const bodyMissing = mode === "create" && !draft.body.trim();

  function addTag() {
    const t = tagInput.trim();
    if (t && !draft.tags.includes(t)) {
      setDraft((d) => ({ ...d, tags: [...d.tags, t] }));
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }));
  }

  async function handleCreateCategoryInline() {
    const name = newCategoryName.trim();
    if (!name) return;
    const cat = await onCreateCategory(draft.type, name);
    setDraft((d) => ({ ...d, category_id: cat.id }));
    setNewCategoryName("");
    setAddingCategory(false);
  }

  async function handleSubmitCreate() {
    setSaving(true);
    try {
      await onCreate({
        title: draft.title,
        body: draft.body,
        type: draft.type,
        category_id: draft.category_id,
        tags: draft.tags,
        source_url: draft.source_url || null,
        notes: draft.notes || null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(asNewVersion: boolean, label?: string) {
    if (!prompt) return;
    setSaving(true);
    try {
      await onSaveMeta(prompt.id, {
        title: draft.title,
        type: draft.type,
        category_id: draft.category_id,
        tags: draft.tags,
        source_url: draft.source_url || null,
        notes: draft.notes || null,
      });
      if (asNewVersion) {
        await onSaveAsNewVersion(prompt.id, draft.body, label ?? "");
      } else {
        await onSaveWithoutVersion(prompt.id, draft.body);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span
          className={`h-2 w-2 rounded-full ${draft.type === "image" ? "bg-image" : "bg-video"}`}
        />
        <select
          value={draft.type}
          onChange={(e) =>
            setDraft((d) => ({ ...d, type: e.target.value as PromptType, category_id: null }))
          }
          className="rounded-btn border border-border bg-card px-2 py-1 text-xs text-text-dim outline-none focus:border-accent"
        >
          <option value="image">作图</option>
          <option value="video">视频</option>
        </select>

        <div className="ml-auto flex items-center gap-1">
          {prompt && (
            <>
              <button
                onClick={() => testPrompt(prompt)}
                title="测试"
                className="rounded-btn p-1.5 text-text-dim transition hover:bg-card hover:text-text"
              >
                <Play size={16} />
              </button>
              <button
                onClick={() => onToggleFavorite(prompt.id)}
                title="收藏"
                className="rounded-btn p-1.5 text-text-dim transition hover:bg-card hover:text-text"
              >
                <Star
                  size={16}
                  className={prompt.is_favorite ? "fill-accent text-accent" : undefined}
                />
              </button>
              <button
                onClick={() => onDelete(prompt.id)}
                title="删除"
                className="rounded-btn p-1.5 text-text-dim transition hover:bg-card hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            title="关闭"
            className="rounded-btn p-1.5 text-text-dim transition hover:bg-card hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="标题（必填）"
          className={`w-full bg-transparent text-lg font-semibold text-text outline-none placeholder:text-text-dim ${
            titleMissing && draft.body.trim()
              ? "border-b border-danger placeholder:text-danger"
              : "border-none"
          }`}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-dim">分类</span>
          {addingCategory ? (
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategoryInline()}
              onBlur={handleCreateCategoryInline}
              placeholder="新分类名称"
              className="rounded-btn border border-accent bg-card px-2 py-1 text-xs text-text outline-none"
            />
          ) : (
            <select
              value={draft.category_id ?? ""}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingCategory(true);
                  return;
                }
                setDraft((d) => ({ ...d, category_id: e.target.value || null }));
              }}
              className="rounded-btn border border-border bg-card px-2 py-1 text-xs text-text-dim outline-none focus:border-accent"
            >
              <option value="">未分类</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">+ 新建分类…</option>
            </select>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {draft.tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-xs text-text-dim"
            >
              #{t}
              <button onClick={() => removeTag(t)} className="hover:text-danger">
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="添加标签，回车确认"
            className="min-w-[8rem] flex-1 border-none bg-transparent text-xs text-text outline-none placeholder:text-text-dim"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-text-dim">正文</span>
          <button
            onClick={() => setMono((m) => !m)}
            title="切换字体"
            className={`flex items-center gap-1 rounded-btn px-2 py-1 text-xs transition ${
              mono ? "bg-card text-accent" : "text-text-dim hover:text-text"
            }`}
          >
            <Type size={13} />
            {mono ? "等宽" : "普通"}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder="粘贴或输入提示词正文…"
          className={`min-h-[50vh] w-full resize-none rounded-btn border border-border bg-card p-3 text-sm leading-relaxed text-text outline-none focus:border-accent ${
            mono ? "font-mono" : "font-sans"
          }`}
        />
        <div className="mt-1 text-right text-xs text-text-dim">{draft.body.length} 字符</div>

        <div className="mt-4 space-y-2">
          <input
            value={draft.source_url}
            onChange={(e) => setDraft((d) => ({ ...d, source_url: e.target.value }))}
            placeholder="来源链接（选填）"
            className="w-full rounded-btn border border-border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-text-dim focus:border-accent"
          />
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="备注（选填）"
            rows={2}
            className="w-full resize-none rounded-btn border border-border bg-card px-3 py-2 text-sm text-text outline-none placeholder:text-text-dim focus:border-accent"
          />
        </div>

        {mode === "edit" && prompt && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-2 text-xs font-medium text-text-dim">版本历史</div>
            {versions ? (
              <VersionHistory
                versions={versions}
                onSetAsCurrent={(versionId) => onSetVersionAsCurrent(prompt.id, versionId)}
              />
            ) : (
              <div className="text-xs text-text-dim">加载中…</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-5 py-3">
        {mode === "create" ? (
          <>
            {!saving && (titleMissing || bodyMissing) && (
              <span className="text-xs text-danger">
                {titleMissing && bodyMissing
                  ? "请填写标题和正文"
                  : titleMissing
                    ? "请填写标题"
                    : "请填写正文"}
              </span>
            )}
            <button
              disabled={saving || titleMissing || bodyMissing}
              onClick={handleSubmitCreate}
              className="ml-auto rounded-btn bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:brightness-110 disabled:opacity-50"
            >
              创建
            </button>
          </>
        ) : (
          <>
            <button
              disabled={saving}
              onClick={() => setVersionLabelPrompt(suggestedVersionLabel(versions?.length ?? 1))}
              className="rounded-btn border border-border px-3 py-2 text-sm text-text transition hover:bg-card disabled:opacity-50"
            >
              保存为新版本
            </button>
            <button
              disabled={saving}
              onClick={() => handleSave(false)}
              className="ml-auto rounded-btn bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:brightness-110 disabled:opacity-50"
            >
              保存修改
            </button>
          </>
        )}
      </div>

      <Modal
        open={versionLabelPrompt !== null}
        onClose={() => setVersionLabelPrompt(null)}
        title="保存为新版本"
      >
        <label className="text-xs text-text-dim">版本标签</label>
        <input
          autoFocus
          value={versionLabelPrompt ?? ""}
          onChange={(e) => setVersionLabelPrompt(e.target.value)}
          className="mt-1 w-full rounded-btn border border-border bg-card px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setVersionLabelPrompt(null)}
            className="rounded-btn border border-border px-3 py-1.5 text-sm text-text transition hover:bg-card"
          >
            取消
          </button>
          <button
            onClick={async () => {
              const label = versionLabelPrompt ?? "";
              setVersionLabelPrompt(null);
              await handleSave(true, label);
            }}
            className="rounded-btn bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition hover:brightness-110"
          >
            确认
          </button>
        </div>
      </Modal>
    </>
  );
}
