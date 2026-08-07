/**
 * KLV-Berechnungslogik — h/Wo., Einmalige, Simultan-Korrektur.
 *
 * Folgt dem KLV-Standard (RAI-Home-Care Suisse Leistungsplanungsblatt).
 */
import type { KLVLeistung, KLVEinheit } from "../../types/klinische-artefakte";
import { klvWerLabel, type KlvWerCode } from "../stammdaten/klv-wer";

/** Tage pro Woche für einheit tN. */
function tageProWoche(einheit: KLVEinheit): number {
  switch (einheit) {
    case "t2": return 2;
    case "t3": return 3;
    case "t4": return 4;
    case "t5": return 5;
    case "t6": return 6;
    case "t7": return 7;
    default: return 0;
  }
}

/** Minuten pro Woche einer Leistung (0 für einmalige/nB). */
export function minProWoche(l: KLVLeistung): number {
  switch (l.einheit) {
    case "w": return l.anzahl * l.zeitMin;
    case "t2": case "t3": case "t4": case "t5": case "t6": case "t7":
      return l.anzahl * tageProWoche(l.einheit) * l.zeitMin;
    case "m": return (l.anzahl * l.zeitMin) / 4.33;
    case "e": return 0;    // einmalig — nicht wöchentlich
    case "nB": return 0;   // nach Bedarf — nicht fest
    default: return 0;
  }
}

/** h/Wo. einer Leistung, gerundet auf 2 Stellen. */
export function hProWoche(l: KLVLeistung): number {
  return Math.round((minProWoche(l) / 60) * 100) / 100;
}

/** Einmalige Minuten einer Leistung (0 wenn nicht einmalig). */
export function einmaligeMin(l: KLVLeistung): number {
  return l.einheit === "e" ? l.anzahl * l.zeitMin : 0;
}

/** Ist die Leistung periodisch (zählt zur Wochensumme)? */
export function istPeriodisch(l: KLVLeistung): boolean {
  return l.einheit !== "e" && l.einheit !== "nB";
}

/* ── Prüfbarkeit: täglich, im Zeitraum, gar nicht ──────────────────────────────
   Die Pflegekontrolle vergleicht Erbrachtes mit Verordnetem. Wogegen sie
   vergleicht, hängt an der Häufigkeit:

   · `t7` ist an jedem Tag verordnet — je Tag prüfbar.
   · `t2`–`t6`, `w` und `m` sind im Zeitraum verordnet, aber das Blatt sagt
     nicht, an welchen Tagen. Nur die Anzahl im Zeitraum ist prüfbar; welcher
     einzelne Tag gefehlt hat, wäre eine Behauptung.
   · `e` (einmalig) und `nB` (nach Bedarf) tragen keine verordnete Menge, gegen
     die sich etwas prüfen liesse. Sie erscheinen in keiner der beiden
     Prüfungen — auch nicht als Null, denn eine Null wäre eine Aussage. */

/** An jedem Tag verordnet — Grundlage des Tagessolls. */
export function istTaeglich(l: KLVLeistung): boolean {
  return l.einheit === "t7";
}

/** Im Zeitraum verordnet, aber ohne Wochentagsplan — nur als Anzahl prüfbar. */
export function istImZeitraum(l: KLVLeistung): boolean {
  return l.einheit === "w" || l.einheit === "m"
    || (l.einheit.startsWith("t") && l.einheit !== "t7");
}

/** Minuten, die an einem Tag verordnet sind — Summe der täglichen Positionen. */
export function tagessollMinuten(positionen: KLVLeistung[]): number {
  return positionen.filter(istTaeglich).reduce((s, l) => s + l.anzahl * l.zeitMin, 0);
}

/**
 * Wie oft eine Position im Monat erwartet wird.
 *
 * Wochenrhythmen werden über die Länge des Monats hochgerechnet, nicht über
 * eine feste Vier — ein Monat hat 4.3 bis 4.4 Wochen, und bei 3×/Woche macht
 * das über den Monat einen ganzen Einsatz Unterschied.
 */
export function erwarteteAnzahlImMonat(l: KLVLeistung, tageImMonat: number): number {
  const wochen = tageImMonat / 7;
  if (l.einheit === "m") return l.anzahl;
  if (l.einheit === "w") return Math.round(l.anzahl * wochen);
  if (l.einheit.startsWith("t")) return Math.round(l.anzahl * tageProWoche(l.einheit) * wochen);
  return 0;
}

