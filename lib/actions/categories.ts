"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { Category, PromptType } from "@/lib/types";

export async function createCategory(
  type: PromptType,
  name: string
): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");

  const sb = supabaseServer();
  const { data: existing } = await sb
    .from("categories")
    .select("sort_order")
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await sb
    .from("categories")
    .insert({ type, name: trimmed, sort_order: nextOrder })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("该分类名称已存在");
    throw new Error(error.message);
  }
  return data as Category;
}

export async function renameCategory(id: string, name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");

  const { data, error } = await supabaseServer()
    .from("categories")
    .update({ name: trimmed })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("该分类名称已存在");
    throw new Error(error.message);
  }
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const sb = supabaseServer();
  // 分类下的提示词归入「未分类」，提示词本身不删
  const { error: unsetError } = await sb
    .from("prompts")
    .update({ category_id: null })
    .eq("category_id", id);
  if (unsetError) throw new Error(unsetError.message);

  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** orderedIds 是该 type 下分类的最新顺序（客户端已完成上移/下移的换位），这里按下标写回 sort_order */
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const sb = supabaseServer();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      sb.from("categories").update({ sort_order: index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}
