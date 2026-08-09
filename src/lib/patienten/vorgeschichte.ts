/**
 * Vorgeschichte — stationärer Verlauf und frühere Behandlungen.
 *
 * Der stationäre Verlauf stand bisher in der Anamnese. Er gehört nicht dahin:
 * die Anamnese ist eine Erhebung zum Zeitpunkt der Aufnahme, ein
 * Spitalaufenthalt ist ein Ereignis der Vorgeschichte. Beides in einer Karte
 * liess den Verlauf wie einen Teil der Befragung aussehen.
 *
 * Die Einträge sind unverändert aus der Anamnese übernommen — keine erfundene
 * Vorgeschichte. Nur Herr Steiner trägt welche; bei den übrigen Patienten war
 * dort nichts erfasst, und die Ansicht sagt das.
 *
 * Der Bestand liegt hinter useSyncExternalStore, weil die Vorgeschichte
 * erfassbar ist: sie stand vorher als Konstante im Seitencode und liess sich
 * nicht je Patient schreiben.
 *
 * LÖSCHEN IST NICHT VORGESEHEN. Ein Eintrag, der falsch ist, wird korrigiert
 * — in einer Vorgeschichte ist das Verschwinden eines Aufenthalts selbst eine
 * Aussage, und zwar eine falsche.
 */
import { useSyncExternalStore } from "react";

export interface Spitalaufenthalt {
  id: string;
  einrichtung: string;
  grund: string;
  /** TT.MM.JJJJ */
  von: string;
  bis: string;
  tage: number;
}

export interface FruehererEingriff {
  id: string;
  eingriff: string;
  datum: string;
}

const STATIONAERER_SEED: Record<string, Spitalaufenthalt[]> = {
  "P-2026-0041": [
    { id: "s1", einrichtung: "Kantonsspital Winterthur", grund: "Sturz — Oberschenkelprellung", von: "12.01.2026", bis: "15.01.2026", tage: 3 },
    { id: "s2", einrichtung: "Universitätsspital Zürich", grund: "Diabetes-Einstellung", von: "28.11.2025", bis: "02.12.2025", tage: 4 },
  ],
};

const EINGRIFFE_SEED: Record<string, FruehererEingriff[]> = {
  "P-2026-0041": [
    { id: "o1", eingriff: "Hüft-TEP links", datum: "14.03.2019" },
    { id: "o2", eingriff: "Appendektomie", datum: "08.06.1985" },
  ],
};

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let aufenthalte: Record<string, Spitalaufenthalt[]> = STATIONAERER_SEED;
let eingriffe: Record<string, FruehererEingriff[]> = EINGRIFFE_SEED;
const hoerer = new Set<() => void>();

function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const aSchnappschuss = () => aufenthalte;
const eSchnappschuss = () => eingriffe;

export function useVorgeschichte(patientId: string): {
  aufenthalte: Spitalaufenthalt[]; eingriffe: FruehererEingriff[];
} {
  const a = useSyncExternalStore(subscribe, aSchnappschuss, aSchnappschuss);
  const e = useSyncExternalStore(subscribe, eSchnappschuss, eSchnappschuss);
  return { aufenthalte: a[patientId] ?? [], eingriffe: e[patientId] ?? [] };
}

/** Ganze Tage zwischen zwei Anzeigedaten, Ende eingeschlossen. */
export function tageZwischen(von: string, bis: string): number {
  const p = (w: string) => {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(w.trim());
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
  };
  const a = p(von), b = p(bis);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

let zaehler = 100;

/** Aufenthalt anlegen oder ändern; leere Kennung legt an. */
export function aufenthaltSichern(patientId: string, eintrag: Omit<Spitalaufenthalt, "tage">): void {
  const mitTagen = { ...eintrag, tage: tageZwischen(eintrag.von, eintrag.bis) };
  const bisher = aufenthalte[patientId] ?? [];
  const neu = bisher.some(x => x.id === eintrag.id)
    ? bisher.map(x => (x.id === eintrag.id ? mitTagen : x))
    : [...bisher, { ...mitTagen, id: mitTagen.id || `SA-${++zaehler}` }];
  aufenthalte = { ...aufenthalte, [patientId]: neu };
  melden();
}

/** Eingriff anlegen oder ändern; leere Kennung legt an. */
export function eingriffSichern(patientId: string, eintrag: FruehererEingriff): void {
  const bisher = eingriffe[patientId] ?? [];
  const neu = bisher.some(x => x.id === eintrag.id)
    ? bisher.map(x => (x.id === eintrag.id ? eintrag : x))
    : [...bisher, { ...eintrag, id: eintrag.id || `FB-${++zaehler}` }];
  eingriffe = { ...eingriffe, [patientId]: neu };
  melden();
}
