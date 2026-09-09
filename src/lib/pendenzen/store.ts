/**
 * Pendenzenbestand — EIN Bestand für alle Ansichten.
 *
 * Vorher hielt `ServiceDeskPage` ihre Änderungen in `localEdits`, einem
 * Komponentenzustand. Wer dort eine Pendenz schloss, änderte sie nur für diese
 * eine Ansicht: die linke Spalte des Onboardings und der Marker im
 * Formularabschnitt sahen davon nichts, und ein Neuladen warf alles weg.
 *
 * Der Bestand liegt jetzt im Modul. Die Quelldaten (`getUnifiedEntries`) bleiben
 * unverändert; Änderungen liegen als Überlagerung je Kennung darüber — derselbe
 * Weg wie bei den Patienten (`localEdits` → Overlay über dem Seed).
 *
 * Prototyp: keine Persistenz. Ein Neuladen stellt den Ausgangsstand her.
 */
import { useSyncExternalStore } from "react";
import { getUnifiedEntries, type UnifiedEntry, type VerlaufEintrag } from "../mocks/service-desk-unified";

/** Geänderte Felder je Pendenz. Leer = unverändert gegenüber der Quelle. */
let ueberlagerung: Record<string, Partial<UnifiedEntry>> = {};

/** Zwischenspeicher, damit `getPendenzen` bei gleichem Stand dieselbe Liste
 *  zurückgibt — `useSyncExternalStore` vergleicht mit `Object.is`. */
let zwischenstand: UnifiedEntry[] = baue();
const hoerer = new Set<() => void>();

function baue(): UnifiedEntry[] {
  return getUnifiedEntries().map(e => {
    const patch = ueberlagerung[e.id];
    return patch ? { ...e, ...patch } : e;
  });
}

function melde(): void {
  zwischenstand = baue();
  hoerer.forEach(h => h());
}

/** Der aktuelle Bestand — Quelldaten mit Überlagerung. */
export function getPendenzen(): UnifiedEntry[] {
  return zwischenstand;
}

/** Reaktiver Zugriff. Jede Ansicht, die hier liest, folgt jeder Änderung. */
export function usePendenzen(): UnifiedEntry[] {
  return useSyncExternalStore(
    h => { hoerer.add(h); return () => hoerer.delete(h); },
    getPendenzen,
    getPendenzen,
  );
}

/**
 * Felder einer Pendenz ändern — der einzige Schreibpfad. Der Verlauf bleibt
 * Sache der Aufrufstelle; hier wird nur der Wert gesetzt.
 */
export function aenderePendenz(id: string, patch: Partial<UnifiedEntry>): void {
  ueberlagerung = { ...ueberlagerung, [id]: { ...(ueberlagerung[id] ?? {}), ...patch } };
  melde();
}

/**
 * Einen Verlaufseintrag anhängen. Der Verlauf liegt am Datensatz und ist damit
 * in jeder Ansicht sichtbar.
 *
 * Ein Eintrag entsteht ausschliesslich bei einer tatsächlichen Änderung — das
 * Öffnen, Auswählen oder Anzeigen einer Pendenz erzeugt keinen. Die Prüfung, ob
 * sich ein Wert wirklich geändert hat, liegt bei der Aufruferin
 * (`aendereFeld` vergleicht alt und neu und kehrt sonst um).
 */
export function ergaenzeVerlauf(id: string, eintrag: VerlaufEintrag): void {
  const bisher = zwischenstand.find(e => e.id === id)?.verlauf ?? [];
  aenderePendenz(id, { verlauf: [...bisher, eintrag] });
}

/**
 * Neu einlesen, wenn die Quelldaten sich geändert haben (z. B. nach dem Anlegen
 * einer Pendenz). Die Überlagerung bleibt erhalten.
 */
export function pendenzenNeuLesen(): void {
  melde();
}
