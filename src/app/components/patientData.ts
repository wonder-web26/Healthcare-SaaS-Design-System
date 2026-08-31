/*
 * ─────────────────────────────────────────
 *  Shared patient data & types
 * ─────────────────────────────────────────
 */

export type PatientStatus =
  | "im_onboarding"
  | "aktiv"
  | "nicht_abrechenbar"
  | "gekuendigt"
  /**
   * Z — die Person bezieht keine Spitex-Leistungen mehr.
   *
   * Nicht dasselbe wie `gekuendigt`: das meint die Kündigung des Vertrags,
   * der Austritt das Ende der Leistungen. Der Katalog unterscheidet zudem
   * Entlassung und Einsatzabbruch — bei einem Abbruch wird kein Formular
   * Entlassung ausgefüllt. Diese Unterscheidung kennt das Produkt nicht;
   * sie ist als Lücke vermerkt.
   */
  | "ausgetreten";

export type Schweregrad = "leicht" | "mittel" | "schwer" | "kritisch";

export type AbrechnungsStatus =
  | "abrechenbar"
  | "nicht_abrechenbar"
  | "in_vorbereitung"
  | "gekuendigt"
  /**
   * Austritt — es entstehen keine Leistungen mehr, also gibt es auch nichts
   * abzurechnen. Bewusst nicht "nicht_abrechenbar": das bezeichnet eine
   * Sperre mit Grund an einem laufenden Fall. Und bewusst nicht "gekuendigt":
   * sonst stünde am ausgetretenen Patienten die Beschriftung "Gekündigt".
   */
  | "ausgetreten";

export interface Patient {
  id: string;
  /** Onboarding, aus dem dieser Patient entstanden ist. null = Altbestand ohne Mandat. */
  onboardingId: string | null;
  vorname: string;
  nachname: string;
  /** Aus der Verknüpfung zum Angehörigen — NICHT aus dem Notfallkontakt abgeleitet. */
  angehoeriger: string;
  angehoerigerTelefon: string;
  status: PatientStatus;
  kanton: string;
  /** Leer erlaubt: wird im Onboarding nicht erhoben und dann nirgends dargestellt. */
  schweregrad: Schweregrad | "";
  pflegefachkraft: string;
  pflegefachkraftInitialen: string;
  ahvNummer: string;
  geburtsdatum: string;
  adresse: string;
  leistungsart: string;
  aufnahmeDatum: string;
  letzterBesuch: string;
  sprache: string;
  /* Versicherungen liegen als eigene Versicherungsverhältnisse vor
     (lib/versicherung/store.ts), nicht mehr als Felder am Patienten. */
  /* ── Aus dem Abklärungsgespräch, bisher nicht übergeben ──────────────────
     28 Angaben wurden im Gespräch erhoben und kamen nie beim Patienten an.
     Sie stehen jetzt hier; gefüllt werden sie beim Abschluss eines
     Onboardings. Für die bestehenden Patienten bleiben sie leer — erfundene
     Werte wären schlimmer als ein erklärter Leerzustand. */
  /** BB2 — Code aus lib/stammdaten/geschlecht. */
  geschlecht: string;
  /** BB12 — Code aus lib/stammdaten/staatsangehoerigkeit. */
  staatsangehoerigkeit: string;
  heimatort: string;
  /** BB4 — Code aus lib/stammdaten/zivilstand. */
  zivilstand: string;
  aufenthaltsstatus: string;
  /** Bei Sterbebegleitung und Ernährung fachlich erheblich. */
  konfession: string;
  /** Im Gespräch erhoben, hatte bisher kein Ziel am Patienten. */
  telefon: string;
  email: string;
  /** BB13 Code 21 — Sprache als Freitext, wenn der Katalog sie nicht kennt. */
  spracheAndere: string;
  /** BB14 — Code aus lib/stammdaten/sda-ja-nein. */
  uebersetzerNotwendig: string;
  /** BB9 — Code aus lib/stammdaten/sda-wohnsituation. */
  wohnsituation: string;
  /** BB10a — Code aus lib/stammdaten/sda-zusammenleben. */
  formZusammenleben: string;
  /** BB10b — Code aus lib/stammdaten/sda-ja-nein. */
  neuZusammenlebend: string;
  etage: string;
  liftVorhanden: string;
  treppen: string;
  personenImHaushalt: string;
  ivBezug: string;
  ivBezugProzent: string;
  hilflosenentschaedigung: string;
  /** PA-01 — IV-Assistenzbeitrag. */
  assistenzbeitrag: string;
  quellensteuerHinweise: string;
  /* ── Bereich Z · Entlassung ──────────────────────────────────────────────
     Erst beim Austritt gefüllt. Leer heisst „nicht ausgetreten"; der Zustand
     sagt es ebenfalls, aber die Felder tragen das Wann und Wohin. */
  /** Z1 — letzter Tag der Inanspruchnahme, TT.MM.JJJJ. */
  austrittDatum: string;
  /** Z2 — Code aus lib/stammdaten/entlassung. */
  austrittNach: string;
  /** Z2 Code 13 — Lebensumstände als Freitext. */
  austrittNachAndere: string;
  /** Bereich Z · Individuelle Präzisierungen. */
  austrittPraezisierungen: string;
  /**
   * Z3 — wer den Austritt kodiert hat.
   *
   * Der Katalog verlangt eine Unterschrift. Das Produkt kennt keine; bei
   * BB17 wurde derselbe Punkt als Protokoll gelöst — wer, wann. Hier ebenso.
   * Als Abweichung vom Katalog vermerkt.
   */
  austrittErfasstVon: string;
  austrittErfasstAm: string;
  /* ── Notfallkontakt — eigene Person, unabhängig vom Angehörigen ── */
  /* ── Extended fields ──────────────────── */
  abrechnungsStatus: AbrechnungsStatus;
  /** Absolutes Fristdatum (ISO). null = keine Frist; die Tageszahl wird gegen das
   *  Bezugsdatum gerechnet, nicht gespeichert. */
  reAssessmentFrist: string | null;
  offeneActionTasks: number | null;
  letzteAktivitaet: string; // date string or description
  abrechnungsstoppGrund: string; // reason for billing stop
  /** "" = kein Wert; im Onboarding wird nichts dazu erhoben. */
  medlinkSync: "synced" | "pending" | "error" | "";
  /** Krankenkasse des Patienten (für kassenspezifische Abrechnungsregeln) */
  /* ── Prozessstatus / Workflow ──────────── */
  prozessStatus: {
    naechsteAufgabe: string;
    faelligDatum: string; // dd.mm.yyyy
    ueberfaellig: boolean;
  } | null; // null = keine offene Aufgabe
}

