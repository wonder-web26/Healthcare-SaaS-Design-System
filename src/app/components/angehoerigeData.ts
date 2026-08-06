/*
 * ─────────────────────────────────────────
 *  Shared Angehörige data & types
 * ─────────────────────────────────────────
 */

import type { Zulagenart } from "./StepAngehoeriger";

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
  /** Vereinheitlichtes Vokabular: K = Kinderzulage, W = Ausbildungszulage. */
  zulagenart: Zulagenart;
  typQuelle: string;
  overrideBegruendung: string;
}

/**
 * Leeres Kind des Bestands — genau ein Weg, eines zu erzeugen.
 *
 * Gegenstück zu `createEmptyKind()` des Onboardings, das den dortigen
 * `KindEntry` liefert. Getrennt, weil die beiden Modelle verschiedene Felder
 * tragen (`name` gegen `nachname`, Ausbildungsstatus und Doppelbezug nur im
 * Onboarding). Vorbelegung der Zulagenart K wie im Onboarding.
 */
export function createEmptyAngehoerigerKind(): AngehoerigerKind {
  return {
    id: crypto.randomUUID(),
    vorname: "", name: "", geburtsdatum: "", geschlecht: "", ahvNummer: "",
    inAusbildung: "", ausbildungsbeginn: "",
    zulagenart: "K", typQuelle: "", overrideBegruendung: "",
  };
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
  /** Betrieblich: welche Dokumente einer Person vorliegen. Zustand wie Stempeltage. */
  dokumente: AngehoerigerDokument[];
}

