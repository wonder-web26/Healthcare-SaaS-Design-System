import { getPatienten, tageBisReAssessment } from "../../lib/patienten/store";
import { angehoerige } from "../components/angehoerigeData";
import { unifiedEntries, entryTitle, CURRENT_USER } from "../../lib/mocks/service-desk-unified";

export interface AnnaMessage {
  role: "anna" | "user";
  text: string;
  cards?: AnnaCard[];
  navAction?: string;
  chips?: string[];
  closing?: string;
}

export interface AnnaCard {
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

interface MatchRule {
  patterns: RegExp[];
  handler: (match: RegExpMatchArray, query: string, context: string) => AnnaMessage;
}

const TODAY = "2026-03-03";
const MOCK_HOUR = 8;

function formatCount(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function getGreeting(): string {
  if (MOCK_HOUR < 11) return "Guten Morgen";
  if (MOCK_HOUR < 17) return "Guten Tag";
  return "Guten Abend";
}

// ── Daily summary ──

export function generateDailySummary(): AnnaMessage {
  const myOverdue = unifiedEntries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.faellig && e.faellig < TODAY && e.status !== "erledigt");
  const myToday = unifiedEntries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.faellig === TODAY && e.status !== "erledigt");
  const allMine = [...myOverdue, ...myToday].slice(0, 4);

  const cards: AnnaCard[] = [
    { id: "task-1", title: "Monika Brunners Einstufung ist überfällig", subtitle: "Seit 3 Tagen · Pflegestufe abgelaufen", path: "/servicedesk?id=W-0145" },
    { id: "task-2", title: "Hans Kellers KLV-Kontrolle freigeben", subtitle: "Seit 5 Tagen offen · blockiert Aktivierung", path: "/servicedesk?id=W-0146" },
    { id: "task-3", title: "Ruth Fischers Verordnung läuft ab", subtitle: "In 3 Tagen · Arzt schon kontaktiert", path: "/servicedesk?id=T-0090" },
  ];

  if (allMine.length === 0 && myOverdue.length === 0) {
    return {
      role: "anna",
      text: "Heute ist alles im grünen Bereich. Schau gerne in deine Klienten-Liste oder frag mich, was sich diese Woche verändert hat.",
      chips: ["Was hat sich diese Woche verändert?", "Klienten ohne Aktivität in 14 Tagen", "Anstehende SRK-Kurse"],
    };
  }

  const reasoning = myOverdue.length > 1
    ? `${cards.length} Aufgaben sind überfällig – ich zeige dir die wichtigsten zuerst:`
    : myOverdue.length === 1
    ? `Drei Aufgaben fallen heute auf – eine davon hängt schon ein paar Tage:`
    : `Heute ist kein einzelner Punkt dringend – diese drei kannst du in Ruhe abarbeiten:`;

  const closing = myOverdue.length > 0 ? "Womit möchtest du anfangen?" : "Magst du dir einen anschauen?";

  return {
    role: "anna",
    text: reasoning,
    cards,
    chips: [
      "Warum ist Monikas Einstufung überfällig?",
      "Andere blockierte Onboardings?",
      "Sandra Webers Termine diese Woche",
    ],
    closing,
  };
}

export function generateFollowUpChips(lastAnswer: string): string[] {
  if (lastAnswer.includes("überfällig")) return ["Alle überfälligen zeigen", "Wie bereite ich das vor?", "Meine Klienten diese Woche"];
  if (lastAnswer.includes("blockiert")) return ["Was blockiert genau?", "Andere blockierte?", "Zur Onboarding-Übersicht"];
  if (lastAnswer.includes("Compliance")) return ["Quellensteuer-Details", "SRK-Status", "Zum Dashboard"];
  return ["Was steht diese Woche an?", "Meine Klienten zeigen", "Offene Pendenzen"];
}

// ── Pattern rules ──

