import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden rounded-[999px]",
  {
    variants: {
      variant: {
        // Status pills (with bullet dot) — use with data-status attribute for colors
        default:
          "gap-1.5 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
        // Category tags — neutral, no bullet
        secondary:
          "gap-1 px-[12px] py-[3px] text-[12px] font-[400] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
        // Destructive status
        destructive:
          "gap-1.5 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
        // Outline (legacy compat)
        outline:
          "gap-1 px-[12px] py-[3px] text-[12px] font-[400] border-[0.5px] border-[var(--border-default)] text-[var(--text-primary)]",
        // Filter chip — dark background, white text, with X
        filter:
          "gap-[8px] pl-[14px] pr-[10px] py-[6px] text-[12px] font-[500] bg-[var(--text-primary)] text-[var(--text-on-dark)] cursor-pointer",
        // Accent: primary
        "accent-primary":
          "gap-1 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--brand-primary)] text-[var(--text-on-dark)]",
        // Accent: secondary (light brand bg)
        "accent-secondary":
          "gap-1 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]",
        // Accent: info
        "accent-info":
          "gap-1 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--brand-accent-light)] text-[var(--status-info)]",
        // Status-specific presets
        success:
          "gap-1.5 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
        warning:
          "gap-1.5 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
        info:
          "gap-1.5 px-[12px] py-[4px] text-[12px] font-[500] bg-[var(--status-info-bg)] text-[var(--status-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
