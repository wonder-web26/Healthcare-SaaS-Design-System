/**
 * Bestand der Allergien und Unverträglichkeiten — Sitzungsdauer.
 *
 * Muster wie lib/diagnosen/store.ts: useSyncExternalStore, Hörer-Set,
 * use…()-Hooks, …Sichern()-Funktionen. Keine Persistenz — Absicht (Prototyp).
 *
 * ZWEI GETRENNTE ANGABEN JE EINTRAG: `erfasstDurchUserId` sagt, wer
 * eingetragen hat; `behauptetVon…` sagt, wer es behauptet. Dieselbe Person
 * kann beides sein, muss es aber nicht — eine Angehörige behauptet, die
 * Pflegefachperson trägt ein. Nicht zusammenlegen.
 *
 * DIE ERHEBUNG IST EIN ZUSTAND DER LISTE, KEIN EINTRAG DARIN. «Nicht erfragt»
 * ist eine Aussage über die Erhebung, nicht über eine Substanz; sie steht im
 * Kopf der Liste, nie als Pseudo-Zeile.
 *
 * WIDERLEGTE EINTRÄGE WERDEN NIE GELÖSCHT. Eine widerlegte Allergie erspart
 * der nächsten Pflegefachperson dieselbe Abklärung.
 */
import { useSyncExternalStore } from "react";
import { GEGENWART_ISO } from "../gegenwart";
import type { AllergieKategorie, AllergieArt } from "./allergie-katalog-seed";

export type AllergieKritikalitaet = "low" | "high" | "unable-to-assess";
export type AllergieVerifikation = "unconfirmed" | "confirmed" | "refuted" | "entered-in-error";
export type AllergieKlinischerStatus = "active" | "inactive" | "resolved";
export type AllergieBehauptetVonTyp = "klientin" | "angehoerige" | "fachperson" | "dokument";

export interface Allergie {
  id: string;
  patientId: string;
  /** SNOMED-Code aus dem Katalog; null bei Freitext. */
  substanzCode: string | null;
  /** Anzeigename oder Freitexteingabe. */
  substanzText: string;
  /** false = Freitext — trägt seine Konsequenz sichtbar auf der Zeile. */
  substanzCodiert: boolean;
  kategorie: AllergieKategorie;
  typ: AllergieArt;
  kritikalitaet: AllergieKritikalitaet;
  verifikationsstatus: AllergieVerifikation;
  klinischerStatus: AllergieKlinischerStatus;
  /** ISO */
  letzteReaktionAm: string | null;
  /** ISO */
  identifiziertAm: string | null;
  /** Die verantwortende Pflegefachperson — wer EINGETRAGEN hat. */
  erfasstDurchUserId: string;
  erfasstVonName: string;
  /** Wer die Angabe BEHAUPTET — nicht dieselbe Frage wie erfasstDurch. */
  behauptetVonTyp: AllergieBehauptetVonTyp;
  behauptetVonId: string | null;
  behauptetVonDokumentId: string | null;
  bemerkung: string | null;
  erstelltAm: string;
  geaendertAm: string;
}

/**
 * Reaktion auf eine Allergie — nur der Typ, bewusst ohne Oberfläche.
 * Die Erfassung einzelner Reaktionsereignisse folgt in einem späteren Lauf.
 */
export interface AllergieReaktion {
  id: string;
  allergieId: string;
  manifestationCode: string | null;
  manifestationText: string;
  schwere: "mild" | "moderate" | "severe";
  /** ISO */
  reaktionAm: string | null;
  lokalisation: string;
  beschreibung: string;
}

export type AllergieErhebungZustand =
  | "nicht_begonnen" | "keine_bekannt" | "nicht_erfragt"
  | "nicht_verfuegbar" | "zurueckgehalten" | "abgeschlossen";

export interface AllergieErhebung {
  patientId: string;
  allergieErhebung: AllergieErhebungZustand;
  /** ISO */
  allergieErhebungAm: string | null;
  allergieErhebungVonName: string | null;
}

/** Angemeldete Benutzerin des Prototyps («Sandra Weber»). */
export const ANGEMELDETE_PFLEGEFACHPERSON = { userId: "U-SWEBER", name: "S. Weber" } as const;

/**
 * Mock-Dokumentquellen für die Herkunft «Dokument»: der Dokumente-Store führt
 * im Seed nur Dokumente von Angehörigen, keine Patientendokumente. Sind echte
 * Patientendokumente vorhanden, werden sie bevorzugt (siehe Komponente).
 */
export const MOCK_DOKUMENT_QUELLEN: { id: string; label: string; datumIso: string }[] = [
  { id: "ADOK-1", label: "Austrittsbericht KSW", datumIso: "2026-02-12" },
  { id: "ADOK-2", label: "Überweisungsbericht Hausarztpraxis", datumIso: "2026-01-28" },
];

/* ── Bestand + Abonnenten ──────────────────────────────────────────────────── */

/** Fünf Fälle für P-2026-0041 (Steiner): codiert/hoch/bestätigt, Umwelt
 *  unbestätigt, Fruktose als Unverträglichkeit (langer Katalogname),
 *  Freitext, widerlegt. */
