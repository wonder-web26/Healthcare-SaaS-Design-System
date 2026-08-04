import { workflowTasks, workflowTypLabel, CURRENT_USER, MY_TEAM, type WorkflowTask, type WorkflowTyp, type Person, type Prioritaet } from "./workflow-tasks";
import { serviceTickets, ticketTypLabel, type ServiceTicket, type TicketTyp } from "./service-tickets";
import { generateWorkflowBeschreibung } from "./workflow-task-beschreibungen";
import { getAlleTickets, type RhythmusTicket } from "../rhythmus/engine";
import { personName, type PersonenBezug } from "./personen-aufloesung";
import type { PendenzTyp } from "../../types/pendenz";

export type Quelle = "workflow" | "ticket" | "rhythmus";

export interface UnifiedEntry {
  id: string;
  quelle: Quelle;
  typ: WorkflowTyp | TicketTyp;
  typLabel: string;
  pendenzTyp: PendenzTyp;
  /** Typisierter Personenbezug (Art + Kennung), Pflicht. Der Name wird zur
   *  Anzeigezeit aufgelöst (personName), nie hier gespeichert. */
  personBezug: PersonenBezug;
  /** Betreff = die Sache, nie ein Personenname. */
  betreff: string;
  kontext: string;
  erstellt: string;
  /** Erstellerin — beim Anlegen gesetzt, nie verändert. */
  erstelltVon: Person;
  faellig: string | null;
  status: "offen" | "in_bearbeitung" | "erledigt";
  verantwortlich: Person;
  prioritaet: Prioritaet;
  beschreibung: string;
}

/** Maps legacy WorkflowTyp to typed PendenzTyp */
const workflowToPendenzTyp: Record<WorkflowTyp, PendenzTyp> = {
  SRK_ANMELDUNG: "srk-anmeldung",
  RE_ASSESSMENT: "re-assessment",
  AUSWEIS_B_ANMELDUNG: "ausweis-b-migrationsamt",
  QUELLENSTEUER_ANMELDUNG: "quellensteuer",
  KINDERZULAGEN_ANTRAG: "kinderzulagen",
  LOHNANPASSUNG_NACH_SRK: "lohn-anpassung",
};

/** Maps legacy TicketTyp to typed PendenzTyp */
const ticketToPendenzTyp: Record<TicketTyp, PendenzTyp> = {
  SCHLUESSEL: "schluessel",
  ANFRAGE: "anfrage",
  PROBLEM: "problem",
  MELDUNG: "meldung",
};

/**
 * Personenbezug je statischer Pendenz (Art + Kennung → reale Detailseiten-Person).
 * EINE Stelle für die Zuordnung; die Testdaten sind an die Struktur angepasst,
 * die Art der Pendenz passt zur Personenart (Quellensteuer/SRK/Ausweis B/
 * Kinderzulagen/Lohnanpassung → Angehörige, Re-Assessment/Pflegethemen → Patient).
 * Auf mehrere Personen verteilt, nicht alle auf dieselbe.
 */
const PERSONEN_BEZUG: Record<string, PersonenBezug> = {
  // Workflow — Angehörige (Personal-/Bewilligungsthemen)
  "W-0142": { art: "angehoeriger", kennung: "A-2026-0101" }, // SRK
  "W-0143": { art: "angehoeriger", kennung: "A-2026-0103" }, // SRK
  "W-0144": { art: "angehoeriger", kennung: "A-2026-0105" }, // SRK
  "W-0149": { art: "angehoeriger", kennung: "A-2026-0104" }, // Ausweis B
  "W-0150": { art: "angehoeriger", kennung: "A-2026-0106" }, // Ausweis B
  "W-0151": { art: "angehoeriger", kennung: "A-2026-0102" }, // Quellensteuer
  "W-0152": { art: "angehoeriger", kennung: "A-2026-0108" }, // Quellensteuer
  "W-0153": { art: "angehoeriger", kennung: "A-2026-0107" }, // Kinderzulagen
  "W-0154": { art: "angehoeriger", kennung: "A-2026-0103" }, // Lohnanpassung
  "W-0155": { art: "angehoeriger", kennung: "A-2026-0105" }, // Lohnanpassung
  // Workflow — Patient (Re-Assessment)
  "W-0145": { art: "patient", kennung: "P-2026-0041" },
  "W-0146": { art: "patient", kennung: "P-2026-0043" },
  "W-0147": { art: "patient", kennung: "P-2026-0045" },
  "W-0148": { art: "patient", kennung: "P-2026-0047" },
  "W-0156": { art: "patient", kennung: "P-2026-0048" },
  // Tickets — Angehörige
  "T-0088": { art: "angehoeriger", kennung: "A-2026-0109" }, // Schlüssel (Einsatzadresse)
  "T-0091": { art: "angehoeriger", kennung: "A-2026-0110" }, // Dokumente (Arbeitsvertrag)
  // Tickets — Patient
  "T-0089": { art: "patient", kennung: "P-2026-0044" }, // Hilfsmittel-Kostengutsprache
  "T-0090": { art: "patient", kennung: "P-2026-0046" }, // Rezept fehlt
  "T-0092": { art: "patient", kennung: "P-2026-0049" }, // Ersatzpflege
  "T-0093": { art: "patient", kennung: "P-2026-0050" }, // Sturz gemeldet
  "T-0094": { art: "patient", kennung: "P-2026-0042" }, // Spitalaustritt
  "T-0095": { art: "patient", kennung: "P-2026-0044" }, // Schlüsselübergabe Neu-Klient
  "T-0096": { art: "patient", kennung: "P-2026-0043" }, // KLV-Zuschlag Wundpflege
  "T-0097": { art: "patient", kennung: "P-2026-0047" }, // Medikamentenplan
  "T-0098": { art: "patient", kennung: "P-2026-0048" }, // Adresse aktualisiert
};

