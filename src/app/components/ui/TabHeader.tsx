/**
 * TabHeader — Einheitliche Kopfzeile für jeden Inhalts-Tab im Workspace.
 * Gemäss styleguide.md Sektion 8.11.
 *
 * Grammatik: Titel links (optional Status-Pill) | HeaderMeta rechts | Primär-Aktion rechts aussen
 */
import type { ReactNode } from "react";

interface TabHeaderProps {
  /** Tab-Titel (z.B. "InterRAI", "KLV-Leistungen") */
  titel: string;
  /** Optional: Status-Pill neben dem Titel (z.B. "Entwurf") */
  statusPill?: ReactNode;
  /** HeaderMeta-Slot — use <HeaderMeta> component */
  meta?: ReactNode;
  /** Höchstens eine Primär-Aktion rechts aussen */
  aktion?: ReactNode;
}

export function TabHeader({ titel, statusPill, meta, aktion }: TabHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <span style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>{titel}</span>
        {statusPill}
      </div>
      <div className="flex items-center" style={{ gap: 12 }}>
        {meta}
        {aktion}
      </div>
    </div>
  );
}

/* ── HeaderMeta ──────────────────────── */

interface HeaderMetaFortschrittProps {
  modus: "fortschritt";
  /** z.B. "X von Y Kategorien erfasst" */
  text: string;
  /** 0–100 */
  prozent: number;
}

interface HeaderMetaZusammenfassungProps {
  modus: "zusammenfassung";
  /** z.B. "24 Items erfasst" or "4 Diagnosen · 8 Massnahmen" */
  text: string;
}

type HeaderMetaProps = HeaderMetaFortschrittProps | HeaderMetaZusammenfassungProps;

export function HeaderMeta(props: HeaderMetaProps) {
  if (props.modus === "fortschritt") {
    return (
      <div className="flex items-center" style={{ gap: 8 }}>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{props.text}</span>
        <div style={{ width: 64, height: 4, borderRadius: 999, background: "var(--bg-secondary)", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, props.prozent))}%`, borderRadius: 999, background: "var(--brand-primary)", transition: "width 0.3s" }} />
        </div>
      </div>
    );
  }

  return (
    <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{props.text}</span>
  );
}
