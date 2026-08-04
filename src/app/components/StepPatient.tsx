import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  User,
  HeartPulse,
  Home,
  Stethoscope,
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
import { TabAnmeldungV2, TabPersonalienV2, TabSteuerV2, TabAnamneseV2 } from "./form/MigratedPatientForms";
import { FORMULAR_MAX } from "./form/feldbreiten";
import { TabAktivitaetenV2 } from "./form/MigratedPatientATL";
import { Mic } from "lucide-react";
import { MOCK_PFLEGEPLANUNGEN, MOCK_KLV_VERORDNUNGEN, MOCK_ARZT_DIAGNOSEN, ANNA_DIAGNOSEN, ANNA_MASSNAHMEN, ANNA_ZIELE } from "../../lib/mocks/klinische-artefakte-mock";
import { useRecording } from "../recording/RecordingContext";
import { getPersonByOnboardingId, getOrCreatePersonForOnboarding, createAssessment } from "../../lib/interrai/store";
import { AssessmentStatusView } from "./interrai-neu/AssessmentStatusView";
import type { KLVLeistung, KLVEinheit, Pflegediagnose, Massnahme, Pflegeziel, AerztlicheDiagnose } from "../../types/klinische-artefakte";
import { NANDA_KATALOG } from "../../lib/mocks/nanda-enp-katalog";
import { ReviewBlock } from "./ui/ReviewBlock";
import { InlineSelect } from "./ui/InlineSelect";
import { TabHeader, HeaderMeta } from "./ui/TabHeader";
import { RhythmusTimeline } from "./rhythmus/RhythmusTimeline";
import { generiereRhythmusTickets } from "../../lib/rhythmus/engine";
import { SectionAccordion, SektionBadge } from "./ui/SectionAccordion";
import { ItemRow } from "./ui/ItemRow";
import { hProWoche, einmaligeMin, istPeriodisch, einheitLabel, werLabel, berechnungsText, kompaktParams, berechneSummen, getSimultanPartner } from "../../lib/klv/berechnung";
import { SPITEX_LEISTUNGSKATALOG_2025 } from "../../lib/klv/spitex-leistungskatalog-2025";
import { toast } from "sonner";
import { pruefeInklusiv } from "../../lib/klv/inklusiv-regeln";
import { pruefeKassenregeln } from "../../lib/klv/kassenregeln";
import { erzeugeWZWAuswertung, type WZWErgebnis } from "../../lib/klv/wzw-auswertung";
import { useEinwilligung } from "./EinwilligungContext";
import { useArztAnfrage, ArztAnfrageFlowInline } from "./ArztAnfrageContext";
import { SectionAction } from "./ui/SectionAction";
import { KONFESSION_OPTIONS } from "../../lib/stammdaten/konfession";
import { KRANKENKASSEN_OPTIONS, getBagNummer } from "../../lib/stammdaten/krankenkassen";
import { Combobox } from "./form/Combobox";
import { VitaldatenTab } from "./vitaldaten/VitaldatenTab";
import { getPatient } from "../../lib/patienten/store";
import { EROEFFNUNGSGRUND_STANDARD } from "../../lib/stammdaten/sda-eroeffnungsgrund";
import { sichtbareDokumenttypen, istDokumentVollstaendig, type DokumentKontext, type DokumentTypDefinition } from "../../lib/stammdaten/dokumenttypen";
import { DokumentScanUpload, type ScanFile } from "./form/DokumentScanUpload";
import { EinwilligungModal } from "./einwilligung/EinwilligungModal";
import { ScanDisplay, ScanSlot } from "./form/MigratedAngehoerigerForms2";

export interface ATLEntry {
  ja: boolean | null;
  bemerkungen: string;
}

/** Alias — identisch mit ScanFile aus DokumentScanUpload */
export type PatientScanFile = ScanFile;

export interface PatientFormData {
  /* Reiter Anmeldung – Bereich AA und BB16 */
  /** AA1 — Code aus lib/stammdaten/sda-eroeffnungsgrund. Einzige Vorbelegung. */
  eroeffnungsgrund: string;
  /** AA2 — Datum der Eröffnung des Dossiers, alleinige Quelle des Aufnahmedatums. */
  dossierEroeffnetAm: string;
  /** AA3 — Code aus lib/stammdaten/sda-anmeldende-institution. */
  anmeldendeInstitution: string;
  /** AA3 Code 8 — Institution als Freitext. */
  anmeldendeInstitutionAndere: string;
  anmeldendePersonName: string;
  anmeldendePersonFunktion: string;
  anmeldendePersonTelefon: string;
  anmeldendePersonEmail: string;
  /** BB16 — Code aus lib/stammdaten/sda-einschaetzung-situation. */
  einschaetzungSituation: string;
  anmeldungPraezisierungen: string;

  /* Tab 1 – Personalien */
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
  /** SP-02: Krankenkasse als Code (Picklist-Wert) */
  krankenkasse: string;
  ahvNummer: string;
  hausarztName: string;
  hausarztTelefon: string;
  hausarztEmail: string;
  email: string;
  telefon: string;
  adresseStrasse: string;
  adressePlz: string;
  adresseOrt: string;
  notfallkontaktName: string;
  notfallkontaktTelefon: string;
  notfallkontaktBeziehung: string;
  spezialAerzte: string;
  /** SP-03: umbenannt von "versicherungsNr" zu "kartennummer" */
  kartennummer: string;
  /** SP-03: BAG-Nr. der Kasse (vorbefuellt aus Krankenkasse-Picklist) */
  bagNr: string;

  /* Tab 2 – Steuer & Sozialversicherungen */
  sozialamtKontakt: string;
  sozialamtKontaktDetail: string;
  ivBezug: string;
  ivBezugProzent: string;
  hilflosenentschaedigung: string;
  /** PA-01: IV-Assistenzbeitrag */
  assistenzbeitrag: string;
  konfession: string;
  quellensteuerHinweise: string;

  /* Tab 3 – Anamnese */
  groesse: string;
  gewicht: string;
  gewichtsverlust: string;
  brille: string;
  hoergeraet: string;
  chronischeErkrankungen: string;
  /** BB11 — Code aus lib/stammdaten/sda-spitalaufenthalt. */
  spitalaufenthalte: string;
  operationen: string;
  allergien: string;
  /** BB9 — Code aus lib/stammdaten/sda-wohnsituation. */
  wohnsituation: string;
  etage: string;
  liftVorhanden: string;
  treppen: string;
  personenImHaushalt: string;
  anamneseText: string;
  /** PA-03: Sturz-Assessment */
  sturzLetzte12m: string;
  sturzAnzahl: string;
  sturzKommentar: string;
  /* Legacy (beibehalten für Kompatibilität) */
  sturzLetzte6Monate: string;
  sturzVorEinemJahr: string;
  stimmungAktuell: string;
  behandlungszielFokus: string;

