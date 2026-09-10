import type { UserRole } from "./user";
import { PENDENZ_ARTEN, verantwortlichFuerArt, type PendenzArtId } from "../lib/stammdaten/pendenz-katalog";

/**
 * Die Art einer Pendenz — die Kennungen des Katalogs
 * (lib/stammdaten/pendenz-katalog).
 *
 * Vorher stand hier eine eigene, flache Liste von 17 Werten. Sie war die
 * zweite Wahrheit neben dem Katalog; der Typ wird jetzt von dort abgeleitet,
 * damit eine neue Art an einer Stelle entsteht.
 */
export type PendenzTyp = PendenzArtId;

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
  bulkAction?: BulkAction;
  /** Farbe der Kategorie-Pille. Aus der KATEGORIE abgeleitet, nicht je Art
   *  gepflegt — gleiche Kategorie, gleiche Farbe. */
  pillBg: string;
  pillColor: string;
  /* ── Anna ──────────────────────────────────────────────────────────────────
     Anna ist aus der Oberfläche entfernt; diese Felder haben in dieser Fassung
     keinen Wert und keinen Leser mehr. Sie bleiben optional deklariert, damit
     die noch vorhandenen (nicht gerenderten) Anna-Komponenten übersetzen. */
  annaStage?: "A" | "B" | "C";
  annaPromptTemplate?: string;
  annaFallbackText?: string;
  defaultActions?: AnnaAction[];
}

/**
 * Farbe je Kategorie. Neutral gehalten: die Pille ordnet ein, sie warnt nicht —
 * Dringlichkeit steht in Fälligkeit und Status, nicht in der Kategorie.
 */
const KATEGORIE_FARBE: Record<string, { bg: string; fg: string }> = {
  auslaenderrecht:    { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  steuern:            { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  sozialversicherung: { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  ausbildung:         { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  lohn:               { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  absenzen:           { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  anstellung:         { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  dokumente:          { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  betreuung:          { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  sonstiges:          { bg: "var(--bg-secondary)", fg: "var(--text-tertiary)" },
};

/**
 * Der Katalog in der Form, die die Pendenzenliste liest.
 *
 * Abgeleitet aus `PENDENZ_ARTEN`, nicht daneben gepflegt: Beschriftung,
 * Beschreibung und Zuständigkeit kommen von dort. Nur die Sammel-Aktionen
 * stehen hier, weil sie das Verhalten der Liste betreffen und nicht die
 * Stammdaten der Art.
 *
 * WAS HIER NICHT MEHR STEHT: Anna-Konfiguration (annaStage, Prompt-Vorlagen,
 * defaultActions) und die Pillenfarben. Beides las niemand — Anna ist aus der
 * Oberfläche entfernt, und die Liste färbt Kategorien nicht ein.
 */
const SAMMEL_AKTIONEN: Partial<Record<PendenzTyp, BulkAction>> = {
  ausbildung_srk_anmeldung: {
    label: "Personendaten zusammenstellen",
    description: "Alle Personendaten für die SRK-Anmeldungen vorbereiten",
    resultDescription: "{N} Datensätze werden zur Übertragung ins SRK-Portal vorbereitet",
    isDemoMock: false,
  },
  steuern_quellensteuer_anmelden: {
    label: "Formulare vorbereiten",
    description: "Alle Quellensteuer-Anmeldeformulare mit den jeweiligen Daten generieren",
    resultDescription: "{N} PDFs werden generiert und zum Download bereitgestellt",
    isDemoMock: false,
  },
  auslaenderrecht_bewilligung_beantragen: {
    label: "Anmeldungen vorbereiten",
    description: "Alle Migrationsamt-Anmeldungen mit den jeweiligen Daten generieren",
    resultDescription: "{N} Anmeldeformulare werden vorbereitet",
    isDemoMock: false,
  },
};

export const pendenzTypen: Record<PendenzTyp, PendenzTypDefinition> = Object.fromEntries(
  PENDENZ_ARTEN.map(a => [a.id, {
    id: a.id,
    label: a.label,
    description: a.hinweis ?? "",
    responsibleRole: verantwortlichFuerArt(a.id) ?? "backoffice",
    bulkAction: SAMMEL_AKTIONEN[a.id],
    pillBg: (KATEGORIE_FARBE[a.kategorieId] ?? KATEGORIE_FARBE.sonstiges).bg,
    pillColor: (KATEGORIE_FARBE[a.kategorieId] ?? KATEGORIE_FARBE.sonstiges).fg,
  }]),
) as Record<PendenzTyp, PendenzTypDefinition>;

