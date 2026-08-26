/**
 * Wundbestand — Sitzungsdauer, kein Speicher darüber hinaus.
 *
 * Gebaut nach dem Vorbild von lib/kontakte/store.ts. Der Startbestand ist
 * LEER: bei keinem der zehn Patienten ist heute eine Wunde dokumentiert, und
 * im Leistungskatalog trägt kein Blatt eine Verbandsposition (10701 bis
 * 10703). Eine Wunde zu erfinden, damit die Ansicht nicht leer ist, hiesse
 * einen Befund zu behaupten, den niemand erhoben hat.
 */
import { useSyncExternalStore } from "react";
import type { Wunde, Wundbeurteilung, Verlaufseintrag } from "./wunden";
import { GEGENWART } from "../gegenwart";

interface Bestand {
  wunden: Wunde[];
  beurteilungen: Wundbeurteilung[];
  verlauf: Verlaufseintrag[];
}

let bestand: Bestand = { wunden: [], beurteilungen: [], verlauf: [] };

const listeners = new Set<() => void>();

function setzeBestand(neu: Bestand): void {
  bestand = neu;
  listeners.forEach(l => l());
}

function abonnieren(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useWundbestand(): Bestand {
  return useSyncExternalStore(abonnieren, () => bestand, () => bestand);
}

function naechsteKennung(praefix: string, vorhanden: { id: string }[]): string {
  const jahr = GEGENWART.getFullYear();
  const hoechste = vorhanden.reduce((max, e) => {
    const m = new RegExp(`^${praefix}-${jahr}-(\\d+)$`).exec(e.id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `${praefix}-${jahr}-${String(hoechste + 1).padStart(4, "0")}`;
}

/** Anlegen bei leerer Kennung, sonst ändern. */
export function wundeSichern(eingabe: Wunde): Wunde {
  if (eingabe.id) {
    setzeBestand({ ...bestand, wunden: bestand.wunden.map(w => (w.id === eingabe.id ? eingabe : w)) });
    return eingabe;
  }
  const neu = { ...eingabe, id: naechsteKennung("WD", bestand.wunden) };
  setzeBestand({ ...bestand, wunden: [...bestand.wunden, neu] });
  return neu;
}

export function beurteilungSichern(eingabe: Wundbeurteilung): Wundbeurteilung {
  if (eingabe.id) {
    setzeBestand({ ...bestand, beurteilungen: bestand.beurteilungen.map(b => (b.id === eingabe.id ? eingabe : b)) });
    return eingabe;
  }
  const neu = { ...eingabe, id: naechsteKennung("WB", bestand.beurteilungen) };
  setzeBestand({ ...bestand, beurteilungen: [...bestand.beurteilungen, neu] });
  return neu;
}

export function verlaufSichern(eingabe: Verlaufseintrag): Verlaufseintrag {
  if (eingabe.id) {
    setzeBestand({ ...bestand, verlauf: bestand.verlauf.map(v => (v.id === eingabe.id ? eingabe : v)) });
    return eingabe;
  }
  const neu = { ...eingabe, id: naechsteKennung("WV", bestand.verlauf) };
  setzeBestand({ ...bestand, verlauf: [...bestand.verlauf, neu] });
  return neu;
}
