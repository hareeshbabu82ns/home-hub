/**
 * Empty State Component
 * Reusable component for displaying empty states
 */

interface EmptyStateProps {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  message,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <p className="font-medium text-lg">{message}</p>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="text-primary mt-4 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
