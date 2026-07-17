/**
 * WF-01 / WF-02: Rhythmus-Engine — Ticket-Generierung, Status, Beweissicherheit.
 *
 * Ausführungs-Schicht. Subjekt-agnostisch: polymorphe Referenz über
 * subjektTyp + subjektId.
 *
 * - Generierung: idempotent, pro (instanzId, schrittCode) nur EIN Ticket.
 * - Status: offen → überfällig automatisch bei fällig_am < heute.
 * - Erledigen: Protokoll bei Pflicht, erledigt_am/erledigt_von SYSTEMSEITIG.
 */

import {
  getAktiveVorlage,
  type RhythmusEntitaet,
  type RhythmusVorlage,
} from "./vorlage";

/* ══════════════════════════════════════════
   TYPEN
   ══════════════════════════════════════════ */

export type TicketStatus = "offen" | "erledigt" | "ueberfaellig";

export interface RhythmusInstanz {
  id: string;
  subjektTyp: RhythmusEntitaet;
  subjektId: string;
  subjektName: string;
  vorlageId: string;
  vorlageVersion: number;
  vorlageName: string;
  ankerDatum: string; // ISO date — konkretes Datum des Subjekts
  erstelltAm: string; // ISO date
}

export interface FaelligkeitsAenderung {
  altDatum: string;
  neuDatum: string;
  begruendung: string;
  geaendertVon: string;
  geaendertAm: string; // ISO datetime
}

export interface RhythmusTicket {
  id: string;
  instanzId: string;
  schrittCode: string;
  typ: string;
  label: string;
  faelligAm: string; // ISO date
  /** Ursprüngliches Fälligkeitsdatum aus Template (unveränderlich) */
  faelligAmUrspruenglich: string;
  status: TicketStatus;
  protokollPflicht: boolean;
  protokoll: string | null;
  zugewiesenAn: string | null;
  erledigtAm: string | null;
  erledigtVon: string | null;
  /** Audit-Trail: jede Verschiebung wird protokolliert */
  faelligkeitsAenderungen: FaelligkeitsAenderung[];
  /** Subjekt-Felder für schnellen Zugriff in Sammelansichten */
  subjektTyp: RhythmusEntitaet;
  subjektId: string;
  subjektName: string;
}

/* ══════════════════════════════════════════
   IN-MEMORY STORE (Produktion: Datenbank)
   ══════════════════════════════════════════ */

const INSTANZEN: RhythmusInstanz[] = [];
const TICKETS: RhythmusTicket[] = [];

/* ══════════════════════════════════════════
   DATUMS-HELFER
   ══════════════════════════════════════════ */

function addOffset(isoDate: string, monate: number, tage: number): string {
  const d = new Date(isoDate);
  if (tage > 0 && monate === 0) {
    d.setDate(d.getDate() + tage);
  } else {
    d.setMonth(d.getMonth() + monate);
    if (tage > 0) d.setDate(d.getDate() + tage);
  }
  return d.toISOString().slice(0, 10);
}