/* ── Status config ─────────────────────── */
export const statusConfig: Record<
  PatientStatus,
  { label: string; bg: string; text: string; dot: string; variant: string }
> = {
  im_onboarding: {
    label: "Im Onboarding",
    bg: "bg-neutral-medium",
    text: "text-neutral-foreground",
    dot: "bg-neutral",
    variant: "neutral",
  },
  aktiv: {
    label: "Aktiv",
    bg: "bg-success-light",
    text: "text-success-foreground",
    dot: "bg-success",
    variant: "success",
  },
  nicht_abrechenbar: {
    label: "Nicht abrechenbar",
    bg: "bg-error-light",
    text: "text-error-foreground",
    dot: "bg-error",
    variant: "error",
  },
  ausgetreten: {
    label: "Ausgetreten",
    bg: "bg-neutral-medium",
    text: "text-neutral-foreground",
    dot: "bg-neutral",
    variant: "neutral",
  },
  gekuendigt: {
    label: "Gekündigt",
    bg: "bg-error-light",
    text: "text-error-foreground",
    dot: "bg-error",
    variant: "destructive",
  },
};

/* ── Schweregrad config ────────────────── */
export const schweregradConfig: Record<
  Schweregrad,
  { label: string; bg: string; text: string }
> = {
  leicht: {
    label: "Leicht",
    bg: "bg-success-light",
    text: "text-success-foreground",
  },
  mittel: {
    label: "Mittel",
    bg: "bg-warning-light",
    text: "text-warning-foreground",
  },
  schwer: {
    label: "Schwer",
    bg: "bg-error-light",
    text: "text-error-foreground",
  },
  kritisch: {
    label: "Kritisch",
    bg: "bg-error-medium",
    text: "text-error-foreground",
  },
};

/* ── Abrechnungs-Status config ────────── */
export const abrechnungsStatusConfig: Record<
  AbrechnungsStatus,
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
  ausgetreten: {
    label: "Ausgetreten",
    bg: "bg-neutral-medium",
    text: "text-neutral-foreground",
    dot: "bg-neutral",
  },
};

