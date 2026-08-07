/**
 * Geplant gegen bewilligt.
 *
 * Das Leistungsplanungsblatt ist eine fachliche Feststellung: so viel Pflege
 * braucht dieser Mensch. Die Kostengutsprache ist die Antwort der Kasse.
 * Kürzt die Kasse, wird das Blatt NICHT angepasst — wer es anpasst, tut es
 * bewusst und erzeugt eine neue Version. Die Differenz bleibt sichtbar.
 *
 * Eine Rechnung für beide Orte: das Blatt im Dossier und die KLV-Liste lesen
 * dieselbe Funktion. Zwei Rechnungen für dieselbe Aussage würden auseinander-
 * laufen, sobald eine von beiden angefasst wird.
 *
 * Kategorien: die Kostengutsprache bewilligt heute eine Menge für das ganze
 * Blatt, nicht je Kategorie a, b, c. Deshalb wird nur die Summe abgeglichen.
 * Kämen Kategorienwerte hinzu, gehörte der Abgleich je Kategorie hierher.
 */
import type { KLVVerordnung } from "../../types/klinische-artefakte";
import { berechneSummen } from "./berechnung";
import { kgsDecktAm, ausAnzeigedatum, type Kostengutsprache } from "../mandate/verordnungen";

/**
 * Bewilligte Menge in Stunden je Woche.
 *
 * Die Kostengutsprache bewilligt MINUTEN je Woche, das Blatt plant STUNDEN je
 * Woche — umgerechnet wird durch 60. Ohne Zahl gibt es keine bewilligte Menge;
 * dann wird nicht mit Null gerechnet, sondern gar nicht.
 */
export function bewilligteStundenProWoche(k: Kostengutsprache): number | null {
  const roh = k.bewilligteMinutenProWoche.trim();
  if (!roh) return null;
  const min = Number(roh);
  return Number.isFinite(min) ? min / 60 : null;
}

export type AbgleichLage =
  /** Gültige Kostengutsprache, geplant liegt darüber. */
  | "ueber"
  /** Gültige Kostengutsprache, geplant liegt darunter oder gleichauf. */
  | "unter"
  /** Kostengutsprache vorhanden, aber ihre Gültigkeit ist abgelaufen. */
  | "abgelaufen"
  /** Keine Kostengutsprache am Mandat — oder eine ohne bewilligte Menge. */
  | "keine";

export interface Abgleich {
  lage: AbgleichLage;
  /** Stunden je Woche aus den Positionen. */
  geplant: number;
  /** Stunden je Woche aus der Kostengutsprache; null, wenn es keine gibt. */
  bewilligt: number | null;
  /** bewilligt − geplant; null ohne bewilligte Menge. Negativ = zu viel geplant. */
  differenz: number | null;
  /** Enddatum der abgelaufenen Gutsprache, sonst leer. */
  abgelaufenAm: string;
}

/**
 * Die Kostengutsprache des Blattes: über das Mandat, nicht über den Patienten.
 * Ein Patient kann mehrere Mandate tragen; nur das Mandat des Blattes zählt.
 */
function kgsDesBlattes(v: KLVVerordnung, alle: Kostengutsprache[]): Kostengutsprache[] {
  return v.mandatId ? alle.filter(k => k.mandatId === v.mandatId) : [];
}

export function abgleichen(
  v: KLVVerordnung,
  alleKgs: Kostengutsprache[],
  stichtag: Date,
): Abgleich {
  const geplant = berechneSummen(v.leistungspositionen).total;
  const eigene = kgsDesBlattes(v, alleKgs);

  const deckend = eigene.find(k => kgsDecktAm(k, stichtag, stichtag));
  if (!deckend) {
    // Abgelaufen von „gar keine" unterscheiden: das Enddatum ist die Auskunft,
    // die weiterhilft — sie sagt, was zu erneuern ist.
    const juengsteAbgelaufen = eigene
      .filter(k => { const bis = ausAnzeigedatum(k.gueltigBis); return bis && stichtag > bis; })
      .sort((a, b) => (ausAnzeigedatum(b.gueltigBis)!.getTime() - ausAnzeigedatum(a.gueltigBis)!.getTime()))[0];
    return juengsteAbgelaufen
      ? { lage: "abgelaufen", geplant, bewilligt: null, differenz: null, abgelaufenAm: juengsteAbgelaufen.gueltigBis }
      : { lage: "keine", geplant, bewilligt: null, differenz: null, abgelaufenAm: "" };
  }

  const bewilligt = bewilligteStundenProWoche(deckend);
  if (bewilligt === null) {
    // Sie deckt, nennt aber keine Menge — etwa solange die Kasse nicht
    // entschieden hat. Ohne Zahl gibt es nichts zu vergleichen.
    return { lage: "keine", geplant, bewilligt: null, differenz: null, abgelaufenAm: "" };
  }

  const differenz = bewilligt - geplant;
  return {
    lage: differenz < 0 ? "ueber" : "unter",
    geplant, bewilligt, differenz, abgelaufenAm: "",
  };
}

/** Kurzform für die Liste: liegt das Blatt über der Bewilligung? */
export function ueberBewilligung(v: KLVVerordnung, alleKgs: Kostengutsprache[], stichtag: Date): boolean {
  return abgleichen(v, alleKgs, stichtag).lage === "ueber";
}

/** Stunden mit zwei Nachkommastellen — dieselbe Darstellung an beiden Orten. */
export function stunden(n: number): string {
  return `${n.toFixed(2)} h/Wo.`;
}
