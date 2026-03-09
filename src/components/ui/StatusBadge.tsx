import { cn } from "@/lib/utils";

type StatusVariant =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "LOW_STOCK"
  | "IN_STOCK";

const VARIANT_STYLES: Record<StatusVariant, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  LOW_STOCK: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  IN_STOCK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const VARIANT_LABELS: Record<StatusVariant, string> = {
  PENDING: "대기",
  CONFIRMED: "확정",
  COMPLETED: "완료",
  CANCELLED: "취소",
  LOW_STOCK: "재고 부족",
  IN_STOCK: "정상",
};

interface StatusBadgeProps {
  status: StatusVariant;
  /** Override the default label for this status */
  label?: string;
  className?: string;
}

/**
 * StatusBadge
 * A colored label pill representing the status of a reservation or inventory item.
 */
export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        VARIANT_STYLES[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {label ?? VARIANT_LABELS[status] ?? status}
    </span>
  );
}

export type { StatusVariant };
