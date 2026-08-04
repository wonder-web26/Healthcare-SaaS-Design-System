/**
 * Personenbezug für Pendenzen — typisierte Referenz (Art + Kennung), Name wird
 * zur ANZEIGEZEIT aus der jeweiligen Quelle aufgelöst und NIE in der Pendenz
 * gespeichert. Dieselbe Konstruktion wie bei der Notiz (siehe notizen/notizen.ts),
 * hier jedoch gegen die realen Detailseiten-Datensätze aufgelöst, damit der
 * Personen-Verweis direkt auf die 360-Seite der Person führt.
 *
 * Personenarten sind ausschliesslich "patient" und "angehoeriger". Eine Art
 * "mitarbeitende" gibt es bewusst nicht — Personaladministration liegt ausserhalb
 * des Produktumfangs.
 *
 * Quellen:
 *   • Patient    → patients aus app/components/patientData     (Kennung P-2026-00xx)
 *   • Angehörige → angehoerige aus app/components/angehoerigeData (Kennung A-2026-01xx)
 */
import { patients } from "../../app/components/patientData";
import { angehoerige } from "../../app/components/angehoerigeData";

export type PersonArt = "patient" | "angehoeriger";

/** Typisierte Referenz auf die Person — Art + Kennung, kein Name. */
export interface PersonenBezug {
  art: PersonArt;
  kennung: string;
}

/** Anzeigename aus der Quelle auflösen (nie gespeichert). */
export function personName(ref: PersonenBezug): string {
  if (ref.art === "patient") {
    const p = patients.find(p => p.id === ref.kennung);
    return p ? `${p.vorname} ${p.nachname}` : "Unbekannte Person";
  }
  const a = angehoerige.find(a => a.id === ref.kennung);
  return a ? `${a.vorname} ${a.nachname}` : "Unbekannte Person";
}

/** Route auf die Detailseite der referenzierten Person. */
export function personLink(ref: PersonenBezug): string {
  return ref.art === "patient" ? `/patienten/${ref.kennung}` : `/angehoerige/${ref.kennung}`;
}

/** Kurzform der Personenart für Beschriftungen. */
export function personArtLabel(art: PersonArt): string {
  return art === "patient" ? "Patient/in" : "Angehörige/r";
}
