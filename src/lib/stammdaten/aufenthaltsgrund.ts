/**
 * Grund der Aufenthaltsbewilligung — nur bei Drittstaatsangehörigen mit
 * Ausweis B relevant. Der Grund steht nicht auf dem Ausweis, sondern in der
 * Verfügung des Migrationsamts; aus Familiennachzug, Erwerbstätigkeit und
 * anerkanntem Flüchtling folgen ausländerrechtlich verschiedene Verfahren.
 *
 * `andere` ist unverzichtbar: Studium, Härtefall und weitere Gründe sind
 * fachlich noch ungeklärt. Ohne diesen Wert wählte jemand einen der drei
 * benannten, weil das Formular eine Antwort verlangt.
 *
 * Dieser Wert wird in Lauf 2 nur erfasst, gespeichert und angezeigt — nicht
 * ausgewertet. Die Auswertung folgt in Lauf 3.
 */
export type Aufenthaltsgrund =
  | "erwerbstaetigkeit"
  | "familiennachzug"
  | "asyl_anerkannt"
  | "andere";

/** Einzige Quelle der Beschriftungen. */
export const AUFENTHALTSGRUND_LABEL: Record<Aufenthaltsgrund, string> = {
  erwerbstaetigkeit: "Erwerbstätigkeit",
  familiennachzug: "Familiennachzug",
  asyl_anerkannt: "Anerkannter Flüchtling",
  andere: "Anderer Grund",
};

/** Auswahloptionen (value = Schlüssel). */
export const AUFENTHALTSGRUND_OPTIONS = (Object.keys(AUFENTHALTSGRUND_LABEL) as Aufenthaltsgrund[])
  .map(k => ({ value: k, label: AUFENTHALTSGRUND_LABEL[k] }));

/** Beschriftung zu einem Schlüssel; leerer String, wenn nicht gesetzt. */
export function aufenthaltsgrundLabel(v: string | null | undefined): string {
  return v ? (AUFENTHALTSGRUND_LABEL as Record<string, string>)[v] ?? "" : "";
}
