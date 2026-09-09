import { workflowTasks, workflowTypLabel, CURRENT_USER, MY_TEAM, type WorkflowTask, type WorkflowTyp, type Person, type Prioritaet } from "./workflow-tasks";
import { serviceTickets, ticketTypLabel, type ServiceTicket, type TicketTyp } from "./service-tickets";
import { generateWorkflowBeschreibung } from "./workflow-task-beschreibungen";
import { getAlleTickets, type RhythmusTicket } from "../rhythmus/engine";
import { personName, type PersonenBezug } from "./personen-aufloesung";
import type { PendenzTyp } from "../../types/pendenz";

export type Quelle = "workflow" | "ticket" | "rhythmus" | "manuell";

export interface UnifiedEntry {
  id: string;
  quelle: Quelle;
  typ: WorkflowTyp | TicketTyp | "MANUELL";
  typLabel: string;
  pendenzTyp: PendenzTyp;
  /** Typisierter Personenbezug (Art + Kennung). Der Name wird zur Anzeigezeit
   *  aufgelöst (personName), nie hier gespeichert. Bei automatisch erzeugten
   *  Pendenzen Pflicht; manuell erstellte dürfen ohne Person existieren (null). */
  personBezug: PersonenBezug | null;
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
  /* ── Herkunft im Onboarding ───────────────────────────────────────────────
     Drei optionale Felder. Optional, weil der Bestand sie nicht trägt: eine
     Pendenz ohne diese Angaben verhält sich exakt wie bisher. */
  /** Der Vorgang, aus dem die Pendenz entstanden ist. Trägt die Onboarding-
   *  Kennung und ist der einzige Weg, Pendenzen eines Onboardings zu finden —
   *  `personBezug` zeigt auf die Person, nicht auf den Vorgang. */
  ursprung?: UrsprungBezug;
  /** Sprungziel im Formular, Muster `<schritt>.<reiter>` (siehe ABSCHNITTE).
   *  Fehlt es, ist der Eintrag in der linken Spalte nicht klickbar. */
  abschnitt?: OnboardingAbschnitt;
  /** Diese Pendenz sperrt den Vertragsschritt. Ersetzt die Laufzeitprüfung
   *  (`vertragFreigabe`) nicht, hält aber fest, WELCHE Pendenz sperrt. */
  sperrtVertrag?: boolean;
  /** Abschlusstext einer erledigten Pendenz — Datum und handelnde Person.
   *  Trägt den zweiten Zustand des Markers. */
  abschlussText?: string;
  /** Wie die Pendenz geschlossen wurde. Der Unterschied ist festgehalten, nicht
   *  nur im Verlaufstext lesbar. */
  abschlussGrund?: "erledigt" | "gegenstandslos";
  /** Verlauf der Pendenz. Liegt am Datensatz, nicht in einer Ansicht — sonst
   *  wäre er beim Verlassen der Seite weg. Chronologisch aufsteigend. */
  verlauf?: VerlaufEintrag[];
}

/* ── Verlauf ───────────────────────────────────────────────────────────────
   Unverändert aus ServiceDeskPage hierher gezogen: der Verlauf gehört zum
   Datensatz, nicht zu einer Ansicht. */
export type VerlaufTyp = "erstellt" | "status" | "zuweisung" | "kommentar" | "feld";

export interface VerlaufEintrag {
  typ: VerlaufTyp; by: string; at: string;
  text?: string;                     // erstellt / kommentar
  feld?: string; feldLabel?: string; // Feldänderung
  alt?: string; neu?: string; freitext?: boolean;
}

/** Vorgang, aus dem eine Pendenz stammt. Heute nur das Onboarding. */
export type UrsprungBezug = { art: "onboarding"; kennung: string };

/**
 * Formularabschnitte des Onboardings — geschlossene Liste, Muster
 * `<schritt>.<reiter>`. Die Werte entsprechen den bestehenden Schritt- und
 * Reiterschlüsseln; es kommt kein neuer Reiter dazu.
 */
export const ONBOARDING_ABSCHNITTE = [
  "angehoeriger.personalien",
  "angehoeriger.steuer",
  "angehoeriger.partner",
  "angehoeriger.kinder",
  "angehoeriger.anstellung",
  "angehoeriger.dokumente",
  "patient.personalien",
  "patient.steuer",
  "patient.wohnen",
  "patient.anamnese",
  "patient.dokumente",
] as const;

