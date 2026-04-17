/*
 * ─────────────────────────────────────────
 *  Shared Angehörige data & types
 * ─────────────────────────────────────────
 */

export type Qualifikation = "ohne_srk" | "srk" | "fage_dipl";

export type BillingReadiness =
  | "abrechenbar"
  | "nicht_abrechenbar"
  | "in_vorbereitung"
  | "gekuendigt";

export type AngehoerigerStatus =
  | "aktiv"
  | "in_onboarding"
  | "fehlende_dokumente";

export interface StempelWarning {
  type: "spitalaufenthalt" | "fehlende_tage" | "unstimmigkeit";
  label: string;
}

export interface ZugeordneterPatient {
  id: string;
  name: string;
}

export interface HRCheck {
  bankdaten: boolean;
  kinderzulagen: boolean;
  quellensteuerTarif: string | null; // null = nicht hinterlegt
}

export interface MonatsSchritt {
  aktuell: number;   // 1-based: which step is active (0 = not started yet)
  total: number;     // total monthly steps (typically 7)
  label: string;     // name of the current / next step
  faellig?: string;  // due date dd.mm.yyyy
  ueberfaellig?: boolean;
  abgeschlossen?: boolean; // true when all steps done
}

export interface Angehoeriger {
  id: string;
  obNummer: string;
  vorname: string;
  nachname: string;
  qualifikation: Qualifikation;
  status: AngehoerigerStatus;
  billingReadiness: BillingReadiness;
  zugeordnetePatientenList: ZugeordneterPatient[];
  stempelTage: number;
  stempelSoll: number;
  stempelWarnings: StempelWarning[];
  hrCheck: HRCheck;
  srkKursDatum: string | null;
  letzteMutationDatum: string;
  letzteMutationUser: string;
  pflegefachkraft: string;
  pflegefachkraftInitialen: string;
  monatsSchritt: MonatsSchritt;
}

/* ── Qualifikation config ────────────────── */
export const qualifikationConfig: Record<
  Qualifikation,
  { label: string; bg: string; text: string }
> = {
  ohne_srk: {
    label: "ohne SRK",
    bg: "bg-neutral-medium",
    text: "text-neutral-foreground",
  },
  srk: {
    label: "SRK",
    bg: "bg-info-light",
    text: "text-info-foreground",
  },
  fage_dipl: {
    label: "FaGe / Dipl",
    bg: "bg-primary-light",
    text: "text-primary",
  },
};

/* ── Billing Readiness config ────────────── */
export const billingReadinessConfig: Record<
  BillingReadiness,
  { label: string; bg: string; text: string; dot: string }
> = {
  abrechenbar: {
    label: "Abrechenbar",
    bg: "bg-success-light",
    text: "text-success-foreground",
    dot: "bg-success",
  },
  nicht_abrechenbar: {
    label: "Nicht abrechenbar",
    bg: "bg-error-light",
    text: "text-error-foreground",
    dot: "bg-error",
  },
  in_vorbereitung: {
    label: "In Vorbereitung",
    bg: "bg-warning-light",
    text: "text-warning-foreground",
    dot: "bg-warning",
  },
  gekuendigt: {
    label: "Gekündigt",
    bg: "bg-neutral-medium",
    text: "text-neutral-foreground",
    dot: "bg-neutral",
  },
};

