import { workflowTasks, workflowTypLabel, CURRENT_USER, MY_TEAM, type WorkflowTask, type WorkflowTyp, type Person, type Prioritaet } from "./workflow-tasks";
import { serviceTickets, ticketTypLabel, type ServiceTicket, type TicketTyp } from "./service-tickets";
import { generateWorkflowBeschreibung } from "./workflow-task-beschreibungen";
import { getAlleTickets, type RhythmusTicket } from "../rhythmus/engine";
import type { PendenzTyp } from "../../types/pendenz";

export type Quelle = "workflow" | "ticket" | "rhythmus";

export interface UnifiedEntry {
  id: string;
  quelle: Quelle;
  typ: WorkflowTyp | TicketTyp;
  typLabel: string;
  pendenzTyp: PendenzTyp;
  person: Person | null;
  titel?: string;
  kontext: string;
  erstellt: string;
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
    person: t.betroffenePerson,
    kontext: t.kontext,
    erstellt: t.erstellt,
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
    person: t.betroffenePerson,
    titel: t.titel,
    kontext: t.kontext,
    erstellt: t.erstellt,
    faellig: t.faellig,
    status: t.status,
    verantwortlich: t.verantwortlich,
    prioritaet: t.prioritaet,
    beschreibung: t.beschreibung,
  };
}

function toUnifiedRhythmus(t: RhythmusTicket): UnifiedEntry {
  const subjektLabel = t.subjektTyp === "angehoeriger" ? "Angehörige/r" : "Patient/in";
  return {
    id: t.id,
    quelle: "rhythmus",
    typ: "RE_ASSESSMENT" as WorkflowTyp, // closest existing type for routing
    typLabel: t.label,
    pendenzTyp: "betreuungs-rhythmus",
    person: { name: t.subjektName, initialen: t.subjektName.split(/[\s,]+/).filter(w => w.length > 0).map(w => w[0]).join("").toUpperCase().slice(0, 2) },
    kontext: `${subjektLabel}: ${t.subjektName} · ${t.label}`,
    erstellt: t.faelligAm, // best available
    faellig: t.faelligAm,
    status: t.status === "erledigt" ? "erledigt" : "offen",
    verantwortlich: { name: t.zugewiesenAn || "Nicht zugewiesen", initialen: (t.zugewiesenAn || "??").split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2), color: "#1F5C4D" },
    prioritaet: t.status === "ueberfaellig" ? "hoch" : "mittel",
    beschreibung: `Betreuungs-Rhythmus: ${t.label} für ${t.subjektName} (${subjektLabel}), fällig am ${t.faelligAm}.`,
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

export function entryTitle(e: UnifiedEntry): string {
  if (e.person) return e.person.name;
  return e.titel || "—";
}

export function countOpenByWorkflowTyp(typ: WorkflowTyp): number {
  return workflowTasks.filter((t) => t.typ === typ && t.status === "offen").length;
}

export { CURRENT_USER, MY_TEAM, workflowTypLabel, ticketTypLabel };
export type { WorkflowTyp, TicketTyp, Person, Prioritaet };
export type { PendenzTyp };
