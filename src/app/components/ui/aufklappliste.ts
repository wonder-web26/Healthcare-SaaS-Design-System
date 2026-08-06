/**
 * Lage einer aufgeklappten Auswahlliste.
 *
 * Eine Liste, die als `position: absolute` im Feld steckt, wird von jedem
 * Vorfahren mit `overflow: hidden` oder `auto` beschnitten — beim
 * Leistungsplanungsblatt vom Abschnitt (runde Ecken) und vom Rollbereich der
 * Seite. Sichtbar war das daran, dass die unteren Werte fehlten.
 *
 * Diese Hilfe berechnet stattdessen eine bildschirmfeste Lage aus dem
 * Rechteck des Feldes. Die Liste wird über ein Portal an `document.body`
 * gezeichnet und kennt damit keine beschneidenden Vorfahren mehr.
 *
 * Sie klappt nach oben, wenn unten kein Platz ist, und zeigt höchstens acht
 * Einträge; darüber hinaus rollt sie in sich.
 */

import { useEffect } from "react";

/** Höchstzahl gleichzeitig sichtbarer Einträge. */
export const MAX_SICHTBARE_EINTRAEGE = 8;

/** Abstand zwischen Feld und Liste sowie zum Fensterrand. */
const ABSTAND = 4;
const RAND = 8;

export interface AufklappLage {
  /** Für `position: fixed`. */
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  /** Klappt die Liste nach oben? Nur für die Herkunft der Schattenkante. */
  nachOben: boolean;
}

/**
 * @param feld        Rechteck des geschlossenen Feldes (Auslöser).
 * @param anzahl      Anzahl Einträge der Liste.
 * @param eintragHoehe Höhe eines Eintrags in Pixeln.
 * @param rahmen      Innenabstand und Rahmen der Liste in Pixeln.
 */
export function berechneAufklappLage(
  feld: DOMRect,
  anzahl: number,
  eintragHoehe: number,
  rahmen = 9,
): AufklappLage {
  const gewuenscht = Math.min(anzahl, MAX_SICHTBARE_EINTRAEGE) * eintragHoehe + rahmen;
  const platzUnten = window.innerHeight - feld.bottom - ABSTAND - RAND;
  const platzOben = feld.top - ABSTAND - RAND;

  // Nach unten, solange es dort reicht oder dort mehr Platz ist als oben.
  const nachOben = gewuenscht > platzUnten && platzOben > platzUnten;
  const maxHeight = Math.max(eintragHoehe + rahmen, Math.min(gewuenscht, nachOben ? platzOben : platzUnten));

  return {
    top: nachOben ? feld.top - ABSTAND - maxHeight : feld.bottom + ABSTAND,
    left: feld.left,
    width: feld.width,
    maxHeight,
    nachOben,
  };
}

/**
 * Führt die Lage nach, solange die Liste offen ist.
 *
 * Eine bildschirmfeste Liste wandert nicht mit, wenn die Seite rollt oder das
 * Fenster die Grösse wechselt — sie stünde sonst neben ihrem Feld. Das Rollen
 * wird in der Erfassungsphase gehört, damit auch innere Rollbereiche zählen.
 */
export function useLageNachfuehren(offen: boolean, neuBerechnen: () => void): void {
  useEffect(() => {
    if (!offen) return;
    const h = () => neuBerechnen();
    window.addEventListener("scroll", h, true);
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("scroll", h, true);
      window.removeEventListener("resize", h);
    };
  }, [offen, neuBerechnen]);
}
