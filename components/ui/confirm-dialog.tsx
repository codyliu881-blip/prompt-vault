"use client";

import { Modal } from "@/components/ui/modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-text-dim">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-btn border border-border px-3 py-1.5 text-sm text-text transition hover:bg-card"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-btn px-3 py-1.5 text-sm font-medium transition ${
            danger
              ? "bg-danger text-white hover:brightness-110"
              : "bg-accent text-accent-fg hover:brightness-110"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
