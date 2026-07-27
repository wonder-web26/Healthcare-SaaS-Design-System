/**
 * Spitex-Leistungskatalog 2025 (DE)
 *
 * Quelle: Offizieller Leistungskatalog der Spitex Schweiz 2025
 * Stand: 15.10.2025
 *
 * KLV-Kategorien:
 *   a = Abklärung, Beratung, Koordination, Pflegeplanung
 *   b = Untersuchung und Behandlung
 *   c = Grundpflege
 *   null = Nicht KLV-pflichtig (Hauswirtschaft, Begleitung)
 *
 * Felder pro Position:
 *   nr = Katalog-Nummer (5-stellig)
 *   bezeichnung = offizielle Bezeichnung der Leistung
 *   bereich = Hauptbereich (z.B. "Hygiene und Komfort")
 *   zeitMin = Standard-Zeit in Minuten pro Durchführung (laut Katalog)
 *   klvKategorie = "a" | "b" | "c" | null
 *   defaultHaeufigkeit = häufige Frequenz-Angabe aus Katalog (W = pro Woche, T = pro Tag, m = pro Monat, n.B. = nach Bedarf)
 */

/** Katalogversion als Laufzeitkonstante — für Nachweise und Versionsbezug */
export const LEISTUNGSKATALOG_VERSION = {
  name: "Spitex Schweiz Leistungskatalog",
  jahr: 2025,
  stand: "15.10.2025",
  quelle: "Offizieller Leistungskatalog der Spitex Schweiz 2025",
} as const;

export type KLVKategorie = "a" | "b" | "c";

export type LeistungskatalogPosition = {
  nr: string;
  bezeichnung: string;
  bereich: string;
  zeitMin: number | null; // null = "nach Bedarf" oder variabel
  klvKategorie: KLVKategorie | null;
  defaultHaeufigkeit: string | null; // z.B. "1x/Woche", "täglich", "n.B."
};