/* ── Status modal explanations ─────────── */
export const statusExplanations: Record<
  string,
  { title: string; description: string; detail: string }
> = {
  im_onboarding: {
    title: "Im Onboarding",
    description:
      "Der Patient wird gerade im Onboarding erfasst. Er erscheint noch nicht in der Patientenliste; erst mit dem Abschluss des Onboardings wechselt er auf Aktiv.",
    detail:
      "Bis dahin sind alle bereits erfassten Angaben im Dossier sichtbar und können weiter ergänzt werden.",
  },
  aktiv: {
    title: "Abrechenbar",
    description:
      "Alle Voraussetzungen für die Abrechnung sind erfüllt. Die Leistungen dieses Patienten können über die Krankenkasse oder den Kanton abgerechnet werden.",
    detail:
      "Kostengutsprache liegt vor. Ärztliche Verordnung ist gültig. Leistungserfassung ist aktiv.",
  },
  ausgetreten: {
    title: "Ausgetreten",
    description:
      "Die Person bezieht keine Spitex-Leistungen mehr. Der Austritt wird im Dossier unter Patient erfasst, nicht hier — dort werden Austrittsdatum und Lebensumstände nach dem Austritt festgehalten.",
    detail:
      "Ein Austritt ist kein Abrechnungsstopp. Er beendet die laufenden Mandate und lässt sich hier nicht setzen und nicht zurücknehmen.",
  },
  nicht_abrechenbar: {
    title: "Nicht abrechenbar",
    description:
      "Die Leistungen für diesen Patienten können derzeit nicht abgerechnet werden. Mögliche Gründe: fehlende Kostengutsprache, abgelaufene Verordnung oder administrativer Stopp.",
    detail:
      "Bitte klären Sie den Abrechnungsstopp mit der zuständigen Sachbearbeiterin und dokumentieren Sie den Grund.",
  },
  gekuendigt: {
    title: "Gekündigt",
    description:
      "Das Pflegeverhältnis wurde beendet. Der Patient oder die Krankenkasse hat die Leistungen gekündigt. Es können keine weiteren Leistungen erfasst oder abgerechnet werden.",
    detail:
      "Alle offenen Leistungen müssen vor der endgültigen Archivierung abgeschlossen werden.",
  },
};

/* ── Realistic German sample data ──────── */
/**
 * Startbestand. Der lebende Bestand liegt in lib/patienten/store.ts; von dort
 * lesen alle Ansichten. Diese Liste wird nur einmal als Ausgangswert eingelesen.
 */