/** Ersteller der system-generierten Rhythmus-Tickets (Verweis auf Benutzerin). */
const RHYTHMUS_ERSTELLER: Person = { name: "Maria Keller", initialen: "MK", color: "#4F46E5" };
const NICHT_ZUGEWIESEN: Person = { name: "Nicht zugewiesen", initialen: "" };

export const WORKFLOW_TYPES: { id: WorkflowTyp; label: string }[] = [
  { id: "SRK_ANMELDUNG", label: "SRK-Anmeldung" },
  { id: "RE_ASSESSMENT", label: "Re-Assessment" },
  { id: "AUSWEIS_B_ANMELDUNG", label: "Ausweis B" },
  { id: "QUELLENSTEUER_ANMELDUNG", label: "Quellensteuer" },
  { id: "KINDERZULAGEN_ANTRAG", label: "Kinderzulagen" },
  { id: "LOHNANPASSUNG_NACH_SRK", label: "Lohnanpassung" },
];

export const TICKET_TYPES: { id: TicketTyp; label: string }[] = [
  { id: "SCHLUESSEL", label: "Schlüssel" },
  { id: "ANFRAGE", label: "Anfrage" },
  { id: "PROBLEM", label: "Problem" },
  { id: "MELDUNG", label: "Meldung" },
];

function toUnifiedWorkflow(t: WorkflowTask): UnifiedEntry {
  const entry: UnifiedEntry = {
    id: t.id,
    quelle: "workflow",
    typ: t.typ,
    typLabel: workflowTypLabel[t.typ],
    pendenzTyp: workflowToPendenzTyp[t.typ],
    personBezug: PERSONEN_BEZUG[t.id],
    betreff: t.titel,
    kontext: t.kontext,
    erstellt: t.erstellt,
    erstelltVon: t.verantwortlich,
    faellig: t.faellig,
    status: t.status,
    verantwortlich: t.verantwortlich,
    prioritaet: t.prioritaet,
    beschreibung: "",
  };
  entry.beschreibung = generateWorkflowBeschreibung(entry);
  return entry;
}

function toUnifiedTicket(t: ServiceTicket): UnifiedEntry {
  return {
    id: t.id,
    quelle: "ticket",
    typ: t.typ,
    typLabel: ticketTypLabel[t.typ],
    pendenzTyp: ticketToPendenzTyp[t.typ],
    personBezug: PERSONEN_BEZUG[t.id],
    betreff: t.titel,
    kontext: t.kontext,
    erstellt: t.erstellt,
    erstelltVon: t.erstelltVon,
    faellig: t.faellig,
    status: t.status,
    verantwortlich: t.verantwortlich,
    prioritaet: t.prioritaet,
    beschreibung: t.beschreibung,
  };
}

function toUnifiedRhythmus(t: RhythmusTicket): UnifiedEntry {
  return {
    id: t.id,
    quelle: "rhythmus",
    typ: "RE_ASSESSMENT" as WorkflowTyp, // closest existing type for routing
    typLabel: t.label,
    pendenzTyp: "betreuungs-rhythmus",
    personBezug: { art: t.subjektTyp, kennung: t.subjektId },
    betreff: t.label,
    kontext: t.label,
    erstellt: t.faelligAm, // best available
    erstelltVon: RHYTHMUS_ERSTELLER,
    faellig: t.faelligAm,
    status: t.status === "erledigt" ? "erledigt" : "offen",
    verantwortlich: t.zugewiesenAn
      ? { name: t.zugewiesenAn, initialen: t.zugewiesenAn.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2), color: "#1F5C4D" }
      : NICHT_ZUGEWIESEN,
    prioritaet: t.status === "ueberfaellig" ? "hoch" : "mittel",
    beschreibung: `Betreuungs-Rhythmus: ${t.label}, fällig am ${t.faelligAm}.`,
  };
}

/** Dynamisch: enthält Rhythmus-Tickets die zur Laufzeit generiert werden */
export function getUnifiedEntries(): UnifiedEntry[] {
  const rhythmusTickets = getAlleTickets().filter(t => t.status !== "erledigt");
  return [
    ...workflowTasks.map(toUnifiedWorkflow),
    ...serviceTickets.map(toUnifiedTicket),
    ...rhythmusTickets.map(toUnifiedRhythmus),
  ];
}

/** Statisch (Legacy-Kompatibilität) — enthält KEINE Rhythmus-Tickets */
export const unifiedEntries: UnifiedEntry[] = [
  ...workflowTasks.map(toUnifiedWorkflow),
  ...serviceTickets.map(toUnifiedTicket),
];

/** Aufgelöster Personenname (nie gespeichert). */
export function entryPersonName(e: UnifiedEntry): string {
  return personName(e.personBezug);
}

/** Betreff = die Sache. */
export function entryBetreff(e: UnifiedEntry): string {
  return e.betreff;
}

/**
 * Rückwärtskompatibler Titel für Anna/Übersichten: der aufgelöste Personenname.
 * (Die Pendenzenliste selbst nutzt entryBetreff + entryPersonName getrennt.)
 */
export function entryTitle(e: UnifiedEntry): string {
  return personName(e.personBezug);
}

export function countOpenByWorkflowTyp(typ: WorkflowTyp): number {
  return workflowTasks.filter((t) => t.typ === typ && t.status === "offen").length;
}

export { CURRENT_USER, MY_TEAM, workflowTypLabel, ticketTypLabel };
export type { WorkflowTyp, TicketTyp, Person, Prioritaet };
export type { PendenzTyp };
export type { PersonenBezug };
