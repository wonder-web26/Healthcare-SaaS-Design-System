/**
 * Zustand des Leistungsplanungsblatts (Lauf 7, Teil 1) — Modul-State mit
 * useSyncExternalStore, Sitzungsdauer, keine Persistenz (Muster:
 * pflegeplan/plan-store.ts). Ein Blatt je Klient.
 *
 * B5: Kein Speichern-Knopf — jede Änderung speichert sofort, trägt einen
 * Zeitstempel und ist über den Undo-Stapel rückgängig zu machen.
 */
import { useSyncExternalStore } from "react";
import { KEIN_ABZUG, type Abzug } from "./rechenkern";
import { uebernahmeErstellen, manuellEinfuegen, type LpbPosition } from "./uebernahme";
import { leistungsposition } from "../pflegeplan/mock-adapter";

export type BlattStatus =
  | "entwurf" | "freigegeben" | "gemeldet" | "aktiv"
  | "pausiert" | "abgelaufen" | "ersetzt" | "storniert";

export type AbklaerungsTyp = "ohne" | "erst" | "neu";

export interface BlattKopfdaten {
  abklaerungsTyp: AbklaerungsTyp;
  abklaerungsDatum: string;
  /** Weitere Leistungserbringer als ZSR-Liste (Freitext, kommagetrennt). */
  andereZsr: string;
  bemerkungVerordnung: string;
}

export interface LpbBlatt {
  patientId: string;
  version: number;
  status: BlattStatus;
  /** ISO-Startdatum der Periode. */
  start: string;
  /** Länge der Periode in Monaten. Über 9 → markiert, Freigabe blockiert (B3). */
  monate: number;
  /** B2: true, solange die Monatszahl aus der Schnellwahl stammt. */
  schnellwahl: boolean;
  kopf: BlattKopfdaten;
  /** D6: Abzug für gleichzeitig erbrachte Leistungen, Minuten je Monat. */
  abzug: Abzug;
  positionen: LpbPosition[];
  /** «HH:MM» der letzten Änderung (B5). */
  savedAt: string;
}

interface Ablage {
  blaetter: Map<string, LpbBlatt>;
  undo: Map<string, string[]>;
}

const ablage: Ablage = { blaetter: new Map(), undo: new Map() };
const hoerer = new Set<() => void>();
const melden = () => hoerer.forEach(h => h());

function uhrzeit(): string {
  return new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

/** Ü1: das Blatt entsteht mit der vollständigen Übernahme — nie leer,
 *  solange die Pflegeplanung nicht leer ist. */
function blattErzeugen(patientId: string): LpbBlatt {
  return {
    patientId,
    version: 1,
    status: "entwurf",
    start: "2026-09-01",
    monate: 6,
    schnellwahl: true,
    kopf: { abklaerungsTyp: "erst", abklaerungsDatum: "2026-08-15", andereZsr: "", bemerkungVerordnung: "" },
    abzug: { ...KEIN_ABZUG },
    positionen: uebernahmeErstellen(patientId),
    savedAt: uhrzeit(),
  };
}

export function blattFuer(patientId: string): LpbBlatt {
  let b = ablage.blaetter.get(patientId);
  if (!b) {
    b = blattErzeugen(patientId);
    ablage.blaetter.set(patientId, b);
  }
  return b;
}

export function useLpbBlatt(patientId: string): LpbBlatt {
  return useSyncExternalStore(
    h => { hoerer.add(h); return () => hoerer.delete(h); },
    () => blattFuer(patientId),
  );
}

/* ── Undo (B5) ─────────────────────────────────────────────────────────── */
const UNDO_TIEFE = 20;

function schnappschuss(patientId: string): void {
  const b = blattFuer(patientId);
  const stapel = ablage.undo.get(patientId) ?? [];
  stapel.push(JSON.stringify({ positionen: b.positionen, kopf: b.kopf, abzug: b.abzug, start: b.start, monate: b.monate, schnellwahl: b.schnellwahl }));
  if (stapel.length > UNDO_TIEFE) stapel.shift();
  ablage.undo.set(patientId, stapel);
}

export function undoTiefe(patientId: string): number {
  return (ablage.undo.get(patientId) ?? []).length;
}

export function rueckgaengig(patientId: string): void {
  const stapel = ablage.undo.get(patientId) ?? [];
  const letzter = stapel.pop();
  if (!letzter) return;
  const b = blattFuer(patientId);
  ablage.blaetter.set(patientId, { ...b, ...JSON.parse(letzter), savedAt: uhrzeit() });
  melden();
}

function aendern(patientId: string, patch: (b: LpbBlatt) => Partial<LpbBlatt>): void {
  schnappschuss(patientId);
  const b = blattFuer(patientId);
  ablage.blaetter.set(patientId, { ...b, ...patch(b), savedAt: uhrzeit() });
  melden();
}

/* ── Periode und Kopfdaten (B) ─────────────────────────────────────────── */
export function schnellwahlSetzen(patientId: string, monate: 1 | 3 | 6 | 9): void {
  aendern(patientId, () => ({ monate, schnellwahl: true }));
}

export function startSetzen(patientId: string, startIso: string): void {
  aendern(patientId, () => ({ start: startIso }));
}

/** B2: ein manuelles Enddatum hebt die Schnellwahl auf; gezeigt wird die
 *  tatsächliche Monatszahl (angefangene Monate zählen). */
export function endeSetzen(patientId: string, endeIso: string): void {
  aendern(patientId, b => {
    const a = new Date(b.start), e = new Date(endeIso);
    const monate = Math.max(1, (e.getFullYear() - a.getFullYear()) * 12 + (e.getMonth() - a.getMonth()) + (e.getDate() >= a.getDate() ? 1 : 0));
    return { monate, schnellwahl: false };
  });
}

export function periodenEnde(b: LpbBlatt): string {
  const d = new Date(b.start);
  d.setMonth(d.getMonth() + b.monate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function kopfSetzen(patientId: string, patch: Partial<BlattKopfdaten>): void {
  aendern(patientId, b => ({ kopf: { ...b.kopf, ...patch } }));
}

export function abzugSetzen(patientId: string, patch: Partial<Abzug>): void {
  aendern(patientId, b => ({ abzug: { ...b.abzug, ...patch } }));
}

/* ── Positionen (C) ────────────────────────────────────────────────────── */
export function positionSetzen(patientId: string, id: string, patch: Partial<LpbPosition>): void {
  aendern(patientId, b => ({
    positionen: b.positionen.map(p => p.id === id ? { ...p, ...patch } : p),
  }));
}

/** C12/C13 — einfügen über den einen Knopf im Blattkopf; die Leistungsart
 *  ergibt sich aus dem Katalogeintrag. Liefert die neue Position (das UI
 *  klappt sie auf und verlangt den Grund). */
export function positionEinfuegen(patientId: string, nummer: string): LpbPosition {
  const kat = leistungsposition(nummer);
  const neu = manuellEinfuegen(nummer, null);
  void kat;
  aendern(patientId, b => ({ positionen: [...b.positionen, neu] }));
  return neu;
}

/** C11 — löschen nur bei Herkunft «manuell»; alles andere wird über W
 *  umgewidmet. */
export function positionEntfernen(patientId: string, id: string): void {
  aendern(patientId, b => ({
    positionen: b.positionen.filter(p => !(p.id === id && p.herkunft === "manuell")),
  }));
}

/** Nur für Tests: alles verwerfen. */
export function lpbZuruecksetzen(): void {
  ablage.blaetter.clear();
  ablage.undo.clear();
  melden();
}
