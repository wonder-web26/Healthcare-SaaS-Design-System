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
  /**
   * Wo die Person hingehört — Fachgebiet, Stelle, Behörde.
   *
   * Nur bei externen Rollen belegt. Vorher lag das Fachgebiet des Hausarzts
   * in `bemerkung`; sobald ein zweiter externer Verwender dazukam, hätten
   * zwei verschiedene Aussagen im selben Feld gestanden.
   */
  zugehoerigkeit: string;
  /** Nur bei der Rolle `beistand`; leer = nicht bekannt. */
  vertretungsart: VertretungsartCode | "";
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

/* ══════════════════════════════════════════
   ABGELEITETE BEZIEHUNG — DER HAUSARZT
   ══════════════════════════════════════════ */

/** Kennung der abgeleiteten Hausarzt-Beziehung eines Patienten. */
export function hausarztBeziehungId(patientId: string): string {
  return `HA-${patientId}`;
}

/**
 * Der Hausarzt als Beziehung — abgeleitet, nicht gespeichert.
 *
 * Er steht in den Stammdaten, und dort gehört er hin: er ist eine Angabe zum
 * Patienten, kein eigener Datensatz. Würde die Beziehung zusätzlich im
 * Bestand liegen, gäbe es zwei Quellen für dieselbe Aussage, und die
 * zweite ginge beim ersten Ändern des Feldes falsch. Darum wird sie bei
 * jedem Lesen aus dem Feld gebildet: ändert sich der Name, ändert sich die
 * Beziehung; wird er entfernt, verschwindet sie.
 *
 * Folgerichtig ist sie **nicht beendbar**. Das Modell beendet, statt zu
 * löschen — aber ein Enddatum liesse sich nirgends hinschreiben, und der
 * nächste Lesevorgang bildete die Beziehung neu. Die Ansicht sagt das,
 * statt einen Knopf anzubieten, der nichts bewirkt.
 *
 * Das Fachgebiet steht in `zugehoerigkeit` — dem Feld, das bei externen
 * Rollen sagt, wo jemand hingehört.
 *
 * `beginn` bleibt leer. Wann jemand Hausarzt wurde, steht nirgends; ein
 * Datum zu setzen hiesse, es zu erfinden.
 */
export function hausarztBeziehung(p: {
  id: string; hausarztName: string; hausarztTelefon: string; hausarztFachgebiet: string;
}): Beziehung | null {
  const name = p.hausarztName.trim();
  if (!name) return null;
  return {
    id: hausarztBeziehungId(p.id),
    patientId: p.id,
    person: { art: "ohne_datensatz", name },
    rolle: "hausarzt",
    art: "",
    beginn: "",
    ende: "",
    notfallkontakt: false,
    auskunftsberechtigt: false,
    telefon: p.hausarztTelefon.trim(),
    zugehoerigkeit: p.hausarztFachgebiet.trim(),
    vertretungsart: "",
    bemerkung: "",
  };
}

/**
 * Spezialärzte bleiben aussen vor — bekannte Lücke.
 *
 * `spezialAerzte` steht am Patienten als Freitext und trägt oft mehrere
 * Namen in einer Zeile. Daraus Knoten zu bilden hiesse, an Kommas zu raten:
 * „Dr. Meier, Kardiologie" wären zwei Namen statt einer Person mit Fach.
 * Erfasst gehörten sie als eigene Angaben, je Person mit Name, Fachgebiet
 * und Telefon — dann folgte die Beziehung daraus wie beim Hausarzt.
 */
export const SPEZIALAERZTE_LUECKE =
  "Spezialärzte stehen als Freitext am Patienten und erscheinen nicht im Netz.";

/** Vermerk an der abgeleiteten Zeile — im Wortlaut, damit er nur einmal steht. */
export const ABGELEITET_VERMERK = "aus den Stammdaten";
