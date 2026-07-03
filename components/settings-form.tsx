"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import {
  DEFAULT_VIDEO_TEST_URL,
  getVideoTestUrl,
  setVideoTestUrl,
  subscribeVideoTestUrl,
} from "@/lib/settings";
import { ImportExportPanel } from "@/components/import-export-panel";

export function SettingsForm({ totalCount }: { totalCount: number }) {
  const savedVideoUrl = useSyncExternalStore(
    subscribeVideoTestUrl,
    getVideoTestUrl,
    () => DEFAULT_VIDEO_TEST_URL
  );
  const [draftVideoUrl, setDraftVideoUrl] = useState<string | null>(null);
  const videoUrl = draftVideoUrl ?? savedVideoUrl;
  const [importExportOpen, setImportExportOpen] = useState(false);

  function handleSave() {
    setVideoTestUrl(videoUrl);
    setDraftVideoUrl(null);
    toast.success("已保存设置");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim transition hover:text-text"
      >
        <ArrowLeft size={15} />
        返回
      </Link>

      <h1 className="text-lg font-semibold text-text">设置</h1>

      <section className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-text">视频测试跳转地址</h2>
        <p className="mt-1 text-xs text-text-dim">
          点击提示词的「测试」按钮时，视频类提示词会复制正文并跳转到此地址。
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={videoUrl}
            onChange={(e) => setDraftVideoUrl(e.target.value)}
            className="flex-1 rounded-btn border border-border bg-card px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <button
            onClick={handleSave}
            className="rounded-btn bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:brightness-110"
          >
            保存
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-text">导入 / 导出</h2>
        <p className="mt-1 text-xs text-text-dim">备份全部提示词，或从其他设备导入。</p>
        <button
          onClick={() => setImportExportOpen(true)}
          className="mt-3 flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 text-sm text-text transition hover:bg-card"
        >
          <Upload size={15} />
          打开导入 / 导出
        </button>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-5 opacity-60">
        <h2 className="text-sm font-medium text-text">API 直调（v2，暂未启用）</h2>
        <p className="mt-1 text-xs text-text-dim">
          API 为独立计费，与 ChatGPT Plus / 即梦会员额度无关。
        </p>
        <div className="mt-3 space-y-2">
          <input
            disabled
            placeholder="OpenAI API Key"
            className="w-full cursor-not-allowed rounded-btn border border-border bg-card px-3 py-2 text-sm text-text-dim outline-none"
          />
          <input
            disabled
            placeholder="火山方舟 API Key"
            className="w-full cursor-not-allowed rounded-btn border border-border bg-card px-3 py-2 text-sm text-text-dim outline-none"
          />
        </div>
      </section>

      <ImportExportPanel
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        currentFilteredIds={[]}
        totalCount={totalCount}
        allowFilteredScope={false}
        onImported={() => {
          window.location.href = "/";
        }}
      />
    </div>
  );
}
