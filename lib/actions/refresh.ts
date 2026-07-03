"use server";

import { fetchCategories, fetchPrompts } from "@/lib/data";
import type { Category, Prompt } from "@/lib/types";

export async function getAllData(): Promise<{ categories: Category[]; prompts: Prompt[] }> {
  const [categories, prompts] = await Promise.all([fetchCategories(), fetchPrompts()]);
  return { categories, prompts };
}
