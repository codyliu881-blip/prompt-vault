import type { NavSelection, Prompt, SortKey } from "@/lib/types";

export function filterAndSortPrompts(
  prompts: Prompt[],
  opts: { nav: NavSelection; keyword: string; tags: string[]; sort: SortKey }
): Prompt[] {
  const kw = opts.keyword.trim().toLowerCase();

  let result = prompts.filter((p) => {
    if (opts.nav.kind === "favorites" && !p.is_favorite) return false;
    if (opts.nav.kind === "type" && p.type !== opts.nav.type) return false;
    if (opts.nav.kind === "category") {
      if (p.type !== opts.nav.type || p.category_id !== opts.nav.categoryId) return false;
    }
    if (opts.nav.kind === "uncategorized") {
      if (p.type !== opts.nav.type || p.category_id !== null) return false;
    }
    if (kw) {
      const haystack = `${p.title} ${p.body} ${p.notes ?? ""} ${p.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    if (opts.tags.length > 0) {
      if (!opts.tags.every((t) => p.tags.includes(t))) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    if (opts.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
    if (opts.sort === "created_at") return b.created_at.localeCompare(a.created_at);
    return b.updated_at.localeCompare(a.updated_at);
  });

  return result;
}
