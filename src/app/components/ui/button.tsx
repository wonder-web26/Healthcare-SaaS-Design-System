import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[14px] font-[500] transition-all outline-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 cursor-pointer focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/20",
  {
    variants: {
      variant: {
        // Primary: Malachit pill
        default:
          "bg-[var(--brand-primary)] text-[var(--text-on-dark)] border-none rounded-[999px] hover:bg-[var(--brand-primary-dark)]",
        // Secondary: white outline pill
        secondary:
          "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[0.5px] border-[var(--text-primary)] rounded-[999px] hover:bg-[var(--bg-secondary)]",
        // Tertiary: text-only pill
        ghost:
          "bg-transparent text-[var(--text-primary)] border-none rounded-[999px] hover:bg-[var(--bg-secondary)]",
        // Outline → maps to secondary
        outline:
          "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[0.5px] border-[var(--text-primary)] rounded-[999px] hover:bg-[var(--bg-secondary)]",
        // Destructive: danger pill
        destructive:
          "bg-[var(--status-danger)] text-[var(--text-on-dark)] border-none rounded-[999px] hover:bg-[var(--status-danger)]/90",
        // Link → maps to tertiary
        link:
          "bg-transparent text-[var(--brand-accent)] border-none rounded-[999px] underline-offset-4 hover:underline",
        // Anna: gradient pill
        anna:
          "text-[var(--text-on-dark)] border-none rounded-[999px] hover:opacity-90",
      },
      size: {
        default: "px-[22px] py-[10px]",
        sm: "px-[16px] py-[7px] text-[13px] gap-1.5",
        lg: "px-[28px] py-[12px] text-[15px]",
        icon: "w-[36px] h-[36px] p-0 bg-[var(--bg-elevated)] border-[0.5px] border-[var(--border-default)] rounded-[999px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const isAnna = variant === "anna";
  const annaStyle = isAnna
    ? { background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))", ...style }
    : style;

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        props.disabled && "!bg-transparent !text-[var(--text-tertiary)] !cursor-not-allowed !border-none"
      )}
      style={annaStyle}
      {...props}
    />
  );
}

export { Button, buttonVariants };
