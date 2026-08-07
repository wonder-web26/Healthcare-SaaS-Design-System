/**
 * Bestand der Monatsabschlüsse — Sitzungsdauer.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts: Modulzustand hinter
 * useSyncExternalStore, benannte Schreibwege, keine Zugriffe auf innere
 * Strukturen von aussen.
 *
 * `istMonatAbgeschlossen` ist die Sperre, die jeder Schreibweg an Einsätzen,
 * erbrachten Leistungen und Berichten zuerst befragt — nach dem Muster der
 * Sperre am Leistungsplanungsblatt. Sie greift damit auch in Oberflächen, die
 * nichts vom Abschluss wissen; eine Prüfung allein im Bildschirm liesse jeden
 * anderen Weg offen.
 *
 * Der Startbestand ist leer: kein Monat ist abgeschlossen. Ein vorbelegter
 * Abschluss verstellte den Blick auf genau den Ablauf, um den es hier geht.
 */
import { useSyncExternalStore } from "react";
import type { Monatsabschluss } from "./abschluss";

let bestand: Monatsabschluss[] = [];
const hoerer = new Set<() => void>();

function setzeBestand(neu: Monatsabschluss[]): void {
  bestand = neu;
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

const schnappschuss = () => bestand;

export function useAbschluesse(): Monatsabschluss[] {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

export function getAbschluss(patientId: string, jahr: number, monat: number): Monatsabschluss | null {
  return bestand.find(a => a.patientId === patientId && a.jahr === jahr && a.monat === monat) ?? null;
}

/**
 * Die Sperre. Nimmt ein Anzeigedatum (TT.MM.JJJJ), weil die Schreibwege an
 * Einsätzen genau das zur Hand haben — sie kennen Jahr und Monat nicht
 * getrennt, und eine Umrechnung an jeder Aufrufstelle liefe irgendwann
 * auseinander.
 */
export function istMonatAbgeschlossen(patientId: string, datum: string): boolean {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((datum ?? "").trim());
  if (!m) return false;
  return getAbschluss(patientId, Number(m[3]), Number(m[2]) - 1) !== null;
}

/* ── Schreiben ─────────────────────────────────────────────────────────────── */

/**
 * Monat abschliessen. Ob er abschlussreif ist, entscheidet die Aufrufstelle
 * mit `abschlussLage` — der Bestand hält fest, was beschlossen wurde, und
 * urteilt nicht über die Fachlage.
 */
export function monatAbschliessen(patientId: string, jahr: number, monat: number, person: string, zeitpunkt: string): void {
  if (getAbschluss(patientId, jahr, monat)) return;
  setzeBestand([...bestand, { patientId, jahr, monat, person, zeitpunkt, oeffnungen: [] }]);
}

/**
 * Monat wieder öffnen.
 *
 * SETZUNG: Ein Abschluss ist umkehrbar. Ohne Rückweg wäre ein Fehlklick nicht
 * zu korrigieren, und der einzige Ausweg wäre, die Zahlen daneben von Hand zu
 * berichtigen — schlimmer als eine protokollierte Öffnung. Ob das fachlich
 * zulässig bleibt, sobald die Rechnung tatsächlich beim Versicherer liegt,
 * ist zu klären: ab dann ist die Korrektur ein Storno und keine Öffnung.
 *
 * Der Grund ist Pflicht. Eine Öffnung ohne Begründung liesse bei einer
 * Kontrolle nicht mehr erkennen, ob korrigiert oder nachgebessert wurde.
 */
export function monatWiederOeffnen(patientId: string, jahr: number, monat: number, grund: string, person: string, zeitpunkt: string): boolean {
  const a = getAbschluss(patientId, jahr, monat);
  if (!a || !grund.trim()) return false;
  const oeffnung = { grund: grund.trim(), person, zeitpunkt };
  /* Die Vorgeschichte bleibt am Patienten und Monat hängen, nicht am
     Abschluss-Objekt — das verschwindet ja gerade. */
  verlauf = [...verlauf, { patientId, jahr, monat, ...oeffnung, geschlossenAm: a.zeitpunkt, geschlossenDurch: a.person }];
  setzeBestand(bestand.filter(x => x !== a));
  return true;
}

/* ── Protokoll der Öffnungen ───────────────────────────────────────────────── */

export interface OeffnungsEintrag {
  patientId: string;
  jahr: number;
  monat: number;
  grund: string;
  person: string;
  zeitpunkt: string;
  /** Wann und durch wen der geöffnete Abschluss gesetzt worden war. */
  geschlossenAm: string;
  geschlossenDurch: string;
}

let verlauf: OeffnungsEintrag[] = [];

export function getOeffnungen(patientId: string, jahr: number, monat: number): OeffnungsEintrag[] {
  return verlauf.filter(o => o.patientId === patientId && o.jahr === jahr && o.monat === monat);
}
