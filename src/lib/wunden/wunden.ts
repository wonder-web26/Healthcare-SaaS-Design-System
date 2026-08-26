/**
 * Wunddokumentation — drei Objekte je Wunde.
 *
 * Der Standard trennt, was drei verschiedene Fragen beantwortet:
 *
 * 1. **Wunde** — was das für eine Wunde ist. Einmal erfasst, selten geändert.
 * 2. **Wundbeurteilung** — wie sie aussieht. Von einer Pflegefachperson,
 *    alle sieben bis vierzehn Tage.
 * 3. **Verlaufseintrag** — was getan wurde. Bei jedem Verbandwechsel, auch
 *    wenn nur kontrolliert und nicht gewechselt wurde.
 *
 * Mehrere Wunden werden getrennt geführt und durchnummeriert; die Nummer wird
 * abgeleitet, nicht erfasst — zwei Angaben, die einander widersprechen können,
 * sind eine zu viel. Der Standard nummeriert von kranial nach kaudal. Das ist
 * hier NICHT umgesetzt: die Lokalisation ist ein Freitext, und aus „Sacrum"
 * gegenüber „Ferse links" lässt sich ohne kodierte Körperregion keine
 * Reihenfolge ableiten. Nummeriert wird darum nach Erfassungsreihenfolge.
 *
 * Freitext ist der schlechtere Weg: „Wunde sieht schön aus" lässt sich nicht
 * vergleichen und nicht auswerten. Deshalb Wertelisten, wo immer der Standard
 * welche kennt, und Freitext nur dort, wo er nichts ersetzt.
 */

export interface Wunde {
  id: string;
  patientId: string;
  wundart: string;
  /** Körperstelle, etwa „Sacrum" oder „Malleolus lateralis links". */
  lokalisation: string;
  /** TT.MM.JJJJ */
  entstehungsdatum: string;
  ursache: string;
  /** Nur bei Wundart Dekubitus; Code aus DEKUBITUSKATEGORIE. */
  dekubituskategorie: string;
  /** Leer = offen. TT.MM.JJJJ = abgeheilt an diesem Tag. */
  abheilungsdatum: string;
  aerztlicheAnordnung: string;
}

export interface Wundbeurteilung {
  id: string;
  wundeId: string;
  /** TT.MM.JJJJ */
  datum: string;
  beurteiltDurch: string;
  /** Zentimeter; leer, wo nicht gemessen. */
  laenge: string;
  breite: string;
  tiefe: string;
  unterminierung: boolean;
  /** Nur bei Unterminierung — Lage und Ausmass. */
  unterminierungAngabe: string;
  /** Code der Gewebeart → Anteil in Prozent. Zusammen 100. */
  gewebeanteile: Record<string, number>;
  wundheilungsphase: string;
  wundrand: string;
  wundumgebung: string[];
  exsudatmenge: string;
  exsudatbeschaffenheit: string;
  geruch: boolean;
  infektionszeichen: string[];
  /** 0 bis 10; leer, wo nicht erhoben. */
  schmerz: string;
  beeintraechtigung: string;
}

export interface Verlaufseintrag {
  id: string;
  wundeId: string;
  /** TT.MM.JJJJ */
  datum: string;
  durchgefuehrtVon: string;
  /** "gewechselt" oder "kontrolliert" — auch die blosse Kontrolle zählt. */
  art: "gewechselt" | "kontrolliert";
  spulloesung: string;
  primaerverband: string;
  sekundaerverband: string;
  fixierung: string;
  bemerkung: string;
  /** Kennung des Einsatzes, falls einer besteht; sonst leer. */
  einsatzId: string;
}

/** Offen, solange kein Abheilungsdatum steht. */
export function istOffen(w: Wunde): boolean {
  return w.abheilungsdatum.trim() === "";
}

/**
 * Abstand zwischen zwei Beurteilungen, ab dem die Ansicht darauf hinweist.
 *
 * Der Standard nennt sieben bis vierzehn Tage; gemahnt wird am oberen Rand,
 * damit der Hinweis eine Überschreitung meldet und nicht den Normalfall.
 */
export const BEURTEILUNG_FRIST_TAGE = 14;

/** Volle Tage zwischen einem Anzeigedatum und heute; -1, wenn unlesbar. */
export function tageSeit(datum: string, heute: Date): number {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(datum.trim());
  if (!m) return -1;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Math.floor((heute.getTime() - d.getTime()) / 86400000);
}
