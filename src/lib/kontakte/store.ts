/**
 * Kontaktbestand — Sitzungsdauer, kein Speicher darüber hinaus.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts. Der Startbestand ist
 * LEER: bei keinem der zehn Patienten ist heute ein Hausarzt, ein Beistand
 * oder eine Kontaktperson eines Sozialdiensts erfasst. Einen Kontakt zu
 * erfinden, nur damit die Liste nicht leer ist, hiesse Daten zu behaupten.
 */
import { useSyncExternalStore } from "react";
import type { Kontakt } from "./kontakte";
import { GEGENWART } from "../gegenwart";

let bestand: Kontakt[] = [];

const listeners = new Set<() => void>();

function setzeBestand(neu: Kontakt[]): void {
  bestand = neu;
  listeners.forEach(l => l());
}

function abonnieren(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useKontakte(): Kontakt[] {
  return useSyncExternalStore(abonnieren, () => bestand, () => bestand);
}

export function getKontakte(): Kontakt[] {
  return bestand;
}

export function getKontakt(id: string): Kontakt | undefined {
  return bestand.find(k => k.id === id);
}

/** K-JJJJ-NNNN, fortlaufend innerhalb der Sitzung. */
function naechsteKennung(): string {
  const jahr = GEGENWART.getFullYear();
  const hoechste = bestand.reduce((max, k) => {
    const m = new RegExp(`^K-${jahr}-(\\d+)$`).exec(k.id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `K-${jahr}-${String(hoechste + 1).padStart(4, "0")}`;
}

/** Anlegen bei leerer Kennung, sonst ändern. Gibt den gesicherten Kontakt zurück. */
export function kontaktSichern(eingabe: Omit<Kontakt, "id"> & { id: string }): Kontakt {
  if (eingabe.id) {
    const geaendert = { ...eingabe } as Kontakt;
    setzeBestand(bestand.map(k => (k.id === eingabe.id ? geaendert : k)));
    return geaendert;
  }
  const neu: Kontakt = { ...eingabe, id: naechsteKennung() };
  setzeBestand([...bestand, neu]);
  return neu;
}

/**
 * Löschen — nur ohne Verknüpfung.
 *
 * Ein verknüpfter Kontakt liesse eine Beziehung auf eine Kennung zeigen, die
 * es nicht mehr gibt; im Dossier stünde dann eine Zeile ohne Namen. Die Zahl
 * der Verknüpfungen kommt von aussen, damit dieser Bestand den der
 * Beziehungen nicht kennen muss.
 */
export function kontaktLoeschen(id: string, verknuepfungen: number): boolean {
  if (verknuepfungen > 0) return false;
  setzeBestand(bestand.filter(k => k.id !== id));
  return true;
}
