/**
 * Vollständig befüllter Demo-Onboarding-Fall OB-2026-101 (Steiner).
 *
 * Vera Steiner (Angehörige, im Stundenlohn) pflegt ihren Ehemann Hans-Rudolf
 * Steiner (Patient). Beide Formulare sind vollständig und konsistent vorbefüllt
 * (Schweizer Nationalität → aufenthaltsstatus "CH", kein Compliance-Blocker;
 * Pflichtdokumente als Scans hinterlegt). Die Werte sind über die Spread-Basis
 * emptyAngehoerigerForm/emptyPatientForm typvollständig — hier werden alle
 * fachlich sinnvollen Felder überschrieben.
 *
 * Wird über die Fall-Kennung in OnboardingPage vorbefüllt; kein Neuladen-Überleben
 * (Prototyp). Rhythmus-Aufgaben werden über seedDemoRhythmus() erzeugt.
 */
import { type AngehoerigerFormData, emptyAngehoerigerForm } from "./StepAngehoeriger";
import { type PatientFormData, emptyPatientForm } from "./StepPatient";
import type { ScanFile } from "./form/DokumentScanUpload";
import { generiereRhythmusTickets } from "../../lib/rhythmus/engine";

export const DEMO_FALL_ID = "OB-2026-101";

const scan = (name: string): ScanFile => ({
  name, type: "application/pdf", size: "1.1 MB", timestamp: "2026-02-18T09:00:00", previewUrl: null,
});

/* ── Angehörige: Vera Steiner ──────────────────────────────────────────────── */
export const demoSteinerAngehoeriger: AngehoerigerFormData = {
  ...emptyAngehoerigerForm,
  name: "Steiner", vorname: "Vera", geschlecht: "weiblich", geburtsdatum: "22.09.1961",
  ahvNummer: "756.1234.5678.97", nationalitaet: "schweiz", heimatort: "Winterthur ZH",
  // Schweizer Bürgerrecht — der Aufenthaltsstatus erscheint nur bei ausländischer
  // Staatsangehörigkeit und bleibt daher leer.
  aufenthaltsstatus: "",
  zivilstand: "verheiratet", zivilstandSeit: "12.05.1984",
  strasse: "Rosenweg 14", plz: "8400", ort: "Winterthur",
  email: "vera.steiner@example.ch", telefon: "+41 79 412 55 08",
  krankenkasseName: "helsana", kartennummer: "80756000123456789", bagNr: "0580",
  quellensteuer: "nein", konfession: "evangelisch_reformiert", steuergemeinde: "Winterthur",
  bvgVersichert: "ja", uvgVersichert: "ja", sozialamtInvolviert: "nein", lohnabtretung: "nein",
  // Partner = der Patient (Ehemann)
  partnerManualToggle: true, partnerVorname: "Hans-Rudolf", partnerName: "Steiner",
  partnerGeburtsdatum: "14.06.1956", partnerNationalitaet: "schweiz", partnerAufenthaltsstatus: "CH",
  partnerErwerbstaetig: "nein", partnerAhvNummer: "756.9876.5432.10", partnerBerufstaetig: "nein",
  partnerAhv: "756.9876.5432.10",
  // Ein erwachsenes Kind in Ausbildung → Ausbildungszulage über Spitex
  hatUnterhaltspflichtigeKinder: "ja", anzahlKinder: "1",
  kinder: [{
    id: "K-Steiner-1", vorname: "Lena", name: "Steiner", geburtsdatum: "03.03.2005",
    geschlecht: "weiblich", ahvNummer: "756.2233.4455.66", inAusbildung: "ja",
    ausbildungsbeginn: "01.09.2023", ausbildungsstatus: "laufend", zulagenart: "ausbildungszulage",
    typQuelle: "abgeleitet", overrideBegruendung: "", doppelbezug: "nein",
  }],
  kinderzulagenUeberSpitex: "ja", kinderzulagenBeantragt: "ja", familienausgleichskasse: "Ausgleichskasse Zürich",
  // Anstellung & Auszahlung
  funktion: "pflegehilfe", eintrittsdatum: "18.02.2026", stundenlohn: "34.50",
  arbeitetExtern: "nein", bvgAnbindungGewuenscht: "ja",
  qualifikation: "pflegehilfe", deutschNiveau: "muttersprache",
  zertifikatVorhanden: "ja", srkZertifikatVorhanden: "ja",
  lohnart: "stundenlohn", ferienanspruchWochen: "5.0",
  bankname: "Zürcher Kantonalbank", iban: "CH93 0076 2011 6238 5295 7",
  scans: {
    id_scan: scan("id_vera_steiner.pdf"),
    krankenkassenkarte: scan("kvg_karte_vera.pdf"),
    bankkarte: scan("bankverbindung_zkb.pdf"),
    partner_krankenkassenkarte: scan("kvg_karte_hansrudolf.pdf"),
    kinder_krankenkassenkarte: scan("kvg_karte_lena.pdf"),
    familienbuchlein: scan("familienbuechlein_steiner.pdf"),
  },
};