  /* Tab 4 – Aktivitäten (ATL) */
  atlAssessment: Record<string, ATLEntry>;

  /* Tab 5 – Dokumente */
  scans: Record<string, PatientScanFile | null>;

  /* backward-compat fields (kept for StepValidierung) */
  haushaltsgroesse: string;
  zusatzversicherung: string;
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
  // AA1 ist laut Handbuch vorzubelegen — das einzige Feld des Reiters mit Wert.
  eroeffnungsgrund: EROEFFNUNGSGRUND_STANDARD,
  dossierEroeffnetAm: "",
  anmeldendeInstitution: "",
  anmeldendeInstitutionAndere: "",
  anmeldendePersonName: "",
  anmeldendePersonFunktion: "",
  anmeldendePersonTelefon: "",
  anmeldendePersonEmail: "",
  einschaetzungSituation: "",
  anmeldungPraezisierungen: "",

  name: "",
  vorname: "",
  geburtsdatum: "",
  geschlecht: "",
  staatsangehoerigkeit: "",
  heimatort: "",
  zivilstand: "",
  aufenthaltsstatus: "",
  krankenkasse: "",
  ahvNummer: "",
  hausarztName: "",
  hausarztTelefon: "",
  hausarztEmail: "",
  email: "",
  telefon: "",
  adresseStrasse: "",
  adressePlz: "",
  adresseOrt: "",
  notfallkontaktName: "",
  notfallkontaktTelefon: "",
  notfallkontaktBeziehung: "",
  spezialAerzte: "",
  kartennummer: "",
  bagNr: "",

  sozialamtKontakt: "nein",
  sozialamtKontaktDetail: "",
  ivBezug: "nein",
  ivBezugProzent: "",
  hilflosenentschaedigung: "nein",
  assistenzbeitrag: "nein",
  konfession: "",
  quellensteuerHinweise: "",

  groesse: "",
  gewicht: "",
  gewichtsverlust: "nein",
  brille: "nein",
  hoergeraet: "nein",
  chronischeErkrankungen: "",
  spitalaufenthalte: "",
  operationen: "",
  allergien: "",
  wohnsituation: "",
  etage: "",
  liftVorhanden: "nein",
  treppen: "nein",
  personenImHaushalt: "1",
  anamneseText: "",
  sturzLetzte12m: "kein_sturz",
  sturzAnzahl: "",
  sturzKommentar: "",
  sturzLetzte6Monate: "nein",
  sturzVorEinemJahr: "nein",
  stimmungAktuell: "",
  behandlungszielFokus: "",

  atlAssessment: buildEmptyATL(),

  scans: {},

