"use client";

import { useAppStore } from "@/store/useAppStore";
import type { ToastVariant } from "@/store/useAppStore";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "bg-green-50 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200",
  error:
    "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200",
  warning:
    "bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200",
  info: "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-[slideIn_0.2s_ease-out] ${VARIANT_STYLES[t.variant]}`}
          role="alert"
        >
          <span className="text-base font-bold">{VARIANT_ICONS[t.variant]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
