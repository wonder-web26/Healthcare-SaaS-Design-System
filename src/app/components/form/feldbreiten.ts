/**
 * Feld- und Formularbreiten — reine Layoutvorgaben, keine Komponenten.
 * EINZIGE Quelle der Breitenwerte; alle verwendenden Dateien importieren von hier.
 */
import type { CSSProperties } from "react";

/* ── Feldbreitenklassen. schmal/mittel begrenzen die Maximalbreite, "voll" =
   Rasterzelle (keine Begrenzung). Die Klasse wird je Feld an der Aufrufstelle
   zugewiesen, nicht aus dem Feldnamen abgeleitet. Ein schmales Feld füllt seine
   Rasterzelle nicht aus; die Lücke rechts ist beabsichtigt.

   WICHTIG: Diese Werte begrenzen das BEDIENELEMENT, nicht den Feldblock. Die
   Beschriftung nutzt die volle Spaltenbreite — sonst bricht sie auf die Breite
   eines schmalen Feldes um und schiebt das Bedienelement gegenüber der
   Nachbarspalte nach unten. ── */
export const FELD_MAX = { schmal: "12rem", mittel: "22rem", voll: "none" } as const;

/* ── Maximalbreite des Formularbereichs. Gilt für Raster, Abschnittsüberschriften,
   Trennlinien und "voll"-Felder gemeinsam (dieselbe rechte Kante, keine Stufe),
   linksbündig. Die Reiterzeile ist NICHT betroffen. ── */
export const FORMULAR_MAX = 880;

/* ── Gleiche Höhe je Zeile. Solange die Breitenbegrenzung nur das Bedienelement
   trifft, steht jeder Beschriftung die volle Spaltenbreite zur Verfügung; sie
   bleibt einzeilig, und die Bedienelemente einer Zeile sitzen von selbst auf
   gleicher Höhe. Bräuchte eine Beschriftung dennoch zwei Zeilen — etwa weil sie
   länger als eine Rasterspalte ist —, müssten alle Felder derselben Zeile
   denselben Beschriftungsraum reservieren, wie es die Patientenliste für ihre
   Prozessstatus-Zelle tut. Aktuell trifft das auf kein Feld zu; die Regel steht
   hier, damit sie beim Anlegen langer Beschriftungen mitgedacht wird. ── */

/* ══════════════════════════════════════════
   Auswahlfelder mit Werten aus dem Spitex-Schweiz-Katalog
   ══════════════════════════════════════════ */

/** Spaltenabstand des zweispaltigen Formularrasters (var(--space-4)). */
const SPALTEN_ABSTAND_PX = 16;

/** Breite einer Rasterspalte im zweispaltigen Formular. */
export const SPALTEN_BREITE_PX = (FORMULAR_MAX - SPALTEN_ABSTAND_PX) / 2;

/** Mittlere Zeichenbreite der Formularschrift bei 14 px — bewusst grosszügig gerechnet. */
const ZEICHEN_PX = 7.3;

/** Innenabstand, Rahmen und Auswahlpfeil eines Auswahlfelds. */
const STEUERELEMENT_ZUGABE_PX = 56;

export interface KatalogFeldBreite {
  /** Style für die Rasterzelle — spannt über beide Spalten, wenn eine nicht reicht. */
  zelle?: CSSProperties;
  /** Maximalbreite des Bedienelements. */
  steuerelement: string;
}

/**
 * Breite eines Auswahlfelds, dessen Werte aus dem Standardkatalog stammen.
 *
 * Katalogwerte werden nie gekürzt — weder mit Auslassungspunkten noch durch
 * Umformulierung. Das Feld wird deshalb an seinem LÄNGSTEN Wert bemessen statt
 * an einer festen Stufe. Passt der längste Wert nicht in eine Rasterspalte,
 * nimmt das Feld die volle Zeilenbreite ein.
 *
 * Gilt für alle Katalogfelder; BB9 mit dreizehn und BB13 mit einundzwanzig
 * langen Werten erben die Regel, ohne sie zu wiederholen.
 */
export function katalogFeldBreite(optionen: readonly { label: string }[]): KatalogFeldBreite {
  const laengster = optionen.reduce((max, o) => Math.max(max, o.label.length), 0);
  const noetig = laengster * ZEICHEN_PX + STEUERELEMENT_ZUGABE_PX;

  if (noetig > SPALTEN_BREITE_PX) {
    return { zelle: { gridColumn: "1 / -1" }, steuerelement: `${Math.ceil(noetig)}px` };
  }
  return { steuerelement: `${Math.ceil(noetig)}px` };
}
