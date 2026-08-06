/**
 * Mandatsbestand — Sitzungsdauer, kein Speicher darüber hinaus.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts. Alle Ansichten lesen von
 * hier; Änderungen an einem Mandat sind sofort überall sichtbar.
 *
 * Der Startbestand ist aus den bestehenden Patientenangaben ABGELEITET —
 * Krankenkasse, Aufnahmedatum, Kanton und zuständige Pflegefachkraft stehen
 * bereits am Patienten. Es wird keine Person erfunden und kein Patientenwert
 * geändert.
 */
import { useSyncExternalStore } from "react";
import { patientenSeed } from "../../app/components/patientData";
import { KRANKENKASSEN } from "../stammdaten/krankenkassen";
import { angehoerigeSeed } from "../../app/components/angehoerigeData";
import type { Mandat } from "./mandate";

/** Stichtag der Mock-Demo — dieselbe Vorgabe wie in den Listen. */
export const MANDAT_STICHTAG = new Date(2026, 6, 31); // 31.07.2026

/**
 * Anzeigename der Kasse am Patienten → Schlüssel der Werteliste. Gespeichert
 * wird der Schlüssel; findet sich keiner, bleibt das Feld leer statt geraten.
 */
function versichererSchluessel(anzeigename: string): string {
  const n = anzeigename.trim().toLowerCase();
  return KRANKENKASSEN.find(k => k.label.toLowerCase() === n)?.value
    ?? KRANKENKASSEN.find(k => k.label.toLowerCase().startsWith(n))?.value
    ?? "";
}

/** Policennummer aus der bereits erfassten Kartennummer — kein neuer Wert. */
function ausKartennummer(kartennummer: string): string {
  return kartennummer.trim();
}

const abgeleiteteMandate: Mandat[] = patientenSeed.map((p, i) => ({
  id: `MAN-2026-${String(1001 + i)}`,
  patientId: p.id,
  mandatsart: "versichert",
  gesetzesgrundlage: "kvg_pflege",
  grund: "krankheit",
  versicherer: versichererSchluessel(p.krankenkasse),
  policennummer: ausKartennummer(p.kartennummer),
  fallnummerKasse: "",
  beginn: p.aufnahmeDatum,
  ende: "",
  zustaendigePerson: p.pflegefachkraft,
  abgerechneteAngehoerige: abgerechneteAngehoerigeZu(p.id, p.angehoeriger),
}));

/**
 * Abgerechnete angehörige Person aus den bestehenden Angaben.
 *
 * Mehrere Personen können mit demselben Patienten verknüpft sein — die erste
 * zu nehmen wäre willkürlich. Massgebend ist deshalb die am Patienten bereits
 * erfasste Bezugsperson; sie muss zusätzlich verknüpft sein. Passt keine,
 * bleibt das Feld leer statt geraten.
 */
function abgerechneteAngehoerigeZu(patientId: string, angehoerigerText: string): string {
  const name = angehoerigerText.split(" (")[0].trim().toLowerCase();
  if (!name) return "";
  const treffer = angehoerigeSeed.find(a =>
    `${a.vorname} ${a.nachname}`.trim().toLowerCase() === name
    && a.zugeordnetePatientenList.some(z => z.id === patientId));
  return treffer?.id ?? "";
}

/**
 * Ein beendetes Privatmandat für Anna Bösiger — damit die dritte Karte einen
 * Fall hat. (Die Vorgabe nennt „Anna Müller"; in der Patientenliste heisst die
 * einzige Anna Bösiger, und es wird keine Person erfunden.)
 */
const beendetesPrivatmandat: Mandat = {
  id: "MAN-2025-0912",
  patientId: "P-2026-0047",
  mandatsart: "privat",
  gesetzesgrundlage: "privat",
  grund: "krankheit",
  versicherer: "",
  policennummer: "",
  fallnummerKasse: "",
  beginn: "01.09.2025",
  ende: "31.10.2025",
  zustaendigePerson: "Kathrin Meier",
  abgerechneteAngehoerige: "",
};

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let bestand: Mandat[] = [...abgeleiteteMandate, beendetesPrivatmandat];
const hoerer = new Set<() => void>();

function setzeBestand(neu: Mandat[]): void {
  bestand = neu;
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

function schnappschuss(): Mandat[] {
  return bestand;
}

export function useMandate(): Mandat[] {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

export function getMandate(patientId: string): Mandat[] {
  return bestand.filter(m => m.patientId === patientId);
}

/** Einzelne Felder eines Mandats ändern; alles Übrige bleibt, wie es ist. */
export function aktualisiereMandat(id: string, felder: Partial<Omit<Mandat, "id" | "patientId">>): void {
  setzeBestand(bestand.map(m => (m.id === id ? { ...m, ...felder } : m)));
}

/**
 * Patienten, die mit einer angehörigen Person verknüpft sind — Grundlage für
 * Regel M3. Liest den Angehörigenbestand, legt nichts an.
 */
export function verknuepftePatienten(angehoerigerId: string): string[] {
  return angehoerigeSeed
    .find(a => a.id === angehoerigerId)?.zugeordnetePatientenList.map(z => z.id) ?? [];
}
