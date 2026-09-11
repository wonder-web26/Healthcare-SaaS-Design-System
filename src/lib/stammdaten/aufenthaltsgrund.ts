/**
 * Grund der Aufenthaltsbewilligung — nur bei Drittstaatsangehörigen mit
 * Ausweis B relevant. Der Grund steht nicht auf dem Ausweis, sondern in der
 * Verfügung des Migrationsamts; aus Familiennachzug, Erwerbstätigkeit und
 * anerkanntem Flüchtling folgen ausländerrechtlich verschiedene Verfahren.
 *
 * `andere` — "Anderer Grund" — ist auf Entscheid des Eigners aus der AUSWAHL
 * entfernt. Es bleiben die drei Gründe, aus denen ein Verfahren folgt.
 *
 * Was das heisst: Studium, Härtefall und weitere Gründe lassen sich nicht mehr
 * ausdrücklich festhalten; das Feld bleibt dann leer. Fachlich ändert sich
 * nichts — die Prüfung liefert in beiden Fällen Z3 "nicht bestimmbar" mit der
 * Aufforderung, den Grund zu erfassen. Verloren geht allein der Unterschied
 * zwischen "geprüft, keiner der drei" und "noch nicht bearbeitet".
 *
 * Der Schlüssel bleibt im Typ, damit ein bestehender Datensatz lesbar bleibt.
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

/** Gründe, die zur Auswahl stehen — "andere" ist entfernt (siehe Kopf). */
const WAEHLBAR: Aufenthaltsgrund[] = ["erwerbstaetigkeit", "familiennachzug", "asyl_anerkannt"];

/** Auswahloptionen (value = Schlüssel). */
export const AUFENTHALTSGRUND_OPTIONS = WAEHLBAR
  .map(k => ({ value: k, label: AUFENTHALTSGRUND_LABEL[k] }));

/** Beschriftung zu einem Schlüssel; leerer String, wenn nicht gesetzt. */
export function aufenthaltsgrundLabel(v: string | null | undefined): string {
  return v ? (AUFENTHALTSGRUND_LABEL as Record<string, string>)[v] ?? "" : "";
}