export const SPITEX_LEISTUNGSKATALOG_2025: LeistungskatalogPosition[] = [
  // Hygiene und Komfort (alle Kategorie c)
  { nr: "10101", bezeichnung: "Ganzwäsche bettlägerige Klientin", bereich: "Hygiene und Komfort", zeitMin: 40, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10102", bezeichnung: "Ganzwäsche in Bad, Dusche oder am Lavabo", bereich: "Hygiene und Komfort", zeitMin: 40, klvKategorie: "c", defaultHaeufigkeit: "1x/Woche" },
  { nr: "10103", bezeichnung: "Teilwäsche im Bett (inkl. Intimpflege)", bereich: "Hygiene und Komfort", zeitMin: 20, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10104", bezeichnung: "Teilwäsche am Lavabo (inkl. Intimpflege)", bereich: "Hygiene und Komfort", zeitMin: 26, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10105", bezeichnung: "Intimpflege (im Bett oder am Lavabo)", bereich: "Hygiene und Komfort", zeitMin: 15, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10106", bezeichnung: "Rasur (in Kombination mit Ganz- oder Teilwäsche)", bereich: "Hygiene und Komfort", zeitMin: 10, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10107", bezeichnung: "Haare waschen", bereich: "Hygiene und Komfort", zeitMin: 15, klvKategorie: "c", defaultHaeufigkeit: "1x/Woche" },
  { nr: "10108", bezeichnung: "Nägel schneiden Finger", bereich: "Hygiene und Komfort", zeitMin: 15, klvKategorie: "c", defaultHaeufigkeit: "2x/Monat" },
  { nr: "10109", bezeichnung: "Nägel schneiden Zehen", bereich: "Hygiene und Komfort", zeitMin: 15, klvKategorie: "c", defaultHaeufigkeit: "1x/Monat" },
  { nr: "10110", bezeichnung: "Nägel schneiden Zehen bei Diabetikern", bereich: "Hygiene und Komfort", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "1x/Monat" },
  { nr: "10112", bezeichnung: "Zahnpflege", bereich: "Hygiene und Komfort", zeitMin: 5, klvKategorie: "c", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10113", bezeichnung: "Mundpflege (z.B. in Palliativsituation)", bereich: "Hygiene und Komfort", zeitMin: 10, klvKategorie: "c", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10114", bezeichnung: "Hilfe An-/Auskleiden", bereich: "Hygiene und Komfort", zeitMin: 15, klvKategorie: "c", defaultHaeufigkeit: "2x/Tag" },
  { nr: "10115", bezeichnung: "Kompressionsstrümpfe/-verband", bereich: "Hygiene und Komfort", zeitMin: 10, klvKategorie: "c", defaultHaeufigkeit: "2x/Tag" },

  // Atmung
  { nr: "10201", bezeichnung: "Atemtherapie / Sekret aushusten helfen", bereich: "Atmung", zeitMin: 14, klvKategorie: "b", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10202", bezeichnung: "Inhalation vorbereiten", bereich: "Atmung", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10203", bezeichnung: "Inhalationen mit konstanter Präsenz", bereich: "Atmung", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10204", bezeichnung: "O2-Verabreichung", bereich: "Atmung", zeitMin: 9, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10205", bezeichnung: "Absaugen", bereich: "Atmung", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10206", bezeichnung: "Tracheostomapflege", bereich: "Atmung", zeitMin: 9, klvKategorie: "b", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10207", bezeichnung: "Luftbefeuchter", bereich: "Atmung", zeitMin: 9, klvKategorie: null, defaultHaeufigkeit: "3x/Tag" },

  // Ernährung / Diäten
  { nr: "10301", bezeichnung: "Beim Trinken unterstützen", bereich: "Ernährung / Diäten", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10302", bezeichnung: "Beim Essen helfen", bereich: "Ernährung / Diäten", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10303", bezeichnung: "Anleitung für Essen/Diät", bereich: "Ernährung / Diäten", zeitMin: 9, klvKategorie: null, defaultHaeufigkeit: "n.B." },
  { nr: "10304", bezeichnung: "Sondenernährung", bereich: "Ernährung / Diäten", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10305", bezeichnung: "Einlegen einer Magensonde", bereich: "Ernährung / Diäten", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10306", bezeichnung: "Gastrostomapflege (PEG Sonde)", bereich: "Ernährung / Diäten", zeitMin: 13, klvKategorie: "b", defaultHaeufigkeit: "3x/Woche" },

  // Ausscheidung
  { nr: "10401", bezeichnung: "Schüssel/Topf/Steckbecken", bereich: "Ausscheidung", zeitMin: 8, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10402", bezeichnung: "Urinflasche", bereich: "Ausscheidung", zeitMin: 5, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10403", bezeichnung: "Manualstimulation der Blase", bereich: "Ausscheidung", zeitMin: 7, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10404", bezeichnung: "Blasenspülung", bereich: "Ausscheidung", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10405", bezeichnung: "Urostoma- / Nephrostomapflege", bereich: "Ausscheidung", zeitMin: 16, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10406", bezeichnung: "Pflege/Überwachung Blasenkatheter", bereich: "Ausscheidung", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10407", bezeichnung: "Blasenkatheter legen, Dauer/Einmal", bereich: "Ausscheidung", zeitMin: 30, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10408", bezeichnung: "Dauerblasenkatheter entfernen", bereich: "Ausscheidung", zeitMin: 4, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10409", bezeichnung: "Rectalsonde einlegen (Wind)", bereich: "Ausscheidung", zeitMin: 7, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10410", bezeichnung: "Practoclyss", bereich: "Ausscheidung", zeitMin: 16, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10411", bezeichnung: "Einlauf", bereich: "Ausscheidung", zeitMin: 21, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10412", bezeichnung: "Manuelle Ampullenausräumung", bereich: "Ausscheidung", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10413", bezeichnung: "Anziehen von Einlagen / Urinal anlegen", bereich: "Ausscheidung", zeitMin: 8, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10414", bezeichnung: "Stomasackentleerung", bereich: "Ausscheidung", zeitMin: 8, klvKategorie: "b", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10415", bezeichnung: "Pflege von Stoma", bereich: "Ausscheidung", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10417", bezeichnung: "Stomaspülung", bereich: "Ausscheidung", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10418", bezeichnung: "Flüssigkeitsbilanz 24h", bereich: "Ausscheidung", zeitMin: 4, klvKategorie: "b", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10419", bezeichnung: "Begleitung bei Toilettengang", bereich: "Ausscheidung", zeitMin: 10, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10420", bezeichnung: "Peritonealdialyse", bereich: "Ausscheidung", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },

  // Mobilisation
  { nr: "10501", bezeichnung: "Lagerung der Klientin im Bett", bereich: "Mobilisation", zeitMin: 8, klvKategorie: "c", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10502", bezeichnung: "Lagerung der Klientin im Bett inkl. Bett machen / Bettwäsche wechseln", bereich: "Mobilisation", zeitMin: 15, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10503", bezeichnung: "Aufstehen oder Hinlegen mit Hilfe", bereich: "Mobilisation", zeitMin: 5, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10504", bezeichnung: "Aufstehen oder Hinlegen mit Lift oder 2 Personen", bereich: "Mobilisation", zeitMin: 10, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10505", bezeichnung: "Hilfe beim Gehen", bereich: "Mobilisation", zeitMin: 8, klvKategorie: "c", defaultHaeufigkeit: "3x/Tag" },
  { nr: "10506", bezeichnung: "Aktive/passive Bewegungsunterstützung", bereich: "Mobilisation", zeitMin: 17, klvKategorie: "c", defaultHaeufigkeit: "2x/Tag" },
  { nr: "10507", bezeichnung: "Gehbegleitung ausserhalb Haus", bereich: "Mobilisation", zeitMin: 20, klvKategorie: null, defaultHaeufigkeit: "n.B." },
  { nr: "10508", bezeichnung: "Hilfsmittel anbringen/entfernen", bereich: "Mobilisation", zeitMin: 10, klvKategorie: "c", defaultHaeufigkeit: "2x/Tag" },

  // Therapien
  { nr: "10601", bezeichnung: "Medikamente richten", bereich: "Therapien", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10602", bezeichnung: "Verabreichung gerichtete Medikamente", bereich: "Therapien", zeitMin: 6, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10603", bezeichnung: "s.c. oder i.m. Medikamentenverabreichung", bereich: "Therapien", zeitMin: 10, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10604", bezeichnung: "i.v. Medikamentenverabreichung", bereich: "Therapien", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10605", bezeichnung: "i.v. Medikamentenverabreichung über Dreiweghahn", bereich: "Therapien", zeitMin: 9, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10606", bezeichnung: "Infusionstherapie mit Venenpunktion", bereich: "Therapien", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10607", bezeichnung: "Medikamentenverabreichung bei liegendem Venenkatheter/Port-a-Cath", bereich: "Therapien", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10608", bezeichnung: "Anwesenheit bei Infusionstherapie", bereich: "Therapien", zeitMin: 44, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10609", bezeichnung: "Besuch zur Infusionskontrolle", bereich: "Therapien", zeitMin: 12, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10610", bezeichnung: "Bluttransfusion", bereich: "Therapien", zeitMin: 120, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10612", bezeichnung: "Anlegen von Dauervenenzugängen", bereich: "Therapien", zeitMin: 12, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10613", bezeichnung: "Lavage von Katheter Typ Hickman/Port-a-Cath", bereich: "Therapien", zeitMin: 11, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10614", bezeichnung: "s.c. Infusionstherapie oder Pumpentherapie", bereich: "Therapien", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10615", bezeichnung: "Medizinal-Teilbad oder Wickel", bereich: "Therapien", zeitMin: 30, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10616", bezeichnung: "Massnahmen zur Dekubitusprophylaxe", bereich: "Therapien", zeitMin: 20, klvKategorie: "c", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10617", bezeichnung: "Haut einreiben (therapeutisch verordnet)", bereich: "Therapien", zeitMin: 20, klvKategorie: "b", defaultHaeufigkeit: "1x/Tag" },
  { nr: "10618", bezeichnung: "Augentropfen", bereich: "Therapien", zeitMin: 10, klvKategorie: "b", defaultHaeufigkeit: "n.B." },

  // Verbände und Hilfsmittel
  { nr: "10701", bezeichnung: "Kleiner Verband", bereich: "Verbände und Hilfsmittel", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10702", bezeichnung: "Mittlerer Verband", bereich: "Verbände und Hilfsmittel", zeitMin: 24, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10703", bezeichnung: "Grosser Verband", bereich: "Verbände und Hilfsmittel", zeitMin: 40, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10704", bezeichnung: "Auslieferung von Hilfsmitteln und Sanitätsmaterial", bereich: "Verbände und Hilfsmittel", zeitMin: 11, klvKategorie: null, defaultHaeufigkeit: "n.B." },

  // Messung Vitalzeichen / Pflegehandlungen für Diagnostik (alle b)
  { nr: "10801", bezeichnung: "Gesundheitskontrolle (Vitalparameter)", bereich: "Messung Vitalzeichen", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10802", bezeichnung: "Blutdruckmessung", bereich: "Messung Vitalzeichen", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10803", bezeichnung: "Pulskontrolle", bereich: "Messung Vitalzeichen", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10804", bezeichnung: "Atmungsbeobachtung oder -kontrolle", bereich: "Messung Vitalzeichen", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10805", bezeichnung: "Temperaturmessung", bereich: "Messung Vitalzeichen", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10806", bezeichnung: "Gewichtskontrolle", bereich: "Messung Vitalzeichen", zeitMin: 5, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10808", bezeichnung: "Kapillarblutentnahme inkl. Glucosebestimmung", bereich: "Messung Vitalzeichen", zeitMin: 10, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10809", bezeichnung: "Venenpunktion", bereich: "Messung Vitalzeichen", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10810", bezeichnung: "Blutentnahme über Zentralvenenkatheter/Port-a-cath", bereich: "Messung Vitalzeichen", zeitMin: 10, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10811", bezeichnung: "Sekretentnahme zur Analyse", bereich: "Messung Vitalzeichen", zeitMin: 15, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10812", bezeichnung: "Urin abnehmen / Uricult anlegen / Glucosebestimmung", bereich: "Messung Vitalzeichen", zeitMin: 10, klvKategorie: "b", defaultHaeufigkeit: "n.B." },

  // Abklärung, Koordination (meist a)
  { nr: "10901", bezeichnung: "Erstassessment", bereich: "Abklärung und Koordination", zeitMin: 60, klvKategorie: "a", defaultHaeufigkeit: "einmalig" },
  { nr: "10902", bezeichnung: "Reassessment", bereich: "Abklärung und Koordination", zeitMin: 60, klvKategorie: "a", defaultHaeufigkeit: "n.B." },
  { nr: "10903", bezeichnung: "Hauswirtschaftsplanung erstmalig im Rahmen der Bedarfsabklärung", bereich: "Abklärung und Koordination", zeitMin: 30, klvKategorie: null, defaultHaeufigkeit: "einmalig" },
  { nr: "10904", bezeichnung: "Pflegeplanung erstmalig im Rahmen der Bedarfsabklärung", bereich: "Abklärung und Koordination", zeitMin: 30, klvKategorie: "a", defaultHaeufigkeit: "einmalig" },
  { nr: "10905", bezeichnung: "Dienstleistungsbedarf Hauswirtschaft bestimmen im Rahmen der Bedarfsabklärung", bereich: "Abklärung und Koordination", zeitMin: 15, klvKategorie: null, defaultHaeufigkeit: "n.B." },
  { nr: "10906", bezeichnung: "Pflegebedarf bestimmen und evaluieren", bereich: "Abklärung und Koordination", zeitMin: 15, klvKategorie: "a", defaultHaeufigkeit: "n.B." },
  { nr: "10907", bezeichnung: "Konsultation Arzt – Spitex zur Bedarfsabklärung", bereich: "Abklärung und Koordination", zeitMin: 11, klvKategorie: "a", defaultHaeufigkeit: "einmalig" },
  { nr: "10912", bezeichnung: "Koordination", bereich: "Abklärung und Koordination", zeitMin: null, klvKategorie: "a", defaultHaeufigkeit: "n.B." },
  { nr: "10913", bezeichnung: "Bedarfsabklärung Hauswirtschaft", bereich: "Abklärung und Koordination", zeitMin: 60, klvKategorie: null, defaultHaeufigkeit: "einmalig" },

  // Anleitung, Prävention, Beratung, Begleitung
  { nr: "10908", bezeichnung: "Unterstützende Massnahmen, Gespräch mit Klientin/Angehörigen (wenn separate Dienstleistung)", bereich: "Anleitung und Beratung", zeitMin: 20, klvKategorie: null, defaultHaeufigkeit: "n.B." },
  { nr: "10909", bezeichnung: "Pflegeanleitung/Beratung Klientin oder Angehörige", bereich: "Anleitung und Beratung", zeitMin: 15, klvKategorie: "a", defaultHaeufigkeit: "n.B." },
  { nr: "10910", bezeichnung: "Begleitung, Betreuung, Anwesenheit nach Zeit", bereich: "Anleitung und Beratung", zeitMin: null, klvKategorie: null, defaultHaeufigkeit: "n.B." },
  { nr: "10911", bezeichnung: "Beraten bei Gefahren / Änderungen in der Wohnung veranlassen", bereich: "Anleitung und Beratung", zeitMin: 20, klvKategorie: null, defaultHaeufigkeit: "n.B." },

  // Psychiatrische Leistungen
  { nr: "10001", bezeichnung: "Beratung / Anleitung mit Person", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "a", defaultHaeufigkeit: "n.B." },
  { nr: "10002", bezeichnung: "Erarbeiten und Einüben von Bewältigungsstrategien", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10003", bezeichnung: "Unterstützung Begleitung bei der Bewältigung von Krisen und in schwierigen Lebensphasen", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10004", bezeichnung: "Trainieren von Verrichtungen und Alltagsfertigkeiten (z.B. Einkaufen, Essenszubereitung)", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10005", bezeichnung: "Erarbeiten und Einüben einer angepassten Tagesstruktur", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10006", bezeichnung: "Trainieren der sozialen Kontaktaufnahme und der Gestaltung von Beziehungen", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10007", bezeichnung: "Aktivitätsaufbau", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10008", bezeichnung: "Verabreichen und/oder Kontrolle der Medikamente", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10009", bezeichnung: "Anleiten / Unterstützen bei der Wohnungspflege", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10010", bezeichnung: "Anleiten / Unterstützen bei der Körperpflege", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10011", bezeichnung: "Begleiten zu Arzt, Klinik, anderen Institutionen, Behörden", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10012", bezeichnung: "Anleiten der Person zu Besorgungen", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
  { nr: "10013", bezeichnung: "Planen, Organisation, Koordination der Behandlung mit Arzt und anderen Diensten, Behörden", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "a", defaultHaeufigkeit: "n.B." },
  { nr: "10014", bezeichnung: "Anleitung im Umgang mit Aggression, Angst und Wahnvorstellungen", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10015", bezeichnung: "Unterstützung zur Vermeidung von akuter Selbst- oder Fremdgefährdung", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "b", defaultHaeufigkeit: "n.B." },
  { nr: "10016", bezeichnung: "Unterstützung beim Einsatz von Orientierungshilfen und Sicherheitsmassnahmen", bereich: "Psychiatrische Leistungen", zeitMin: null, klvKategorie: "c", defaultHaeufigkeit: "n.B." },
];

/**
 * Hilfsfunktion: alle Positionen einer KLV-Kategorie
 */
export function getPositionenFuerKategorie(kategorie: KLVKategorie): LeistungskatalogPosition[] {
  return SPITEX_LEISTUNGSKATALOG_2025.filter((p) => p.klvKategorie === kategorie);
}

/**
 * Hilfsfunktion: Position nach Nummer finden
 */
export function getPositionByNr(nr: string): LeistungskatalogPosition | undefined {
  return SPITEX_LEISTUNGSKATALOG_2025.find((p) => p.nr === nr);
}

/**
 * Hilfsfunktion: Positionen nach Bereich gruppiert
 */
export function getPositionenNachBereich(): Record<string, LeistungskatalogPosition[]> {
  const result: Record<string, LeistungskatalogPosition[]> = {};
  for (const pos of SPITEX_LEISTUNGSKATALOG_2025) {
    if (!result[pos.bereich]) result[pos.bereich] = [];
    result[pos.bereich].push(pos);
  }
  return result;
}