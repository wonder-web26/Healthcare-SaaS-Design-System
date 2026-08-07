/**
 * Monatsabschluss je Patient — der Übergabepunkt.
 *
 * Abgerechnet wird monatlich, jeweils der Vormonat, direkt mit dem
 * Versicherer; die Bedarfsmeldung geht mit der Rechnung mit. Der Abschluss
 * setzt den Punkt, ab dem gilt: geprüft, gesperrt, verrechenbar,
 * lohnwirksam. Danach darf über die mobile Anwendung nichts mehr geändert
 * werden.
 *
 * ZWEI ZAHLEN, DIE AUSEINANDERGEHEN. Verrechenbar ist die getaktete Zeit —
 * mindestens zehn Minuten je Einsatz, danach in Fünferschritten; sie geht an
 * die Kasse. Gearbeitet ist die gestempelte Zeit; sie geht in den Lohn. Der
 * Arbeitgeber schuldet den Lohn unabhängig davon, ob die Kasse zahlt, und
 * deshalb dürfen die beiden nie zu einer Zahl verschmelzen.
 */

/** Eine Wiedereröffnung: wer, wann, warum. */
export interface Oeffnung {
  grund: string;
  person: string;
  /** TT.MM.JJJJ HH:MM */
  zeitpunkt: string;
}

export interface Monatsabschluss {
  patientId: string;
  jahr: number;
  /** 0 = Januar */
  monat: number;
  person: string;
  /** TT.MM.JJJJ HH:MM */
  zeitpunkt: string;
  /**
   * Frühere Wiedereröffnungen, älteste zuerst. Ein Abschluss, der einmal
   * geöffnet und neu gesetzt wurde, trägt seine Vorgeschichte mit — sonst
   * sähe er aus wie einer, der nie angefasst wurde.
   */
  oeffnungen: Oeffnung[];
}

/**
 * Schwelle, ab der der Versicherer eine Leistungsprüfung veranlassen kann:
 * 60 Pflichtleistungsstunden je Quartal. Bei einer Angehörigen-Spitex wird
 * sie regelmässig überschritten — die Zahl ist ein Hinweis, keine Grenze.
 */
export const QUARTALSSCHWELLE_STUNDEN = 60;

/** Das Quartal (0–3), in dem ein Monat liegt. */
export function quartalVon(monat: number): number {
  return Math.floor(monat / 3);
}

/** Die drei Monatsnummern des Quartals, in dem der Monat liegt. */
export function quartalsMonate(monat: number): number[] {
  const q = quartalVon(monat) * 3;
  return [q, q + 1, q + 2];
}

export type BlockadeGrund = "ungeprueft" | "abweichung_ohne_grund" | "keine_meldung";

/**
 * Warum ein Monat nicht abgeschlossen werden kann.
 *
 * Reihenfolge ist Absicht: genannt wird der erste zutreffende Grund, nicht
 * alle. Wer drei Sätze liest, weiss danach nicht, womit er anfangen soll.
 */
export const BLOCKADE_TEXT: Record<BlockadeGrund, string> = {
  ungeprueft: "Einsätze noch ungeprüft",
  abweichung_ohne_grund: "Abweichung ohne Grund",
  keine_meldung: "Keine gültige Bedarfsmeldung",
};

export interface AbschlussLage {
  bereit: boolean;
  grund: BlockadeGrund | null;
}

/**
 * Ist der Monat abschlussreif?
 *
 * Drei Bedingungen, alle notwendig: nichts mehr ungeprüft, keine Abweichung
 * ohne Begründung, eine Bedarfsmeldung, die den Monat deckt. Die dritte ist
 * keine Formalie — ohne Meldung vergütet der Versicherer nichts, und ein
 * Abschluss würde eine Abrechnungsfähigkeit behaupten, die nicht besteht.
 */
export function abschlussLage(
  offen: number,
  abweichungenOhneGrund: number,
  hatMeldung: boolean,
): AbschlussLage {
  if (offen > 0) return { bereit: false, grund: "ungeprueft" };
  if (abweichungenOhneGrund > 0) return { bereit: false, grund: "abweichung_ohne_grund" };
  if (!hatMeldung) return { bereit: false, grund: "keine_meldung" };
  return { bereit: true, grund: null };
}
