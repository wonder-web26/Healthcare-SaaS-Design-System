/**
 * SP-07: Partner-Quellensteuer-Automatik + Pendenz-Erzeugung.
 *
 * Regel 1 — Automatische Entfernung:
 *   Partner-Bewilligung == "CH" oder "C"
 *   → quellensteuerpflichtig = false (Quellensteuer entfaellt)
 *
 * Regel 2 — Pendenz bei bestehender Quellensteuerpflicht:
 *   quellensteuerpflichtig == true
 *   → erzeugt Pendenz "Quellensteuer einrichten / Tarif zuweisen" (Tag: Salary)
 *
 * Reaktives Verhalten:
 *   - false → true: Pendenz erzeugen (wenn nicht bereits offen)
 *   - true → false: offene Pendenz als gegenstandslos markieren
 *   - Keine doppelten Pendenzen pro Mitarbeiter/Fall
 *
 * Bewusst NICHT enthalten:
 *   - Keine rueckwirkende Korrektur, keine Nachzahlung
 *   - Kein Steuertarif berechnen (das ist SP-10)
 */

import { workflowTasks, type WorkflowTask } from "../mocks/workflow-tasks";

/** Ergebnis der SP-07-Pruefung */
export interface QuellensteuerErgebnis {
  /** Neuer Wert fuer quellensteuerpflichtig */
  quellensteuerpflichtig: boolean;
  /** Ob eine Aenderung stattgefunden hat */
  geaendert: boolean;
  /** Audit-Log-Eintrag (null wenn keine Aenderung) */
  auditEintrag: string | null;
  /** Pendenz-Aktion */
  pendenzAktion: "erstellen" | "gegenstandslos" | "keine";
}

/**
 * Prueft und wendet die Quellensteuer-Automatik an.
 *
 * @param partnerBewilligung - Aufenthaltsbewilligung des Partners ("CH", "C", "B", etc.)
 * @param bisherPflichtig - Aktueller Wert von quellensteuerpflichtig
 * @param mitarbeiterName - Name fuer Audit und Pendenz
 * @param mitarbeiterId - ID fuer Pendenz-Verknuepfung
 */
export function pruefeQuellensteuerAutomatik(
  partnerBewilligung: string,
  bisherPflichtig: boolean,
  mitarbeiterName: string,
  mitarbeiterId: string,
): QuellensteuerErgebnis {
  const heute = new Date().toISOString();
  const bewilligungEntferntPflicht = partnerBewilligung === "CH" || partnerBewilligung === "C";

  // Regel 1: Partner ist Schweizer oder C → Pflicht entfaellt
  if (bewilligungEntferntPflicht && bisherPflichtig) {
    return {
      quellensteuerpflichtig: false,
      geaendert: true,
      auditEintrag: `[${heute}] Quellensteuer automatisch entfernt: Partner-Bewilligung ${partnerBewilligung} (Schweizer/C). Mitarbeiter: ${mitarbeiterName}`,
      pendenzAktion: "gegenstandslos",
    };
  }

  // Partner ist B/andere → Pflicht bleibt
  if (!bewilligungEntferntPflicht && bisherPflichtig) {
    return {
      quellensteuerpflichtig: true,
      geaendert: false,
      auditEintrag: null,
      pendenzAktion: "erstellen", // Pendenz sicherstellen (idempotent)
    };
  }

  // Sonderfaelle
  if (bewilligungEntferntPflicht && !bisherPflichtig) {
    // Bereits nicht pflichtig, Partner CH/C → keine Aenderung
    return { quellensteuerpflichtig: false, geaendert: false, auditEintrag: null, pendenzAktion: "keine" };
  }

  // Nicht pflichtig, Partner nicht CH/C → keine Aenderung (wird ggf. manuell gesetzt)
  return { quellensteuerpflichtig: false, geaendert: false, auditEintrag: null, pendenzAktion: "keine" };
}

/**
 * Erzeugt oder markiert eine Quellensteuer-Pendenz (idempotent).
 * Schreibt direkt in das workflowTasks-Mock-Array.
 */
export function verwalteQuellensteuerPendenz(
  aktion: "erstellen" | "gegenstandslos" | "keine",
  mitarbeiterName: string,
  mitarbeiterId: string,
): void {
  if (aktion === "keine") return;

  // Suche bestehende offene Pendenz fuer diesen Mitarbeiter
  const bestehend = workflowTasks.find(
    t => t.typ === "QUELLENSTEUER_ANMELDUNG" &&
      t.betroffenePerson.name === mitarbeiterName &&
      t.status === "offen"
  );

  if (aktion === "erstellen") {
    // Idempotent: nur erstellen wenn keine offene vorhanden
    if (bestehend) return;

    const heute = new Date().toISOString().slice(0, 10);
    const faellig = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    const neuePendenz: WorkflowTask = {
      id: `W-QST-${Date.now()}`,
      typ: "QUELLENSTEUER_ANMELDUNG",
      titel: "Quellensteuer einrichten / Tarif zuweisen",
      kontext: `Mitarbeiter ${mitarbeiterName} ist quellensteuerpflichtig → Tarif zuweisen, monatlichen Abzug einrichten, ggf. kantonale Anmeldung.`,
      betroffenePerson: { name: mitarbeiterName, initialen: mitarbeiterName.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2) },
      erstellt: heute,
      faellig,
      status: "offen",
      verantwortlich: { name: "Kathrin Meier", initialen: "KM" }, // Buchhaltung
      prioritaet: "hoch",
    };

    workflowTasks.push(neuePendenz);
    console.info(`[SP-07 Audit] Pendenz erstellt: "${neuePendenz.titel}" fuer ${mitarbeiterName} (${mitarbeiterId})`);
  }

  if (aktion === "gegenstandslos") {
    if (!bestehend) return;
    // Nicht loeschen, sondern als gegenstandslos markieren
    bestehend.status = "erledigt";
    bestehend.kontext = `[Gegenstandslos] Partner-Bewilligung CH/C — Quellensteuerpflicht entfallen. ${bestehend.kontext}`;
    console.info(`[SP-07 Audit] Pendenz gegenstandslos: "${bestehend.titel}" fuer ${mitarbeiterName} (${mitarbeiterId})`);
  }
}
