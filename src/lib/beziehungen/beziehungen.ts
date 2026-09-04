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
  { code: "therapie", label: "Therapie", seite: "extern" },
  { code: "apotheke", label: "Apotheke", seite: "extern" },
  { code: "spital", label: "Spital oder Klinik", seite: "extern" },
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

/**
 * Kategorie einer Rolle — die Gruppierung im Bezugsteam läuft über diese
 * Ableitung, NICHT über `rolleSeite`. Einzige Stelle der Zuordnung.
 *
 * `pflegende_angehoerige` erscheint in der Liste unter `bezugsperson`, ist aber
 * im Dialog nicht wählbar (sie entsteht aus dem Angehörigen-Reiter).
 */
export type PersonKategorie = "benutzer" | "fachpersonal" | "bezugsperson";

const KATEGORIE_JE_ROLLE: Record<BeziehungsrolleCode, PersonKategorie> = {
  bezugsperson: "benutzer",
  stellvertretung: "benutzer",
  hausarzt: "fachpersonal",
  spezialarzt: "fachpersonal",
  therapie: "fachpersonal",
  apotheke: "fachpersonal",
  spital: "fachpersonal",
  angehoerige: "bezugsperson",
  beistand: "bezugsperson",
  sozialdienst: "bezugsperson",
  weitere: "bezugsperson",
  pflegende_angehoerige: "bezugsperson",
};

export function kategorieFuerRolle(rolle: BeziehungsrolleCode): PersonKategorie {
  return KATEGORIE_JE_ROLLE[rolle] ?? "bezugsperson";
}

/** Anzeige und Reihenfolge der Kategorien. `labelPlural` für Gruppenüberschriften. */
export const KATEGORIEN: { code: PersonKategorie; label: string; labelPlural: string }[] = [
  { code: "benutzer", label: "Benutzer", labelPlural: "Benutzer" },
  { code: "fachpersonal", label: "Medizinisches Fachpersonal", labelPlural: "Medizinisches Fachpersonal" },
  { code: "bezugsperson", label: "Bezugsperson", labelPlural: "Bezugspersonen" },
];

export function kategorieLabel(code: PersonKategorie): string {
  return KATEGORIEN.find(k => k.code === code)?.label ?? code;
}

/** Wählbare Rollen je Kategorie im Dialog (ohne pflegende_angehoerige). */
export const ROLLEN_JE_KATEGORIE: Record<PersonKategorie, BeziehungsrolleCode[]> = {
  benutzer: ["bezugsperson", "stellvertretung"],
  fachpersonal: ["hausarzt", "spezialarzt", "therapie", "apotheke", "spital"],
  bezugsperson: ["angehoerige", "beistand", "sozialdienst", "weitere"],
};

/**
 * Personentyp je Rolle — Person oder Organisation, an EINER Stelle festgelegt
 * (neben `kategorieFuerRolle`). `umschalter` nur beim Beistand, der beides sein
 * kann; bei allen anderen steht der Typ fest und wird nicht gefragt.
 */
export type Personentyp = "person" | "organisation" | "umschalter";

const PERSONENTYP_JE_ROLLE: Record<BeziehungsrolleCode, Personentyp> = {
  hausarzt: "person",
  spezialarzt: "person",
  therapie: "person",
  apotheke: "organisation",
  spital: "organisation",
  sozialdienst: "organisation",
  beistand: "umschalter",
  angehoerige: "person",
  weitere: "person",
  bezugsperson: "person",       // Benutzer — im Dialog nicht anlegbar
  stellvertretung: "person",
  pflegende_angehoerige: "person",
};

export function personentypFuerRolle(rolle: BeziehungsrolleCode): Personentyp {
  return PERSONENTYP_JE_ROLLE[rolle] ?? "person";
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
 * Beistandschaft — Umfang der Vertretung, nur bei der Rolle `beistand`.
 *
 * Mehrwertig: eine Person kann administrative UND gesundheitliche Vertretung
 * zugleich tragen, oder einen Vorsorgeauftrag. Das frühere einwertige Feld
 * `vertretungsart` konnte das nicht.
 *
 * ACHTUNG, VORLÄUFIGE SETZUNG. Ob diese drei Merkmale das schweizerische
 * Erwachsenenschutzrecht (ZGB Art. 360 ff.) richtig schneiden, ist nicht
 * belegt; die Abbildung der alten Werte (siehe beistandschaftAusVertretungsart)
 * bestätigt Person B. Bis dahin Arbeitsannahme, keine Rechtsgrundlage.
 *
 * `gesundheit` ist das gefährliche Merkmal: daraus folgt, wer einer Behandlung
 * zustimmen darf. Es wird nie aus etwas anderem angenommen, sondern nur, wenn
 * es ausdrücklich gesetzt ist.
 */
export interface Beistandschaft {
  administrativ: boolean;
  gesundheit: boolean;
  vorsorgeauftrag: boolean;
}

export function leereBeistandschaft(): Beistandschaft {
  return { administrativ: false, gesundheit: false, vorsorgeauftrag: false };
}

export const BEISTANDSCHAFT_ARTEN: { code: keyof Beistandschaft; label: string; hinweis?: string }[] = [
  { code: "administrativ", label: "Administrativ" },
  { code: "gesundheit", label: "Gesundheit", hinweis: "Gesundheit entscheidet, wer einer Behandlung zustimmen darf." },
  { code: "vorsorgeauftrag", label: "Vorsorgeauftrag" },
];

/** Beschriftungen der gesetzten Merkmale, in fester Reihenfolge. */
export function beistandschaftLabels(b: Beistandschaft | undefined): string[] {
  if (!b) return [];
  return BEISTANDSCHAFT_ARTEN.filter(a => b[a.code]).map(a => a.label);
}

export function istBeistandschaftErfasst(b: Beistandschaft | undefined): boolean {
  return !!b && (b.administrativ || b.gesundheit || b.vorsorgeauftrag);
}

/**
 * Abbildung der vier alten `vertretungsart`-Werte auf die Merkmale.
 * Vorläufig bis zur Bestätigung durch Person B.
 */
export function beistandschaftAusVertretungsart(code: string): Beistandschaft {
  switch (code) {
    case "vorsorgeauftrag": return { administrativ: false, gesundheit: false, vorsorgeauftrag: true };
    case "medizinische_massnahmen": return { administrativ: false, gesundheit: true, vorsorgeauftrag: false };
    case "beistandschaft": return { administrativ: true, gesundheit: false, vorsorgeauftrag: false };
    default: return leereBeistandschaft(); // "unbekannt" und Leerwert: Umfang nicht erfasst
  }
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
    case "spital": return "Abteilung";
    case "apotheke": return "Filiale";
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
  /** Kraft Willenserklärung der Klientin in der Patientenverfügung bezeichnet
   *  (Art. 370 ff. ZGB) — nicht kraft behördlicher Anordnung. Optional, damit
   *  bestehende Datensätze unberührt bleiben; fehlend = false. */
  inPatientenverfuegungBezeichnet?: boolean;
  telefon: string;
  /* Die Zugehörigkeit — Fachgebiet, Stelle, Behörde — steht seit der
     Einführung des Kontaktobjekts am Kontakt. Sie beschreibt die Person,
     nicht ihr Verhältnis zu diesem Patienten. */
  /** Nur bei der Rolle `beistand`; alle false = Umfang nicht erfasst. */
  beistandschaft: Beistandschaft;
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


