"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { toCsvRow } from "@/lib/csv";
import type { Category, Prompt, PromptVersion } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = { image: "作图", video: "视频" };

async function loadExportData(promptIds?: string[]) {
  const sb = supabaseServer();
  const { data: categories, error: catError } = await sb
    .from("categories")
    .select("*")
    .order("type")
    .order("sort_order");
  if (catError) throw new Error(catError.message);

  let promptQuery = sb.from("prompts").select("*").order("type").order("created_at");
  if (promptIds && promptIds.length > 0) {
    promptQuery = promptQuery.in("id", promptIds);
  }
  const { data: prompts, error: promptError } = await promptQuery;
  if (promptError) throw new Error(promptError.message);

  const ids = (prompts ?? []).map((p) => p.id);
  let versions: PromptVersion[] = [];
  if (ids.length > 0) {
    const { data: versionData, error: versionError } = await sb
      .from("prompt_versions")
      .select("*")
      .in("prompt_id", ids)
      .order("version_no");
    if (versionError) throw new Error(versionError.message);
    versions = (versionData ?? []) as PromptVersion[];
  }

  return {
    categories: (categories ?? []) as Category[],
    prompts: (prompts ?? []) as Prompt[],
    versions,
  };
}

export async function exportJson(promptIds?: string[]): Promise<string> {
  const { categories, prompts, versions } = await loadExportData(promptIds);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const versionsByPrompt = new Map<string, PromptVersion[]>();
  for (const v of versions) {
    const arr = versionsByPrompt.get(v.prompt_id) ?? [];
    arr.push(v);
    versionsByPrompt.set(v.prompt_id, arr);
  }

  const payload = {
    exported_at: new Date().toISOString(),
    app: "PromptVault",
    schema_version: 1,
    categories: categories.map((c) => ({
      type: c.type,
      name: c.name,
      sort_order: c.sort_order,
    })),
    prompts: prompts.map((p) => ({
      title: p.title,
      body: p.body,
      type: p.type,
      category: p.category_id ? categoryById.get(p.category_id)?.name ?? null : null,
      tags: p.tags,
      source_url: p.source_url,
      notes: p.notes,
      is_favorite: p.is_favorite,
      created_at: p.created_at,
      updated_at: p.updated_at,
      versions: (versionsByPrompt.get(p.id) ?? []).map((v) => ({
        version_no: v.version_no,
        label: v.label,
        body: v.body,
        created_at: v.created_at,
      })),
    })),
  };

  return JSON.stringify(payload, null, 2);
}

export async function exportCsv(promptIds?: string[]): Promise<string> {
  const { categories, prompts } = await loadExportData(promptIds);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const header = toCsvRow([
    "title",
    "body",
    "type",
    "category",
    "tags",
    "source_url",
    "notes",
    "is_favorite",
    "created_at",
  ]);

  const rows = prompts.map((p) =>
    toCsvRow([
      p.title,
      p.body,
      p.type,
      p.category_id ? categoryById.get(p.category_id)?.name ?? "" : "",
      p.tags.join(";"),
      p.source_url ?? "",
      p.notes ?? "",
      String(p.is_favorite),
      p.created_at,
    ])
  );

  return [header, ...rows].join("\n");
}

export async function exportMarkdown(promptIds?: string[]): Promise<string> {
  const { categories, prompts, versions } = await loadExportData(promptIds);
  const versionsByPrompt = new Map<string, PromptVersion[]>();
  for (const v of versions) {
    const arr = versionsByPrompt.get(v.prompt_id) ?? [];
    arr.push(v);
    versionsByPrompt.set(v.prompt_id, arr);
  }

  const lines: string[] = [`# PromptVault 导出`, "", `导出时间：${new Date().toISOString()}`, ""];

  for (const type of ["image", "video"] as const) {
    const typePrompts = prompts.filter((p) => p.type === type);
    if (typePrompts.length === 0) continue;
    lines.push(`## ${TYPE_LABEL[type]}`, "");

    const cats = categories.filter((c) => c.type === type);
    const groups: { id: string | null; name: string }[] = [
      ...cats.map((c) => ({ id: c.id, name: c.name })),
      { id: null, name: "未分类" },
    ];

    for (const group of groups) {
      const groupPrompts = typePrompts.filter((p) => p.category_id === group.id);
      if (groupPrompts.length === 0) continue;
      lines.push(`### ${group.name}`, "");

      for (const p of groupPrompts) {
        lines.push(`#### ${p.title}`, "");
        lines.push(
          `| 字段 | 值 |`,
          `|---|---|`,
          `| 标签 | ${p.tags.join(", ") || "-"} |`,
          `| 收藏 | ${p.is_favorite ? "是" : "否"} |`,
          `| 来源 | ${p.source_url ?? "-"} |`,
          `| 备注 | ${p.notes ?? "-"} |`,
          `| 更新时间 | ${p.updated_at} |`,
          ""
        );
        lines.push("```", p.body, "```", "");

        const pVersions = versionsByPrompt.get(p.id) ?? [];
        if (pVersions.length > 1) {
          lines.push("<details><summary>版本历史</summary>", "");
          for (const v of pVersions) {
            lines.push(`**v${v.version_no} ${v.label}**（${v.created_at}）`, "");
            lines.push("```", v.body, "```", "");
          }
          lines.push("</details>", "");
        }
      }
    }
  }

  return lines.join("\n");
}
