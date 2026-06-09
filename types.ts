/**
 * InterRAI HC Schweiz – Type-Definitionen
 *
 * ⚠️ LIZENZ-VORBEHALT
 * Items und Skalen sind sinngemäss formuliert auf Basis eines konkreten
 * InterRAI-HC-Reports (Medlink-Software). Sie sind KEINE 1:1-Kopie der
 * lizenzierten InterRAI-HC-Schweiz-Vorlage. Für den produktiven Einsatz
 * ist eine offizielle Lizenz von Spitex Schweiz bzw. interRAI Switzerland
 * erforderlich.
 *
 * © interRAI HC 1994-2019 (9.4) – www.interRAI.org (Original-Schema)
 */

export type InterRAISektion =
  | "A" // Administrative Daten und Beurteilungsgrund
  | "B" // Aufnahme und Vorgeschichte
  | "C" // Kognitive Fähigkeiten
  | "D" // Kommunikation und Sehen
  | "E" // Stimmungslage und Verhalten
  | "F" // Psychosoziales Wohlbefinden
  | "G" // Körperliche Funktionsfähigkeiten
  | "H" // Kontinenz
  | "I" // Medizinische Diagnosen
  | "J" // Gesundheitszustand
  | "K" // Mund- und Ernährungsstatus
  | "L" // Zustand der Haut
  | "M" // Medikamente
  | "N" // Behandlungen
  | "O" // Verantwortungen, Verfügungen
  | "P" // Informelle Unterstützung
  | "Q" // Wohnumgebungsabklärung
  | "R" // Entlassungsaussichten und allgemeiner Zustand
  | "S"; // Assessment-Informationen

export type InterRAIAntwortTyp =
  | "skala" // Auswahl aus festen Optionen
  | "ja_nein" // Spezialfall von "skala" mit 0/1
  | "text" // Freitext
  | "zahl" // Numerischer Wert (z.B. Gewicht, Anzahl)
  | "datum"; // ISO-Datum

export interface InterRAIAntwortOption {
  /** Der gespeicherte Wert, z.B. "0", "1", ..., "8", "X". */
  wert: string;
  /** Vollständige Bezeichnung wie im PDF/Report sichtbar, inkl. Nummer-Präfix. */
  bezeichnung: string;
  /** Kurzform für kompakte Darstellung in Tabellen/Pillen. */
  kurzLabel: string;
}

export interface InterRAIItemDefinition {
  /** Eindeutiger InterRAI-Item-Code, z.B. "A11", "C1", "G2h". */
  code: string;
  /** Sektion-Buchstabe, z.B. "G". */
  sektion: InterRAISektion;
  /** Lesbarer Sektion-Name, z.B. "Körperliche Funktionsfähigkeiten". */
  sektionName: string;
  /** Kurze, prägnante Frage-Bezeichnung für UI-Listen. */
  frageKurz: string;
  /** Vollständige Fragestellung wie im Original-Schema. */
  frageVoll: string;
  /** Welcher Eingabe-Typ wird erwartet. */
  antwortTyp: InterRAIAntwortTyp;
  /**
   * Vordefinierte Antwort-Optionen für antwortTyp = "skala" oder "ja_nein".
   * Leer für "text", "zahl", "datum".
   */
  antwortOptionen: InterRAIAntwortOption[];
  /** Optionaler Hinweis, z.B. zu Wiederholbarkeit oder Spezialregeln. */
  hinweis?: string;
}

/**
 * Erfasste Antwort eines Klienten für ein konkretes Item.
 * Wird separat von der Definition gespeichert.
 */
export interface InterRAIAntwort {
  itemCode: string;
  /** Bei skala/ja_nein: einer der wert-Strings. Bei text/zahl/datum: der Rohwert. */
  wert: string;
  /** Anna-Konfidenz, falls das Item per Voice-Erfassung von Anna extrahiert wurde. */
  annaKonfidenz?: "hoch" | "mittel" | "niedrig";
  /** Ob die Antwort von einer Pflegefachperson validiert wurde. */
  validiert?: boolean;
  /** Zeitstempel der letzten Änderung. */
  zuletztGeaendert?: string;
  /** Optional: Kommentar/Begründung. */
  kommentar?: string;
}