export type OnboardingAbschnitt = typeof ONBOARDING_ABSCHNITTE[number];

/** Schritt und Reiter eines Abschnitts — eine Stelle, kein Aufteilen beim Aufrufer. */
export function abschnittTeile(a: OnboardingAbschnitt): { schritt: string; reiter: string } {
  const [schritt, reiter] = a.split(".");
  return { schritt, reiter };
}

/** Offene Pendenzen eines Onboardings — sperrende zuerst, dann nach Fälligkeit. */
export function pendenzenFuerOnboarding(alle: UnifiedEntry[], kennung: string): UnifiedEntry[] {
  return alle
    .filter(e => e.status !== "erledigt" && e.ursprung?.art === "onboarding" && e.ursprung.kennung === kennung)
    .sort((a, b) => {
      const as = a.sperrtVertrag ? 0 : 1;
      const bs = b.sperrtVertrag ? 0 : 1;
      if (as !== bs) return as - bs;
      // Ohne Termin ans Ende, unabhängig von der Richtung.
      if (!a.faellig && !b.faellig) return 0;
      if (!a.faellig) return 1;
      if (!b.faellig) return -1;
      return a.faellig.localeCompare(b.faellig);
    });
}

/** Maps legacy WorkflowTyp to typed PendenzTyp */
const workflowToPendenzTyp: Record<WorkflowTyp, PendenzTyp> = {
  SRK_ANMELDUNG: "srk-anmeldung",
  RE_ASSESSMENT: "re-assessment",
  AUSWEIS_B_ANMELDUNG: "ausweis-b-migrationsamt",
  QUELLENSTEUER_ANMELDUNG: "quellensteuer",
  KINDERZULAGEN_ANTRAG: "kinderzulagen",
  LOHNANPASSUNG_NACH_SRK: "lohn-anpassung",
  AUSLAENDERRECHT_UNGEKLAERT: "compliance-audit",
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
  /* Aufgaben mit Onboarding-Herkunft (Fall OB-2026-101) — betroffen ist die
     angehörige Person Vera Steiner. Ohne Eintrag hier bliebe personBezug
     undefined und die Beschreibungserzeugung bräche ab. */
  "W-0160": { art: "angehoeriger", kennung: "A-2026-0101" },
  "W-0161": { art: "angehoeriger", kennung: "A-2026-0101" },
  "W-0162": { art: "angehoeriger", kennung: "A-2026-0101" },
  "W-0163": { art: "angehoeriger", kennung: "A-2026-0101" },
  "W-0164": { art: "angehoeriger", kennung: "A-2026-0102" },
  "W-0165": { art: "angehoeriger", kennung: "A-2026-0103" },
  "W-0166": { art: "angehoeriger", kennung: "A-2026-0103" },
  "W-0167": { art: "angehoeriger", kennung: "A-2026-0104" },
  "W-0168": { art: "angehoeriger", kennung: "A-2026-0104" },
  "W-0169": { art: "angehoeriger", kennung: "A-2026-0105" },
  "W-0170": { art: "angehoeriger", kennung: "A-2026-0106" },
  "W-0171": { art: "angehoeriger", kennung: "A-2026-0106" },
  "W-0172": { art: "angehoeriger", kennung: "A-2026-0108" },
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

/**
 * Einheitliches Kennungs-Präfix für alle Pendenzen. Die Quellen tragen heute
 * verschiedene Präfixe (Workflow "W-"/"W-BEWB-"/…, Tickets "T-", Rhythmus "rt-");
 * nach aussen erhält jede Pendenz die Kennung "PD-…". Die Quell-Ids bleiben
 * intern unverändert (Zuordnungstabelle, Rhythmus-Engine).
 */
function vereinheitlicheId(rohId: string): string {
  return `PD-${rohId.replace(/^(W|T|rt|ri)-/, "")}`;
}

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
    id: vereinheitlicheId(t.id),
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
    // Herkunft im Onboarding — unveraendert durchgereicht, nichts abgeleitet.
    ursprung: t.ursprungOnboarding ? { art: "onboarding", kennung: t.ursprungOnboarding } : undefined,
    abschnitt: t.abschnitt as OnboardingAbschnitt | undefined,
    sperrtVertrag: t.sperrtVertrag,
    abschlussText: t.abschlussText,
  };
  entry.beschreibung = generateWorkflowBeschreibung(entry);
  return entry;
}