  haushaltsgroesse: "1",
  zusatzversicherung: "nein",
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
function getTabCompletion(tabKey: string, data: PatientFormData): { done: number; total: number } {
  switch (tabKey) {
    case "anmeldung": {
      const checks = [
        filled(data.eroeffnungsgrund),
        isValidDate(data.dossierEroeffnetAm),
        filled(data.anmeldendeInstitution),
        filled(data.einschaetzungSituation),
      ];
      // AA3 Code 8: die Institution ist zusätzlich als Freitext zu erfassen.
      if (data.anmeldendeInstitution === "8") checks.push(filled(data.anmeldendeInstitutionAndere));
      return { done: checks.filter(Boolean).length, total: checks.length };
    }
    case "personalien": {
      const checks = [
        filled(data.name),
        filled(data.vorname),
        isValidDate(data.geburtsdatum),
        filled(data.geschlecht),
        isValidAHV(data.ahvNummer),
        filled(data.krankenkasse),
        filled(data.hausarztName),
        filled(data.adresseStrasse),
        filled(data.adressePlz),
        filled(data.adresseOrt),
        filled(data.notfallkontaktName),
        isValidPhone(data.notfallkontaktTelefon),
      ];
      return { done: checks.filter(Boolean).length, total: checks.length };
    }
    case "steuer": {
      const checks = [
        filled(data.sozialamtKontakt),
        filled(data.ivBezug),
        filled(data.hilflosenentschaedigung),
        filled(data.konfession),
      ];
      if (data.sozialamtKontakt === "ja") checks.push(filled(data.sozialamtKontaktDetail));
      if (data.ivBezug === "ja") checks.push(filled(data.ivBezugProzent));
      return { done: checks.filter(Boolean).length, total: checks.length };
    }
    case "anamnese": {
      const checks = [
        filled(data.groesse),
        filled(data.gewicht),
        filled(data.chronischeErkrankungen),
      ];
      return { done: checks.filter(Boolean).length, total: checks.length };
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

function isTabComplete(tabKey: string, data: PatientFormData): boolean {
  const { done, total } = getTabCompletion(tabKey, data);
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
  { key: "anmeldung", label: "Anmeldung", icon: Inbox },
  { key: "personalien", label: "Personalien", icon: User },
  { key: "steuer", label: "Soziales & Steuer", icon: ShieldCheck },
  { key: "vitaldaten", label: "Vitaldaten", icon: HeartPulse },
  { key: "anamnese", label: "Anamnese", icon: Stethoscope },
  { key: "aktivitaeten", label: "Aktivitäten", icon: Activity },
  { key: "interrai", label: "InterRAI", icon: ClipboardList },
  { key: "pflegeplanung", label: "Pflegeplanung", icon: ClipboardList },
  { key: "klv", label: "KLV", icon: FileText },
  { key: "workflow", label: "Workflow", icon: ClipboardList },
  { key: "dokumente", label: "Dokumente", icon: FileText },
] as const;

/** Schlüssel eines Reiters — aus tabDefs abgeleitet, damit beide nicht auseinanderlaufen. */
export type PatientReiter = typeof tabDefs[number]["key"];

/** Alle Reiterschlüssel in Anzeigereihenfolge. */
export const TAB_KEYS: readonly PatientReiter[] = tabDefs.map(t => t.key);

/** Reiter, die reine Formulare sind — ihr Inhalt wird auf FORMULAR_MAX begrenzt. */
const FORMULARREITER: ReadonlySet<PatientReiter> = new Set<PatientReiter>([
  "anmeldung", "personalien", "steuer", "anamnese", "aktivitaeten", "dokumente",
]);

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
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepPatient({ data, onChange, onValidityChange, onboardingId, requestedTab, onTabSwitched, reiterAktion }: StepPatientProps) {
  const [activeTab, setActiveTab] = useState<PatientReiter>("anmeldung");

  // §D: Verlauf am rechten Rand der Abschnittszeile, solange waagrecht scrollbar (nicht am Ende).
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
    // §C-Ursache: Der Verlauf wurde nur beim Mount berechnet — vor dem Font-Reflow.
    // Dann massen die Reiter zu schmal, zeigtVerlauf blieb false, und auf macOS
    // (Overlay-Scrollbars) fehlte jedes Affordance: der letzte Reiter wirkte hart
    // abgeschnitten ("Dokument"). Wir messen daher nach Font-Laden erneut und
    // beobachten zusätzlich die Inhaltsbreite (nicht nur die Containerbreite).
    document.fonts?.ready.then(pruefeVerlauf).catch(() => {});
    const ro = new ResizeObserver(pruefeVerlauf);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", pruefeVerlauf);
    return () => { ro.disconnect(); window.removeEventListener("resize", pruefeVerlauf); };
  }, [pruefeVerlauf]);

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
   * InterRAI, Pflegeplanung, KLV, Workflow: ausgenommen (Zertifizierung ausstehend, siehe MODUL_ZERTIFIZIERUNG). */
  const requiredTabs = ["anmeldung", "personalien", "steuer", "anamnese", "dokumente"];
  const allRequiredComplete = requiredTabs.every((k) => isTabComplete(k, data));

  useEffect(() => {
    onValidityChange?.(allRequiredComplete);
  }, [allRequiredComplete, onValidityChange]);

  const markTouched = useCallback(
    (field: string) => setTouched((prev) => new Set([...prev, field])),
    []
  );

  const updateField = useCallback(
    (field: keyof PatientFormData, value: string) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange]
  );

  /** Mehrere Felder in EINEM Zug — zwei getrennte Aufrufe im selben Rendertakt
   *  würden den zweiten auf einem veralteten Stand aufsetzen und den ersten
   *  wieder überschreiben (betraf Krankenkasse + BAG-Nr.). */
  const updateFields = useCallback(
    (patch: Partial<PatientFormData>) => {
      onChange({ ...data, ...patch });
    },
    [data, onChange]
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
          "Gespräch" rechts fixiert; zehn Abschnitte scrollen waagrecht mit Verlauf-Hinweis (§C/§D). */}
      <div className="flex items-center" style={{ background: "transparent", padding: "0 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="relative flex-1 min-w-0">
        <div ref={abschnittScrollRef} onScroll={pruefeVerlauf}>
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
            const complete = isTabComplete(tab.key, data);

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
                {isActive && (
                  <span className="absolute" style={{ bottom: 0, left: 0, right: 0, height: 1.5, background: "var(--text-primary)", borderRadius: 1 }} />
                )}
              </button>
            );
          })}
        </div>
        </div>
        {/* §D: Verlauf von Flächenfarbe zu durchsichtig am rechten Rand, nur wenn scrollbar */}
        {zeigtVerlauf && (
          <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 28, pointerEvents: "none", background: "linear-gradient(to right, transparent, var(--bg-elevated))" }} />
        )}
        </div>
        {reiterAktion && (
          <div className="flex items-center shrink-0" style={{ paddingLeft: 12 }}>{reiterAktion}</div>
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
          {activeTab === "anmeldung" && (
            <TabAnmeldungV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {activeTab === "personalien" && (
            <TabPersonalienV2 data={data} touched={touched} onUpdate={updateField} onUpdateMehrere={updateFields} onBlur={markTouched} />
          )}
          {activeTab === "steuer" && (
            <TabSteuerV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {activeTab === "vitaldaten" && <VitaldatenTab patientId={onboardingId || "new"} />}
          {activeTab === "anamnese" && (
            <TabAnamneseV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {activeTab === "aktivitaeten" && (
            <TabAktivitaetenV2 data={data} onUpdateATL={updateATL} />
          )}
          {activeTab === "interrai" && onboardingId && <OnboardingTabBA onboardingId={onboardingId} patientVorname={data.vorname} patientNachname={data.name} />}
          {activeTab === "pflegeplanung" && onboardingId && <OnboardingTabPP onboardingId={onboardingId} />}
          {activeTab === "klv" && onboardingId && <OnboardingTabKLV onboardingId={onboardingId} />}
          {activeTab === "workflow" && onboardingId && (() => {
            // Patient-Workflow: Tickets ab Aufnahmedatum (= heute im Onboarding-Kontext)
            generiereRhythmusTickets("patient", onboardingId, `${data.name || "Patient"}, ${data.vorname || ""}`, new Date().toISOString().slice(0, 10));
            return <RhythmusTimeline subjektTyp="patient" subjektId={onboardingId} />;
          })()}
          {activeTab === "dokumente" && <TabDokumente data={data} onChange={onChange} />}
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
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Erforderlich für die Arzt-Anfrage (Tab Pflegeplanung)</span>
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
      const a = createAssessment(p.id, "erstabklaerung");
      navigate(`/interrai-neu/${a.id}?returnTo=${encodeURIComponent(returnTo)}`);
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
  return <AssessmentStatusView person={person} returnTo={returnTo} />;
}

function OnboardingTabPP({ onboardingId }: { onboardingId: string }) {
  const navigate = useNavigate();
  const pp = MOCK_PFLEGEPLANUNGEN.find(p => p.onboardingId === onboardingId);
  const [diagnosen, setDiagnosen] = useState<Pflegediagnose[]>([]);
  const [massnahmen, setMassnahmen] = useState<Massnahme[]>([]);
  const [ziele, setZiele] = useState<Pflegeziel[]>([]);
  const [expandedDiag, setExpandedDiag] = useState<string | null>(null);
  const [showAddDiagnose, setShowAddDiagnose] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  // Ärztliche Diagnosen (eigenes Artefakt, nicht Kopie)
  const [arztDiagnosen, setArztDiagnosen] = useState<AerztlicheDiagnose[]>([]);
  const [showAddArztDiag, setShowAddArztDiag] = useState(false);
  const [showArztAnfrage, setShowArztAnfrage] = useState(false);
  const [addArztIcd, setAddArztIcd] = useState("");
  const [addArztBez, setAddArztBez] = useState("");
  const arztAnfrage = useArztAnfrage();

  useEffect(() => {
    if (pp) {
      setDiagnosen(pp.pflegediagnosen.map(d => ({ ...d })));
      setMassnahmen(pp.massnahmen.map(m => ({ ...m })));
      setZiele(pp.ziele.map(z => ({ ...z })));
    }
    // Load ärztliche Diagnosen for this onboarding
    const ad = MOCK_ARZT_DIAGNOSEN.filter(d => d.onboardingId === onboardingId);
    setArztDiagnosen(ad.map(d => ({ ...d })));
  }, [pp?.id, onboardingId]);

  // §B: einheitlicher Leerzustand; Aktion ergänzt (Text sagte "manuell erstellt", Knopf fehlte).
  if (!pp) return (
    <LeerZustand
      icon={ClipboardList}
      titel="Noch keine Pflegeplanung"
      untertitel="Wird aus dem Gespräch oder manuell erstellt."
      aktion={{ label: "Pflegeplanung erstellen", onClick: () => navigate("/pflegeplanung/neu"), icon: Plus }}
    />
  );

  const statusLabel = pp.status === "entwurf" ? "Entwurf" : pp.status === "in-bearbeitung" ? "In Bearbeitung" : pp.status === "validiert" ? "Validiert" : "Abgeschlossen";

  const deleteDiagnose = (id: string) => {
    setDiagnosen(prev => prev.filter(d => d.id !== id));
    setMassnahmen(prev => prev.filter(m => m.bezugDiagnoseId !== id));
    setZiele(prev => prev.filter(z => z.bezugDiagnoseId !== id));
    if (expandedDiag === id) setExpandedDiag(null);
    toast("Diagnose entfernt");
  };

  const addMassnahme = (diagId: string, m: { titel: string; beschreibung: string; haeufigkeit: string }) => {
    setMassnahmen(prev => [...prev, { id: `MA-new-${Date.now()}`, titel: m.titel, bezugDiagnoseId: diagId, beschreibung: m.beschreibung, haeufigkeit: m.haeufigkeit, status: "vorschlag" }]);
  };

  const removeMassnahme = (id: string) => setMassnahmen(prev => prev.filter(m => m.id !== id));

  const addZiel = (diagId: string, z: { titel: string; zeithorizont: string; messbar: string }) => {
    setZiele(prev => [...prev, { id: `Z-new-${Date.now()}`, titel: z.titel, bezugDiagnoseId: diagId, zeithorizont: z.zeithorizont, messbar: z.messbar, status: "vorschlag" }]);
  };

  const removeZiel = (id: string) => setZiele(prev => prev.filter(z => z.id !== id));

  const addDiagnoseFromKatalog = (opt: typeof NANDA_KATALOG[number]) => {
    const diagId = `PD-new-${Date.now()}`;
    setDiagnosen(prev => [...prev, { id: diagId, nandaCode: opt.nandaCode, titel: opt.titel, bezugCap: null, begruendung: "", status: "vorschlag", icdIds: [] }]);
    // Auto-add first suggested massnahme + ziel
    if (opt.massnahmenVorschlaege[0]) addMassnahme(diagId, opt.massnahmenVorschlaege[0]);
    if (opt.zieleVorschlaege[0]) addZiel(diagId, opt.zieleVorschlaege[0]);
    setShowAddDiagnose(false);
    setAddSearch("");
    setExpandedDiag(diagId);
  };

  const filteredKatalog = addSearch.trim()
    ? NANDA_KATALOG.filter(k => k.titel.toLowerCase().includes(addSearch.toLowerCase()) || k.nandaCode.includes(addSearch) || k.domäne.toLowerCase().includes(addSearch.toLowerCase()))
    : NANDA_KATALOG;

  // Already used codes
  const usedCodes = new Set(diagnosen.map(d => d.nandaCode));

  // Count all unbestätigte Anna-Entwürfe (ärztliche + pflege)
  const vorschlaegeCount = arztDiagnosen.filter(d => d.status === "entwurf").length + diagnosen.filter(d => d.status === "vorschlag").length;
  const ppContainerRef = React.useRef<HTMLDivElement>(null);

  /** Scroll to first ungeprüfter Vorschlag and expand it if needed */
  const scrollToFirstVorschlag = useCallback(() => {
    if (!ppContainerRef.current) return;
    // Ärztliche Entwürfe come first in DOM order
    const firstEntwurf = ppContainerRef.current.querySelector("[data-vorschlag]") as HTMLElement | null;
    if (firstEntwurf) {
      firstEntwurf.scrollIntoView({ behavior: "smooth", block: "center" });
      // If it's a Pflegediagnose ReviewBlock, expand it
      const diagId = firstEntwurf.dataset.vorschlag;
      if (diagId && diagId.startsWith("PD")) setExpandedDiag(diagId);
      // If it's an ärztliche Diagnose, open the anfrage panel for visibility
      if (diagId && diagId.startsWith("AD")) setShowArztAnfrage(false);
    }
  }, []);

  return (
    <div ref={ppContainerRef} style={{ padding: "var(--space-4)" }}>

      {/* Aufzeichnung verschoben in den Onboarding-Kopfbereich (OnboardingPage.tsx) */}

      {/* ═══ Kopfzeile: nur Titel + Zustände als Text ═══ */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>Pflegeplanung</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          {statusLabel}
          {vorschlaegeCount > 0 && (
            <span onClick={scrollToFirstVorschlag} className="cursor-pointer" style={{ marginLeft: 8, color: "var(--text-tertiary)" }}>
              · {vorschlaegeCount} {vorschlaegeCount === 1 ? "Vorschlag" : "Vorschläge"} zu prüfen
            </span>
          )}
        </div>
      </div>

      {/* ═══ Sektion: Ärztliche Diagnosen ═══ */}
      <div style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>Ärztliche Diagnosen</span>
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Primäraktion */}
            <button
              onClick={() => { setShowArztAnfrage(!showArztAnfrage); setShowAddArztDiag(false); }}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 5, padding: "7px 16px", borderRadius: 999, background: showArztAnfrage ? "var(--brand-primary)" : "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
            >
              <Stethoscope style={{ width: 12, height: 12 }} /> Beim Arzt anfragen
            </button>
            {/* Sekundäraktion */}
            <button
              onClick={() => { setShowAddArztDiag(!showAddArztDiag); setShowArztAnfrage(false); }}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 5, padding: "7px 16px", borderRadius: 999, background: "transparent", color: "var(--text-primary)", fontSize: "var(--text-small)", fontWeight: 500, border: "0.5px solid var(--border-default)" }}
            >
              Manuell erfassen
            </button>
          </div>
        </div>

        {/* Arzt-Anfrage-Status als Zustandsband (kein Button) */}
        {arztAnfrage && arztAnfrage.anfrage.status === "gesendet" && !showArztAnfrage && (
          <div style={{ padding: "6px 12px", background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 6, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            Angefragt bei {arztAnfrage.anfrage.empfaengerName} · wartet seit {arztAnfrage.tageSeitVersand} Tagen
          </div>
        )}

        {/* Arzt-Anfrage-Flow (kanonisches Zuhause).
           antwort_erhalten: immer sichtbar (Handlungsbedarf → ReviewBlock-Prominenz).
           Andere Zustände: nur wenn explizit aufgeklappt. */}
        {(showArztAnfrage || arztAnfrage?.anfrage.status === "antwort_erhalten") && (
          <div style={{ padding: arztAnfrage?.anfrage.status === "antwort_erhalten" ? "0" : "8px 12px", background: arztAnfrage?.anfrage.status === "antwort_erhalten" ? "transparent" : "var(--bg-secondary)", borderRadius: 8, marginBottom: 6 }}>
            <ArztAnfrageFlowInline />
          </div>
        )}

        {/* Inline manual entry */}
        {showAddArztDiag && (
          <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 6 }}>
            <div className="flex items-end" style={{ gap: 8 }}>
              <div style={{ flex: "0 0 80px" }}>
                <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>ICD-Code</label>
                <input value={addArztIcd} onChange={e => setAddArztIcd(e.target.value)} placeholder="I10" style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "monospace" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Bezeichnung</label>
                <input value={addArztBez} onChange={e => setAddArztBez(e.target.value)} placeholder="Arterielle Hypertonie" style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }} />
              </div>
              <button
                onClick={() => {
                  if (!addArztIcd.trim() || !addArztBez.trim()) return;
                  setArztDiagnosen(prev => [...prev, {
                    id: `AD-manual-${Date.now()}`,
                    onboardingId,
                    patientId: null,
                    icdCode: addArztIcd.trim(),
                    bezeichnung: addArztBez.trim(),
                    quelle: "Manuell erfasst, " + new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }),
                    status: "bestaetigt",
                  }]);
                  setAddArztIcd(""); setAddArztBez(""); setShowAddArztDiag(false);
                  toast("Ärztliche Diagnose erfasst");
                }}
                className="inline-flex items-center cursor-pointer"
                style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-meta)", fontWeight: 500, border: "none", whiteSpace: "nowrap" }}
              >
                <Plus style={{ width: 10, height: 10 }} /> Erfassen
              </button>
            </div>
          </div>
        )}

        {/* Alle Diagnosen als kompakte einzeilige Zeilen — Entwürfe mit Ocker-Akzent + Aktionen, Bestätigte still */}
        {arztDiagnosen.map(ad => (
          <div
            key={ad.id}
            {...(ad.status === "entwurf" ? { "data-vorschlag": ad.id } : {})}
            className="flex items-center"
            style={{
              gap: 8,
              padding: "5px 8px 5px 0",
              borderBottom: "0.5px solid var(--border-default)",
              borderLeft: ad.status === "entwurf" ? "3px solid var(--status-warning)" : "3px solid transparent",
              paddingLeft: 10,
            }}
          >
            {/* Anna-Provenienz (nur Entwürfe) */}
            {ad.status === "entwurf" && <Sparkles style={{ width: 11, height: 11, color: "var(--brand-primary)", flexShrink: 0 }} />}
            {/* ICD-Code */}
            <span style={{ fontFamily: "monospace", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-tertiary)", minWidth: 44, flexShrink: 0 }}>{ad.icdCode}</span>
            {/* Bezeichnung */}
            <span className="flex-1 min-w-0 truncate" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{ad.bezeichnung}</span>
            {/* Quelle (Desktop, gekürzt einzeilig, vollständig als Tooltip) */}
            <span className="hidden sm:inline shrink-0" title={ad.quelle} style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
              {ad.quelle.replace(/^Arzt-Antwort\s+/, "").replace(/^Manuell erfasst,\s*/, "Manuell · ")}
            </span>
            {/* Status-Pill + Aktionen */}
            {ad.status === "entwurf" ? (
              <div className="flex items-center shrink-0" style={{ gap: 2 }}>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Vorschlag</span>
                <button
                  onClick={() => setArztDiagnosen(prev => prev.map(d => d.id === ad.id ? { ...d, status: "bestaetigt" as const } : d))}
                  className="cursor-pointer"
                  title="Bestätigen"
                  style={{ background: "none", border: "none", color: "var(--status-success-text)", padding: 6, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Check style={{ width: 14, height: 14 }} />
                </button>
                <button
                  onClick={() => setArztDiagnosen(prev => prev.filter(d => d.id !== ad.id))}
                  className="cursor-pointer"
                  title="Verwerfen"
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 6, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setArztDiagnosen(prev => prev.filter(d => d.id !== ad.id))}
                className="cursor-pointer shrink-0"
                title="Löschen"
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 6, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ═══ Sektion: Pflegediagnosen ═══ */}
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>Pflegediagnosen</span>
        <button onClick={() => setShowAddDiagnose(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "7px 16px", borderRadius: 999, background: "transparent", color: "var(--text-primary)", fontSize: "var(--text-small)", fontWeight: 500, border: "0.5px solid var(--border-default)" }}>
          Pflegediagnose hinzufügen
        </button>
      </div>

      {/* Pflegediagnosen — ReviewBlock per styleguide 8.10 */}
      {diagnosen.map(d => {
        const dMassnahmen = massnahmen.filter(m => m.bezugDiagnoseId === d.id);
        const dZiele = ziele.filter(z => z.bezugDiagnoseId === d.id);
        const katalogEntry = NANDA_KATALOG.find(k => k.nandaCode === d.nandaCode);
        return (
          <div key={d.id} {...(d.status === "vorschlag" ? { "data-vorschlag": d.id } : {})}>
          <ReviewBlock
            titel={<><span style={{ color: "var(--brand-primary)" }}>{d.nandaCode}</span> {d.titel}</>}
            untertitel={`${dMassnahmen.length} Massnahmen · ${dZiele.length} Ziele`}
            status={d.status === "akzeptiert" ? "bestaetigt" : "vorschlag"}
            herkunft="anna"
            defaultOffen={d.status === "vorschlag"}
            onBestaetigen={() => setDiagnosen(prev => prev.map(x => x.id === d.id ? { ...x, status: "akzeptiert" as const } : x))}
            onLoeschen={() => deleteDiagnose(d.id)}
          >
            {/* Begründung */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Begründung</label>
              <textarea value={d.begruendung} onChange={e => setDiagnosen(prev => prev.map(x => x.id === d.id ? { ...x, begruendung: e.target.value } : x))} rows={2} style={{ width: "100%", padding: "11px 16px", fontSize: 14, borderRadius: 12, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }} />
            </div>

            {/* Massnahmen */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 4 }}>Massnahmen</div>
              {dMassnahmen.map(m => (
                <div key={m.id} className="flex items-start" style={{ gap: 6, padding: "5px 8px", background: "var(--bg-secondary)", borderRadius: 12, marginBottom: 3, fontSize: "var(--text-small)" }}>
                  <div className="flex-1">
                    <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{m.titel}</span>
                    <span style={{ color: "var(--text-tertiary)" }}> · {m.haeufigkeit}</span>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>{m.beschreibung}</div>
                  </div>
                  <button onClick={() => removeMassnahme(m.id)} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}><Trash2 style={{ width: 12, height: 12 }} /></button>
                </div>
              ))}
              {katalogEntry && katalogEntry.massnahmenVorschlaege.filter(mv => !dMassnahmen.some(m => m.titel === mv.titel)).length > 0 && (
                <div className="flex flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                  {katalogEntry.massnahmenVorschlaege.filter(mv => !dMassnahmen.some(m => m.titel === mv.titel)).map(mv => (
                    <button key={mv.titel} onClick={() => addMassnahme(d.id, mv)} className="inline-flex items-center cursor-pointer" style={{ gap: 3, padding: "3px 8px", borderRadius: 999, background: "transparent", border: "0.5px dashed var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                      <Plus style={{ width: 10, height: 10 }} /> {mv.titel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ziele */}
            <div>
              <div style={{ fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 4 }}>Ziele</div>
              {dZiele.map(z => (
                <div key={z.id} className="flex items-start" style={{ gap: 6, padding: "5px 8px", background: "var(--brand-primary-light)", borderRadius: 12, marginBottom: 3, fontSize: "var(--text-small)" }}>
                  <div className="flex-1">
                    <span style={{ fontWeight: "var(--weight-medium)", color: "var(--brand-primary)" }}>{z.titel}</span>
                    <span style={{ color: "var(--text-secondary)" }}> · {z.zeithorizont}</span>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>{z.messbar}</div>
                  </div>
                  <button onClick={() => removeZiel(z.id)} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}><Trash2 style={{ width: 12, height: 12 }} /></button>
                </div>
              ))}
              {katalogEntry && katalogEntry.zieleVorschlaege.filter(zv => !dZiele.some(z => z.titel === zv.titel)).length > 0 && (
                <div className="flex flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                  {katalogEntry.zieleVorschlaege.filter(zv => !dZiele.some(z => z.titel === zv.titel)).map(zv => (
                    <button key={zv.titel} onClick={() => addZiel(d.id, zv)} className="inline-flex items-center cursor-pointer" style={{ gap: 3, padding: "3px 8px", borderRadius: 999, background: "transparent", border: "0.5px dashed var(--border-default)", fontSize: "var(--text-meta)", color: "var(--brand-primary)" }}>
                      <Plus style={{ width: 10, height: 10 }} /> {zv.titel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ReviewBlock>
          </div>
        );
      })}

      {diagnosen.length === 0 && !showAddDiagnose && (
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", padding: "12px 0" }}>Noch keine Diagnosen — starte ein Gespräch oder füge manuell hinzu.</div>
      )}

      {/* Diagnose-Suche — Overlay, triggered from TabHeader */}
      {showAddDiagnose && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center" style={{ background: "rgba(19,19,20,0.3)", paddingTop: 80 }} onClick={() => { setShowAddDiagnose(false); setAddSearch(""); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: "92%", maxWidth: 520, maxHeight: "60vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="flex items-center" style={{ padding: "12px 16px", gap: 8, borderBottom: "0.5px solid var(--border-default)" }}>
              <Search style={{ width: 16, height: 16, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input type="text" value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="NANDA-Code, Titel oder Domäne…" autoFocus style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "var(--text-primary)", fontFamily: "inherit" }} />
              <button onClick={() => { setShowAddDiagnose(false); setAddSearch(""); }} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2 }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filteredKatalog.filter(k => !usedCodes.has(k.nandaCode)).map(opt => (
                <div key={opt.nandaCode} onClick={() => addDiagnoseFromKatalog(opt)} className="cursor-pointer" style={{ padding: "10px 16px", borderBottom: "0.5px solid var(--border-default)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--brand-primary)", flexShrink: 0 }}>{opt.nandaCode}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{opt.titel}</span>
                  </div>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2 }}>{opt.domäne} · {opt.massnahmenVorschlaege.length} Massnahmen · {opt.zieleVorschlaege.length} Ziele</div>
                </div>
              ))}
              {filteredKatalog.filter(k => !usedCodes.has(k.nandaCode)).length === 0 && (
                <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 14, color: "var(--text-tertiary)" }}>Keine weiteren Diagnosen verfügbar</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingTabKLV({ onboardingId }: { onboardingId: string }) {
  const navigate = useNavigate();
  const klv = MOCK_KLV_VERORDNUNGEN.find(k => k.onboardingId === onboardingId);
  const pp = MOCK_PFLEGEPLANUNGEN.find(p => p.onboardingId === onboardingId);
  const verfuegbareDiagnosen = pp?.pflegediagnosen || [];
  // Krankenkasse: from patient (if konvertiert) or mock default
  const patient = klv?.patientId ? getPatient(klv.patientId) : null;
  const krankenkasse = patient?.krankenkasse || "Groupe Mutuel"; // Demo-Default für Onboarding

  // Pflegeplanung data for WZW
  const ppDiagnosen = pp?.pflegediagnosen || [];
  const ppMassnahmen = pp?.massnahmen || [];
  const ppZiele = pp?.ziele || [];

  // Local in-memory editor state
  const [leistungen, setLeistungen] = useState<KLVLeistung[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [katalogOpen, setKatalogOpen] = useState(false);
  const [katalogSuche, setKatalogSuche] = useState("");
  const [showWZW, setShowWZW] = useState(false);
  const [wzwErgebnisse, setWzwErgebnisse] = useState<WZWErgebnis[]>([]);

  // Initialize leistungen from KLV mock data
  useEffect(() => {
    if (klv) {
      setLeistungen(klv.leistungspositionen.map(lp => ({ ...lp })));
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
    setLeistungen(prev => prev.map(l => l.id === id ? { ...l, validiert: true } : l));
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateLeistung = (id: string, patch: Partial<KLVLeistung>) => {
    setLeistungen(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLeistung = (id: string) => {
    setLeistungen(prev => prev.filter(l => l.id !== id));
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // ─── WZW-Auswertung ─────────────────────────────────
  const startWZWAuswertung = () => {
    if (showWZW) { setShowWZW(false); return; }
    const ergebnisse = erzeugeWZWAuswertung(leistungen, ppDiagnosen, ppMassnahmen, ppZiele, krankenkasse);
    setWzwErgebnisse(ergebnisse);
    setShowWZW(true);
  };

  /** Bestätigen: setzt diagnoseIds (falls Vorschlag) + wzwBegruendung */
  const wzwBestaetigen = (erg: WZWErgebnis) => {
    const text = erg.status === "vorschlag" ? erg.vorschlagWzwText : erg.wzwText;
    const diagIds = erg.status === "vorschlag" && erg.vorschlagDiagnose
      ? [erg.vorschlagDiagnose.diagnoseId]
      : undefined;

    setLeistungen(prev => prev.map(l => {
      if (l.id !== erg.leistungId) return l;
      return {
        ...l,
        wzwBegruendung: text,
        ...(diagIds ? { diagnoseIds: diagIds } : {}),
      };
    }));
    // Update local WZW results to reflect confirmation
    setWzwErgebnisse(prev => prev.map(e =>
      e.leistungId === erg.leistungId ? { ...e, status: "begruendbar" as const, wzwText: text } : e
    ));
    toast("Begründung bestätigt");
  };

  /** Verwerfen: entfernt den WZW-Entwurf aus der Auswertungs-Liste */
  const wzwVerwerfen = (leistungId: string) => {
    setWzwErgebnisse(prev => prev.filter(e => e.leistungId !== leistungId));
  };

  const addFromKatalog = (pos: typeof SPITEX_LEISTUNGSKATALOG_2025[number]) => {
    const newId = `klv-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newLeistung: KLVLeistung = {
      id: newId,
      klvNummer: pos.nr,
      bezeichnung: pos.bezeichnung,
      kategorie: pos.klvKategorie ?? "c",
      wer: "S",
      training: "N",
      anzahl: 1,
      einheit: "w",
      zeitMin: pos.zeitMin ?? 15,
      ausAnna: false,
      annaKonfidenz: null,
      validiert: false,
      simultanGruppe: null,
      bezugMassnahmeId: null,
      diagnoseIds: [],
      wzwBegruendung: null,
    };
    setLeistungen(prev => [...prev, newLeistung]);
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
            <button
              onClick={startWZWAuswertung}
              className="inline-flex items-center cursor-pointer"
              style={{
                gap: 5,
                padding: "7px 14px",
                borderRadius: "var(--radius-pill)",
                background: showWZW ? "var(--brand-primary)" : "var(--bg-elevated)",
                border: showWZW ? "none" : "0.5px solid var(--border-default)",
                color: showWZW ? "var(--text-on-dark)" : "var(--text-primary)",
                fontSize: "var(--text-small)",
                fontWeight: 500,
                minHeight: 34,
              }}
            >
              <Sparkles style={{ width: 13, height: 13 }} /> {showWZW ? "WZW schliessen" : "WZW-Auswertung"}
            </button>
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
                      hilfstext={`${werLabel(l.wer)} · ${l.anzahl}× ${einheitLabel(l.einheit)}${partners.length > 0 ? " · ⟂ simultan" : ""}${l.diagnoseIds.length > 0 ? ` · ${verfuegbareDiagnosen.find(d => d.id === l.diagnoseIds[0])?.nandaCode || ""}` : ""}`}
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
                          <span className="inline-flex items-center" style={{ gap: 3, padding: "1px 8px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: l.validiert ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: l.validiert ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                            {l.validiert ? <Check style={{ width: 10, height: 10 }} /> : <Clock style={{ width: 10, height: 10 }} />}
                            {l.validiert ? "Bestätigt" : "Vorschlag"}
                          </span>
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

                      {/* Expanded edit body */}
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
                          <div style={{ marginTop: 8, paddingTop: 10, borderTop: "0.5px solid var(--border-default)", borderLeft: `4px solid ${l.validiert ? "var(--status-success)" : "var(--status-warning)"}`, paddingLeft: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Wer</label><InlineSelect value={l.wer} onChange={v => updateLeistung(l.id, { wer: v as KLVLeistung["wer"] })} options={[{ value: "S", label: werLabel("S") }, { value: "A", label: werLabel("A") }, { value: "S+A", label: werLabel("S+A") }]} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Rhythmus</label><InlineSelect value={rhythmus} onChange={v => setRhythmus(v)} options={[{ value: "täglich", label: "Täglich" }, { value: "wöchentlich", label: "Wöchentlich" }, { value: "monatlich", label: "Monatlich" }, { value: "einmalig", label: "Einmalig" }, { value: "nachBedarf", label: "Nach Bedarf" }]} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>an wie vielen Tagen</label><input type="number" min={1} max={7} value={tage} onChange={e => setTage(parseInt(e.target.value) || 1)} disabled={tageDisabled} style={tageDisabled ? ssDis : ss} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Anzahl</label><input type="number" min={1} value={l.anzahl} onChange={e => updateLeistung(l.id, { anzahl: Math.max(1, parseInt(e.target.value) || 1) })} disabled={anzahlDisabled} style={anzahlDisabled ? ssDis : ss} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Zeit pro Einsatz</label><div className="flex items-center" style={{ gap: 4 }}><input type="number" min={1} value={l.zeitMin} onChange={e => updateLeistung(l.id, { zeitMin: Math.max(1, parseInt(e.target.value) || 1) })} style={{ ...ss, flex: 1 }} /><span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>min</span></div></div>
                            </div>
                            {/* Pflegediagnose-Zuordnung */}
                            {verfuegbareDiagnosen.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Pflegediagnose</label>
                                <InlineSelect
                                  value={l.diagnoseIds[0] || ""}
                                  onChange={v => updateLeistung(l.id, { diagnoseIds: v ? [v] : [] })}
                                  options={[
                                    { value: "", label: "Keine Diagnose zugeordnet" },
                                    ...verfuegbareDiagnosen.map(d => ({ value: d.id, label: `${d.nandaCode} – ${d.titel}` })),
                                  ]}
                                />
                              </div>
                            )}
                            {!l.validiert && (
                              <div className="flex items-center" style={{ gap: 8 }}>
                                <button onClick={e => { e.stopPropagation(); validateLeistung(l.id); }} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}><Check style={{ width: 14, height: 14 }} /> Bestätigen</button>
                              </div>
                            )}
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

      {/* ── WZW-Auswertung — Overlay (Pattern: InterRAI Auswerten) ── */}
      {showWZW && (
        <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center" style={{ background: "rgba(19,19,20,0.4)" }}>
          <div style={{ background: "var(--bg-primary)", borderRadius: "12px 12px 0 0", maxWidth: 680, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "var(--shadow-overlay)" }} className="sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border-default)", position: "sticky", top: 0, background: "var(--bg-primary)", zIndex: 1 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Sparkles style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
                <span style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>WZW-Auswertung</span>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Begründung (Entwurf)</span>
              </div>
              <button onClick={() => setShowWZW(false)} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 4 }}><X style={{ width: 16, height: 16 }} /></button>
            </div>

            {/* Zusammenfassung */}
            <div style={{ padding: "12px 20px", borderBottom: "0.5px solid var(--border-default)", background: "var(--bg-secondary)" }}>
              <div className="flex items-center flex-wrap" style={{ gap: 12, fontSize: "var(--text-small)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{wzwErgebnisse.length} Positionen</span>
                <span style={{ color: "var(--status-success-text)" }}>{wzwErgebnisse.filter(e => e.status === "begruendbar").length} begründbar</span>
                <span style={{ color: "var(--status-warning-text)" }}>{wzwErgebnisse.filter(e => e.status === "vorschlag").length} mit Vorschlag</span>
                {wzwErgebnisse.filter(e => e.status === "luecke").length > 0 && (
                  <span style={{ color: "var(--status-danger)" }}>{wzwErgebnisse.filter(e => e.status === "luecke").length} Lücken</span>
                )}
              </div>
            </div>

            {/* Positionen als ReviewBlock-Liste */}
            <div style={{ padding: "12px 20px" }}>
              {wzwErgebnisse.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>
                  Keine Leistungspositionen vorhanden.
                </div>
              ) : wzwErgebnisse.map(erg => {
                const istBestaetigt = leistungen.find(l => l.id === erg.leistungId)?.wzwBegruendung != null;

                // Fall C: Lücke — kein ReviewBlock, sondern Warn-Hinweis
                if (erg.status === "luecke") {
                  return (
                    <div key={erg.leistungId} style={{ marginBottom: 6 }}>
                      <div style={{
                        display: "flex",
                        background: "var(--bg-elevated)",
                        border: "0.5px solid var(--border-default)",
                        borderRadius: 12,
                        overflow: "hidden",
                      }}>
                        <div style={{ width: 4, flexShrink: 0, background: "var(--status-danger)", borderRadius: "2px 0 0 2px" }} />
                        <div style={{ flex: 1, padding: "12px 16px" }}>
                          <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: "var(--text-meta)", fontFamily: "monospace", fontWeight: 500, color: "var(--text-tertiary)" }}>{erg.klvNummer}</span>
                            <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{erg.bezeichnung}</span>
                          </div>
                          <div className="flex items-start" style={{ gap: 6, padding: "8px 10px", background: "rgba(168,50,31,0.04)", borderRadius: 8 }}>
                            <AlertTriangle style={{ width: 13, height: 13, color: "var(--status-danger)", flexShrink: 0, marginTop: 1 }} />
                            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                              Keine passende Pflegediagnose vorhanden – Zweckmässigkeit nicht begründbar. Pflegeplanung ergänzen.
                            </div>
                          </div>
                          {erg.zeitAbweichung && (
                            <div style={{ marginTop: 6, fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
                              {erg.zeitMin} min statt Richtwert {erg.katalogZeitMin} min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Fall A & B: ReviewBlock
                const wzwTextAnzeige = erg.status === "vorschlag"
                  ? erg.vorschlagWzwText
                  : erg.wzwText;

                return (
                  <ReviewBlock
                    key={erg.leistungId}
                    titel={<><span style={{ fontFamily: "monospace", color: "var(--text-tertiary)", marginRight: 6 }}>{erg.klvNummer}</span> {erg.bezeichnung}</>}
                    untertitel={
                      erg.status === "vorschlag" && erg.vorschlagDiagnose
                        ? `Vorschlag: über ${erg.vorschlagDiagnose.nandaCode} ${erg.vorschlagDiagnose.titel} begründen`
                        : erg.diagnose
                          ? `${erg.diagnose.nandaCode} ${erg.diagnose.titel}`
                          : undefined
                    }
                    status={istBestaetigt ? "bestaetigt" : "vorschlag"}
                    herkunft="anna"
                    defaultOffen={erg.status === "vorschlag" || !istBestaetigt}
                    aktionen={!istBestaetigt}
                    onBestaetigen={() => wzwBestaetigen(erg)}
                    onVerwerfen={() => wzwVerwerfen(erg.leistungId)}
                  >
                    {/* WZW-Dreisatz */}
                    {wzwTextAnzeige && (
                      <div style={{ whiteSpace: "pre-line", fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                        {wzwTextAnzeige}
                      </div>
                    )}

                    {/* Hinweise */}
                    {erg.zeitAbweichung && (
                      <div className="flex items-center" style={{ gap: 5, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginBottom: 4 }}>
                        <AlertTriangle style={{ width: 10, height: 10 }} />
                        Zeitabweichung: {erg.zeitMin} min statt Richtwert {erg.katalogZeitMin} min
                      </div>
                    )}
                    {erg.inklusivHinweis && (
                      <div className="flex items-center" style={{ gap: 5, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginBottom: 4 }}>
                        <AlertTriangle style={{ width: 10, height: 10 }} />
                        {erg.inklusivHinweis}
                      </div>
                    )}
                    {erg.kassenregelTreffer.map((t, i) => (
                      <div key={i} className="flex items-center" style={{ gap: 5, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginBottom: 4 }}>
                        <AlertTriangle style={{ width: 10, height: 10 }} />
                        {t.hinweis}
                      </div>
                    ))}

                    {/* Zugeordnete Massnahmen + Ziele (Kontext) */}
                    {(erg.massnahmen.length > 0 || (erg.status === "vorschlag" && erg.vorschlagDiagnose)) && (() => {
                      const relevanteMassnahmen = erg.status === "vorschlag" && erg.vorschlagDiagnose
                        ? ppMassnahmen.filter(m => m.bezugDiagnoseId === erg.vorschlagDiagnose!.diagnoseId)
                        : erg.massnahmen;
                      const relevanteZiele = erg.status === "vorschlag" && erg.vorschlagDiagnose
                        ? ppZiele.filter(z => z.bezugDiagnoseId === erg.vorschlagDiagnose!.diagnoseId)
                        : erg.ziele;
                      return (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "0.5px solid var(--border-default)" }}>
                          {relevanteMassnahmen.length > 0 && (
                            <div style={{ marginBottom: 4 }}>
                              <span style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Massnahmen</span>
                              {relevanteMassnahmen.map(m => (
                                <div key={m.id} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "1px 0" }}>· {m.titel}</div>
                              ))}
                            </div>
                          )}
                          {relevanteZiele.length > 0 && (
                            <div>
                              <span style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ziele</span>
                              {relevanteZiele.map(z => (
                                <div key={z.id} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "1px 0" }}>· {z.titel} ({z.zeithorizont})</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </ReviewBlock>
                );
              })}

              {/* Haftungs-Hinweis (Footer) */}
              <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: 8, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                Diese Auswertung stellt Begründungs-Entwürfe bereit und zeigt Lücken. Sie bescheinigt keine Konformität und ersetzt nicht die fachliche Prüfung.
              </div>
            </div>
          </div>
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
