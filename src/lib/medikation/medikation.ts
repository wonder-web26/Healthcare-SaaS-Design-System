/**
 * Medikationsplan und Unverträglichkeiten.
 *
 * Massgebend ist die Umsetzungshilfe „Einführung Medikationsplan im EPD",
 * eHealth Suisse und IPAG, 28.2.2022.
 *
 * EIN MEDIKATIONSPLAN IST DIE MÖGLICHST VOLLSTÄNDIGE LISTE ALLER MEDIKAMENTE,
 * DIE DER PATIENT AKTUELL EINNEHMEN SOLLTE — auch der verschriebenen, aber
 * noch nicht bezogenen.
 *
 * Die Spitex ist nicht die Verordnerin. Sie führt den Plan, den sie erhalten
 * hat; die Verantwortung für die verschriebenen Arzneimittel bleibt bei der
 * verschreibenden Fachperson. Wer den Plan aktualisiert, ist nur für seine
 * eigenen Einträge verantwortlich. Der Plan garantiert weder Aktualität noch
 * Vollständigkeit noch Korrektheit — die Umsetzungshilfe verlangt, dass das
 * ausdrücklich dabeisteht; der Text dafür ist `PLAN_VORBEHALT`.
 *
 * UNVERTRÄGLICHKEITEN GEHÖREN AUSDRÜCKLICH NICHT IN DEN PLAN. Sie sind eigene
 * Information, darum ein eigenes Objekt und eine eigene Ansicht.
 */
import { OHNE_TAGESDOSIERUNG } from "../stammdaten/medikationswerte";
import { katalogEintrag, type Arzneimittel } from "./arzneimittelkatalog";

/** Der Vorbehalt, den die Umsetzungshilfe verlangt. Nicht wegklickbar. */
export const PLAN_VORBEHALT =
  "Dieser Medikationsplan kann Aktualität, Vollständigkeit und Korrektheit nicht garantieren. "
  + "Die Verantwortung für die verschriebenen Arzneimittel liegt bei der verschreibenden Fachperson.";

/**
 * Felder in der Reihenfolge der Empfehlung 11 der Umsetzungshilfe:
 * Arzneimittel, Wirkstoff, Darreichungsform, Wirkstoffmenge pro Einheit,
 * Dosierung Morgen/Mittag/Abend/Nacht, Dosierung als Text,
 * Anwendungsanweisung, Art, Beginn, Ende, Behandlungsgrund, Kommentar,
 * verordnet durch.
 */
export interface Medikation {
  id: string;
  patientId: string;
  /** Kennung des Katalogeintrags; "" heisst freitextlich erfasst. */
  arzneimittelId: string;
  /* Die vier folgenden Felder tragen NUR bei freitextlicher Erfassung einen
     Wert. Bei einem Katalogeintrag werden sie von dort gelesen, nicht
     kopiert — sonst gälte eine Berichtigung am Katalog hier nicht. */
  produktename: string;
  wirkstoff: string;
  darreichungsform: string;
  wirkstoffmenge: string;
  /** Dezimal: eine halbe Tablette ist "0.5". Siehe `dosisFehler`. */
  morgen: string;
  mittag: string;
  abend: string;
  nacht: string;
  dosierungText: string;
  anwendungsweg: string;
  art: string;
  /** TT.MM.JJJJ */
  beginn: string;
  ende: string;
  behandlungsgrund: string;
  kommentar: string;
  /** Kennung eines Kontakts; "" = nicht erfasst. */
  verordnetDurch: string;
  /** TT.MM.JJJJ; "" = laufend. Der Zustand wird daraus abgeleitet. */
  abgesetztAm: string;
}

export interface Unvertraeglichkeit {
  id: string;
  patientId: string;
  substanz: string;
  art: string;
  reaktion: string;
  /**
   * Code aus UNVERTRAEGLICHKEIT_SCHWERE; leer heisst nicht eingestuft.
   *
   * Freiwillig, damit bestehende Einträge gültig bleiben und der Startbestand
   * nicht rückwirkend eine Einstufung behauptet, die niemand vorgenommen hat.
   */
  schwere: string;
  /** TT.MM.JJJJ, beim Sichern gesetzt. */
  erfasstAm: string;
  erfasstDurch: string;
}

/** Freitextlich erfasst — kein Katalogeintrag dahinter. */
export function istFreitextlich(m: Medikation): boolean {
  return m.arzneimittelId.trim() === "";
}

/**
 * Die vier Angaben zum Arzneimittel — aus dem Katalog gelesen, wo einer
 * verknüpft ist, sonst aus dem Eintrag selbst.
 */
export function arzneiAngaben(m: Medikation): {
  produktename: string; wirkstoff: string; darreichungsform: string;
  wirkstoffmenge: string; eintrag: Arzneimittel | undefined;
} {
  const eintrag = istFreitextlich(m) ? undefined : katalogEintrag(m.arzneimittelId);
  if (eintrag) {
    return {
      produktename: eintrag.produktename, wirkstoff: eintrag.wirkstoff,
      darreichungsform: eintrag.darreichungsform, wirkstoffmenge: eintrag.wirkstoffmenge,
      eintrag,
    };
  }
  return {
    produktename: m.produktename, wirkstoff: m.wirkstoff,
    darreichungsform: m.darreichungsform, wirkstoffmenge: m.wirkstoffmenge,
    eintrag: undefined,
  };
}

/** Laufend, solange nichts abgesetzt wurde. */
export function istLaufend(m: Medikation): boolean {
  return m.abgesetztAm.trim() === "";
}

/** Reserve und Notfall stehen unter den übrigen. */
export function istBedarf(m: Medikation): boolean {
  return OHNE_TAGESDOSIERUNG.includes(m.art);
}

/** „1 – 0 – 0.5 – 0" für die Zeile; leere Felder werden zu 0. */
export function tagesdosis(m: Medikation): string {
  if (istBedarf(m)) return "nach Bedarf";
  const f = (v: string) => (v.trim() === "" ? "0" : v.trim());
  const vier = [m.morgen, m.mittag, m.abend, m.nacht];
  if (vier.every(v => v.trim() === "")) return m.dosierungText.trim() || "—";
  return vier.map(f).join(" – ");
}
