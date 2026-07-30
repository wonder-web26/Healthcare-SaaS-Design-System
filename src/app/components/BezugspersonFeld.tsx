/**
 * BezugspersonFeld — the shared presentation of a case's Bezugsperson as a
 * FIELD with an empty state, not as running text.
 *
 * Two states, identical geometry so nothing shifts when a person is assigned:
 *   - empty:    a dashed-bordered surface with a plus and "Zuweisen"
 *   - assigned: a solid-bordered surface with an initials circle and the name
 *
 * Genau EIN Bedienelement (§F): ein Klick auf die Fläche öffnet die Auswahl.
 * Kein Winkel, kein Kreuz — das Aufheben der Zuweisung liegt in der Auswahl.
 *
 * `label` ist optional: wo eine Abschnittsüberschrift bereits die Beschriftung
 * trägt (Onboarding-Zustandsspalte), wird es weggelassen; die Patientenansicht
 * nutzt es weiterhin als vorangestellte Beschriftung.
 *
 * `voll` stellt den Chip über die volle Breite (Chip allein in der Zeile); der
 * Name bricht nicht um, sondern wird bei Bedarf mit Ellipse gekürzt.
 */
import { forwardRef } from "react";
import { Plus } from "lucide-react";

export interface BezugspersonFeldProps {
  /** Vorangestellte Beschriftung; null/"" blendet sie aus. */
  label?: string | null;
  /** The assigned person, or null while none is assigned. */
  person: { initialen: string; name: string } | null;
  /** Click to assign or change. When omitted the field is a static, read-only display. */
  onAktivieren?: () => void;
  /** Reflects an open picker (optional, for future affordances). */
  offen?: boolean;
  /** Ref to the interactive surface button — lets the caller return focus on close. */
  surfaceRef?: React.Ref<HTMLButtonElement>;
  /** Full-width chip (chip stands alone on its line). */
  voll?: boolean;
}

const surfaceBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 26,
  padding: "3px 10px",
  borderRadius: "var(--radius-pill)",
  fontSize: "var(--text-meta)",
  fontFamily: "inherit",
  lineHeight: 1.2,
  background: "var(--bg-elevated)",
};

export const BezugspersonFeld = forwardRef<HTMLSpanElement, BezugspersonFeldProps>(function BezugspersonFeld(
  { label = "Bezugsperson", person, onAktivieren, surfaceRef, voll },
  ref,
) {
  const interaktiv = !!onAktivieren;

  const inhalt = person ? (
    <>
      <span
        className="shrink-0 flex items-center justify-center"
        style={{ width: 18, height: 18, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}
      >
        <span style={{ fontSize: 9, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{person.initialen}</span>
      </span>
      {/* Name einzeilig, bei Bedarf gekürzt (bricht nicht um) */}
      <span className="truncate" style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)", minWidth: 0 }}>{person.name}</span>
    </>
  ) : (
    <>
      <Plus style={{ width: 12, height: 12, color: "var(--text-secondary)" }} />
      <span style={{ color: "var(--text-secondary)" }}>Zuweisen</span>
    </>
  );

  const surfaceStyle: React.CSSProperties = {
    ...surfaceBase,
    border: person ? "var(--border-thin) solid var(--border-default)" : "var(--border-thin) dashed var(--border-strong, var(--border-default))",
    cursor: interaktiv ? "pointer" : "default",
    ...(voll ? { width: "100%", justifyContent: "flex-start", minWidth: 0 } : null),
  };

  return (
    <span
      ref={ref}
      className={voll ? "flex items-center" : "inline-flex items-center"}
      style={{ gap: 6, ...(voll ? { width: "100%" } : null) }}
    >
      {label ? <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{label}</span> : null}
      {interaktiv ? (
        <button
          ref={surfaceRef}
          type="button"
          onClick={onAktivieren}
          aria-label={person ? "Bezugsperson ändern" : "Bezugsperson zuweisen"}
          className="ui-fokusring inline-flex items-center"
          style={surfaceStyle}
        >
          {inhalt}
        </button>
      ) : (
        <span className="inline-flex items-center" style={surfaceStyle}>{inhalt}</span>
      )}
    </span>
  );
});
