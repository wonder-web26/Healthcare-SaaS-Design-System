/**
 * Gemeinsame Form der SDA-Wertelisten: Code plus Beschriftung.
 *
 * Gespeichert wird durchgehend der Code des Standardkatalogs; die Beschriftung
 * dient nur der Anzeige. Ein leerer Code bedeutet „nicht erhoben" und nicht
 * „nicht zutreffend" — deshalb hat keine Liste eine Vorbelegung.
 */
export interface SdaWert {
  code: string;
  label: string;
}
