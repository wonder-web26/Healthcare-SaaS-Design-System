import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  User,
  HeartPulse,
  Home,
  Stethoscope,
  ShieldAlert,
  Pill,
  Phone,
  Scale,
  Brain,
  ChevronDown,
  MapPin,
  ShieldCheck,
  FileText,
  Upload,
  Activity,
  ClipboardList,
  Info,
  Camera,
  Eye,
  Trash2,
  FileCheck,
  FolderSync,
  ScanLine,
  CloudUpload,
  Loader2,
  X,
  RotateCcw,
  Circle,
  Shield,
  ChevronRight,
  Download,
  Layers,
  AlertTriangle,
  ChevronUp,
  Plus,
  Search,
  Sparkles,
  Clock,
  Send,
  Inbox,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

import { useNavigate } from "react-router";
import { LeerZustand } from "./ui/LeerZustand";
import { TabPersonalienV2, TabSteuerV2, TabWohnenUmfeldV2, TabAnamneseV2 } from "./form/MigratedPatientForms";
import { FORMULAR_MAX } from "./form/feldbreiten";
import { TabAktivitaetenV2 } from "./form/MigratedPatientATL";
import { Mic } from "lucide-react";
import { jetztAnzeige } from "../../lib/datum";
import { MOCK_ARZT_DIAGNOSEN } from "../../lib/mocks/klinische-artefakte-mock";
import {
  useKlvVerordnungen, positionHinzufuegen, positionAendern, positionEntfernen, positionenSetzen,
} from "../../lib/klv/store";
import { useRecording } from "../recording/RecordingContext";
import { getPersonByOnboardingId, getOrCreatePersonForOnboarding, offenenFallSicherstellen, erstelleNaechstesFormular, registrierungFuerOnboarding, getOpenFieldCount } from "../../lib/interrai/store";
import { AssessmentStatusView } from "./interrai-neu/AssessmentStatusView";
import type { KLVLeistung, KLVEinheit } from "../../types/klinische-artefakte";
import { ReviewBlock } from "./ui/ReviewBlock";
import { InlineSelect } from "./ui/InlineSelect";
import { TabHeader, HeaderMeta } from "./ui/TabHeader";
import { RhythmusTimeline } from "./rhythmus/RhythmusTimeline";
import { generiereRhythmusTickets } from "../../lib/rhythmus/engine";
import { getKontakt } from "../../lib/kontakte/store";
import { GEGENWART_ISO } from "../../lib/gegenwart";
import { sdaVerlangtInterrai } from "../../lib/stammdaten/sda-einschaetzung-situation";
import { INTERRAI_SCHRITTE } from "../../lib/rhythmus/vorlage";
import { SectionAccordion, SektionBadge } from "./ui/SectionAccordion";
import { ItemRow } from "./ui/ItemRow";
import { hProWoche, einmaligeMin, istPeriodisch, einheitLabel, werLabel, berechnungsText, kompaktParams, berechneSummen, getSimultanPartner } from "../../lib/klv/berechnung";
import { SPITEX_LEISTUNGSKATALOG_2025 } from "../../lib/klv/spitex-leistungskatalog-2025";
import { toast } from "sonner";
import { pruefeInklusiv } from "../../lib/klv/inklusiv-regeln";
import { pruefeKassenregeln } from "../../lib/klv/kassenregeln";
import { useEinwilligung } from "./EinwilligungContext";
import { SectionAction } from "./ui/SectionAction";
import { KONFESSION_OPTIONS } from "../../lib/stammdaten/konfession";
import { Combobox } from "./form/Combobox";
import { VitalzeichenAbschnitt } from "./vitalzeichen/VitalzeichenAbschnitt";
import { AllergienAbschnitt } from "./allergien/AllergienAbschnitt";
import { MedikamenteAbschnitt } from "./medikation/MedikamenteAbschnitt";
import { getPatient, patientFuerOnboarding } from "../../lib/patienten/store";
import { aktiverVersichererName, aktiveVersicherung } from "../../lib/versicherung/store";
import { EROEFFNUNGSGRUND_STANDARD, EROEFFNUNGSGRUND_EINSATZABBRUCH } from "../../lib/stammdaten/sda-eroeffnungsgrund";
import { sichtbareDokumenttypen, istDokumentVollstaendig, type DokumentKontext, type DokumentTypDefinition } from "../../lib/stammdaten/dokumenttypen";
import { DokumentScanUpload, type ScanFile } from "./form/DokumentScanUpload";
import { EinwilligungModal } from "./einwilligung/EinwilligungModal";
import { ScanDisplay, ScanSlot } from "./form/MigratedAngehoerigerForms2";
import { useCurrentUser } from "../auth";
import { KLV_WER_OPTIONS, KLV_WER_STANDARD } from "../../lib/stammdaten/klv-wer";

export interface ATLEntry {
  ja: boolean | null;
  bemerkungen: string;
}

/** Alias — identisch mit ScanFile aus DokumentScanUpload */
export type PatientScanFile = ScanFile;

/** Ein Protokolleintrag nach BB17 — Benutzerin und Zeitpunkt, keine Unterschrift. */
export interface SdaProtokollEintrag {
  benutzer: string;
  zeitpunkt: string;
}

/** Eine Zeile der Vorgeschichte-Listen (chronische Erkrankungen, Eingriffe).
 *  Bewusst Freitext ohne Codes — keine ICD- oder Diagnose-Objekte im Onboarding. */
export interface VorgeschichteEintrag {
  id: string;
  bezeichnung: string;
  /** Freitext: bei Erkrankungen z.B. «seit 2018», bei Eingriffen das Jahr «2019». */
  zeitangabe: string;
}

export interface PatientFormData {
  /* AA1, AA3, BB16, BB17 und die anmeldende Person sind ins
     Registrierungsformular (SDA) herausgelöst und leben nicht mehr hier. */
  /** AA2 — Datum der Eröffnung des Dossiers, alleinige Quelle des Aufnahmedatums. */
  dossierEroeffnetAm: string;
  anmeldungPraezisierungen: string;
  /** Bereich BB · Individuelle Präzisierungen — Freitext, optional. */
  stammdatenPraezisierungen: string;

  /* Tab 1 – Personalien */
  anrede: string;
  name: string;
  vorname: string;
  geburtsdatum: string;
  /** BB2 — Schlüssel aus lib/stammdaten/geschlecht. */
  geschlecht: string;
  /** BB12 — Schlüssel aus lib/stammdaten/staatsangehoerigkeit (volle Länderliste). */
  staatsangehoerigkeit: string;
  heimatort: string;
  /** BB4 — Schlüssel aus lib/stammdaten/zivilstand. */
  zivilstand: string;
  aufenthaltsstatus: string;
  ahvNummer: string;
  email: string;
  telefon: string;
  mobil: string;
  adresseStrasse: string;
  adressePlz: string;
  adresseOrt: string;
  /** Politische Gemeinde (hält den Namen) + BFS-Nummer; Kanton als Auswahl (Code); Land CH. */
  gemeinde: string;
  bfsNummer: string;
  kanton: string;
  land: string;
  /** Abweichender Pflegeort (Wohnsitz ≠ Pflegeort) — mit eigener Gemeinde,
   *  BFS-Nummer und Kanton, weil der Einsatz dort stattfindet. */
  pflegeortAbweichend: boolean;
  pflegeortStrasse: string;
  pflegeortPlz: string;
  pflegeortOrt: string;
  pflegeortGemeinde: string;
  pflegeortBfsNummer: string;
  pflegeortKanton: string;
  pflegeortLand: string;
  /* Der Notfallkontakt ist eine dritte Person und steht im Kontaktbestand.
     Erfasst wird die Kennung, nie der Name — ändert sich der Name am
     Kontakt, ändert er sich überall mit. Die Verwandtschaft bleibt hier:
     sie beschreibt das Verhältnis zu diesem Patienten, nicht die Person. */
  /* Versicherungen liegen als eigene Versicherungsverhältnisse vor
     (lib/versicherung/store.ts), nicht mehr als Formularfelder. */
  /** BB13 — Code aus lib/stammdaten/sda-sprache. */
  spracheCode: string;
  /** BB13 Code 21 — Sprache als Freitext. */
  spracheAndere: string;
  /** BB14 — Code aus lib/stammdaten/sda-ja-nein. */
  uebersetzerNotwendig: string;

  /* Tab 2 – Steuer & Sozialversicherungen */
  ivBezug: string;
  ivBezugProzent: string;
  hilflosenentschaedigung: string;
  /** Grad (leicht/mittel/schwer) — nur mit Bedeutung, wenn die Ja-Nein-Frage «ja» ist. */
  hilflosenentschaedigungGrad?: string;
  /** PA-01: IV-Assistenzbeitrag */
  assistenzbeitrag: string;
  /** Ja/Nein-Indikator; die Kontaktperson des Sozialdiensts steht im Bezugsteam. */
  sozialamtInvolviert: string;
  /** Ja/Nein-Indikator; vertretende Person und Art der Vertretung stehen im Bezugsteam. */
  gesetzlicheVertretung: string;
  /* Vorsorge (Reiter Soziales): zwei getrennte Instrumente nach ZGB.
     Drei Werte "ja" | "nein" | "unbekannt" — Vorgabe "unbekannt":
     "nein" heisst, es gibt keine; "unbekannt" heisst, niemand hat gefragt. */
  patientenverfuegungVorhanden: string;
  patientenverfuegungDatum: string;
  patientenverfuegungBemerkung: string;
  vorsorgeauftragVorhanden: string;
  vorsorgeauftragValidiert: string;
  vorsorgeauftragBemerkung: string;
  konfession: string;
  quellensteuerHinweise: string;

