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
        "flex flex-col gap-1 pb-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-ui-text-primary">
          {title}
        </h1>
        {description && <p className="mt-0.5 text-xs text-ui-text-muted">{description}</p>}
      </div>
      {action && <div className="mt-4 flex items-center gap-2 sm:mt-0">{action}</div>}
    </div>
  );
}
