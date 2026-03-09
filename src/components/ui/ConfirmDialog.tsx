"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Set to true to style the confirm button as a destructive action */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog
 * A modal overlay that asks the user to confirm or cancel an action.
 * Replaces window.confirm() with a styled, accessible alternative.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-lg p-6 mx-4 dark:bg-gray-900">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2"
        >
          {title}
        </h2>

        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? "px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                : "px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
