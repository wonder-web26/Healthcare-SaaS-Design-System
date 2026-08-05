/**
 * Anna Sidebar context detection and greeting generators.
 * Each route/entity combination gets its own greeting + quick replies.
 */
import { getPatienten, tageBisReAssessment } from "../../lib/patienten/store";
import { fallById, patientAnzeigeName } from "../../lib/onboarding/faelle";
import { getAngehoerige } from "../../lib/angehoerige/store";
import { unifiedEntries, entryTitle, CURRENT_USER } from "../../lib/mocks/service-desk-unified";
import { pendenzTypen } from "../../types/pendenz";

const TODAY = "2026-03-03";
const MOCK_HOUR = 8;

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

export type AnnaContext =
  | { type: "startseite" }
  | { type: "onboarding-liste" }
  | { type: "onboarding-detail"; mandatId: string }
  | { type: "patient-liste" }
  | { type: "patient-detail"; patientId: string }
  | { type: "angehoerige-liste" }
  | { type: "angehoerige-detail"; angehoerigeId: string }
  | { type: "pendenzen-liste" }
  | { type: "pendenz-detail"; pendenzId: string }
  | { type: "unbekannt" };

export interface AnnaQuickReply {
  id: string;
  label: string;
  prompt: string;
}

export interface AnnaContextResult {
  greeting: string;
  quickReplies: AnnaQuickReply[];
  contextLabel: string;
}

/* ══════════════════════════════════════════
   CONTEXT DETECTION
   ══════════════════════════════════════════ */

export function detectContext(pathname: string, searchParams?: URLSearchParams): AnnaContext {
  // Pendenz detail (servicedesk with selected id)
  if (pathname === "/servicedesk" && searchParams?.get("id")) {
    return { type: "pendenz-detail", pendenzId: searchParams.get("id")! };
  }
  if (pathname === "/servicedesk") return { type: "pendenzen-liste" };

  // Onboarding
  if (pathname.startsWith("/onboarding/") && pathname !== "/onboarding/neu") {
    const mandatId = pathname.split("/onboarding/")[1];
    return { type: "onboarding-detail", mandatId };
  }
  if (pathname === "/onboarding" || pathname === "/onboarding/neu") return { type: "onboarding-liste" };

  // Patient
  if (pathname.startsWith("/patienten/")) {
    const patientId = pathname.split("/patienten/")[1];
    return { type: "patient-detail", patientId };
  }
  if (pathname === "/patienten") return { type: "patient-liste" };

  // Angehörige
  if (pathname.startsWith("/angehoerige/")) {
    const angehoerigeId = pathname.split("/angehoerige/")[1];
    return { type: "angehoerige-detail", angehoerigeId };
  }
  if (pathname === "/angehoerige") return { type: "angehoerige-liste" };

  // Dashboard / Startseite
  if (pathname === "/" || pathname === "/dashboard") return { type: "startseite" };

  return { type: "unbekannt" };
}

export function getContextLabel(ctx: AnnaContext): string {
  switch (ctx.type) {
    case "startseite": return "Startseite";
    case "onboarding-liste": return "Onboarding";
    case "onboarding-detail": return "Onboarding-Detail";
    case "patient-liste": return "Patientenliste";
    case "patient-detail": return "Patient-Detail";
    case "angehoerige-liste": return "Angehörige";
    case "angehoerige-detail": return "Angehörigen-Detail";
    case "pendenzen-liste": return "Pendenzenliste";
    case "pendenz-detail": return "Pendenz-Detail";
    default: return "Allgemein";
  }
}

/* ══════════════════════════════════════════
   GREETING GENERATORS
   ══════════════════════════════════════════ */

function greeting(): string {
  if (MOCK_HOUR < 11) return "Guten Morgen";
  if (MOCK_HOUR < 17) return "Guten Tag";
  return "Guten Abend";
}

export function generateContextResult(ctx: AnnaContext): AnnaContextResult {
  const label = getContextLabel(ctx);

  switch (ctx.type) {
    case "startseite": return generateStartseite();
    case "onboarding-liste": return generateOnboardingListe();
    case "onboarding-detail": return generateOnboardingDetail(ctx.mandatId);
    case "patient-liste": return generatePatientListe();
    case "patient-detail": return generatePatientDetail(ctx.patientId);
    case "angehoerige-liste": return generateAngehoerigeListe();
    case "angehoerige-detail": return generateAngehoerigeDetail(ctx.angehoerigeId);
    case "pendenzen-liste": return generatePendenzenListe();
    case "pendenz-detail": return generatePendenzDetail(ctx.pendenzId);
    default: return { greeting: `${greeting()}! Wie kann ich dir helfen?`, quickReplies: [{ id: "help", label: "Was kannst du?", prompt: "Was kannst du alles?" }], contextLabel: label };
  }
}

