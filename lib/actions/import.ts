"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import type { PromptType } from "@/lib/types";

type ImportJsonPrompt = {
  title: string;
  body: string;
  type: PromptType;
  category?: string | null;
  tags?: string[];
  source_url?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
  versions?: { version_no: number; label: string; body: string; created_at?: string }[];
};

type ImportJsonPayload = {
  schema_version?: number;
  categories?: { type: PromptType; name: string; sort_order?: number }[];
  prompts?: ImportJsonPrompt[];
};

export type ImportStrategy = "skip" | "overwrite" | "keep-both";
export type ImportResult = { created: number; updated: number; skipped: number };

async function ensureCategoryId(
  cache: Map<string, string>,
  type: PromptType,
  name: string | null | undefined
): Promise<string | null> {
  if (!name) return null;
  const key = `${type}::${name}`;
  if (cache.has(key)) return cache.get(key)!;

  const sb = supabaseServer();
  const { data: existing } = await sb
    .from("categories")
    .select("id")
    .eq("type", type)
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const { data: created, error } = await sb
    .from("categories")
    .insert({ type, name, sort_order: 999 })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  cache.set(key, created.id);
  return created.id;
}

export async function importJson(
  content: string,
  strategy: ImportStrategy = "keep-both"
): Promise<ImportResult> {
  let payload: ImportJsonPayload;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error("JSON 解析失败，请检查文件格式");
  }
  if (!Array.isArray(payload.prompts)) {
    throw new Error("JSON 结构不正确：缺少 prompts 数组");
  }

  const sb = supabaseServer();
  const categoryCache = new Map<string, string>();
  const result: ImportResult = { created: 0, updated: 0, skipped: 0 };

  for (const p of payload.prompts) {
    if (!p.title?.trim() || !p.body?.trim() || (p.type !== "image" && p.type !== "video")) {
      continue;
    }

    const categoryId = await ensureCategoryId(categoryCache, p.type, p.category);

    const { data: existing } = await sb
      .from("prompts")
      .select("id")
      .eq("title", p.title)
      .eq("type", p.type)
      .maybeSingle();

    if (existing && strategy === "skip") {
      result.skipped++;
      continue;
    }

    if (existing && strategy === "overwrite") {
      const { error: delErr } = await sb.from("prompts").delete().eq("id", existing.id);
      if (delErr) throw new Error(delErr.message);
      result.updated++;
    } else {
      result.created++;
    }

    const { data: inserted, error: insertError } = await sb
      .from("prompts")
      .insert({
        title: p.title,
        body: p.body,
        type: p.type,
        category_id: categoryId,
        tags: p.tags ?? [],
        source_url: p.source_url ?? null,
        notes: p.notes ?? null,
        is_favorite: p.is_favorite ?? false,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    const versions =
      p.versions && p.versions.length > 0
        ? p.versions
        : [{ version_no: 1, label: "原始版", body: p.body }];

    const { error: versionError } = await sb.from("prompt_versions").insert(
      versions.map((v) => ({
        prompt_id: inserted.id,
        version_no: v.version_no,
        label: v.label,
        body: v.body,
      }))
    );
    if (versionError) throw new Error(versionError.message);
  }

  return result;
}

export async function importCsv(content: string): Promise<ImportResult> {
  const rows = parseCsv(content);
  if (rows.length === 0) throw new Error("CSV 文件为空");

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iTitle = idx("title");
  const iBody = idx("body");
  const iType = idx("type");
  if (iTitle === -1 || iBody === -1 || iType === -1) {
    throw new Error("CSV 缺少必要列：title, body, type");
  }
  const iCategory = idx("category");
  const iTags = idx("tags");
  const iSource = idx("source_url");
  const iNotes = idx("notes");
  const iFavorite = idx("is_favorite");

  const sb = supabaseServer();
  const categoryCache = new Map<string, string>();
  const result: ImportResult = { created: 0, updated: 0, skipped: 0 };

  for (const row of rows.slice(1)) {
    const title = row[iTitle]?.trim();
    const body = row[iBody]?.trim();
    const type = row[iType]?.trim() as PromptType;
    if (!title || !body || (type !== "image" && type !== "video")) continue;

    const categoryName = iCategory !== -1 ? row[iCategory]?.trim() : "";
    const categoryId = await ensureCategoryId(categoryCache, type, categoryName || null);
    const tags = iTags !== -1 && row[iTags] ? row[iTags].split(";").map((t) => t.trim()).filter(Boolean) : [];

    const { data: inserted, error } = await sb
      .from("prompts")
      .insert({
        title,
        body,
        type,
        category_id: categoryId,
        tags,
        source_url: iSource !== -1 ? row[iSource]?.trim() || null : null,
        notes: iNotes !== -1 ? row[iNotes]?.trim() || null : null,
        is_favorite: iFavorite !== -1 ? row[iFavorite]?.trim() === "true" : false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: versionError } = await sb
      .from("prompt_versions")
      .insert({ prompt_id: inserted.id, version_no: 1, label: "原始版", body });
    if (versionError) throw new Error(versionError.message);

    result.created++;
  }

  return result;
}
