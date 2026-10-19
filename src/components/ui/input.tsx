import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const classStr = typeof className === "string" ? className : "";
    const hasCustomBg = /\bbg-/.test(classStr);
    const hasCustomText = /\btext-/.test(classStr);
    const hasCustomBorder = /\bborder-/.test(classStr);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 min-h-[44px] w-full rounded-lg px-3 py-2 text-base transition-colors focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          !hasCustomBorder && "border border-ui-border",
          !hasCustomBg && "bg-ui-surface",
          !hasCustomText && "text-ui-text-primary",
          !classStr.includes("placeholder:") && "placeholder:text-ui-text-muted",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
