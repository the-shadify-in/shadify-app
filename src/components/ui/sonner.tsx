"use client";

import * as React from "react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-ui-surface group-[.toaster]:text-ui-text-primary group-[.toaster]:border-ui-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans",
          description: "group-[.toast]:text-ui-text-muted text-xs",
          actionButton:
            "group-[.toast]:bg-ui-primary group-[.toast]:text-ui-onPrimary text-xs font-medium rounded-lg",
          cancelButton:
            "group-[.toast]:bg-ui-surface group-[.toast]:text-ui-text-muted text-xs font-medium rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
