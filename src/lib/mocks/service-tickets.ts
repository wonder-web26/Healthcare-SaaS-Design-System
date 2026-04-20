import type { Person, Prioritaet } from "./workflow-tasks";

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
  kontext: string;
  beschreibung: string;
  betroffenePerson: Person | null;
  erstelltVon: Person;
  erstellt: string;
  faellig: string | null;
  status: TicketStatus;
  verantwortlich: Person;
  prioritaet: Prioritaet;
  kommentare: [];
}

export const ticketTypLabel: Record<TicketTyp, string> = {
  SCHLUESSEL: "Schlüssel",
  ANFRAGE: "Anfrage",
  PROBLEM: "Problem",
  MELDUNG: "Meldung",
};

const P = {
  MK: { name: "Maria Keller", initialen: "MK", color: "#4F46E5" },
  KM: { name: "Kathrin Meier", initialen: "KM", color: "#059669" },
  SW: { name: "Sandra Weber", initialen: "SW", color: "#D97706" },
  LB: { name: "Laura Brunner", initialen: "LB", color: "#DC2626" },
  TS: { name: "Thomas Schmid", initialen: "TS", color: "#2563EB" },
};

export const serviceTickets: ServiceTicket[] = [
  {
    id: "T-0088", typ: "SCHLUESSEL", titel: "Schlüsselverlust melden",
    kontext: "Wohnungsschlüssel verloren · Ersatz bestellen",
    beschreibung: "Ayşe Yılmaz hat den Wohnungsschlüssel für die Einsatzadresse Bergstrasse 14, 8001 Zürich verloren. Der Verlust wurde am 02.03.2026 gemeldet. Ein Ersatzschlüssel muss beim Vermieter (Verwaltung Huber AG) bestellt werden. Bis zur Übergabe des neuen Schlüssels erfolgt der Zugang über die Nachbarin Frau Meier (3. OG links). Bitte Kostenübernahme mit der Angehörigen klären.",
    betroffenePerson: { name: "Ayşe Yılmaz", initialen: "AY" }, erstelltVon: P.LB, erstellt: "2026-03-02", faellig: "2026-03-03", status: "offen", verantwortlich: P.LB, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0089", typ: "ANFRAGE", titel: "Urlaubsvertretung",
    kontext: "Abwesenheit 15.03. – 28.03.2026 · Übergabe koordinieren",
    beschreibung: "Sandra Weber ist vom 15.03. bis 28.03.2026 in den Ferien. Ihre 4 Klienten (Brunner, Müller, Hofer, Weber) müssen auf das bestehende Team verteilt werden. Kathrin Meier hat bereits zugesagt, 2 Klienten zu übernehmen. Für die restlichen 2 muss noch eine Vertretung gefunden werden. Übergabe-Gespräch bitte bis spätestens 12.03. einplanen.",
    betroffenePerson: { name: "Sandra Weber", initialen: "SW" }, erstelltVon: P.MK, erstellt: "2026-03-01", faellig: "2026-03-10", status: "in_bearbeitung", verantwortlich: P.MK, prioritaet: "mittel", kommentare: [],
  },
  {
    id: "T-0090", typ: "PROBLEM", titel: "Zugang Klientenportal",
    kontext: "Login-Fehler · seit 02.03.2026",
    beschreibung: "Laura Brunner kann sich seit dem 02.03.2026 nicht mehr im Klientenportal anmelden. Fehlermeldung: 'Ihre Sitzung ist abgelaufen. Bitte wenden Sie sich an den Administrator.' Passwort-Reset über die Selbstbedienungs-Funktion schlägt ebenfalls fehl. Die IT-Abteilung wurde informiert, ein Rückruf steht aus. Laura benötigt den Zugang dringend für die Dokumentation der Pflegeleistungen bei 3 Klienten.",
    betroffenePerson: { name: "Laura Brunner", initialen: "LB" }, erstelltVon: P.LB, erstellt: "2026-03-02", faellig: "2026-03-04", status: "offen", verantwortlich: P.TS, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0091", typ: "MELDUNG", titel: "Dokumente fehlen",
    kontext: "Arbeitsvertrag Kopie nicht erhalten",
    beschreibung: "Carlos Silva hat bei Vertragsunterzeichnung am 01.02.2026 keine Kopie des Arbeitsvertrags erhalten. Er benötigt das Dokument für seine Aufenthaltsbewilligungsverlängerung beim Migrationsamt. Bitte eine beglaubigte Kopie erstellen und per Einschreiben an seine Adresse (Limmatstrasse 42, 8005 Zürich) senden. Alternativ kann er das Dokument in der Geschäftsstelle abholen.",
    betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstelltVon: P.KM, erstellt: "2026-03-01", faellig: "2026-03-06", status: "offen", verantwortlich: P.KM, prioritaet: "mittel", kommentare: [],
  },
  {
    id: "T-0092", typ: "ANFRAGE", titel: "Weiterbildung Demenz-Pflege",
    kontext: "Anfrage · Budget-Freigabe nötig",
    beschreibung: "Sandra Weber möchte am Kurs 'Demenz-Pflege Aufbaumodul' der Careum Weiterbildung teilnehmen. Der Kurs findet vom 14.04. bis 16.04.2026 statt und kostet CHF 890.–. Die Kosten werden gemäss Weiterbildungsreglement zu 80% von der Spitex übernommen. Bitte Budget-Freigabe durch die Geschäftsleitung einholen und Anmeldung bestätigen. Anmeldefrist: 20.03.2026.",
    betroffenePerson: { name: "Sandra Weber", initialen: "SW" }, erstelltVon: P.SW, erstellt: "2026-02-28", faellig: "2026-03-20", status: "offen", verantwortlich: P.MK, prioritaet: "niedrig", kommentare: [],
  },
  {
    id: "T-0093", typ: "PROBLEM", titel: "Fahrtkostenabrechnung Februar fehlerhaft",
    kontext: "Angehörige reklamieren · Kilometerpauschale falsch berechnet",
    beschreibung: "Mehrere Angehörige haben reklamiert, dass die Fahrtkostenabrechnung für Februar 2026 fehlerhaft ist. Die Kilometerpauschale wurde mit CHF 0.50/km statt dem korrekten Satz von CHF 0.70/km berechnet. Betroffen sind mindestens 8 Abrechnungen. Ursache vermutlich ein falscher Parameterwert in der Lohnbuchhaltung nach dem Januar-Update. Bitte alle Februar-Abrechnungen prüfen und Differenzbetrag mit der nächsten Lohnabrechnung nachzahlen.",
    betroffenePerson: null, erstelltVon: P.MK, erstellt: "2026-03-01", faellig: "2026-03-07", status: "in_bearbeitung", verantwortlich: P.MK, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0094", typ: "MELDUNG", titel: "Krankmeldung bis 06.03.",
    kontext: "AUB eingegangen · Vertretung nötig",
    beschreibung: "Thomas Schmid hat am 02.03.2026 ein ärztliches Attest (AUB) eingereicht. Er ist bis einschliesslich 06.03.2026 krankgeschrieben. Seine 3 Klienten-Besuche für diese Woche müssen auf andere Pflegekräfte verteilt werden. Einsatzplan wurde vorläufig angepasst – bitte Vertretungsregelung bestätigen. Falls die Krankmeldung verlängert wird, erfolgt eine separate Meldung.",
    betroffenePerson: { name: "Thomas Schmid", initialen: "TS" }, erstelltVon: P.TS, erstellt: "2026-03-02", faellig: "2026-03-03", status: "offen", verantwortlich: P.MK, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0095", typ: "SCHLUESSEL", titel: "Schlüsselübergabe Neu-Klient",
    kontext: "Hausschlüssel + Codier-Karte Tiefgarage",
    beschreibung: "Für die neue Klientin Monika Brunner (Einsatzbeginn 10.03.2026) müssen der Hausschlüssel und die Codier-Karte für die Tiefgarage übergeben werden. Die Schlüssel wurden vom Sohn der Klientin hinterlegt und liegen in der Geschäftsstelle bereit (Umschlag mit Vermerk 'Brunner'). Bitte bei der Erstvisite am 10.03. mitnehmen. Quittung mit Unterschrift der zuständigen Pflegekraft erforderlich.",
    betroffenePerson: { name: "Monika Brunner", initialen: "MB" }, erstelltVon: P.LB, erstellt: "2026-03-02", faellig: "2026-03-09", status: "offen", verantwortlich: P.LB, prioritaet: "mittel", kommentare: [],
  },
  {
    id: "T-0096", typ: "ANFRAGE", titel: "Spezialbewilligung KLV-Zuschlag",
    kontext: "Komplexe Wundpflege · Antrag beim Kanton",
    beschreibung: "Für Elisabeth Hofer muss ein KLV-Zuschlag für komplexe Wundpflege beim Kanton beantragt werden. Die Wundversorgung erfordert seit dem Spitalaufenthalt am 18.02.2026 tägliche Verbandwechsel mit speziellem Material (VAC-Therapie). Der Hausarzt Dr. Keller hat die medizinische Begründung bereits erstellt. Bitte Antrag beim kantonalen Gesundheitsamt einreichen. Die Bewilligung dauert erfahrungsgemäss 10–14 Arbeitstage.",
    betroffenePerson: { name: "Elisabeth Hofer", initialen: "EH" }, erstelltVon: P.SW, erstellt: "2026-02-26", faellig: "2026-03-11", status: "in_bearbeitung", verantwortlich: P.SW, prioritaet: "mittel", kommentare: [],
  },
  {
    id: "T-0097", typ: "PROBLEM", titel: "MedLink Sync-Fehler · 12 Einträge unvollständig",
    kontext: "Seit Release 4.2.1 · IT bereits informiert",
    beschreibung: "Seit dem MedLink-Release 4.2.1 (deployed am 28.02.2026) werden Leistungserfassungen nicht mehr vollständig synchronisiert. 12 Einträge von 3 verschiedenen Pflegekräften sind betroffen – die Einsatzzeiten wurden übertragen, aber die Materialverbrauchsdaten fehlen. Die IT-Abteilung wurde am 01.03. informiert und hat ein Ticket im Jira (MLINK-4821) eröffnet. Hotfix wird für KW 10 erwartet. Bis dahin müssen die fehlenden Daten manuell nachgetragen werden.",
    betroffenePerson: null, erstelltVon: P.TS, erstellt: "2026-03-01", faellig: "2026-03-05", status: "in_bearbeitung", verantwortlich: P.TS, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0098", typ: "MELDUNG", titel: "Adresse aktualisiert",
    kontext: "Familie Weber verzieht · Einsatzplanung anpassen",
    beschreibung: "Familie Weber (Klient Jakob Weber) verzieht per 15.03.2026 von Badenerstrasse 120, 8004 Zürich nach Schaffhauserstrasse 78, 8057 Zürich. Die neue Adresse liegt weiterhin im Einzugsgebiet der Spitex Zürich Nord. Bitte Einsatzplanung anpassen – die Fahrzeit ändert sich für die zuständige Pflegekraft um ca. 10 Minuten. Stammdaten im System und bei der Krankenkasse aktualisieren.",
    betroffenePerson: { name: "Jakob Weber", initialen: "JW" }, erstelltVon: P.MK, erstellt: "2026-03-02", faellig: "2026-03-17", status: "offen", verantwortlich: P.MK, prioritaet: "niedrig", kommentare: [],
  },
];