  /* Tab 3 – Anamnese: zwei erzählende Blöcke (Situation, Vorgeschichte) mit je
     einem Bearbeitungsstand. Die früheren Einzel-Items (Grösse, Gewicht, Brille,
     Hörgerät, Gewichtsverlust, Sturz, Stimmung) sind entfallen — Körpermasse
     führen die Vitalzeichen, die übrigen Items die Bedarfsabklärung (interRAI). */
  // BB11 spitalaufenthalte ist vorgemappt (iA13) und lebt im Registrierungsformular.
  situationHaeuslich: string;
  situationSozial: string;
  situationRessourcen: string;
  situationSonstiges: string;
  situationBearbeitetVon: string;
  /** ISO-Datum; leer = Block noch nie bearbeitet. */
  situationBearbeitetAm: string;
  chronischeErkrankungenListe: VorgeschichteEintrag[];
  operationenListe: VorgeschichteEintrag[];
  krankheitsverlauf: string;
  vorgeschichteBearbeitetVon: string;
  /** ISO-Datum; leer = Block noch nie bearbeitet. */
  vorgeschichteBearbeitetAm: string;
  allergien: string;
  /* Reiter Wohnen — BB9, BB10a (klient, durchgelesen). BB10b und BB15a–e sind ins
     Registrierungsformular herausgelöst. */
  /** BB9 — Code aus lib/stammdaten/sda-wohnsituation. */
  wohnsituation: string;
  /** BB10a — Code aus lib/stammdaten/sda-zusammenleben. */
  formZusammenleben: string;
  /** BB10b — Patientenfeld, im Registrierungsformular erfasst; hier ohne Eingabe. */
  neuZusammenlebend: string;
  etage: string;
  liftVorhanden: string;
  treppen: string;
  personenImHaushalt: string;
  // BB8 behandlungszielFokus entfernt (nur im Registrierungsformular).

  /* Tab 4 – Aktivitäten (ATL) */
  atlAssessment: Record<string, ATLEntry>;

  /* Tab 5 – Dokumente */
  scans: Record<string, PatientScanFile | null>;

}

const ATL_CATEGORIES = [
  { group: "Atmung", items: ["Atemnot", "Husten", "Sauerstoffbedarf"] },
  { group: "Sich Bewegen", items: ["Selbständige Mobilität", "Lagern / Transferhilfe", "Kompressionsstrümpfe"] },
  { group: "Sich waschen und kleiden", items: ["Körperpflege", "An-/Auskleiden"] },
  { group: "Essen und Trinken", items: ["Ernährung", "Schluckstörungen"] },
  { group: "Ausscheiden", items: ["Inkontinenz", "Katheter / Stoma"] },
  { group: "Körpertemperatur", items: ["Temperaturregulation"] },
  { group: "Für Sicherheit sorgen", items: ["Orientierung", "Weglaufgefahr", "Sturzrisiko"] },
  { group: "Kommunizieren", items: ["Kommunikationsfähigkeit", "Sprache / Verständigung"] },
  { group: "Sich als Frau oder Mann fühlen", items: ["Geschlechtsidentität / Bedürfnisse"] },
  { group: "Medikamente", items: ["Medikamente richten", "Medikamente verabreichen", "Vitalwerte-Messungen"] },
];

function buildEmptyATL(): Record<string, ATLEntry> {
  const atl: Record<string, ATLEntry> = {};
  for (const cat of ATL_CATEGORIES) {
    for (const item of cat.items) {
      atl[item] = { ja: null, bemerkungen: "" };
    }
  }
  return atl;
}

export const emptyPatientForm: PatientFormData = {
  dossierEroeffnetAm: "",
  anmeldungPraezisierungen: "",
  stammdatenPraezisierungen: "",

  anrede: "",
  name: "",
  vorname: "",
  geburtsdatum: "",
  geschlecht: "",
  staatsangehoerigkeit: "",
  heimatort: "",
  zivilstand: "",
  aufenthaltsstatus: "",
  ahvNummer: "",
  email: "",
  telefon: "",
  mobil: "",
  adresseStrasse: "",
  adressePlz: "",
  adresseOrt: "",
  gemeinde: "",
  bfsNummer: "",
  kanton: "",
  land: "CH",
  pflegeortAbweichend: false,
  pflegeortStrasse: "",
  pflegeortPlz: "",
  pflegeortOrt: "",
  pflegeortGemeinde: "",
  pflegeortBfsNummer: "",
  pflegeortKanton: "",
  pflegeortLand: "CH",
  spracheCode: "",
  spracheAndere: "",
  uebersetzerNotwendig: "",

  ivBezug: "nein",
  ivBezugProzent: "",
  hilflosenentschaedigung: "nein",
  hilflosenentschaedigungGrad: "",
  assistenzbeitrag: "nein",
  sozialamtInvolviert: "nein",
  gesetzlicheVertretung: "nein",
  patientenverfuegungVorhanden: "unbekannt",
  patientenverfuegungDatum: "",
  patientenverfuegungBemerkung: "",
  vorsorgeauftragVorhanden: "unbekannt",
  vorsorgeauftragValidiert: "unbekannt",
  vorsorgeauftragBemerkung: "",
  konfession: "",
  quellensteuerHinweise: "",

  situationHaeuslich: "",
  situationSozial: "",
  situationRessourcen: "",
  situationSonstiges: "",
  situationBearbeitetVon: "",
  situationBearbeitetAm: "",
  chronischeErkrankungenListe: [],
  operationenListe: [],
  krankheitsverlauf: "",
  vorgeschichteBearbeitetVon: "",
  vorgeschichteBearbeitetAm: "",
  allergien: "",
  wohnsituation: "",
  formZusammenleben: "",
  neuZusammenlebend: "",
  etage: "",
  liftVorhanden: "nein",
  treppen: "nein",
  personenImHaushalt: "1",

  atlAssessment: buildEmptyATL(),

  scans: {},

};

/* ── Validation helpers ──────────────────── */
function isValidAHV(v: string): boolean {
  const clean = v.replace(/[\s.]/g, "");
  return /^756\d{10}$/.test(clean);
}

function isValidDate(v: string): boolean {
  return /^\d{2}\.\d{2}\.\d{4}$/.test(v);
}

function filled(v: string): boolean {
  return v.trim().length > 0;
}

function isValidPhone(v: string): boolean {
  const clean = v.replace(/[\s\-+()]/g, "");
  return clean.length >= 9 && /^\d+$/.test(clean);
}

function isValidEmail(v: string): boolean {
  if (!filled(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function formatDate(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "." + digits.slice(2);
  return digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4);
}

function formatAHV(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 13);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 11));
  if (digits.length > 11) parts.push(digits.slice(11, 13));
  return parts.join(".");
}

/* ── Tab completion logic ──────────────── */
function getTabCompletion(tabKey: string, data: PatientFormData, patientId?: string): { done: number; total: number } {
  switch (tabKey) {
    // Der Reiter Abschluss trägt kein Pflichtfeld: die Präzisierungen sind
    // optional, das Protokoll wird nicht erfasst. Er zählt deshalb nicht mit.
    case "abschluss":
      return { done: 0, total: 0 };
    // Anmeldung ist ein Statusblock (SDA-Registrierung); Vollständigkeit wird
    // ausserhalb aus dem Formular abgeleitet, hier zählt nichts mit.
    case "anmeldung":
      return { done: 0, total: 0 };
    case "personalien": {
      const checks = [
        filled(data.name),
        filled(data.vorname),
        isValidDate(data.geburtsdatum),
        filled(data.geschlecht),
        isValidAHV(data.ahvNummer),
        // Pflicht wie zuvor, an der neuen Speicherform: eine aktive KVG-Grundversicherung.
        !!(patientId && aktiveVersicherung(patientId, "kvg")),
        filled(data.adresseStrasse),
        filled(data.adressePlz),
        filled(data.adresseOrt),
        // Hausarzt und Notfallkontakt sind jetzt Beziehungen (Bezugs- und
        // Pflegeteam); sie werden über Hinweise geführt, nicht als Pflichtfeld.
      ];
      return { done: checks.filter(Boolean).length, total: checks.length };
    }
    case "steuer": {
      // Der Ja/Nein-Indikator für Sozialamt und gesetzliche Vertretung wird hier
      // beantwortet; die Kontaktperson bzw. vertretende Person steht als Person
      // im Bezugs- und Pflegeteam (Reiter Personalien).
      const checks = [
        filled(data.ivBezug),
        filled(data.hilflosenentschaedigung),
        // Grad ist Pflicht, sobald die Ja-Nein-Frage auf «ja» steht.
        data.hilflosenentschaedigung !== "ja" || filled(data.hilflosenentschaedigungGrad),
        filled(data.sozialamtInvolviert),
        filled(data.gesetzlicheVertretung),
        // Vorsorge: bei "ja" ist die Bemerkung Pflicht — wer angibt, dass ein
        // Dokument existiert, ohne zu sagen wo, hat nichts erfasst.
        data.patientenverfuegungVorhanden !== "ja" || filled(data.patientenverfuegungBemerkung),
        data.vorsorgeauftragVorhanden !== "ja" || filled(data.vorsorgeauftragBemerkung),
        filled(data.konfession),
      ];
      if (data.ivBezug === "ja") checks.push(filled(data.ivBezugProzent));
      return { done: checks.filter(Boolean).length, total: checks.length };
    }
    case "wohnen": {
      // neuZusammenlebend und die Wohn-Vorgeschichte sind herausgelöst; hier nur
      // noch Wohnsituation und Form des Zusammenlebens.
      const checks = [
        filled(data.wohnsituation),
        filled(data.formZusammenleben),
      ];
      return { done: checks.filter(Boolean).length, total: checks.length };
    }
    case "anamnese": {
      // Erzählende Blöcke kennen keine Pflichtfelder: der Reiter gilt als
      // bearbeitet, sobald einer der beiden Blöcke Inhalt trägt.
      const situation = [data.situationHaeuslich, data.situationSozial, data.situationRessourcen, data.situationSonstiges].some(filled);
      const vorgeschichte =
        filled(data.krankheitsverlauf) ||
        data.chronischeErkrankungenListe.some((e) => filled(e.bezeichnung)) ||
        data.operationenListe.some((e) => filled(e.bezeichnung));
      return { done: situation || vorgeschichte ? 1 : 0, total: 1 };
    }
    case "aktivitaeten": {
      const allItems = ATL_CATEGORIES.flatMap((c) => c.items);
      const answered = allItems.filter((item) => {
        const entry = data.atlAssessment[item];
        return entry && (entry.ja !== null || filled(entry.bemerkungen));
      });
      return { done: answered.length, total: allItems.length };
    }
    case "dokumente": {
      // Stammdaten-Engine: gleiche Prüfung wie die Dokumente-Anzeige
      const pflicht = sichtbareDokumenttypen(PATIENT_DOK_KONTEXT, "patient")
        .filter(d => d.pflicht && !d.mehrfach);
      const vollst = pflicht.filter(d => istDokumentVollstaendig(d, data.scans)).length;
      return { done: vollst, total: pflicht.length };
    }
    default:
      return { done: 0, total: 0 };
  }
}

