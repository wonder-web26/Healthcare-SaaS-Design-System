/**
 * Patientenformular — derselbe Formularstand, den der Onboarding-Schritt führt,
 * aber je Patient statt je Onboarding-Fall.
 *
 * Warum es diesen Bestand braucht: die Patientendetailansicht zeigt jetzt
 * denselben Reitersatz wie der Onboarding-Schritt «Patient» (StepPatient), und
 * der arbeitet auf `PatientFormData`. Der Patientenbestand hält aber `Patient`
 * — eine verdichtete Form. Der Abgleich der beiden Typen ergab: 54 der 82
 * Formularfelder stehen im Patientendatensatz (48 gleichnamig, 6 umbenannt),
 * die übrigen 28 nicht. Darunter der gesamte Anamnese-Block, das ATL-Assessment
 * und die Dokumente.
 *
 * Die Rückabbildung allein liefert deshalb ein halb leeres Formular. Dieser
 * Bestand schliesst die Lücke in drei Stufen, in dieser Reihenfolge:
 *
 *   1. gespeicherter Stand  — wurde in dieser Sitzung bereits gespeichert
 *   2. Rückabbildung        — die 54 Felder aus dem Patientendatensatz
 *   3. Ergänzungen          — die fehlenden 28 Felder aus dem Mockbestand
 *
 * Stufe 2 und 3 werden verschmolzen, nicht gegeneinander ausgespielt: der
 * Patientendatensatz gewinnt bei allem, was er kennt, weil Listen und Filter
 * gegen ihn prüfen.
 *
 * Prototyp: keine Persistenz. Ein Neuladen stellt den Ausgangsstand her.
 */
import { type Patient } from "../../app/components/patientData";
import { emptyPatientForm, type PatientFormData } from "../../app/components/StepPatient";
import { formularErgaenzungen } from "../mocks/patient-formular-extras";
import { sdaSpracheCode, sdaSpracheLabel } from "../stammdaten/sda-sprache";

/**
 * Patientendatensatz → Formular. Die Umkehrung von `stammdatenAbbilden`
 * (store.ts), soweit sie möglich ist.
 *
 * Sechs Felder heissen auf den beiden Seiten verschieden; sie sind hier
 * einzeln aufgeführt, damit die Umbenennung sichtbar bleibt und nicht als
 * stilles Weglassen erscheint. `sprache` hält im Bestand die BESCHRIFTUNG
 * (Listen suchen gegen Klartext), das Formular den Code — daher die
 * Rückübersetzung über `sdaSpracheCode`.
 */
export function formularAusPatient(p: Patient): PatientFormData {
  return {
    ...emptyPatientForm,
    ...formularErgaenzungen(p.id),

    /* ── umbenannt ── */
    name: p.nachname,
    adresseStrasse: p.strasse,
    adressePlz: p.plz,
    adresseOrt: p.ort,
    dossierEroeffnetAm: p.aufnahmeDatum,
    spracheCode: p.sprache ? sdaSpracheCode(p.sprache) : "",

    /* ── gleichnamig ── */
    vorname: p.vorname,
    geburtsdatum: p.geburtsdatum,
    geschlecht: p.geschlecht,
    staatsangehoerigkeit: p.staatsangehoerigkeit,
    heimatort: p.heimatort,
    zivilstand: p.zivilstand,
    aufenthaltsstatus: p.aufenthaltsstatus,
    ahvNummer: p.ahvNummer,
    email: p.email,
    telefon: p.telefon,
    mobil: p.mobil,
    gemeinde: p.gemeinde,
    bfsNummer: p.bfsNummer,
    kanton: p.kanton,
    land: p.land,
    pflegeortAbweichend: p.pflegeortAbweichend,
    pflegeortStrasse: p.pflegeortStrasse,
    pflegeortPlz: p.pflegeortPlz,
    pflegeortOrt: p.pflegeortOrt,
    pflegeortGemeinde: p.pflegeortGemeinde,
    pflegeortBfsNummer: p.pflegeortBfsNummer,
    pflegeortKanton: p.pflegeortKanton,
    pflegeortLand: p.pflegeortLand,
    rechnungsadresseAbweichend: p.rechnungsadresseAbweichend,
    rechnungInstitution: p.rechnungInstitution,
    rechnungVorname: p.rechnungVorname,
    rechnungNachname: p.rechnungNachname,
    rechnungStrasse: p.rechnungStrasse,
    rechnungPlz: p.rechnungPlz,
    rechnungOrt: p.rechnungOrt,
    rechnungKanton: p.rechnungKanton,
    rechnungLand: p.rechnungLand,
    spracheAndere: p.spracheAndere,
    uebersetzerNotwendig: p.uebersetzerNotwendig,
    ivBezug: p.ivBezug,
    ivBezugProzent: p.ivBezugProzent,
    hilflosenentschaedigung: p.hilflosenentschaedigung,
    hilflosenentschaedigungGrad: p.hilflosenentschaedigungGrad,
    assistenzbeitrag: p.assistenzbeitrag,
    konfession: p.konfession,
    quellensteuerHinweise: p.quellensteuerHinweise,
    wohnsituation: p.wohnsituation,
    formZusammenleben: p.formZusammenleben,
    neuZusammenlebend: p.neuZusammenlebend,
    etage: p.etage,
    liftVorhanden: p.liftVorhanden,
    treppen: p.treppen,
    personenImHaushalt: p.personenImHaushalt,
  };
}

