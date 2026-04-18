export type WorkflowTyp =
  | "SRK_ANMELDUNG"
  | "RE_ASSESSMENT"
  | "AUSWEIS_B_ANMELDUNG"
  | "QUELLENSTEUER_ANMELDUNG"
  | "KINDERZULAGEN_ANTRAG"
  | "LOHNANPASSUNG_NACH_SRK";

export type TaskStatus = "offen" | "in_bearbeitung" | "erledigt";

export interface WorkflowTask {
  id: string;
  typ: WorkflowTyp;
  titel: string;
  kontext: string;
  betroffenePerson: { name: string; initialen: string };
  erstellt: string;
  faellig: string;
  status: TaskStatus;
  verantwortlich: { name: string; initialen: string };
}

export const workflowTypLabel: Record<WorkflowTyp, string> = {
  SRK_ANMELDUNG: "SRK-Anmeldung",
  RE_ASSESSMENT: "Re-Assessment",
  AUSWEIS_B_ANMELDUNG: "Ausweis B",
  QUELLENSTEUER_ANMELDUNG: "Quellensteuer",
  KINDERZULAGEN_ANTRAG: "Kinderzulagen",
  LOHNANPASSUNG_NACH_SRK: "Lohnanpassung",
};

export const workflowTasks: WorkflowTask[] = [
  // SRK_ANMELDUNG — 3 offen
  { id: "WF-001", typ: "SRK_ANMELDUNG", titel: "SRK-Kursanmeldung für Ayşe Yılmaz", kontext: "Vertragsstart 15.01.2026 · Anmeldung ausstehend", betroffenePerson: { name: "Ayşe Yılmaz", initialen: "AY" }, erstellt: "2026-01-20", faellig: "2026-03-01", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-002", typ: "SRK_ANMELDUNG", titel: "SRK-Kursanmeldung für Carlos Silva", kontext: "Vertragsstart 01.02.2026 · Frist läuft", betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstellt: "2026-02-05", faellig: "2026-03-05", status: "offen", verantwortlich: { name: "Kathrin Meier", initialen: "KM" } },
  { id: "WF-003", typ: "SRK_ANMELDUNG", titel: "SRK-Kursanmeldung für Dragana Petrović", kontext: "Vertragsstart 10.02.2026 · noch nicht angemeldet", betroffenePerson: { name: "Dragana Petrović", initialen: "DP" }, erstellt: "2026-02-12", faellig: "2026-03-10", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },

  // RE_ASSESSMENT — 4 offen
  { id: "WF-004", typ: "RE_ASSESSMENT", titel: "Re-Assessment bei Monika Brunner", kontext: "Letzte Einstufung 03.09.2025 · halbjährlich fällig", betroffenePerson: { name: "Monika Brunner", initialen: "MB" }, erstellt: "2026-02-15", faellig: "2026-03-03", status: "offen", verantwortlich: { name: "Sandra Weber", initialen: "SW" } },
  { id: "WF-005", typ: "RE_ASSESSMENT", titel: "Re-Assessment bei Peter Müller", kontext: "Pflegestufe-Überprüfung nach Spitalaufenthalt", betroffenePerson: { name: "Peter Müller", initialen: "PM" }, erstellt: "2026-02-18", faellig: "2026-03-08", status: "offen", verantwortlich: { name: "Sandra Weber", initialen: "SW" } },
  { id: "WF-006", typ: "RE_ASSESSMENT", titel: "Re-Assessment bei Elisabeth Hofer", kontext: "Schweregrad-Verschlechterung gemeldet", betroffenePerson: { name: "Elisabeth Hofer", initialen: "EH" }, erstellt: "2026-02-20", faellig: "2026-03-12", status: "offen", verantwortlich: { name: "Laura Brunner", initialen: "LB" } },
  { id: "WF-007", typ: "RE_ASSESSMENT", titel: "Re-Assessment bei Jakob Weber", kontext: "Routinemässige Halbjahres-Überprüfung", betroffenePerson: { name: "Jakob Weber", initialen: "JW" }, erstellt: "2026-02-22", faellig: "2026-03-15", status: "offen", verantwortlich: { name: "Sandra Weber", initialen: "SW" } },

  // AUSWEIS_B_ANMELDUNG — 2 offen
  { id: "WF-008", typ: "AUSWEIS_B_ANMELDUNG", titel: "Ausweis-B-Anmeldung für Carlos Silva", kontext: "Aufenthaltsbewilligung B erteilt · Anmeldung Migrationsamt", betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstellt: "2026-02-10", faellig: "2026-03-10", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-009", typ: "AUSWEIS_B_ANMELDUNG", titel: "Ausweis-B-Anmeldung für Fatima Al-Hassan", kontext: "Bewilligung seit 20.02.2026 · Meldefrist 30 Tage", betroffenePerson: { name: "Fatima Al-Hassan", initialen: "FA" }, erstellt: "2026-02-21", faellig: "2026-03-22", status: "offen", verantwortlich: { name: "Kathrin Meier", initialen: "KM" } },

  // QUELLENSTEUER_ANMELDUNG — 5 offen
  { id: "WF-010", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung Ayşe Yılmaz", kontext: "Steueramt Zürich · Tarif A", betroffenePerson: { name: "Ayşe Yılmaz", initialen: "AY" }, erstellt: "2026-01-25", faellig: "2026-02-28", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-011", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung Carlos Silva", kontext: "Steueramt Winterthur · Tarif B", betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstellt: "2026-02-05", faellig: "2026-03-05", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-012", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung Dragana Petrović", kontext: "Steueramt Zürich · Tarif A", betroffenePerson: { name: "Dragana Petrović", initialen: "DP" }, erstellt: "2026-02-14", faellig: "2026-03-14", status: "offen", verantwortlich: { name: "Kathrin Meier", initialen: "KM" } },
  { id: "WF-013", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung Fatima Al-Hassan", kontext: "Steueramt Winterthur · Tarif C", betroffenePerson: { name: "Fatima Al-Hassan", initialen: "FA" }, erstellt: "2026-02-22", faellig: "2026-03-22", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-014", typ: "QUELLENSTEUER_ANMELDUNG", titel: "Quellensteuer-Anmeldung Liridona Berisha", kontext: "Steueramt Zürich · Tarif A", betroffenePerson: { name: "Liridona Berisha", initialen: "LB" }, erstellt: "2026-02-25", faellig: "2026-03-25", status: "offen", verantwortlich: { name: "Kathrin Meier", initialen: "KM" } },

  // KINDERZULAGEN_ANTRAG — 1 offen
  { id: "WF-015", typ: "KINDERZULAGEN_ANTRAG", titel: "Kinderzulagen-Antrag für Ayşe Yılmaz", kontext: "2 Kinder unter 16 · Antrag bei SVA Zürich", betroffenePerson: { name: "Ayşe Yılmaz", initialen: "AY" }, erstellt: "2026-02-01", faellig: "2026-03-01", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },

  // LOHNANPASSUNG_NACH_SRK — 5 offen
  { id: "WF-016", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs — Sandra Weber", kontext: "SRK-Kurs bestanden am 10.02.2026 · Lohn noch nicht angepasst", betroffenePerson: { name: "Sandra Weber", initialen: "SW" }, erstellt: "2026-02-11", faellig: "2026-03-01", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-017", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs — Kathrin Meier", kontext: "SRK-Kurs bestanden am 14.02.2026", betroffenePerson: { name: "Kathrin Meier", initialen: "KM" }, erstellt: "2026-02-15", faellig: "2026-03-03", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-018", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs — Laura Brunner", kontext: "SRK-Kurs bestanden am 18.02.2026", betroffenePerson: { name: "Laura Brunner", initialen: "LB" }, erstellt: "2026-02-19", faellig: "2026-03-05", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
  { id: "WF-019", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs — Marco Rossi", kontext: "SRK-Kurs bestanden am 20.02.2026", betroffenePerson: { name: "Marco Rossi", initialen: "MR" }, erstellt: "2026-02-21", faellig: "2026-03-07", status: "offen", verantwortlich: { name: "Kathrin Meier", initialen: "KM" } },
  { id: "WF-020", typ: "LOHNANPASSUNG_NACH_SRK", titel: "Lohnanpassung nach SRK-Kurs — Jelena Nikolić", kontext: "SRK-Kurs bestanden am 24.02.2026", betroffenePerson: { name: "Jelena Nikolić", initialen: "JN" }, erstellt: "2026-02-25", faellig: "2026-03-10", status: "offen", verantwortlich: { name: "Maria Keller", initialen: "MK" } },
];
