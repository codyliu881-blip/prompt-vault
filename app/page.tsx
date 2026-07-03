import { fetchCategories, fetchPrompts } from "@/lib/data";
import { AppShell } from "@/components/app-shell";

// 数据随时可能变化，禁止静态预渲染/缓存
export const dynamic = "force-dynamic";

async function loadInitialData() {
  try {
    const [categories, prompts] = await Promise.all([fetchCategories(), fetchPrompts()]);
    return { categories, prompts, error: null as string | null };
  } catch (error) {
    return {
      categories: [],
      prompts: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default async function Home() {
  const { categories, prompts, error } = await loadInitialData();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="max-w-md rounded-card border border-border bg-surface p-6 text-sm text-text-dim">
          <h1 className="mb-2 text-base font-semibold text-text">尚未连接 Supabase</h1>
          <p>
            请在环境变量中配置 <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code> 与{" "}
            <code className="text-accent">SUPABASE_SERVICE_ROLE_KEY</code>
            ，并在 Supabase 项目中执行 <code className="text-accent">supabase/schema.sql</code>。
          </p>
          <p className="mt-3 text-xs text-danger">{error}</p>
        </div>
      </div>
    );
  }

  return <AppShell initialCategories={categories} initialPrompts={prompts} />;
}