/**
 * Formular → Patientendatensatz. Die Gegenrichtung, als Patch für
 * `aktualisierePatient`.
 *
 * Nur die 54 Felder, die der Datensatz kennt. Die übrigen 28 bleiben im
 * Formularbestand — sie haben im Datensatz keinen Platz, und einen dafür zu
 * erfinden wäre eine Datenmodell-Entscheidung, nicht eine Ansichtsfrage.
 *
 * Warum es diesen Weg überhaupt braucht: Listen, Filter und Suche prüfen gegen
 * den Patientendatensatz. Wer in der Detailansicht den Namen ändert und nur den
 * Formularbestand schreibt, sähe den alten Namen in der Liste.
 */
export function patientAusFormular(f: PatientFormData): Partial<Patient> {
  return {
    vorname: f.vorname,
    nachname: f.name,
    geburtsdatum: f.geburtsdatum,
    ahvNummer: f.ahvNummer,
    aufnahmeDatum: f.dossierEroeffnetAm,
    sprache: f.spracheCode ? sdaSpracheLabel(f.spracheCode) : "",
    strasse: f.adresseStrasse,
    plz: f.adressePlz,
    ort: f.adresseOrt,
    // Wie in `stammdatenAbbilden`: ohne erfasste Gemeinde gilt der Ort, damit
    // die Gemeindekennung nie leer steht.
    gemeinde: f.gemeinde || f.adresseOrt,
    bfsNummer: f.bfsNummer,
    kanton: f.kanton,
    land: f.land,
    pflegeortAbweichend: f.pflegeortAbweichend,
    pflegeortStrasse: f.pflegeortStrasse,
    pflegeortPlz: f.pflegeortPlz,
    pflegeortOrt: f.pflegeortOrt,
    pflegeortGemeinde: f.pflegeortGemeinde,
    pflegeortBfsNummer: f.pflegeortBfsNummer,
    pflegeortKanton: f.pflegeortKanton,
    pflegeortLand: f.pflegeortLand,
    rechnungsadresseAbweichend: f.rechnungsadresseAbweichend,
    rechnungInstitution: f.rechnungInstitution,
    rechnungVorname: f.rechnungVorname,
    rechnungNachname: f.rechnungNachname,
    rechnungStrasse: f.rechnungStrasse,
    rechnungPlz: f.rechnungPlz,
    rechnungOrt: f.rechnungOrt,
    rechnungKanton: f.rechnungKanton,
    rechnungLand: f.rechnungLand,
    geschlecht: f.geschlecht,
    staatsangehoerigkeit: f.staatsangehoerigkeit,
    heimatort: f.heimatort,
    zivilstand: f.zivilstand,
    aufenthaltsstatus: f.aufenthaltsstatus,
    konfession: f.konfession,
    telefon: f.telefon,
    mobil: f.mobil,
    email: f.email,
    spracheAndere: f.spracheAndere,
    uebersetzerNotwendig: f.uebersetzerNotwendig,
    wohnsituation: f.wohnsituation,
    formZusammenleben: f.formZusammenleben,
    neuZusammenlebend: f.neuZusammenlebend,
    etage: f.etage,
    liftVorhanden: f.liftVorhanden,
    treppen: f.treppen,
    personenImHaushalt: f.personenImHaushalt,
    ivBezug: f.ivBezug,
    ivBezugProzent: f.ivBezugProzent,
    hilflosenentschaedigung: f.hilflosenentschaedigung,
    hilflosenentschaedigungGrad: f.hilflosenentschaedigungGrad,
    assistenzbeitrag: f.assistenzbeitrag,
    quellensteuerHinweise: f.quellensteuerHinweise,
  };
}

/* ── Bestand ──────────────────────────────────────────────────────────────── */

/** Gespeicherte Formularstände je Patientenkennung. */
let staende: Record<string, PatientFormData> = {};

/** Der gespeicherte Stand, oder `undefined` wenn für diesen Patienten nie gespeichert wurde. */
export function getPatientFormular(patientId: string): PatientFormData | undefined {
  return staende[patientId];
}

/** Legt den Formularstand ab. Ersetzt einen früheren Stand vollständig. */
export function sicherePatientFormular(patientId: string, data: PatientFormData): void {
  staende = { ...staende, [patientId]: { ...data } };
}

/**
 * Der Anfangsstand für die Detailansicht — die drei Stufen aus dem Kopf dieser
 * Datei in einer Zeile. Einzige Stelle, die die Reihenfolge kennt.
 */
export function anfangsFormular(p: Patient): PatientFormData {
  return getPatientFormular(p.id) ?? formularAusPatient(p);
}

/** Nur für Tests: Bestand leeren. */
export function setzePatientFormulareZurueck(): void {
  staende = {};
}
