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
  /**
   * Die Person wird gerade erfasst; das Onboarding ist nicht abgeschlossen.
   * Sie erscheint nicht in der Liste und nicht in deren Zählungen.
   *
   * Nicht zu verwechseln mit "in_onboarding" — jenem Altwert dreier
   * Datensätze, der eine sichtbare, laufende Betreuung bezeichnet.
   */
  | "in_erfassung"
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

/**
 * Erhebungsfelder des Standardkatalogs Pflegende Angehörige, Bereiche A bis G.
 *
 * Alle Werte stammen aus dem Onboarding-Schritt "Angehöriger"; die Schlüssel
 * sind die Feldnamen des Formulars. Leer heisst "nicht erhoben" — es wird
 * nichts vorbelegt und nichts geraten.
 *
 * Nicht enthalten: die betrieblichen Felder (Status, Abrechenbarkeit,
 * Stempeltage, Monatsschritt, zugeordnete Patienten, Mutationsverlauf). Sie
 * entstehen im Betrieb, nicht in der Erfassung, und stehen unten am Typ.
 */
export interface AngehoerigerErhebung {
  /* ── Bereich A · Person ── */
  geschlecht: string;
  geburtsdatum: string;
  ahvNummer: string;
  zivilstand: string;
  zivilstandSeit: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  krankenkasseName: string;
  kartennummer: string;
  bagNr: string;
  /* ── Bereich B · Staatsangehörigkeit und Aufenthalt ── */
  nationalitaet: string;
  heimatort: string;
  aufenthaltsstatus: string;
  einreisedatum: string;
  zemisNummer: string;
  einreichungsdatumMigrationsamt: string;
  bewilligungAblaufdatum: string;
  spezialbewilligungEinreichungsDatum: string;
  spezialbewilligungStatus: string;
  /* ── Bereich C · Steuer und Sozialversicherung ── */
  quellensteuer: string;
  konfession: string;
  quellensteuerTarif: string;
  tarifcodeQuelle: string;
  tarifcodeOverrideBegruendung: string;
  steuergemeinde: string;
  bvgVersichert: string;
  uvgVersichert: string;
  sozialamtInvolviert: string;
  sozialamtKontakt: string;
  lohnabtretung: string;
  /* ── Bereich D · Partnerin oder Partner ── */
  partnerVorname: string;
  partnerName: string;
  partnerGeburtsdatum: string;
  partnerNationalitaet: string;
  partnerAufenthaltsstatus: string;
  partnerErwerbstaetig: string;
  /* ── Bereich E · Kinder und Zulagen ── */
  hatUnterhaltspflichtigeKinder: string;
  anzahlKinder: string;
  kinderzulagenUeberSpitex: string;
  kinder: AngehoerigerKind[];
  /* ── Bereich F · Anstellung und Auszahlung ── */
  arbeitetExtern: string;
  externeFunktion: string;
  externesPensumProzent: string;
  externerEintritt: string;
  bvgAnbindungGewuenscht: string;
  funktion: string;
  eintrittsdatum: string;
  stundenlohn: string;
  ferienanspruchWochen: string;
  bankname: string;
  iban: string;
  lohnart: string;
  /* ── Bereich G · Sprache und Qualifikationsnachweis ── */
  deutschNiveau: string;
  zertifikatVorhanden: string;
  srkZertifikatVorhanden: string;
}

/** Kind im Sinne von Bereich E des Katalogs. */
export interface AngehoerigerKind {
  id: string;
  vorname: string;
  name: string;
  geburtsdatum: string;
  geschlecht: string;
  ahvNummer: string;
  inAusbildung: string;
  ausbildungsbeginn: string;
  zulagenart: string;
  typQuelle: string;
  overrideBegruendung: string;
}

/** Leere Erhebung — jeder Wert "nicht erhoben". */
export const LEERE_ERHEBUNG: AngehoerigerErhebung = {
  geschlecht: "", geburtsdatum: "", ahvNummer: "", zivilstand: "", zivilstandSeit: "",
  strasse: "", plz: "", ort: "", email: "", telefon: "",
  krankenkasseName: "", kartennummer: "", bagNr: "",
  nationalitaet: "", heimatort: "", aufenthaltsstatus: "", einreisedatum: "", zemisNummer: "",
  einreichungsdatumMigrationsamt: "", bewilligungAblaufdatum: "",
  spezialbewilligungEinreichungsDatum: "", spezialbewilligungStatus: "",
  quellensteuer: "", konfession: "", quellensteuerTarif: "", tarifcodeQuelle: "",
  tarifcodeOverrideBegruendung: "", steuergemeinde: "", bvgVersichert: "", uvgVersichert: "",
  sozialamtInvolviert: "", sozialamtKontakt: "", lohnabtretung: "",
  partnerVorname: "", partnerName: "", partnerGeburtsdatum: "", partnerNationalitaet: "",
  partnerAufenthaltsstatus: "", partnerErwerbstaetig: "",
  hatUnterhaltspflichtigeKinder: "", anzahlKinder: "", kinderzulagenUeberSpitex: "", kinder: [],
  arbeitetExtern: "", externeFunktion: "", externesPensumProzent: "", externerEintritt: "",
  bvgAnbindungGewuenscht: "", funktion: "", eintrittsdatum: "", stundenlohn: "",
  ferienanspruchWochen: "", bankname: "", iban: "", lohnart: "",
  deutschNiveau: "", zertifikatVorhanden: "", srkZertifikatVorhanden: "",
};