/* ── Patient: Hans-Rudolf Steiner ──────────────────────────────────────────── */
export const demoSteinerPatient: PatientFormData = {
  ...emptyPatientForm,
  // Reiter Anmeldung: AA1 bleibt auf dem Standardwert (Eintritt). AA2 übernimmt
  // das bisherige Aufnahmedatum des Mandats unverändert. AA3 ist der Hausarzt,
  // der den Fall angemeldet hat, und BB16 die somatische Situation — beides passt
  // zur Anamnese (Gangunsicherheit, Diabetes, Herzinsuffizienz).
  eroeffnungsgrund: "1",
  dossierEroeffnetAm: "18.02.2026",
  anmeldendeInstitution: "1",
  anmeldendePersonName: "Dr. med. R. Lüthi",
  anmeldendePersonFunktion: "Hausarzt",
  anmeldendePersonTelefon: "+41 52 213 44 55",
  anmeldendePersonEmail: "praxis.luethi@example.ch",
  einschaetzungSituation: "1",
  // Gemeinsame Schlüssel mit dem Angehörigen; die SDA-Codes hängen an der Liste.
  // Aufenthaltsstatus bleibt leer: er erscheint nur bei ausländischer Staatsangehörigkeit.
  name: "Steiner", vorname: "Hans-Rudolf", geburtsdatum: "14.06.1956", geschlecht: "maennlich",
  staatsangehoerigkeit: "schweiz", heimatort: "Winterthur ZH", zivilstand: "verheiratet", aufenthaltsstatus: "",
  krankenkasse: "helsana", ahvNummer: "756.9876.5432.10",
  hausarztName: "Dr. med. R. Lüthi", hausarztTelefon: "+41 52 213 44 55", hausarztEmail: "praxis.luethi@example.ch",
  email: "hr.steiner@example.ch", telefon: "+41 79 330 22 11",
  adresseStrasse: "Rosenweg 14", adressePlz: "8400", adresseOrt: "Winterthur",
  notfallkontaktName: "Vera Steiner", notfallkontaktTelefon: "+41 79 412 55 08", notfallkontaktBeziehung: "Ehefrau",
  spezialAerzte: "Dr. med. A. Frei (Kardiologie), Kantonsspital Winterthur",
  kartennummer: "80756000987654321", bagNr: "0580",
  sozialamtKontakt: "nein", ivBezug: "nein", hilflosenentschaedigung: "ja", assistenzbeitrag: "nein",
  konfession: "evangelisch_reformiert",
  groesse: "174", gewicht: "78", gewichtsverlust: "nein", brille: "ja", hoergeraet: "ja",
  chronischeErkrankungen: "Arterielle Hypertonie, Diabetes mellitus Typ 2, beginnende Herzinsuffizienz (NYHA II)",
  // BB11: das bisherige "ja" war nicht auflösbar. Neu gesetzt auf 0 — die beiden
  // dokumentierten Eingriffe liegen 2019 und 2022 und damit weit ausserhalb der
  // 90-Tage-Periode; die Anamnese nennt keinen jüngeren Spitalaufenthalt.
  spitalaufenthalte: "0", operationen: "Hüft-Totalprothese rechts (2019), Katarakt beidseits (2022)",
  // BB9: der bisherige Freitext war kein Listenwert. Neu gesetzt auf 1 — eigene
  // Wohnung im 2. Obergeschoss mit Lift, zu zweit bewohnt.
  allergien: "Penicillin",
  // Reiter Wohnen & Umfeld. BB9 unverändert aus dem bisherigen Umzug.
  // BB10a = 2: lebt ausschliesslich mit der Ehefrau Vera zusammen.
  // BB10b = 0: die Wohnsituation hat sich in den letzten 90 Tagen nicht geändert.
  // BB15a–e = 0: die Anamnese nennt keinen Heim- oder Klinikaufenthalt in den letzten fünf Jahren.
  wohnsituation: "1",
  formZusammenleben: "2",
  neuZusammenlebend: "0",
  wohnvorgeschichtePflegeheim: "0",
  wohnvorgeschichteBetreutesWohnen: "0",
  wohnvorgeschichtePsychischeProbleme: "0",
  wohnvorgeschichtePsychiatrie: "0",
  wohnvorgeschichteGeistigeBehinderung: "0",
  etage: "2", liftVorhanden: "ja", treppen: "ja", personenImHaushalt: "2",
  anamneseText: "Zunehmende Gangunsicherheit, benötigt Unterstützung bei Körperpflege und Medikamentenmanagement. Kognitiv orientiert, Stimmung stabil.",
  stimmungAktuell: "stabil", behandlungszielFokus: "Erhalt der Selbständigkeit, Sturzprävention",
  atlAssessment: {
    ...emptyPatientForm.atlAssessment,
    "Körperpflege": { ja: true, bemerkungen: "Hilfe beim Duschen an drei Tagen pro Woche" },
    "An-/Auskleiden": { ja: true, bemerkungen: "Teilweise Unterstützung, v. a. untere Extremität" },
    "Selbständige Mobilität": { ja: true, bemerkungen: "Rollator, kurze Strecken selbstständig" },
    "Lagern / Transferhilfe": { ja: false, bemerkungen: "" },
    "Ernährung": { ja: false, bemerkungen: "Selbstständig, ausgewogen" },
    "Orientierung": { ja: false, bemerkungen: "Zeitlich und örtlich orientiert" },
    "Sturzrisiko": { ja: true, bemerkungen: "Erhöht — zwei Stürze im Bad, siehe Anamnese" },
    "Medikamente richten": { ja: true, bemerkungen: "Wochendispenser durch Spitex" },
    "Medikamente verabreichen": { ja: true, bemerkungen: "Insulin morgens" },
    "Vitalwerte-Messungen": { ja: true, bemerkungen: "Blutdruck und Blutzucker täglich" },
  },
  haushaltsgroesse: "2", zusatzversicherung: "ja",
};

/**
 * Rhythmus-/Workflow-Aufgaben für den Demo-Fall erzeugen (idempotent je Subjekt).
 * Anker = Eintrittsdatum 18.02.2026. Ohne Umweg über den Patienten-Schritt.
 */
export function seedDemoRhythmus(): void {
  generiereRhythmusTickets("patient", DEMO_FALL_ID, "Steiner, Hans-Rudolf", "2026-02-18", "Maria Keller");
}
