import { workflowTasks, workflowTypLabel, type WorkflowTask, type WorkflowTyp } from "./workflow-tasks";
import { serviceTickets, ticketTypLabel, type ServiceTicket, type TicketTyp } from "./service-tickets";

export type Quelle = "workflow" | "ticket";

export interface UnifiedEntry {
  id: string;
  quelle: Quelle;
  typ: WorkflowTyp | TicketTyp;
  typLabel: string;
  titel: string;
  kontext: string;
  betroffenePerson: { name: string; initialen: string } | null;
  erstellt: string;
  faellig: string | null;
  status: "offen" | "in_bearbeitung" | "erledigt";
  verantwortlich: { name: string; initialen: string };
}

export const allWorkflowTypen: WorkflowTyp[] = [
  "SRK_ANMELDUNG", "RE_ASSESSMENT", "AUSWEIS_B_ANMELDUNG",
  "QUELLENSTEUER_ANMELDUNG", "KINDERZULAGEN_ANTRAG", "LOHNANPASSUNG_NACH_SRK",
];

export const allTicketTypen: TicketTyp[] = [
  "SCHLUESSEL", "ANFRAGE", "PROBLEM", "MELDUNG",
];

function toUnifiedWorkflow(t: WorkflowTask): UnifiedEntry {
  return {
    id: t.id,
    quelle: "workflow",
    typ: t.typ,
    typLabel: workflowTypLabel[t.typ],
    titel: t.titel,
    kontext: t.kontext,
    betroffenePerson: t.betroffenePerson,
    erstellt: t.erstellt,
    faellig: t.faellig,
    status: t.status,
    verantwortlich: t.verantwortlich,
  };
}

function toUnifiedTicket(t: ServiceTicket): UnifiedEntry {
  return {
    id: t.id,
    quelle: "ticket",
    typ: t.typ,
    typLabel: ticketTypLabel[t.typ],
    titel: t.titel,
    kontext: t.beschreibung,
    betroffenePerson: t.betroffenePerson,
    erstellt: t.erstellt,
    faellig: t.faellig,
    status: t.status,
    verantwortlich: t.verantwortlich,
  };
}

export const unifiedEntries: UnifiedEntry[] = [
  ...workflowTasks.map(toUnifiedWorkflow),
  ...serviceTickets.map(toUnifiedTicket),
];

export function countOpenByWorkflowTyp(typ: WorkflowTyp): number {
  return workflowTasks.filter((t) => t.typ === typ && t.status === "offen").length;
}

export { workflowTypLabel, ticketTypLabel };
export type { WorkflowTyp, TicketTyp };