export interface Angehoeriger extends AngehoerigerErhebung {
  id: string;
  /** Fall, aus dem die Person entstanden ist. Fehlt bei den Altdatensätzen. */
  onboardingId?: string;
  vorname: string;
  nachname: string;
  /**
   * Abgeleitet aus `funktion` nach R14 — kein Erhebungsfeld mehr.
   * Die zwölf Altdatensätze behalten ihren erfassten Wert; sie tragen keine
   * Funktion, aus der er sich ableiten liesse, und es wird keine erfunden.
   */
  qualifikation: Qualifikation;
  status: AngehoerigerStatus;
  billingReadiness: BillingReadiness;
  zugeordnetePatientenList: ZugeordneterPatient[];
  stempelTage: number;
  stempelSoll: number;
  stempelWarnings: StempelWarning[];
  hrCheck: HRCheck;
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
export const angehoerigeSeed: Angehoeriger[] = [
  {
    id: "A-2026-0101",
    vorname: "Vera",
    nachname: "Steiner",
    qualifikation: "srk",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0041", name: "Hans-Rudolf Steiner" },
    ],
    stempelTage: 18,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "C" },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "ja",
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
    vorname: "Beatrice",
    nachname: "Hübscher-Wiederkehr",
    qualifikation: "ohne_srk",
    status: "in_onboarding",
    billingReadiness: "in_vorbereitung",
    zugeordnetePatientenList: [
      { id: "P-2026-0042", name: "Marie-Louise Hübscher-Wiederkehr" },
    ],
    stempelTage: 5,
    stempelSoll: 22,
    stempelWarnings: [{ type: "fehlende_tage", label: "Fehlende Tage" }],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    vorname: "Arben",
    nachname: "Rexhepi",
    qualifikation: "fage_dipl",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0043", name: "Fatmire Rexhepi" },
      { id: "P-2026-0047", name: "Anna Bösiger" },
      { id: "P-2026-0049", name: "Gertrud Zimmermann" },
    ],
    stempelTage: 20,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: "A" },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    vorname: "Yusuf",
    nachname: "Kaya",
    qualifikation: "srk",
    status: "aktiv",
    billingReadiness: "gekuendigt",
    zugeordnetePatientenList: [
      { id: "P-2026-0044", name: "Emine Kaya" },
    ],
    stempelTage: 0,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "B" },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "ja",
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
    vorname: "Erika",
    nachname: "Huber",
    qualifikation: "ohne_srk",
    status: "fehlende_dokumente",
    billingReadiness: "nicht_abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0045", name: "Fritz Huber" },
    ],
    stempelTage: 14,
    stempelSoll: 22,
    stempelWarnings: [
      { type: "unstimmigkeit", label: "Unstimmigkeit" },
    ],
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: null },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    vorname: "Marta",
    nachname: "Da Silva",
    qualifikation: "srk",
    status: "in_onboarding",
    billingReadiness: "in_vorbereitung",
    zugeordnetePatientenList: [
      { id: "P-2026-0046", name: "Joaquim Da Silva" },
    ],
    stempelTage: 3,
    stempelSoll: 22,
    stempelWarnings: [{ type: "fehlende_tage", label: "Fehlende Tage" }],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "ja",
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
    vorname: "Heidi",
    nachname: "Bösiger",
    qualifikation: "fage_dipl",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0047", name: "Anna Bösiger" },
      { id: "P-2026-0050", name: "Werner Keller" },
    ],
    stempelTage: 22,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "A" },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    vorname: "Lucia",
    nachname: "Ferrari",
    qualifikation: "ohne_srk",
    status: "fehlende_dokumente",
    billingReadiness: "nicht_abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0048", name: "Gino Ferrari" },
    ],
    stempelTage: 10,
    stempelSoll: 22,
    stempelWarnings: [
      { type: "spitalaufenthalt", label: "Spitalaufenthalt" },
      { type: "fehlende_tage", label: "Fehlende Tage" },
    ],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "ja",
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
    vorname: "Margrit",
    nachname: "Keller",
    qualifikation: "fage_dipl",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0050", name: "Werner Keller" },
      { id: "P-2026-0041", name: "Hans-Rudolf Steiner" },
    ],
    stempelTage: 21,
    stempelSoll: 22,
    stempelWarnings: [],
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: "B" },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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
    vorname: "Claudia",
    nachname: "Huber",
    qualifikation: "ohne_srk",
    status: "aktiv",
    billingReadiness: "abrechenbar",
    zugeordnetePatientenList: [
      { id: "P-2026-0043", name: "Fatmire Rexhepi" },
    ],
    stempelTage: 17,
    stempelSoll: 22,
    stempelWarnings: [{ type: "spitalaufenthalt", label: "Spitalaufenthalt" }],
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: "A" },
    ...LEERE_ERHEBUNG,
    srkZertifikatVorhanden: "nein",
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