export const patientenSeed: Patient[] = [
  {
    id: "P-2026-0041",
    onboardingId: "OB-2026-101",
    vorname: "Hans-Rudolf",
    nachname: "Steiner",
    angehoeriger: "Vera Steiner (Ehefrau)",
    angehoerigerTelefon: "+41 44 312 55 01",
    status: "aktiv",
    kanton: "ZH",
    schweregrad: "mittel",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    ahvNummer: "756.1234.5678.90",
    geburtsdatum: "15.03.1948",
    adresse: "Bahnhofstrasse 42, 8001 Zürich",
    leistungsart: "Pflege HKP",
    aufnahmeDatum: "12.01.2026",
    letzterBesuch: "31.07.2026",
    sprache: "Schweizerdeutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentFrist: "2026-09-03",
    offeneActionTasks: 2,
    letzteAktivitaet: "28.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Dokumentation überprüfen",
      faelligDatum: "02.08.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0042",
    onboardingId: "OB-2026-102",
    vorname: "Marie-Louise",
    nachname: "Hübscher-Wiederkehr",
    angehoeriger: "Beatrice Hübscher-Wiederkehr (Tochter)",
    angehoerigerTelefon: "+41 44 320 18 44",
    status: "aktiv",
    kanton: "ZH",
    schweregrad: "leicht",
    pflegefachkraft: "Kathrin Meier",
    pflegefachkraftInitialen: "KM",
    ahvNummer: "756.9876.5432.10",
    geburtsdatum: "08.11.1955",
    adresse: "Oerlikonerstrasse 15, 8057 Zürich",
    leistungsart: "Hauswirtschaft",
    aufnahmeDatum: "20.02.2026",
    letzterBesuch: "—",
    sprache: "Schweizerdeutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "in_vorbereitung",
    reAssessmentFrist: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "24.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "pending",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Kostengutsprache einholen",
      faelligDatum: "29.07.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0043",
    onboardingId: "OB-2026-103",
    vorname: "Fatmire",
    nachname: "Rexhepi",
    angehoeriger: "Arben Rexhepi (Sohn)",
    angehoerigerTelefon: "+41 44 555 22 10",
    status: "aktiv",
    kanton: "ZH",
    schweregrad: "schwer",
    pflegefachkraft: "Laura Brunner",
    pflegefachkraftInitialen: "LB",
    ahvNummer: "756.1111.2222.33",
    geburtsdatum: "22.06.1940",
    adresse: "Seestrasse 88, 8002 Zürich",
    leistungsart: "Pflege A",
    aufnahmeDatum: "03.09.2025",
    letzterBesuch: "28.07.2026",
    sprache: "Italienisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentFrist: "2026-09-18",
    offeneActionTasks: 0,
    letzteAktivitaet: "28.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Re-Assessment durchführen",
      faelligDatum: "16.09.2026",
      ueberfaellig: false,
    },
  },
  {
    id: "P-2026-0044",
    onboardingId: "OB-2026-104",
    vorname: "Emine",
    nachname: "Kaya",
    angehoeriger: "Yusuf Kaya (Ehemann)",
    angehoerigerTelefon: "+41 44 310 77 33",
    status: "gekuendigt",
    kanton: "AG",
    schweregrad: "mittel",
    pflegefachkraft: "Maria Keller",
    pflegefachkraftInitialen: "MK",
    ahvNummer: "756.4444.5555.66",
    geburtsdatum: "30.01.1952",
    adresse: "Hauptstrasse 5, 5000 Aarau",
    leistungsart: "Beratung",
    aufnahmeDatum: "15.06.2025",
    letzterBesuch: "14.07.2026",
    sprache: "Schweizerdeutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "gekuendigt",
    reAssessmentFrist: null,
    offeneActionTasks: 0,
    letzteAktivitaet: "14.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: null,
  },
  {
    id: "P-2026-0045",
    onboardingId: "OB-2026-105",
    vorname: "Fritz",
    nachname: "Huber",
    angehoeriger: "Erika Huber (Schwester)",
    angehoerigerTelefon: "+41 44 299 33 15",
    status: "nicht_abrechenbar",
    kanton: "ZH",
    schweregrad: "schwer",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    ahvNummer: "756.7777.8888.99",
    geburtsdatum: "18.09.1945",
    adresse: "Schwamendingenstrasse 12, 8051 Zürich",
    leistungsart: "Pflege HKP",
    aufnahmeDatum: "28.07.2025",
    letzterBesuch: "27.07.2026",
    sprache: "Schweizerdeutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "nicht_abrechenbar",
    reAssessmentFrist: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "27.07.2026",
    abrechnungsstoppGrund: "Fehlende Kostengutsprache",
    medlinkSync: "error",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Kostengutsprache einholen",
      faelligDatum: "01.08.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0046",
    onboardingId: "OB-2026-106",
    vorname: "Joaquim",
    nachname: "Da Silva",
    angehoeriger: "Marta Da Silva (Tochter)",
    angehoerigerTelefon: "+41 44 401 12 88",
    status: "aktiv",
    kanton: "SG",
    schweregrad: "leicht",
    pflegefachkraft: "—",
    pflegefachkraftInitialen: "—",
    ahvNummer: "756.3333.4444.55",
    geburtsdatum: "04.04.1960",
    adresse: "Rosenbergstrasse 22, 9000 St. Gallen",
    leistungsart: "Therapie",
    aufnahmeDatum: "22.02.2026",
    letzterBesuch: "—",
    sprache: "Türkisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "in_vorbereitung",
    reAssessmentFrist: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "26.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "pending",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Bedarfsmeldung erstellen",
      faelligDatum: "29.07.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0047",
    onboardingId: "OB-2026-107",
    vorname: "Anna",
    nachname: "Bösiger",
    angehoeriger: "Heidi Bösiger (Tochter)",
    angehoerigerTelefon: "+41 44 488 91 02",
    status: "aktiv",
    kanton: "ZH",
    schweregrad: "mittel",
    pflegefachkraft: "Kathrin Meier",
    pflegefachkraftInitialen: "KM",
    ahvNummer: "756.2222.3333.44",
    geburtsdatum: "11.12.1938",
    adresse: "Limmatquai 74, 8001 Zürich",
    leistungsart: "Pflege HKP",
    aufnahmeDatum: "01.11.2025",
    letzterBesuch: "30.07.2026",
    sprache: "Schweizerdeutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentFrist: "2026-09-03",
    offeneActionTasks: 0,
    letzteAktivitaet: "30.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Re-Assessment planen",
      faelligDatum: "29.08.2026",
      ueberfaellig: false,
    },
  },
  {
    id: "P-2026-0048",
    onboardingId: "OB-2026-108",
    vorname: "Gino",
    nachname: "Ferrari",
    angehoeriger: "Lucia Ferrari (Ehefrau)",
    angehoerigerTelefon: "+41 44 677 45 20",
    status: "nicht_abrechenbar",
    kanton: "BE",
    schweregrad: "kritisch",
    pflegefachkraft: "Laura Brunner",
    pflegefachkraftInitialen: "LB",
    ahvNummer: "756.5555.6666.77",
    geburtsdatum: "19.07.1935",
    adresse: "Bundesgasse 10, 3011 Bern",
    leistungsart: "Pflege A",
    aufnahmeDatum: "05.04.2025",
    letzterBesuch: "25.07.2026",
    sprache: "Französisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "nicht_abrechenbar",
    reAssessmentFrist: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "25.07.2026",
    abrechnungsstoppGrund: "Kritische Gesundheitslage",
    medlinkSync: "error",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Arztbericht einholen",
      faelligDatum: "01.08.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0049",
    onboardingId: null,
    vorname: "Gertrud",
    nachname: "Zimmermann",
    angehoeriger: "Karl Zimmermann (Ehemann)",
    angehoerigerTelefon: "+41 44 555 88 43",
    status: "aktiv",
    kanton: "ZH",
    schweregrad: "leicht",
    pflegefachkraft: "Sandra Weber",
    pflegefachkraftInitialen: "SW",
    ahvNummer: "756.8888.9999.00",
    geburtsdatum: "25.05.1950",
    adresse: "Hönggerstrasse 31, 8037 Zürich",
    leistungsart: "Hauswirtschaft",
    aufnahmeDatum: "18.12.2025",
    letzterBesuch: "02.08.2026",
    sprache: "Schweizerdeutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentFrist: "2026-10-03",
    offeneActionTasks: 0,
    letzteAktivitaet: "29.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: null,
  },
  {
    id: "P-2026-0050",
    onboardingId: null,
    vorname: "Werner",
    nachname: "Keller",
    angehoeriger: "Margrit Keller (Ehefrau)",
    angehoerigerTelefon: "+41 44 210 63 77",
    status: "aktiv",
    kanton: "LU",
    schweregrad: "mittel",
    pflegefachkraft: "Maria Keller",
    pflegefachkraftInitialen: "MK",
    ahvNummer: "756.6666.7777.88",
    geburtsdatum: "02.08.1942",
    adresse: "Pilatusstrasse 8, 6003 Luzern",
    leistungsart: "Pflege HKP",
    aufnahmeDatum: "10.10.2025",
    letzterBesuch: "28.07.2026",
    sprache: "Portugiesisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentFrist: "2026-09-18",
    offeneActionTasks: 0,
    letzteAktivitaet: "28.07.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    geschlecht: "",
    staatsangehoerigkeit: "",
    heimatort: "",
    zivilstand: "",
    aufenthaltsstatus: "",
    konfession: "",
    telefon: "",
    email: "",
    spracheAndere: "",
    uebersetzerNotwendig: "",
    wohnsituation: "",
    formZusammenleben: "",
    neuZusammenlebend: "",
    etage: "",
    liftVorhanden: "",
    treppen: "",
    personenImHaushalt: "",
    ivBezug: "",
    ivBezugProzent: "",
    hilflosenentschaedigung: "",
    assistenzbeitrag: "",
    quellensteuerHinweise: "",
    austrittDatum: "",
    austrittNach: "",
    austrittNachAndere: "",
    austrittPraezisierungen: "",
    austrittErfasstVon: "",
    austrittErfasstAm: "",
    prozessStatus: {
      naechsteAufgabe: "Bewilligung prüfen",
      faelligDatum: "11.08.2026",
      ueberfaellig: false,
    },
  },
];