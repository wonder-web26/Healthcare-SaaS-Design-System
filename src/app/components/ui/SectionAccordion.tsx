/**
 * SectionAccordion — Shared accordion section pattern for Aktivitäten and InterRAI.
 * Gemäss styleguide.md Sektion 8.12 (konzeptionell).
 *
 * Marker-Slot: Icon (Aktivitäten) or Buchstaben-Badge (InterRAI).
 * Status: leere Sektionen bleiben still (nur Count), vollständig = positives Signal.
 * Sammel-Aktionen leben im Kopf.
 */
import { useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

type SectionStatus = "leer" | "teilweise" | "vollstaendig";

interface SectionAccordionProps {
  /** Unique ID for this section */
  id: string;
  /** Section title */
  titel: string;
  /** Marker slot: icon element for Aktivitäten, letter badge for InterRAI */
  marker?: ReactNode;
  /** Count text, e.g. "3 Items" or "5/8 erfasst" */
  count?: string;
  /** Section completion status */
  status?: SectionStatus;
  /** Whether section starts open */
  defaultOffen?: boolean;
  /** Controlled open state (overrides internal) */
  offen?: boolean;
  /** Callback when toggled */
  onToggle?: (id: string) => void;
  /** Sammel-Aktion im Kopf (z.B. "Alle bestätigen" button) */
  sammelAktion?: ReactNode;
  /** Section content (items) */
  children: ReactNode;
}

export function SectionAccordion({
  id,
  titel,
  marker,
  count,
  status = "leer",
  defaultOffen = false,
  offen,
  onToggle,
  sammelAktion,
  children,
}: SectionAccordionProps) {
  const [internalOffen, setInternalOffen] = useState(defaultOffen);
  const isOffen = offen !== undefined ? offen : internalOffen;

  const handleToggle = () => {
    if (onToggle) onToggle(id);
    else setInternalOffen(!isOffen);
  };

  // Status visual: only show positive signal for vollstaendig
  const statusBg = status === "vollstaendig" ? "var(--status-success)" : "var(--bg-secondary)";
  const statusColor = status === "vollstaendig" ? "var(--text-on-dark)" : "var(--text-tertiary)";

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "0.5px solid var(--border-default)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 6,
    }}>
      {/* Section header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center cursor-pointer"
        style={{ padding: "12px 16px", background: "transparent", border: "none", gap: 10 }}
      >
        {/* Marker slot */}
        {marker ? (
          <div className="shrink-0">{marker}</div>
        ) : (
          <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 999, background: statusBg }}>
            {status === "vollstaendig" ? (
              <Check style={{ width: 14, height: 14, color: statusColor }} />
            ) : (
              <span style={{ fontSize: 12, fontWeight: 500, color: statusColor }}>{id}</span>
            )}
          </div>
        )}

        {/* Title + count */}
        <div className="flex-1 min-w-0 text-left">
          <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{titel}</div>
          {count && <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>{count}</div>}
        </div>

        {/* Sammel-Aktion (stops propagation internally) */}
        {sammelAktion && <div onClick={e => e.stopPropagation()} className="shrink-0">{sammelAktion}</div>}

        {/* Chevron */}
        <ChevronDown style={{ width: 16, height: 16, color: "var(--text-tertiary)", transition: "transform 0.2s", transform: isOffen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </button>

      {/* Content */}
      {isOffen && (
        <div style={{ borderTop: "0.5px solid var(--border-default)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Helper: Buchstaben-Badge für InterRAI ─── */
export function SektionBadge({ buchstabe, status }: { buchstabe: string; status: SectionStatus }) {
  const bg = status === "vollstaendig" ? "var(--status-success)" : "var(--brand-primary-light)";
  const color = status === "vollstaendig" ? "var(--text-on-dark)" : "var(--brand-primary)";
  return (
    <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 999, background: bg }}>
      {status === "vollstaendig" ? <Check style={{ width: 14, height: 14, color }} /> : <span style={{ fontSize: 13, fontWeight: 600, color }}>{buchstabe}</span>}
    </div>
  );
}

/* ── Helper: Icon-Marker für Aktivitäten ─── */
export function IconMarker({ icon: Icon, status }: { icon: React.ElementType; status: SectionStatus }) {
  const bg = status === "vollstaendig" ? "var(--status-success-bg)" : "var(--bg-secondary)";
  const color = status === "vollstaendig" ? "var(--status-success)" : "var(--text-tertiary)";
  return (
    <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 999, background: bg }}>
      <Icon style={{ width: 14, height: 14, color }} />
    </div>
  );
}
