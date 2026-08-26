/**
 * Medikationsbestand — Sitzungsdauer, kein Speicher darüber hinaus.
 *
 * Gebaut nach dem Vorbild von lib/kontakte/store.ts. Der Startbestand ist
 * LEER: bei keinem der zehn Patienten ist heute eine Medikation oder eine
 * Unverträglichkeit erfasst, und der Prototyp hat keine Quelle, aus der er
 * eine ableiten könnte. Eine zu erfinden hiesse, eine Verordnung zu
 * behaupten, die keine Ärztin ausgestellt hat.
 *
 * Der einzige Startbestand dieses Laufs ist der Arzneimittelkatalog — und der
 * ist ausdrücklich als Platzhalter gekennzeichnet.
 */
import { useSyncExternalStore } from "react";
import type { Medikation, Unvertraeglichkeit } from "./medikation";
import { GEGENWART } from "../gegenwart";

interface Bestand {
  medikationen: Medikation[];
  unvertraeglichkeiten: Unvertraeglichkeit[];
  /** Patientenkennung → Kommentar zum ganzen Plan. */
  plankommentare: Record<string, string>;
}

/**
 * Startbestand der Unverträglichkeiten — zwei Einträge, keine erfundenen.
 *
 * Sie standen bis hierher als fester Zustand in der Anamnese-Ansicht und
 * erschienen dort bei JEDEM Patienten. Zugeordnet sind sie jetzt Herrn
 * Steiner: sein Onboarding-Fall führt „allergien: Penicillin"
 * (demoSteinerFall.ts), und der Anamnesetext, der beide nannte, war seiner.
 *
 * OHNE SCHWERE. Die bisherigen Einstufungen „Schwer" und „Mittel" standen im
 * Anzeigecode, nicht in einer Erhebung — sie zu übernehmen hiesse, eine
 * Einstufung zu behaupten, die niemand vorgenommen hat.
 */
let bestand: Bestand = {
  medikationen: [],
  unvertraeglichkeiten: [
    { id: "UV-2026-0001", patientId: "P-2026-0041", substanz: "Penicillin", art: "allergie",
      reaktion: "Anaphylaxie", schwere: "", erfasstAm: "", erfasstDurch: "" },
    { id: "UV-2026-0002", patientId: "P-2026-0041", substanz: "Latex", art: "allergie",
      reaktion: "Hautausschlag", schwere: "", erfasstAm: "", erfasstDurch: "" },
  ],
  plankommentare: {},
};

const listeners = new Set<() => void>();

function setzeBestand(neu: Bestand): void {
  bestand = neu;
  listeners.forEach(l => l());
}

function abonnieren(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMedikationsbestand(): Bestand {
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
export function medikationSichern(eingabe: Medikation): Medikation {
  if (eingabe.id) {
    setzeBestand({ ...bestand, medikationen: bestand.medikationen.map(m => (m.id === eingabe.id ? eingabe : m)) });
    return eingabe;
  }
  const neu = { ...eingabe, id: naechsteKennung("MD", bestand.medikationen) };
  setzeBestand({ ...bestand, medikationen: [...bestand.medikationen, neu] });
  return neu;
}

/**
 * Absetzen — nicht löschen.
 *
 * Eine abgesetzte Medikation ist Teil der Geschichte: sie erklärt, weshalb
 * ein Wert sich geändert hat und was der Patient vorher bekam. Es gibt darum
 * keine Löschfunktion für Medikationen, auch nicht für abgesetzte.
 */
export function medikationAbsetzen(id: string, datum: string): void {
  setzeBestand({
    ...bestand,
    medikationen: bestand.medikationen.map(m => (m.id === id ? { ...m, abgesetztAm: datum } : m)),
  });
}

export function unvertraeglichkeitSichern(eingabe: Unvertraeglichkeit): Unvertraeglichkeit {
  if (eingabe.id) {
    setzeBestand({
      ...bestand,
      unvertraeglichkeiten: bestand.unvertraeglichkeiten.map(u => (u.id === eingabe.id ? eingabe : u)),
    });
    return eingabe;
  }
  const neu = { ...eingabe, id: naechsteKennung("UV", bestand.unvertraeglichkeiten) };
  setzeBestand({ ...bestand, unvertraeglichkeiten: [...bestand.unvertraeglichkeiten, neu] });
  return neu;
}

/**
 * Der Kommentar zum ganzen Plan — Schluckbeschwerden, Sturzgefahr,
 * antikoaguliert. Er liegt hier und nicht an den Patientenstammdaten, weil er
 * zum Plan gehört und mit ihm gelesen wird.
 */
export function plankommentarSichern(patientId: string, text: string): void {
  setzeBestand({ ...bestand, plankommentare: { ...bestand.plankommentare, [patientId]: text } });
}
