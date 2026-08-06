/**
 * Tarifgrundlage der Pflegefinanzierung — je Kanton und Gültigkeit.
 *
 * Die Beträge stehen bewusst NICHT im Seitencode: Tarife ändern jährlich und
 * unterscheiden sich je Kanton. Wer einen Tarif anpasst, ändert diese Datei
 * und sonst nichts.
 *
 * Aufbau je Kategorie des Leistungskatalogs (a Abklärung und Beratung,
 * b Untersuchung und Behandlung, c Grundpflege) drei Beträge in Franken je
 * Pflegestunde: Beitrag der obligatorischen Krankenpflegeversicherung,
 * Restfinanzierung durch Kanton oder Gemeinde, Patientenbeteiligung. Zusammen
 * ergeben sie die Normkosten der Kategorie — die Summe muss aufgehen, sie wird
 * nicht separat gespeichert, sondern gerechnet.
 *
 * Zur Patientenbeteiligung: Artikel 25a Absatz 5 KVG kennt EINEN Höchstbetrag
 * für die versicherte Person, nicht drei kategorienabhängige. Der Wert ist
 * deshalb in allen drei Kategorien derselbe und wird in der Ansicht einmal als
 * Tagesbetrag gezeigt, nicht dreimal je Kategorie.
 *
 * Nicht jeder Kanton ist hinterlegt. Fehlt einer, sagt die Ansicht das —
 * sie zeigt keine Null und rechnet nicht mit einem fremden Kanton.
 */

/** Kategorien des Leistungskatalogs. */
export type TarifKategorie = "a" | "b" | "c";

export interface TarifBetraege {
  /** Beitrag der obligatorischen Krankenpflegeversicherung, CHF je Stunde. */
  okp: number;
  /** Restfinanzierung durch Kanton oder Gemeinde, CHF je Stunde. */
  restfinanzierung: number;
  /** Patientenbeteiligung, CHF je Stunde — in allen Kategorien derselbe Wert. */
  patientenbeteiligung: number;
}

export interface Tarifgrundlage {
  kanton: string;
  /** Gültig ab, TT.MM.JJJJ. */
  gueltigAb: string;
  /** Höchstbetrag der Patientenbeteiligung je Tag, Art. 25a Abs. 5 KVG. */
  patientenbeteiligungProTag: number;
  betraege: Record<TarifKategorie, TarifBetraege>;
}

export const PFLEGETARIFE: Tarifgrundlage[] = [
  {
    kanton: "ZH",
    gueltigAb: "01.01.2026",
    patientenbeteiligungProTag: 15.35,
    betraege: {
      a: { okp: 76.90, restfinanzierung: 30.75, patientenbeteiligung: 15.35 },
      b: { okp: 63.00, restfinanzierung: 26.65, patientenbeteiligung: 15.35 },
      c: { okp: 52.60, restfinanzierung: 27.05, patientenbeteiligung: 15.35 },
    },
  },
  {
    kanton: "BE",
    gueltigAb: "01.01.2026",
    patientenbeteiligungProTag: 15.35,
    betraege: {
      a: { okp: 76.90, restfinanzierung: 27.75, patientenbeteiligung: 15.35 },
      b: { okp: 63.00, restfinanzierung: 23.65, patientenbeteiligung: 15.35 },
      c: { okp: 52.60, restfinanzierung: 24.05, patientenbeteiligung: 15.35 },
    },
  },
];

/** Reihenfolge und Beschriftung der Kategorien für die Anzeige. */
export const TARIF_KATEGORIEN: { code: TarifKategorie; label: string }[] = [
  { code: "a", label: "KLV a — Abklärung und Beratung" },
  { code: "b", label: "KLV b — Untersuchung und Behandlung" },
  { code: "c", label: "KLV c — Grundpflege" },
];

/**
 * Tarifgrundlage eines Kantons. null, wenn keine hinterlegt ist — dann wird
 * nichts gerechnet und nichts angenommen.
 */
export function tarifgrundlage(kanton: string): Tarifgrundlage | null {
  return PFLEGETARIFE.find(t => t.kanton === kanton) ?? null;
}

/** Normkosten einer Kategorie: die Summe ihrer drei Beträge. */
export function normkosten(b: TarifBetraege): number {
  return b.okp + b.restfinanzierung + b.patientenbeteiligung;
}

/** Franken-Anzeige mit zwei Nachkommastellen, Schweizer Schreibweise. */
export function chf(betrag: number): string {
  return betrag.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