function toUnifiedTicket(t: ServiceTicket): UnifiedEntry {
  return {
    id: vereinheitlicheId(t.id),
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
    id: vereinheitlicheId(t.id),
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

/* ── Manuell erstellte Pendenzen (Lauf «Pendenzen erstellen») ──
   In-Memory-Bestand des Prototyps (keine Persistenz). Herkunft ist die
   erstellende Person + Zeitpunkt (erstelltVon/erstellt, quelle "manuell");
   automatisch erzeugte tragen stattdessen ihren Auslöser (quelle). */
const manuelleEintraege: UnifiedEntry[] = [];
let manuellLaufnummer = 1;

export interface NeuePendenzFelder {
  betreff: string;
  pendenzTyp: PendenzTyp;
  pendenzTypLabel: string;
  faellig: string; // ISO
  beschreibung?: string;
  personBezug?: PersonenBezug | null;
  verantwortlich?: Person | null;
  prioritaet?: Prioritaet;
  erstelltVon: Person;
  erstelltAm: string; // ISO
}

/** Erzeugt eine manuelle Pendenz. Status ist immer "offen" — keine Auswahl. */
export function erstelleManuellePendenz(f: NeuePendenzFelder): UnifiedEntry {
  const entry: UnifiedEntry = {
    id: `PD-M${String(manuellLaufnummer++).padStart(3, "0")}`,
    quelle: "manuell",
    typ: "MANUELL",
    typLabel: f.pendenzTypLabel,
    pendenzTyp: f.pendenzTyp,
    personBezug: f.personBezug ?? null,
    betreff: f.betreff,
    kontext: f.beschreibung ?? "",
    erstellt: f.erstelltAm,
    erstelltVon: f.erstelltVon,
    faellig: f.faellig,
    status: "offen",
    verantwortlich: f.verantwortlich ?? NICHT_ZUGEWIESEN,
    prioritaet: f.prioritaet ?? "mittel",
    beschreibung: f.beschreibung ?? "",
  };
  manuelleEintraege.push(entry);
  return entry;
}

/** Dynamisch: enthält Rhythmus-Tickets die zur Laufzeit generiert werden */
export function getUnifiedEntries(): UnifiedEntry[] {
  /* Erledigte tragen niemand mehr auf; entfallene ebenso wenig — ihr Subjekt
     ist weggefallen. Ein entfallenes Ticket hier als „offen" zu führen, wäre
     eine Pendenz, die niemand erfüllen kann. */
  const rhythmusTickets = getAlleTickets()
    .filter(t => t.status !== "erledigt" && t.status !== "entfallen");
  return [
    ...workflowTasks.map(toUnifiedWorkflow),
    ...serviceTickets.map(toUnifiedTicket),
    ...rhythmusTickets.map(toUnifiedRhythmus),
    ...manuelleEintraege,
  ];
}

/** Statisch (Legacy-Kompatibilität) — enthält KEINE Rhythmus-Tickets */
export const unifiedEntries: UnifiedEntry[] = [
  ...workflowTasks.map(toUnifiedWorkflow),
  ...serviceTickets.map(toUnifiedTicket),
];

/** Aufgelöster Personenname (nie gespeichert); ohne Personenbezug ein stiller Strich. */
export function entryPersonName(e: UnifiedEntry): string {
  return e.personBezug ? personName(e.personBezug) : "–";
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
  return e.personBezug ? personName(e.personBezug) : e.betreff;
}

export function countOpenByWorkflowTyp(typ: WorkflowTyp): number {
  return workflowTasks.filter((t) => t.typ === typ && t.status === "offen").length;
}

export { CURRENT_USER, MY_TEAM, workflowTypLabel, ticketTypLabel };
export type { WorkflowTyp, TicketTyp, Person, Prioritaet };
export type { PendenzTyp };
export type { PersonenBezug };
