import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-16 resize-none field-sizing-content",
        "bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
        "border-[0.5px] border-[var(--border-default)] rounded-[12px]",
        "px-[16px] py-[11px] text-[14px] font-[400]",
        "transition-all outline-none",
        "hover:border-[var(--border-strong)]",
        "focus-visible:border-[var(--brand-primary)] focus-visible:border-[1.5px]",
        "aria-invalid:border-[var(--status-danger)] aria-invalid:border-[1.5px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
