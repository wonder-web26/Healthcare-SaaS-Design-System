/**
 * BezugspersonFeld — the shared presentation of a case's Bezugsperson as a
 * FIELD with an empty state, not as running text.
 *
 * Two states, identical geometry so nothing shifts when a person is assigned:
 *   - empty:    label + a dashed-bordered surface with a plus and "Zuweisen"
 *   - assigned: label + a solid-bordered surface with an initials circle and name
 *
 * The label always precedes the value. The surface differs from the surrounding
 * text by at least two signals (border + filled background + rounded shape) —
 * never by colour alone — and is reachable by keyboard when interactive.
 *
 * This is purely the presentation. Data and the assign/change/remove wiring live
 * in the caller: the onboarding header drives it from the care-relationship
 * store via a search popover; the patient dossier renders it read-only. Both use
 * this one component so the look is defined once.
 */
import { forwardRef } from "react";
import { Plus, ChevronDown, X } from "lucide-react";

export interface BezugspersonFeldProps {
  label?: string;
  /** The assigned person, or null while none is assigned. */
  person: { initialen: string; name: string } | null;
  /** Click to assign or change. When omitted the field is a static, read-only display. */
  onAktivieren?: () => void;
  /** Optional remove action (only shown when assigned and interactive). */
  onEntfernen?: () => void;
  /** Reflects an open picker — rotates the chevron; optional. */
  offen?: boolean;
}

// Constant geometry across both states — border WIDTH never changes, only its
// style/colour and the content, so assigning a person never nudges the layout.
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
  { label = "Bezugsperson", person, onAktivieren, onEntfernen, offen },
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
      <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{person.name}</span>
      {interaktiv && <ChevronDown style={{ width: 11, height: 11, opacity: 0.7, transform: offen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />}
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
  };

  return (
    <span ref={ref} className="inline-flex items-center" style={{ gap: 6 }}>
      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{label}</span>
      {interaktiv ? (
        <button
          type="button"
          onClick={onAktivieren}
          aria-label={person ? "Bezugsperson ändern" : "Bezugsperson zuweisen"}
          className="inline-flex items-center"
          style={surfaceStyle}
        >
          {inhalt}
        </button>
      ) : (
        <span className="inline-flex items-center" style={surfaceStyle}>{inhalt}</span>
      )}
      {interaktiv && person && onEntfernen && (
        <button
          type="button"
          onClick={onEntfernen}
          title="Bezugsperson entfernen"
          aria-label="Bezugsperson entfernen"
          className="inline-flex items-center cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, color: "var(--text-tertiary)" }}
        >
          <X style={{ width: 11, height: 11 }} />
        </button>
      )}
    </span>
  );
});
