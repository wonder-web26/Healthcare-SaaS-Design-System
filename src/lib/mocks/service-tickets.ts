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
    id: "T-0089", typ: "ANFRAGE", titel: "Hilfsmittel-Kostengutsprache",
    kontext: "Rollator · Kostengutsprache Krankenkasse einholen",
    beschreibung: "Für die Patientin ist ein Rollator verordnet. Bei der Krankenkasse muss vor der Abgabe eine Kostengutsprache eingeholt werden. Die Verordnung des Hausarztes liegt vor. Bitte Antrag stellen und die Rückmeldung der Kasse abwarten, danach Übergabe des Hilfsmittels organisieren.",
    betroffenePerson: { name: "Emine Kaya", initialen: "EK" }, erstelltVon: P.KM, erstellt: "2026-03-01", faellig: "2026-03-10", status: "in_bearbeitung", verantwortlich: P.KM, prioritaet: "mittel", kommentare: [],
  },
  {
    id: "T-0090", typ: "PROBLEM", titel: "Rezept fehlt für Verbandmaterial",
    kontext: "Verordnung unvollständig · Hausarzt kontaktieren",
    beschreibung: "Für die laufende Wundversorgung fehlt das Rezept für das Verbandmaterial. Ohne gültige Verordnung kann das Material nicht über die Krankenkasse abgerechnet werden. Bitte beim Hausarzt eine Nachreichung der Verordnung anfordern, damit die Versorgung ohne Unterbruch weiterläuft.",
    betroffenePerson: { name: "Joaquim Da Silva", initialen: "JD" }, erstelltVon: P.LB, erstellt: "2026-03-02", faellig: "2026-03-04", status: "offen", verantwortlich: P.SW, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0091", typ: "MELDUNG", titel: "Dokumente fehlen",
    kontext: "Arbeitsvertrag Kopie nicht erhalten",
    beschreibung: "Carlos Silva hat bei Vertragsunterzeichnung am 01.02.2026 keine Kopie des Arbeitsvertrags erhalten. Er benötigt das Dokument für seine Aufenthaltsbewilligungsverlängerung beim Migrationsamt. Bitte eine beglaubigte Kopie erstellen und per Einschreiben an seine Adresse (Limmatstrasse 42, 8005 Zürich) senden. Alternativ kann er das Dokument in der Geschäftsstelle abholen.",
    betroffenePerson: { name: "Carlos Silva", initialen: "CS" }, erstelltVon: P.KM, erstellt: "2026-03-01", faellig: "2026-03-06", status: "offen", verantwortlich: P.KM, prioritaet: "mittel", kommentare: [],
  },
  {
    id: "T-0092", typ: "ANFRAGE", titel: "Ersatzpflege während Ferienabwesenheit",
    kontext: "Betreuung 14.–18.04. · Vertretung organisiert",
    beschreibung: "Während der Ferienabwesenheit der Angehörigen muss die Betreuung des Patienten vom 14. bis 18.04.2026 durch eine Ersatzpflege sichergestellt werden. Die Vertretung wurde organisiert und mit der Familie abgestimmt; der Einsatzplan ist hinterlegt.",
    betroffenePerson: { name: "Gertrud Zimmermann", initialen: "GZ" }, erstelltVon: P.MK, erstellt: "2026-02-28", faellig: "2026-03-20", status: "erledigt", verantwortlich: P.MK, prioritaet: "niedrig", kommentare: [],
  },
  {
    id: "T-0093", typ: "PROBLEM", titel: "Sturz zuhause gemeldet",
    kontext: "Sturz am 02.03. · Situation prüfen",
    beschreibung: "Der Patient ist am 02.03.2026 zuhause gestürzt. Die Angehörige hat den Vorfall gemeldet. Es sind keine sichtbaren Verletzungen bekannt, dennoch soll die Situation bei der nächsten Visite geprüft und bei Bedarf der Hausarzt informiert werden. Sturzprophylaxe überprüfen und dokumentieren.",
    betroffenePerson: { name: "Werner Keller", initialen: "WK" }, erstelltVon: P.LB, erstellt: "2026-03-02", faellig: "2026-03-05", status: "offen", verantwortlich: { name: "Nicht zugewiesen", initialen: "" }, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0094", typ: "MELDUNG", titel: "Spitalaustritt gemeldet",
    kontext: "Austritt 05.03. · Betreuung anpassen",
    beschreibung: "Die Patientin wird am 05.03.2026 aus dem Spital entlassen. Die häusliche Betreuung muss an den neuen Pflegebedarf angepasst werden. Bitte den Übergabebericht des Spitals anfordern und den Einsatzumfang für die Folgewoche neu festlegen.",
    betroffenePerson: { name: "Marie-Louise Hübscher-Wiederkehr", initialen: "MH" }, erstelltVon: P.MK, erstellt: "2026-03-02", faellig: "2026-03-06", status: "offen", verantwortlich: P.SW, prioritaet: "mittel", kommentare: [],
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
    id: "T-0097", typ: "PROBLEM", titel: "Medikamentenplan widersprüchlich",
    kontext: "Rücksprache Hausarzt nötig",
    beschreibung: "Im aktuellen Medikamentenplan des Patienten finden sich widersprüchliche Dosierungsangaben zwischen Austrittsbericht und Hausarztverordnung. Vor der nächsten Medikamentenabgabe ist eine Klärung mit dem Hausarzt erforderlich, um eine Fehlmedikation auszuschliessen.",
    betroffenePerson: { name: "Anna Bösiger", initialen: "AB" }, erstelltVon: P.TS, erstellt: "2026-03-01", faellig: "2026-03-05", status: "in_bearbeitung", verantwortlich: P.SW, prioritaet: "hoch", kommentare: [],
  },
  {
    id: "T-0098", typ: "MELDUNG", titel: "Adresse aktualisiert",
    kontext: "Familie Weber verzieht · Einsatzplanung anpassen",
    beschreibung: "Familie Weber (Klient Jakob Weber) verzieht per 15.03.2026 von Badenerstrasse 120, 8004 Zürich nach Schaffhauserstrasse 78, 8057 Zürich. Die neue Adresse liegt weiterhin im Einzugsgebiet der Spitex Zürich Nord. Bitte Einsatzplanung anpassen – die Fahrzeit ändert sich für die zuständige Pflegekraft um ca. 10 Minuten. Stammdaten im System und bei der Krankenkasse aktualisieren.",
    betroffenePerson: { name: "Jakob Weber", initialen: "JW" }, erstelltVon: P.MK, erstellt: "2026-03-02", faellig: "2026-03-17", status: "offen", verantwortlich: P.MK, prioritaet: "niedrig", kommentare: [],
  },
];
