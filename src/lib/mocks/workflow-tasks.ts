export type WorkflowTyp =
  | "SRK_ANMELDUNG"
  | "RE_ASSESSMENT"
  | "AUSWEIS_B_ANMELDUNG"
  | "QUELLENSTEUER_ANMELDUNG"
  | "KINDERZULAGEN_ANTRAG"
  | "LOHNANPASSUNG_NACH_SRK"
  | "AUSLAENDERRECHT_UNGEKLAERT";

export type TaskStatus = "offen" | "in_bearbeitung" | "erledigt";
export type Prioritaet = "hoch" | "mittel" | "niedrig";

export interface Person {
  name: string;
  initialen: string;
  color?: string;
}

export interface WorkflowTask {
  id: string;
  typ: WorkflowTyp;
  titel: string;
  kontext: string;
  betroffenePerson: Person;
  erstellt: string;
  faellig: string;
  status: TaskStatus;
  verantwortlich: Person;
  prioritaet: Prioritaet;
  /* ── Herkunft im Onboarding (optional) ────────────────────────────────────
     Werden unveraendert an UnifiedEntry durchgereicht. Bestandsaufgaben ohne
     diese Angaben verhalten sich wie bisher. */
  /** Onboarding-Kennung, aus der die Aufgabe entstanden ist. */
  ursprungOnboarding?: string;
  /** Formularabschnitt `<schritt>.<reiter>` — Sprungziel und Ort des Markers. */
  abschnitt?: string;
  /** Diese Aufgabe sperrt den Vertragsschritt. */
  sperrtVertrag?: boolean;
  /** Abschlusstext — nur bei erledigten Aufgaben, traegt Datum und handelnde Person. */
  abschlussText?: string;
}

export const workflowTypLabel: Record<WorkflowTyp, string> = {
  SRK_ANMELDUNG: "SRK-Anmeldung",
  RE_ASSESSMENT: "Re-Assessment",
  AUSWEIS_B_ANMELDUNG: "Ausweis B",
  QUELLENSTEUER_ANMELDUNG: "Quellensteuer",
  KINDERZULAGEN_ANTRAG: "Kinderzulagen",
  LOHNANPASSUNG_NACH_SRK: "Lohnanpassung",
  AUSLAENDERRECHT_UNGEKLAERT: "Ausländerrecht",
};

const P = {
  MK: { name: "Maria Keller", initialen: "MK", color: "#4F46E5" },
  KM: { name: "Kathrin Meier", initialen: "KM", color: "#059669" },
  SW: { name: "Sandra Weber", initialen: "SW", color: "#D97706" },
  LB: { name: "Laura Brunner", initialen: "LB", color: "#DC2626" },
  TS: { name: "Thomas Schmid", initialen: "TS", color: "#2563EB" },
};

export const CURRENT_USER = "MK";
export const MY_TEAM = ["MK", "KM", "SW"];

