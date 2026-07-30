import type { ElementType } from "react";

interface SectionHeaderProps {
  /** Beibehalten für bestehende Aufrufstellen — wird nicht mehr gerendert (§C). */
  icon?: ElementType;
  label: string;
  first?: boolean;
}

// §C: Abschnittsüberschrift 14, mittlerer Schnitt, OHNE Symbol und grauen Kreis.
// Die Überschrift ist durch ihren Text eindeutig; ein Symbol im Kreis gäbe ihr das
// Gewicht eines Bedienelements.
export function SectionHeader({ label, first }: SectionHeaderProps) {
  return (
    <div>
      {!first && (
        <div style={{ width: "100%", height: "var(--border-thin)", background: "var(--border-default)", margin: "20px 0 16px" }} />
      )}
      <div style={{ paddingBottom: "var(--space-3)" }}>
        <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{label}</span>
      </div>
    </div>
  );
}
