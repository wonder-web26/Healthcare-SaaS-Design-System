/**
 * Kontakt — eine dritte Person.
 *
 * Nicht Patient, nicht angehörige Person, nicht Mitarbeitende: Ärztinnen,
 * Beistände, Kontaktpersonen von Sozialdiensten. Sie werden einmal erfasst
 * und mehrfach verknüpft; vorher stand derselbe Name so oft im System, wie
 * er Patienten hatte.
 *
 * KEIN FELD OHNE HEUTIGEN VERWENDER. Das Prinzip bleibt richtig — der
 * Verwender existiert jetzt: die strukturierte ärztliche Anfrage
 * (ArztAnfrageContext) braucht die GLN der Fachperson, und der Erfassungsblock
 * im Bezugsteam-Dialog erfasst Anrede, Titel, Fachgebiet, Organisation, Mobil
 * und die Adresse (vier Felder). Darum stehen sie jetzt hier. Sie sind optional:
 * fehlt der Verwender für einen Einzelfall, bleibt das Feld leer, statt erfunden
 * zu werden.
 *
 * Ein Ärzteverzeichnis (GLN-Register), das den Kontakt anreichert statt ihn zu
 * ersetzen, bleibt der spätere Weg — das Fachgebiet käme dann von dort.
 */
import type { KontakttypCode } from "../stammdaten/kontakttypen";

export interface Kontakt {
  /** K-JJJJ-NNNN */
  id: string;
  name: string;
  /** Fehlt bei Institutionen und bei Angaben, die nur einen Namen tragen. */
  vorname: string;
  typ: KontakttypCode;
  /** Praxis, Behörde, Stelle — wo die Person hingehört. */
  zugehoerigkeit: string;
  telefon: string;
  email: string;
  bemerkung: string;
  /* Angaben aus dem Abgleich mit einem etablierten Spitex-System. Optional-
     nullbar: nur befüllt, wo ein Verwender sie erfasst. */
  /** Anrede — getrennt vom Titel: eine Ärztin trägt Frau UND Dr. */
  anrede?: KontaktAnrede | null;
  /** Akademischer Titel — getrennt von der Anrede. */
  titel?: KontaktTitel | null;
  /** Freitext mit Vorschlägen; später aus dem GLN-Register. */
  fachgebiet?: string | null;
  /** Global Location Number, 13-stellig. */
  gln?: string | null;
  /** Praxis, Institution, Behörde hinter der Person. */
  organisation?: string | null;
  mobil?: string | null;
  /* Adresse als vier Felder, nicht als zusammengesetzte Zeichenkette: ein
     String liesse sich für Postversand und Rechnungsempfänger nicht verwenden. */
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
  land?: string | null;
}

export type KontaktAnrede = "herr" | "frau";
export type KontaktTitel = "dr" | "prof" | "prof_dr";

export const KONTAKT_ANREDE: { code: KontaktAnrede; label: string }[] = [
  { code: "herr", label: "Herr" },
  { code: "frau", label: "Frau" },
];

export const KONTAKT_TITEL: { code: KontaktTitel; label: string }[] = [
  { code: "dr", label: "Dr." },
  { code: "prof", label: "Prof." },
  { code: "prof_dr", label: "Prof. Dr." },
];

export function titelLabel(code: string | null | undefined): string {
  return KONTAKT_TITEL.find(t => t.code === code)?.label ?? "";
}
export function anredeLabel(code: string | null | undefined): string {
  return KONTAKT_ANREDE.find(a => a.code === code)?.label ?? "";
}

/** „Sommer, Regula" — Vorname entfällt, wo keiner erfasst ist. */
export function kontaktName(k: Kontakt): string {
  return k.vorname.trim() ? `${k.name}, ${k.vorname}` : k.name;
}
