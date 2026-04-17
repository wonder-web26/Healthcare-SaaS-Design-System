/*
 * ─────────────────────────────────────────
 *  Shared patient data & types
 * ─────────────────────────────────────────
 */

export type PatientStatus =
  | "aktiv"
  | "nicht_abrechenbar"
  | "gekuendigt";

export type Schweregrad = "leicht" | "mittel" | "schwer" | "kritisch";

export type AbrechnungsStatus =
  | "abrechenbar"
  | "nicht_abrechenbar"
  | "in_vorbereitung"
  | "gekuendigt";

export interface Patient {
  id: string;
  vorname: string;
  nachname: string;
  angehoeriger: string;
  angehoerigerTelefon: string;
  status: PatientStatus;
  kanton: string;
  schweregrad: Schweregrad;
  pflegefachkraft: string;
  pflegefachkraftInitialen: string;
  ahvNummer: string;
  geburtsdatum: string;
  adresse: string;
  leistungsart: string;
  aufnahmeDatum: string;
  letzterBesuch: string;
  sprache: string;
  /* ── Extended fields ──────────────────── */
  abrechnungsStatus: AbrechnungsStatus;
  reAssessmentTage: number | null; // days until re-assessment, null = n/a
  offeneActionTasks: number;
  letzteAktivitaet: string; // date string or description
  abrechnungsstoppGrund: string; // reason for billing stop
  medlinkSync: "synced" | "pending" | "error";
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
};

/* ── Status modal explanations ─────────── */
export const statusExplanations: Record<
  string,
  { title: string; description: string; detail: string }
> = {
  aktiv: {
    title: "Abrechenbar",
    description:
      "Alle Voraussetzungen für die Abrechnung sind erfüllt. Die Leistungen dieses Patienten können über die Krankenkasse oder den Kanton abgerechnet werden.",
    detail:
      "Kostengutsprache liegt vor. Ärztliche Verordnung ist gültig. Leistungserfassung ist aktiv.",
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
export const patients: Patient[] = [
  {
    id: "P-2026-0041",
    vorname: "Anna",
    nachname: "Müller",
    angehoeriger: "Peter Müller (Ehemann)",
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
    letzterBesuch: "25.02.2026",
    sprache: "Deutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentTage: 30,
    offeneActionTasks: 2,
    letzteAktivitaet: "24.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Dokumentation überprüfen",
      faelligDatum: "01.03.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0042",
    vorname: "Thomas",
    nachname: "Schmid",
    angehoeriger: "Lisa Schmid (Tochter)",
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
    sprache: "Deutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "in_vorbereitung",
    reAssessmentTage: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "20.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "pending",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Kostengutsprache einholen",
      faelligDatum: "25.02.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0043",
    vorname: "Maria",
    nachname: "Weber",
    angehoeriger: "Johannes Weber (Sohn)",
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
    letzterBesuch: "24.02.2026",
    sprache: "Italienisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentTage: 45,
    offeneActionTasks: 0,
    letzteAktivitaet: "24.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Re-Assessment durchführen",
      faelligDatum: "15.04.2026",
      ueberfaellig: false,
    },
  },
  {
    id: "P-2026-0044",
    vorname: "Klaus",
    nachname: "Fischer",
    angehoeriger: "Monika Fischer (Ehefrau)",
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
    letzterBesuch: "10.02.2026",
    sprache: "Deutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "gekuendigt",
    reAssessmentTage: null,
    offeneActionTasks: 0,
    letzteAktivitaet: "10.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: null,
  },
  {
    id: "P-2026-0045",
    vorname: "Sabine",
    nachname: "Becker",
    angehoeriger: "Hans Becker (Bruder)",
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
    letzterBesuch: "23.02.2026",
    sprache: "Deutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "nicht_abrechenbar",
    reAssessmentTage: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "23.02.2026",
    abrechnungsstoppGrund: "Fehlende Kostengutsprache",
    medlinkSync: "error",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Kostengutsprache einholen",
      faelligDatum: "28.02.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0046",
    vorname: "Peter",
    nachname: "Hoffmann",
    angehoeriger: "Ruth Hoffmann (Tochter)",
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
    reAssessmentTage: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "22.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "pending",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Bedarfsmeldung erstellen",
      faelligDatum: "25.02.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0047",
    vorname: "Elisabeth",
    nachname: "Brunner",
    angehoeriger: "Stefan Brunner (Sohn)",
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
    letzterBesuch: "26.02.2026",
    sprache: "Deutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentTage: 30,
    offeneActionTasks: 0,
    letzteAktivitaet: "26.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Re-Assessment planen",
      faelligDatum: "28.03.2026",
      ueberfaellig: false,
    },
  },
  {
    id: "P-2026-0048",
    vorname: "Heinrich",
    nachname: "Steiner",
    angehoeriger: "Ursula Steiner (Ehefrau)",
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
    letzterBesuch: "21.02.2026",
    sprache: "Französisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "nicht_abrechenbar",
    reAssessmentTage: null,
    offeneActionTasks: 1,
    letzteAktivitaet: "21.02.2026",
    abrechnungsstoppGrund: "Kritische Gesundheitslage",
    medlinkSync: "error",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Arztbericht einholen",
      faelligDatum: "28.02.2026",
      ueberfaellig: true,
    },
  },
  {
    id: "P-2026-0049",
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
    letzterBesuch: "25.02.2026",
    sprache: "Deutsch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentTage: 60,
    offeneActionTasks: 0,
    letzteAktivitaet: "25.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: null,
  },
  {
    id: "P-2026-0050",
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
    letzterBesuch: "24.02.2026",
    sprache: "Portugiesisch",
    /* ── Extended fields ──────────────────── */
    abrechnungsStatus: "abrechenbar",
    reAssessmentTage: 45,
    offeneActionTasks: 0,
    letzteAktivitaet: "24.02.2026",
    abrechnungsstoppGrund: "",
    medlinkSync: "synced",
    /* ── Prozessstatus / Workflow ──────────── */
    prozessStatus: {
      naechsteAufgabe: "Bewilligung prüfen",
      faelligDatum: "10.03.2026",
      ueberfaellig: false,
    },
  },
];