function isTabComplete(tabKey: string, data: PatientFormData, patientId?: string): boolean {
  const { done, total } = getTabCompletion(tabKey, data, patientId);
  if (total === 0) return false;
  return done === total;
}

/* ── Tab definitions ───────────────────── */
/**
 * Reiter des Schritts Patient — EINE Quelle für Beschriftung, Symbol und
 * Schlüssel. Angesteuert wird ausschliesslich über den Schlüssel, nie über die
 * Position: ein eingeschobener Reiter verschöbe sonst stumm jede Nummer.
 */
const tabDefs = [
  { key: "personalien", label: "Personalien", icon: User },
  { key: "steuer", label: "Soziales", icon: ShieldCheck },
  { key: "wohnen", label: "Wohnen", icon: Home },
  { key: "vitaldaten", label: "Vitalzeichen", icon: HeartPulse },
  { key: "anamnese", label: "Anamnese", icon: Stethoscope },
  { key: "allergien", label: "Allergien", icon: ShieldAlert },
  { key: "medikamente", label: "Medikamente", icon: Pill },
  { key: "aktivitaeten", label: "ATL", icon: Activity },
  { key: "interrai", label: "Bedarfsabklärung", icon: ClipboardList },
  // Der Reiter "Pflegeplan" ist mit der alten Pflegeplanung abgerissen und
  // kommt mit dem neuen Pflegeplan-Modul zurück.
  { key: "klv", label: "KLV", icon: FileText },
  { key: "workflow", label: "Betreuung", icon: ClipboardList },
  { key: "dokumente", label: "Dokumente", icon: FileText },
  { key: "abschluss", label: "Abschluss", icon: CheckCircle2 },
] as const;

/** Schlüssel eines Reiters — aus tabDefs abgeleitet, damit beide nicht auseinanderlaufen. */
export type PatientReiter = typeof tabDefs[number]["key"];

/** Alle Reiterschlüssel in Anzeigereihenfolge. */
export const TAB_KEYS: readonly PatientReiter[] = tabDefs.map(t => t.key);

/** Reiter, die reine Formulare sind — ihr Inhalt wird auf FORMULAR_MAX begrenzt. */
const FORMULARREITER: ReadonlySet<PatientReiter> = new Set<PatientReiter>([
  "personalien", "steuer", "wohnen", "anamnese", "allergien", "aktivitaeten", "dokumente", "abschluss",
]);

/**
 * Die Reiter, die Felder des SDA tragen — Bereiche AA und BB des Katalogs.
 * Nur sie werden mit dem Abschluss gesperrt. Vitaldaten, Aktivitäten,
 * InterRAI, Pflegeplanung, KLV, Workflow und Dokumente tragen keine
 * SDA-Felder und führen eigene Lebenszyklen.
 */
