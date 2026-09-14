/**
 * Gemeinsame Bausteine der Aufbau-Ansicht: Fokus-Typ, Diagnosetyp-Marke,
 * Positionsvorschau. Baum und Auswahl lesen dieselbe Vorschau — zwei
 * Formulierungen für dieselbe Ableitung liefen auseinander.
 */
import type { DetailAuswahl, DiagnoseCode, DiagnoseTyp, InterventionId, ZielId } from "../../../lib/pflegeplan/vertrag";
import { detaildialog, positionFuer } from "../../../lib/pflegeplan/mock-adapter";

/** Wo die Fachperson gerade steht — bestimmt, was rechts angeboten wird.
 *  «editor» ist die zweite Rolle des rechten Bereichs: Bearbeiten von
 *  Bestätigtem statt Auswählen aus Katalogen. */
export type Fokus =
  | { schritt: 1 }
  | { schritt: 2; diagnoseCode: DiagnoseCode }
  | { schritt: 3; diagnoseCode: DiagnoseCode; zielId: ZielId; zielTitel: string }
  | { schritt: "editor"; interventionId: InterventionId };

export const TYP_LABEL: Record<DiagnoseTyp, string> = {
  problem: "Problem",
  risiko: "Risiko",
  bereitschaft: "Bereitschaft",
};

export function TypMarke({ typ }: { typ: DiagnoseTyp }) {
  return (
    <span style={{
      padding: "1px 8px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
      fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
      background: typ === "risiko" ? "var(--status-warning-bg)" : typ === "bereitschaft" ? "var(--status-info-bg)" : "var(--bg-secondary)",
      color: typ === "risiko" ? "var(--status-warning-text)" : typ === "bereitschaft" ? "var(--status-info)" : "var(--text-secondary)",
    }}>
      {TYP_LABEL[typ]}
    </span>
  );
}

/**
 * Was diese Intervention ergäbe — Position und Vorgabezeit, die Abhängigkeit
 * von der Detailauswahl, oder dass keine Position hinterlegt ist. In diesem
 * Lauf trägt die Satzzeile nur das; Häufigkeit und Erbringer kommen in Lauf 3.
 */
export function positionsVorschau(interventionId: InterventionId): string {
  if (detaildialog(interventionId)) return "Position hängt von der Detailauswahl ab";
  const pos = positionFuer(interventionId, []);
  if (!pos) return "Keine Position hinterlegt — bleibt planerisch";
  const zeit = pos.vorgabeMinuten !== null ? ` · Vorgabe ${pos.vorgabeMinuten} min` : "";
  return `Position ${pos.nummer} ${pos.bezeichnung}${zeit}`;
}

/** Positionslage einer Massnahme unter Berücksichtigung ihrer Detailauswahl —
 *  für Satzzeile und Editor-Kopf dieselbe Ableitung. */
export function positionsLage(interventionId: InterventionId, auswahl: DetailAuswahl): {
  text: string; vorgabeMinuten: number | null; qualifikation: string | null;
} {
  const dialog = detaildialog(interventionId);
  const pos = positionFuer(interventionId, auswahl);
  if (dialog && !pos) return { text: "Position offen — die Detailauswahl entscheidet", vorgabeMinuten: null, qualifikation: null };
  if (!pos) return { text: "Keine Position hinterlegt — bleibt planerisch", vorgabeMinuten: null, qualifikation: null };
  return {
    text: `Position ${pos.nummer} ${pos.bezeichnung}`,
    vorgabeMinuten: pos.vorgabeMinuten,
    qualifikation: pos.mindestqualifikation,
  };
}

/** Gruppentitel der Massnahmenauswahl: Katalogkategorie der Standardposition. */
export function katalogGruppe(interventionId: InterventionId): string {
  if (detaildialog(interventionId)) return "Position nach Detailauswahl";
  const pos = positionFuer(interventionId, []);
  return pos ? pos.kategorie : "Ohne hinterlegte Position";
}

export function datumAnzeige(iso: string): string {
  const [j, m, t] = iso.split("-");
  return j && m && t ? `${t}.${m}.${j}` : iso;
}

/* ── Wochensumme — EINE Rechnung für Aufbau und Struktur ─────────────────
   Zwei Rechnungen für dieselbe Zahl liefen auseinander. PLANUNGSNÄHERUNG
   (siehe wochenMinuten in planung.ts), keine Abrechnungsgrösse. */
import type { PlanMassnahme } from "../../../lib/pflegeplan/plan-store";
import { wochenMinuten } from "../../../lib/pflegeplan/planung";

export function massnahmenDauerMin(m: PlanMassnahme): number | null {
  return m.planung.dauerMin ?? positionFuer(m.interventionId, m.planung.detailAuswahl)?.vorgabeMinuten ?? null;
}

/** Geplante Minuten je Woche über Massnahmen mit Erbringer S. */
export function planWochenSummeMin(massnahmen: PlanMassnahme[]): number {
  return massnahmen
    .filter(m => m.planung.erbringer === "S")
    .reduce((s, m) => s + wochenMinuten(m.planung, massnahmenDauerMin(m)), 0);
}
