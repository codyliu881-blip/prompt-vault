import { fetchPrompts } from "@/lib/data";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let totalCount = 0;
  try {
    totalCount = (await fetchPrompts()).length;
  } catch {
    // Supabase 未配置时忽略，允许仍能查看设置页
  }

  return <SettingsForm totalCount={totalCount} />;
}