/**
 * Verordnete Häufigkeit als ein Ausdruck.
 *
 * `anzahl` und Einheit nebeneinander zu setzen ergibt bei der Regelmenge 1
 * das doppelte „1× 3×/Wo." — die Eins ist dort keine Information, sondern
 * ein Artefakt des Datenmodells.
 */
export function haeufigkeitText(l: KLVLeistung): string {
  return l.anzahl === 1 ? einheitLabel(l.einheit) : `${l.anzahl}× ${einheitLabel(l.einheit)}`;
}

/** Menschenlesbarer Einheit-Text. */
export function einheitLabel(e: KLVEinheit): string {
  switch (e) {
    case "e": return "einmalig";
    case "w": return "1×/Wo.";
    case "t2": return "2×/Wo.";
    case "t3": return "3×/Wo.";
    case "t4": return "4×/Wo.";
    case "t5": return "5×/Wo.";
    case "t6": return "6×/Wo.";
    case "t7": return "7×/Wo.";
    case "m": return "1×/Mo.";
    case "nB": return "n. B.";
    default: return e;
  }
}

/** Menschenlesbarer Wer-Text. */
/**
 * Beschriftung der Spalte W. Kommt aus der Werteliste, nicht aus einer
 * zweiten Zuordnung — sonst laufen Katalog und Anzeige auseinander.
 */
export function werLabel(w: KlvWerCode): string {
  return klvWerLabel(w);
}

/** Berechnungstext für Live-Anzeige (z.B. "7 × 1 × 26 min"). */
export function berechnungsText(l: KLVLeistung): string {
  if (l.einheit === "e") return `einmalig · ${l.anzahl} × ${l.zeitMin} min`;
  if (l.einheit === "nB") return `nach Bedarf · ${l.zeitMin} min/Einsatz`;
  const tage = tageProWoche(l.einheit);
  if (tage > 0) return `${l.anzahl} × ${tage}d × ${l.zeitMin} min`;
  if (l.einheit === "w") return `${l.anzahl} × ${l.zeitMin} min`;
  if (l.einheit === "m") return `${l.anzahl} × ${l.zeitMin} min / 4.33`;
  return "";
}

/** Kompakter Parameter-String für Compact-Ansicht. */
export function kompaktParams(l: KLVLeistung): string {
  const parts: string[] = [];
  parts.push(werLabel(l.wer));
  parts.push(`${l.anzahl}×`);
  parts.push(einheitLabel(l.einheit));
  parts.push(`${l.zeitMin} min`);
  const h = hProWoche(l);
  if (istPeriodisch(l)) parts.push(`${h.toFixed(2)} h/Wo.`);
  else if (l.einheit === "e") parts.push(`${einmaligeMin(l)} min einm.`);
  else parts.push("n. B.");
  return parts.join(" · ");
}

export interface KLVSummen {
  kategorieA: number;
  kategorieB: number;
  kategorieC: number;
  total: number;
  einmaligMin: number;
  einmaligH: number;
}

/** Summen über alle Leistungen berechnen (ohne Simultan-Korrektur). */
export function berechneSummen(leistungen: KLVLeistung[]): KLVSummen {
  let kategorieA = 0, kategorieB = 0, kategorieC = 0;
  let einmaligMin = 0;

  for (const l of leistungen) {
    const h = hProWoche(l);
    if (istPeriodisch(l)) {
      if (l.kategorie === "a") kategorieA += h;
      else if (l.kategorie === "b") kategorieB += h;
      else kategorieC += h;
    }
    if (l.einheit === "e") einmaligMin += l.anzahl * l.zeitMin;
  }

  return {
    kategorieA: round2(kategorieA),
    kategorieB: round2(kategorieB),
    kategorieC: round2(kategorieC),
    total: round2(kategorieA + kategorieB + kategorieC),
    einmaligMin,
    einmaligH: round2(einmaligMin / 60),
  };
}

/** Simultan-Hinweis: Gibt die anderen Leistungen derselben Gruppe zurück. */
export function getSimultanPartner(l: KLVLeistung, alle: KLVLeistung[]): KLVLeistung[] {
  if (!l.simultanGruppe) return [];
  return alle.filter(a => a.simultanGruppe === l.simultanGruppe && a.id !== l.id);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
