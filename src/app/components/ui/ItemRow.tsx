/**
 * ItemRow — Smallest capturable/confirmable unit inside a SectionAccordion.
 * Gemäss styleguide.md Sektion 8.13.
 *
 * Standardizes the frame; the input body varies by data type.
 * Body types: Boolean (Ja/Nein segmented + optional Bemerkung),
 *             Text (input field), Optionen (radio list).
 */
import type { ReactNode } from "react";

interface ItemRowProps {
  /** Optional item marker (empty for Aktivitäten, sub-code for InterRAI) */
  marker?: ReactNode;
  /** Item title / question */
  titel: string;
  /** Optional help text below title */
  hilfstext?: string;
  /** Input body — one of the body type components or custom content */
  children: ReactNode;
  /** Whether this is the last item (no bottom border) */
  last?: boolean;
  /** Optional click handler on the entire row (e.g. for expand/collapse) */
  onClick?: () => void;
}

export function ItemRow({ marker, titel, hilfstext, children, last, onClick }: ItemRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderBottom: last ? "none" : "0.5px solid var(--border-default)",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div className="flex items-start" style={{ gap: 10 }}>
        {marker && <div className="shrink-0" style={{ paddingTop: 2 }}>{marker}</div>}
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", marginBottom: hilfstext ? 2 : 6 }}>{titel}</div>
          {hilfstext && <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 6 }}>{hilfstext}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-Code Marker (InterRAI) ─── */
export function SubCodeMarker({ code }: { code: string }) {
  return (
    <span style={{
      fontSize: "var(--text-meta)",
      fontWeight: 500,
      color: "var(--brand-primary)",
      fontFamily: "monospace",
      minWidth: 32,
      display: "inline-block",
    }}>
      {code}
    </span>
  );
}
