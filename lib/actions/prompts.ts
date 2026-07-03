"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { Prompt, PromptType } from "@/lib/types";

export type CreatePromptInput = {
  title: string;
  body: string;
  type: PromptType;
  category_id: string | null;
  tags: string[];
  source_url: string | null;
  notes: string | null;
};

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("标题不能为空");
  if (!body) throw new Error("正文不能为空");

  const sb = supabaseServer();
  const { data: prompt, error } = await sb
    .from("prompts")
    .insert({
      title,
      body,
      type: input.type,
      category_id: input.category_id,
      tags: input.tags,
      source_url: input.source_url || null,
      notes: input.notes || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: versionError } = await sb.from("prompt_versions").insert({
    prompt_id: prompt.id,
    version_no: 1,
    label: "原始版",
    body,
  });
  if (versionError) throw new Error(versionError.message);

  return prompt as Prompt;
}

export type UpdatePromptMetaInput = Partial<{
  title: string;
  type: PromptType;
  category_id: string | null;
  tags: string[];
  source_url: string | null;
  notes: string | null;
}>;

export async function updatePromptMeta(
  id: string,
  patch: UpdatePromptMetaInput
): Promise<Prompt> {
  const payload: UpdatePromptMetaInput & { updated_at: string } = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  if (typeof payload.title === "string") {
    const trimmed = payload.title.trim();
    if (!trimmed) throw new Error("标题不能为空");
    payload.title = trimmed;
  }

  const { data, error } = await supabaseServer()
    .from("prompts")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Prompt;
}

export async function toggleFavorite(id: string, value: boolean): Promise<void> {
  const { error } = await supabaseServer()
    .from("prompts")
    .update({ is_favorite: value })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabaseServer().from("prompts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

