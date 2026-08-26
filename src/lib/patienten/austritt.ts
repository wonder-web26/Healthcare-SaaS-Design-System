/**
 * Der Austritt als Lesewert.
 *
 * Der Grundsatz, dem alle Ansichten folgen: **Vergangenes bleibt sichtbar,
 * Künftiges entfällt.** Ein Monat, in dem gepflegt wurde, ist abzuschliessen
 * und abzurechnen — auch nach dem Austritt. Was aufhört, sind Aufforderungen
 * zu Handlungen, die niemand mehr ausführen wird.
 *
 * Diese Datei enthält nur reine Funktionen, damit auch die rechnenden Module
 * (Lagebild, Prüfbereitschaft) den Austritt kennen können, ohne den
 * Patientenbestand zu laden.
 */
import { anzeigeZuIso } from "../datum";
import { entlassungNachLabel, ENTLASSUNG_SONSTIGES } from "../stammdaten/entlassung";

export interface Austritt {
  /** TT.MM.JJJJ. */
  datum: string;
  /** Lebensumstände danach, bereits als Text. */
  ziel: string;
}

/** Felder, aus denen sich ein Austritt lesen lässt — nicht der ganze Patient. */
export interface AustrittQuelle {
  status: string;
  austrittDatum: string;
  austrittNach: string;
  austrittNachAndere: string;
}

/**
 * Der Austritt einer Person, oder null.
 *
 * Massgebend ist der Zustand, nicht das Datumsfeld: nur wer ausgetreten ist,
 * hat einen Austritt. Ein Datum ohne Zustand wäre ein halber Vorgang.
 */
export function austrittVon(p: AustrittQuelle): Austritt | null {
  if (p.status !== "ausgetreten" || !p.austrittDatum) return null;
  const ziel = p.austrittNach === ENTLASSUNG_SONSTIGES && p.austrittNachAndere
    ? p.austrittNachAndere
    : entlassungNachLabel(p.austrittNach);
  return { datum: p.austrittDatum, ziel };
}

/** „ausgetreten am 28.02.2026 nach Alters- und Pflegeheim" */
export function austrittText(a: Austritt): string {
  return a.ziel ? `ausgetreten am ${a.datum} nach ${a.ziel}` : `ausgetreten am ${a.datum}`;
}

/**
 * Liegt ein Monat vollständig nach dem Austritt?
 *
 * Der Austrittsmonat selbst zählt NICHT dazu: an seinen Tagen wurde bis zum
 * Austritt gepflegt, er ist abzuschliessen wie jeder andere.
 */
export function monatNachAustritt(a: Austritt, jahr: number, monat: number): boolean {
  const iso = anzeigeZuIso(a.datum);
  if (!iso) return false;
  const austrittsMonat = iso.slice(0, 7);              // JJJJ-MM
  const dieser = `${jahr}-${String(monat + 1).padStart(2, "0")}`;
  return dieser > austrittsMonat;
}

/**
 * Jahr und Monat des Austritts.
 *
 * Der Zeitraum einer Prüfung endet dort und nicht im Kalender danach: eine
 * Kassenkontrolle prüft, was abgerechnet wurde, und abgerechnet wurde bis
 * zum Austritt.
 */
export function austrittsMonat(a: Austritt): { jahr: number; monat: number } | null {
  const iso = anzeigeZuIso(a.datum);
  if (!iso) return null;
  return { jahr: Number(iso.slice(0, 4)), monat: Number(iso.slice(5, 7)) - 1 };
}
