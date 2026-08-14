/**
 * ENTWICKLUNGS-FIXTURE — nur für die Dev-Route (DevAbklaerungPage).
 * NICHT in Produktionspfaden importieren. Die echten CAP-Ergebnisse kommen mit
 * der offiziellen Engine von Spitex Schweiz; bis dahin dient diese Datei allein
 * dazu, alle Zustände der Abklärungszusammenfassung sichtbar zu machen.
 *
 * Werte sind gegen cap-katalog.ts gewählt, um jeden Verifikationsfall abzudecken:
 *  - CAP 18 Dekubitus 1→3: verbessert (Beweis: Ampel, nicht Zahl)
 *  - CAP 26 Urininkontinenz Wert 1: grün → Ressource, obwohl Wert > 0
 *  - CAP 20 Wert null mit zwei X-Items: nicht berechenbar
 *  - gemischte Veränderungen für die drei Gruppen
 *  - CAP 7: von ausgelöst (orange) auf grün → „neu Ressource"
 */
import type { AbklaerungProps, CapErgebnis } from './typen'

const cap = (
  capNummer: number,
  wert: number | null,
  vorwert: number | null,
  extra: Partial<CapErgebnis> = {},
): CapErgebnis => ({
  capNummer,
  wert,
  vorwert,
  nichtBerechenbarWegen: extra.nichtBerechenbarWegen ?? [],
  codierungen: extra.codierungen ?? [],
  bereicheUnquittiert: extra.bereicheUnquittiert ?? false,
  handbuchAnker: extra.handbuchAnker ?? null,
  bereichAnker: extra.bereichAnker ?? null,
})

/** Reassessment mit gemischten Veränderungen. */
export const fixtureRe: AbklaerungProps = {
  assessmentTyp: 're',
  vergleichsDatum: '14.05.2026',
  uebernommeneDaten: true,
  bereicheQuittiert: 12,
  bereicheGesamt: 19,
  gesperrt: false,
  caps: [
    // Neu oder verschlechtert
    cap(3, 2, 0, { codierungen: [{ bezeichnung: 'H1 ADL-Hierarchie', wert: '3' }, { bezeichnung: 'H2 Fortbewegung', wert: '2' }], bereichAnker: 'H' }),
    cap(16, 2, 1, { bereicheUnquittiert: true, handbuchAnker: '#handbuch-cap-16', bereichAnker: 'J', codierungen: [{ bezeichnung: 'J1 Sturz letzte 90 Tage', wert: '2' }] }),
    // Verbessert (noch ausgelöst)
    cap(10, 1, 2, { bereichAnker: 'D' }),
    cap(18, 3, 1, { codierungen: [{ bezeichnung: 'K1 Hautzustand', wert: '3' }], handbuchAnker: '#handbuch-cap-18', bereichAnker: 'K' }),
    // Unverändert / kein Vergleich
    cap(17, 2, 2),
    cap(2, 1, null),
    // Nicht berechenbar (zwei X-Items)
    cap(20, null, 1, { nichtBerechenbarWegen: ['K2a', 'K2c'] }),
    // Ressourcen (grün)
    cap(1, 0, 0),
    cap(7, 0, 1), // war ausgelöst (orange) → neu Ressource
    cap(26, 1, 1), // Wert 1 = grün (Kontinent): Ressource trotz Wert > 0
    cap(27, 0, 0),
  ],
}

/** Erstassessment: kein Vergleich, keine Gruppen, flache Liste. */
export const fixtureErst: AbklaerungProps = {
  assessmentTyp: 'erst',
  vergleichsDatum: null,
  uebernommeneDaten: false,
  bereicheQuittiert: 0,
  bereicheGesamt: 19,
  gesperrt: false,
  caps: [
    cap(2, 1, null),
    cap(3, 2, null, { codierungen: [{ bezeichnung: 'H1 ADL-Hierarchie', wert: '3' }], bereichAnker: 'H' }),
    cap(16, 1, null, { bereichAnker: 'J' }),
    cap(18, 3, null),
    cap(20, null, null, { nichtBerechenbarWegen: ['K2a', 'K2c'] }),
    cap(1, 0, null),
    cap(26, 1, null),
  ],
}

/** Kein CAP berechenbar (entspricht dem Produktionszustand ohne Engine). */
export const fixtureLeer: AbklaerungProps = {
  assessmentTyp: 're',
  vergleichsDatum: '14.05.2026',
  uebernommeneDaten: false,
  bereicheQuittiert: 5,
  bereicheGesamt: 19,
  gesperrt: false,
  caps: [],
}
