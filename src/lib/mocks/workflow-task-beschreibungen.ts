import type { WorkflowTyp } from "./workflow-tasks";
import type { UnifiedEntry } from "./service-desk-unified";

const templates: Record<WorkflowTyp, string> = {
  SRK_ANMELDUNG:
    "Für {person} muss der SRK-Pflegekurs angemeldet werden. {kontext}. Die Anmeldung erfolgt über das SRK-Kursportal. Der Kurs muss innerhalb eines Jahres nach Vertragsunterzeichnung absolviert werden – andernfalls werden die Leistungen pausiert.",
  RE_ASSESSMENT:
    "Bei {person} ist ein Re-Assessment fällig. {kontext}. Bitte Pflegestufe überprüfen und ggf. anpassen.",
  AUSWEIS_B_ANMELDUNG:
    "Für {person} wurde die Aufenthaltsbewilligung B erteilt. {kontext}. Die Anmeldung beim Migrationsamt muss innerhalb der gesetzlichen Meldefrist erfolgen.",
  QUELLENSTEUER_ANMELDUNG:
    "Für {person} muss die Quellensteuer angemeldet werden. {kontext}. Die Anmeldung erfolgt online über das Kantonsportal.",
  KINDERZULAGEN_ANTRAG:
    "Für {person} ist ein Kinderzulagen-Antrag einzureichen. {kontext}. Die Ausgleichskasse benötigt die Geburtsurkunden sowie den Arbeitsvertrag.",
  LOHNANPASSUNG_NACH_SRK:
    "{person} hat den SRK-Pflegekurs bestanden. {kontext}. Die Lohnanpassung gemäss Tarifordnung muss durchgeführt werden. Neuer Stundenlohn-Satz: gemäss Personalreglement.",
};

export function generateWorkflowBeschreibung(entry: UnifiedEntry): string {
  const template = templates[entry.typ as WorkflowTyp];
  if (!template) return "";
  return template
    .replace(/\{person\}/g, entry.person?.name || "—")
    .replace(/\{kontext\}/g, entry.kontext || "—");
}
