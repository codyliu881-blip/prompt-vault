import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Category, Prompt, PromptVersion } from "@/lib/types";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabaseServer()
    .from("categories")
    .select("*")
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function fetchPrompts(): Promise<Prompt[]> {
  const { data, error } = await supabaseServer()
    .from("prompts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Prompt[];
}

export async function fetchPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const { data, error } = await supabaseServer()
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("version_no", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PromptVersion[];
}

export async function fetchAllVersionsByPromptIds(
  promptIds: string[]
): Promise<Record<string, PromptVersion[]>> {
  if (promptIds.length === 0) return {};
  const { data, error } = await supabaseServer()
    .from("prompt_versions")
    .select("*")
    .in("prompt_id", promptIds)
    .order("version_no", { ascending: true });

  if (error) throw new Error(error.message);
  const grouped: Record<string, PromptVersion[]> = {};
  for (const v of (data ?? []) as PromptVersion[]) {
    (grouped[v.prompt_id] ??= []).push(v);
  }
  return grouped;
}
