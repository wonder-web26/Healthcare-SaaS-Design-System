/**
 * PA-05: Vitaldaten — Datenmodell + In-Memory Store.
 *
 * APPEND-ONLY: Kein stilles Überschreiben. Korrektur = neuer Eintrag,
 * markiert als "Korrektur von <id>", alter Eintrag bleibt sichtbar.
 * Zeitstempel und Erfasser sind nach dem Speichern unveränderlich.
 *
 * Vitalmessungen hängen IMMER an patient_id (nie am Onboarding).
 * Konvertierung ändert nur den Patienten-Status — Vitaldaten bleiben unberührt.
 */

export type MessungQuelle = "manuell" | "geraet";

export interface Messwert {
  parameterCode: string;
  wert: number;
}

export interface Vitalmessung {
  id: string;
  patientId: string;
  /** Systemseitig gesetzt beim Speichern, NICHT editierbar */
  zeitstempelErfasst: string;
  /** Angemeldeter Benutzer, automatisch */
  erfasser: string;
  quelle: MessungQuelle;
  kommentar: string;
  werte: Messwert[];
  /** Falls Korrektur: ID der korrigierten Messung */
  korrekturVon: string | null;
}

/** In-Memory Store (Mock — in Produktion: Datenbank) */
const MESSUNGEN: Vitalmessung[] = [];

/**
 * Neue Messung erfassen. Zeitstempel + Erfasser werden automatisch gesetzt.
 * APPEND-ONLY: wird dem Array hinzugefügt, nie überschrieben.
 */
export function erfasseMessung(
  patientId: string,
  werte: Messwert[],
  erfasser: string,
  quelle: MessungQuelle = "manuell",
  kommentar: string = "",
  korrekturVon: string | null = null,
): Vitalmessung {
  const messung: Vitalmessung = {
    id: `VM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    patientId,
    zeitstempelErfasst: new Date().toISOString(),
    erfasser,
    quelle,
    kommentar,
    werte: werte.filter(w => w.wert !== 0 && !isNaN(w.wert)),
    korrekturVon,
  };
  MESSUNGEN.push(messung);
  console.info(`[Vitaldaten] Messung ${messung.id} erfasst für Patient ${patientId} von ${erfasser} (${werte.length} Werte)`);
  return messung;
}

/**
 * Alle Messungen eines Patienten, chronologisch neueste zuerst.
 */
export function getMessungenFuerPatient(patientId: string): Vitalmessung[] {
  return MESSUNGEN
    .filter(m => m.patientId === patientId)
    .sort((a, b) => new Date(b.zeitstempelErfasst).getTime() - new Date(a.zeitstempelErfasst).getTime());
}

/**
 * Korrektur einer bestehenden Messung. Erstellt einen neuen Eintrag,
 * verlinkt auf die korrigierte Messung. Alter Eintrag bleibt sichtbar.
 */
export function korrigiereMessung(
  originalId: string,
  patientId: string,
  werte: Messwert[],
  erfasser: string,
  kommentar: string = "",
): Vitalmessung {
  return erfasseMessung(patientId, werte, erfasser, "manuell", `Korrektur: ${kommentar}`, originalId);
}
