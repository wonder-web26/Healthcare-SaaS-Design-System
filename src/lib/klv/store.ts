/**
 * KLV-Bestand — eine Quelle für alle Oberflächen, Sitzungsdauer.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts. Vorher hielt jede
 * Oberfläche eine eigene Kopie der Leistungspositionen: der Arbeitsbereich und
 * der KLV-Reiter des Onboardings kopierten sie in lokalen Zustand und warfen
 * jede Änderung beim Verlassen weg, das Dossier mutierte das Modul-Array
 * unmittelbar. Drei Wahrheiten für dieselbe Sache.
 *
 * Von aussen wird nicht mehr in innere Strukturen gegriffen. Wer etwas ändern
 * will, ruft einen benannten Schreibweg — nur so lässt sich die Sperre an
 * einer Stelle durchsetzen statt an dreien.
 *
 * Kein Speicher über die Sitzung hinaus; der Prototyp hat keine Persistenz.
 */
import { useSyncExternalStore } from "react";
import { MOCK_KLV_VERORDNUNGEN } from "../mocks/klinische-artefakte-mock";
import { onboardingFaelle } from "../onboarding/faelle";
import type { KLVVerordnung, KLVLeistung, KLVStatus, KLVDiagnose } from "../../types/klinische-artefakte";

/* ── Patientenkennung auflösen ─────────────────────────────────────────────── */

/**
 * Jede Verordnung trägt eine Patientenkennung. Fehlt sie, wird sie über den
 * Onboarding-Fall aufgelöst; `onboardingId` bleibt als Herkunftsangabe stehen.
 * Findet sich kein Fall, bleibt die Kennung leer — sie wird nicht geraten.
 */
function mitPatientKennung(v: KLVVerordnung): KLVVerordnung {
  if (v.patientId) return v;
  const fall = onboardingFaelle.find(f => f.id === v.onboardingId);
  return fall ? { ...v, patientId: fall.patientId } : v;
}

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let bestand: KLVVerordnung[] = MOCK_KLV_VERORDNUNGEN.map(mitPatientKennung);
const hoerer = new Set<() => void>();

function setzeBestand(neu: KLVVerordnung[]): void {
  bestand = neu;
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

function schnappschuss(): KLVVerordnung[] {
  return bestand;
}

/* ── Die Sperre ────────────────────────────────────────────────────────────── */

/**
 * Gesperrte Verordnungen werden nicht mehr geändert; wer etwas ändern will,
 * legt eine neue Version an.
 *
 * Heute ist keine gesperrt. Der Zustand, der die Sperre auslöst, entsteht erst
 * mit dem Statusverlauf des Leistungsplanungsblatts (ab „an Kasse"). Die
 * Prüfung steht trotzdem schon hier und in JEDEM Schreibweg — sie an einer
 * Stelle einzuschalten ist dann eine Zeile, sie nachträglich in fünf Aufrufe
 * einzuflechten wäre die Gelegenheit, eine zu vergessen.
 */
export function istGesperrt(_v: KLVVerordnung): boolean {
  return false;
}

/** Verordnung samt Sperrprüfung holen; null heisst „nicht schreiben". */
function schreibbar(id: string): KLVVerordnung | null {
  const v = bestand.find(k => k.id === id);
  if (!v || istGesperrt(v)) return null;
  return v;
}

/* ── Lesen ─────────────────────────────────────────────────────────────────── */

export function useKlvVerordnungen(): KLVVerordnung[] {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

export function getKlvVerordnungen(): KLVVerordnung[] {
  return bestand;
}

export function getKlvVerordnung(id: string): KLVVerordnung | undefined {
  return bestand.find(k => k.id === id);
}

/** Verordnungen eines Patienten — der Weg, den das Dossier nimmt. */
export function getKlvFuerPatient(patientId: string): KLVVerordnung[] {
  return bestand.filter(k => k.patientId === patientId);
}

/** Verordnung eines Onboarding-Falls — der Weg, den der Erfassungsschritt nimmt. */
export function getKlvFuerOnboarding(onboardingId: string): KLVVerordnung | undefined {
  return bestand.find(k => k.onboardingId === onboardingId);
}

/* ── Schreiben ─────────────────────────────────────────────────────────────── */

/** Position anfügen. */
export function positionHinzufuegen(klvId: string, position: KLVLeistung): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, leistungspositionen: [...k.leistungspositionen, position] }
    : k));
}

/** Einzelne Felder einer Position ändern; alles Übrige bleibt. */
export function positionAendern(klvId: string, positionId: string, patch: Partial<KLVLeistung>): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, leistungspositionen: k.leistungspositionen.map(p => p.id === positionId ? { ...p, ...patch } : p) }
    : k));
}

/** Position entfernen. */
export function positionEntfernen(klvId: string, positionId: string): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, leistungspositionen: k.leistungspositionen.filter(p => p.id !== positionId) }
    : k));
}

/** Mehrere Positionen in einem Zug setzen — für Umrechnungen über die ganze Liste. */
export function positionenSetzen(klvId: string, positionen: KLVLeistung[]): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId ? { ...k, leistungspositionen: positionen } : k));
}

/** Diagnosen der Verordnung setzen. */
export function diagnosenSetzen(klvId: string, diagnosen: KLVDiagnose[]): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId ? { ...k, diagnosen } : k));
}

/** Kopffelder der Verordnung ändern (Gültigkeit, Ziele, Verantwortliche). */
export function verordnungAendern(
  klvId: string,
  felder: Partial<Omit<KLVVerordnung, "id" | "leistungspositionen" | "status">>,
): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => (k.id === klvId ? { ...k, ...felder } : k)));
}

/** Statuswechsel. */
export function statusWechseln(klvId: string, status: KLVStatus): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => (k.id === klvId ? { ...k, status } : k)));
}

/** Neue Verordnung anlegen. */
export function verordnungAnlegen(v: KLVVerordnung): void {
  setzeBestand([...bestand, mitPatientKennung(v)]);
}

/** Verordnung entfernen — im Bestand nur für Entwürfe vorgesehen. */
export function verordnungEntfernen(klvId: string): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.filter(k => k.id !== klvId));
}
