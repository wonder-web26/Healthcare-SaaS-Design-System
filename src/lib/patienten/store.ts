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
import { isoZuDate } from "../datum";

/** Zeichen für "keine Pflegefachkraft zugewiesen" — Bestandskonvention. */
export const NICHT_ZUGEWIESEN = "—";

/**
 * Mock-Stichtag des Prototyps (CLAUDE.md: 03.03.2026). Alle Fristrechnungen am
 * Patienten laufen dagegen, nie gegen new Date() — damit sind sie ohne
 * Rendering nachrechenbar.
 */
export const PATIENTEN_BEZUGSDATUM_ISO = "2026-03-03";

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

/** Der Patient eines Onboardings, sofern dieses bereits einen erzeugt hat. */
function patientFuerOnboarding(onboardingId: string): Patient | undefined {
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
  adresseStrasse: string;
  adressePlz: string;
  adresseOrt: string;
  /** Code aus der Kassen-Picklist; der Bestand hält den Klartextnamen. */
  krankenkasse: string;
  kartennummer: string;
  hausarztName: string;
  hausarztTelefon: string;
  notfallkontaktName: string;
  notfallkontaktTelefon: string;
  notfallkontaktBeziehung: string;
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
  "vorname" | "nachname" | "geburtsdatum" | "ahvNummer" | "adresse" | "krankenkasse" |
  "kartennummer" | "hausarztName" | "hausarztTelefon" |
  "notfallkontaktName" | "notfallkontaktTelefon" | "notfallkontaktBeziehung" |
  "angehoeriger" | "angehoerigerTelefon"> {
  return {
    vorname: eingabe.vorname,
    nachname: eingabe.name,
    geburtsdatum: eingabe.geburtsdatum,
    ahvNummer: eingabe.ahvNummer,
    adresse: adresseZusammensetzen(eingabe.adresseStrasse, eingabe.adressePlz, eingabe.adresseOrt),
    krankenkasse: eingabe.krankenkasse ? getKrankenkasseLabel(eingabe.krankenkasse) : "",
    kartennummer: eingabe.kartennummer,
    hausarztName: eingabe.hausarztName,
    hausarztTelefon: eingabe.hausarztTelefon,
    notfallkontaktName: eingabe.notfallkontaktName,
    notfallkontaktTelefon: eingabe.notfallkontaktTelefon,
    notfallkontaktBeziehung: eingabe.notfallkontaktBeziehung,
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
 * Kanton, Sprache, Leistungsart, Aufnahmedatum, letzter Besuch, letzte
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
    aufnahmeDatum: "",
    letzterBesuch: "",
    sprache: "",
    hausarztFachgebiet: "",
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
