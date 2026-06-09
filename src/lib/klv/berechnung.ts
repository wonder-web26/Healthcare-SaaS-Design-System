/**
 * KLV-Berechnungslogik — h/Wo., Einmalige, Simultan-Korrektur.
 *
 * Folgt dem KLV-Standard (RAI-Home-Care Suisse Leistungsplanungsblatt).
 */
import type { KLVLeistung, KLVEinheit } from "../../types/klinische-artefakte";

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
export function werLabel(w: "S" | "A" | "S+A"): string {
  switch (w) {
    case "S": return "Spitex";
    case "A": return "Angehörige";
    case "S+A": return "Spitex+Ang.";
  }
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