let eintraege: Allergie[] = [
  {
    id: "AL-901", patientId: "P-2026-0041",
    substanzCode: "293619005", substanzText: "Ibuprofen", substanzCodiert: true,
    kategorie: "medication", typ: "allergy", kritikalitaet: "high",
    verifikationsstatus: "confirmed", klinischerStatus: "active",
    letzteReaktionAm: "2025-11-08", identifiziertAm: "2026-02-12",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    behauptetVonTyp: "dokument", behauptetVonId: null, behauptetVonDokumentId: "ADOK-1",
    bemerkung: null, erstelltAm: "2026-02-12", geaendertAm: "2026-02-12",
  },
  {
    id: "AL-902", patientId: "P-2026-0041",
    substanzCode: "232350006", substanzText: "Hausstaubmilbenprotein", substanzCodiert: true,
    kategorie: "environment", typ: "allergy", kritikalitaet: "low",
    verifikationsstatus: "unconfirmed", klinischerStatus: "active",
    letzteReaktionAm: null, identifiziertAm: null,
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    behauptetVonTyp: "klientin", behauptetVonId: null, behauptetVonDokumentId: null,
    bemerkung: null, erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    // Katalogbegriff als Anzeigename gewählt (42 Zeichen) — prüft den Umbruch.
    id: "AL-903", patientId: "P-2026-0041",
    substanzCode: "20052008", substanzText: "Fructose-1,6-Bisphosphat-Aldolase-B-Mangel", substanzCodiert: true,
    kategorie: "food", typ: "intolerance", kritikalitaet: "unable-to-assess",
    verifikationsstatus: "confirmed", klinischerStatus: "active",
    letzteReaktionAm: null, identifiziertAm: "2019-06-01",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    behauptetVonTyp: "fachperson", behauptetVonId: null, behauptetVonDokumentId: null,
    bemerkung: "Diagnose seit Kindheit bekannt.", erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    id: "AL-904", patientId: "P-2026-0041",
    substanzCode: null, substanzText: "Pflasterkleber", substanzCodiert: false,
    kategorie: "environment", typ: "allergy", kritikalitaet: "low",
    verifikationsstatus: "unconfirmed", klinischerStatus: "active",
    letzteReaktionAm: "2026-01-15", identifiziertAm: null,
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    behauptetVonTyp: "angehoerige", behauptetVonId: "A-2026-0101", behauptetVonDokumentId: null,
    bemerkung: "Hautrötung unter Wundpflaster beobachtet.", erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    id: "AL-905", patientId: "P-2026-0041",
    substanzCode: "293584003", substanzText: "Paracetamol", substanzCodiert: true,
    kategorie: "medication", typ: "allergy", kritikalitaet: "low",
    verifikationsstatus: "refuted", klinischerStatus: "inactive",
    letzteReaktionAm: null, identifiziertAm: "2024-03-01",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    behauptetVonTyp: "klientin", behauptetVonId: null, behauptetVonDokumentId: null,
    bemerkung: "Vertrug Paracetamol im Spital ohne Reaktion.", erstelltAm: "2026-02-18", geaendertAm: "2026-02-20",
  },
];

let erhebungen: AllergieErhebung[] = [
  { patientId: "P-2026-0041", allergieErhebung: "abgeschlossen", allergieErhebungAm: "2026-02-18", allergieErhebungVonName: "M. Sutter" },
];

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const eSchnappschuss = () => eintraege;
const hSchnappschuss = () => erhebungen;

export function useAllergien(): Allergie[] {
  return useSyncExternalStore(subscribe, eSchnappschuss, eSchnappschuss);
}

export function useAllergieErhebungen(): AllergieErhebung[] {
  return useSyncExternalStore(subscribe, hSchnappschuss, hSchnappschuss);
}

/** Erhebungszustand eines Patienten; ohne Eintrag gilt «nicht begonnen». */
export function getAllergieErhebung(patientId: string): AllergieErhebung {
  return erhebungen.find(e => e.patientId === patientId)
    ?? { patientId, allergieErhebung: "nicht_begonnen", allergieErhebungAm: null, allergieErhebungVonName: null };
}

let zaehler = 905;

/**
 * Eintrag anlegen oder ändern; leere Kennung legt an.
 * Wird erfasst, während die Erhebung «nicht begonnen» ist, springt sie
 * automatisch auf «abgeschlossen» — der erste Eintrag IST die Erhebung.
 */
export function allergieSichern(e: Omit<Allergie, "erstelltAm" | "geaendertAm"> & { id: string }): Allergie {
  const bestehend = eintraege.find(a => a.id === e.id);
  const gespeichert: Allergie = bestehend
    ? { ...bestehend, ...e, geaendertAm: GEGENWART_ISO }
    : { ...e, id: e.id || `AL-${++zaehler}`, erstelltAm: GEGENWART_ISO, geaendertAm: GEGENWART_ISO };
  eintraege = bestehend
    ? eintraege.map(a => (a.id === e.id ? gespeichert : a))
    : [...eintraege, gespeichert];
  if (getAllergieErhebung(e.patientId).allergieErhebung === "nicht_begonnen") {
    setzeErhebung(e.patientId, "abgeschlossen", gespeichert.erfasstVonName);
  }
  melden();
  return gespeichert;
}

/** Erhebungszustand setzen; Datum und Name werden beim Wechsel gestempelt. */
export function allergieErhebungSetzen(patientId: string, zustand: AllergieErhebungZustand, vonName: string): void {
  setzeErhebung(patientId, zustand, vonName);
  melden();
}

function setzeErhebung(patientId: string, zustand: AllergieErhebungZustand, vonName: string): void {
  const neu: AllergieErhebung = {
    patientId, allergieErhebung: zustand,
    allergieErhebungAm: GEGENWART_ISO, allergieErhebungVonName: vonName,
  };
  erhebungen = erhebungen.some(e => e.patientId === patientId)
    ? erhebungen.map(e => (e.patientId === patientId ? neu : e))
    : [...erhebungen, neu];
}