/* ── Realistic Swiss German sample data ──── */
export const angehoerige: Angehoeriger[] = [
  {
    id: "A-2026-0101",
    obNummer: "OB-2026-041",
    vorname: "Peter",
    nachname: "Müller",
    qualifikation: "srk",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0041", name: "Anna Müller" },
    ],
    stempelTage: 18,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "C" },
    srkKursDatum: "2025-06-15",
    letzteMutationDatum: "28.02.2026",
    letzteMutationUser: "S. Weber",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    monatsSchritt: {
      aktuell: 5,
      total: 7,
      label: "Mikroschulung",
      faellig: "05.03.2026",
    },
  },
  {
    id: "A-2026-0102",
    obNummer: "OB-2026-042",
    vorname: "Lisa",
    nachname: "Schmid",
    qualifikation: "ohne_srk",
    status: "in_onboarding",
    billingReadiness: "in_vorbereitung",
    zugeordnetePatientenList: [
      { id: "P-2026-0042", name: "Thomas Schmid" },
    ],
    stempelTage: 5,
    stempelSoll: 22,
    stempelWarnings: [{ type: "fehlende_tage", label: "Fehlende Tage" }],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    srkKursDatum: null,
    letzteMutationDatum: "25.02.2026",
    letzteMutationUser: "K. Meier",
    pflegefachkraft: "Kathrin Meier",
    pflegefachkraftInitialen: "KM",
    monatsSchritt: {
      aktuell: 2,
      total: 7,
      label: "Mikroschulung",
      faellig: "03.03.2026",
    },
  },
  {
    id: "A-2026-0103",
    obNummer: "OB-2026-043",
    vorname: "Johannes",
    nachname: "Weber",
    qualifikation: "fage_dipl",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0043", name: "Maria Weber" },
      { id: "P-2026-0047", name: "Elisabeth Brunner" },
      { id: "P-2026-0049", name: "Gertrud Zimmermann" },
    ],
    stempelTage: 20,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: "A" },
    srkKursDatum: null,
    letzteMutationDatum: "01.03.2026",
    letzteMutationUser: "L. Brunner",
    pflegefachkraft: "Laura Brunner",
    pflegefachkraftInitialen: "LB",
    monatsSchritt: {
      aktuell: 7,
      total: 7,
      label: "Alle Schritte erledigt",
      abgeschlossen: true,
    },
  },
  {
    id: "A-2026-0104",
    obNummer: "OB-2026-044",
    vorname: "Monika",
    nachname: "Fischer",
    qualifikation: "srk",
    status: "aktiv",
    billingReadiness: "gekuendigt",
    zugeordnetePatientenList: [
      { id: "P-2026-0044", name: "Klaus Fischer" },
    ],
    stempelTage: 0,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "B" },
    srkKursDatum: "2025-07-20",
    letzteMutationDatum: "15.02.2026",
    letzteMutationUser: "M. Keller",
    pflegefachkraft: "Maria Keller",
    pflegefachkraftInitialen: "MK",
    monatsSchritt: {
      aktuell: 1,
      total: 7,
      label: "Regelkontrolle",
      faellig: "02.03.2026",
    },
  },
  {
    id: "A-2026-0105",
    obNummer: "OB-2026-045",
    vorname: "Hans",
    nachname: "Becker",
    qualifikation: "ohne_srk",
    status: "fehlende_dokumente",
    billingReadiness: "nicht_abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0045", name: "Sabine Becker" },
    ],
    stempelTage: 14,
    stempelSoll: 22,
    stempelWarnings: [
      { type: "unstimmigkeit", label: "Unstimmigkeit" },
    ],
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: null },
    srkKursDatum: null,
    letzteMutationDatum: "26.02.2026",
    letzteMutationUser: "S. Weber",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    monatsSchritt: {
      aktuell: 4,
      total: 7,
      label: "Arbeitskontrolle",
      faellig: "04.03.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "A-2026-0106",
    obNummer: "OB-2026-046",
    vorname: "Ruth",
    nachname: "Hoffmann",
    qualifikation: "srk",
    status: "in_onboarding",
    billingReadiness: "in_vorbereitung",
    zugeordnetePatientenList: [
      { id: "P-2026-0046", name: "Peter Hoffmann" },
    ],
    stempelTage: 3,
    stempelSoll: 22,
    stempelWarnings: [{ type: "fehlende_tage", label: "Fehlende Tage" }],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    srkKursDatum: null,
    letzteMutationDatum: "24.02.2026",
    letzteMutationUser: "K. Meier",
    pflegefachkraft: "Kathrin Meier",
    pflegefachkraftInitialen: "KM",
    monatsSchritt: {
      aktuell: 2,
      total: 7,
      label: "Mikroschulung",
      faellig: "02.03.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "A-2026-0107",
    obNummer: "OB-2026-047",
    vorname: "Stefan",
    nachname: "Brunner",
    qualifikation: "fage_dipl",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0047", name: "Elisabeth Brunner" },
      { id: "P-2026-0050", name: "Werner Keller" },
    ],
    stempelTage: 22,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "A" },
    srkKursDatum: null,
    letzteMutationDatum: "01.03.2026",
    letzteMutationUser: "L. Brunner",
    pflegefachkraft: "Laura Brunner",
    pflegefachkraftInitialen: "LB",
    monatsSchritt: {
      aktuell: 6,
      total: 7,
      label: "Kundenfeedback",
      faellig: "06.03.2026",
    },
  },
  {
    id: "A-2026-0108",
    obNummer: "OB-2026-048",
    vorname: "Ursula",
    nachname: "Steiner",
    qualifikation: "ohne_srk",
    status: "fehlende_dokumente",
    billingReadiness: "nicht_abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0048", name: "Heinrich Steiner" },
    ],
    stempelTage: 10,
    stempelSoll: 22,
    stempelWarnings: [
      { type: "spitalaufenthalt", label: "Spitalaufenthalt" },
      { type: "fehlende_tage", label: "Fehlende Tage" },
    ],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    srkKursDatum: null,
    letzteMutationDatum: "22.02.2026",
    letzteMutationUser: "L. Brunner",
    pflegefachkraft: "Laura Brunner",
    pflegefachkraftInitialen: "LB",
    monatsSchritt: {
      aktuell: 1,
      total: 7,
      label: "Regelkontrolle",
      faellig: "01.03.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "A-2026-0109",
    obNummer: "OB-2026-049",
    vorname: "Karl",
    nachname: "Zimmermann",
    qualifikation: "srk",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0049", name: "Gertrud Zimmermann" },
    ],
    stempelTage: 19,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "C" },
    srkKursDatum: "2025-08-10",
    letzteMutationDatum: "27.02.2026",
    letzteMutationUser: "S. Weber",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    monatsSchritt: {
      aktuell: 5,
      total: 7,
      label: "Mikroschulung",
      faellig: "05.03.2026",
    },
  },
  {
    id: "A-2026-0110",
    obNummer: "OB-2026-050",
    vorname: "Margrit",
    nachname: "Keller",
    qualifikation: "fage_dipl",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0050", name: "Werner Keller" },
      { id: "P-2026-0041", name: "Anna Müller" },
    ],
    stempelTage: 21,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "B" },
    srkKursDatum: null,
    letzteMutationDatum: "01.03.2026",
    letzteMutationUser: "M. Keller",
    pflegefachkraft: "Maria Keller",
    pflegefachkraftInitialen: "MK",
    monatsSchritt: {
      aktuell: 7,
      total: 7,
      label: "Alle Schritte erledigt",
      abgeschlossen: true,
    },
  },
  {
    id: "A-2026-0111",
    obNummer: "OB-2026-051",
    vorname: "Andreas",
    nachname: "Frei",
    qualifikation: "srk",
    status: "in_onboarding",
    billingReadiness: "in_vorbereitung",
    zugeordnetePatientenList: [],
    stempelTage: 0,
    stempelSoll: 22,
    stempelWarnings: [{ type: "fehlende_tage", label: "Fehlende Tage" }],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    srkKursDatum: null,
    letzteMutationDatum: "28.02.2026",
    letzteMutationUser: "K. Meier",
    pflegefachkraft: "Kathrin Meier",
    pflegefachkraftInitialen: "KM",
    monatsSchritt: {
      aktuell: 3,
      total: 7,
      label: "Fallbesprechung",
      faellig: "03.03.2026",
    },
  },
  {
    id: "A-2026-0112",
    obNummer: "OB-2026-052",
    vorname: "Claudia",
    nachname: "Huber",
    qualifikation: "ohne_srk",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0043", name: "Maria Weber" },
    ],
    stempelTage: 17,
    stempelSoll: 22,
    stempelWarnings: [{ type: "spitalaufenthalt", label: "Spitalaufenthalt" }],
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: "A" },
    srkKursDatum: null,
    letzteMutationDatum: "26.02.2026",
    letzteMutationUser: "S. Weber",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    monatsSchritt: {
      aktuell: 4,
      total: 7,
      label: "Arbeitskontrolle",
      faellig: "04.03.2026",
    },
  },
];