function heute(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ══════════════════════════════════════════
   TICKET-GENERIERUNG (idempotent)
   ══════════════════════════════════════════ */

/**
 * Erzeugt eine Rhythmus-Instanz mit Tickets für ein aktives Subjekt.
 *
 * @param subjektTyp  "angehoeriger" | "patient"
 * @param subjektId   ID des Subjekts
 * @param subjektName Anzeigename
 * @param ankerDatum  Konkretes Ankerdatum (z.B. Eintrittsdatum)
 * @param zugewiesenAn Optionale Default-Zuweisung für alle Tickets
 * @returns Die erzeugte Instanz oder null wenn keine passende Vorlage existiert
 */
export function generiereRhythmusTickets(
  subjektTyp: RhythmusEntitaet,
  subjektId: string,
  subjektName: string,
  ankerDatum: string,
  zugewiesenAn?: string,
): RhythmusInstanz | null {
  // Passende aktive Vorlage
  const vorlage = getAktiveVorlage(subjektTyp);
  if (!vorlage) return null;

  // Idempotenz: bereits Instanz für dieses Subjekt?
  const bestehend = INSTANZEN.find(
    i => i.subjektTyp === subjektTyp && i.subjektId === subjektId
  );
  if (bestehend) return bestehend;

  // Instanz erstellen
  const instanz: RhythmusInstanz = {
    id: `ri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subjektTyp,
    subjektId,
    subjektName,
    vorlageId: vorlage.id,
    vorlageVersion: vorlage.version,
    vorlageName: vorlage.name,
    ankerDatum,
    erstelltAm: heute(),
  };
  INSTANZEN.push(instanz);

  // Pro Schritt ein Ticket (nur zeit_offset, bedingung nicht ausgewertet)
  for (const schritt of vorlage.schritte) {
    if (schritt.triggerTyp !== "zeit_offset") continue;

    const ticketId = `rt-${instanz.id}-${schritt.code}`;

    // Idempotenz auf Ticket-Ebene
    if (TICKETS.some(t => t.instanzId === instanz.id && t.schrittCode === schritt.code)) continue;

    const berechnetesFaellig = addOffset(ankerDatum, schritt.offsetMonate, schritt.offsetTage);
    TICKETS.push({
      id: ticketId,
      instanzId: instanz.id,
      schrittCode: schritt.code,
      typ: schritt.typ,
      label: schritt.label,
      faelligAm: berechnetesFaellig,
      faelligAmUrspruenglich: berechnetesFaellig,
      status: "offen",
      protokollPflicht: schritt.protokollPflicht,
      protokoll: null,
      zugewiesenAn: schritt.verantwortlich || zugewiesenAn || null,
      erledigtAm: null,
      erledigtVon: null,
      faelligkeitsAenderungen: [],
      subjektTyp,
      subjektId,
      subjektName,
    });
  }

  return instanz;
}

/* ══════════════════════════════════════════
   STATUS-AKTUALISIERUNG
   ══════════════════════════════════════════ */

/** Setzt offene Tickets mit fällig_am < heute auf überfällig. */
export function aktualisiereUeberfaellige(): number {
  const h = heute();
  let count = 0;
  for (const t of TICKETS) {
    if (t.status === "offen" && t.faelligAm < h) {
      t.status = "ueberfaellig";
      count++;
    }
  }
  return count;
}

/* ══════════════════════════════════════════
   FÄLLIGKEIT ANPASSEN (mit Audit-Trail)
   ══════════════════════════════════════════ */

export interface AenderungsErgebnis {
  ok: boolean;
  fehler?: string;
}

/**
 * Fälligkeitsdatum eines Tickets verschieben.
 * Begründung ist Pflicht. Jede Änderung wird im Audit-Trail protokolliert.
 */
export function ticketFaelligkeitAendern(
  ticketId: string,
  neuesDatum: string,
  begruendung: string,
  geaendertVon: string,
): AenderungsErgebnis {
  const ticket = TICKETS.find(t => t.id === ticketId);
  if (!ticket) return { ok: false, fehler: "Ticket nicht gefunden" };
  if (ticket.status === "erledigt") return { ok: false, fehler: "Erledigte Tickets können nicht verschoben werden" };
  if (!begruendung || begruendung.trim().length === 0) return { ok: false, fehler: "Begründung ist Pflicht" };
  if (neuesDatum === ticket.faelligAm) return { ok: false, fehler: "Datum ist unverändert" };

  ticket.faelligkeitsAenderungen.push({
    altDatum: ticket.faelligAm,
    neuDatum: neuesDatum,
    begruendung: begruendung.trim(),
    geaendertVon,
    geaendertAm: new Date().toISOString(),
  });

  ticket.faelligAm = neuesDatum;
  // Status-Korrektur: war überfällig, jetzt vielleicht nicht mehr
  if (ticket.status === "ueberfaellig" && neuesDatum >= heute()) {
    ticket.status = "offen";
  }

  return { ok: true };
}

/* ══════════════════════════════════════════
   ERLEDIGEN (mit Beweissicherheit)
   ══════════════════════════════════════════ */

export interface ErledigenErgebnis {
  ok: boolean;
  fehler?: string;
}

/**
 * Ticket erledigen. Systemseitig: erledigt_am + erledigt_von nicht editierbar.
 * Bei Protokoll-Pflicht muss protokoll gesetzt sein.
 */
export function ticketErledigen(
  ticketId: string,
  erledigtVon: string,
  protokoll?: string,
): ErledigenErgebnis {
  const ticket = TICKETS.find(t => t.id === ticketId);
  if (!ticket) return { ok: false, fehler: "Ticket nicht gefunden" };
  if (ticket.status === "erledigt") return { ok: false, fehler: "Ticket bereits erledigt" };

  if (ticket.protokollPflicht && (!protokoll || protokoll.trim().length === 0)) {
    return { ok: false, fehler: "Protokoll ist Pflicht für diesen Schritt" };
  }

  // SYSTEMSEITIG — nicht editierbar
  ticket.erledigtAm = new Date().toISOString();
  ticket.erledigtVon = erledigtVon;
  ticket.protokoll = protokoll?.trim() ?? null;
  ticket.status = "erledigt";

  return { ok: true };
}

/* ══════════════════════════════════════════
   ABFRAGEN
   ══════════════════════════════════════════ */

/** Alle Tickets für ein Subjekt, chronologisch sortiert. */
export function getTicketsFuerSubjekt(subjektTyp: RhythmusEntitaet, subjektId: string): RhythmusTicket[] {
  aktualisiereUeberfaellige();
  return TICKETS
    .filter(t => t.subjektTyp === subjektTyp && t.subjektId === subjektId)
    .sort((a, b) => a.faelligAm.localeCompare(b.faelligAm));
}

/** Instanz für ein Subjekt (mit Vorlage-Snapshot). */
export function getInstanzFuerSubjekt(subjektTyp: RhythmusEntitaet, subjektId: string): RhythmusInstanz | null {
  return INSTANZEN.find(i => i.subjektTyp === subjektTyp && i.subjektId === subjektId) ?? null;
}

/** Alle fälligen/überfälligen Tickets einer zugewiesenen Person. */
export function getOffeneTicketsFuerPerson(zugewiesenAn: string): RhythmusTicket[] {
  aktualisiereUeberfaellige();
  return TICKETS
    .filter(t => t.zugewiesenAn === zugewiesenAn && (t.status === "offen" || t.status === "ueberfaellig"))
    .sort((a, b) => a.faelligAm.localeCompare(b.faelligAm));
}

/** Alle Tickets (für Admin-Übersicht). */
export function getAlleTickets(): RhythmusTicket[] {
  aktualisiereUeberfaellige();
  return [...TICKETS].sort((a, b) => a.faelligAm.localeCompare(b.faelligAm));
}

/** Alle Instanzen. */
export function getAlleInstanzen(): RhythmusInstanz[] {
  return [...INSTANZEN];
}

/**
 * Konvertierung: subjektId von onboardingId auf patientId/angehoerigerId umhängen.
 * Gleiche Logik wie bei Vitaldaten — Instanz + alle Tickets werden umgemappt.
 */
export function konvertiereRhythmusSubjekt(
  altId: string,
  neuId: string,
  subjektTyp: RhythmusEntitaet,
): number {
  let count = 0;
  for (const inst of INSTANZEN) {
    if (inst.subjektTyp === subjektTyp && inst.subjektId === altId) {
      inst.subjektId = neuId;
      count++;
    }
  }
  for (const t of TICKETS) {
    if (t.subjektTyp === subjektTyp && t.subjektId === altId) {
      t.subjektId = neuId;
    }
  }
  return count;
}
