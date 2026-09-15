/**
 * Rechenkern der Leistungsplanung (Lauf 7, Block D) — reine Funktionen,
 * getrennt vom UI, Eingaben in Minuten als Ganzzahl, einzeln testbar.
 *
 * D4: Die geplante Zeit wird NIE stillschweigend multipliziert — der
 * eingetragene Wert ist der geplante Wert je Ausführung; hochgerechnet
 * wird nur über Anzahl und Einheit.
 */

export type Einheit = "t2" | "t3" | "t4" | "t5" | "t6" | "t7" | "w" | "m" | "e";
export type Leistungsart = "a" | "b" | "c" | "n";

/* D1: Tag zu Monat mal 4.286 (Wochen je Monat), Tag zu Woche mal 7,
   Monat als 30 Tage, Jahr mal 12 beziehungsweise 360 Tage. */
export const WOCHEN_JE_MONAT = 4.286;
export const TAGE_JE_MONAT = 30;

/** t2–t7 → Tage je Woche; sonst null. */
export function tageJeWoche(einheit: Einheit): number | null {
  const m = /^t([2-7])$/.exec(einheit);
  return m ? Number(m[1]) : null;
}

export interface RechenPosition {
  leistungsart: Leistungsart;
  einheit: Einheit;
  anzahl: number;
  zeit: number;
  w: "S" | "I" | "A" | "V";
}

/** Minuten einer Position: je Monat (laufend) und einmalig (D3 — einmalige
 *  werden separat geführt, nie hochgerechnet). Nur W = Spitex zählt (D5). */
export function positionsMinuten(p: RechenPosition): { monat: number; einmalig: number } {
  if (p.w !== "S") return { monat: 0, einmalig: 0 };
  if (p.einheit === "e") return { monat: 0, einmalig: p.anzahl * p.zeit };
  const tage = tageJeWoche(p.einheit);
  if (tage !== null) return { monat: p.anzahl * p.zeit * tage * WOCHEN_JE_MONAT, einmalig: 0 };
  if (p.einheit === "w") return { monat: p.anzahl * p.zeit * WOCHEN_JE_MONAT, einmalig: 0 };
  return { monat: p.anzahl * p.zeit, einmalig: 0 };
}

export interface ArtSumme {
  /** Brutto je Monat, laufende Positionen. */
  monat: number;
  /** Netto je Monat: Brutto minus Abzug für gleichzeitig erbrachte
   *  Leistungen (D6), nie unter null. */
  monatNetto: number;
  einmalig: number;
  tag: number;
  periode: number;
  quartal: number;
}

export type Abzug = Record<Leistungsart, number>;
export const KEIN_ABZUG: Abzug = { a: 0, b: 0, c: 0, n: 0 };

/** Die Summen je Leistungsart über die Periode. */
export function blattSummen(positionen: RechenPosition[], monate: number, abzug: Abzug): Record<Leistungsart, ArtSumme> {
  const aus = {} as Record<Leistungsart, ArtSumme>;
  for (const art of ["a", "b", "c", "n"] as Leistungsart[]) {
    let monat = 0, einmalig = 0;
    for (const p of positionen.filter(x => x.leistungsart === art)) {
      const m = positionsMinuten(p);
      monat += m.monat;
      einmalig += m.einmalig;
    }
    const monatNetto = Math.max(0, monat - (abzug[art] || 0));
    aus[art] = {
      monat, monatNetto, einmalig,
      tag: monatNetto / TAGE_JE_MONAT,
      periode: monatNetto * monate + einmalig,
      quartal: monatNetto * 3,
    };
  }
  return aus;
}

/** KLV-Total (a+b+c) der Periode und des Quartals — Nicht-KLV bleibt draussen. */
export function klvTotal(s: Record<Leistungsart, ArtSumme>): { periodeMin: number; quartalMin: number } {
  return {
    periodeMin: s.a.periode + s.b.periode + s.c.periode,
    quartalMin: s.a.quartal + s.b.quartal + s.c.quartal,
  };
}

/* D2: Ausgabe auf eine Nachkommastelle gerundet — keine Viertelstundenrundung. */
export const runde1 = (x: number): number => Math.round(x * 10) / 10;
export const runde0 = (x: number): number => Math.round(x);

/** Minuten als «H:MM». */
export function stundenMinuten(min: number): string {
  const ganz = Math.round(min);
  return `${Math.floor(ganz / 60)}:${String(ganz % 60).padStart(2, "0")}`;
}
