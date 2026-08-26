export type WorkflowTyp =
  | "SRK_ANMELDUNG"
  | "RE_ASSESSMENT"
  | "AUSWEIS_B_ANMELDUNG"
  | "QUELLENSTEUER_ANMELDUNG"
  | "KINDERZULAGEN_ANTRAG"
  | "LOHNANPASSUNG_NACH_SRK";

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
}

export const workflowTypLabel: Record<WorkflowTyp, string> = {
  SRK_ANMELDUNG: "SRK-Anmeldung",
  RE_ASSESSMENT: "Re-Assessment",
  AUSWEIS_B_ANMELDUNG: "Ausweis B",
  QUELLENSTEUER_ANMELDUNG: "Quellensteuer",
  KINDERZULAGEN_ANTRAG: "Kinderzulagen",
  LOHNANPASSUNG_NACH_SRK: "Lohnanpassung",
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
];