export const workflowTasks: WorkflowTask[] = [
  { id: "W-0142", typ: "SRK_ANMELDUNG", titel: "SRK-Kursanmeldung", kontext: "Vertragsstart 15.01.2026 · Anmeldung ausstehend", betroffenePerson: { name: "Ayşe Yılmaz", initialen: "AY" }, erstellt: "2026-07-19", faellig: "2026-08-02", status: "offen", verantwortlich: P.MK, prioritaet: "hoch" },
  { id: "W-0143", typ: "SRK_ANMELDUNG", titel: "SRK-Kursanmeldung", kontext: "Vertragsstart 01.02.2026 · Frist läuft", betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstellt: "2026-07-14", faellig: "2026-08-06", status: "offen", verantwortlich: P.KM, prioritaet: "hoch" },
  { id: "W-0144", typ: "SRK_ANMELDUNG", titel: "SRK-Kursanmeldung", kontext: "Vertragsstart 10.02.2026 · noch nicht angemeldet", betroffenePerson: { name: "Dragana Petrović", initialen: "DP" }, erstellt: "2026-07-24", faellig: "2026-08-11", status: "offen", verantwortlich: P.MK, prioritaet: "mittel" },
  { id: "W-0145", typ: "RE_ASSESSMENT", titel: "Re-Assessment", kontext: "Letzte Einstufung 03.09.2025 · halbjährlich fällig", betroffenePerson: { name: "Monika Brunner", initialen: "MB" }, erstellt: "2026-07-22", faellig: "2026-08-04", status: "offen", verantwortlich: P.SW, prioritaet: "hoch" },
  { id: "W-0146", typ: "RE_ASSESSMENT", titel: "Re-Assessment", kontext: "Pflegestufe-Überprüfung nach Spitalaufenthalt", betroffenePerson: { name: "Peter Müller", initialen: "PM" }, erstellt: "2026-07-26", faellig: "2026-08-09", status: "in_bearbeitung", verantwortlich: P.SW, prioritaet: "hoch" },
  { id: "W-0147", typ: "RE_ASSESSMENT", titel: "Re-Assessment", kontext: "Schweregrad-Verschlechterung gemeldet", betroffenePerson: { name: "Elisabeth Hofer", initialen: "EH" }, erstellt: "2026-07-29", faellig: "2026-08-13", status: "offen", verantwortlich: P.LB, prioritaet: "mittel" },
  { id: "W-0148", typ: "RE_ASSESSMENT", titel: "Re-Assessment", kontext: "Routinemässige Halbjahres-Überprüfung", betroffenePerson: { name: "Jakob Weber", initialen: "JW" }, erstellt: "2026-08-02", faellig: "2026-08-16", status: "offen", verantwortlich: P.SW, prioritaet: "mittel" },
  { id: "W-0149", typ: "AUSWEIS_B_ANMELDUNG", titel: "Ausweis-B-Anmeldung", kontext: "Aufenthaltsbewilligung B erteilt · Anmeldung Migrationsamt", betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstellt: "2026-07-24", faellig: "2026-08-11", status: "offen", verantwortlich: P.MK, prioritaet: "mittel" },
  { id: "W-0150", typ: "AUSWEIS_B_ANMELDUNG", titel: "Ausweis-B-Anmeldung", kontext: "Bewilligung seit 25.01.2026 · Meldefrist 30 Tage", betroffenePerson: { name: "Fatima Al-Hassan", initialen: "FA" }, erstellt: "2026-07-09", faellig: "2026-07-26", status: "offen", verantwortlich: P.KM, prioritaet: "hoch" },
  { id: "W-0151", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung", kontext: "Steueramt Zürich · Tarif A", betroffenePerson: { name: "Ayşe Yılmaz", initialen: "AY" }, erstellt: "2026-07-05", faellig: "2026-08-01", status: "offen", verantwortlich: P.MK, prioritaet: "hoch" },
  { id: "W-0152", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung", kontext: "Steueramt Winterthur · Tarif B", betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstellt: "2026-07-14", faellig: "2026-08-06", status: "offen", verantwortlich: P.MK, prioritaet: "mittel" },
  { id: "W-0153", typ: "KINDERZULAGEN_ANTRAG", titel: "Kinderzulagen-Antrag", kontext: "2 Kinder · Nachweis Geburtsurkunden eingereicht", betroffenePerson: { name: "Fatima Al-Hassan", initialen: "FA" }, erstellt: "2026-07-16", faellig: "2026-08-21", status: "in_bearbeitung", verantwortlich: P.KM, prioritaet: "mittel" },
  { id: "W-0154", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs", kontext: "SRK-Kurs bestanden am 20.02.2026 · rückwirkend ab Kursdatum", betroffenePerson: { name: "Dragana Petrović", initialen: "DP" }, erstellt: "2026-07-25", faellig: "2026-08-26", status: "offen", verantwortlich: P.MK, prioritaet: "niedrig" },
  { id: "W-0155", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs", kontext: "Kursbestätigung erhalten", betroffenePerson: { name: "Peter Müller", initialen: "PM" }, erstellt: "2026-08-03", faellig: "2026-09-02", status: "offen", verantwortlich: P.MK, prioritaet: "niedrig" },
  { id: "W-0156", typ: "RE_ASSESSMENT", titel: "Re-Assessment", kontext: "Routine · halbjährlich", betroffenePerson: { name: "Hans Ebert", initialen: "HE" }, erstellt: "2026-08-02", faellig: "2026-09-06", status: "offen", verantwortlich: P.SW, prioritaet: "niedrig" },

  /* ── Aufgaben mit Onboarding-Herkunft (Fall OB-2026-101, Steiner) ─────────
     Sie tragen ursprungOnboarding, abschnitt und — wo zutreffend — sperrtVertrag.
     Damit erscheinen sie in der linken Spalte des Onboardings und als Marker im
     jeweiligen Formularabschnitt. Fall OB-2026-107 (Bösiger) traegt bewusst
     KEINE solche Aufgabe: er zeigt den Leerzustand. */
  { id: "W-0160", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer anmelden",
    kontext: "Quellensteuerpflichtig, beim Steueramt anzumelden · Tarifcode B1Y, abgeleitet · Der Tarifsatz richtet sich nach dem Wohnsitzkanton der angestellten Person",
    betroffenePerson: { name: "Vera Steiner", initialen: "VS" }, erstellt: "2026-07-28", faellig: "2026-08-11",
    status: "offen", verantwortlich: P.MK, prioritaet: "hoch",
    ursprungOnboarding: "OB-2026-101", abschnitt: "angehoeriger.steuer" },

  { id: "W-0161", typ: "KINDERZULAGEN_ANTRAG", titel: "Familienzulagen beantragen",
    kontext: "Antrag bei der Familienausgleichskasse · 2 Kinder · Beizulegen: Geburts- oder Familienurkunde",
    betroffenePerson: { name: "Vera Steiner", initialen: "VS" }, erstellt: "2026-07-29", faellig: "2026-08-18",
    status: "offen", verantwortlich: P.KM, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-101", abschnitt: "angehoeriger.kinder" },

  { id: "W-0162", typ: "KINDERZULAGEN_ANTRAG", titel: "Ausbildungsbestätigung für Lina Steiner einholen",
    kontext: "Ausbildungszulage beansprucht · Die Bestätigung muss auf das einzelne Kind lauten, ein Sammeldokument genügt nicht",
    betroffenePerson: { name: "Vera Steiner", initialen: "VS" }, erstellt: "2026-07-30", faellig: "2026-08-25",
    status: "offen", verantwortlich: P.KM, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-101", abschnitt: "angehoeriger.kinder" },

  { id: "W-0163", typ: "KINDERZULAGEN_ANTRAG", titel: "Ausbildungsbestätigung für Nino Steiner einholen",
    kontext: "Ausbildungszulage beansprucht · jährlich zu erneuern",
    betroffenePerson: { name: "Vera Steiner", initialen: "VS" }, erstellt: "2026-07-20", faellig: "2026-08-04",
    status: "erledigt", verantwortlich: P.MK, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-101", abschnitt: "angehoeriger.kinder",
    abschlussText: "Am 30.07.2026 durch Maria Keller erledigt · Bestätigung der Kantonsschule vom 24.07.2026 abgelegt" },

  /* ── OB-2026-102 · Hübscher-Wiederkehr — nur Quellensteuer, nicht sperrend ── */
  { id: "W-0164", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer anmelden",
    kontext: "Abweichend festgelegt: abgeleitet wäre B1Y, festgelegt ist L1Y · Begründung Grenzgängerin Deutschland · Bitte vor der Anmeldung prüfen",
    betroffenePerson: { name: "Beatrice Hübscher-Wiederkehr", initialen: "BH" }, erstellt: "2026-08-01", faellig: "2026-08-20",
    status: "offen", verantwortlich: P.KM, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-102", abschnitt: "angehoeriger.steuer" },

  /* ── OB-2026-103 · Rexhepi — der Ausländerrecht-Fall. Der Fall trägt bereits
     den Abrechnungsstopp «Spezialbewilligung Migrationsamt noch ausstehend». ── */
  { id: "W-0165", typ: "AUSWEIS_B_ANMELDUNG", titel: "Arbeitsbewilligung beantragen",
    kontext: "Ausweis B · gebührenpflichtig, Arbeitsaufnahme erst nach Erteilung · Zuständig: Migrationsamt im Kanton ZH · Die bisherige Bewilligung ist an den vorherigen Arbeitgeber gebunden",
    betroffenePerson: { name: "Arben Rexhepi", initialen: "AR" }, erstellt: "2026-07-25", faellig: "2026-08-08",
    status: "offen", verantwortlich: P.SW, prioritaet: "hoch",
    ursprungOnboarding: "OB-2026-103", abschnitt: "angehoeriger.personalien", sperrtVertrag: true },
  { id: "W-0166", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer anmelden",
    kontext: "Quellensteuerpflichtig, beim Steueramt anzumelden · Tarifcode A0N, abgeleitet",
    betroffenePerson: { name: "Arben Rexhepi", initialen: "AR" }, erstellt: "2026-07-27", faellig: "2026-08-22",
    status: "offen", verantwortlich: P.SW, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-103", abschnitt: "angehoeriger.steuer" },

  /* ── OB-2026-104 · Kaya — offen plus erledigt, beide Markerzustände nebeneinander ── */
  { id: "W-0167", typ: "AUSWEIS_B_ANMELDUNG", titel: "Ausländerrechtliches Verfahren abklären",
    kontext: "Verfahren nicht bestimmbar, weil eine Angabe fehlt: Aufenthaltsgrund · Bei Ausweis B aus einem Drittstaat entscheidet der Grund über das Verfahren; er steht in der Verfügung des Migrationsamts",
    betroffenePerson: { name: "Yusuf Kaya", initialen: "YK" }, erstellt: "2026-08-02", faellig: "2026-08-28",
    status: "offen", verantwortlich: P.SW, prioritaet: "niedrig",
    ursprungOnboarding: "OB-2026-104", abschnitt: "angehoeriger.personalien" },
  { id: "W-0168", typ: "KINDERZULAGEN_ANTRAG", titel: "Ausbildungsbestätigung für Elif Kaya einholen",
    kontext: "Ausbildungszulage beansprucht · jährlich zu erneuern",
    betroffenePerson: { name: "Yusuf Kaya", initialen: "YK" }, erstellt: "2026-07-18", faellig: "2026-08-01",
    status: "erledigt", verantwortlich: P.SW, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-104", abschnitt: "angehoeriger.kinder",
    abschlussText: "Am 29.07.2026 durch Sandra Weber erledigt · Lehrvertrag vom 20.07.2026 abgelegt" },

  /* ── OB-2026-105 · Huber — Kinderzulagen ── */
  { id: "W-0169", typ: "KINDERZULAGEN_ANTRAG", titel: "Familienzulagen beantragen",
    kontext: "Antrag bei der Familienausgleichskasse · 1 Kind · Angaben zum anderen Elternteil beilegen, die Kasse prüft den Anspruch",
    betroffenePerson: { name: "Erika Huber", initialen: "EH" }, erstellt: "2026-07-31", faellig: "2026-08-27",
    status: "offen", verantwortlich: P.MK, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-105", abschnitt: "angehoeriger.kinder" },

  /* ── OB-2026-106 · Da Silva — zweiter sperrender Fall, Fall ohne zugewiesene Person ── */
  { id: "W-0170", typ: "AUSWEIS_B_ANMELDUNG", titel: "Stellenantritt melden",
    kontext: "Ausweis F · Die Meldung ist kostenlos, unmittelbar danach darf gearbeitet werden · Meldekanal: EasyGov oder das kantonale Formular",
    betroffenePerson: { name: "Marta Da Silva", initialen: "MD" }, erstellt: "2026-07-26", faellig: "2026-08-09",
    status: "offen", verantwortlich: P.MK, prioritaet: "hoch",
    ursprungOnboarding: "OB-2026-106", abschnitt: "angehoeriger.personalien", sperrtVertrag: true },
  { id: "W-0171", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer anmelden",
    kontext: "Quellensteuerpflichtig, beim Steueramt anzumelden · Tarifcode C0N, abgeleitet",
    betroffenePerson: { name: "Marta Da Silva", initialen: "MD" }, erstellt: "2026-08-04", faellig: "2026-09-01",
    status: "offen", verantwortlich: P.MK, prioritaet: "niedrig",
    ursprungOnboarding: "OB-2026-106", abschnitt: "angehoeriger.steuer" },

  /* ── OB-2026-108 · Ferrari — ausschliesslich erledigt: Marker im zweiten
     Zustand, linke Spalte zeigt trotzdem den Leerzustand. ── */
  { id: "W-0172", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer anmelden",
    kontext: "Quellensteuerpflichtig, beim Steueramt anzumelden · Tarifcode C2Y, abgeleitet",
    betroffenePerson: { name: "Lucia Ferrari", initialen: "LF" }, erstellt: "2026-07-15", faellig: "2026-07-30",
    status: "erledigt", verantwortlich: P.LB, prioritaet: "mittel",
    ursprungOnboarding: "OB-2026-108", abschnitt: "angehoeriger.steuer",
    abschlussText: "Am 28.07.2026 durch Laura Brunner erledigt · Beim Steueramt Zürich angemeldet, Tarifcode C2Y" },
];
