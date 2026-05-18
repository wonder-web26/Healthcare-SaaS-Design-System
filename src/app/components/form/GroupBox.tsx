import { type ReactNode } from "react";
import { X } from "lucide-react";

interface GroupBoxProps {
  title: string;
  subtitle?: string;
  onRemove?: () => void;
  removeLabel?: string;
  removeDisabled?: boolean;
  removeDisabledTooltip?: string;
  children: ReactNode;
}

export function GroupBox({ title, subtitle, onRemove, removeLabel = "Entfernen", removeDisabled, removeDisabledTooltip, children }: GroupBoxProps) {
  return (
    <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", padding: "var(--space-5)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{title}</span>
          {subtitle && (
            <>
              <span style={{ color: "var(--text-tertiary)" }}>·</span>
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{subtitle}</span>
            </>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={removeDisabled ? undefined : onRemove}
            disabled={removeDisabled}
            title={removeDisabled ? removeDisabledTooltip : undefined}
            className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ gap: "var(--space-1)", padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
            onMouseEnter={e => { if (!removeDisabled) e.currentTarget.style.background = "var(--bg-tertiary)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: 14, height: 14 }} />
            {removeLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