/* ── Startseite ── */
function generateStartseite(): AnnaContextResult {
  const myOverdue = unifiedEntries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.faellig && e.faellig < TODAY && e.status !== "erledigt");
  const criticalPatients = getPatienten().filter(p => p.schweregrad === "schwer" || p.schweregrad === "kritisch");
  const parts: string[] = [`${greeting()}! `];
  if (myOverdue.length > 0) parts.push(`Du hast {{danger}}${myOverdue.length} überfällige Pendenzen{{/danger}}.`);
  if (criticalPatients.length > 0) parts.push(`{{warning}}${criticalPatients.length} Patienten${criticalPatients.length > 1 ? "" : ""} im Schweregrad Schwer oder Kritisch.{{/warning}}`);
  parts.push("Wo möchtest du starten?");
  return {
    greeting: parts.join(" "),
    quickReplies: [
      { id: "today", label: "Was ist heute wichtig?", prompt: "Was ist heute am wichtigsten?" },
      { id: "overdue", label: "Überfällige Pendenzen", prompt: "Zeig mir meine überfälligen Pendenzen" },
      { id: "attention", label: "Patienten mit Aufmerksamkeit", prompt: "Welche Patienten brauchen Aufmerksamkeit?" },
    ],
    contextLabel: "Startseite",
  };
}

/* ── Onboarding-Liste ── */
function generateOnboardingListe(): AnnaContextResult {
  const blocked = 2; // mock
  return {
    greeting: `8 aktive Onboardings in der Pipeline. {{danger}}${blocked} sind blockiert{{/danger}} – meistens fehlende Spezialbewilligung. Was möchtest du wissen?`,
    quickReplies: [
      { id: "blocked", label: "Warum sind die 2 blockiert?", prompt: "Warum sind die 2 Onboardings blockiert?" },
      { id: "fast", label: "Fast abgeschlossene", prompt: "Welche Onboardings sind fast abgeschlossen?" },
      { id: "who", label: "Wer ist verantwortlich?", prompt: "Wer ist verantwortlich für welches Mandat?" },
    ],
    contextLabel: "Onboarding",
  };
}

/* ── Onboarding-Detail ──
   Namen stammen aus dem Fallverzeichnis (lib/onboarding/faelle.ts). Zuvor lag
   hier ein eigenes Verzeichnis mit zwei Einträgen auf Kennungen, die es dort
   nicht gibt; es traf nie, und Anna nannte durchgehend die Kennung. Ohne Fall
   — neu begonnenes oder unbekanntes Onboarding — bleibt es bei der Kennung. */
function generateOnboardingDetail(mandatId: string): AnnaContextResult {
  const fall = fallById(mandatId);
  const patient = fall ? patientAnzeigeName(fall) : mandatId;
  return {
    greeting: `Wir sind beim Onboarding von ${patient}. ${fall ? `Angehörige/r ist ${fall.angehoeriger}.` : ""} Wie kann ich helfen?`,
    quickReplies: [
      { id: "fields", label: "Welche Felder sind noch offen?", prompt: "Welche Felder sind noch offen?" },
      { id: "next", label: "Was sind die nächsten Schritte?", prompt: "Was sind die nächsten Schritte in diesem Onboarding?" },
      { id: "ahv", label: "AHV-Nummer validieren", prompt: "Wie validiere ich die AHV-Nummer?" },
    ],
    contextLabel: "Onboarding-Detail",
  };
}

/* ── Patient-Liste ── */
function generatePatientListe(): AnnaContextResult {
  const critical = getPatienten().filter(p => p.schweregrad === "schwer" || p.schweregrad === "kritisch");
  const overdueTasks = getPatienten().filter(p => p.prozessStatus?.ueberfaellig);
  const parts: string[] = [`${getPatienten().length} aktive Patienten.`];
  if (critical.length > 0) parts.push(`{{warning}}${critical.length} mit Schweregrad Schwer oder Kritisch.{{/warning}}`);
  if (overdueTasks.length > 0) parts.push(`{{danger}}${overdueTasks.length} haben überfällige Tasks.{{/danger}}`);
  return {
    greeting: parts.join(" "),
    quickReplies: [
      { id: "attention", label: "Wer braucht Aufmerksamkeit?", prompt: "Welche Patienten brauchen Aufmerksamkeit?" },
      { id: "reassess", label: "Re-Assessments diese Woche", prompt: "Zeig mir die Re-Assessments dieser Woche" },
      { id: "overdue", label: "Überfällige Tasks", prompt: "Wer hat überfällige Tasks?" },
    ],
    contextLabel: "Patientenliste",
  };
}

/* ── Patient-Detail ── */
function generatePatientDetail(patientId: string): AnnaContextResult {
  const p = getPatienten().find(x => x.id === patientId);
  if (!p) return { greeting: "Ich kann diesen Patienten nicht finden.", quickReplies: [], contextLabel: "Patient-Detail" };
  const name = `${p.vorname} ${p.nachname}`;
  const parts: string[] = p.schweregrad
    ? [`Wir schauen ${name} an. Schweregrad „${p.schweregrad[0].toUpperCase() + p.schweregrad.slice(1)}".`]
    : [`Wir schauen ${name} an.`];
  if (p.prozessStatus?.ueberfaellig) parts.push(`{{danger}}${p.prozessStatus.naechsteAufgabe} ist überfällig.{{/danger}}`);
  const reAssessmentTage = tageBisReAssessment(p);
  if (reAssessmentTage !== null && reAssessmentTage <= 14) parts.push(`{{warning}}Re-Assessment in ${reAssessmentTage} Tagen.{{/warning}}`);
  return {
    greeting: parts.join(" "),
    quickReplies: [
      { id: "reassess", label: "Wann ist das Re-Assessment?", prompt: "Wann ist das nächste Re-Assessment?" },
      { id: "workflow", label: "Offene Workflow-Schritte", prompt: "Welche Workflow-Schritte sind offen?" },
      { id: "allergies", label: "Allergien", prompt: "Welche Allergien hat der Patient?" },
    ],
    contextLabel: "Patient-Detail",
  };
}

