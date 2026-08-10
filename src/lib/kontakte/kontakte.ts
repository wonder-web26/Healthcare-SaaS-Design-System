/**
 * Kontakt — eine dritte Person.
 *
 * Nicht Patient, nicht angehörige Person, nicht Mitarbeitende: Ärztinnen,
 * Beistände, Kontaktpersonen von Sozialdiensten. Sie werden einmal erfasst
 * und mehrfach verknüpft; vorher stand derselbe Name so oft im System, wie
 * er Patienten hatte.
 *
 * KEIN FELD OHNE HEUTIGEN VERWENDER. GLN, HIN-Adresse und Praxisadresse
 * kommen im Produkt nirgends vor und stehen darum nicht hier — sie kämen mit
 * einer Ärzteliste, die den Kontakt anreichert, statt ihn zu ersetzen.
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
}

/** „Sommer, Regula" — Vorname entfällt, wo keiner erfasst ist. */
export function kontaktName(k: Kontakt): string {
  return k.vorname.trim() ? `${k.name}, ${k.vorname}` : k.name;
}
