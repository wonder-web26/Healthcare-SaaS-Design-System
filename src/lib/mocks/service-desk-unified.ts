import { workflowTasks, workflowTypLabel, CURRENT_USER, MY_TEAM, type WorkflowTask, type WorkflowTyp, type Person, type Prioritaet } from "./workflow-tasks";
import { serviceTickets, ticketTypLabel, type ServiceTicket, type TicketTyp } from "./service-tickets";
import { generateWorkflowBeschreibung } from "./workflow-task-beschreibungen";

export type Quelle = "workflow" | "ticket";

export interface UnifiedEntry {
  id: string;
  quelle: Quelle;
  typ: WorkflowTyp | TicketTyp;
  typLabel: string;
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
