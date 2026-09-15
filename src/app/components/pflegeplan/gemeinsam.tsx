/**
 * Gemeinsame Bausteine der Aufbau-Ansicht: Fokus-Typ, Diagnosetyp-Marke,
 * Positionsvorschau. Baum und Auswahl lesen dieselbe Vorschau — zwei
 * Formulierungen für dieselbe Ableitung liefen auseinander.
 */
import { useState } from "react";
import { Check } from "lucide-react";
import type { DiagnoseCode, DiagnoseTyp, PositionsNummer, ZielId } from "../../../lib/pflegeplan/vertrag";
import { leistungsposition } from "../../../lib/pflegeplan/mock-adapter";
import { diagnoseBeschreiben } from "../../../lib/pflegeplan/plan-store";

/** Wo die Fachperson gerade steht — bestimmt, was rechts angeboten wird.
 *  «editor» ist die zweite Rolle des Auswahlbereichs: Bearbeiten von
 *  Bestätigtem statt Auswählen aus Katalogen. */
export type AuswahlFokus =
  | { schritt: 1 }
  | { schritt: 2; diagnoseCode: DiagnoseCode }
  | { schritt: 3; diagnoseCode: DiagnoseCode; zielId: ZielId; zielTitel: string }
  | { schritt: "editor"; positionsNummer: PositionsNummer };

/** «detail» ist die dritte Rolle (Lauf 6g): Lesen einer Diagnose aus dem
 *  Katalog. `stapel` sind die zuvor gelesenen Codes — Chips können mehrere
 *  Ebenen tief führen, und jede Ebene führt zurück. `basis` ist der
 *  Auswahl-Zustand, zu dem der letzte Zurück-Schritt führt. `titel` ist der
 *  Anzeige-Rückfall, wenn der Katalog zum Code keine Detailangaben führt. */
export type Fokus =
  | AuswahlFokus
  | { schritt: "detail"; diagnoseCode: DiagnoseCode; titel?: string; stapel: DiagnoseCode[]; basis: AuswahlFokus };

/** Detail-Fokus aus beliebigem Stand: aus einer Detailansicht heraus wird
 *  gestapelt (Chip-Navigation), sonst frisch geöffnet — die Basis bleibt
 *  der zuletzt aktive Auswahl-Zustand. */
export function detailOeffnen(aktuell: Fokus, diagnoseCode: DiagnoseCode, titel?: string): Fokus {
  if (aktuell.schritt === "detail") {
    return { schritt: "detail", diagnoseCode, titel, stapel: [...aktuell.stapel, aktuell.diagnoseCode], basis: aktuell.basis };
  }
  return { schritt: "detail", diagnoseCode, titel, stapel: [], basis: aktuell };
}

/** Ein Zurück-Schritt: erst den Stapel abtragen, dann in die Auswahl. */
export function detailZurueck(aktuell: Extract<Fokus, { schritt: "detail" }>): Fokus {
  const stapel = [...aktuell.stapel];
  const vorheriger = stapel.pop();
  return vorheriger !== undefined
    ? { schritt: "detail", diagnoseCode: vorheriger, stapel, basis: aktuell.basis }
    : aktuell.basis;
}

export const TYP_LABEL: Record<DiagnoseTyp, string> = {
  problem: "Problem",
  risiko: "Risiko",
  bereitschaft: "Bereitschaft",
};

/** Der Planzustand als Marke — überall dieselbe, damit «steht im Plan»
 *  in Auswahl und Detailansicht gleich aussieht. */
export function ImPlanMarke() {
  return (
    <span className="inline-flex items-center shrink-0" style={{ gap: 4, padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)" }}>
      <Check style={{ width: 10, height: 10 }} /> Im Plan
    </span>
  );
}

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

/** Positionslage einer Massnahme — für Satzzeile und Editor-Kopf dieselbe
 *  Auflösung per Nummer (Modellwechsel: Massnahme = Position). */
export function positionsLage(nummer: PositionsNummer): {
  text: string; vorgabeMinuten: number | null; qualifikation: string | null;
} {
  const pos = leistungsposition(nummer);
  if (!pos) return { text: `Position ${nummer}`, vorgabeMinuten: null, qualifikation: null };
  return {
    text: `Position ${pos.nummer} ${pos.bezeichnung}`,
    vorgabeMinuten: pos.vorgabeMinuten,
    qualifikation: pos.mindestqualifikation,
  };
}

/**
 * Die individuelle Beschreibung einer Plan-Diagnose — EINE Komponente für
 * Auswahl-Karte und Baum, damit beide Stellen dasselbe Feld bedienen.
 * Die Möglichkeit besteht immer, eine Pflicht ist sie nicht: ohne Text
 * steht nur die Ergänzen-Aktion da, kein leeres Feld.
 */
export function BeschreibungZeile({ code, beschreibung }: { code: DiagnoseCode; beschreibung: string | null }) {
  const [entwurf, setEntwurf] = useState<string | null>(null);

  if (entwurf === null) {
    return (
      <div data-beschreibung={code}>
        {beschreibung !== null ? (
          <button type="button" onClick={() => setEntwurf(beschreibung)}
            title="Beschreibung bearbeiten"
            className="ui-fokusring cursor-pointer w-full text-left"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {beschreibung}
          </button>
        ) : (
          <button type="button" onClick={() => setEntwurf("")}
            className="ui-fokusring cursor-pointer"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)" }}>
            Beschreibung ergänzen
          </button>
        )}
      </div>
    );
  }

  return (
    <div data-beschreibung={code} className="flex flex-col" style={{ gap: 6 }}>
      <textarea value={entwurf} onChange={e => setEntwurf(e.target.value)} autoFocus rows={2}
        data-beschreibung-feld placeholder="Individuelle Beschreibung zu dieser Diagnose…"
        style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", lineHeight: 1.5, resize: "vertical", outline: "none" }} />
      <div className="flex items-center" style={{ gap: 8 }}>
        <button type="button" onClick={() => { diagnoseBeschreiben(code, entwurf); setEntwurf(null); }}
          className="ui-fokusring cursor-pointer"
          style={{ padding: "3px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontFamily: "inherit" }}>
          Speichern
        </button>
        <button type="button" onClick={() => setEntwurf(null)}
          className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-secondary)" }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
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
  return m.planung.dauerMin ?? leistungsposition(m.positionsNummer)?.vorgabeMinuten ?? null;
}

/** Geplante Minuten je Woche über Massnahmen mit Erbringer S. */
export function planWochenSummeMin(massnahmen: PlanMassnahme[]): number {
  return massnahmen
    .filter(m => m.planung.erbringer === "S")
    .reduce((s, m) => s + wochenMinuten(m.planung, massnahmenDauerMin(m)), 0);
}