export const SDA_REITER: readonly PatientReiter[] = [
  "personalien", "steuer", "wohnen", "anamnese",
];

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */
interface StepPatientProps {
  data: PatientFormData;
  onChange: (data: PatientFormData) => void;
  onValidityChange?: (isValid: boolean) => void;
  onboardingId?: string;
  /** External tab-switch request (e.g. from header pill click) */
  requestedTab?: PatientReiter | null;
  onTabSwitched?: () => void;
  /** Aktion am rechten Ende der Reiterzeile (z. B. "Gespräch"), bleibt fixiert sichtbar. */
  reiterAktion?: React.ReactNode;
  /** Zahl offener Pflichtdokumente; erscheint unterhalb des Desktop-Breakpoints
   *  als Zähler am Reiter "Dokumente" (Lauf 1b — ersetzt die Kopfbereich-Marke). */
  dokumenteZaehler?: number;
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepPatient({ data, onChange, onValidityChange, onboardingId, requestedTab, onTabSwitched, reiterAktion, dokumenteZaehler = 0 }: StepPatientProps) {
  const [activeTab, setActiveTab] = useState<PatientReiter>("personalien");
  const benutzer = useCurrentUser();

  // External tab-switch request
  useEffect(() => {
    if (requestedTab != null && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
      onTabSwitched?.();
    }
  }, [requestedTab]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const recording = useRecording();

  /* Compute overall validity — Pflichtfelder + Pflichtdokumente.
   * InterRAI, Pflegeplanung, KLV, Workflow: ausgenommen (Zertifizierung ausstehend, siehe MODUL_ZERTIFIZIERUNG).
   *
   * AA1 = 2 (Einsatzabbruch): das SDA gilt als abgeschlossen, obwohl nicht
   * alle Items im Bereich BB kodiert sind. Der Reiter Anmeldung bleibt
   * vollständig pflichtig — AA1, AA2, AA3 und BB16 sind auch beim Abbruch zu
   * kodieren; nur die BB-Reiter entfallen. */
  // Registrierung (SDA) des Onboardings — Reitersperre, Anmeldung-Validität und
  // Einsatzabbruch werden daraus ABGELEITET, nicht gespeichert (kein zweiter
  // Lebenszyklus). Fehlt eine Antwort, wird nichts angenommen (§D).
  const patientOnbId = onboardingId ? patientFuerOnboarding(onboardingId)?.id : undefined;
  const registrierung = onboardingId ? registrierungFuerOnboarding(onboardingId) : undefined;
  const registrierungGesperrt = registrierung?.status === "gesperrt";
  const registrierungVollstaendig = registrierungGesperrt || (registrierung ? getOpenFieldCount(registrierung) === 0 : false);
  const istEinsatzabbruch = registrierung?.answers["CHAA1"] === EROEFFNUNGSGRUND_EINSATZABBRUCH;
  // Anmeldung ist kein Reiter mehr (Zugang über Bedarfsabklärung). Die
  // Registrierung (SDA) muss dennoch vollständig sein; beim Einsatzabbruch genügt sie.
  const requiredTabs = istEinsatzabbruch
    ? []
    : ["personalien", "steuer", "wohnen", "anamnese", "dokumente"];
  const allRequiredComplete = registrierungVollstaendig && requiredTabs.every((k) => isTabComplete(k, data, patientOnbId));

  useEffect(() => {
    onValidityChange?.(allRequiredComplete);
  }, [allRequiredComplete, onValidityChange]);

  const markTouched = useCallback(
    (field: string) => setTouched((prev) => new Set([...prev, field])),
    []
  );

  // Reitersperre: die SDA-Reiter sind gesperrt, sobald die Registrierung
  // gesperrt ist — abgeleitet aus dem Formularstatus, kein eigenes Feld.
  const aktiverReiterGesperrt = !!registrierungGesperrt && SDA_REITER.includes(activeTab);

  const updateField = useCallback(
    (field: keyof PatientFormData, value: string) => {
      if (aktiverReiterGesperrt) return;
      onChange({ ...data, [field]: value });
    },
    [data, onChange, aktiverReiterGesperrt]
  );

  /** Mehrere Felder in EINEM Zug — zwei getrennte Aufrufe im selben Rendertakt
   *  würden den zweiten auf einem veralteten Stand aufsetzen und den ersten
   *  wieder überschreiben (betraf Krankenkasse + BAG-Nr.). */
  const updateFields = useCallback(
    (patch: Partial<PatientFormData>) => {
      if (aktiverReiterGesperrt) return;
      onChange({ ...data, ...patch });
    },
    [data, onChange, aktiverReiterGesperrt]
  );

  const updateATL = useCallback(
    (itemKey: string, update: Partial<ATLEntry>) => {
      onChange({
        ...data,
        atlAssessment: {
          ...data.atlAssessment,
          [itemKey]: { ...data.atlAssessment[itemKey], ...update },
        },
      });
    },
    [data, onChange]
  );

  // Muster C: Verlauf am rechten Rand der Abschnittszeile, solange waagrecht
  // scrollbar (nicht am Ende) — gleiche Mechanik wie in StepAngehoeriger.
  const abschnittScrollRef = useRef<HTMLDivElement>(null);
  const [zeigtVerlauf, setZeigtVerlauf] = useState(false);
  const pruefeVerlauf = useCallback(() => {
    const el = abschnittScrollRef.current;
    if (el) setZeigtVerlauf(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);
  useEffect(() => {
    pruefeVerlauf();
    const el = abschnittScrollRef.current;
    if (!el) return;
    document.fonts?.ready.then(pruefeVerlauf).catch(() => {});
    const ro = new ResizeObserver(pruefeVerlauf);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", pruefeVerlauf);
    return () => { ro.disconnect(); window.removeEventListener("resize", pruefeVerlauf); };
  }, [pruefeVerlauf]);
  // Der aktive Abschnitts-Reiter ist beim Öffnen und nach Reiterwechsel sichtbar
  // (z. B. Sprung auf "Bedarfsabklärung" über die URL).
  useEffect(() => {
    abschnittScrollRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeTab]);

  return (
    <div className="space-y-0">
      {/* Workspace-Kopf entfernt — Tab-Leiste rückt direkt unter den Onboarding-Header.
         Recording-Button sitzt jetzt rechtsbündig in der Tab-Zeile. */}

      {/* ═══════════════════════════════════════
         HORIZONTAL TAB NAVIGATION + Recording-Button
         ═══════════════════════════════════════ */}
      {/* ZWEITE Reiterebene: Abschnitte der aktiven Phase (§B). KEINE Tönung (Containerfläche),
          Höhe 48, Schrift 12, KEIN Zustandssymbol, Abstand 16, aktiver Eintrag 1.5px unterstrichen.
          Die Ebenen-Haarlinie trägt die Phasenzeile; hier nur die untere Haarlinie zum Formular.
          "Gespräch" rechts fixiert; die Abschnitte stehen in einer Zeile.
          Bleibt beim Rollen stehen (sticky top 0 im Rollbereich der Seite) und sitzt
          damit bündig unter der Phasenzeile. Die Fläche wird dafür deckend gesetzt —
          `--bg-elevated` ist genau die Farbe, die vorher durchschien, also keine
          zusätzliche Tönung. Nur die untere Haarlinie, keine zweite oben. */}
      <div className="flex items-center" style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg-elevated)", padding: "0 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="relative flex-1 min-w-0">
        {/* Muster C: unterhalb des Desktop-Breakpoints scrollt die Leiste waagrecht
            statt umzubrechen (m1-leiste-scroll, siehe theme.css). Desktop unverändert. */}
        <div ref={abschnittScrollRef} onScroll={pruefeVerlauf} className="m1-leiste-scroll">
        <div
          role="tablist"
          aria-label="Abschnitte"
          className="flex flex-wrap"
          style={{ gap: 16 }}
          onKeyDown={e => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
            const i = btns.indexOf(document.activeElement as HTMLButtonElement);
            if (i === -1) return;
            e.preventDefault();
            const next = e.key === "ArrowRight" ? btns[i + 1] : btns[i - 1];
            next?.focus();
            next?.scrollIntoView({ inline: "nearest", block: "nearest" });
          }}
        >
          {tabDefs.map((tab) => {
            const isActive = activeTab === tab.key;
            const complete = isTabComplete(tab.key, data, patientOnbId);

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                onFocus={e => e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest" })}
                className="ui-fokusring relative flex items-center whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  height: 48, padding: 0, flexShrink: 0,
                  fontSize: "var(--text-meta)", fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                  color: isActive ? "var(--text-primary)" : complete ? "var(--status-success-text)" : "var(--text-secondary)",
                  background: "transparent", border: "none", fontFamily: "inherit",
                }}
              >
                {tab.label}
                {/* Lauf 1b: Dokumente-Zähler aus dem Kopfbereich, nur unterhalb Desktop */}
                {tab.key === "dokumente" && dokumenteZaehler > 0 && (
                  <span className="lg:hidden inline-flex items-center justify-center" aria-label={`${dokumenteZaehler} Dokumente offen`} style={{ marginLeft: 5, minWidth: 16, height: 16, padding: "0 4px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-secondary)", fontSize: 11, fontWeight: "var(--weight-medium)", lineHeight: 1 }}>
                    {dokumenteZaehler}
                  </span>
                )}
                {isActive && (
                  <span className="absolute" style={{ bottom: 0, left: 0, right: 0, height: 1.5, background: "var(--text-primary)", borderRadius: 1 }} />
                )}
              </button>
            );
          })}
        </div>
        </div>
        {/* Muster C: Verlauf von Flächenfarbe zu durchsichtig am rechten Rand, nur wenn scrollbar */}
        {zeigtVerlauf && (
          <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 28, pointerEvents: "none", background: "linear-gradient(to right, transparent, var(--bg-elevated))" }} />
        )}
        </div>
        {/* Lauf 1b: unter 1024px trägt die Reiterzeile ausschliesslich Reiter —
            die Aktion lebt dort im Kopfbereich-Menü. */}
        {reiterAktion && (
          <div className="hidden lg:flex items-center shrink-0" style={{ paddingLeft: 12 }}>{reiterAktion}</div>
        )}
      </div>

      {/* ═══════════════════════════════════════
         TAB CONTENT (flach im Container, kein Kartenrahmen)
         ═══════════════════════════════════════ */}
      <div style={{ background: "var(--bg-elevated)" }}>
        {/* Formularbereich auf FORMULAR_MAX begrenzt — Formular-Reiter (Personalien/
            Steuer/Anamnese) sowie ATL (4) und Dokumente (9); klinische Reiter
            (Vitaldaten, InterRAI, Pflegeplanung, KLV, Workflow) behalten volle Breite. */}
        <div style={{ padding: "20px 32px 24px", maxWidth: FORMULARREITER.has(activeTab) ? FORMULAR_MAX : undefined }}>
          {aktiverReiterGesperrt && (
            <div style={{ marginBottom: "var(--space-4)", padding: "10px 14px", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              Das SDA ist abgeschlossen. Die Angaben beschreiben den Zeitpunkt des Eintritts und sind nicht mehr änderbar; spätere Änderungen gehören in die Pflegedokumentation.
            </div>
          )}
          {/* Gesperrte Reiter bleiben vollständig lesbar — nur die Bedienung ist
              stillgelegt. Keine Ausgrauung, kein Ausblenden. */}
          <div style={aktiverReiterGesperrt ? { pointerEvents: "none" } : undefined}>
          {activeTab === "personalien" && (
            <TabPersonalienV2 data={data} touched={touched} onUpdate={updateField} onUpdateMehrere={updateFields} onBlur={markTouched} onboardingId={onboardingId} />
          )}
          {activeTab === "steuer" && (
            <TabSteuerV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} onUpdateMehrere={updateFields} onboardingId={onboardingId} onNavigate={r => setActiveTab(r as PatientReiter)} />
          )}
          {activeTab === "wohnen" && (
            <TabWohnenUmfeldV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {/* Vitalzeichen hängen an der ECHTEN Patientenkennung (Auflösung wie
              Allergien und Medikamente) — beide Einstiege sehen denselben
              Bestand, das frühere Umhängen bei der Konvertierung entfällt. */}
          {activeTab === "vitaldaten" && (patientOnbId
            ? <VitalzeichenAbschnitt patientId={patientOnbId} />
            : <OhneFallkennung />)}
          {activeTab === "anamnese" && (
            <TabAnamneseV2 data={data} touched={touched} onUpdate={updateField} onUpdateMehrere={updateFields} onBlur={markTouched} />
          )}
          {/* Allergien: dieselbe Komponente wie in der Patientenansicht, ohne
              Abwandlung. Der Reiter trägt keine SDA-Felder — die Erfassung folgt
              dem Patienten-Store und bleibt daher auch nach dem SDA-Abschluss
              bedienbar, wie in der Patientenansicht. */}
          {activeTab === "allergien" && (patientOnbId
            ? <AllergienAbschnitt patientId={patientOnbId} />
            : <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Allergien und Unverträglichkeiten lassen sich erfassen, sobald die Personalien angelegt sind.</div>)}
          {/* Medikamente: eigener Lebenszyklus im Patienten-Store, darum kein
              SDA-Reiter — wie Allergien und Vitaldaten. */}
          {activeTab === "medikamente" && (patientOnbId
            ? <MedikamenteAbschnitt patientId={patientOnbId} />
            : <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Medikamente lassen sich erfassen, sobald die Personalien angelegt sind.</div>)}
          {activeTab === "aktivitaeten" && (
            <TabAktivitaetenV2 data={data} onUpdateATL={updateATL} />
          )}
          {activeTab === "interrai" && (onboardingId
            ? <OnboardingTabBA onboardingId={onboardingId} patientVorname={data.vorname} patientNachname={data.name} />
            : <OhneFallkennung />)}
          {activeTab === "klv" && (onboardingId
            ? <OnboardingTabKLV onboardingId={onboardingId} />
            : <OhneFallkennung />)}
          {activeTab === "workflow" && (onboardingId
            ? (() => {
                // Patient-Workflow: Tickets ab Aufnahmedatum (= heute im Onboarding-Kontext).
                // Triage nach BB16 (CHBB16 aus dem Registrierungsformular): OHNE
                // Antwort kein interRAI-Schritt (kein Standardwert, §D); verlangt
                // der Wert keine Abklärung, fallen die beiden Schritte weg.
                {
                  const chbb16 = registrierung?.answers["CHBB16"] ?? "";
                  generiereRhythmusTickets("patient", onboardingId, `${data.name || "Patient"}, ${data.vorname || ""}`, GEGENWART_ISO, undefined,
                    (chbb16 !== "" && sdaVerlangtInterrai(chbb16)) ? undefined : INTERRAI_SCHRITTE);
                }
                return <RhythmusTimeline subjektTyp="patient" subjektId={onboardingId} />;
              })()
            : <OhneFallkennung />)}
          {activeTab === "dokumente" && <TabDokumente data={data} onChange={onChange} />}
          {activeTab === "abschluss" && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: "var(--text-small)" }}>
              Der Onboarding-Abschluss ist noch nicht umgesetzt.
            </div>
          )}
          </div>
        </div>
      </div>
      {/* Hinweistext entfernt (§A). Recording handled globally via RecordingContext + GlobalRecordingBar */}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 5 – DOKUMENTE (PA-07: stammdaten-gesteuert)
   ══════════════════════════════════════════ */

/**
 * Pflicht-Prüfung über die Dokument-Engine (stammdaten/dokumenttypen.ts).
 * Kontext: Im Onboarding sind alle Bedingungsfelder vorerst auf Defaults,
 * weil sichtbarWenn=IMMER für alle 4 Patient-Seeds gilt.
 */
const PATIENT_DOK_KONTEXT: DokumentKontext = {
  partnerErforderlich: false,
  hatKinder: false,
  kinderzulagenUeberSpitex: false,
  unterhaltspflicht: false,
  zertifikatDeutschVorhanden: false,
  srkZertifikatVorhanden: false,
  assistenzbeitragJa: false,
};

