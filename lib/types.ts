export type PromptType = "image" | "video";

export type Category = {
  id: string;
  type: PromptType;
  name: string;
  sort_order: number;
  created_at: string;
};

export type PromptVersion = {
  id: string;
  prompt_id: string;
  version_no: number;
  label: string;
  body: string;
  created_at: string;
};

export type Prompt = {
  id: string;
  title: string;
  body: string;
  type: PromptType;
  category_id: string | null;
  tags: string[];
  source_url: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type PromptWithVersions = Prompt & {
  versions: PromptVersion[];
};

export type SortKey = "updated_at" | "created_at" | "title";

export type NavSelection =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "type"; type: PromptType }
  | { kind: "category"; type: PromptType; categoryId: string }
  | { kind: "uncategorized"; type: PromptType };
