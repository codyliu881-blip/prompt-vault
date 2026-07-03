"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { Prompt, PromptVersion } from "@/lib/types";

export async function listVersions(promptId: string): Promise<PromptVersion[]> {
  const { data, error } = await supabaseServer()
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("version_no", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PromptVersion[];
}

/** 保存修改：不新增版本，覆盖当前最新版本正文 + prompts.body */
export async function saveWithoutNewVersion(
  promptId: string,
  body: string
): Promise<{ prompt: Prompt; version: PromptVersion }> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("正文不能为空");

  const sb = supabaseServer();
  const { data: latest, error: latestError } = await sb
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("version_no", { ascending: false })
    .limit(1)
    .single();
  if (latestError) throw new Error(latestError.message);

  const { data: version, error: versionError } = await sb
    .from("prompt_versions")
    .update({ body: trimmed })
    .eq("id", latest.id)
    .select("*")
    .single();
  if (versionError) throw new Error(versionError.message);

  const { data: prompt, error: promptError } = await sb
    .from("prompts")
    .update({ body: trimmed, updated_at: new Date().toISOString() })
    .eq("id", promptId)
    .select("*")
    .single();
  if (promptError) throw new Error(promptError.message);

  return { prompt: prompt as Prompt, version: version as PromptVersion };
}

/** 保存为新版本：插入新版本记录，prompts.body 更新为新版本正文 */
export async function saveAsNewVersion(
  promptId: string,
  body: string,
  label: string
): Promise<{ prompt: Prompt; version: PromptVersion }> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("正文不能为空");

  const sb = supabaseServer();
  const { data: latest, error: latestError } = await sb
    .from("prompt_versions")
    .select("version_no")
    .eq("prompt_id", promptId)
    .order("version_no", { ascending: false })
    .limit(1)
    .single();
  if (latestError) throw new Error(latestError.message);

  const nextNo = latest.version_no + 1;
  const finalLabel = label.trim() || (nextNo === 2 ? "修改版" : nextNo >= 3 ? "最终版" : "");

  const { data: version, error: versionError } = await sb
    .from("prompt_versions")
    .insert({ prompt_id: promptId, version_no: nextNo, label: finalLabel, body: trimmed })
    .select("*")
    .single();
  if (versionError) throw new Error(versionError.message);

  const { data: prompt, error: promptError } = await sb
    .from("prompts")
    .update({ body: trimmed, updated_at: new Date().toISOString() })
    .eq("id", promptId)
    .select("*")
    .single();
  if (promptError) throw new Error(promptError.message);

  return { prompt: prompt as Prompt, version: version as PromptVersion };
}

/** 将任意历史版本设为当前版：把该版本 body 写回 prompts.body，不删除历史 */
export async function setVersionAsCurrent(
  promptId: string,
  versionId: string
): Promise<Prompt> {
  const sb = supabaseServer();
  const { data: version, error: versionError } = await sb
    .from("prompt_versions")
    .select("body")
    .eq("id", versionId)
    .single();
  if (versionError) throw new Error(versionError.message);

  const { data: prompt, error } = await sb
    .from("prompts")
    .update({ body: version.body, updated_at: new Date().toISOString() })
    .eq("id", promptId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return prompt as Prompt;
}
