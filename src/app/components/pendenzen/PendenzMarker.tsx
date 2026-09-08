import { AlertTriangle, CircleCheck } from "lucide-react";
import { type OnboardingAbschnitt, type UnifiedEntry } from "../../../lib/mocks/service-desk-unified";
import { usePendenzen } from "../../../lib/pendenzen/store";
import { isoZuAnzeige } from "../../../lib/datum";

/**
 * Stummer Marker unter den Feldern eines Formularabschnitts.
 *
 * Er ist **Anzeige, kein Bedienelement**: kein Knopf, kein Häkchen, kein Link,
 * der etwas verändert. Er liest den Status der Pendenz, statt ihn aus den
 * Formularfeldern abzuleiten — die Pendenz wird ausschliesslich in der
 * Pendenzenliste bearbeitet.
 *
 * Zwei Zustände:
 * - **offen** — Titel, Begründung, Fälligkeit; bei Sperre zusätzlich der
 *   Sperrsatz und die Fehlerfarbe.
 * - **nicht mehr offen** — Titel und Abschlusstext, ohne Farbakzent.
 */
export function PendenzMarker({ onboardingId, abschnitt }: {
  /** Onboarding, dessen Pendenzen gelten. Ohne Kennung erscheint nichts. */
  onboardingId: string | null;
  abschnitt: OnboardingAbschnitt;
}) {
  const alle = usePendenzen();
  if (!onboardingId) return null;

  const pendenzen = alle.filter(
    e => e.ursprung?.art === "onboarding" && e.ursprung.kennung === onboardingId && e.abschnitt === abschnitt,
  );
  if (pendenzen.length === 0) return null;

  return (
    <div data-abschnitt={abschnitt} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
      {pendenzen.map(p => <MarkerZeile key={p.id} pendenz={p} />)}
    </div>
  );
}

function MarkerZeile({ pendenz: p }: { pendenz: UnifiedEntry }) {
  const offen = p.status !== "erledigt";
  const sperrt = offen && !!p.sperrtVertrag;

  // Farbe nur, wo sie etwas bedeutet: Fehlerfarbe bei Sperre, sonst neutral.
  const rahmen = sperrt ? "var(--status-danger)" : offen ? "var(--border-default)" : "var(--border-light)";
  const flaeche = sperrt ? "var(--status-danger-bg)" : offen ? "var(--bg-secondary)" : "transparent";
  const titelFarbe = sperrt ? "var(--status-danger-text)" : "var(--text-primary)";

  return (
    <div className="flex items-start" style={{
      gap: 8, padding: "10px 12px", borderRadius: "var(--radius-card)",
      background: flaeche, border: `var(--border-thin) solid ${rahmen}`,
    }}>
      {offen
        ? <AlertTriangle style={{ width: 14, height: 14, color: sperrt ? "var(--status-danger)" : "var(--text-tertiary)", flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
        : <CircleCheck style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 1 }} aria-hidden="true" />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: offen ? titelFarbe : "var(--text-secondary)" }}>
          {p.betreff}
        </div>
        {offen ? (
          <>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>
              {p.kontext}
            </div>
            {sperrt && (
              <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger-text)", marginTop: 2, fontWeight: "var(--weight-medium)" }}>
                Diese Pendenz sperrt den Vertragsschritt.
              </div>
            )}
            {p.faellig && (
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                Fällig {isoZuAnzeige(p.faellig)}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2, lineHeight: 1.5 }}>
            {p.abschlussText || "Erledigt."}
          </div>
        )}
      </div>
    </div>
  );
}
