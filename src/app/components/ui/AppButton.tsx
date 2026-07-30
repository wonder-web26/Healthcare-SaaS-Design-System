/**
 * AppButton — the one action-button component for the product.
 *
 * Grundregel: ein Rahmen oder eine Vollfläche bedeutet bedienbar. Vier Varianten,
 * alle mit Höhe --control-height (36), Radius --control-radius (8), Schrift 13,
 * Symbol 16. Beschriftung in normaler Gross-/Kleinschreibung (Grossbuchstabe nur
 * am Wortanfang), daher kein text-transform.
 *
 *   primaer    Vollfläche Dark Sky (--action-primary-bg), helle Schrift, Abstand 16.
 *              Höchstens ein Primärknopf je Ansicht.
 *   sekundaer  Flächenfarbe des Untergrunds, Rahmen 0.5, Abstand 16.
 *   tertiaer   keine Fläche, kein Rahmen, Text in Sekundärfarbe, Abstand 12.
 *   symbol     quadratisch 36×36, Rahmen wie Sekundär; ariaLabel ist Pflicht.
 *
 * Jeder Knopf ist per Tabulator erreichbar und zeigt einen sichtbaren Fokusring
 * (.ui-fokusring, nur bei Tastatur-Fokus).
 */
import type { ElementType, ButtonHTMLAttributes, CSSProperties } from "react";

export type AppButtonVariant = "primaer" | "sekundaer" | "tertiaer" | "symbol";

export interface AppButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: AppButtonVariant;
  /** Leading icon (16px). For variant "symbol" this is the only content. */
  icon?: ElementType;
  /** Trailing icon (16px), e.g. a forward chevron. Ignored for variant "symbol". */
  iconRight?: ElementType;
  /** Extra className on the leading icon (e.g. "animate-spin"). */
  iconClassName?: string;
  /** Required for variant "symbol" (screen-reader name); optional otherwise. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const base: CSSProperties = {
  height: "var(--control-height)",
  borderRadius: "var(--control-radius)",
  fontSize: "var(--text-small)", // 13
  fontWeight: "var(--weight-medium)",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  transition: "background 0.15s ease, color 0.15s ease",
};

function variantStyle(variant: AppButtonVariant): CSSProperties {
  switch (variant) {
    case "primaer":
      return { padding: "0 16px", background: "var(--action-primary-bg)", color: "var(--action-primary-fg)", border: "none" };
    case "sekundaer":
      return { padding: "0 16px", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "var(--border-thin) solid var(--border-default)" };
    case "tertiaer":
      return { padding: "0 12px", background: "transparent", color: "var(--text-secondary)", border: "none" };
    case "symbol":
      return { width: "var(--control-height)", height: "var(--control-height)", padding: 0, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "var(--border-thin) solid var(--border-default)" };
  }
}

function hover(variant: AppButtonVariant, el: HTMLButtonElement, on: boolean) {
  switch (variant) {
    case "primaer":
      el.style.background = on ? "var(--action-primary-bg-hover)" : "var(--action-primary-bg)"; break;
    case "sekundaer":
    case "symbol":
      el.style.background = on ? "var(--bg-secondary)" : "var(--bg-elevated)"; break;
    case "tertiaer":
      el.style.color = on ? "var(--text-primary)" : "var(--text-secondary)"; break;
  }
}

export function AppButton({
  variant = "sekundaer",
  icon: Icon,
  iconRight: IconRight,
  iconClassName,
  ariaLabel,
  children,
  className,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: AppButtonProps) {
  const iconSize = 16;
  return (
    <button
      {...rest}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`ui-fokusring${className ? ` ${className}` : ""}`}
      style={{ ...base, ...variantStyle(variant), ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : null), ...style }}
      onMouseEnter={e => { if (!disabled) hover(variant, e.currentTarget, true); onMouseEnter?.(e); }}
      onMouseLeave={e => { if (!disabled) hover(variant, e.currentTarget, false); onMouseLeave?.(e); }}
    >
      {Icon && <Icon className={iconClassName} style={{ width: iconSize, height: iconSize, flexShrink: 0 }} />}
      {variant !== "symbol" && children}
      {variant !== "symbol" && IconRight && <IconRight style={{ width: iconSize, height: iconSize, flexShrink: 0 }} />}
    </button>
  );
}
