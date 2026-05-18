import type { UserRole } from "./user";

export type PendenzTyp =
  | "srk-anmeldung"
  | "quellensteuer"
  | "aub-vertretung"
  | "ausweis-b-migrationsamt"
  | "problem"
  | "anfrage"
  | "klv-verordnung"
  | "pflegestufen-wechsel"
  | "beschwerde"
  | "compliance-audit"
  | "personaldaten"
  | "lohn-anpassung"
  | "schluessel"
  | "meldung"
  | "re-assessment"
  | "kinderzulagen";

export type AnnaActionType = "open-url" | "copy-data" | "download-file" | "open-mailto" | "internal-action" | "demo-mock";

export interface AnnaAction {
  id: string;
  label: string;
  variant: "primary" | "secondary";
  isDemoMock?: boolean;
  type: AnnaActionType;
  payload?: Record<string, unknown>;
}

export interface BulkAction {
  label: string;
  description: string;
  resultDescription: string;
  isDemoMock: boolean;
}

export interface PendenzTypDefinition {
  id: PendenzTyp;
  label: string;
  description: string;
  responsibleRole: UserRole | UserRole[];
  annaStage: "A" | "B" | "C";
  isDemoMock: boolean;
  pillBg: string;
  pillColor: string;
  annaPromptTemplate?: string;
  annaFallbackText?: string;
  defaultActions?: AnnaAction[];
  bulkAction?: BulkAction;
}

