/**
 * Patientenbestand — EIN Bestand für alle Ansichten.
 *
 * Ein Patient entsteht, sobald im Onboarding der Schritt "Patient" begonnen
 * wird, und behält von da an dieselbe Kennung. Der Abschluss des Onboardings
 * kopiert nichts und erzeugt nichts; er wechselt ausschliesslich den Zustand
 * von "im_onboarding" auf "aktiv".
 *
 * Prototyp: der Bestand lebt im Modul-State — keine Persistenz, kein
 * Neuladen-Überleben. Das ist Absicht.
 *
 * Sichtbarkeit: `usePatienten()` / `getPatienten()` liefern den sichtbaren
 * Bestand OHNE Patienten im Onboarding. Wer einen bestimmten Patienten sucht
 * (Detailseite), nimmt `getPatient()` — das findet auch die noch nicht
 * abgeschlossenen.
 */
import { useSyncExternalStore } from "react";
import { type Patient, type PatientStatus, type AbrechnungsStatus, patientenSeed } from "../../app/components/patientData";
import { getKrankenkasseLabel } from "../stammdaten/krankenkassen";
import { isoZuDate, anzeigeZuIso, jetztAnzeige } from "../datum";
import { GEGENWART_ISO } from "../gegenwart";
import { ENTLASSUNG_SONSTIGES } from "../stammdaten/entlassung";
import { getMandate, aktualisiereMandat } from "../mandate/store";
import { rhythmusBeenden } from "../rhythmus/engine";
import { sdaSpracheLabel } from "../stammdaten/sda-sprache";

/** Zeichen für "keine Pflegefachkraft zugewiesen" — Bestandskonvention. */
export const NICHT_ZUGEWIESEN = "—";

/**
 * Fristrechnungen am Patienten laufen gegen die Gegenwart, nie gegen
 * new Date() — damit sind sie ohne Rendering nachrechenbar.
 *
 * Der Name bleibt, damit die Aufrufstellen unverändert lesen; der Wert kommt
 * jetzt aus lib/gegenwart.
 */
export const PATIENTEN_BEZUGSDATUM_ISO = GEGENWART_ISO;

/**
 * Tage vom Bezugsdatum bis zur Re-Assessment-Frist. null = keine Frist
 * hinterlegt; dann bleibt die Zelle leer, es wird keine Null gezeigt.
 */
export function tageBisReAssessment(p: Patient, bezugIso: string = PATIENTEN_BEZUGSDATUM_ISO): number | null {
  const frist = isoZuDate(p.reAssessmentFrist ?? "");
  const bezug = isoZuDate(bezugIso);
  if (!frist || !bezug) return null;
  const differenz = Date.UTC(frist.getFullYear(), frist.getMonth(), frist.getDate())
    - Date.UTC(bezug.getFullYear(), bezug.getMonth(), bezug.getDate());
  return Math.round(differenz / 86_400_000);
}

/* ── Bestand + Abonnenten ──────────────────────────────────────────────────── */
let bestand: Patient[] = patientenSeed;
let sichtbarerBestand: Patient[] = bestand.filter(p => p.status !== "im_onboarding");
const listeners = new Set<() => void>();

