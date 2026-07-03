"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Copy, Check, Star, Pencil, Trash2, Play } from "lucide-react";
import type { Category, Prompt } from "@/lib/types";
import { testPrompt } from "@/lib/test-prompt";

const TYPE_ACCENT: Record<Prompt["type"], string> = {
  image: "bg-image",
  video: "bg-video",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function PromptCard({
  prompt,
  category,
  onOpen,
  onToggleFavorite,
  onDelete,
}: {
  prompt: Prompt;
  category: Category | null;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleTest(e: React.MouseEvent) {
    e.stopPropagation();
    await testPrompt(prompt);
  }

  return (
    <motion.div
      layout={!reduceMotion}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      onClick={onOpen}
      className="group relative flex cursor-pointer overflow-hidden rounded-card border border-border bg-card transition-colors hover:bg-card-hover"
    >
      <span className={`w-[3px] shrink-0 ${TYPE_ACCENT[prompt.type]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-medium text-text">{prompt.title}</h3>
          <span className="shrink-0 text-xs text-text-dim">{formatDate(prompt.updated_at)}</span>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-text-dim">{prompt.body}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {category && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-dim">
              {category.name}
            </span>
          )}
          {prompt.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-bg px-2 py-0.5 text-xs text-text-dim"
            >
              #{t}
            </span>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-1">
          <ActionButton label="复制" onClick={handleCopy}>
            {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
          </ActionButton>
          <ActionButton label="收藏" onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
            <motion.span
              key={prompt.is_favorite ? "on" : "off"}
              initial={reduceMotion ? undefined : { scale: 1 }}
              animate={reduceMotion ? undefined : { scale: [1, 1.3, 1] }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex"
            >
              <Star
                size={15}
                className={prompt.is_favorite ? "fill-accent text-accent" : "text-text-dim"}
              />
            </motion.span>
          </ActionButton>
          <ActionButton label="编辑" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <Pencil size={15} />
          </ActionButton>
          <ActionButton label="删除" onClick={(e) => { e.stopPropagation(); onDelete(); }} danger>
            <Trash2 size={15} />
          </ActionButton>
          <ActionButton label="测试" onClick={handleTest}>
            <Play size={15} />
          </ActionButton>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-btn px-2 py-1.5 text-xs text-text-dim transition hover:bg-bg ${
        danger ? "hover:text-danger" : "hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
