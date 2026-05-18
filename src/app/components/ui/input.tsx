import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
        "border-[0.5px] border-[var(--border-default)] rounded-[12px]",
        "px-[16px] py-[11px] text-[14px] font-[400]",
        "transition-all outline-none",
        "hover:border-[var(--border-strong)]",
        "focus-visible:border-[var(--brand-primary)] focus-visible:border-[1.5px]",
        "aria-invalid:border-[var(--status-danger)] aria-invalid:border-[1.5px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-[var(--text-primary)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