export function getPatientRequiredDocKeys(): string[] {
  return sichtbareDokumenttypen(PATIENT_DOK_KONTEXT, "patient")
    .filter(d => d.pflicht && !d.mehrfach)
    .map(d => {
      if (d.modus === "unterschrift") return d.code;
      if (d.beidseitig) return d.code; // Vollständigkeit prüft _vorne + _hinten intern
      return d.code;
    });
}

/** Fehlende Pflicht-Dokumente (Labels) für Abschluss-Sperre */
export function getFehlendePflichtdokumente(scans: Record<string, unknown>): string[] {
  return sichtbareDokumenttypen(PATIENT_DOK_KONTEXT, "patient")
    .filter(d => d.pflicht && !d.mehrfach && !istDokumentVollstaendig(d, scans))
    .map(d => d.label);
}

/* ── SharePoint folder structure mapping ── */
/* ── ARCHIV: Alte lokale Upload-Infrastruktur (SP-22 / Append-only) ──
   usePatientFileUpload, PatientCameraModal, PatientScanUploadButton,
   SPFolder, SP_FOLDERS, SharePointFolderView, PatientScanUploadButtonSmall
   — ersetzt durch gemeinsame DokumentScanUpload-Komponente.
── Ende ARCHIV ── */

/* ── Patient file upload hook (ARCHIV — wird nicht mehr verwendet) ── */
function usePatientFileUpload(
  scanKey: string,
  docLabel: string,
  data: PatientFormData,
  onChange: (d: PatientFormData) => void
) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const trigger = () => inputRef.current?.click();

  const handleFile = (file: File) => {
    const now = new Date();
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;
    const scanFile: PatientScanFile = {
      name: file.name,
      type: file.type,
      size: file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(0)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      timestamp: now.toLocaleString("de-CH"),
      previewUrl,
    };
    onChange({
      ...data,
      scans: { ...data.scans, [scanKey]: scanFile },
    });
  };

  const InputEl = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*,.pdf,.doc,.docx"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
      }}
    />
  );

  return { trigger, InputEl };
}

