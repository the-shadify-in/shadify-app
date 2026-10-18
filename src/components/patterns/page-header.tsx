import * as React from "react";
import { cn } from "@/components/ui/button";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6",
        className
      )}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-serif font-medium tracking-tight text-ui-text-primary">
          {title}
        </h1>
        {description && <p className="text-xs text-ui-text-muted mt-0.5">{description}</p>}
      </div>
      {action && <div className="mt-4 sm:mt-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
