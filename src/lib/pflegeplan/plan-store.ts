/**
 * Der entstehende Pflegeplan — UI-Anbindung des Vertrags (Lauf 2).
 *
 * Modul-State für die Aufbau-Ansicht: Diagnosen, Ziele je Diagnose,
 * Massnahmen mit ihren Zielbezügen, Verwerfungen mit Grund. Sitzungsdauer,
 * keine Persistenz — wie im Repo üblich (Muster: lib/vitalzeichen/store.ts).
 *
 * Zwei Grundsätze aus dem Lauf:
 * - EINE Massnahme, n Zielbezüge. Eine Leistung wird einmal erbracht und
 *   einmal verrechnet — zwei Einträge wären ein Fehler mit Geldfolge.
 * - Wird ein Ziel entfernt, verlieren seine Massnahmen nur den Bezug und
 *   fallen in «Ohne Zuordnung». Das ist ein Arbeitszustand, kein Fehler.
 */
import { useSyncExternalStore } from "react";
import type { DiagnoseCode, DiagnoseTyp, InterventionId, ZielId } from "./vertrag";

export interface PlanDiagnose {
  code: DiagnoseCode;
  titel: string;
  typ: DiagnoseTyp;
  /** Belegzeile aus dem Vorschlag — bleibt nach der Übernahme am Element. */
  belegZeile: string;
}

export interface PlanZiel {
  /** Katalog-Zielkennung — oder eigene Kennung bei selbst formulierten Zielen. */
  zielId: ZielId;
  diagnoseCode: DiagnoseCode;
  titel: string;
  /** Selbst formuliert statt aus der hergeleiteten Liste übernommen. */
  eigenes: boolean;
}

/** Ein Zielbezug einer Massnahme: unter welcher Diagnose, zu welchem Ziel. */
export interface ZielBezug {
  diagnoseCode: DiagnoseCode;
  zielId: ZielId;
}

export interface PlanMassnahme {
  interventionId: InterventionId;
  titel: string;
  /** Leer = «Ohne Zuordnung» (Arbeitszustand). Reihenfolge = Verknüpfungsreihenfolge:
   *  der erste Bezug trägt Position und Zeit, weitere sagen «bereits gezählt». */
  zielBezuege: ZielBezug[];
}

export type VerwerfGrund =
  | "Nicht zutreffend"
  | "Wird anderweitig abgedeckt"
  | "Bereits im Plan enthalten"
  | "Klientin lehnt ab";

export interface Verwerfung {
  code: DiagnoseCode;
  grund: VerwerfGrund;
  person: string;
  /** ISO-Datum. */
  datum: string;
}

export interface PlanZustand {
  diagnosen: PlanDiagnose[];
  ziele: PlanZiel[];
  massnahmen: PlanMassnahme[];
  verwerfungen: Verwerfung[];
}

let zustand: PlanZustand = { diagnosen: [], ziele: [], massnahmen: [], verwerfungen: [] };

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const schnappschuss = () => zustand;

export function usePlan(): PlanZustand {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

/* ── Diagnosen ─────────────────────────────────────────────────────────── */

export function diagnoseUebernehmen(d: PlanDiagnose): void {
  if (zustand.diagnosen.some(x => x.code === d.code)) return;
  zustand = { ...zustand, diagnosen: [...zustand.diagnosen, d] };
  melden();
}

/* ── Verwerfen mit Grund ───────────────────────────────────────────────── */

export function diagnoseVerwerfen(code: DiagnoseCode, grund: VerwerfGrund, person: string, datum: string): void {
  if (zustand.verwerfungen.some(v => v.code === code)) return;
  zustand = { ...zustand, verwerfungen: [...zustand.verwerfungen, { code, grund, person, datum }] };
  melden();
}

export function verwerfungZuruecknehmen(code: DiagnoseCode): void {
  zustand = { ...zustand, verwerfungen: zustand.verwerfungen.filter(v => v.code !== code) };
  melden();
}

/* ── Ziele ─────────────────────────────────────────────────────────────── */

export function zielUebernehmen(z: PlanZiel): void {
  if (zustand.ziele.some(x => x.diagnoseCode === z.diagnoseCode && x.zielId === z.zielId)) return;
  zustand = { ...zustand, ziele: [...zustand.ziele, z] };
  melden();
}

/**
 * Ziel entfernen. Massnahmen verlieren nur diesen Bezug — eine Massnahme
 * ohne verbleibenden Bezug fällt in «Ohne Zuordnung», statt stillschweigend
 * zu verschwinden.
 */
export function zielEntfernen(diagnoseCode: DiagnoseCode, zielId: ZielId): void {
  zustand = {
    ...zustand,
    ziele: zustand.ziele.filter(z => !(z.diagnoseCode === diagnoseCode && z.zielId === zielId)),
    massnahmen: zustand.massnahmen.map(m => ({
      ...m,
      zielBezuege: m.zielBezuege.filter(b => !(b.diagnoseCode === diagnoseCode && b.zielId === zielId)),
    })),
  };
  melden();
}

let eigeneZielNummer = 0;

/** Selbst formuliertes Ziel — für Diagnosen ohne hinterlegte Ziele. */
export function eigenesZielHinzufuegen(diagnoseCode: DiagnoseCode, titel: string): void {
  eigeneZielNummer += 1;
  zustand = {
    ...zustand,
    ziele: [...zustand.ziele, { zielId: `Z-EIGEN-${eigeneZielNummer}`, diagnoseCode, titel, eigenes: true }],
  };
  melden();
}

/* ── Massnahmen ────────────────────────────────────────────────────────── */

/**
 * Massnahme übernehmen oder mit einem weiteren Ziel verknüpfen — dieselbe
 * Funktion, damit dieselbe Intervention nie zweimal im Plan landet.
 */
export function massnahmeVerknuepfen(interventionId: InterventionId, titel: string, bezug: ZielBezug): void {
  const bestehend = zustand.massnahmen.find(m => m.interventionId === interventionId);
  if (bestehend) {
    if (bestehend.zielBezuege.some(b => b.diagnoseCode === bezug.diagnoseCode && b.zielId === bezug.zielId)) return;
    zustand = {
      ...zustand,
      massnahmen: zustand.massnahmen.map(m => m.interventionId === interventionId
        ? { ...m, zielBezuege: [...m.zielBezuege, bezug] }
        : m),
    };
  } else {
    zustand = { ...zustand, massnahmen: [...zustand.massnahmen, { interventionId, titel, zielBezuege: [bezug] }] };
  }
  melden();
}

/** Einen Zielbezug lösen; ohne verbleibenden Bezug bleibt die Massnahme in «Ohne Zuordnung». */
export function massnahmenBezugLoesen(interventionId: InterventionId, bezug: ZielBezug): void {
  zustand = {
    ...zustand,
    massnahmen: zustand.massnahmen.map(m => m.interventionId === interventionId
      ? { ...m, zielBezuege: m.zielBezuege.filter(b => !(b.diagnoseCode === bezug.diagnoseCode && b.zielId === bezug.zielId)) }
      : m),
  };
  melden();
}

/** Nur für Tests/Neustart der Demo. */
export function planZuruecksetzen(): void {
  zustand = { diagnosen: [], ziele: [], massnahmen: [], verwerfungen: [] };
  melden();
}