const rules: MatchRule[] = [
  {
    patterns: [/^(hallo|hi|hey|guten\s*(morgen|tag|abend))/i],
    handler: () => ({
      role: "anna",
      text: "Hallo! Wie kann ich dir helfen?",
      chips: ["Was steht heute an?", "Überfällige Pendenzen", "Meine Klienten"],
    }),
  },

  {
    patterns: [/wie\s*viele?\s*(klient|patient)/i, /anzahl\s*(klient|patient)/i],
    handler: () => {
      const aktiv = getPatienten().filter(p => p.status === "aktiv").length;
      const schwer = getPatienten().filter(p => p.schweregrad === "schwer" || p.schweregrad === "kritisch").length;
      return {
        role: "anna",
        text: `Aktuell ${getPatienten().length} Klienten im System, davon ${aktiv} aktiv. ${schwer} mit Schweregrad schwer oder kritisch.`,
        chips: ["Schwere Klienten zeigen", "Klienten ohne Zuweisung", "Zur Patientenliste"],
      };
    },
  },

  {
    patterns: [/(?:wo\s*ist|zeig\s*mir|finde|suche)\s+(.{2,})/i, /^([A-ZÄÖÜ][a-zäöü]+\s+[A-ZÄÖÜ][a-zäöü]+)$/],
    handler: (_m, query) => {
      const q = query.replace(/^(wo\s*ist|zeig\s*mir|finde|suche)\s+/i, "").trim().toLowerCase();
      const pMatches = getPatienten().filter(p => `${p.vorname} ${p.nachname}`.toLowerCase().includes(q) || `${p.nachname} ${p.vorname}`.toLowerCase().includes(q));
      const aMatches = angehoerige.filter(a => `${a.vorname} ${a.nachname}`.toLowerCase().includes(q) || `${a.nachname} ${a.vorname}`.toLowerCase().includes(q));
      const cards: AnnaCard[] = [
        ...pMatches.map(p => ({ id: p.id, title: `${p.nachname}, ${p.vorname}`, subtitle: `Patient · ${p.kanton} · ${p.schweregrad}`, path: `/patienten/${p.id}` })),
        ...aMatches.map(a => ({ id: a.id, title: `${a.nachname}, ${a.vorname}`, subtitle: "Angehörige/r", path: `/angehoerige/${a.id}` })),
      ];
      if (cards.length === 0) return { role: "anna", text: `Niemanden mit "${q}" gefunden. Überprüfe die Schreibweise.`, chips: ["Alle Patienten zeigen", "Alle Angehörigen zeigen"] };
      const firstMatch = cards[0];
      return { role: "anna", text: `${formatCount(cards.length, "Treffer", "Treffer")} gefunden:`, cards: cards.slice(0, 5), chips: [`Zur Detail-Seite von ${firstMatch.title}`, "Offene Aufgaben?", "Dokumente?"] };
    },
  },

  {
    patterns: [/klient.*(?:in|aus|kanton)\s+(zürich|zh|bern|be|luzern|lu|aargau|ag|st\.?\s*gallen|sg)/i],
    handler: (m) => {
      const region = m[1].toUpperCase().replace(/ZÜRICH/i, "ZH").replace(/BERN/i, "BE").replace(/LUZERN/i, "LU").replace(/AARGAU/i, "AG").replace(/ST\.?\s*GALLEN/i, "SG");
      const kanton = region.length <= 2 ? region : region;
      const matches = getPatienten().filter(p => p.kanton.toUpperCase() === kanton);
      const cards = matches.map(p => ({ id: p.id, title: `${p.nachname}, ${p.vorname}`, subtitle: `${p.schweregrad} · ${p.pflegefachkraft}`, path: `/patienten/${p.id}` }));
      return { role: "anna", text: `${formatCount(matches.length, "Klient", "Klienten")} im Kanton ${kanton}:`, cards: cards.slice(0, 5), navAction: `/patienten?region=${kanton}`, chips: ["Davon mit Schweregrad schwer", "Zur gefilterten Liste"] };
    },
  },

  {
    patterns: [/klient.*schweregrad\s+(leicht|mittel|schwer|kritisch)/i, /(leicht|mittel|schwer|kritisch)e?\s*klient/i],
    handler: (m) => {
      const sg = m[1].toLowerCase();
      const matches = getPatienten().filter(p => p.schweregrad === sg);
      const cards = matches.map(p => ({ id: p.id, title: `${p.nachname}, ${p.vorname}`, subtitle: `${p.kanton} · ${p.pflegefachkraft}`, path: `/patienten/${p.id}` }));
      return { role: "anna", text: `${formatCount(matches.length, "Klient", "Klienten")} mit Schweregrad "${sg}":`, cards: cards.slice(0, 5), navAction: `/patienten?schweregrad=${sg}`, chips: ["Nur in Zürich", "Zur gefilterten Liste"] };
    },
  },

  {
    patterns: [/klient.*von\s+(.+)/i, /patient.*von\s+(.+)/i],
    handler: (m) => {
      const name = m[1].trim().toLowerCase();
      const matches = getPatienten().filter(p => p.pflegefachkraft.toLowerCase().includes(name));
      const cards = matches.map(p => ({ id: p.id, title: `${p.nachname}, ${p.vorname}`, subtitle: `${p.schweregrad} · ${p.kanton}`, path: `/patienten/${p.id}` }));
      if (cards.length === 0) return { role: "anna", text: `Keine Klienten für "${m[1].trim()}" gefunden.`, chips: ["Alle Pflegefachkräfte zeigen"] };
      return { role: "anna", text: `${formatCount(matches.length, "Klient", "Klienten")} von ${m[1].trim()}:`, cards: cards.slice(0, 5), chips: ["Davon überfällig", "Zur Patientenliste"] };
    },
  },

  {
    patterns: [/(?:klient|patient).*(?:ohne|kein).*zuwe?i?sung/i, /nicht\s*zugewiesen/i],
    handler: () => {
      const matches = getPatienten().filter(p => p.pflegefachkraft === "—");
      const cards = matches.map(p => ({ id: p.id, title: `${p.nachname}, ${p.vorname}`, subtitle: `${p.schweregrad} · ${p.kanton}`, path: `/patienten/${p.id}` }));
      return { role: "anna", text: `${formatCount(matches.length, "Klient ist", "Klienten sind")} ohne Pflegefachkraft-Zuweisung:`, cards: cards.slice(0, 5), navAction: `/patienten?zuweisung=nicht_zugewiesen`, chips: ["Zur gefilterten Liste"] };
    },
  },

  {
    patterns: [/re.?assessment/i],
    handler: () => {
      const faellig = getPatienten().filter(p => { const t = tageBisReAssessment(p); return t !== null && t <= 30; });
      const cards = faellig.map(p => ({ id: p.id, title: `${p.nachname}, ${p.vorname}`, subtitle: `Fällig in ${tageBisReAssessment(p)} Tagen`, path: `/patienten/${p.id}` }));
      return { role: "anna", text: `${formatCount(faellig.length, "Re-Assessment ist", "Re-Assessments sind")} in den nächsten 30 Tagen fällig:`, cards: cards.slice(0, 5), navAction: `/patienten?reassessment=diesen_monat`, chips: ["Nur überfällige", "Zur gefilterten Liste"] };
    },
  },

  {
    patterns: [/pendenz.*überfällig|überfällig.*pendenz|alle.*überfällig/i],
    handler: () => {
      const overdue = unifiedEntries.filter(e => e.faellig && e.faellig < TODAY && e.status !== "erledigt");
      const cards = overdue.map(e => ({ id: e.id, title: entryTitle(e), subtitle: `${e.typLabel} · Fällig ${e.faellig}`, path: `/servicedesk?id=${e.id}` }));
      return { role: "anna", text: `${formatCount(overdue.length, "Pendenz ist", "Pendenzen sind")} überfällig:`, cards: cards.slice(0, 5), navAction: "/servicedesk?view=mir", chips: ["Zur Pendenzenliste", "Welche kann ich heute erledigen?"] };
    },
  },

  {
    patterns: [/pendenz.*(?:diese|dieser)\s*woche|(?:diese|dieser)\s*woche.*(?:fällig|pendenz)/i],
    handler: () => {
      const endOfWeek = "2026-03-07";
      const thisWeek = unifiedEntries.filter(e => e.faellig && e.faellig >= TODAY && e.faellig <= endOfWeek && e.status !== "erledigt");
      const cards = thisWeek.map(e => ({ id: e.id, title: entryTitle(e), subtitle: `${e.typLabel} · Fällig ${e.faellig}`, path: `/servicedesk?id=${e.id}` }));
      return { role: "anna", text: `${formatCount(thisWeek.length, "Pendenz ist", "Pendenzen sind")} diese Woche fällig:`, cards: cards.slice(0, 5), chips: ["Davon überfällig", "Zur Pendenzenliste"] };
    },
  },

  {
    patterns: [/(?:offene?\s*)?quellensteuer/i],
    handler: () => {
      const matches = unifiedEntries.filter(e => e.typ === "QUELLENSTEUER_ANMELDUNG" && e.status !== "erledigt");
      return { role: "anna", text: `${formatCount(matches.length, "offene Quellensteuer-Anmeldung", "offene Quellensteuer-Anmeldungen")}.`, navAction: "/servicedesk?typ=QUELLENSTEUER_ANMELDUNG", chips: ["Zur gefilterten Liste", "Compliance-Übersicht"] };
    },
  },

  {
    patterns: [/compliance/i],
    handler: () => {
      const srk = unifiedEntries.filter(e => e.typ === "SRK_ANMELDUNG" && e.status !== "erledigt").length;
      const qs = unifiedEntries.filter(e => e.typ === "QUELLENSTEUER_ANMELDUNG" && e.status !== "erledigt").length;
      const ab = unifiedEntries.filter(e => e.typ === "AUSWEIS_B_ANMELDUNG" && e.status !== "erledigt").length;
      const la = unifiedEntries.filter(e => e.typ === "LOHNANPASSUNG_NACH_SRK" && e.status !== "erledigt").length;
      return {
        role: "anna",
        text: `Compliance-Übersicht:\n• SRK-Anmeldungen offen: ${srk}\n• Quellensteuer: ${qs}\n• Ausweis B: ${ab}\n• Lohnanpassungen: ${la}\n\nTotal: ${srk + qs + ab + la} offene Punkte.`,
        chips: ["Quellensteuer-Anmeldungen", "SRK offen", "Zum Dashboard"],
      };
    },
  },

  {
    patterns: [/srk.*(offen|ausstehend|nicht.*gemacht)/i, /(?:ohne|kein).*srk/i],
    handler: () => {
      const matches = angehoerige.filter(a => a.qualifikation === "ohne_srk" && !a.srkKursDatum);
      const cards = matches.map(a => ({ id: a.id, title: `${a.nachname}, ${a.vorname}`, subtitle: "SRK ausstehend", path: `/angehoerige/${a.id}` }));
      return { role: "anna", text: `${formatCount(matches.length, "Angehörige/r hat", "Angehörige haben")} den SRK-Kurs noch nicht absolviert:`, cards: cards.slice(0, 5), navAction: "/angehoerige?view=srk_offen", chips: ["Zur Angehörigen-Übersicht", "Wessen Frist läuft bald ab?"] };
    },
  },

  {
    patterns: [/onboarding.*blockiert|blockiert.*onboarding/i],
    handler: () => ({ role: "anna", text: "Ich öffne die blockierten Onboardings.", navAction: "/onboarding?view=blockiert", chips: ["Fast abgeschlossene zeigen", "Alle Onboardings"] }),
  },

  {
    patterns: [/onboarding.*fast\s*(?:abgeschlossen|fertig)/i],
    handler: () => ({ role: "anna", text: "Ich öffne die fast abgeschlossenen Onboardings.", navAction: "/onboarding?view=fast_abgeschlossen", chips: ["Blockierte zeigen", "Alle Onboardings"] }),
  },

  {
    patterns: [/(?:öffne|zeig|bring.*zu|geh.*zu).*dashboard/i, /mein\s*dashboard/i],
    handler: () => ({ role: "anna", text: "Ich öffne das Dashboard.", navAction: "/", chips: ["Was steht heute an?"] }),
  },
  {
    patterns: [/(?:öffne|zeig|bring.*zu|geh.*zu).*pendenz/i],
    handler: () => ({ role: "anna", text: "Ich öffne die Pendenzenliste.", navAction: "/servicedesk", chips: ["Überfällige zeigen", "Meine Pendenzen"] }),
  },
  {
    patterns: [/(?:öffne|zeig|bring.*zu|geh.*zu).*onboarding/i],
    handler: () => ({ role: "anna", text: "Ich öffne die Onboarding-Übersicht.", navAction: "/onboarding", chips: ["Blockierte zeigen"] }),
  },
  {
    patterns: [/(?:öffne|zeig|bring.*zu|geh.*zu).*patient/i],
    handler: () => ({ role: "anna", text: "Ich öffne die Patientenliste.", navAction: "/patienten", chips: ["Meine Patienten", "Aufmerksamkeit nötig"] }),
  },
  {
    patterns: [/(?:öffne|zeig|bring.*zu|geh.*zu).*angehörig/i],
    handler: () => ({ role: "anna", text: "Ich öffne die Angehörigen-Übersicht.", navAction: "/angehoerige", chips: ["SRK offen", "Im Onboarding"] }),
  },

  {
    patterns: [/spezialbewilligung|ausweis\s*b/i],
    handler: () => ({
      role: "anna",
      text: "Bei Aufenthaltsstatus B muss eine Erwerbstätigkeitsbewilligung beim Migrationsamt beantragt werden, bevor ein Arbeitsvertrag ausgestellt werden darf. Im Onboarding erscheint automatisch ein Pflicht-Schritt 'Spezialbewilligung B', wenn du B als Aufenthaltsstatus wählst.",
      navAction: "/onboarding",
      chips: ["Onboarding öffnen", "Was ist der SRK-Kurs?"],
    }),
  },

  {
    patterns: [/(?:was|wie).*srk/i],
    handler: () => ({
      role: "anna",
      text: "Der SRK-Pflegekurs ist Pflicht für alle pflegenden Angehörigen. Er muss innerhalb eines Jahres nach Vertragsunterzeichnung absolviert werden, sonst werden die Leistungen pausiert.",
      navAction: "/angehoerige?view=srk_offen",
      chips: ["SRK-Status anzeigen", "Was ist die Spezialbewilligung?"],
    }),
  },

  {
    patterns: [/(?:erstell|leg.*an|änder|lösch|aktualisier|bearbeit)/i],
    handler: () => ({
      role: "anna",
      text: "Das mache ich in dieser Version noch nicht selbst. Aber ich kann dich zur richtigen Stelle bringen – sag mir, was du anlegen oder ändern möchtest.",
      chips: ["Neues Onboarding starten", "Pendenzenliste öffnen", "Patientenliste öffnen"],
    }),
  },

  {
    patterns: [/was\s*steht.*an|was.*heute|mein.*tag/i],
    handler: () => {
      const overdue = unifiedEntries.filter(e => e.faellig && e.faellig < TODAY && e.status !== "erledigt").length;
      const todayDue = unifiedEntries.filter(e => e.faellig === TODAY && e.status !== "erledigt").length;
      const activePatients = getPatienten().filter(p => p.status === "aktiv").length;
      return {
        role: "anna",
        text: `Dein Überblick: ${activePatients} aktive Klienten, ${overdue} überfällige und ${todayDue} heute fällige Pendenzen.`,
        navAction: "/",
        chips: ["Überfällige zeigen", "Heute fällige zeigen", "Meine Klienten"],
      };
    },
  },

  {
    patterns: [/(?:wer|welche).*meiste.*pendenz/i],
    handler: () => {
      const counts: Record<string, number> = {};
      unifiedEntries.filter(e => e.status !== "erledigt").forEach(e => {
        const name = e.verantwortlich.name;
        counts[name] = (counts[name] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const text = sorted.slice(0, 3).map(([name, count]) => `• ${name}: ${count}`).join("\n");
      return { role: "anna", text: `Offene Pendenzen pro Person:\n${text}`, chips: ["Zur Pendenzenliste", "Überfällige zeigen"] };
    },
  },

  {
    patterns: [/wochen.?überblick|woche.*zusammenfass/i],
    handler: () => {
      const openTotal = unifiedEntries.filter(e => e.status !== "erledigt").length;
      const overdue = unifiedEntries.filter(e => e.faellig && e.faellig < TODAY && e.status !== "erledigt").length;
      const endOfWeek = "2026-03-07";
      const thisWeek = unifiedEntries.filter(e => e.faellig && e.faellig >= TODAY && e.faellig <= endOfWeek && e.status !== "erledigt").length;
      return {
        role: "anna",
        text: `Wochenüberblick KW 10:\n• ${openTotal} offene Pendenzen total\n• ${overdue} davon überfällig\n• ${thisWeek} diese Woche fällig\n• ${getPatienten().filter(p => p.status === "aktiv").length} aktive Klienten`,
        chips: ["Überfällige zeigen", "Diese Woche fällige", "Zum Dashboard"],
      };
    },
  },

  // Heute fällige (for chip follow-up)
  {
    patterns: [/heute\s*fällig/i],
    handler: () => {
      const todayEntries = unifiedEntries.filter(e => e.faellig === TODAY && e.status !== "erledigt");
      const cards = todayEntries.map(e => ({ id: e.id, title: entryTitle(e), subtitle: `${e.typLabel}`, path: `/servicedesk?id=${e.id}` }));
      return { role: "anna", text: `${formatCount(todayEntries.length, "Pendenz ist", "Pendenzen sind")} heute fällig:`, cards: cards.slice(0, 5), chips: ["Zur Pendenzenliste"] };
    },
  },
];

export function processQuery(query: string, context: string): AnnaMessage {
  const trimmed = query.trim();
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const match = trimmed.match(pattern);
      if (match) return rule.handler(match, trimmed, context);
    }
  }
  return {
    role: "anna",
    text: "Das habe ich leider nicht verstanden. Versuch es anders, oder probier eine der Vorschläge:",
    chips: ["Was steht heute an?", "Meine Klienten zeigen", "Überfällige Pendenzen"],
  };
}

export function getSuggestions(context: string): string[] {
  const morning = MOCK_HOUR < 11;
  const evening = MOCK_HOUR >= 17;

  if (context.startsWith("/patienten/")) return ["Was ist der nächste Schritt?", "Welche Dokumente fehlen?", "Wer pflegt diese Person?"];
  if (context.startsWith("/angehoerige/")) return ["Welche Dokumente fehlen?", "Hat diese Person den SRK-Kurs?"];

  if (context === "/patienten") {
    if (morning) return ["Wer hat überfällige Re-Assessments?", "Klienten in Zürich?", "Wer ist ohne Zuweisung?"];
    return ["Welche Klienten brauchen Aufmerksamkeit?", "Schwere Klienten zeigen", "Klienten von Sandra Weber"];
  }
  if (context === "/servicedesk") {
    if (morning) return ["Welche Pendenzen sind überfällig?", "Was steht heute an?"];
    return ["Welche kann ich heute noch erledigen?", "Offene Quellensteuer-Anmeldungen?"];
  }
  if (context === "/onboarding") return ["Welche Onboardings sind blockiert?", "Fast abgeschlossene Onboardings?"];
  if (context === "/angehoerige") return ["Wer hat den SRK-Kurs noch nicht gemacht?", "Angehörige im Onboarding?"];

  // Dashboard / default
  if (morning) return ["Was steht heute an?", "Überfällige Pendenzen", "Wie ist die Compliance-Lage?"];
  if (evening) return ["Wochenüberblick", "Was bleibt für morgen?", "Compliance-Übersicht"];
  return ["Was steht heute an?", "Wie viele Klienten haben wir?", "Überfällige Pendenzen"];
}
