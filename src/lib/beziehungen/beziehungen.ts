/**
 * Beziehung — wer steht in welcher Rolle zu diesem Patienten.
 *
 * Bisher stand die pflegende Angehörige als Zeichenkette am Patienten:
 * „Vera Steiner (Ehefrau)". Eine Zeichenkette lässt sich nicht verknüpfen,
 * nicht prüfen und nicht abrechnen — und sie kann von der typisierten
 * Verknüpfung am Angehörigen abweichen, ohne dass es jemandem auffällt.
 *
 * Die Beziehung ist die Ebene dazwischen: das Mandat trägt bereits
 * `abgerechneteAngehoerige`, das Leistungsplanungsblatt löst „Wer =
 * Angehöriger" darüber auf.
 *
 * DIE ABGERECHNETE ANGEHÖRIGE HÄNGT NICHT HIER. Die Beziehung sagt, wer
 * pflegt; das Mandat sagt, wer abgerechnet wird. Das ist nicht dasselbe:
 * mehrere Angehörige können pflegen, abgerechnet wird über eine. Beides an
 * einer Stelle zu führen, machte die Abrechnung von der Pflegebeziehung
 * abhängig — und umgekehrt.
 *
 * BEENDEN STATT LÖSCHEN. Eine beendete Beziehung bleibt mit Enddatum
 * sichtbar: bei einer Kassenkontrolle ist „wer hat damals gepflegt" die
 * Frage, und darauf gibt ein gelöschter Eintrag keine Antwort.
 */

/** Rolle — der Code wird gespeichert, nie die Beschriftung. */
export const BEZIEHUNGSROLLE = [
  { code: "pflegende_angehoerige", label: "Pflegende Angehörige", seite: "privat" },
  { code: "angehoerige", label: "Angehörige", seite: "privat" },
  { code: "bezugsperson", label: "Bezugsperson Spitex", seite: "intern" },
  { code: "stellvertretung", label: "Stellvertretung", seite: "intern" },
  { code: "hausarzt", label: "Hausarzt", seite: "extern" },
  { code: "spezialarzt", label: "Spezialarzt", seite: "extern" },
  { code: "beistand", label: "Beistand", seite: "extern" },
  { code: "weitere", label: "Weitere", seite: "privat" },
] as const;

export type BeziehungsrolleCode = typeof BEZIEHUNGSROLLE[number]["code"];
export type BeziehungsSeite = "privat" | "intern" | "extern";

export function rolleLabel(code: string): string {
  return BEZIEHUNGSROLLE.find(r => r.code === code)?.label ?? code;
}

export function rolleSeite(code: string): BeziehungsSeite {
  return (BEZIEHUNGSROLLE.find(r => r.code === code)?.seite ?? "privat") as BeziehungsSeite;
}

/** Verwandtschaft — nur bei privaten Rollen. */
export const BEZIEHUNGSART = [
  { code: "ehepartner", label: "Ehepartner" },
  { code: "eingetragene_partnerschaft", label: "Eingetragene Partnerschaft" },
  { code: "lebenspartner", label: "Lebenspartner" },
  { code: "kind", label: "Kind" },
  { code: "elternteil", label: "Elternteil" },
  { code: "geschwister", label: "Geschwister" },
  { code: "weitere_verwandte", label: "Weitere Verwandte" },
  { code: "nachbar", label: "Nachbar" },
  { code: "bekannte", label: "Bekannte" },
  { code: "andere", label: "Andere" },
] as const;

export type BeziehungsartCode = typeof BEZIEHUNGSART[number]["code"];

export function artLabel(code: string): string {
  return BEZIEHUNGSART.find(a => a.code === code)?.label ?? "";
}

/** Wer die Person ist — angehörige Person, Mitarbeitende, oder nur ein Name. */
export type PersonBezug =
  | { art: "angehoeriger"; kennung: string }
  | { art: "mitarbeitende"; name: string }
  /* Ärzte haben im Cockpit keinen Personendatensatz: Personaladministration
     ausserhalb der Spitex liegt ausserhalb des Produktumfangs. Sie erscheinen
     als Name, ohne Verweis — statt einen Datensatz zu erfinden. */
  | { art: "ohne_datensatz"; name: string };

export interface Beziehung {
  id: string;
  patientId: string;
  person: PersonBezug;
  rolle: BeziehungsrolleCode;
  /** Nur bei privaten Rollen; leer, wo die Verwandtschaft nicht bekannt ist. */
  art: BeziehungsartCode | "";
  /** TT.MM.JJJJ */
  beginn: string;
  /** Leer = laufend. */
  ende: string;
  notfallkontakt: boolean;
  auskunftsberechtigt: boolean;
  telefon: string;
  bemerkung: string;
}

export function istAktiv(b: Beziehung): boolean {
  return b.ende.trim() === "";
}

export function personName(b: Beziehung, nameVon: (kennung: string) => string): string {
  return b.person.art === "angehoeriger" ? nameVon(b.person.kennung) : b.person.name;
}

/**
 * Ab wie vielen aktiven Beziehungen das Diagramm zusammenfasst.
 *
 * Darüber wird es zum Knäuel: die Linien kreuzen sich, und der Blick findet
 * die kräftige Linie zur abgerechneten Person nicht mehr.
 */
export const DIAGRAMM_MAX = 8;
