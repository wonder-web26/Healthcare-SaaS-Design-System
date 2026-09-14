/**
 * Pflegeplan — Aufbau (Lauf 2): die Ansicht für die Erstplanung.
 *
 * Links der Plan, wie er wächst; rechts die Auswahl zum aktuellen Fokus.
 * Auswählen rechts, Ergebnis links — kein Overlay, kein Seitenwechsel: die
 * Frage «passt diese Diagnose» ist nur beantwortbar, wenn man sieht, was
 * schon im Plan steht. Für den Laptop gebaut; mobil ist ausdrücklich kein
 * Ziel — die Planung findet nicht beim Klienten statt.
 *
 * Eigene Route, bewusst ohne Einbindung in Patient360, Onboarding oder Menü —
 * die Einbindung kommt in einem späteren Lauf.
 */
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, ClipboardList } from "lucide-react";
import { MOCK_ASSESSMENTS } from "../../../lib/mocks/klinische-artefakte-mock";
import { zieleZuDiagnose, interventionenZuZiel } from "../../../lib/pflegeplan/mock-adapter";
import { usePlan } from "../../../lib/pflegeplan/plan-store";
import { getPatient } from "../../../lib/patienten/store";
import { PlanBaum } from "./PlanBaum";
import { AuswahlBereich } from "./AuswahlBereich";
import type { Fokus } from "./gemeinsam";

/**
 * Der geführte Einstieg: rechnet sich aus dem Planzustand und sagt immer, was
 * als Nächstes dran ist. Er schlägt vor, er zwingt nicht.
 *
 * Übersprungen werden Diagnosen ohne hinterlegte Ziele (dort ist «kein Ziel»
 * der Normalfall, kein offener Schritt) und Ziele ohne verfügbare
 * Interventionen (selbst formulierte) — sonst zeigte der Balken dauerhaft
 * einen Schritt, der ins Leere führt.
 */
function naechsterSchritt(plan: ReturnType<typeof usePlan>): { text: string; fokus: Fokus } | null {
  if (plan.diagnosen.length === 0) {
    return { text: "Schritt 1 von 3: Pflegediagnose übernehmen", fokus: { schritt: 1 } };
  }
  for (const d of plan.diagnosen) {
    const hatPlanZiele = plan.ziele.some(z => z.diagnoseCode === d.code);
    if (!hatPlanZiele && zieleZuDiagnose(d.code).length > 0) {
      return { text: `Schritt 2 von 3: Ziel wählen für ${d.titel}`, fokus: { schritt: 2, diagnoseCode: d.code } };
    }
  }
  for (const z of plan.ziele) {
    const hatMassnahme = plan.massnahmen.some(m => m.zielBezuege.some(b => b.diagnoseCode === z.diagnoseCode && b.zielId === z.zielId));
    if (!hatMassnahme && interventionenZuZiel(z.diagnoseCode, z.zielId).length > 0) {
      return {
        text: `Schritt 3 von 3: Massnahme wählen für ${z.titel}`,
        fokus: { schritt: 3, diagnoseCode: z.diagnoseCode, zielId: z.zielId, zielTitel: z.titel },
      };
    }
  }
  return null;
}

export function PflegeplanAufbau() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const plan = usePlan();
  const [fokus, setFokus] = useState<Fokus>({ schritt: 1 });

  const patient = patientId ? getPatient(patientId) : undefined;

  /* Das jüngste abgeschlossene Assessment mit getriggerten CAPs — die Quelle
     der Vorschläge. Ohne Assessment gibt es keine, und das ist kein Fehler. */
  const assessment = useMemo(() => MOCK_ASSESSMENTS
    .filter(a => a.patientId === patientId && a.status === "abgeschlossen" && a.getriggerteCaps.some(c => c.getriggert))
    .sort((a, b) => (b.abschlussDatum ?? "").localeCompare(a.abschlussDatum ?? ""))[0] ?? null, [patientId]);

  const caps = useMemo(
    () => assessment?.getriggerteCaps.filter(c => c.getriggert).map(c => c.id) ?? [],
    [assessment]);

  const schritt = naechsterSchritt(plan);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Kopfzeile */}
      <div style={{ padding: "16px var(--space-6) 12px", borderBottom: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)" }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          Pflegeplan — Aufbau
        </div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>
          {patient ? `${patient.nachname}, ${patient.vorname}` : patientId}
        </div>
      </div>

      {!assessment ? (
        /* Kein Assessment: keine Vorschläge — kein Fehler. */
        <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 560 }}>
          <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)", textAlign: "center" }}>
            <ClipboardList style={{ width: 22, height: 22, color: "var(--text-tertiary)", margin: "0 auto 8px" }} />
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 6 }}>
              Kein abgeschlossenes Assessment
            </div>
            <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: "0 auto 12px", maxWidth: "46ch", lineHeight: 1.6 }}>
              Die Diagnosevorschläge entstehen aus den getriggerten CAPs der
              Bedarfsabklärung. Ohne Assessment gibt es keine Vorschläge — das
              ist kein Fehler, sondern die Reihenfolge des Verfahrens.
            </p>
            <button type="button" onClick={() => navigate("/interrai")} className="ui-fokusring cursor-pointer inline-flex items-center"
              style={{ gap: 6, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-small)", fontWeight: 500 }}>
              Zur Bedarfsabklärung <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Links: der Plan */}
          <div className="flex-1 min-w-0" data-plan-bereich style={{ padding: "14px var(--space-6)", overflowY: "auto" }}>
            {/* Der nächste-Schritt-Balken: immer genau eine richtige nächste
                Handlung — anklickbar, aber nie zwingend. */}
            <button type="button" data-naechster-schritt
              onClick={() => schritt && setFokus(schritt.fokus)}
              disabled={!schritt}
              className="ui-fokusring w-full text-left flex items-center"
              style={{
                gap: 8, padding: "9px 14px", marginBottom: 12, borderRadius: "var(--radius-card)",
                cursor: schritt ? "pointer" : "default",
                background: schritt ? "var(--brand-primary-light)" : "var(--status-success-bg)",
                border: "var(--border-thin) solid transparent",
                color: schritt ? "var(--brand-primary)" : "var(--status-success-text)",
                fontSize: "var(--text-small)", fontWeight: 500, fontFamily: "inherit",
              }}>
              {schritt ? <>{schritt.text} <ArrowRight style={{ width: 13, height: 13, flexShrink: 0, marginLeft: "auto" }} /></> : "Alle Angaben vollständig"}
            </button>

            <PlanBaum plan={plan} onFokus={setFokus} />
          </div>

          {/* Rechts: die Auswahl zum aktuellen Fokus */}
          <div style={{ width: 480, flexShrink: 0, borderLeft: "var(--border-thin) solid var(--border-default)", padding: "14px var(--space-4)", overflowY: "auto", background: "var(--bg-primary)" }}>
            <AuswahlBereich fokus={fokus} onFokus={setFokus} caps={caps}
              assessmentDatum={assessment.abschlussDatum ?? assessment.startDatum} />
          </div>
        </div>
      )}
    </div>
  );
}
