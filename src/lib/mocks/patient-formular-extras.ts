/**
 * Formular-Ergänzungen je Patient — die Felder, die der Patientendatensatz
 * nicht trägt.
 *
 * Hintergrund: die Patientendetailansicht zeigt denselben Reitersatz wie der
 * Onboarding-Schritt «Patient». Dessen Formular hat 82 Felder, der
 * Patientendatensatz 77 — aber 28 Formularfelder haben dort kein Gegenstück:
 * der Anamnese-Block (Grösse, Gewicht, Erkrankungen, Operationen, Allergien,
 * Sturzfragen, Stimmung), das ATL-Assessment und die Dokumente. Ohne diese
 * Datei wären jene drei Reiter für jeden Patienten leer, der nicht gerade im
 * Onboarding erfasst wurde.
 *
 * Die Werte sind Mock, aber nicht beliebig: sie folgen Alter, Schweregrad und
 * Leistungsart des jeweiligen Patienten aus `patientenSeed`. Ein Patient mit
 * Schweregrad «kritisch» trägt mehr bejahte ATL-Positionen als einer mit
 * «leicht», und die Anamnese nennt, was die ATL-Einträge behaupten.
 *
 * Sobald echte Daten existieren, ersetzt deren Quelle diese Datei — die
 * Rückabbildung in lib/patienten/formular.ts bleibt davon unberührt.
 */
import { emptyPatientForm, type PatientFormData, type ATLEntry } from "../../app/components/StepPatient";

/** Die ergänzbaren Felder — genau die, die `formularAusPatient` nicht füllen kann. */
type Ergaenzung = Partial<Pick<PatientFormData,
  | "anrede" | "anmeldungPraezisierungen" | "stammdatenPraezisierungen"
  | "sozialamtInvolviert" | "gesetzlicheVertretung"
  | "patientenverfuegungVorhanden" | "patientenverfuegungDatum" | "patientenverfuegungBemerkung"
  | "vorsorgeauftragVorhanden" | "vorsorgeauftragValidiert" | "vorsorgeauftragBemerkung"
  | "groesse" | "gewicht" | "gewichtsverlust" | "brille" | "hoergeraet"
  | "chronischeErkrankungen" | "operationen" | "allergien" | "anamneseText"
  | "sturzLetzte12m" | "sturzAnzahl" | "sturzKommentar"
  | "sturzLetzte6Monate" | "sturzVorEinemJahr" | "stimmungAktuell"
  | "atlAssessment"
>>;

/** Kurzschreibweise für eine ATL-Position. */
const atl = (ja: boolean, bemerkungen = ""): ATLEntry => ({ ja, bemerkungen });

/** ATL-Grundstock: alle Positionen unbeantwortet. */
const ATL_LEER = emptyPatientForm.atlAssessment;

