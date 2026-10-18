import * as React from "react";
import { cn } from "@/components/ui/button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-ui-border p-8 text-center bg-ui-surface/50",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ui-canvas text-ui-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ui-text-primary">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-ui-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