export const pendenzTypen: Record<PendenzTyp, PendenzTypDefinition> = {
  /* ── Top 6: full Anna config ── */

  "srk-anmeldung": {
    id: "srk-anmeldung",
    label: "SRK-Anmeldung",
    description: "Anmeldung zum SRK-Pflegekurs für einen Angehörigen",
    responsibleRole: "backoffice",
    annaStage: "B",
    isDemoMock: false,
    pillBg: "var(--status-info-bg)",
    pillColor: "var(--status-info)",
    annaPromptTemplate: "Bei {personName} ist die SRK-Anmeldung fällig. Der Vertrag startete am {vertragsstart}, die 1-Jahres-Frist endet am {srkFrist}. Ich habe alle Personendaten für die Anmeldung zusammengestellt.",
    annaFallbackText: "SRK-Anmeldung für {personName}. Anmeldefrist beachten.",
    defaultActions: [
      { id: "open-srk-portal", label: "SRK-Portal öffnen", variant: "primary", type: "open-url", payload: { url: "https://kursportal.srk.ch" } },
      { id: "copy-person-data", label: "Personendaten kopieren", variant: "secondary", type: "copy-data" },
    ],
    bulkAction: { label: "Personendaten zusammenstellen", description: "Alle Personendaten für die SRK-Anmeldungen vorbereiten", resultDescription: "{N} Datensätze werden zur Übertragung ins SRK-Portal vorbereitet", isDemoMock: false },
  },
  "quellensteuer": {
    id: "quellensteuer",
    label: "Quellensteuer",
    description: "Anmeldung bei der Quellensteuer-Behörde",
    responsibleRole: "backoffice",
    annaStage: "B",
    isDemoMock: false,
    pillBg: "var(--brand-primary-light)",
    pillColor: "var(--brand-primary)",
    annaPromptTemplate: "Quellensteuer-Anmeldung für {personName} beim kantonalen Steueramt Zürich, Tarif A. Ich habe das Anmeldeformular mit allen Daten vorbereitet.",
    annaFallbackText: "Quellensteuer-Anmeldung für {personName}.",
    defaultActions: [
      { id: "download-form", label: "Formular herunterladen", variant: "primary", type: "download-file", payload: { filename: "quellensteuer-anmeldung.pdf" } },
      { id: "open-mailto", label: "An Steueramt senden", variant: "secondary", type: "open-mailto", payload: { to: "quellensteuer@zh.ch", subject: "Quellensteuer-Anmeldung" } },
    ],
    bulkAction: { label: "Formulare vorbereiten", description: "Alle Quellensteuer-Anmeldeformulare mit den jeweiligen Daten generieren", resultDescription: "{N} PDFs werden generiert und zum Download bereitgestellt", isDemoMock: false },
  },
  "aub-vertretung": {
    id: "aub-vertretung",
    label: "AUB / Vertretung",
    description: "Arbeitsunfähigkeitsbescheinigung eingegangen, Vertretung nötig",
    responsibleRole: "diplomiert",
    annaStage: "C",
    isDemoMock: true,
    pillBg: "var(--status-danger-bg)",
    pillColor: "var(--status-danger)",
    annaPromptTemplate: "{personName} hat einen AUB für die nächsten 5 Arbeitstage. Ich habe 7 Termine geprüft. Drei Vertretungen sind verfügbar. {{warning}}Empfehlung: Karin Müller – sie passt zu allen Terminen und kennt die Patienten.{{/warning}}",
    annaFallbackText: "AUB von {personName} eingegangen. Vertretung organisieren.",
    defaultActions: [
      { id: "set-top-vertretung-demo", label: "Karin als Vertretung einsetzen", variant: "primary", isDemoMock: true, type: "demo-mock", payload: { mockType: "vertretung-einsetzen" } },
      { id: "choose-vertretung", label: "Andere Vertretung wählen", variant: "secondary", type: "internal-action", payload: { action: "open-vertretung-dialog" } },
    ],
  },
  "ausweis-b-migrationsamt": {
    id: "ausweis-b-migrationsamt",
    label: "Ausweis B",
    description: "Anmeldung beim Migrationsamt für Ausweis B",
    responsibleRole: "backoffice",
    annaStage: "B",
    isDemoMock: false,
    pillBg: "var(--status-warning-bg)",
    pillColor: "var(--status-warning-text)",
    annaPromptTemplate: "Aufenthaltsausweis B für {personName} erteilt. Die Meldefrist beträgt 30 Tage – Anmeldung beim Migrationsamt Zürich ist nötig.",
    annaFallbackText: "Aufenthaltsausweis B erteilt für {personName}, Anmeldung beim Migrationsamt nötig.",
    defaultActions: [
      { id: "prepare-form", label: "Anmeldeformular vorbereiten", variant: "primary", type: "download-file", payload: { filename: "migrationsamt-anmeldung.pdf" } },
      { id: "open-migrationsamt", label: "Migrationsamt öffnen", variant: "secondary", type: "open-url", payload: { url: "https://www.zh.ch/de/migration-integration.html" } },
    ],
    bulkAction: { label: "Anmeldungen vorbereiten", description: "Alle Migrationsamt-Anmeldungen mit den jeweiligen Daten generieren", resultDescription: "{N} Anmeldeformulare werden vorbereitet", isDemoMock: false },
  },
  "problem": {
    id: "problem",
    label: "Problem",
    description: "Gemeldetes Problem im Betrieb",
    responsibleRole: ["diplomiert", "backoffice"],
    annaStage: "A",
    isDemoMock: false,
    pillBg: "var(--status-danger-bg)",
    pillColor: "var(--status-danger)",
    annaPromptTemplate: "Ich habe das gemeldete Problem analysiert. {beschreibung}",
    annaFallbackText: "{beschreibung}",
    defaultActions: [
      { id: "take-over", label: "In Bearbeitung nehmen", variant: "primary", type: "internal-action", payload: { action: "set-in-bearbeitung" } },
    ],
  },
  "anfrage": {
    id: "anfrage",
    label: "Anfrage",
    description: "Allgemeine Anfrage",
    responsibleRole: ["diplomiert", "backoffice"],
    annaStage: "A",
    isDemoMock: false,
    pillBg: "var(--bg-secondary)",
    pillColor: "var(--text-secondary)",
    annaPromptTemplate: "{beschreibung}",
    annaFallbackText: "{beschreibung}",
    defaultActions: [
      { id: "take-over", label: "In Bearbeitung nehmen", variant: "primary", type: "internal-action", payload: { action: "set-in-bearbeitung" } },
    ],
  },

  /* ── Other types: no specific Anna config yet ── */

  "klv-verordnung": {
    id: "klv-verordnung",
    label: "KLV-Verordnung",
    description: "Verordnung für KLV-Leistungen läuft ab oder muss erneuert werden",
    responsibleRole: "diplomiert",
    annaStage: "B",
    isDemoMock: true,
    pillBg: "var(--status-warning-bg)",
    pillColor: "var(--status-warning-text)",
  },
  "pflegestufen-wechsel": {
    id: "pflegestufen-wechsel",
    label: "Pflegestufe",
    description: "Pflegestufen-Wechsel nach Reassessment",
    responsibleRole: "diplomiert",
    annaStage: "C",
    isDemoMock: true,
    pillBg: "var(--brand-accent-light)",
    pillColor: "var(--status-info)",
  },
  "beschwerde": {
    id: "beschwerde",
    label: "Beschwerde",
    description: "Beschwerde von Patient, Angehörigen oder Dritten",
    responsibleRole: ["diplomiert", "management"],
    annaStage: "B",
    isDemoMock: false,
    pillBg: "var(--status-danger-bg)",
    pillColor: "var(--status-danger)",
  },
  "compliance-audit": {
    id: "compliance-audit",
    label: "Compliance",
    description: "Compliance-Audit oder regulatorische Prüfung",
    responsibleRole: "management",
    annaStage: "C",
    isDemoMock: true,
    pillBg: "var(--status-warning-bg)",
    pillColor: "var(--status-warning-text)",
  },
  "personaldaten": {
    id: "personaldaten",
    label: "Personaldaten",
    description: "Personaldaten-Aktualisierung bei Angehörigen",
    responsibleRole: "backoffice",
    annaStage: "A",
    isDemoMock: false,
    pillBg: "var(--bg-secondary)",
    pillColor: "var(--text-secondary)",
  },
  "lohn-anpassung": {
    id: "lohn-anpassung",
    label: "Lohnanpassung",
    description: "Lohnanpassung nach SRK-Kurs oder Bewertung",
    responsibleRole: "backoffice",
    annaStage: "B",
    isDemoMock: false,
    pillBg: "var(--brand-primary-light)",
    pillColor: "var(--brand-primary)",
  },
  "schluessel": {
    id: "schluessel",
    label: "Schlüssel",
    description: "Schlüsselausgabe oder -rückgabe",
    responsibleRole: "backoffice",
    annaStage: "A",
    isDemoMock: false,
    pillBg: "var(--bg-secondary)",
    pillColor: "var(--text-secondary)",
  },
  "meldung": {
    id: "meldung",
    label: "Meldung",
    description: "Allgemeine Meldung oder Information",
    responsibleRole: ["diplomiert", "backoffice"],
    annaStage: "A",
    isDemoMock: false,
    pillBg: "var(--status-info-bg)",
    pillColor: "var(--status-info)",
  },
  "re-assessment": {
    id: "re-assessment",
    label: "Re-Assessment",
    description: "Regelmässiges Re-Assessment eines Patienten",
    responsibleRole: "diplomiert",
    annaStage: "B",
    isDemoMock: false,
    pillBg: "var(--brand-accent-light)",
    pillColor: "var(--status-info)",
  },
  "kinderzulagen": {
    id: "kinderzulagen",
    label: "Kinderzulagen",
    description: "Kinderzulagen-Antrag bei der Familienausgleichskasse",
    responsibleRole: "backoffice",
    annaStage: "A",
    isDemoMock: false,
    pillBg: "var(--bg-secondary)",
    pillColor: "var(--text-secondary)",
  },
};
