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
  { code: "sozialdienst", label: "Sozialdienst", seite: "extern" },
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

/**
 * Art der Vertretung — nur bei der Rolle `beistand`.
 *
 * ACHTUNG, UNGEPRÜFTE SETZUNG. Ob diese vier Werte das schweizerische
 * Erwachsenenschutzrecht (ZGB Art. 360 ff.) richtig abbilden, ist nicht
 * belegt. Vorsorgeauftrag, Beistandschaft und Vertretung bei medizinischen
 * Massnahmen sind dort verschiedene Rechtsinstitute mit verschiedenen
 * Voraussetzungen, und die Beistandschaft zerfällt ihrerseits in mehrere
 * Formen. Eine fachliche Prüfung steht aus; bis dahin ist die Liste eine
 * Arbeitsannahme und keine Rechtsgrundlage.
 */
export const VERTRETUNGSART = [
  { code: "vorsorgeauftrag", label: "Vorsorgeauftrag" },
  { code: "beistandschaft", label: "Beistandschaft" },
  { code: "medizinische_massnahmen", label: "Vertretung bei medizinischen Massnahmen" },
  { code: "unbekannt", label: "Art nicht bekannt" },
] as const;

export type VertretungsartCode = typeof VERTRETUNGSART[number]["code"];

export function vertretungsartLabel(code: string): string {
  /* Ohne Angabe steht „Art nicht bekannt" — eine leere Stelle liesse offen,
     ob niemand es weiss oder niemand gefragt hat. */
  return VERTRETUNGSART.find(v => v.code === code)?.label ?? "Art nicht bekannt";
}

/**
 * Wie die Zugehörigkeit bei einer externen Rolle heisst.
 *
 * Dieselbe Angabe, je nach Rolle anders benannt: eine Ärztin hat ein
 * Fachgebiet, ein Sozialdienst eine Stelle, ein Beistand eine Behörde.
 * Ein gemeinsames Feld mit einer Beschriftung je Rolle — statt dreier
 * Felder, von denen zwei immer leer stünden.
 */
export function zugehoerigkeitLabel(rolle: string): string {
  switch (rolle) {
    case "hausarzt":
    case "spezialarzt": return "Fachgebiet";
    case "sozialdienst": return "Stelle";
    case "beistand": return "Behörde";
    default: return "Zugehörigkeit";
  }
}

/** Wer die Person ist — angehörige Person, Mitarbeitende, oder nur ein Name. */
export type PersonBezug =
  | { art: "angehoeriger"; kennung: string }
  | { art: "mitarbeitende"; name: string }
  /* Dritte Personen — Ärztinnen, Beistände, Kontaktpersonen von
     Sozialdiensten — liegen im Kontaktbestand. Vorher stand hier nur ein
     Name ohne Verweis; derselbe Arzt kam damit so oft vor, wie er Patienten
     hatte. */
  | { art: "kontakt"; kennung: string };

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
  /* Die Zugehörigkeit — Fachgebiet, Stelle, Behörde — steht seit der
     Einführung des Kontaktobjekts am Kontakt. Sie beschreibt die Person,
     nicht ihr Verhältnis zu diesem Patienten. */
  /** Nur bei der Rolle `beistand`; leer = nicht bekannt. */
  vertretungsart: VertretungsartCode | "";
  bemerkung: string;
}

export function istAktiv(b: Beziehung): boolean {
  return b.ende.trim() === "";
}

/**
 * Name der Person einer Beziehung.
 *
 * Zwei Auflöser, weil zwei Bestände dahinterstehen: angehörige Personen und
 * Kontakte. Mitarbeitende tragen ihren Namen unmittelbar — für sie gibt es
 * im Cockpit keinen eigenen Bestand.
 */
export function personName(
  b: Beziehung,
  nameVon: (kennung: string) => string,
  kontaktVon: (kennung: string) => string = k => k,
): string {
  switch (b.person.art) {
    case "angehoeriger": return nameVon(b.person.kennung);
    case "kontakt": return kontaktVon(b.person.kennung);
    default: return b.person.name;
  }
}

/**
 * Ab wie vielen aktiven Beziehungen das Diagramm zusammenfasst.
 *
 * Darüber wird es zum Knäuel: die Linien kreuzen sich, und der Blick findet
 * die kräftige Linie zur abgerechneten Person nicht mehr.
 */
export const DIAGRAMM_MAX = 8;

export const SPEZIALAERZTE_LUECKE =
  "Spezialärzte stehen als Freitext am Patienten und erscheinen nicht im Netz.";