/* ── Patient Camera Modal ───────────────── */
function PatientCameraModal({
  open,
  docLabel,
  onCapture,
  onClose,
}: {
  open: boolean;
  docLabel: string;
  onCapture: (file: PatientScanFile) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"viewfinder" | "capturing" | "preview" | "uploading" | "done">("viewfinder");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("viewfinder");
      setCapturedImage(null);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  if (!open) return null;

  const handleCapture = () => {
    setPhase("capturing");
    timerRef.current = setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 280;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 400, 280);
        grad.addColorStop(0, "#f0f4ff");
        grad.addColorStop(0.5, "#e8eeff");
        grad.addColorStop(1, "#f5f7ff");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 280);
        ctx.strokeStyle = "#c7d2fe";
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 20, 340, 240);
        ctx.fillStyle = "#94a3b8";
        for (let i = 0; i < 6; i++) {
          const w = 120 + Math.random() * 180;
          ctx.fillRect(55, 50 + i * 32, w, 8);
        }
      }
      setCapturedImage(canvas.toDataURL("image/png"));
      setPhase("preview");
    }, 600);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhase("viewfinder");
  };

  const handleConfirm = () => {
    setPhase("uploading");
    timerRef.current = setTimeout(() => {
      setPhase("done");
      timerRef.current = setTimeout(() => {
        const now = new Date();
        onCapture({
          name: `${docLabel.replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, "_")}_${now.getTime()}.pdf`,
          type: "application/pdf",
          size: `${(Math.random() * 2 + 0.3).toFixed(1)} MB`,
          timestamp: now.toLocaleString("de-CH"),
          previewUrl: capturedImage,
        });
      }, 800);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>Dokument scannen</p>
              <p className="text-[11px] text-muted-foreground">{docLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="relative bg-black/95 aspect-[4/3] flex items-center justify-center overflow-hidden">
          {phase === "viewfinder" && (
            <>
              <div className="absolute inset-6 border-2 border-white/20 rounded-xl">
                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-md" />
                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-md" />
                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-md" />
                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-md" />
              </div>
              <div className="absolute inset-x-8 top-8 bottom-8">
                <div className="h-0.5 bg-primary/60 rounded-full" style={{ animation: "patscanline 2.5s ease-in-out infinite" }} />
                <style>{`@keyframes patscanline { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(calc(100% - 2px)); } }`}</style>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <ScanLine className="w-10 h-10 text-white/40" />
                <p className="text-[12px] text-white/50" style={{ fontWeight: 500 }}>Dokument im Rahmen positionieren</p>
              </div>
            </>
          )}
          {phase === "capturing" && (
            <div className="absolute inset-0 bg-white animate-pulse flex items-center justify-center">
              <Camera className="w-12 h-12 text-primary/30" />
            </div>
          )}
          {(phase === "preview" || phase === "uploading" || phase === "done") && capturedImage && (
            <div className="relative w-full h-full">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              {phase === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <CloudUpload className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <p className="text-white text-[13px]" style={{ fontWeight: 500 }}>Wird in SharePoint hochgeladen…</p>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ animation: "patuploadbar 1.5s ease-out forwards" }} />
                    <style>{`@keyframes patuploadbar { 0% { width: 0%; } 60% { width: 75%; } 100% { width: 100%; } }`}</style>
                  </div>
                </div>
              )}
              {phase === "done" && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-[14px]" style={{ fontWeight: 600 }}>Erfolgreich gespeichert</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <FolderSync className="w-3.5 h-3.5 text-white/70" />
                      <p className="text-white/70 text-[12px]">Dokument im SharePoint gespeichert.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border-light">
          {phase === "viewfinder" && (
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors" style={{ fontWeight: 500 }}>Abbrechen</button>
              <button type="button" onClick={handleCapture} className="flex-[2] h-10 rounded-xl bg-primary text-primary-foreground text-[13px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors" style={{ fontWeight: 600 }}>
                <Camera className="w-4 h-4" /> Aufnahme
              </button>
            </div>
          )}
          {phase === "preview" && (
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={handleRetake} className="flex-1 h-10 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5" style={{ fontWeight: 500 }}>
                <RotateCcw className="w-3.5 h-3.5" /> Wiederholen
              </button>
              <button type="button" onClick={handleConfirm} className="flex-[2] h-10 rounded-xl bg-success text-white text-[13px] flex items-center justify-center gap-2 hover:bg-success/90 transition-colors" style={{ fontWeight: 600 }}>
                <Upload className="w-4 h-4" /> Hochladen & Speichern
              </button>
            </div>
          )}
          {(phase === "capturing" || phase === "uploading" || phase === "done") && (
            <div className="flex items-center justify-center h-10">
              {phase !== "done" ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px]">{phase === "capturing" ? "Wird aufgenommen…" : "Wird hochgeladen…"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[13px]" style={{ fontWeight: 500 }}>Dokument im SharePoint gespeichert.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Patient Scan Upload Button pair ────── */
function PatientScanUploadButton({
  scanKey,
  docLabel,
  data,
  onChange,
  onCameraOpen,
}: {
  scanKey: string;
  docLabel: string;
  data: PatientFormData;
  onChange: (d: PatientFormData) => void;
  onCameraOpen: () => void;
}) {
  const { trigger, InputEl } = usePatientFileUpload(scanKey, docLabel, data, onChange);

  return (
    <>
      {InputEl}
      <button
        type="button"
        onClick={onCameraOpen}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] hover:bg-primary/90 transition-colors"
        style={{ fontWeight: 500 }}
      >
        <Camera className="w-3.5 h-3.5" />
        Scannen
      </button>
      <button
        type="button"
        onClick={trigger}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-muted-foreground hover:bg-muted transition-colors"
        style={{ fontWeight: 500 }}
      >
        <Upload className="w-3.5 h-3.5" />
        Datei wählen
      </button>
    </>
  );
}

/* ── ARCHIV: SharePointFolderView + PatientScanUploadButtonSmall (SP-22) ──
   Alte Ordnerstruktur- und Tabellenansicht — durch stammdaten-Engine ersetzt.
   Code archiviert, nicht gelöscht (Append-only-Konvention).
── Ende ARCHIV ── */

/* ── Einwilligung-Aktionen (Digital signieren + Scan hochladen) ── */
function EinwilligungAktionen({ patientName, patientGeburtsdatum, angehoerigerName, onSignDigital, onScanUpload }: {
  patientName: string;
  patientGeburtsdatum: string;
  angehoerigerName: string;
  onSignDigital: (unterzeichner: unknown, datum: string) => void;
  onScanUpload: (file: ScanFile) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const scanInputRef = React.useRef<HTMLInputElement>(null);

  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const now = new Date();
    onScanUpload({
      name: file.name,
      type: file.type,
      size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      timestamp: now.toLocaleString("de-CH"),
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
    e.target.value = "";
  };

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        style={{ fontWeight: 500, border: "none" }}
      >
        <Check className="w-3.5 h-3.5" /> Digital signieren
      </button>
      <input ref={scanInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleScanFile} />
      <button
        onClick={() => scanInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-border text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <Upload className="w-3.5 h-3.5" /> Unterschriebenes Exemplar hochladen
      </button>
      {showModal && (
        <EinwilligungModal
          isOpen
          onClose={() => setShowModal(false)}
          onSignDigital={(unterzeichner, datum) => {
            onSignDigital(unterzeichner, datum);
            setShowModal(false);
          }}
          patientName={patientName}
          patientGeburtsdatum={patientGeburtsdatum}
          angehoerigerName={angehoerigerName}
        />
      )}
    </div>
  );
}

/* ── TabDokumente main (PA-07: stammdaten-gesteuert) ── */
function TabDokumente({ data, onChange }: { data: PatientFormData; onChange: (d: PatientFormData) => void }) {
  const einwilligung = useEinwilligung();
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  // Mehrfach-Dokumente: dynamisch hinzugefügte Einträge
  const [mehrfachEintraege, setMehrfachEintraege] = useState<Record<string, { id: string; label: string }[]>>({});
  const [mehrfachNeuesLabel, setMehrfachNeuesLabel] = useState<Record<string, string>>({});

  // Sync: Einwilligung-Status → scans["patient_einwilligung"], damit
  // getFehlendePflichtdokumente und istDokumentVollstaendig korrekt rechnen.
  useEffect(() => {
    if (einwilligung.status.signiert && (data.scans["patient_einwilligung"] as unknown as string) !== "unterschrieben") {
      onChange({ ...data, scans: { ...data.scans, patient_einwilligung: "unterschrieben" as unknown as PatientScanFile } });
    }
  }, [einwilligung.status.signiert]);

  const sichtbar = sichtbareDokumenttypen(PATIENT_DOK_KONTEXT, "patient");
  const pflichtDocs = sichtbar.filter(d => d.pflicht && !d.mehrfach);
  const vollstaendig = pflichtDocs.filter(d => {
    if (d.modus === "unterschrift") return einwilligung.status.signiert;
    return istDokumentVollstaendig(d, data.scans);
  }).length;
  const totalPflicht = pflichtDocs.length;
  const allComplete = vollstaendig === totalPflicht && totalPflicht > 0;

  /** Gemeinsamer Handler: Scan oder Datei → in scans ablegen */
  const handleScanFile = (key: string, file: ScanFile) => {
    onChange({ ...data, scans: { ...data.scans, [key]: file } });
  };

  const removeScan = (key: string) => {
    onChange({ ...data, scans: { ...data.scans, [key]: null } });
  };

  const addMehrfachEintrag = (docCode: string) => {
    const label = (mehrfachNeuesLabel[docCode] || "").trim();
    if (!label) return;
    const id = `${docCode}_${Date.now()}`;
    setMehrfachEintraege(prev => ({ ...prev, [docCode]: [...(prev[docCode] || []), { id, label }] }));
    setMehrfachNeuesLabel(prev => ({ ...prev, [docCode]: "" }));
  };

  const removeMehrfachEintrag = (docCode: string, id: string) => {
    setMehrfachEintraege(prev => ({ ...prev, [docCode]: (prev[docCode] || []).filter(e => e.id !== id) }));
    removeScan(id);
  };

  /* ── RENDERING (gleicher Stil wie Angehörigen-Dokumente) ── */
  const pflichtOffen = totalPflicht - vollstaendig;

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-5)" }}>
        {vollstaendig} von {totalPflicht} vollständig{pflichtOffen > 0 ? ` · ${pflichtOffen} Pflicht offen` : ""}
      </div>

      <div className="flex flex-col" style={{ gap: "var(--space-4)" }}>
        {sichtbar.map(doc => {
          /* modus=unterschrift: Einwilligung */
          if (doc.modus === "unterschrift") {
            const istSigniert = einwilligung.status.signiert;
            return (
              <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                      {doc.label} {doc.pflicht && <span style={{ color: "var(--status-danger)" }}>*</span>}
                    </span>
                    {!istSigniert && (
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Erforderlich für die Arzt-Anfrage</span>
                    )}
                  </div>
                  {istSigniert ? (
                    <Check style={{ width: 16, height: 16, color: "var(--status-success)" }} />
                  ) : (
                    <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Offen</span>
                  )}
                </div>
                {istSigniert && einwilligung.status.herkunft && (
                  <div style={{ marginTop: 6, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                    {einwilligung.status.herkunft === "digital" ? "Digital signiert" : "Scan hochgeladen"} · {einwilligung.status.datum}
                  </div>
                )}
                {!istSigniert && (
                  <EinwilligungAktionen
                    patientName={`${data.vorname || ""} ${data.name || ""}`.trim() || "Patient"}
                    patientGeburtsdatum={data.geburtsdatum || ""}
                    angehoerigerName=""
                    onSignDigital={(_, datum) => einwilligung.signDigital(datum)}
                    onScanUpload={(file) => {
                      einwilligung.signScan(new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }));
                      handleScanFile(`${doc.code}_scan`, file);
                    }}
                  />
                )}
              </div>
            );
          }

          /* mehrfach: Sonstige Dokumente */
          if (doc.mehrfach) {
            const eintraege = mehrfachEintraege[doc.code] || [];
            return (
              <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
                  {doc.label} <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontWeight: 400 }}>(optional, beliebig viele)</span>
                </div>
                {eintraege.length > 0 && (
                  <div className="flex flex-col" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                    {eintraege.map(eintrag => {
                      const scan = data.scans[eintrag.id];
                      return (
                        <div key={eintrag.id} style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8, border: "0.5px solid var(--border-default)" }}>
                          <div className="flex items-center justify-between" style={{ marginBottom: scan ? 0 : 6 }}>
                            <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{eintrag.label}</span>
                            <button onClick={() => removeMehrfachEintrag(doc.code, eintrag.id)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--status-danger)" }} title="Entfernen">
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                          {scan ? (
                            <ScanDisplay scanKey={eintrag.id} scan={scan} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
                          ) : (
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <DokumentScanUpload scanKey={eintrag.id} docLabel={eintrag.label} onFile={handleScanFile} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center" style={{ gap: 8 }}>
                  <input value={mehrfachNeuesLabel[doc.code] || ""} onChange={e => setMehrfachNeuesLabel(prev => ({ ...prev, [doc.code]: e.target.value }))} placeholder="Bezeichnung eingeben" style={{ flex: 1, padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMehrfachEintrag(doc.code); } }} />
                  <button onClick={() => addMehrfachEintrag(doc.code)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: 500 }}>
                    <Plus style={{ width: 12, height: 12 }} /> Hinzufügen
                  </button>
                </div>
              </div>
            );
          }

          /* beidseitig: ID, KK-Karte */
          if (doc.beidseitig) {
            const scanVorne = data.scans[`${doc.code}_vorne`];
            const scanHinten = data.scans[`${doc.code}_hinten`];
            return (
              <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                    {doc.label} {doc.pflicht && <span style={{ color: "var(--status-danger)" }}>*</span>}
                  </div>
                  {istDokumentVollstaendig(doc, data.scans) && <Check style={{ width: 16, height: 16, color: "var(--status-success)" }} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-3)" }}>
                  <ScanSlot label="Vorderseite" scanKey={`${doc.code}_vorne`} docLabel={`${doc.label} — Vorderseite`} scan={scanVorne} onFile={handleScanFile} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
                  <ScanSlot label="Rückseite" scanKey={`${doc.code}_hinten`} docLabel={`${doc.label} — Rückseite`} scan={scanHinten} onFile={handleScanFile} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
                </div>
              </div>
            );
          }

          /* einseitig Standard */
          const scan = data.scans[doc.code];
          return (
            <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: scan ? 0 : "var(--space-3)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                  {doc.label}{doc.pflicht ? "" : " (optional)"} {doc.pflicht && <span style={{ color: "var(--status-danger)" }}>*</span>}
                </div>
                {scan && <Check style={{ width: 16, height: 16, color: "var(--status-success)" }} />}
              </div>
              {scan ? (
                <ScanDisplay scanKey={doc.code} scan={scan} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
              ) : (
                <div className="flex items-center" style={{ gap: 8 }}>
                  <DokumentScanUpload scanKey={doc.code} docLabel={doc.label} onFile={handleScanFile} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════
   ONBOARDING CLINICAL TABS (read by onboardingId)
   ══════════════════════════════════════════ */

/**
 * Erklärter Leerzustand für die Reiter, die eine Fallkennung brauchen.
 *
 * Sie entsteht beim ersten Öffnen dieses Schritts; bis dahin — und nur so
 * lange — steht hier ein Satz statt einer leeren Fläche. Der Reiter bleibt
 * anklickbar: ein Reiter, der sich stumm weigert, ist schlechter als einer,
 * der sagt warum.
 */
function OhneFallkennung() {
  return (
    <LeerZustand
      icon={ClipboardList}
      titel="Noch keine Fallkennung"
      untertitel="Sie entsteht, sobald der Schritt Patient geöffnet ist. Danach zeigt dieser Reiter seinen Inhalt."
    />
  );
}

function OnboardingTabBA({ onboardingId, patientVorname, patientNachname }: { onboardingId: string; patientVorname: string; patientNachname: string }) {
  const navigate = useNavigate();
  const person = getPersonByOnboardingId(onboardingId);
  const returnTo = `/onboarding/${onboardingId}?step=patient&tab=interrai`;

  if (!person) {
    // §A: Der Leerzustand ist keine Sackgasse mehr. Der Untertitel nennt beide Wege;
    // der sekundäre Knopf erzeugt eine Bedarfsabklärung für den Patienten dieses
    // Onboardings über den einzigen Erzeugungsweg (createAssessment) und öffnet sie
    // direkt im interRAI-Erfassungsmodul. Fehlt noch eine Person (nur zwei Demofälle
    // sind geseedet), wird sie hier an das Onboarding gebunden — die Abklärung ist
    // danach über den Reiter wieder auffindbar, nicht verwaist.
    const erfassen = () => {
      const p = getOrCreatePersonForOnboarding(onboardingId, patientVorname || "Patient", patientNachname || "");
      // Kein Formular ohne Fall: für den Klienten den offenen Fall sicherstellen.
      // Das erste Formular des Falls ist das SDA (die Anmeldung).
      const fall = offenenFallSicherstellen(p.id);
      try {
        const a = erstelleNaechstesFormular(fall.id);
        navigate(`/interrai-neu/${a.id}?returnTo=${encodeURIComponent(returnTo)}`);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Bedarfsabklärung kann nicht erstellt werden");
      }
    };
    return (
      <LeerZustand
        icon={ClipboardList}
        titel="Noch keine Bedarfsabklärung"
        untertitel="Entsteht aus dem aufgezeichneten Gespräch oder wird manuell erfasst."
        aktion={{ label: "Bedarfsabklärung erfassen", onClick: erfassen, icon: Plus }}
      />
    );
  }
  return <AssessmentStatusView person={person} returnTo={returnTo} kontext="onboarding" />;
}

function OnboardingTabKLV({ onboardingId }: { onboardingId: string }) {
  const navigate = useNavigate();
  /* Der Bestand ist die Quelle — kein lokaler Abzug mehr. */
  const klv = useKlvVerordnungen().find(k => k.onboardingId === onboardingId);
  // Krankenkasse: Name des aktiven KVG-Versicherers (Zahlerseite), sonst Demo-Default.
  const patient = klv?.patientId ? getPatient(klv.patientId) : null;
  const krankenkasse = (patient ? aktiverVersichererName(patient.id, "kvg") : "") || "Groupe Mutuel";

  /* Positionen kommen aus dem Bestand; nur die Bedienzustände bleiben lokal. */
  const leistungen = klv?.leistungspositionen ?? [];
  const setLeistungen = (f: (prev: KLVLeistung[]) => KLVLeistung[]) => {
    if (klv) positionenSetzen(klv.id, f(leistungen));
  };
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [katalogOpen, setKatalogOpen] = useState(false);
  const [katalogSuche, setKatalogSuche] = useState("");

  // Initialize leistungen from KLV mock data
  useEffect(() => {
    if (klv) {
      // Auto-expand niedrig confidence or unvalidated items
      const autoExpand = new Set<string>();
      for (const lp of klv.leistungspositionen) {
        if (!lp.validiert && (lp.annaKonfidenz === "niedrig" || lp.annaKonfidenz === null)) {
          autoExpand.add(lp.id);
        }
      }
      setExpandedIds(autoExpand);
    }
  }, [klv?.id]);

  const katBg = (k: string) => k === "a" ? "var(--status-info-bg)" : k === "b" ? "var(--status-warning-bg)" : "var(--status-success-bg)";
  const katColor = (k: string) => k === "a" ? "var(--status-info)" : k === "b" ? "var(--status-warning-text)" : "var(--status-success-text)";
  const katLabel = (k: string) => k === "a" ? "a – Abklärung und Beratung" : k === "b" ? "b – Untersuchung und Behandlung" : "c – Grundpflege";


  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set<string>();
      if (!prev.has(id)) next.add(id); // only one open at a time
      return next;
    });
  };

  const validateLeistung = (id: string) => {
    if (klv) positionAendern(klv.id, id, { validiert: true });
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateLeistung = (id: string, patch: Partial<KLVLeistung>) => {
    if (klv) positionAendern(klv.id, id, patch);
  };

  const removeLeistung = (id: string) => {
    if (klv) positionEntfernen(klv.id, id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /* Die WZW-Auswertung ist mit der alten Pflegeplanung entfernt — eine
     Zweckmässigkeits-Begründung ohne Diagnosebezug wäre eine halbe Prüfung.
     Sie kommt mit dem neuen Pflegeplan-Modul (Lauf 6) zurück. */

  const addFromKatalog = (pos: typeof SPITEX_LEISTUNGSKATALOG_2025[number]) => {
    const newId = `klv-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newLeistung: KLVLeistung = {
      id: newId,
      klvNummer: pos.nr,
      bezeichnung: pos.bezeichnung,
      kategorie: pos.klvKategorie ?? "c",
      wer: KLV_WER_STANDARD,
      training: "N",
      anzahl: 1,
      einheit: "w",
      zeitMin: pos.zeitMin ?? 15,
      ausAnna: false,
      annaKonfidenz: null,
      validiert: false,
      simultanGruppe: null,
    };
    if (klv) positionHinzufuegen(klv.id, newLeistung);
    setExpandedIds(prev => new Set(prev).add(newId));
    setKatalogOpen(false);
    setKatalogSuche("");
  };

  // Group leistungen by kategorie
  const grouped: Record<"a" | "b" | "c", KLVLeistung[]> = { a: [], b: [], c: [] };
  for (const l of leistungen) {
    grouped[l.kategorie].push(l);
  }

  const summen = berechneSummen(leistungen);
  const alleErfasstenNummern = leistungen.map(l => l.klvNummer);

  // Filtered catalog for search overlay
  const katalogFiltered = katalogSuche.trim().length > 0
    ? SPITEX_LEISTUNGSKATALOG_2025.filter(p =>
        p.klvKategorie !== null && (
          p.bezeichnung.toLowerCase().includes(katalogSuche.toLowerCase()) ||
          p.nr.includes(katalogSuche) ||
          p.bereich.toLowerCase().includes(katalogSuche.toLowerCase())
        )
      )
    : SPITEX_LEISTUNGSKATALOG_2025.filter(p => p.klvKategorie !== null);

  // ─── Empty state (§B: einheitliches Muster, sekundärer Knopf statt Primär) ───
  if (!klv) return (
    <LeerZustand
      icon={FileText}
      titel="Noch keine KLV-Verordnung"
      untertitel="Wird aus dem Gespräch oder manuell erstellt."
      aktion={{ label: "KLV anlegen", onClick: () => navigate("/klv/neu"), icon: FileText }}
    />
  );

  // ─── KLV exists — full inline editor ──────────────────
  return (
    <div style={{ padding: "var(--space-4)" }}>
      <TabHeader
        titel="KLV-Leistungen"
        meta={<HeaderMeta modus="zusammenfassung" text={`${summen.total.toFixed(1)} h/Woche`} />}
        aktion={
          <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
            <button onClick={() => navigate(`/klv/${klv.id}`)} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "9.5px 22px", borderRadius: 999, background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: 14, fontWeight: 500, border: "0.5px solid var(--text-primary)" }}><Send style={{ width: 13, height: 13 }} /> Verordnung &amp; Versand</button>
            <button onClick={() => setKatalogOpen(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}><Plus style={{ width: 14, height: 14 }} /> Leistung hinzufügen</button>
          </div>
        }
      />

      {/* Diagnosen summary — sourced from ärztliche Diagnosen-Artefakt (nur bestätigte) */}
      {(() => {
        const bestaetigteArztDiag = MOCK_ARZT_DIAGNOSEN.filter(d => d.onboardingId === onboardingId && d.status === "bestaetigt");
        return bestaetigteArztDiag.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ärztliche Diagnosen
            </div>
            {bestaetigteArztDiag.map(d => (
              <div key={d.id} style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", padding: "2px 0" }}>
                <span style={{ fontFamily: "monospace", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginRight: 6 }}>{d.icdCode}</span>
                {d.bezeichnung}
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* Leistungen grouped by Kategorie — SectionAccordion (8.12) + ItemRow (8.13) */}
      {leistungen.length > 0 ? (
        <div>
          {(["a", "b", "c"] as const).map(kat => {
            const items = grouped[kat];
            if (items.length === 0) return null;
            const katSubtotal = items.reduce((s, l) => s + (istPeriodisch(l) ? hProWoche(l) : 0), 0);
            const katStatus = items.every(l => l.validiert) ? "vollstaendig" as const : items.some(l => l.validiert) ? "teilweise" as const : "leer" as const;
            return (
              <SectionAccordion
                key={kat}
                id={kat}
                titel={katLabel(kat)}
                marker={<SektionBadge buchstabe={kat} status={katStatus} />}
                count={`${items.length} Positionen · ${katSubtotal.toFixed(2)} h/Wo.`}
                status={katStatus}
                defaultOffen
              >
                {items.map((l, idx) => {
                  const isExpanded = expandedIds.has(l.id);
                  const partners = getSimultanPartner(l, leistungen);
                  const hW = hProWoche(l);
                  const isPer = istPeriodisch(l);
                  const inklusivTreffer = pruefeInklusiv(l.klvNummer, alleErfasstenNummern);
                  const kassenTreffer = pruefeKassenregeln(l, krankenkasse);
                  return (
                    <ItemRow
                      key={l.id}
                      marker={<span style={{ fontSize: "var(--text-meta)", fontFamily: "monospace", fontWeight: 500, color: "var(--text-tertiary)", minWidth: 40, display: "inline-block" }}>{l.klvNummer}</span>}
                      titel={l.bezeichnung}
                      hilfstext={`${werLabel(l.wer)} · ${l.anzahl}× ${einheitLabel(l.einheit)}${partners.length > 0 ? " · ⟂ simultan" : ""}`}
                      last={idx === items.length - 1}
                      onClick={() => toggleExpand(l.id)}
                    >
                      {/* Inklusiv-Hinweis (Anna, regelbasiert) */}
                      {inklusivTreffer && (
                        <div className="flex items-center" style={{ gap: 6, marginBottom: 6, padding: "4px 8px", background: "var(--status-warning-bg)", borderRadius: 8 }}>
                          <Sparkles style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />
                          <span style={{ fontSize: 9, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Anna</span>
                          <span className="inline-flex items-center" style={{ gap: 3, fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
                            <AlertTriangle style={{ width: 10, height: 10 }} />
                            inklusive in {inklusivTreffer.hauptBezeichnung}
                          </span>
                        </div>
                      )}
                      {/* Kassenregel-Hinweis (Anna, regelbasiert, warn-only) */}
                      {kassenTreffer.length > 0 && kassenTreffer.map((t, ti) => (
                        <div key={ti} className="flex items-center" style={{ gap: 6, marginBottom: 6, padding: "4px 8px", background: "var(--status-warning-bg)", borderRadius: 8 }}>
                          <Sparkles style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />
                          <span style={{ fontSize: 9, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Anna</span>
                          <span className="inline-flex items-center" style={{ gap: 3, fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
                            <AlertTriangle style={{ width: 10, height: 10 }} />
                            {t.hinweis}
                          </span>
                        </div>
                      ))}
                      {/* Compact info */}
                      <div className="flex items-center justify-between" style={{ gap: 8 }}>
                        <div className="flex items-center" style={{ gap: 6 }}>
                          {l.ausAnna && <div className="flex items-center" style={{ gap: 3 }}><Sparkles style={{ width: 12, height: 12, color: "var(--brand-primary)" }} /><span style={{ fontSize: 9, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Anna</span></div>}
                          {l.ausAnna && (<span className="inline-flex items-center" style={{ gap: 3, padding: "1px 8px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: l.validiert ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: l.validiert ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                            {l.validiert ? <Check style={{ width: 10, height: 10 }} /> : <Clock style={{ width: 10, height: 10 }} />}
                            {l.validiert ? "Bestätigt" : "Vorschlag"}
                          </span>
                          )}
                        </div>
                        <div className="flex items-center" style={{ gap: 8 }}>
                          <span className="hidden sm:inline" style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{l.zeitMin} min</span>
                          <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: isPer ? "var(--text-primary)" : "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", minWidth: 56, textAlign: "right" }}>
                            {isPer ? `${hW.toFixed(2)}` : l.einheit === "e" ? "einm." : "n. B."}
                          </span>
                          <button onClick={e => { e.stopPropagation(); removeLeistung(l.id); }} className="cursor-pointer" title="Löschen" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}><Trash2 style={{ width: 14, height: 14 }} /></button>
                          <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)", transition: "transform 0.15s", transform: isExpanded ? "rotate(180deg)" : "none" }} />
                        </div>
                      </div>

                      {/* Expanded edit body.
                          Der Aufklappbereich liegt INNERHALB der Zeile, und die Zeile
                          trägt den Auslöser (ItemRow onClick). Ohne diesen Riegel
                          erreichte jeder Klick auf ein Feld den Auslöser und klappte
                          die Position wieder zu — der Bereich war unbedienbar.
                          Der Riegel sitzt hier, nicht in ItemRow: nur diese eine
                          Verwendung übergibt einen Zeilen-Auslöser. */}
                      {isExpanded && (() => {
                        const rhythmus = l.einheit === "e" ? "einmalig" : l.einheit === "nB" ? "nachBedarf" : l.einheit === "m" ? "monatlich" : l.einheit === "w" ? "wöchentlich" : "täglich";
                        const tage = l.einheit.startsWith("t") ? parseInt(l.einheit.slice(1)) : (l.einheit === "w" ? 1 : 7);
                        const tageDisabled = rhythmus !== "täglich";
                        const anzahlDisabled = rhythmus === "einmalig" || rhythmus === "nachBedarf";
                        const liveHW = hW;
                        const setRhythmus = (r: string) => {
                          if (r === "einmalig") updateLeistung(l.id, { einheit: "e" as KLVEinheit, anzahl: 1 });
                          else if (r === "nachBedarf") updateLeistung(l.id, { einheit: "nB" as KLVEinheit, anzahl: 1 });
                          else if (r === "monatlich") updateLeistung(l.id, { einheit: "m" as KLVEinheit });
                          else if (r === "wöchentlich") updateLeistung(l.id, { einheit: "w" as KLVEinheit });
                          else updateLeistung(l.id, { einheit: `t${tage}` as KLVEinheit });
                        };
                        const setTage = (t: number) => { const c = Math.max(1, Math.min(7, t)); updateLeistung(l.id, { einheit: (c === 1 ? "w" : `t${c}`) as KLVEinheit }); };
                        const calcText = rhythmus === "täglich" ? `${tage} Tage × ${l.anzahl} × ${l.zeitMin} min` : rhythmus === "wöchentlich" ? `${l.anzahl} Einsätze/Woche × ${l.zeitMin} min` : rhythmus === "monatlich" ? `${l.anzahl}× pro Monat × ${l.zeitMin} min ÷ 4.33` : "";
                        const ss = { width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 12, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" } as const;
                        const ssDis = { ...ss, opacity: 0.4, pointerEvents: "none" as const, background: "var(--bg-secondary)", color: "var(--text-tertiary)", cursor: "not-allowed" as const };
                        return (
                          <div onClick={e => e.stopPropagation()}>
                          <div style={{ marginTop: 8, paddingTop: 10, borderTop: "0.5px solid var(--border-default)", borderLeft: `4px solid ${l.validiert ? "var(--status-success)" : "var(--status-warning)"}`, paddingLeft: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Wer</label><InlineSelect value={l.wer} onChange={v => updateLeistung(l.id, { wer: v as KLVLeistung["wer"] })} options={KLV_WER_OPTIONS} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Rhythmus</label><InlineSelect value={rhythmus} onChange={v => setRhythmus(v)} options={[{ value: "täglich", label: "Täglich" }, { value: "wöchentlich", label: "Wöchentlich" }, { value: "monatlich", label: "Monatlich" }, { value: "einmalig", label: "Einmalig" }, { value: "nachBedarf", label: "Nach Bedarf" }]} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>an wie vielen Tagen</label><input type="number" min={1} max={7} value={tage} onChange={e => setTage(parseInt(e.target.value) || 1)} disabled={tageDisabled} style={tageDisabled ? ssDis : ss} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Anzahl</label><input type="number" min={1} value={l.anzahl} onChange={e => updateLeistung(l.id, { anzahl: Math.max(1, parseInt(e.target.value) || 1) })} disabled={anzahlDisabled} style={anzahlDisabled ? ssDis : ss} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Zeit pro Einsatz</label><div className="flex items-center" style={{ gap: 4 }}><input type="number" min={1} value={l.zeitMin} onChange={e => updateLeistung(l.id, { zeitMin: Math.max(1, parseInt(e.target.value) || 1) })} style={{ ...ss, flex: 1 }} /><span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>min</span></div></div>
                            </div>
                            {/* Der Pflegediagnose-Bezug je Position kommt in Lauf 6
                                aus dem neuen Pflegeplan-Modul. */}
                            {!l.validiert && (
                              <div className="flex items-center" style={{ gap: 8 }}>
                                <button onClick={e => { e.stopPropagation(); validateLeistung(l.id); }} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}><Check style={{ width: 14, height: 14 }} /> Bestätigen</button>
                              </div>
                            )}
                          </div>
                          </div>
                        );
                      })()}
                    </ItemRow>
                  );
                })}
              </SectionAccordion>
            );
          })}

          {/* Summen */}
          <div style={{ borderTop: "2px solid var(--border-default)", paddingTop: 10, marginTop: 8 }}>
            {(["a","b","c"] as const).map(k => { const v = k === "a" ? summen.kategorieA : k === "b" ? summen.kategorieB : summen.kategorieC; return v > 0 ? (
              <div key={k} className="flex items-center justify-between" style={{ padding: "2px 0", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                <span>Kategorie {k}:</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toFixed(2)} h/Wo.</span>
              </div>
            ) : null; })}
            <div style={{ borderTop: "0.5px solid var(--border-default)", margin: "4px 0" }} />
            <div className="flex items-center justify-between" style={{ padding: "2px 0", fontWeight: 500, color: "var(--text-primary)", fontSize: "var(--text-body)" }}>
              <span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{summen.total.toFixed(2)} h/Wo.</span>
            </div>
            {summen.einmaligMin > 0 && (
              <div className="flex items-center justify-between" style={{ padding: "2px 0", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                <span>Einmalige Leistungen</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{summen.einmaligMin} min ({summen.einmaligH.toFixed(2)} h)</span>
              </div>
            )}
          </div>

          {/* Dokument-Aktionen (Output, getrennt vom Editieren) */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid var(--border-default)" }}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 6 }}>Dokumente</div>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              <button onClick={() => toast("Dokument-Generierung folgt")} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "6px 14px", borderRadius: 999, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}><FileText style={{ width: 13, height: 13 }} /> Leistungsplanungsblatt</button>
              <button onClick={() => toast("Dokument-Generierung folgt")} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "6px 14px", borderRadius: 999, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}><FileText style={{ width: 13, height: 13 }} /> Bedarfsmeldeformular (KLV Art. 7)</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", padding: "12px 0" }}>
          Noch keine Leistungspositionen – starte ein Gespräch oder öffne den KLV-Arbeitsbereich.
        </div>
      )}

      {/* ── Leistungssuche — Overlay, triggered from TabHeader ── */}
      {katalogOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center" style={{ background: "rgba(19,19,20,0.3)", paddingTop: 80 }} onClick={() => { setKatalogOpen(false); setKatalogSuche(""); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: "92%", maxWidth: 520, maxHeight: "60vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Pill search field (8.2) */}
            <div className="flex items-center" style={{ padding: "12px 16px", gap: 8, borderBottom: "0.5px solid var(--border-default)" }}>
              <Search style={{ width: 16, height: 16, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                type="text"
                value={katalogSuche}
                onChange={e => setKatalogSuche(e.target.value)}
                placeholder="Leistung suchen (Nr., Bezeichnung oder Bereich)…"
                autoFocus
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "var(--text-primary)", fontFamily: "inherit" }}
              />
              <button onClick={() => { setKatalogOpen(false); setKatalogSuche(""); }} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2 }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            {/* Results — ItemRow pattern */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {katalogFiltered.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 14, color: "var(--text-tertiary)" }}>Keine Ergebnisse</div>
              ) : katalogFiltered.slice(0, 40).map(pos => (
                <div
                  key={pos.nr}
                  onClick={() => addFromKatalog(pos)}
                  className="flex items-center cursor-pointer"
                  style={{ padding: "10px 16px", gap: 10, borderBottom: "0.5px solid var(--border-default)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: "var(--text-meta)", fontFamily: "monospace", fontWeight: 500, color: "var(--text-tertiary)", minWidth: 40 }}>{pos.nr}</span>
                  <span className="flex-1 truncate" style={{ fontSize: 14, color: "var(--text-primary)" }}>{pos.bezeichnung}</span>
                  <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: "var(--text-micro)", fontWeight: 500, background: katBg(pos.klvKategorie!), color: katColor(pos.klvKategorie!), flexShrink: 0 }}>{pos.klvKategorie}</span>
                  {pos.zeitMin && <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{pos.zeitMin} min</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
