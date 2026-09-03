import { type ReactNode } from "react";
import { X } from "lucide-react";
import { useFensterBreite } from "../ui/DataTable";

interface GroupBoxProps {
  title: string;
  subtitle?: string;
  /** Optionaler Auszeichner rechts neben Titel/Untertitel (z.B. Zulagenart-Chip). */
  badge?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  removeDisabled?: boolean;
  removeDisabledTooltip?: string;
  children: ReactNode;
}

export function GroupBox({ title, subtitle, badge, onRemove, removeLabel = "Entfernen", removeDisabled, removeDisabledTooltip, children }: GroupBoxProps) {
  // Lauf 1c (G/I): unter 1024px stapelt der Kartenkopf — Titel, darunter der
  // Untertitel, darunter der Auszeichner in eigener Zeile; rechts nur das
  // Entfernen-Symbol (Muster J: Nebenaktion als Symbolknopf). Desktop unverändert.
  const istSchmal = useFensterBreite() < 1024;

  const entfernenKnopf = onRemove && (
    <button
      type="button"
      onClick={removeDisabled ? undefined : onRemove}
      disabled={removeDisabled}
      title={removeDisabled ? removeDisabledTooltip : undefined}
      aria-label={istSchmal ? removeLabel : undefined}
      className={istSchmal
        ? "ui-fokusring m1-nebenaktion inline-flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        : "inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"}
      style={istSchmal
        ? { padding: 0, width: 44, height: 44, borderRadius: "var(--radius-pill)", background: "transparent", border: "none", color: "var(--text-secondary)", flexShrink: 0 }
        : { gap: "var(--space-1)", padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
      onMouseEnter={e => { if (!removeDisabled) e.currentTarget.style.background = "var(--bg-tertiary)"; }}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <X style={{ width: istSchmal ? 16 : 14, height: istSchmal ? 16 : 14 }} />
      {!istSchmal && removeLabel}
    </button>
  );

  return (
    <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", padding: "var(--space-5)" }}>
      {istSchmal ? (
        <div className="flex items-start justify-between" style={{ marginBottom: "var(--space-4)", gap: "var(--space-2)" }}>
          <div className="m1-karte-stapel" style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{title}</span>
            {subtitle && <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{subtitle}</span>}
            {badge && <span className="m1-chips-fliessen" style={{ marginTop: 4 }}>{badge}</span>}
          </div>
          {entfernenKnopf}
        </div>
      ) : (
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{title}</span>
            {subtitle && (
              <>
                <span style={{ color: "var(--text-tertiary)" }}>·</span>
                <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{subtitle}</span>
              </>
            )}
            {badge && <span style={{ marginLeft: "var(--space-1)" }}>{badge}</span>}
          </div>
          {entfernenKnopf}
        </div>
      )}
      {children}
    </div>
  );
}
