/**
 * Abrechenbare Minuten je Leistungsart.
 *
 * Abgerechnet wird, was erbracht wurde, nicht was verordnet ist — und nicht
 * die Zeit, die auf der Uhr stand. Der Administrativvertrag zwischen Spitex
 * Schweiz/ASPS und den Versicherern (gültig ab 1.4.2023) taktet in fünf
 * Minuten je Leistungsart und setzt zehn Minuten als Mindestwert je Einsatz.
 * Die gestempelte Zeit ist damit nie identisch mit der abrechenbaren.
 *
 * Verglichen wird gegen die Bedarfsmeldung, die Minuten je Leistungsart pro
 * Monat nennt — nicht pro Tag. Ein Tagessoll ist deshalb keine
 * Abrechnungsgrenze: das Leistungsplanungsblatt plant Tage, die Kasse prüft
 * Monate je Leistungsart.
 *
 * Die Kategorien gleichen sich nicht aus. Liegt b über der Meldung und c
 * darunter, ist b trotzdem ungedeckt — der Versicherer vergütet je
 * Leistungsart, nicht in Summe.
 */
import type { TarifKategorie } from "../stammdaten/pflegetarife";

/** Takt und Mindestwert aus dem Administrativvertrag. */
export const TAKT_MINUTEN = 5;
export const MINDESTWERT_EINSATZ = 10;

export type MinutenJeArt = Record<TarifKategorie, number>;

export const LEERE_MINUTEN: MinutenJeArt = { a: 0, b: 0, c: 0 };

/** Eine erbrachte Position, so weit die Abrechnung sie braucht. */
export interface AbrechenbarePosition {
  kategorie: TarifKategorie;
  /** Verordnete Zeit aus dem Leistungsplanungsblatt, in Minuten. */
  verordnet: number;
}

export interface EinsatzAbrechnung {
  gestempelt: number;
  /** Verteilte Minuten je Leistungsart, vor dem Takt. */
  roh: MinutenJeArt;
  /** Nach Aufrundung auf den Takt. */
  abrechenbar: MinutenJeArt;
  summe: number;
  /**
   * Wahr, wenn die Summe nach der Rundung unter dem Mindestwert läge. Dann
   * ist zu klären, welcher Leistungsart die Aufstockung zugeschlagen wird —
   * das entscheidet dieses Modul nicht, es meldet den Fall.
   */
  unterMindestwert: boolean;
  /** Wahr, wenn keine Verteilung möglich war (keine verordnete Zeit). */
  unverteilbar: boolean;
}

/**
 * Die gestempelte Zeit eines Einsatzes auf seine erbrachten Leistungsarten
 * verteilen und takten.
 *
 * DIES IST EINE SETZUNG, KEINE ERFASSUNG. Die angehörige Person stempelt eine
 * Gesamtzeit und hakt ab, was sie erbracht hat; sie stoppt die Uhr nicht je
 * Position. Die Verteilung im Verhältnis der verordneten Zeiten ist die
 * plausibelste Annahme, die sich aus den vorhandenen Daten bilden lässt —
 * sie ist nicht gemessen und darf nicht als Messung gelesen werden.
 *
 * Reihenfolge: erst je Leistungsart auf den Takt aufrunden, dann den
 * Mindestwert des Einsatzes prüfen. Umgekehrt käme ein anderer Wert heraus.
 */
export function einsatzAbrechnen(
  gestempelt: number,
  positionen: AbrechenbarePosition[],
): EinsatzAbrechnung {
  const summeVerordnet = positionen.reduce((s, p) => s + p.verordnet, 0);
  if (summeVerordnet <= 0 || gestempelt <= 0) {
    return {
      gestempelt, roh: { ...LEERE_MINUTEN }, abrechenbar: { ...LEERE_MINUTEN },
      summe: 0, unterMindestwert: false, unverteilbar: positionen.length > 0,
    };
  }

  const roh: MinutenJeArt = { a: 0, b: 0, c: 0 };
  for (const p of positionen) {
    roh[p.kategorie] += gestempelt * (p.verordnet / summeVerordnet);
  }

  const abrechenbar: MinutenJeArt = { a: 0, b: 0, c: 0 };
  for (const k of ["a", "b", "c"] as TarifKategorie[]) {
    abrechenbar[k] = roh[k] > 0 ? Math.ceil(roh[k] / TAKT_MINUTEN) * TAKT_MINUTEN : 0;
  }

  const summe = abrechenbar.a + abrechenbar.b + abrechenbar.c;
  return { gestempelt, roh, abrechenbar, summe, unterMindestwert: summe < MINDESTWERT_EINSATZ, unverteilbar: false };
}

/* ── Monat ─────────────────────────────────────────────────────────────────── */

export interface ArtBilanz {
  /** Aus der Bedarfsmeldung, in Minuten je Monat. */
  gemeldet: number;
  abrechenbar: number;
  /** abrechenbar − gemeldet. Positiv = über der Meldung. */
  differenz: number;
}

export interface Monatsabrechnung {
  gestempelt: number;
  abrechenbar: number;
  /** abrechenbar − gestempelt: was der Takt hinzufügt. */
  ausRundung: number;
  jeArt: Record<TarifKategorie, ArtBilanz>;
  /** Anteil an der gemeldeten Gesamtmenge; null, wenn nichts gemeldet ist. */
  anteil: number | null;
  /** Summe der Überschreitungen, ohne Verrechnung mit Unterschreitungen. */
  nichtGedeckt: number;
  betroffene: TarifKategorie[];
  /** Einsätze, die unter dem Mindestwert lägen — Fälle zum Klären. */
  unterMindestwert: number;
  anzahlEinsaetze: number;
}

/**
 * Monatsbilanz aus den Einzelabrechnungen und der Bedarfsmeldung.
 *
 * `nichtGedeckt` summiert nur die Überschreitungen. Eine Unterschreitung bei
 * c macht eine Überschreitung bei b nicht ungeschehen — sie in eine Summe zu
 * werfen, verstellte genau den Blick, für den diese Leiste da ist.
 */
export function monatAbrechnen(
  einsaetze: EinsatzAbrechnung[],
  gemeldet: MinutenJeArt | null,
): Monatsabrechnung {
  const arten = ["a", "b", "c"] as TarifKategorie[];
  const jeArt = {} as Record<TarifKategorie, ArtBilanz>;
  let abrechenbar = 0, nichtGedeckt = 0;
  const betroffene: TarifKategorie[] = [];

  for (const k of arten) {
    const summe = einsaetze.reduce((s, e) => s + e.abrechenbar[k], 0);
    const g = gemeldet ? gemeldet[k] : 0;
    jeArt[k] = { gemeldet: g, abrechenbar: summe, differenz: summe - g };
    abrechenbar += summe;
    if (gemeldet && summe > g) { nichtGedeckt += summe - g; betroffene.push(k); }
  }

  const gestempelt = einsaetze.reduce((s, e) => s + e.gestempelt, 0);
  const gemeldetTotal = gemeldet ? gemeldet.a + gemeldet.b + gemeldet.c : 0;
  return {
    gestempelt, abrechenbar, ausRundung: abrechenbar - gestempelt, jeArt,
    anteil: gemeldet && gemeldetTotal > 0 ? (abrechenbar / gemeldetTotal) * 100 : null,
    nichtGedeckt, betroffene,
    unterMindestwert: einsaetze.filter(e => e.unterMindestwert).length,
    anzahlEinsaetze: einsaetze.length,
  };
}