const ERGAENZUNGEN: Record<string, Ergaenzung> = {
  /* ── Steiner, Hans-Rudolf · 1948 · mittel ────────────────────────────────── */
  "P-2026-0041": {
    anrede: "herr",
    groesse: "174", gewicht: "78", gewichtsverlust: "nein", brille: "ja", hoergeraet: "ja",
    chronischeErkrankungen: "Arterielle Hypertonie, Diabetes mellitus Typ 2, beginnende Herzinsuffizienz (NYHA II)",
    operationen: "Hüft-Totalprothese rechts (2019), Katarakt beidseits (2022)",
    allergien: "Penicillin",
    anamneseText: "Zunehmende Gangunsicherheit, benötigt Unterstützung bei Körperpflege und Medikamentenmanagement. Kognitiv orientiert, Stimmung stabil.",
    sturzLetzte12m: "ja", sturzAnzahl: "2", sturzKommentar: "Beide Stürze im Bad, ohne Fraktur",
    stimmungAktuell: "stabil",
    patientenverfuegungVorhanden: "ja", patientenverfuegungDatum: "12.03.2024",
    vorsorgeauftragVorhanden: "nein", vorsorgeauftragValidiert: "unbekannt",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(true, "Hilfe beim Duschen an drei Tagen pro Woche"),
      "An-/Auskleiden": atl(true, "Teilweise Unterstützung, v. a. untere Extremität"),
      "Selbständige Mobilität": atl(true, "Rollator, kurze Strecken selbstständig"),
      "Lagern / Transferhilfe": atl(false),
      "Ernährung": atl(false, "Selbstständig, ausgewogen"),
      "Orientierung": atl(false, "Zeitlich und örtlich orientiert"),
      "Sturzrisiko": atl(true, "Erhöht — zwei Stürze im Bad, siehe Anamnese"),
      "Medikamente richten": atl(true, "Wochendispenser durch Spitex"),
      "Medikamente verabreichen": atl(true, "Insulin morgens"),
      "Vitalwerte-Messungen": atl(true, "Blutdruck und Blutzucker täglich"),
    },
  },

  /* ── Hübscher-Wiederkehr, Marie-Louise · 1955 · leicht ───────────────────── */
  "P-2026-0042": {
    anrede: "frau",
    groesse: "162", gewicht: "64", gewichtsverlust: "nein", brille: "ja", hoergeraet: "nein",
    chronischeErkrankungen: "Osteoporose, Hypothyreose (substituiert)",
    operationen: "Knie-Arthroskopie links (2021)",
    allergien: "Keine bekannt",
    anamneseText: "Selbstständig im Alltag, benötigt Anleitung bei der Wundversorgung am Unterschenkel. Sozial gut eingebunden, Ehemann unterstützt.",
    sturzLetzte12m: "nein", sturzAnzahl: "", sturzKommentar: "",
    stimmungAktuell: "stabil",
    patientenverfuegungVorhanden: "ja", patientenverfuegungDatum: "04.09.2023",
    vorsorgeauftragVorhanden: "ja", vorsorgeauftragValidiert: "ja",
    vorsorgeauftragBemerkung: "Ehemann als vorsorgebeauftragte Person eingesetzt",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(false, "Selbstständig"),
      "An-/Auskleiden": atl(false),
      "Selbständige Mobilität": atl(false, "Ohne Hilfsmittel"),
      "Ernährung": atl(false),
      "Orientierung": atl(false),
      "Sturzrisiko": atl(false),
      "Medikamente richten": atl(true, "Wochendispenser, Kontrolle durch Spitex"),
      "Vitalwerte-Messungen": atl(false),
    },
  },

  /* ── Rexhepi, Fatmire · 1940 · schwer ────────────────────────────────────── */
  "P-2026-0043": {
    anrede: "frau",
    groesse: "158", gewicht: "52", gewichtsverlust: "ja", brille: "ja", hoergeraet: "ja",
    chronischeErkrankungen: "Demenz vom Alzheimertyp (mittleres Stadium), Vorhofflimmern, chronische Niereninsuffizienz Stadium 3",
    operationen: "Schenkelhalsfraktur links, osteosynthetisch versorgt (2023)",
    allergien: "Jodhaltige Kontrastmittel",
    anamneseText: "Fortgeschrittene kognitive Einschränkung, zeitlich und örtlich desorientiert. Vollständige Übernahme der Körperpflege nötig. Gewichtsabnahme von 4 kg in drei Monaten, Ernährung wird überwacht. Tochter übernimmt die Betreuung am Tag.",
    sturzLetzte12m: "ja", sturzAnzahl: "4", sturzKommentar: "Vorwiegend nachts beim Aufstehen, eine Fraktur 2023",
    stimmungAktuell: "schwankend",
    patientenverfuegungVorhanden: "nein", patientenverfuegungDatum: "",
    vorsorgeauftragVorhanden: "ja", vorsorgeauftragValidiert: "ja",
    vorsorgeauftragBemerkung: "Tochter als vorsorgebeauftragte Person, KESB-validiert",
    sozialamtInvolviert: "ja", gesetzlicheVertretung: "ja",
    stammdatenPraezisierungen: "Verständigung auf Albanisch; Tochter übersetzt bei Arztgesprächen.",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(true, "Vollständige Übernahme, zwei Einsätze täglich"),
      "An-/Auskleiden": atl(true, "Vollständige Übernahme"),
      "Selbständige Mobilität": atl(true, "Nur mit Begleitung, Rollstuhl für längere Wege"),
      "Lagern / Transferhilfe": atl(true, "Transfer zu zweit"),
      "Ernährung": atl(true, "Anreichen erforderlich, Gewicht wöchentlich"),
      "Schluckstörungen": atl(true, "Getränke angedickt"),
      "Inkontinenz": atl(true, "Vorlagen, Wechsel bei jedem Einsatz"),
      "Orientierung": atl(true, "Zeitlich und örtlich desorientiert"),
      "Weglaufgefahr": atl(true, "Tür gesichert, Tochter informiert"),
      "Sturzrisiko": atl(true, "Hoch — vier Stürze im letzten Jahr"),
      "Kommunikationsfähigkeit": atl(true, "Kurze Sätze, Wortfindungsstörungen"),
      "Sprache / Verständigung": atl(true, "Albanisch, Tochter übersetzt"),
      "Medikamente richten": atl(true, "Durch Spitex"),
      "Medikamente verabreichen": atl(true, "Antikoagulation, tägliche Kontrolle"),
      "Vitalwerte-Messungen": atl(true, "Blutdruck und Puls täglich"),
    },
  },

  /* ── Kaya, Emine · 1952 · mittel ─────────────────────────────────────────── */
  "P-2026-0044": {
    anrede: "frau",
    groesse: "160", gewicht: "71", gewichtsverlust: "nein", brille: "ja", hoergeraet: "nein",
    chronischeErkrankungen: "Diabetes mellitus Typ 2 mit Polyneuropathie, Adipositas",
    operationen: "Cholezystektomie (2018)",
    allergien: "Keine bekannt",
    anamneseText: "Diabetische Polyneuropathie mit eingeschränkter Sensibilität der Füsse. Tägliche Fusskontrolle und Insulinverabreichung durch Spitex. Ehemann kocht, Motivation zur Bewegung schwankt.",
    sturzLetzte12m: "ja", sturzAnzahl: "1", sturzKommentar: "Stolpersturz im Treppenhaus, ohne Folgen",
    stimmungAktuell: "stabil",
    patientenverfuegungVorhanden: "unbekannt", patientenverfuegungDatum: "",
    vorsorgeauftragVorhanden: "unbekannt", vorsorgeauftragValidiert: "unbekannt",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    stammdatenPraezisierungen: "Verständigung auf Türkisch möglich; Tochter begleitet Arzttermine.",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(true, "Hilfe bei der Fusspflege, sonst selbstständig"),
      "An-/Auskleiden": atl(false),
      "Selbständige Mobilität": atl(true, "Stock im Aussenbereich"),
      "Ernährung": atl(true, "Diabetesgerechte Kost, Beratung läuft"),
      "Orientierung": atl(false),
      "Sturzrisiko": atl(true, "Erhöht durch Polyneuropathie"),
      "Medikamente richten": atl(true, "Wochendispenser"),
      "Medikamente verabreichen": atl(true, "Insulin morgens und abends"),
      "Vitalwerte-Messungen": atl(true, "Blutzucker täglich"),
    },
  },

  /* ── Huber, Fritz · 1945 · schwer ────────────────────────────────────────── */
  "P-2026-0045": {
    anrede: "herr",
    groesse: "178", gewicht: "69", gewichtsverlust: "ja", brille: "ja", hoergeraet: "ja",
    chronischeErkrankungen: "COPD GOLD III, Rechtsherzinsuffizienz, Nikotinabusus (sistiert 2020)",
    operationen: "Leistenhernie beidseits (2016)",
    allergien: "Keine bekannt",
    anamneseText: "Belastungsdyspnoe bereits bei kurzen Strecken, Sauerstoff 2 l/min nachts. Gewichtsverlust von 3 kg, Appetit reduziert. Lebt allein, Nachbarin schaut täglich vorbei.",
    sturzLetzte12m: "ja", sturzAnzahl: "2", sturzKommentar: "Beide Male bei Atemnot im Gehen",
    stimmungAktuell: "gedrueckt",
    patientenverfuegungVorhanden: "ja", patientenverfuegungDatum: "20.01.2025",
    patientenverfuegungBemerkung: "Keine Reanimation, keine invasive Beatmung",
    vorsorgeauftragVorhanden: "nein", vorsorgeauftragValidiert: "unbekannt",
    sozialamtInvolviert: "ja", gesetzlicheVertretung: "nein",
    atlAssessment: {
      ...ATL_LEER,
      "Atemnot": atl(true, "Bei Belastung, Ruhedyspnoe zunehmend"),
      "Husten": atl(true, "Morgens produktiv"),
      "Sauerstoffbedarf": atl(true, "2 l/min nachts, Konzentrator vorhanden"),
      "Körperpflege": atl(true, "Duschen mit Hilfe, Pausen nötig"),
      "An-/Auskleiden": atl(true, "Hilfe beim Anziehen der Strümpfe"),
      "Selbständige Mobilität": atl(true, "Rollator, Strecken unter 50 m"),
      "Kompressionsstrümpfe": atl(true, "Anziehen durch Spitex"),
      "Ernährung": atl(true, "Appetitmangel, Trinknahrung zweimal täglich"),
      "Orientierung": atl(false),
      "Sturzrisiko": atl(true, "Erhöht, vorwiegend bei Atemnot"),
      "Medikamente richten": atl(true, "Durch Spitex"),
      "Medikamente verabreichen": atl(true, "Inhalativa, Diuretika"),
      "Vitalwerte-Messungen": atl(true, "Sauerstoffsättigung und Gewicht täglich"),
    },
  },

  /* ── Da Silva, Joaquim · 1960 · leicht ───────────────────────────────────── */
  "P-2026-0046": {
    anrede: "herr",
    groesse: "171", gewicht: "82", gewichtsverlust: "nein", brille: "nein", hoergeraet: "nein",
    chronischeErkrankungen: "Arterielle Hypertonie",
    operationen: "Keine",
    allergien: "Hausstaubmilben",
    anamneseText: "Postoperative Wundversorgung am rechten Unterarm nach Arbeitsunfall. Im Übrigen selbstständig und erwerbstätig. Rückkehr an den Arbeitsplatz in Aussicht.",
    sturzLetzte12m: "nein", sturzAnzahl: "", sturzKommentar: "",
    stimmungAktuell: "stabil",
    patientenverfuegungVorhanden: "nein", patientenverfuegungDatum: "",
    vorsorgeauftragVorhanden: "nein", vorsorgeauftragValidiert: "unbekannt",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    stammdatenPraezisierungen: "Verständigung auf Portugiesisch; Deutsch ausreichend für den Alltag.",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(false, "Selbstständig, Arm wird abgedeckt"),
      "An-/Auskleiden": atl(true, "Hilfe wegen Schiene am rechten Arm"),
      "Selbständige Mobilität": atl(false),
      "Ernährung": atl(false),
      "Orientierung": atl(false),
      "Sturzrisiko": atl(false),
      "Medikamente richten": atl(false, "Selbstständig"),
      "Vitalwerte-Messungen": atl(true, "Blutdruck zweimal pro Woche"),
    },
  },

  /* ── Bösiger, Anna · 1938 · mittel ───────────────────────────────────────── */
  "P-2026-0047": {
    anrede: "frau",
    groesse: "155", gewicht: "58", gewichtsverlust: "nein", brille: "ja", hoergeraet: "ja",
    chronischeErkrankungen: "Coxarthrose beidseits, Makuladegeneration, leichte kognitive Störung",
    operationen: "Hüft-Totalprothese links (2017), Kniegelenksprothese rechts (2020)",
    allergien: "Pflaster (Acrylatkleber)",
    anamneseText: "Bewegungseinschränkung durch Arthrose, Physiotherapie zweimal pro Woche. Sehvermögen stark reduziert, findet sich in der bekannten Wohnung aber sicher zurecht. Tochter wohnt im gleichen Haus.",
    sturzLetzte12m: "nein", sturzAnzahl: "", sturzKommentar: "Keine Stürze seit der Wohnungsanpassung",
    stimmungAktuell: "stabil",
    patientenverfuegungVorhanden: "ja", patientenverfuegungDatum: "08.06.2022",
    vorsorgeauftragVorhanden: "ja", vorsorgeauftragValidiert: "nein",
    vorsorgeauftragBemerkung: "Dokument liegt vor, Validierung durch die KESB ausstehend",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(true, "Hilfe beim Baden, Duschstuhl vorhanden"),
      "An-/Auskleiden": atl(true, "Hilfe bei Schuhen und Strümpfen"),
      "Selbständige Mobilität": atl(true, "Rollator in der Wohnung"),
      "Ernährung": atl(false, "Mahlzeitendienst, isst selbstständig"),
      "Orientierung": atl(false, "In bekannter Umgebung sicher"),
      "Sturzrisiko": atl(true, "Erhöht durch Sehbehinderung"),
      "Kommunikationsfähigkeit": atl(false),
      "Medikamente richten": atl(true, "Durch Spitex, Beschriftung in Grossdruck"),
      "Vitalwerte-Messungen": atl(false),
    },
  },

  /* ── Ferrari, Gino · 1935 · kritisch ─────────────────────────────────────── */
  "P-2026-0048": {
    anrede: "herr",
    groesse: "168", gewicht: "54", gewichtsverlust: "ja", brille: "ja", hoergeraet: "ja",
    chronischeErkrankungen: "Metastasiertes Prostatakarzinom, chronische Schmerzen, Kachexie, Niereninsuffizienz Stadium 4",
    operationen: "Transurethrale Resektion (2019), Port-Implantation (2025)",
    allergien: "Morphin (Unverträglichkeit, Umstellung auf Hydromorphon)",
    anamneseText: "Palliative Situation, Betreuung auf Symptomkontrolle ausgerichtet. Schmerztherapie über Pflaster und Reservemedikation. Deutliche Kachexie, Gewichtsverlust 7 kg in vier Monaten. Sohn und Schwiegertochter sind täglich anwesend; Wunsch nach Verbleib zu Hause ist dokumentiert.",
    sturzLetzte12m: "ja", sturzAnzahl: "3", sturzKommentar: "Bei Schwäche beim Aufstehen, zuletzt vor zwei Wochen",
    stimmungAktuell: "gedrueckt",
    patientenverfuegungVorhanden: "ja", patientenverfuegungDatum: "02.02.2026",
    patientenverfuegungBemerkung: "Keine Reanimation, keine Spitaleinweisung, Betreuung zu Hause",
    vorsorgeauftragVorhanden: "ja", vorsorgeauftragValidiert: "ja",
    vorsorgeauftragBemerkung: "Sohn als vorsorgebeauftragte Person",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    anmeldungPraezisierungen: "Anmeldung durch die Onkologie des Kantonsspitals, palliative Mitbetreuung vereinbart.",
    atlAssessment: {
      ...ATL_LEER,
      "Atemnot": atl(true, "In Ruhe zunehmend, Morphin als Reserve"),
      "Sauerstoffbedarf": atl(true, "Bei Bedarf 2 l/min"),
      "Körperpflege": atl(true, "Vollständige Übernahme im Bett"),
      "An-/Auskleiden": atl(true, "Vollständige Übernahme"),
      "Selbständige Mobilität": atl(true, "Bettlägerig, Transfer in den Sessel zu zweit"),
      "Lagern / Transferhilfe": atl(true, "Lagerung alle drei Stunden, Wechseldruckmatratze"),
      "Ernährung": atl(true, "Wunschkost in kleinen Portionen, kein Zwang"),
      "Schluckstörungen": atl(true, "Zeitweise, Medikamente in flüssiger Form"),
      "Inkontinenz": atl(true, "Dauerkatheter"),
      "Katheter / Stoma": atl(true, "Dauerkatheter, Wechsel vierwöchentlich"),
      "Temperaturregulation": atl(true, "Subfebril, Kontrolle zweimal täglich"),
      "Orientierung": atl(true, "Zeitweise verwirrt, vor allem abends"),
      "Sturzrisiko": atl(true, "Hoch, Bettgitter nach Absprache"),
      "Kommunikationsfähigkeit": atl(true, "Leise Stimme, kurze Gespräche"),
      "Medikamente richten": atl(true, "Durch Spitex, Betäubungsmittel dokumentiert"),
      "Medikamente verabreichen": atl(true, "Schmerzpflaster, Reserve subkutan"),
      "Vitalwerte-Messungen": atl(true, "Schmerzskala und Temperatur zweimal täglich"),
    },
  },

  /* ── Zimmermann, Gertrud · 1950 · leicht ─────────────────────────────────── */
  "P-2026-0049": {
    anrede: "frau",
    groesse: "164", gewicht: "67", gewichtsverlust: "nein", brille: "ja", hoergeraet: "nein",
    chronischeErkrankungen: "Hypothyreose (substituiert)",
    operationen: "Keine",
    allergien: "Keine bekannt",
    anamneseText: "Selbstständig im Alltag, Spitex unterstützt bei der Medikamentenkontrolle nach Umstellung. Keine Auffälligkeiten bei Mobilität oder Kognition.",
    sturzLetzte12m: "nein", sturzAnzahl: "", sturzKommentar: "",
    stimmungAktuell: "stabil",
    patientenverfuegungVorhanden: "unbekannt",
    vorsorgeauftragVorhanden: "unbekannt", vorsorgeauftragValidiert: "unbekannt",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(false),
      "An-/Auskleiden": atl(false),
      "Selbständige Mobilität": atl(false),
      "Ernährung": atl(false),
      "Orientierung": atl(false),
      "Sturzrisiko": atl(false),
      "Medikamente richten": atl(true, "Kontrolle nach Umstellung"),
    },
  },

  /* ── Keller, Werner · 1950er · mittel ────────────────────────────────────── */
  "P-2026-0050": {
    anrede: "herr",
    groesse: "176", gewicht: "88", gewichtsverlust: "nein", brille: "ja", hoergeraet: "nein",
    chronischeErkrankungen: "Zustand nach Hirnschlag mit Restparese links, Arterielle Hypertonie",
    operationen: "Keine",
    allergien: "Keine bekannt",
    anamneseText: "Restparese des linken Arms nach Hirnschlag 2025. Ergotherapie läuft, Fortschritte sichtbar. Ehefrau übernimmt Haushalt, Spitex für Körperpflege und Medikamente.",
    sturzLetzte12m: "ja", sturzAnzahl: "1", sturzKommentar: "Beim Transfer aus dem Bett, ohne Folgen",
    stimmungAktuell: "schwankend",
    patientenverfuegungVorhanden: "nein",
    vorsorgeauftragVorhanden: "nein", vorsorgeauftragValidiert: "unbekannt",
    sozialamtInvolviert: "nein", gesetzlicheVertretung: "nein",
    atlAssessment: {
      ...ATL_LEER,
      "Körperpflege": atl(true, "Hilfe beim Waschen des Oberkörpers"),
      "An-/Auskleiden": atl(true, "Hilfe wegen Parese links"),
      "Selbständige Mobilität": atl(true, "Stock, kurze Strecken selbstständig"),
      "Lagern / Transferhilfe": atl(true, "Anleitung beim Transfer"),
      "Ernährung": atl(false, "Selbstständig mit angepasstem Besteck"),
      "Orientierung": atl(false),
      "Sturzrisiko": atl(true, "Erhöht beim Transfer"),
      "Medikamente richten": atl(true, "Wochendispenser durch Spitex"),
      "Vitalwerte-Messungen": atl(true, "Blutdruck täglich"),
    },
  },
};

/**
 * Die Ergänzungen eines Patienten. Ohne Eintrag ein leeres Objekt — der
 * Aufrufer legt die Werte über `emptyPatientForm`, ein fehlender Eintrag
 * bedeutet also «nichts erfasst», nicht «Fehler».
 */
export function formularErgaenzungen(patientId: string): Ergaenzung {
  return ERGAENZUNGEN[patientId] ?? {};
}
