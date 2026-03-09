import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Primary heading shown below the icon */
  title: string;
  /** Optional supporting description */
  description?: string;
  /** Optional action button content */
  action?: React.ReactNode;
  /** Optional icon element (defaults to a generic box icon) */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState
 * Displayed when a list or data set has no items to show.
 */
export default function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 text-gray-300 dark:text-gray-600">
        {icon ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 3H8L6 7h12l-2-4z"
            />
          </svg>
        )}
      </div>

      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </p>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 max-w-xs">
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
