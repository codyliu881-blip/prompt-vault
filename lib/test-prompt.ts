import { toast } from "sonner";
import { getVideoTestUrl } from "@/lib/settings";
import type { Prompt } from "@/lib/types";

const CHATGPT_URL_LIMIT = 1800;

export async function testPrompt(p: Prompt): Promise<void> {
  await navigator.clipboard.writeText(p.body);

  if (p.type === "image") {
    const url = `https://chatgpt.com/?q=${encodeURIComponent(p.body)}`;
    if (url.length <= CHATGPT_URL_LIMIT) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast("已在 ChatGPT 中预填提示词，回车即可生成");
    } else {
      window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
      toast("提示词过长无法预填，已复制到剪贴板，请在 ChatGPT 中粘贴（Ctrl+V）");
    }
  } else {
    window.open(getVideoTestUrl(), "_blank", "noopener,noreferrer");
    toast("提示词已复制，请在打开的页面中粘贴（Ctrl+V）生成");
  }
}
