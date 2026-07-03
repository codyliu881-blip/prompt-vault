export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-text">PromptVault</h1>
        <p className="mt-1 text-sm text-text-dim">输入访问密码以继续</p>

        <form action="/api/login" method="POST" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <input
              type="password"
              name="password"
              autoFocus
              required
              placeholder="访问密码"
              className="w-full rounded-btn border border-border bg-card px-3 py-2 text-text placeholder:text-text-dim outline-none focus:border-accent"
            />
          </div>
          {hasError && (
            <p className="text-sm text-danger">密码不正确，请重试</p>
          )}
          <button
            type="submit"
            className="w-full rounded-btn bg-accent px-3 py-2 font-medium text-accent-fg transition hover:brightness-110"
          >
            进入
          </button>
        </form>
      </div>
    </div>
  );
}