/* ── Angehörige-Liste ── */
function generateAngehoerigeListe(): AnnaContextResult {
  const srkOffen = getAngehoerige().filter(a => a.srkZertifikatVorhanden !== "ja");
  const parts: string[] = [`${getAngehoerige().length} aktive Angehörige.`];
  if (srkOffen.length > 0) parts.push(`{{danger}}${srkOffen.length} Compliance-Themen offen{{/danger}} – ausstehende SRK-Anmeldungen.`);
  return {
    greeting: parts.join(" "),
    quickReplies: [
      { id: "srk", label: "Welche SRK fehlen?", prompt: "Welche SRK-Anmeldungen fehlen?" },
      { id: "probezeit", label: "Probezeit-Enden", prompt: "Bei wem läuft die Probezeit ab?" },
      { id: "compliance", label: "Compliance-Status", prompt: "Wie ist der Compliance-Status insgesamt?" },
    ],
    contextLabel: "Angehörige",
  };
}

/* ── Angehörige-Detail ── */
function generateAngehoerigeDetail(angehoerigeId: string): AnnaContextResult {
  const a = getAngehoerige().find(x => x.id === angehoerigeId);
  if (!a) return { greeting: "Ich kann diese/n Angehörige/n nicht finden.", quickReplies: [], contextLabel: "Angehörigen-Detail" };
  const name = `${a.vorname} ${a.nachname}`;
  const patient = a.zugeordnetePatientenList[0]?.name || "–";
  const parts: string[] = [`Wir schauen ${name} an. Pflegende/r Angehörige/r für ${patient}.`];
  if (a.srkZertifikatVorhanden !== "ja") parts.push(`{{warning}}SRK-Zertifikat fehlt.{{/warning}}`);
  if (!a.hrCheck.bankdaten) parts.push(`{{warning}}Bankdaten fehlen im HR-Check.{{/warning}}`);
  return {
    greeting: parts.join(" "),
    quickReplies: [
      { id: "srk", label: "SRK-Status", prompt: "Wie ist der SRK-Status?" },
      { id: "stempel", label: "Stempeltage", prompt: "Wie viele Stempeltage fehlen noch?" },
      { id: "schritte", label: "Monatliche Schritte", prompt: "Status der monatlichen Schritte" },
    ],
    contextLabel: "Angehörigen-Detail",
  };
}

/* ── Pendenzen-Liste ── */
function generatePendenzenListe(): AnnaContextResult {
  const myPendenzen = unifiedEntries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.status !== "erledigt");
  const myOverdue = myPendenzen.filter(e => e.faellig && e.faellig < TODAY);
  const parts: string[] = [`Du hast ${myPendenzen.length} zugewiesene Pendenzen.`];
  if (myOverdue.length > 0) parts.push(`{{danger}}${myOverdue.length} davon überfällig.{{/danger}}`);
  return {
    greeting: parts.join(" "),
    quickReplies: [
      { id: "urgent", label: "Was ist am dringendsten?", prompt: "Was ist heute am dringendsten?" },
      { id: "overdue", label: "Überfällige zeigen", prompt: "Zeig mir die überfälligen Pendenzen" },
      { id: "sort", label: "Nach Dringlichkeit sortieren", prompt: "Sortier nach Dringlichkeit" },
    ],
    contextLabel: "Pendenzenliste",
  };
}

/* ── Pendenz-Detail ── */
function generatePendenzDetail(pendenzId: string): AnnaContextResult {
  const e = unifiedEntries.find(x => x.id === pendenzId);
  if (!e) return { greeting: "Ich kann diese Pendenz nicht finden.", quickReplies: [], contextLabel: "Pendenz-Detail" };
  const personName = entryTitle(e);
  const typDef = pendenzTypen[e.pendenzTyp];
  return {
    greeting: `Wir bearbeiten ${personName}s ${typDef?.label || e.typLabel}. Was möchtest du als nächstes tun?`,
    quickReplies: [
      { id: "howto", label: `Wie ${typDef?.label || "bearbeite ich das"}?`, prompt: `Wie funktioniert die ${typDef?.label || e.typLabel}?` },
      { id: "data", label: "Welche Daten brauche ich?", prompt: "Welche Personendaten brauche ich?" },
      { id: "frist", label: "Was passiert bei Fristversäumnis?", prompt: "Was passiert wenn ich die Frist verpasse?" },
    ],
    contextLabel: "Pendenz-Detail",
  };
}