function setzeBestand(neu: Patient[]): void {
  bestand = neu;
  sichtbarerBestand = neu.filter(p => p.status !== "im_onboarding");
  for (const l of listeners) l();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function getSichtbar(): Patient[] { return sichtbarerBestand; }

/* ── Lesen ─────────────────────────────────────────────────────────────────── */

/** Reaktiv, sichtbarer Bestand (ohne Patienten im Onboarding). */
export function usePatienten(): Patient[] {
  return useSyncExternalStore(subscribe, getSichtbar);
}

/** Nicht-reaktiv, sichtbarer Bestand — für Module ausserhalb von React. */
export function getPatienten(): Patient[] {
  return sichtbarerBestand;
}

/** Ein Patient nach Kennung — findet auch Patienten im Onboarding. */
export function getPatient(id: string): Patient | undefined {
  return bestand.find(p => p.id === id);
}

/**
 * Der Patient eines Onboardings, sofern dieses bereits einen erzeugt hat.
 *
 * Exportiert, weil die Notizspur eines neu begonnenen Onboardings eine
 * Personen-Kennung braucht: der Fall selbst steht noch nicht im
 * Fallverzeichnis, der Patient aber bereits im Bestand.
 */
export function patientFuerOnboarding(onboardingId: string): Patient | undefined {
  return bestand.find(p => p.onboardingId === onboardingId);
}

/* ── Kennungen ─────────────────────────────────────────────────────────────── */

/**
 * Nächste freie Patientenkennung im Format der bestehenden Daten.
 * Läuft über den höchsten belegten Zähler weiter, damit sie nie kollidiert.
 */
function naechstePatientKennung(): string {
  let hoechste = 0;
  for (const p of bestand) {
    const m = p.id.match(/^P-\d{4}-(\d{4})$/);
    if (m) hoechste = Math.max(hoechste, parseInt(m[1], 10));
  }
  return `P-2026-${String(hoechste + 1).padStart(4, "0")}`;
}

/* ── Abbildung Onboarding → Patient ────────────────────────────────────────── */

/** Die im Patienten-Reiter erhobenen Felder, die im Patientenbestand ein Ziel haben. */
export interface PatientStammdatenEingabe {
  vorname: string;
  /** Nachname — im Formular heisst das Feld "name". */
  name: string;
  geburtsdatum: string;
  ahvNummer: string;
  /** AA2 — Datum der Eröffnung des Dossiers; alleinige Quelle des Aufnahmedatums. */
  dossierEroeffnetAm: string;
  /** BB13 — Code der üblicherweise gesprochenen Sprache. */
  spracheCode: string;
  adresseStrasse: string;
  adressePlz: string;
  adresseOrt: string;
  /** Code aus der Kassen-Picklist; der Bestand hält den Klartextnamen. */
  krankenkasse: string;
  kartennummer: string;
  /* ── Bisher nicht übergeben ──────────────────────────────────────────────
     28 Angaben, die das Abklärungsgespräch erhebt und die nie beim Patienten
     ankamen. Sie standen im Formular und blieben dort. */
  geschlecht: string;
  staatsangehoerigkeit: string;
  heimatort: string;
  zivilstand: string;
  aufenthaltsstatus: string;
  konfession: string;
  telefon: string;
  email: string;
  spracheAndere: string;
  uebersetzerNotwendig: string;
  zusatzversicherungKasse: string;
  weitereVersicherung: string;
  hausarztEmail: string;
  spezialAerzte: string;
  wohnsituation: string;
  formZusammenleben: string;
  neuZusammenlebend: string;
  etage: string;
  liftVorhanden: string;
  treppen: string;
  personenImHaushalt: string;
  sozialamtKontakt: string;
  sozialamtKontaktDetail: string;
  ivBezug: string;
  ivBezugProzent: string;
  hilflosenentschaedigung: string;
  assistenzbeitrag: string;
  quellensteuerHinweise: string;
  /** SP-03 — BAG-Nr. der Kasse. Das Feld bestand am Patienten und blieb leer. */
  bagNr: string;
}

/** Der Angehörige kommt aus der Verknüpfung, nicht aus dem Notfallkontakt. */
export interface AngehoerigerVerknuepfung {
  vorname: string;
  name: string;
  telefon: string;
}

/** "Musterstrasse 12, 8000 Zürich" — leere Bestandteile fallen weg. */
function adresseZusammensetzen(strasse: string, plz: string, ort: string): string {
  const ortsteil = [plz.trim(), ort.trim()].filter(Boolean).join(" ");
  return [strasse.trim(), ortsteil].filter(Boolean).join(", ");
}

function angehoerigerAnzeige(a: AngehoerigerVerknuepfung | null): string {
  if (!a) return "";
  return `${a.vorname} ${a.name}`.trim();
}

/**
 * Abrechnungsstatus folgt dem Zustand — er ist keine zweite Quelle, sondern
 * dieselbe Aussage in der Abrechnungs-Sprache.
 */
function abrechnungsStatusZu(status: PatientStatus): AbrechnungsStatus {
  switch (status) {
    case "im_onboarding": return "in_vorbereitung";
    case "nicht_abrechenbar": return "nicht_abrechenbar";
    case "gekuendigt": return "gekuendigt";
    case "ausgetreten": return "ausgetreten";
    case "aktiv": default: return "abrechenbar";
  }
}

/**
 * Felder des Patienten, die aus dem Onboarding gespeist werden. Alles, was das
 * Onboarding nicht erhebt, steht hier bewusst NICHT — es bleibt leer.
 */
function stammdatenAbbilden(
  eingabe: PatientStammdatenEingabe,
  angehoeriger: AngehoerigerVerknuepfung | null,
): Pick<Patient,
  "vorname" | "nachname" | "geburtsdatum" | "ahvNummer" | "adresse" | "krankenkasse" | "aufnahmeDatum" |
  "kartennummer" | "sprache" |
  "angehoeriger" | "angehoerigerTelefon" | "bagNr" |
  "geschlecht" | "staatsangehoerigkeit" | "heimatort" | "zivilstand" | "aufenthaltsstatus" | "konfession" | "telefon" | "email" | "spracheAndere" | "uebersetzerNotwendig" | "zusatzversicherungKasse" | "weitereVersicherung" | "hausarztEmail" | "spezialAerzte" | "wohnsituation" | "formZusammenleben" | "neuZusammenlebend" | "etage" | "liftVorhanden" | "treppen" | "personenImHaushalt" | "sozialamtKontakt" | "sozialamtKontaktDetail" | "ivBezug" | "ivBezugProzent" | "hilflosenentschaedigung" | "assistenzbeitrag" | "quellensteuerHinweise"> {
  return {
    vorname: eingabe.vorname,
    nachname: eingabe.name,
    geburtsdatum: eingabe.geburtsdatum,
    ahvNummer: eingabe.ahvNummer,
    // AA2 ist die einzige Quelle; die Detailseite zeigt den Wert nur noch an.
    aufnahmeDatum: eingabe.dossierEroeffnetAm,
    // BB13 ist die einzige Quelle. Der Bestand hält die BESCHRIFTUNG, weil
    // Zuweisungs-Übereinstimmung, Sprachfilter und Suche gegen Klartext prüfen.
    sprache: eingabe.spracheCode ? sdaSpracheLabel(eingabe.spracheCode) : "",
    adresse: adresseZusammensetzen(eingabe.adresseStrasse, eingabe.adressePlz, eingabe.adresseOrt),
    krankenkasse: eingabe.krankenkasse ? getKrankenkasseLabel(eingabe.krankenkasse) : "",
    kartennummer: eingabe.kartennummer,
    geschlecht: eingabe.geschlecht,
    staatsangehoerigkeit: eingabe.staatsangehoerigkeit,
    heimatort: eingabe.heimatort,
    zivilstand: eingabe.zivilstand,
    aufenthaltsstatus: eingabe.aufenthaltsstatus,
    konfession: eingabe.konfession,
    telefon: eingabe.telefon,
    email: eingabe.email,
    spracheAndere: eingabe.spracheAndere,
    uebersetzerNotwendig: eingabe.uebersetzerNotwendig,
    zusatzversicherungKasse: eingabe.zusatzversicherungKasse,
    weitereVersicherung: eingabe.weitereVersicherung,
    hausarztEmail: eingabe.hausarztEmail,
    spezialAerzte: eingabe.spezialAerzte,
    wohnsituation: eingabe.wohnsituation,
    formZusammenleben: eingabe.formZusammenleben,
    neuZusammenlebend: eingabe.neuZusammenlebend,
    etage: eingabe.etage,
    liftVorhanden: eingabe.liftVorhanden,
    treppen: eingabe.treppen,
    personenImHaushalt: eingabe.personenImHaushalt,
    sozialamtKontakt: eingabe.sozialamtKontakt,
    sozialamtKontaktDetail: eingabe.sozialamtKontaktDetail,
    ivBezug: eingabe.ivBezug,
    ivBezugProzent: eingabe.ivBezugProzent,
    hilflosenentschaedigung: eingabe.hilflosenentschaedigung,
    assistenzbeitrag: eingabe.assistenzbeitrag,
    quellensteuerHinweise: eingabe.quellensteuerHinweise,
    bagNr: eingabe.bagNr,
    angehoeriger: angehoerigerAnzeige(angehoeriger),
    angehoerigerTelefon: angehoeriger?.telefon ?? "",
  };
}

/* ── Schreiben ─────────────────────────────────────────────────────────────── */

/**
 * Legt den Patienten eines Onboardings an oder schreibt die erfassten Felder
 * fort. Ruft man die Funktion mehrfach, entsteht KEIN zweiter Patient — die
 * Kennung bleibt dieselbe.
 *
 * Alle Felder, die das Onboarding nicht erhebt, bleiben leer: Schweregrad,
 * Kanton, Sprache, Leistungsart, letzter Besuch, letzte
 * Aktivität, Fachgebiet des Hausarztes, Re-Assessment-Frist, offene Tasks.
 * Die Pflegefachkraft trägt das im Bestand übliche Zeichen für "nicht
 * zugewiesen"; die Liste zeigt dafür die Aktion "Zuweisen".
 */
export function erfassePatientImOnboarding(
  onboardingId: string,
  eingabe: PatientStammdatenEingabe,
  angehoeriger: AngehoerigerVerknuepfung | null,
): Patient {
  const vorhanden = patientFuerOnboarding(onboardingId);
  const felder = stammdatenAbbilden(eingabe, angehoeriger);

  if (vorhanden) {
    const aktualisiert: Patient = { ...vorhanden, ...felder };
    setzeBestand(bestand.map(p => (p.id === vorhanden.id ? aktualisiert : p)));
    return aktualisiert;
  }

  const neu: Patient = {
    id: naechstePatientKennung(),
    onboardingId,
    ...felder,
    status: "im_onboarding",
    kanton: "",
    schweregrad: "",
    pflegefachkraft: NICHT_ZUGEWIESEN,
    pflegefachkraftInitialen: NICHT_ZUGEWIESEN,
    leistungsart: "",
    letzterBesuch: "",
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    zusatzversicherungKasse: "",
    weitereVersicherung: "",
    hausarztEmail: "",
    spezialAerzte: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    sozialamtKontakt: "",
    sozialamtKontaktDetail: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    bagNr: "",
    abrechnungsStatus: abrechnungsStatusZu("im_onboarding"),
    reAssessmentFrist: null,
    offeneActionTasks: null,
    letzteAktivitaet: "",
    abrechnungsstoppGrund: "",
    medlinkSync: "",
    prozessStatus: null,
  };
  setzeBestand([...bestand, neu]);
  return neu;
}

/**
 * Abschluss des Onboardings: der Patient wechselt von "im_onboarding" auf
 * "aktiv". Es wird nichts kopiert und nichts neu erzeugt. Hat das Onboarding
 * keinen Patienten (Altbestand aus den Mock-Mandaten), geschieht nichts.
 */
export function schliessePatientOnboardingAb(onboardingId: string): Patient | undefined {
  const patient = patientFuerOnboarding(onboardingId);
  if (!patient || patient.status !== "im_onboarding") return patient;
  const aktiv: Patient = { ...patient, status: "aktiv", abrechnungsStatus: abrechnungsStatusZu("aktiv") };
  setzeBestand(bestand.map(p => (p.id === patient.id ? aktiv : p)));
  return aktiv;
}

/**
 * Einzelne Felder eines Patienten fortschreiben (Inline-Bearbeitung im Dossier).
 * Kennung, Zustand und Onboarding-Bezug bleiben ausgenommen — die ändert nur
 * der Vorgang selbst, nie ein Formular.
 */
export function aktualisierePatient(
  patientId: string,
  patch: Partial<Omit<Patient, "id" | "onboardingId" | "status">>,
): void {
  setzeBestand(bestand.map(p => (p.id === patientId ? { ...p, ...patch } : p)));
}

/** Zuweisung einer Pflegefachkraft (Sidebar der Patientenliste). */
export function weisePflegefachkraftZu(patientId: string, name: string, initialen: string): void {
  setzeBestand(bestand.map(p => (p.id === patientId ? { ...p, pflegefachkraft: name, pflegefachkraftInitialen: initialen } : p)));
}

/* ══════════════════════════════════════════
   AUSTRITT — Bereich Z des Standardkatalogs
   ══════════════════════════════════════════ */

export interface AustrittEingabe {
  /** Z1 — letzter Tag der Inanspruchnahme, TT.MM.JJJJ. */
  datum: string;
  /** Z2 — Code aus lib/stammdaten/entlassung. */
  nach: string;
  /** Nur bei Code 13 gefüllt. */
  nachAndere: string;
  praezisierungen: string;
  /** Z3 — wer kodiert hat. Das Produkt kennt keine Unterschrift. */
  erfasstVon: string;
}

export type AustrittFehler =
  | "kein_datum"
  | "datum_unleserlich"
  | "datum_zukunft"
  | "datum_vor_aufnahme"
  | "kein_ziel"
  | "kein_freitext"
  | "unbekannt"
  | "bereits_ausgetreten";

export const AUSTRITT_FEHLERTEXT: Record<AustrittFehler, string> = {
  kein_datum: "Bitte das Austrittsdatum erfassen.",
  datum_unleserlich: "Das Austrittsdatum ist unvollständig oder ungültig.",
  datum_zukunft: "Das Austrittsdatum liegt in der Zukunft. Ein Austritt wird erfasst, wenn er eingetreten ist.",
  datum_vor_aufnahme: "Das Austrittsdatum liegt vor dem Aufnahmedatum.",
  kein_ziel: "Bitte angeben, wohin die Person nach dem Austritt geht.",
  kein_freitext: "Bei „Sonstiges“ braucht es eine Angabe im Freitext.",
  unbekannt: "Dieser Patient ist nicht im Bestand.",
  bereits_ausgetreten: "Dieser Patient ist bereits ausgetreten.",
};

/**
 * Austritt erfassen.
 *
 * Ein Vorgang, ein Schreibweg: der Zustand des Patienten wechselt auf
 * "ausgetreten", die Felder des Bereichs Z werden gesetzt, und die laufenden
 * Mandate erhalten dasselbe Enddatum. Die Mandate haben kein eigenes
 * Zustandsfeld — `mandatZustand` leitet "beendet" aus dem Enddatum ab; darum
 * genügt das Datum und es wird kein zweiter Zustand geführt.
 *
 * Geprüft wird gegen PATIENTEN_BEZUGSDATUM_ISO, nicht gegen new Date() —
 * dieselbe Regel wie bei allen Fristen am Patienten.
 *
 * Der Katalog unterscheidet Entlassung und Einsatzabbruch; bei einem Abbruch
 * wird kein Formular Entlassung ausgefüllt. Das Produkt kennt den Abbruch
 * nicht. Diese Lücke wird hier bewusst nicht überbrückt.
 */
export function austrittErfassen(
  patientId: string,
  eingabe: AustrittEingabe,
  bezugIso: string = PATIENTEN_BEZUGSDATUM_ISO,
): AustrittFehler | null {
  const patient = bestand.find(p => p.id === patientId);
  if (!patient) return "unbekannt";
  if (patient.status === "ausgetreten") return "bereits_ausgetreten";

  const datum = eingabe.datum.trim();
  if (!datum) return "kein_datum";
  const austrittIso = anzeigeZuIso(datum);
  if (!austrittIso) return "datum_unleserlich";
  if (austrittIso > bezugIso) return "datum_zukunft";
  const aufnahmeIso = anzeigeZuIso(patient.aufnahmeDatum);
  if (aufnahmeIso && austrittIso < aufnahmeIso) return "datum_vor_aufnahme";

  if (!eingabe.nach) return "kein_ziel";
  if (eingabe.nach === ENTLASSUNG_SONSTIGES && !eingabe.nachAndere.trim()) return "kein_freitext";

  const aktualisiert: Patient = {
    ...patient,
    status: "ausgetreten",
    abrechnungsStatus: abrechnungsStatusZu("ausgetreten"),
    austrittDatum: datum,
    austrittNach: eingabe.nach,
    // Freitext nur dort, wo der Katalog ihn vorsieht — sonst leer statt mitgeschleppt.
    austrittNachAndere: eingabe.nach === ENTLASSUNG_SONSTIGES ? eingabe.nachAndere.trim() : "",
    austrittPraezisierungen: eingabe.praezisierungen.trim(),
    austrittErfasstVon: eingabe.erfasstVon,
    austrittErfasstAm: jetztAnzeige(),
  };
  setzeBestand(bestand.map(p => (p.id === patientId ? aktualisiert : p)));

  // Laufende Mandate auf dasselbe Datum enden lassen. Bereits beendete bleiben,
  // wie sie sind — ein früheres Ende wird nicht überschrieben.
  for (const m of getMandate(patientId)) {
    if (!m.ende.trim()) aktualisiereMandat(m.id, { ende: datum });
  }

  // Der Betreuungsrhythmus endet. Offene Schritte entfallen mit Grund;
  // erledigte bleiben unangetastet — sie sind Nachweis.
  rhythmusBeenden("patient", patientId, `Patient ausgetreten am ${datum}`);
  return null;
}
