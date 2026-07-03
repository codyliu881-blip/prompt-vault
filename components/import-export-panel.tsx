"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { exportCsv, exportJson, exportMarkdown } from "@/lib/actions/export";
import { importCsv, importJson, type ImportStrategy } from "@/lib/actions/import";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExportPanel({
  open,
  onClose,
  currentFilteredIds,
  totalCount,
  onImported,
  allowFilteredScope = true,
}: {
  open: boolean;
  onClose: () => void;
  currentFilteredIds: string[];
  totalCount: number;
  onImported: () => void;
  allowFilteredScope?: boolean;
}) {
  const [tab, setTab] = useState<"export" | "import">("export");
  const [scope, setScope] = useState<"all" | "filtered">("all");
  const [exporting, setExporting] = useState(false);
  const [strategy, setStrategy] = useState<ImportStrategy>("keep-both");
  const [importing, setImporting] = useState(false);

  async function handleExport(format: "json" | "markdown" | "csv") {
    setExporting(true);
    try {
      const ids = scope === "filtered" ? currentFilteredIds : undefined;
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "json") {
        download(`promptvault-${stamp}.json`, await exportJson(ids), "application/json");
      } else if (format === "markdown") {
        download(`promptvault-${stamp}.md`, await exportMarkdown(ids), "text/markdown");
      } else {
        download(`promptvault-${stamp}.csv`, await exportCsv(ids), "text/csv");
      }
      toast.success("导出完成");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const result = isCsv ? await importCsv(text) : await importJson(text, strategy);
      toast.success(`导入完成：新增 ${result.created}，覆盖 ${result.updated}，跳过 ${result.skipped}`);
      onImported();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导入失败");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="导入 / 导出" widthClassName="max-w-lg">
      <div className="mb-4 flex gap-1 rounded-btn bg-card p-1 text-sm">
        <button
          onClick={() => setTab("export")}
          className={`flex-1 rounded-btn py-1.5 transition ${
            tab === "export" ? "bg-accent text-accent-fg" : "text-text-dim"
          }`}
        >
          导出
        </button>
        <button
          onClick={() => setTab("import")}
          className={`flex-1 rounded-btn py-1.5 transition ${
            tab === "import" ? "bg-accent text-accent-fg" : "text-text-dim"
          }`}
        >
          导入
        </button>
      </div>

      {tab === "export" ? (
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs text-text-dim">导出范围</div>
            <div className="flex gap-2 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                全部（{totalCount}）
              </label>
              {allowFilteredScope && (
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={scope === "filtered"}
                    onChange={() => setScope("filtered")}
                  />
                  当前筛选结果（{currentFilteredIds.length}）
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              disabled={exporting}
              onClick={() => handleExport("json")}
              className="w-full rounded-btn border border-border px-3 py-2 text-left text-sm text-text transition hover:bg-card disabled:opacity-50"
            >
              导出为 JSON（完整备份，含版本历史）
            </button>
            <button
              disabled={exporting}
              onClick={() => handleExport("markdown")}
              className="w-full rounded-btn border border-border px-3 py-2 text-left text-sm text-text transition hover:bg-card disabled:opacity-50"
            >
              导出为 Markdown（阅读 / 迁移）
            </button>
            <button
              disabled={exporting}
              onClick={() => handleExport("csv")}
              className="w-full rounded-btn border border-border px-3 py-2 text-left text-sm text-text transition hover:bg-card disabled:opacity-50"
            >
              导出为 CSV（表格，仅当前版本）
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs text-text-dim">JSON 导入时，同标题 + 同类型条目的处理方式</div>
            <div className="flex flex-col gap-1.5 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={strategy === "keep-both"}
                  onChange={() => setStrategy("keep-both")}
                />
                保留两者（默认）
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={strategy === "overwrite"}
                  onChange={() => setStrategy("overwrite")}
                />
                覆盖已有条目
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={strategy === "skip"}
                  onChange={() => setStrategy("skip")}
                />
                跳过
              </label>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-btn border border-dashed border-border px-3 py-6 text-sm text-text-dim transition hover:border-accent hover:text-text">
            {importing ? "导入中…" : "点击选择 .json 或 .csv 文件"}
            <input
              type="file"
              accept=".json,.csv"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <p className="text-xs text-text-dim">
            Markdown 格式暂不支持导入。CSV 导入的每条提示词只有单一版本（原始版）。
          </p>
        </div>
      )}
    </Modal>
  );
}