export interface AngehoerigerDokument {
  name: string;
  status: "hochgeladen" | "fehlend" | "abgelaufen";
  datum: string;
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
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: null },
    geschlecht: "weiblich",
    geburtsdatum: "12.09.1974",
    ahvNummer: "756.3412.8890.44",
    zivilstand: "verheiratet",
    zivilstandSeit: "22.05.1998",
    strasse: "Rosenweg 14",
    plz: "8400",
    ort: "Winterthur",
    email: "vera.steiner@bluewin.ch",
    telefon: "+41 79 412 55 08",
    krankenkasseName: "helsana",
    kartennummer: "80756000112233445",
    bagNr: "0580",
    nationalitaet: "schweiz",
    heimatort: "Winterthur ZH",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "evangelisch_reformiert",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "Hans-Rudolf",
    partnerName: "Steiner",
    partnerGeburtsdatum: "14.06.1956",
    partnerNationalitaet: "schweiz",
    partnerAufenthaltsstatus: "CH",
    partnerErwerbstaetig: "nein",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_srk",
    eintrittsdatum: "01.09.2025",
    stundenlohn: "34.50",
    ferienanspruchWochen: "5.0",
    bankname: "Zürcher Kantonalbank",
    iban: "CH21 0070 0110 0033 4455 6",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.09.2025" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.09.2025" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "03.09.2025" },
      { name: "SRK-Pflegehelfer-Zertifikat", status: "hochgeladen", datum: "10.09.2025" },
    ],
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
    geschlecht: "weiblich",
    geburtsdatum: "03.07.1969",
    ahvNummer: "756.8821.3345.09",
    zivilstand: "ledig",
    zivilstandSeit: "",
    strasse: "Bahnhofstrasse 8",
    plz: "9100",
    ort: "Herisau",
    email: "b.huebscher@gmx.ch",
    telefon: "+41 79 220 41 77",
    krankenkasseName: "css",
    kartennummer: "80756000223344556",
    bagNr: "0008",
    nationalitaet: "schweiz",
    heimatort: "Herisau AR",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "konfessionslos",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "nein",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "",
    partnerName: "",
    partnerGeburtsdatum: "",
    partnerNationalitaet: "",
    partnerAufenthaltsstatus: "",
    partnerErwerbstaetig: "",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_ohne_srk",
    eintrittsdatum: "01.11.2025",
    stundenlohn: "31.00",
    ferienanspruchWochen: "4.0",
    bankname: "Raiffeisen Appenzeller Land",
    iban: "CH44 8080 8001 2345 6789 0",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.11.2025" },
      { name: "Krankenkassenkarte", status: "fehlend", datum: "—" },
      { name: "Bankkarte / IBAN-Nachweis", status: "fehlend", datum: "—" },
    ],
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
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: "B" },
    geschlecht: "maennlich",
    geburtsdatum: "18.02.1980",
    ahvNummer: "756.1190.7723.61",
    zivilstand: "verheiratet",
    zivilstandSeit: "09.08.2004",
    strasse: "Feldstrasse 27",
    plz: "8400",
    ort: "Winterthur",
    email: "a.rexhepi@hispeed.ch",
    telefon: "+41 78 604 19 32",
    krankenkasseName: "swica",
    kartennummer: "80756000334455667",
    bagNr: "1384",
    nationalitaet: "andere",
    heimatort: "",
    aufenthaltsstatus: "B",
    einreisedatum: "12.03.2003",
    zemisNummer: "84512367",
    einreichungsdatumMigrationsamt: "15.01.2026",
    bewilligungAblaufdatum: "31.12.2027",
    spezialbewilligungEinreichungsDatum: "20.01.2026",
    spezialbewilligungStatus: "eingereicht",
    quellensteuer: "ja",
    konfession: "muslimisch",
    quellensteuerTarif: "B2N",
    tarifcodeQuelle: "abgeleitet",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "Fatmire",
    partnerName: "Rexhepi",
    partnerGeburtsdatum: "21.03.1983",
    partnerNationalitaet: "andere",
    partnerAufenthaltsstatus: "B",
    partnerErwerbstaetig: "nein",
    hatUnterhaltspflichtigeKinder: "ja",
    anzahlKinder: "2",
    kinderzulagenUeberSpitex: "ja",
    kinder: [
      { id: "K1", vorname: "Elira", name: "Rexhepi", geburtsdatum: "14.05.2012", geschlecht: "weiblich", ahvNummer: "756.4455.6677.12",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
      { id: "K2", vorname: "Dardan", name: "Rexhepi", geburtsdatum: "27.09.2016", geschlecht: "maennlich", ahvNummer: "756.5566.7788.23",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
    ],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "fage",
    eintrittsdatum: "01.03.2025",
    stundenlohn: "38.00",
    ferienanspruchWochen: "4.0",
    bankname: "PostFinance",
    iban: "CH31 0900 0000 8877 6655 4",
    deutschNiveau: "b2",
    zertifikatVorhanden: "ja",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.03.2025" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.03.2025" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "04.03.2025" },
      { name: "Ausweis Partner", status: "hochgeladen", datum: "06.03.2025" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "06.03.2025" },
      { name: "Sprachzertifikat Deutsch", status: "hochgeladen", datum: "08.03.2025" },
    ],
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
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: null },
    geschlecht: "maennlich",
    geburtsdatum: "07.11.1971",
    ahvNummer: "756.2237.9014.88",
    zivilstand: "verheiratet",
    zivilstandSeit: "14.06.1996",
    strasse: "Lindenweg 5",
    plz: "9000",
    ort: "St. Gallen",
    email: "y.kaya@bluewin.ch",
    telefon: "+41 79 331 06 25",
    krankenkasseName: "sanitas",
    kartennummer: "80756000445566778",
    bagNr: "1509",
    nationalitaet: "tuerkei",
    heimatort: "",
    aufenthaltsstatus: "C",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "muslimisch",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "Emine",
    partnerName: "Kaya",
    partnerGeburtsdatum: "04.04.1960",
    partnerNationalitaet: "tuerkei",
    partnerAufenthaltsstatus: "C",
    partnerErwerbstaetig: "nein",
    hatUnterhaltspflichtigeKinder: "ja",
    anzahlKinder: "1",
    kinderzulagenUeberSpitex: "nein",
    kinder: [
      { id: "K1", vorname: "Deniz", name: "Kaya", geburtsdatum: "02.02.2012", geschlecht: "maennlich", ahvNummer: "756.6677.8899.34",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
    ],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_srk",
    eintrittsdatum: "01.06.2024",
    stundenlohn: "33.00",
    ferienanspruchWochen: "5.0",
    bankname: "UBS",
    iban: "CH66 0023 0230 1122 3344 5",
    deutschNiveau: "b1",
    zertifikatVorhanden: "ja",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.06.2024" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.06.2024" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "03.06.2024" },
      { name: "SRK-Pflegehelfer-Zertifikat", status: "hochgeladen", datum: "20.06.2024" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "05.06.2024" },
    ],
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
    geschlecht: "weiblich",
    geburtsdatum: "25.01.1962",
    ahvNummer: "756.9903.4471.55",
    zivilstand: "verwitwet",
    zivilstandSeit: "11.04.2019",
    strasse: "Sonnenhalde 3",
    plz: "6210",
    ort: "Sursee",
    email: "erika.huber@sunrise.ch",
    telefon: "+41 79 508 73 14",
    krankenkasseName: "concordia",
    kartennummer: "80756000556677889",
    bagNr: "0290",
    nationalitaet: "schweiz",
    heimatort: "Sursee LU",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "roemisch_katholisch",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "nein",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "",
    partnerName: "",
    partnerGeburtsdatum: "",
    partnerNationalitaet: "",
    partnerAufenthaltsstatus: "",
    partnerErwerbstaetig: "",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_ohne_srk",
    eintrittsdatum: "15.01.2025",
    stundenlohn: "30.50",
    ferienanspruchWochen: "5.0",
    bankname: "Luzerner Kantonalbank",
    iban: "CH55 0077 8001 2233 4455 6",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "16.01.2025" },
      { name: "Krankenkassenkarte", status: "abgelaufen", datum: "16.01.2025" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "17.01.2025" },
    ],
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
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: "A" },
    geschlecht: "weiblich",
    geburtsdatum: "30.06.1983",
    ahvNummer: "756.7714.2208.37",
    zivilstand: "ledig",
    zivilstandSeit: "",
    strasse: "Kirchstrasse 12",
    plz: "78462",
    ort: "Konstanz (DE)",
    email: "m.dasilva@outlook.com",
    telefon: "+49 173 448 21 90",
    krankenkasseName: "visana",
    kartennummer: "80756000667788990",
    bagNr: "1555",
    nationalitaet: "portugal",
    heimatort: "",
    aufenthaltsstatus: "G",
    einreisedatum: "01.02.2019",
    zemisNummer: "71223344",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "ja",
    konfession: "roemisch_katholisch",
    quellensteuerTarif: "A0Y",
    tarifcodeQuelle: "abgeleitet",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "",
    partnerName: "",
    partnerGeburtsdatum: "",
    partnerNationalitaet: "",
    partnerAufenthaltsstatus: "",
    partnerErwerbstaetig: "",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_srk",
    eintrittsdatum: "01.02.2026",
    stundenlohn: "32.00",
    ferienanspruchWochen: "4.0",
    bankname: "Thurgauer Kantonalbank",
    iban: "CH88 0078 4001 5566 7788 9",
    deutschNiveau: "b2",
    zertifikatVorhanden: "ja",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.02.2026" },
      { name: "Krankenkassenkarte", status: "fehlend", datum: "—" },
      { name: "Bankkarte / IBAN-Nachweis", status: "fehlend", datum: "—" },
      { name: "SRK-Pflegehelfer-Zertifikat", status: "hochgeladen", datum: "05.02.2026" },
    ],
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
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: null },
    geschlecht: "weiblich",
    geburtsdatum: "14.04.1978",
    ahvNummer: "756.5528.1163.72",
    zivilstand: "geschieden",
    zivilstandSeit: "03.02.2016",
    strasse: "Ringstrasse 41",
    plz: "4900",
    ort: "Langenthal",
    email: "heidi.boesiger@bluewin.ch",
    telefon: "+41 79 645 12 08",
    krankenkasseName: "kpt",
    kartennummer: "80756000778899001",
    bagNr: "0376",
    nationalitaet: "schweiz",
    heimatort: "Langenthal BE",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "evangelisch_reformiert",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "",
    partnerName: "",
    partnerGeburtsdatum: "",
    partnerNationalitaet: "",
    partnerAufenthaltsstatus: "",
    partnerErwerbstaetig: "",
    hatUnterhaltspflichtigeKinder: "ja",
    anzahlKinder: "2",
    kinderzulagenUeberSpitex: "ja",
    kinder: [
      { id: "K1", vorname: "Nina", name: "Bösiger", geburtsdatum: "19.08.2011", geschlecht: "weiblich", ahvNummer: "756.7788.9900.45",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
      { id: "K2", vorname: "Timo", name: "Bösiger", geburtsdatum: "06.05.2015", geschlecht: "maennlich", ahvNummer: "756.8899.0011.56",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
    ],
    arbeitetExtern: "ja",
    externeFunktion: "Fachfrau Gesundheit, Alterszentrum Langenthal",
    externesPensumProzent: "40",
    externerEintritt: "01.03.2021",
    bvgAnbindungGewuenscht: "nein",
    funktion: "fage",
    eintrittsdatum: "01.09.2024",
    stundenlohn: "39.50",
    ferienanspruchWochen: "5.0",
    bankname: "Berner Kantonalbank",
    iban: "CH19 0079 0016 7788 9900 1",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.09.2024" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.09.2024" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "03.09.2024" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "06.09.2024" },
    ],
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
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: "A" },
    geschlecht: "weiblich",
    geburtsdatum: "08.12.1966",
    ahvNummer: "756.3390.8825.16",
    zivilstand: "ledig",
    zivilstandSeit: "",
    strasse: "Werkstrasse 9",
    plz: "8005",
    ort: "Zürich",
    email: "l.ferrari@gmail.com",
    telefon: "+41 76 209 55 41",
    krankenkasseName: "assura",
    kartennummer: "80756000889900112",
    bagNr: "1542",
    nationalitaet: "andere",
    heimatort: "",
    aufenthaltsstatus: "F",
    einreisedatum: "04.09.2016",
    zemisNummer: "93344556",
    einreichungsdatumMigrationsamt: "22.01.2026",
    bewilligungAblaufdatum: "30.09.2026",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "ja",
    konfession: "orthodox",
    quellensteuerTarif: "A0N",
    tarifcodeQuelle: "abgeleitet",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "nein",
    uvgVersichert: "ja",
    sozialamtInvolviert: "ja",
    sozialamtKontakt: "Sozialamt Stadt Zürich, 044 412 60 00",
    lohnabtretung: "nein",
    partnerVorname: "",
    partnerName: "",
    partnerGeburtsdatum: "",
    partnerNationalitaet: "",
    partnerAufenthaltsstatus: "",
    partnerErwerbstaetig: "",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_ohne_srk",
    eintrittsdatum: "01.12.2025",
    stundenlohn: "29.50",
    ferienanspruchWochen: "4.0",
    bankname: "Migros Bank",
    iban: "CH77 0840 1000 6677 8899 0",
    deutschNiveau: "a2",
    zertifikatVorhanden: "nein",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.12.2025" },
      { name: "Krankenkassenkarte", status: "fehlend", datum: "—" },
      { name: "Bankkarte / IBAN-Nachweis", status: "fehlend", datum: "—" },
    ],
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
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: null },
    geschlecht: "maennlich",
    geburtsdatum: "16.03.1959",
    ahvNummer: "756.6641.7792.03",
    zivilstand: "verheiratet",
    zivilstandSeit: "07.10.1985",
    strasse: "Gartenweg 22",
    plz: "5000",
    ort: "Aarau",
    email: "karl.zimmermann@bluewin.ch",
    telefon: "+41 79 774 30 62",
    krankenkasseName: "groupe_mutuel",
    kartennummer: "80756000990011223",
    bagNr: "0509",
    nationalitaet: "schweiz",
    heimatort: "Aarau AG",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "roemisch_katholisch",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "Gertrud",
    partnerName: "Zimmermann",
    partnerGeburtsdatum: "09.02.1961",
    partnerNationalitaet: "schweiz",
    partnerAufenthaltsstatus: "CH",
    partnerErwerbstaetig: "nein",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_srk",
    eintrittsdatum: "01.04.2024",
    stundenlohn: "33.50",
    ferienanspruchWochen: "5.0",
    bankname: "Aargauische Kantonalbank",
    iban: "CH02 0076 1016 4455 6677 8",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.04.2024" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.04.2024" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "03.04.2024" },
      { name: "SRK-Pflegehelfer-Zertifikat", status: "hochgeladen", datum: "28.04.2024" },
    ],
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
    hrCheck: { bankdaten: true, kinderzulagen: true, quellensteuerTarif: null },
    geschlecht: "weiblich",
    geburtsdatum: "21.11.1976",
    ahvNummer: "756.4472.6618.29",
    zivilstand: "verheiratet",
    zivilstandSeit: "30.05.2003",
    strasse: "Seestrasse 60",
    plz: "6300",
    ort: "Zug",
    email: "margrit.keller@hispeed.ch",
    telefon: "+41 79 118 47 25",
    krankenkasseName: "sympany",
    kartennummer: "80756001001122334",
    bagNr: "1384",
    nationalitaet: "schweiz",
    heimatort: "Zug",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "roemisch_katholisch",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "Werner",
    partnerName: "Keller",
    partnerGeburtsdatum: "28.07.1971",
    partnerNationalitaet: "schweiz",
    partnerAufenthaltsstatus: "CH",
    partnerErwerbstaetig: "nein",
    hatUnterhaltspflichtigeKinder: "ja",
    anzahlKinder: "1",
    kinderzulagenUeberSpitex: "ja",
    kinder: [
      { id: "K1", vorname: "Jonas", name: "Keller", geburtsdatum: "12.07.2013", geschlecht: "maennlich", ahvNummer: "756.9900.1122.67",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
    ],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "fage",
    eintrittsdatum: "01.07.2023",
    stundenlohn: "40.00",
    ferienanspruchWochen: "5.0",
    bankname: "Zuger Kantonalbank",
    iban: "CH13 0078 7002 8899 0011 2",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.07.2023" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.07.2023" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "04.07.2023" },
      { name: "Ausweis Partner", status: "hochgeladen", datum: "06.07.2023" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "06.07.2023" },
    ],
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
    geschlecht: "maennlich",
    geburtsdatum: "05.05.1988",
    ahvNummer: "756.8817.3350.94",
    zivilstand: "ledig",
    zivilstandSeit: "",
    strasse: "Malixerstrasse 17",
    plz: "7000",
    ort: "Chur",
    email: "andreas.frei@bluewin.ch",
    telefon: "+41 79 290 66 13",
    krankenkasseName: "oekk",
    kartennummer: "80756001112233445",
    bagNr: "0246",
    nationalitaet: "schweiz",
    heimatort: "Chur GR",
    aufenthaltsstatus: "",
    einreisedatum: "",
    zemisNummer: "",
    einreichungsdatumMigrationsamt: "",
    bewilligungAblaufdatum: "",
    spezialbewilligungEinreichungsDatum: "",
    spezialbewilligungStatus: "",
    quellensteuer: "nein",
    konfession: "konfessionslos",
    quellensteuerTarif: "",
    tarifcodeQuelle: "",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "nein",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "",
    partnerName: "",
    partnerGeburtsdatum: "",
    partnerNationalitaet: "",
    partnerAufenthaltsstatus: "",
    partnerErwerbstaetig: "",
    hatUnterhaltspflichtigeKinder: "nein",
    anzahlKinder: "0",
    kinderzulagenUeberSpitex: "nein",
    kinder: [],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_srk",
    eintrittsdatum: "01.10.2025",
    stundenlohn: "31.50",
    ferienanspruchWochen: "4.0",
    bankname: "Graubündner Kantonalbank",
    iban: "CH35 0077 4001 3344 5566 7",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.10.2025" },
      { name: "Krankenkassenkarte", status: "fehlend", datum: "—" },
      { name: "Bankkarte / IBAN-Nachweis", status: "fehlend", datum: "—" },
    ],
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
    hrCheck: { bankdaten: true, kinderzulagen: false, quellensteuerTarif: "C" },
    geschlecht: "weiblich",
    geburtsdatum: "02.02.1981",
    ahvNummer: "756.1163.5528.71",
    zivilstand: "verheiratet",
    zivilstandSeit: "18.09.2010",
    strasse: "Obergrundstrasse 88",
    plz: "6003",
    ort: "Luzern",
    email: "claudia.huber@sunrise.ch",
    telefon: "+41 79 836 22 49",
    krankenkasseName: "atupri",
    kartennummer: "80756001223344556",
    bagNr: "0312",
    nationalitaet: "oesterreich",
    heimatort: "",
    aufenthaltsstatus: "B",
    einreisedatum: "20.08.2007",
    zemisNummer: "66778899",
    einreichungsdatumMigrationsamt: "05.02.2026",
    bewilligungAblaufdatum: "31.08.2028",
    spezialbewilligungEinreichungsDatum: "10.02.2026",
    spezialbewilligungStatus: "eingereicht",
    quellensteuer: "ja",
    konfession: "roemisch_katholisch",
    quellensteuerTarif: "C3Y",
    tarifcodeQuelle: "abgeleitet",
    tarifcodeOverrideBegruendung: "",
    bvgVersichert: "ja",
    uvgVersichert: "ja",
    sozialamtInvolviert: "nein",
    sozialamtKontakt: "",
    lohnabtretung: "nein",
    partnerVorname: "Stefan",
    partnerName: "Huber",
    partnerGeburtsdatum: "11.01.1979",
    partnerNationalitaet: "oesterreich",
    partnerAufenthaltsstatus: "B",
    partnerErwerbstaetig: "ja",
    hatUnterhaltspflichtigeKinder: "ja",
    anzahlKinder: "3",
    kinderzulagenUeberSpitex: "nein",
    kinder: [
      { id: "K1", vorname: "Mia", name: "Huber", geburtsdatum: "03.03.2012", geschlecht: "weiblich", ahvNummer: "756.2233.4455.78",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
      { id: "K2", vorname: "Luca", name: "Huber", geburtsdatum: "25.06.2015", geschlecht: "maennlich", ahvNummer: "756.3344.5566.89",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
      { id: "K3", vorname: "Elin", name: "Huber", geburtsdatum: "09.11.2019", geschlecht: "weiblich", ahvNummer: "756.4455.6677.90",
        inAusbildung: "", ausbildungsbeginn: "", zulagenart: "K", typQuelle: "abgeleitet", overrideBegruendung: "" },
    ],
    arbeitetExtern: "nein",
    externeFunktion: "",
    externesPensumProzent: "",
    externerEintritt: "",
    bvgAnbindungGewuenscht: "",
    funktion: "ph_ohne_srk",
    eintrittsdatum: "01.08.2025",
    stundenlohn: "30.00",
    ferienanspruchWochen: "5.0",
    bankname: "Luzerner Kantonalbank",
    iban: "CH49 0077 8000 9911 2233 4",
    deutschNiveau: "muttersprache",
    zertifikatVorhanden: "",
    steuergemeinde: "", lohnart: "",
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
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.08.2025" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.08.2025" },
      { name: "Bankkarte / IBAN-Nachweis", status: "hochgeladen", datum: "04.08.2025" },
      { name: "Ausweis Partner", status: "hochgeladen", datum: "06.08.2025" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "07.08.2025" },
    ],
  },
];