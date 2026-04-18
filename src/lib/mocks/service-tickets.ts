export type TicketTyp =
  | "SCHLUESSEL"
  | "ANFRAGE"
  | "PROBLEM"
  | "MELDUNG";

export type TicketStatus = "offen" | "in_bearbeitung" | "erledigt";

export interface ServiceTicket {
  id: string;
  typ: TicketTyp;
  titel: string;
  beschreibung: string;
  betroffenePerson: { name: string; initialen: string } | null;
  erstelltVon: { name: string; initialen: string };
  erstellt: string;
  faellig: string | null;
  status: TicketStatus;
  verantwortlich: { name: string; initialen: string };
  kommentare: [];
}

export const ticketTypLabel: Record<TicketTyp, string> = {
  SCHLUESSEL: "Schlüssel",
  ANFRAGE: "Anfrage",
  PROBLEM: "Problem",
  MELDUNG: "Meldung",
};

export const serviceTickets: ServiceTicket[] = [
  {
    id: "ST-001",
    typ: "SCHLUESSEL",
    titel: "Schlüsselübergabe bei Monika Brunner",
    beschreibung: "Wohnungsschlüssel für neue Pflegekraft muss übergeben werden.",
    betroffenePerson: { name: "Monika Brunner", initialen: "MB" },
    erstelltVon: { name: "Sandra Weber", initialen: "SW" },
    erstellt: "2026-02-27",
    faellig: "2026-03-04",
    status: "offen",
    verantwortlich: { name: "Sandra Weber", initialen: "SW" },
    kommentare: [],
  },
  {
    id: "ST-002",
    typ: "ANFRAGE",
    titel: "Pensum-Änderung Kathrin Meier",
    beschreibung: "Kathrin Meier möchte ab April von 80% auf 60% reduzieren.",
    betroffenePerson: { name: "Kathrin Meier", initialen: "KM" },
    erstelltVon: { name: "Maria Keller", initialen: "MK" },
    erstellt: "2026-02-25",
    faellig: "2026-03-15",
    status: "in_bearbeitung",
    verantwortlich: { name: "Maria Keller", initialen: "MK" },
    kommentare: [],
  },
  {
    id: "ST-003",
    typ: "PROBLEM",
    titel: "MedLink-Zugang für Laura Brunner gesperrt",
    beschreibung: "Login funktioniert seit Montag nicht mehr. Passwort-Reset ohne Erfolg.",
    betroffenePerson: { name: "Laura Brunner", initialen: "LB" },
    erstelltVon: { name: "Laura Brunner", initialen: "LB" },
    erstellt: "2026-03-01",
    faellig: "2026-03-03",
    status: "offen",
    verantwortlich: { name: "Maria Keller", initialen: "MK" },
    kommentare: [],
  },
  {
    id: "ST-004",
    typ: "MELDUNG",
    titel: "Sturzmeldung Hans Keller",
    beschreibung: "Patient Hans Keller ist am 28.02. in der Wohnung gestürzt. Keine schweren Verletzungen, Arzt informiert.",
    betroffenePerson: { name: "Hans Keller", initialen: "HK" },
    erstelltVon: { name: "Kathrin Meier", initialen: "KM" },
    erstellt: "2026-02-28",
    faellig: null,
    status: "erledigt",
    verantwortlich: { name: "Kathrin Meier", initialen: "KM" },
    kommentare: [],
  },
  {
    id: "ST-005",
    typ: "ANFRAGE",
    titel: "Einsatzplan-Anpassung für KW 11",
    beschreibung: "Wegen Krankheitsausfall muss der Einsatzplan für KW 11 umgestellt werden.",
    betroffenePerson: null,
    erstelltVon: { name: "Sandra Weber", initialen: "SW" },
    erstellt: "2026-03-02",
    faellig: "2026-03-07",
    status: "offen",
    verantwortlich: { name: "Sandra Weber", initialen: "SW" },
    kommentare: [],
  },
  {
    id: "ST-006",
    typ: "SCHLUESSEL",
    titel: "Schlüsselrückgabe — Austritt Peter Müller",
    beschreibung: "Patient Peter Müller wird per 31.03. entlassen. Schlüssel muss zurückgenommen werden.",
    betroffenePerson: { name: "Peter Müller", initialen: "PM" },
    erstelltVon: { name: "Maria Keller", initialen: "MK" },
    erstellt: "2026-02-20",
    faellig: "2026-03-28",
    status: "offen",
    verantwortlich: { name: "Laura Brunner", initialen: "LB" },
    kommentare: [],
  },
  {
    id: "ST-007",
    typ: "PROBLEM",
    titel: "Doppelte Abrechnung Februar — Ruth Fischer",
    beschreibung: "Für Ruth Fischer wurde der Februar doppelt abgerechnet. Korrektur nötig.",
    betroffenePerson: { name: "Ruth Fischer", initialen: "RF" },
    erstelltVon: { name: "Maria Keller", initialen: "MK" },
    erstellt: "2026-03-01",
    faellig: "2026-03-05",
    status: "in_bearbeitung",
    verantwortlich: { name: "Maria Keller", initialen: "MK" },
    kommentare: [],
  },
];
