/**
 * Gemeinsame Form der Personen-Wertelisten für Patient und Angehörige.
 *
 * Drei Ebenen je Eintrag, bewusst getrennt:
 *
 *   schluessel — was gespeichert wird. Sprechend, überall gleich, nie die
 *                Beschriftung.
 *   label      — was angezeigt wird. Wird aus dem Schlüssel abgeleitet.
 *   sdaCode    — wofür der Eintrag beim Export in SDA und interRAI steht.
 *                null, wenn der Standardkatalog das Feld nicht kennt.
 *
 * Mehrere Einträge dürfen denselben SDA-Code tragen (etwa Verheiratet und
 * Eingetragene Partnerschaft), kein Eintrag trägt zwei. Damit bleibt die
 * Auswahl fachlich fein und die Kodierung trotzdem standardkonform.
 */
export interface PersonenFeldWert {
  schluessel: string;
  label: string;
  sdaCode: string | null;
}

/** Auswahloptionen aus einer Werteliste (value = Schlüssel). */
export function optionen(werte: PersonenFeldWert[]): { value: string; label: string }[] {
  return werte.map(w => ({ value: w.schluessel, label: w.label }));
}

/** Beschriftung zu einem Schlüssel; leerer String, wenn nicht erhoben. */
export function label(werte: PersonenFeldWert[], schluessel: string): string {
  return werte.find(w => w.schluessel === schluessel)?.label ?? "";
}

/** SDA-Code zu einem Schlüssel; null, wenn nicht kodierbar oder nicht erhoben. */
export function sdaCode(werte: PersonenFeldWert[], schluessel: string): string | null {
  return werte.find(w => w.schluessel === schluessel)?.sdaCode ?? null;
}
