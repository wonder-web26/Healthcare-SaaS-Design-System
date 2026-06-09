/**
 * SectionAction — Ghost-Aktion für Sektions-Header (Ebene 2).
 * Gemäss styleguide.md 8.11 Untersektion "Aktions-Ebenen".
 *
 * Dezenter Ghost-Button: Icon + Verb, text-secondary, kein Rahmen.
 * Wird rechtsbündig in der Sektions-Überschriftszeile platziert.
 * Sektions-Aktionen wandern NIE in den TabHeader.
 */
import type { ReactNode } from "react";

interface SectionActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  /** Active state (e.g. toggle is open) */
  active?: boolean;
  /** Status text replacing the label (e.g. flow status) */
  statusText?: string;
}

export function SectionAction({ icon, label, onClick, active = false, statusText }: SectionActionProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center cursor-pointer"
      style={{
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        background: "transparent",
        border: "none",
        fontSize: "var(--text-meta)",
        fontWeight: 500,
        color: active ? "var(--brand-primary)" : "var(--text-secondary)",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = "var(--text-secondary)"; }}
    >
      {icon}
      {statusText || label}
    </button>
  );
}
