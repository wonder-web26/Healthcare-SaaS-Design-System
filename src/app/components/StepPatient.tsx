import React, { useState, useEffect, useCallback } from "react";
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
  Handshake,
  Pill,
  Key,
  ScrollText,
  Megaphone,
  Lock as LockIcon,
  ShoppingCart,
  Folder,
  FolderOpen,
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
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

import { useNavigate } from "react-router";
import { TabPersonalienV2, TabSteuerV2, TabAnamneseV2 } from "./form/MigratedPatientForms";
import { TabAktivitaetenV2 } from "./form/MigratedPatientATL";
import { Mic } from "lucide-react";
import { MOCK_ASSESSMENTS, MOCK_PFLEGEPLANUNGEN, MOCK_KLV_VERORDNUNGEN, MOCK_ARZT_DIAGNOSEN, DEMO_SCALES, DEMO_CAPS, ANNA_DIAGNOSEN, ANNA_MASSNAHMEN, ANNA_ZIELE } from "../../lib/mocks/klinische-artefakte-mock";
import { KLV_STATUS_PIPELINE, SEKTIONEN } from "../../types/klinische-artefakte";
import { Arbeitsbereich } from "./interrai/Arbeitsbereich";
import { getAntwortText, getKonfidenzColor } from "../../lib/interrai/helpers";
import { useRecording } from "../recording/RecordingContext";
import type { KLVLeistung, KLVEinheit, Pflegediagnose, Massnahme, Pflegeziel, AerztlicheDiagnose } from "../../types/klinische-artefakte";
import { NANDA_KATALOG } from "../../lib/mocks/nanda-enp-katalog";
import { ReviewBlock } from "./ui/ReviewBlock";
import { InlineSelect } from "./ui/InlineSelect";
import { TabHeader, HeaderMeta } from "./ui/TabHeader";
import { WorkflowChecklist } from "./workflow/WorkflowChecklist";
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
import { patients } from "./patientData";

export interface ATLEntry {
  ja: boolean | null;
  bemerkungen: string;
}

export interface PatientScanFile {
  name: string;
  type: string;
  size: string;
  timestamp: string;
  previewUrl: string | null;
}

export interface PatientFormData {
  /* Tab 1 – Personalien */
  name: string;
  vorname: string;
  geburtsdatum: string;
  geschlecht: string;
  nationalitaet: string;
  heimatort: string;
  zivilstand: string;
  aufenthaltsstatus: string;
  /** SP-02: Krankenkasse als Code (Picklist-Wert) */
  krankenkasse: string;
  ahvNummer: string;
  hausarztName: string;
  hausarztTelefon: string;
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
  konfession: string;
  quellensteuerHinweise: string;

  /* Tab 3 – Anamnese */
  groesse: string;
  gewicht: string;
  gewichtsverlust: string;
  brille: string;
  hoergeraet: string;
  chronischeErkrankungen: string;
  spitalaufenthalte: string;
  operationen: string;
  allergien: string;
  wohnsituation: string;
  etage: string;
  liftVorhanden: string;
  treppen: string;
  personenImHaushalt: string;
  anamneseText: string;
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
  name: "",
  vorname: "",
  geburtsdatum: "",
  geschlecht: "",
  nationalitaet: "",
  heimatort: "",
  zivilstand: "",
  aufenthaltsstatus: "",
  krankenkasse: "",
  ahvNummer: "",
  hausarztName: "",
  hausarztTelefon: "",
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
  konfession: "",
  quellensteuerHinweise: "",

  groesse: "",
  gewicht: "",
  gewichtsverlust: "nein",
  brille: "nein",
  hoergeraet: "nein",
  chronischeErkrankungen: "",
  spitalaufenthalte: "nein",
  operationen: "",
  allergien: "",
  wohnsituation: "",
  etage: "",
  liftVorhanden: "nein",
  treppen: "nein",
  personenImHaushalt: "1",
  anamneseText: "",
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
const TAB_KEYS = ["personalien", "steuer", "anamnese", "aktivitaeten", "dokumente"] as const;

function getTabCompletion(tabKey: string, data: PatientFormData): { done: number; total: number } {
  switch (tabKey) {
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
      const reqKeys = getPatientRequiredDocKeys();
      const uploaded = reqKeys.filter((k) => !!data.scans[k]).length;
      return { done: uploaded, total: reqKeys.length };
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
const tabDefs = [
  { key: "personalien", label: "Personalien", icon: User },
  { key: "steuer", label: "Soziales & Steuer", icon: ShieldCheck },
  { key: "anamnese", label: "Anamnese", icon: Stethoscope },
  { key: "aktivitaeten", label: "Aktivitäten", icon: Activity },
  { key: "interrai", label: "InterRAI", icon: ClipboardList },
  { key: "pflegeplanung", label: "Pflegeplanung", icon: ClipboardList },
  { key: "klv", label: "KLV", icon: FileText },
  { key: "workflow", label: "Workflow", icon: ClipboardList },
  { key: "dokumente", label: "Dokumente", icon: FileText },
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
  requestedTab?: number | null;
  onTabSwitched?: () => void;
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepPatient({ data, onChange, onValidityChange, onboardingId, requestedTab, onTabSwitched }: StepPatientProps) {
  const [activeTab, setActiveTab] = useState(0);

  // External tab-switch request
  useEffect(() => {
    if (requestedTab != null && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
      onTabSwitched?.();
    }
  }, [requestedTab]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const recording = useRecording();

  /* Compute overall validity (tabs 1-3 must be complete) */
  const requiredTabs = ["personalien", "steuer", "anamnese"];
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

  /* Status logic */
  const completedTabCount = tabDefs.filter((t) => isTabComplete(t.key, data)).length;
  const status = allRequiredComplete
    ? "Aktiv"
    : completedTabCount > 0
    ? "In Vorbereitung"
    : "Nicht abrechenbar";

  return (
    <div className="space-y-0">
      {/* Workspace-Kopf entfernt — Tab-Leiste rückt direkt unter den Onboarding-Header.
         Recording-Button sitzt jetzt rechtsbündig in der Tab-Zeile. */}

      {/* ═══════════════════════════════════════
         HORIZONTAL TAB NAVIGATION + Recording-Button
         ═══════════════════════════════════════ */}
      <div className="flex items-center" style={{ background: "var(--bg-elevated)", borderTopLeftRadius: "var(--radius-card)", borderTopRightRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", borderBottom: "none", padding: "0 20px" }}>
        <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-max" style={{ gap: 0, borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          {tabDefs.map((tab, idx) => {
            const isActive = activeTab === idx;
            const complete = isTabComplete(tab.key, data);
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(idx)}
                className="relative flex items-center whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)",
                  fontSize: "var(--text-small)", fontWeight: isActive ? "var(--weight-semibold)" : "var(--weight-medium)",
                  color: isActive ? "var(--brand-primary)" : complete ? "var(--status-success-text)" : "var(--text-secondary)",
                  background: "transparent", border: "none",
                }}
              >
                {complete && !isActive ? (
                  <CheckCircle2 style={{ width: 14, height: 14, color: "var(--status-success)" }} />
                ) : (
                  <TabIcon style={{ width: 14, height: 14 }} />
                )}
                {tab.label}
                {isActive && (
                  <span className="absolute" style={{ bottom: 0, left: 8, right: 8, height: 2, background: "var(--brand-primary)", borderTopLeftRadius: "var(--radius-pill)", borderTopRightRadius: "var(--radius-pill)" }} />
                )}
              </button>
            );
          })}
        </div>
        </div>
        {/* Recording-Button — rechtsbündig in der Tab-Zeile, Anna-Akzent per styleguide 9 */}
        {onboardingId && (() => {
          const isActive = recording.phase === "recording" && recording.session?.onboardingId === onboardingId;
          const isBusy = recording.phase === "recording" || recording.phase === "processing";
          return (
            <button
              onClick={() => isActive ? recording.stopRecording() : recording.startRecording(null, `${data.vorname || "Patient"} ${data.name || ""}`, onboardingId)}
              disabled={isBusy && !isActive}
              className="inline-flex items-center cursor-pointer transition-colors shrink-0"
              style={{
                gap: 6, padding: "8px 18px 8px 14px", borderRadius: 999, marginLeft: 8,
                background: isActive ? "var(--bg-elevated)" : (isBusy ? "var(--bg-secondary)" : "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))"),
                color: isActive ? "var(--text-primary)" : (isBusy ? "var(--text-tertiary)" : "var(--text-on-dark)"),
                fontSize: "var(--text-small)", fontWeight: 500,
                border: isActive ? "0.5px solid var(--border-default)" : "none",
                minHeight: 36, opacity: isBusy && !isActive ? 0.5 : 1,
              }}
            >
              {isActive ? (
                <><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-danger)", animation: "rec-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} /><style>{`@keyframes rec-pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style> Stoppen</>
              ) : (
                <><Mic style={{ width: 14, height: 14 }} /> Aufzeichnen</>
              )}
            </button>
          );
        })()}
      </div>

      {/* ═══════════════════════════════════════
         TAB CONTENT
         ═══════════════════════════════════════ */}
      <div style={{ background: "var(--bg-elevated)", borderBottomLeftRadius: "var(--radius-card)", borderBottomRightRadius: "var(--radius-card)", borderLeft: "var(--border-thin) solid var(--border-default)", borderRight: "var(--border-thin) solid var(--border-default)", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div style={{ padding: "20px 32px 24px" }}>
          {activeTab === 0 && (
            <TabPersonalienV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {activeTab === 1 && (
            <TabSteuerV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {activeTab === 2 && (
            <TabAnamneseV2 data={data} touched={touched} onUpdate={updateField} onBlur={markTouched} />
          )}
          {activeTab === 3 && (
            <TabAktivitaetenV2 data={data} onUpdateATL={updateATL} />
          )}
          {activeTab === 4 && onboardingId && <OnboardingTabBA onboardingId={onboardingId} />}
          {activeTab === 5 && onboardingId && <OnboardingTabPP onboardingId={onboardingId} />}
          {activeTab === 6 && onboardingId && <OnboardingTabKLV onboardingId={onboardingId} />}
          {activeTab === 7 && onboardingId && <WorkflowChecklist onboardingId={onboardingId} />}
          {activeTab === 8 && <TabDokumente data={data} onChange={onChange} onboardingId={onboardingId || null} />}
        </div>
      </div>

      {/* ── Hint ── */}
      <div className="flex items-center" style={{ gap: "var(--space-2)", padding: "var(--space-2) 2px 0" }}>
        <Info style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
          Navigieren Sie zwischen den Tabs, um alle Patientendaten zu erfassen. Pflichtfelder sind mit * markiert.
        </span>
      </div>

      {/* Recording handled globally via RecordingContext + GlobalRecordingBar */}
    </div>
  );
}

/* ══════════════════════════════════════════
   FORM PRIMITIVES
   ══════════════════════════════════════════ */
function FormField({
  label,
  required,
  children,
  error,
  hint,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string | null;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <label
        className="text-[13px] text-foreground flex items-center gap-1"
        style={{ fontWeight: 500 }}
      >
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  hasError,
  isValid,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
  isValid?: boolean;
  maxLength?: number;
}) {
  const ring = hasError
    ? "border-error/60 focus:ring-error/10 focus:border-error"
    : isValid
    ? "border-success/50 focus:ring-success/10 focus:border-success"
    : "border-border focus:ring-primary/10 focus:border-primary/60";

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full bg-input-background border ${ring} rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] transition-all placeholder:text-muted-foreground/50 pr-9`}
        style={{ fontWeight: 400 }}
      />
      {isValid && value && (
        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
      )}
      {hasError && value && (
        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-error" />
      )}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50 resize-none"
      style={{ fontWeight: 400 }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all appearance-none"
      style={{ fontWeight: 400 }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ToggleGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2.5 rounded-xl text-[13px] border transition-all ${
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-foreground border-border hover:bg-secondary/60"
          }`}
          style={{ fontWeight: 500 }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
          <span
            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
              value === opt.value
                ? "border-primary bg-primary"
                : "border-border group-hover:border-primary/50"
            }`}
          >
            {value === opt.value && <span className="w-2 h-2 rounded-full bg-white" />}
          </span>
          <span className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ── Collapsible section ─── */
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-light rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-[13px] text-foreground flex-1" style={{ fontWeight: 600 }}>
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-border-light">{children}</div>}
    </div>
  );
}

/* ── Shared field props ─── */
interface FieldProps {
  data: PatientFormData;
  touched: Set<string>;
  onUpdate: (field: keyof PatientFormData, value: string) => void;
  onBlur: (field: string) => void;
}

/* ══════════════════════════════════════════
   TAB 1 – PERSONALIEN
   ══════════════════════════════════════════ */
function TabPersonalien({ data, touched, onUpdate, onBlur }: FieldProps) {
  const t = (f: string) => touched.has(f);

  return (
    <div className="space-y-6">
      {/* ── Section: Identität ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Identität
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Left column */}
          <FormField
            label="Name"
            required
            error={t("name") && !filled(data.name) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.name}
              onChange={(v) => onUpdate("name", v)}
              onBlur={() => onBlur("name")}
              placeholder="Nachname"
              hasError={t("name") && !filled(data.name)}
              isValid={filled(data.name)}
            />
          </FormField>

          {/* Right column */}
          <FormField
            label="Vorname"
            required
            error={t("vorname") && !filled(data.vorname) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.vorname}
              onChange={(v) => onUpdate("vorname", v)}
              onBlur={() => onBlur("vorname")}
              placeholder="Vorname"
              hasError={t("vorname") && !filled(data.vorname)}
              isValid={filled(data.vorname)}
            />
          </FormField>

          <FormField
            label="Geburtsdatum"
            required
            error={
              t("geburtsdatum") && !isValidDate(data.geburtsdatum)
                ? "Format: TT.MM.JJJJ"
                : null
            }
            hint="Format: TT.MM.JJJJ"
          >
            <TextInput
              value={data.geburtsdatum}
              onChange={(v) => onUpdate("geburtsdatum", formatDate(v))}
              onBlur={() => onBlur("geburtsdatum")}
              placeholder="01.01.1950"
              hasError={t("geburtsdatum") && !isValidDate(data.geburtsdatum)}
              isValid={isValidDate(data.geburtsdatum)}
              maxLength={10}
            />
          </FormField>

          <FormField label="Geschlecht" required>
            <RadioGroup
              value={data.geschlecht}
              onChange={(v) => onUpdate("geschlecht", v)}
              options={[
                { value: "weiblich", label: "w" },
                { value: "maennlich", label: "m" },
              ]}
            />
          </FormField>

          <FormField label="Nationalität">
            <TextInput
              value={data.nationalitaet}
              onChange={(v) => onUpdate("nationalitaet", v)}
              placeholder="z.B. Schweiz"
            />
          </FormField>

          <FormField
            label="AHV-Nr."
            required
            error={
              t("ahvNummer") && !isValidAHV(data.ahvNummer)
                ? "Format: 756.XXXX.XXXX.XX"
                : null
            }
            hint="13-stellig, beginnt mit 756"
          >
            <TextInput
              value={data.ahvNummer}
              onChange={(v) => onUpdate("ahvNummer", formatAHV(v))}
              onBlur={() => onBlur("ahvNummer")}
              placeholder="756.1234.5678.90"
              hasError={t("ahvNummer") && !isValidAHV(data.ahvNummer)}
              isValid={isValidAHV(data.ahvNummer)}
              maxLength={16}
            />
          </FormField>

          <FormField label="Heimatort (CH)">
            <TextInput
              value={data.heimatort}
              onChange={(v) => onUpdate("heimatort", v)}
              placeholder="z.B. Zürich"
            />
          </FormField>

          <FormField label="E-Mail">
            <TextInput
              value={data.email}
              onChange={(v) => onUpdate("email", v)}
              onBlur={() => onBlur("email")}
              placeholder="patient@beispiel.ch"
              hasError={t("email") && filled(data.email) && !isValidEmail(data.email)}
              isValid={filled(data.email) && isValidEmail(data.email)}
            />
          </FormField>

          <FormField label="Zivilstand">
            <SelectInput
              value={data.zivilstand}
              onChange={(v) => onUpdate("zivilstand", v)}
              options={[
                { value: "", label: "Bitte wählen..." },
                { value: "ledig", label: "Ledig" },
                { value: "verheiratet", label: "Verheiratet" },
                { value: "geschieden", label: "Geschieden" },
                { value: "verwitwet", label: "Verwitwet" },
              ]}
            />
          </FormField>

          <FormField label="Telefon">
            <TextInput
              value={data.telefon}
              onChange={(v) => onUpdate("telefon", v)}
              onBlur={() => onBlur("telefon")}
              placeholder="+41 79 123 45 67"
              hasError={t("telefon") && filled(data.telefon) && !isValidPhone(data.telefon)}
              isValid={filled(data.telefon) && isValidPhone(data.telefon)}
            />
          </FormField>

          <FormField label="Aufenthaltsstatus">
            <SelectInput
              value={data.aufenthaltsstatus}
              onChange={(v) => onUpdate("aufenthaltsstatus", v)}
              options={[
                { value: "", label: "Bitte wählen..." },
                { value: "B", label: "B – Aufenthaltsbewilligung" },
                { value: "C", label: "C – Niederlassungsbewilligung" },
                { value: "L", label: "L – Kurzaufenthaltsbewilligung" },
                { value: "G", label: "G – Grenzgängerbewilligung" },
                { value: "F", label: "F – Vorläufige Aufnahme" },
                { value: "N", label: "N – Asylsuchende" },
              ]}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section: Adresse ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Adresse
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label="Strasse & Nr."
            required
            className="md:col-span-2"
            error={t("adresseStrasse") && !filled(data.adresseStrasse) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.adresseStrasse}
              onChange={(v) => onUpdate("adresseStrasse", v)}
              onBlur={() => onBlur("adresseStrasse")}
              placeholder="Musterstrasse 12"
              hasError={t("adresseStrasse") && !filled(data.adresseStrasse)}
              isValid={filled(data.adresseStrasse)}
            />
          </FormField>

          <FormField
            label="PLZ"
            required
            error={t("adressePlz") && !filled(data.adressePlz) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.adressePlz}
              onChange={(v) => onUpdate("adressePlz", v)}
              onBlur={() => onBlur("adressePlz")}
              placeholder="8000"
              hasError={t("adressePlz") && !filled(data.adressePlz)}
              isValid={filled(data.adressePlz)}
            />
          </FormField>

          <FormField
            label="Ort"
            required
            error={t("adresseOrt") && !filled(data.adresseOrt) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.adresseOrt}
              onChange={(v) => onUpdate("adresseOrt", v)}
              onBlur={() => onBlur("adresseOrt")}
              placeholder="Zürich"
              hasError={t("adresseOrt") && !filled(data.adresseOrt)}
              isValid={filled(data.adresseOrt)}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section: Krankenkasse & Ärzte ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Krankenkasse & Ärzte
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* SP-02: Durchsuchbare Krankenkasse-Picklist */}
          <Combobox label="Krankenkasse" required value={data.krankenkasse || null} onChange={v => { onUpdate("krankenkasse", v || ""); const bag = getBagNummer(v || ""); if (bag) onUpdate("bagNr", bag); }} options={KRANKENKASSEN_OPTIONS} placeholder="Krankenkasse waehlen" error={t("krankenkasse") && !filled(data.krankenkasse) ? "Pflichtfeld" : undefined} />

          {/* SP-03: Kartennummer (umbenannt von Versicherungsnr.) */}
          <FormField label="Kartennummer" required error={t("kartennummer") && !filled(data.kartennummer) ? "Pflichtfeld" : null}>
            <TextInput
              value={data.kartennummer}
              onChange={(v) => onUpdate("kartennummer", v)}
              onBlur={() => onBlur("kartennummer")}
              placeholder="Nummer auf der Versichertenkarte"
              hasError={t("kartennummer") && !filled(data.kartennummer)}
            />
          </FormField>

          {/* SP-03: BAG-Nr. (vorbefuellt, manuell ueberschreibbar) */}
          <FormField label="BAG-Nr. der Kasse">
            <TextInput
              value={data.bagNr}
              onChange={(v) => onUpdate("bagNr", v)}
              placeholder="z.B. 0271"
            />
          </FormField>

          <FormField
            label="Hausarzt"
            required
            error={t("hausarztName") && !filled(data.hausarztName) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.hausarztName}
              onChange={(v) => onUpdate("hausarztName", v)}
              onBlur={() => onBlur("hausarztName")}
              placeholder="Dr. med. ..."
              hasError={t("hausarztName") && !filled(data.hausarztName)}
              isValid={filled(data.hausarztName)}
            />
          </FormField>

          <FormField label="Spezialarzt">
            <TextInput
              value={data.spezialAerzte}
              onChange={(v) => onUpdate("spezialAerzte", v)}
              placeholder="z.B. Dr. Müller, Kardiologie"
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section: Notfallkontakt ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Notfallkontakt
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          <FormField
            label="Name"
            required
            error={t("notfallkontaktName") && !filled(data.notfallkontaktName) ? "Pflichtfeld" : null}
          >
            <TextInput
              value={data.notfallkontaktName}
              onChange={(v) => onUpdate("notfallkontaktName", v)}
              onBlur={() => onBlur("notfallkontaktName")}
              placeholder="Name Notfallkontakt"
              hasError={t("notfallkontaktName") && !filled(data.notfallkontaktName)}
              isValid={filled(data.notfallkontaktName)}
            />
          </FormField>

          <FormField
            label="Telefon"
            required
            error={
              t("notfallkontaktTelefon") && !isValidPhone(data.notfallkontaktTelefon)
                ? "Gültige Telefonnummer erforderlich"
                : null
            }
          >
            <TextInput
              value={data.notfallkontaktTelefon}
              onChange={(v) => onUpdate("notfallkontaktTelefon", v)}
              onBlur={() => onBlur("notfallkontaktTelefon")}
              placeholder="+41 79 123 45 67"
              hasError={t("notfallkontaktTelefon") && !isValidPhone(data.notfallkontaktTelefon)}
              isValid={isValidPhone(data.notfallkontaktTelefon)}
            />
          </FormField>

          <FormField label="Beziehung">
            <SelectInput
              value={data.notfallkontaktBeziehung}
              onChange={(v) => onUpdate("notfallkontaktBeziehung", v)}
              options={[
                { value: "", label: "Bitte wählen..." },
                { value: "ehepartner", label: "Ehepartner/in" },
                { value: "kind", label: "Sohn/Tochter" },
                { value: "elternteil", label: "Elternteil" },
                { value: "geschwister", label: "Geschwister" },
                { value: "nachbar", label: "Nachbar/in" },
                { value: "sonstige", label: "Sonstige" },
              ]}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 2 – STEUER & SOZIALVERSICHERUNGEN
   ══════════════════════════════════════════ */
function TabSteuer({ data, touched, onUpdate, onBlur }: FieldProps) {
  return (
    <div className="space-y-6">
      {/* ── Section 1: Sozialamt ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Sozialamt
          </span>
        </div>
        <div className="space-y-4">
          <FormField label="Sozialamt">
            <ToggleGroup
              value={data.sozialamtKontakt}
              onChange={(v) => onUpdate("sozialamtKontakt", v)}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nein", label: "Nein" },
              ]}
            />
          </FormField>

          {data.sozialamtKontakt === "ja" && (
            <FormField label="Kontakt Sozialamt" required>
              <TextInput
                value={data.sozialamtKontaktDetail}
                onChange={(v) => onUpdate("sozialamtKontaktDetail", v)}
                onBlur={() => onBlur("sozialamtKontaktDetail")}
                placeholder="Name und Kontaktangaben Sozialamt"
              />
            </FormField>
          )}
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section 2: Leistungen ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Leistungen
          </span>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField label="IV-Bezug">
              <ToggleGroup
                value={data.ivBezug}
                onChange={(v) => onUpdate("ivBezug", v)}
                options={[
                  { value: "ja", label: "Ja" },
                  { value: "nein", label: "Nein" },
                ]}
              />
            </FormField>

            {data.ivBezug === "ja" && (
              <FormField label="IV-Bezug %" hint="Prozentsatz z.B. 50, 100">
                <TextInput
                  value={data.ivBezugProzent}
                  onChange={(v) => onUpdate("ivBezugProzent", v)}
                  placeholder="z.B. 100"
                />
              </FormField>
            )}
          </div>

          <FormField label="Hilflosenentschädigung">
            <ToggleGroup
              value={data.hilflosenentschaedigung}
              onChange={(v) => onUpdate("hilflosenentschaedigung", v)}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nein", label: "Nein" },
              ]}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section 3: Steuer ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Steuer
          </span>
        </div>
        <div className="space-y-4">
          <FormField label="Konfession" required>
            <SelectInput
              value={data.konfession}
              onChange={(v) => onUpdate("konfession", v)}
              options={[
                { value: "", label: "Bitte wählen..." },
                { value: "reformiert", label: "Reformiert" },
                { value: "roemisch-katholisch", label: "Römisch-Katholisch" },
                { value: "christkatholisch", label: "Christkatholisch" },
                { value: "konfessionslos", label: "Konfessionslos" },
                { value: "andere", label: "Andere" },
              ]}
            />
          </FormField>

          <FormField
            label="Quellensteuerrelevante Hinweise"
            hint="Optional: Zusätzliche steuerrelevante Informationen"
          >
            <TextArea
              value={data.quellensteuerHinweise}
              onChange={(v) => onUpdate("quellensteuerHinweise", v)}
              placeholder="Freitext für steuerrelevante Hinweise..."
              rows={3}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 3 – ANAMNESE
   ══════════════════════════════════════════ */
function TabAnamnese({ data, touched, onUpdate, onBlur }: FieldProps) {
  const t = (f: string) => touched.has(f);

  return (
    <div className="space-y-4">
      {/* ── Basisanamnese ─── */}
      <CollapsibleSection title="Basisanamnese" icon={Scale} defaultOpen={true}>
        <div className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <FormField
              label="Grösse (cm)"
              required
              error={t("groesse") && !filled(data.groesse) ? "Pflichtfeld" : null}
            >
              <TextInput
                value={data.groesse}
                onChange={(v) => onUpdate("groesse", v)}
                onBlur={() => onBlur("groesse")}
                placeholder="z.B. 170"
                hasError={t("groesse") && !filled(data.groesse)}
                isValid={filled(data.groesse)}
              />
            </FormField>

            <FormField
              label="Gewicht (kg)"
              required
              error={t("gewicht") && !filled(data.gewicht) ? "Pflichtfeld" : null}
            >
              <TextInput
                value={data.gewicht}
                onChange={(v) => onUpdate("gewicht", v)}
                onBlur={() => onBlur("gewicht")}
                placeholder="z.B. 72"
                hasError={t("gewicht") && !filled(data.gewicht)}
                isValid={filled(data.gewicht)}
              />
            </FormField>

            {filled(data.groesse) && filled(data.gewicht) && (
              <div className="flex items-end pb-1">
                <div className="px-3 py-2.5 rounded-xl bg-muted/50 text-[13px]">
                  <span className="text-muted-foreground">BMI: </span>
                  <span className="text-foreground" style={{ fontWeight: 600 }}>
                    {(() => {
                      const h = parseFloat(data.groesse) / 100;
                      const w = parseFloat(data.gewicht);
                      if (h > 0 && w > 0) return (w / (h * h)).toFixed(1);
                      return "–";
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <FormField label="Gewichtsverlust">
              <ToggleGroup
                value={data.gewichtsverlust}
                onChange={(v) => onUpdate("gewichtsverlust", v)}
                options={[
                  { value: "ja", label: "Ja" },
                  { value: "nein", label: "Nein" },
                ]}
              />
            </FormField>

            <FormField label="Brille">
              <ToggleGroup
                value={data.brille}
                onChange={(v) => onUpdate("brille", v)}
                options={[
                  { value: "ja", label: "Ja" },
                  { value: "nein", label: "Nein" },
                ]}
              />
            </FormField>

            <FormField label="Hörgerät">
              <ToggleGroup
                value={data.hoergeraet}
                onChange={(v) => onUpdate("hoergeraet", v)}
                options={[
                  { value: "ja", label: "Ja" },
                  { value: "nein", label: "Nein" },
                ]}
              />
            </FormField>
          </div>

          <FormField
            label="Chronische Erkrankungen"
            required
            error={
              t("chronischeErkrankungen") && !filled(data.chronischeErkrankungen)
                ? "Mindestens eine Diagnose erforderlich"
                : null
            }
          >
            <TextArea
              value={data.chronischeErkrankungen}
              onChange={(v) => onUpdate("chronischeErkrankungen", v)}
              onBlur={() => onBlur("chronischeErkrankungen")}
              placeholder="z.B. Diabetes mellitus Typ 2, Arterielle Hypertonie"
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField label="Spitalaufenthalte (letzte 90 Tage)">
              <ToggleGroup
                value={data.spitalaufenthalte}
                onChange={(v) => onUpdate("spitalaufenthalte", v)}
                options={[
                  { value: "ja", label: "Ja" },
                  { value: "nein", label: "Nein" },
                ]}
              />
            </FormField>

            <FormField label="Operationen" hint="Relevante operative Eingriffe">
              <TextInput
                value={data.operationen}
                onChange={(v) => onUpdate("operationen", v)}
                placeholder="z.B. Hüft-TEP 2024"
              />
            </FormField>
          </div>

          <FormField label="Allergien / Unverträglichkeiten" hint="Medikamente, Nahrungsmittel, Latex etc.">
            <TextArea
              value={data.allergien}
              onChange={(v) => onUpdate("allergien", v)}
              placeholder="z.B. Penicillin, Latex, Nüsse"
              rows={2}
            />
          </FormField>

          <div className="border-t border-border-light pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-primary" />
              <span className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>
                Wohnsituation
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField label="Wohnsituation">
                <SelectInput
                  value={data.wohnsituation}
                  onChange={(v) => onUpdate("wohnsituation", v)}
                  options={[
                    { value: "", label: "Bitte wählen..." },
                    { value: "wohnung", label: "Eigene Wohnung" },
                    { value: "haus", label: "Eigenheim" },
                    { value: "betreut", label: "Betreutes Wohnen" },
                    { value: "heim", label: "Pflegeheim" },
                    { value: "sonstige", label: "Sonstige" },
                  ]}
                />
              </FormField>

              <FormField label="Etage" hint="z.B. EG, 1. OG, 3. OG">
                <TextInput
                  value={data.etage}
                  onChange={(v) => onUpdate("etage", v)}
                  placeholder="z.B. 2. OG"
                />
              </FormField>

              <FormField label="Lift vorhanden">
                <ToggleGroup
                  value={data.liftVorhanden}
                  onChange={(v) => onUpdate("liftVorhanden", v)}
                  options={[
                    { value: "ja", label: "Ja" },
                    { value: "nein", label: "Nein" },
                  ]}
                />
              </FormField>

              <FormField label="Treppen">
                <ToggleGroup
                  value={data.treppen}
                  onChange={(v) => onUpdate("treppen", v)}
                  options={[
                    { value: "ja", label: "Ja" },
                    { value: "nein", label: "Nein" },
                  ]}
                />
              </FormField>

              <FormField label="Personen im Haushalt">
                <SelectInput
                  value={data.personenImHaushalt}
                  onChange={(v) => onUpdate("personenImHaushalt", v)}
                  options={[
                    { value: "1", label: "1 Person (alleinlebend)" },
                    { value: "2", label: "2 Personen" },
                    { value: "3", label: "3 Personen" },
                    { value: "4+", label: "4+ Personen" },
                  ]}
                />
              </FormField>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Anamnese ─── */}
      <CollapsibleSection title="Anamnese" icon={Brain} defaultOpen={false}>
        <div className="pt-3">
          <FormField label="Anamnese" hint="Ausführliche Anamnese freitext">
            <TextArea
              value={data.anamneseText}
              onChange={(v) => onUpdate("anamneseText", v)}
              placeholder="Hier die ausführliche Anamnese dokumentieren..."
              rows={8}
            />
          </FormField>
        </div>
      </CollapsibleSection>

      {/* ── Sturz ─── */}
      <CollapsibleSection title="Sturz" icon={Activity} defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
          <FormField label="Sturz in letzten 6 Monaten">
            <ToggleGroup
              value={data.sturzLetzte6Monate}
              onChange={(v) => onUpdate("sturzLetzte6Monate", v)}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nein", label: "Nein" },
              ]}
            />
          </FormField>

          <FormField label="Vor einem Jahr gestürzt">
            <ToggleGroup
              value={data.sturzVorEinemJahr}
              onChange={(v) => onUpdate("sturzVorEinemJahr", v)}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nein", label: "Nein" },
              ]}
            />
          </FormField>
        </div>
      </CollapsibleSection>

      {/* ── Stimmung ─── */}
      <CollapsibleSection title="Stimmung" icon={HeartPulse} defaultOpen={false}>
        <div className="space-y-4 pt-3">
          <FormField label="Wie fühlen Sie sich aktuell?">
            <TextArea
              value={data.stimmungAktuell}
              onChange={(v) => onUpdate("stimmungAktuell", v)}
              placeholder="Beschreibung der aktuellen Stimmung und Befindlichkeit..."
              rows={3}
            />
          </FormField>

          <FormField label="Fokus des Behandlungsziels">
            <TextArea
              value={data.behandlungszielFokus}
              onChange={(v) => onUpdate("behandlungszielFokus", v)}
              placeholder="Gewünschter Fokus der Behandlung / Ziele..."
              rows={3}
            />
          </FormField>
        </div>
      </CollapsibleSection>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 4 – AKTIVITÄTEN (ATL)
   ══════════════════════════════════════════ */
function TabAktivitaeten({
  data,
  onUpdateATL,
}: {
  data: PatientFormData;
  onUpdateATL: (itemKey: string, update: Partial<ATLEntry>) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-primary" />
        <span className="text-[12px] text-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
          ATL Assessment
        </span>
        <span className="text-[11px] text-muted-foreground ml-1">
          (Aktivitäten des täglichen Lebens)
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_60px_1fr] bg-muted/50 border-b border-border">
          <div className="px-4 py-2.5 text-[12px] text-muted-foreground" style={{ fontWeight: 600 }}>
            Kategorie
          </div>
          <div className="px-2 py-2.5 text-[12px] text-muted-foreground text-center" style={{ fontWeight: 600 }}>
            Ja
          </div>
          <div className="px-2 py-2.5 text-[12px] text-muted-foreground text-center" style={{ fontWeight: 600 }}>
            Nein
          </div>
          <div className="px-4 py-2.5 text-[12px] text-muted-foreground" style={{ fontWeight: 600 }}>
            Bemerkungen
          </div>
        </div>

        {/* Body */}
        {ATL_CATEGORIES.map((cat, catIdx) => (
          <div key={cat.group}>
            {/* Group header */}
            <div className="grid grid-cols-[1fr_60px_60px_1fr] bg-muted/30 border-b border-border-light">
              <div
                className="px-4 py-2 text-[12px] text-foreground col-span-4"
                style={{ fontWeight: 600 }}
              >
                {cat.group}
              </div>
            </div>

            {/* Items */}
            {cat.items.map((item, itemIdx) => {
              const entry = data.atlAssessment[item] || { ja: false, bemerkungen: "" };
              const isLast = catIdx === ATL_CATEGORIES.length - 1 && itemIdx === cat.items.length - 1;

              return (
                <div
                  key={item}
                  className={`grid grid-cols-[1fr_60px_60px_1fr] items-center ${
                    !isLast ? "border-b border-border-light" : ""
                  } hover:bg-muted/20 transition-colors`}
                >
                  <div className="px-4 py-2.5 text-[13px] text-foreground pl-6">
                    {item}
                  </div>
                  <div className="flex justify-center py-2.5">
                    <button
                      type="button"
                      onClick={() => onUpdateATL(item, { ja: true })}
                      className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all ${
                        entry.ja === true
                          ? "border-primary bg-primary text-white"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {entry.ja === true && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex justify-center py-2.5">
                    <button
                      type="button"
                      onClick={() => onUpdateATL(item, { ja: false })}
                      className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all ${
                        entry.ja === false
                          ? "border-muted-foreground/40 bg-muted/50 text-muted-foreground"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      {entry.ja === false && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="px-4 py-1.5">
                    <input
                      type="text"
                      value={entry.bemerkungen}
                      onChange={(e) => onUpdateATL(item, { bemerkungen: e.target.value })}
                      placeholder="–"
                      className="w-full bg-transparent border-0 border-b border-transparent focus:border-primary/40 text-[12px] py-1 outline-none transition-colors placeholder:text-muted-foreground/30"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 5 – DOKUMENTE (Pflicht-Dokumente Stil)
   ══════════════════════════════════════════ */

interface PatientDocItemDef {
  key: string;
  label: string;
  group: string;
  icon: React.ElementType;
  mandatory: boolean;
}

const PATIENT_DOC_ITEMS: PatientDocItemDef[] = [
  /* 1) Identität */
  { key: "pass_id", label: "Pass oder ID", group: "Identität", icon: Shield, mandatory: true },
  { key: "auslaenderausweis", label: "Ausländerausweis", group: "Identität", icon: Shield, mandatory: false },
  /* 2) Vereinbarung */
  { key: "leistungsvereinbarung", label: "Leistungsvereinbarung", group: "Vereinbarung", icon: Handshake, mandatory: true },
  { key: "leistungsplanungsblatt", label: "Leistungsplanungsblatt", group: "Vereinbarung", icon: Handshake, mandatory: true },
  { key: "agb", label: "AGB", group: "Vereinbarung", icon: Handshake, mandatory: true },
  { key: "tarifblatt", label: "Tarifblatt", group: "Vereinbarung", icon: Handshake, mandatory: true },
  /* 3) Medikamente und Mittel */
  { key: "medikationsplan", label: "Medikationsplan", group: "Medikamente und Mittel", icon: Pill, mandatory: true },
  { key: "kontrolle_btm", label: "Kontrolle Betäubungsmittel", group: "Medikamente und Mittel", icon: Pill, mandatory: true },
  { key: "rezepte_pflegematerial", label: "Rezepte Pflegematerial", group: "Medikamente und Mittel", icon: Pill, mandatory: false },
  /* 4) Schlüssel */
  { key: "quittung_schluessel", label: "Quittung Schlüssel-Safe-Code", group: "Schlüssel", icon: Key, mandatory: true },
  { key: "offerte_schluesselsafe", label: "Offerte Schlüsselsafe", group: "Schlüssel", icon: Key, mandatory: false },
  /* 5) Verfügbarkeit */
  { key: "patientenverfuegung", label: "Patientenverfügung", group: "Verfügbarkeit", icon: ScrollText, mandatory: true },
  { key: "vorsorgeauftrag", label: "Vorsorgeauftrag", group: "Verfügbarkeit", icon: ScrollText, mandatory: true },
  /* 6) Aufsicht und Beschwerde */
  { key: "beschwerdeinformationsblatt", label: "Beschwerdeinformationsblatt", group: "Aufsicht und Beschwerde", icon: Megaphone, mandatory: true },
  { key: "beschwerdeeingabeblatt", label: "Beschwerdeeingabeblatt", group: "Aufsicht und Beschwerde", icon: Megaphone, mandatory: true },
  /* 7) Einwilligung */
  { key: "einwilligung_datenschutz", label: "Einwilligungserklärung Datenschutz", group: "Einwilligung", icon: LockIcon, mandatory: true },
  /* 8) Sonstiges */
  { key: "einkaufsliste", label: "Einkaufsliste", group: "Sonstiges", icon: ShoppingCart, mandatory: false },
];

export function getPatientRequiredDocKeys(): string[] {
  return PATIENT_DOC_ITEMS.filter((i) => i.mandatory).map((i) => i.key);
}

/** Returns labels of missing mandatory documents */
export function getFehlendePflichtdokumente(scans: Record<string, unknown>): string[] {
  return PATIENT_DOC_ITEMS.filter(i => i.mandatory && !scans[i.key]).map(i => i.label);
}

/* Group items for rendering */
function getDocGroups(): { group: string; items: PatientDocItemDef[] }[] {
  const groupMap = new Map<string, PatientDocItemDef[]>();
  for (const item of PATIENT_DOC_ITEMS) {
    if (!groupMap.has(item.group)) groupMap.set(item.group, []);
    groupMap.get(item.group)!.push(item);
  }
  return Array.from(groupMap.entries()).map(([group, items]) => ({ group, items }));
}

/* ── SharePoint folder structure mapping ── */
interface SPFolder {
  id: string;
  label: string;
  docKeys: string[];
}

const SP_FOLDERS: SPFolder[] = [
  { id: "01_identitaet", label: "01_Identitaet", docKeys: ["pass_id", "auslaenderausweis"] },
  { id: "02_vereinbarung", label: "02_Vereinbarung", docKeys: ["leistungsvereinbarung", "leistungsplanungsblatt", "agb", "tarifblatt"] },
  { id: "03_medikamente", label: "03_Medikamente_Mittel", docKeys: ["medikationsplan", "kontrolle_btm", "rezepte_pflegematerial"] },
  { id: "04_schluessel", label: "04_Schluessel", docKeys: ["quittung_schluessel", "offerte_schluesselsafe"] },
  { id: "05_verfuegbarkeit", label: "05_Verfuegbarkeit", docKeys: ["patientenverfuegung", "vorsorgeauftrag"] },
  { id: "06_aufsicht_beschwerde", label: "06_Aufsicht_Beschwerde", docKeys: ["beschwerdeinformationsblatt", "beschwerdeeingabeblatt"] },
  { id: "07_einwilligung", label: "07_Einwilligung", docKeys: ["einwilligung_datenschutz"] },
  { id: "08_sonstiges", label: "08_Sonstiges", docKeys: ["einkaufsliste"] },
];

/* ── Patient file upload hook ──────────── */
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

/* ── SharePoint Folder Tree View ────────── */
function SharePointFolderView({
  data,
  onChange,
  onOpenCamera,
}: {
  data: PatientFormData;
  onChange: (d: PatientFormData) => void;
  onOpenCamera: (key: string, label: string) => void;
}) {
  const [activeFolder, setActiveFolder] = useState(SP_FOLDERS[0].id);
  const [expandedRoot, setExpandedRoot] = useState(true);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const patientLabel = data.name && data.vorname
    ? `${data.name}_${data.vorname}`
    : "Patient_Neu";

  const currentFolder = SP_FOLDERS.find((f) => f.id === activeFolder);
  const currentItems = currentFolder
    ? PATIENT_DOC_ITEMS.filter((d) => currentFolder.docKeys.includes(d.key))
    : [];
  const uploadedInFolder = currentItems.filter((i) => !!data.scans[i.key]).length;

  const totalUploaded = PATIENT_DOC_ITEMS.filter((i) => !!data.scans[i.key]).length;

  const removeScan = (key: string) => {
    onChange({ ...data, scans: { ...data.scans, [key]: null } });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
            <CloudUpload className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h5 className="text-foreground">SharePoint Dokumentenablage</h5>
            <p className="text-[11px] text-muted-foreground">
              {totalUploaded} von {PATIENT_DOC_ITEMS.length} Dokumenten hochgeladen · {SP_FOLDERS.length} Ordner
            </p>
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-4 items-start">
        {/* Left: Folder tree */}
        <div className="w-[30%] shrink-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light bg-muted/20">
              <span
                className="text-[11px] text-muted-foreground uppercase tracking-wider"
                style={{ fontWeight: 500 }}
              >
                Ordnerstruktur
              </span>
            </div>
            <div className="p-2">
              {/* Root folder */}
              <button
                onClick={() => setExpandedRoot(!expandedRoot)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left"
              >
                {expandedRoot ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                  {patientLabel}
                </span>
              </button>

              {/* Subfolders */}
              {expandedRoot && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {SP_FOLDERS.map((folder) => {
                    const isActive = activeFolder === folder.id;
                    const folderItems = PATIENT_DOC_ITEMS.filter((d) => folder.docKeys.includes(d.key));
                    const folderUploaded = folderItems.filter((i) => !!data.scans[i.key]).length;
                    const folderTotal = folderItems.length;
                    const folderComplete = folderUploaded === folderTotal && folderTotal > 0;

                    return (
                      <button
                        key={folder.id}
                        onClick={() => setActiveFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-xl text-left transition-all ${
                          isActive
                            ? "bg-primary-light ring-1 ring-primary/15"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {isActive ? (
                          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`text-[12px] truncate flex-1 ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                          style={{ fontWeight: isActive ? 500 : 400 }}
                        >
                          {folder.label}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-[10px] px-[5px] py-[1px] rounded-md ${
                              folderComplete
                                ? "bg-success-light text-success"
                                : isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {folderUploaded}/{folderTotal}
                          </span>
                          {folderComplete && (
                            <CheckCircle2 className="w-2.5 h-2.5 text-success" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: File list for selected folder */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Folder header */}
            <div className="px-5 py-3 border-b border-border-light bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  {currentFolder?.label ?? "—"}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                  style={{ fontWeight: 500 }}
                >
                  <FolderSync className="w-2.5 h-2.5" />
                  SharePoint
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {uploadedInFolder} von {currentItems.length} hochgeladen
              </span>
            </div>

            {/* File table */}
            {currentItems.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-[13px] text-muted-foreground">Keine Dokumente in diesem Ordner.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/20">
                      {["Dokument", "Pflicht", "Status", "Dateiname", "Grösse"].map((col) => (
                        <th key={col} className="px-4 py-2.5 text-left">
                          <span
                            className="text-[10.5px] text-muted-foreground uppercase tracking-wider"
                            style={{ fontWeight: 500 }}
                          >
                            {col}
                          </span>
                        </th>
                      ))}
                      <th className="w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => {
                      const scan = data.scans[item.key] ?? null;
                      const isUploaded = !!scan;
                      const Icon = item.icon;

                      return (
                        <tr
                          key={item.key}
                          className="border-t border-border-light hover:bg-primary/[0.02] transition-colors group"
                        >
                          {/* Dokument */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isUploaded ? "bg-success-light" : "bg-muted"
                                }`}
                              >
                                {isUploaded ? (
                                  <FileCheck className={`w-4 h-4 text-success`} />
                                ) : (
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <span
                                className="text-[13px] text-foreground truncate"
                                style={{ fontWeight: 500 }}
                              >
                                {item.label}
                              </span>
                            </div>
                          </td>

                          {/* Pflicht */}
                          <td className="px-4 py-3">
                            {item.mandatory ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-error/10 text-error"
                                style={{ fontWeight: 600 }}
                              >
                                Pflicht
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                                style={{ fontWeight: 500 }}
                              >
                                Optional
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {isUploaded ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-success"
                                style={{ fontWeight: 500 }}
                              >
                                <CheckCircle2 className="w-3 h-3" /> Hochgeladen
                              </span>
                            ) : item.mandatory ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-error"
                                style={{ fontWeight: 500 }}
                              >
                                <AlertCircle className="w-3 h-3" /> Fehlend
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                                style={{ fontWeight: 500 }}
                              >
                                <Circle className="w-3 h-3" /> Ausstehend
                              </span>
                            )}
                          </td>

                          {/* Dateiname */}
                          <td className="px-4 py-3">
                            {isUploaded && scan ? (
                              <div className="min-w-0">
                                <p className="text-[12px] text-foreground truncate" style={{ fontWeight: 400 }}>
                                  {scan.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{scan.timestamp}</p>
                              </div>
                            ) : (
                              <span className="text-[12px] text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Grösse */}
                          <td className="px-4 py-3 text-[12px] text-muted-foreground">
                            {isUploaded && scan ? scan.size : "—"}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              {isUploaded ? (
                                <>
                                  {scan?.previewUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewKey(previewKey === item.key ? null : item.key)}
                                      className="p-1 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeScan(item.key)}
                                    className="p-1 rounded-lg hover:bg-error/5 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-error" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onOpenCamera(item.key, item.label)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                                    style={{ fontWeight: 500 }}
                                  >
                                    <Camera className="w-3 h-3" />
                                    Scan
                                  </button>
                                  <PatientScanUploadButtonSmall
                                    scanKey={item.key}
                                    docLabel={item.label}
                                    data={data}
                                    onChange={onChange}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Preview row (expandable under table) */}
                {previewKey && (() => {
                  const scan = data.scans[previewKey];
                  if (!scan || !scan.previewUrl) return null;
                  return (
                    <div className="px-5 py-4 border-t border-border-light bg-muted/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>
                          Vorschau: {scan.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewKey(null)}
                          className="p-1 rounded-lg hover:bg-secondary"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-border-light">
                        <img src={scan.previewUrl} alt="Vorschau" className="w-full max-h-40 object-contain bg-white" />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small upload-only button for folder table rows ── */
function PatientScanUploadButtonSmall({
  scanKey,
  docLabel,
  data,
  onChange,
}: {
  scanKey: string;
  docLabel: string;
  data: PatientFormData;
  onChange: (d: PatientFormData) => void;
}) {
  const { trigger, InputEl } = usePatientFileUpload(scanKey, docLabel, data, onChange);
  return (
    <>
      {InputEl}
      <button
        type="button"
        onClick={trigger}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
        style={{ fontWeight: 500 }}
      >
        <Upload className="w-3 h-3" />
        Datei
      </button>
    </>
  );
}


/* ── TabDokumente main ──────────────────── */
function TabDokumente({ data, onChange, onboardingId }: { data: PatientFormData; onChange: (d: PatientFormData) => void; onboardingId: string | null }) {
  const einwilligung = useEinwilligung();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraDocKey, setCameraDocKey] = useState("");
  const [cameraDocLabel, setCameraDocLabel] = useState("");
  const [sharePointToasts, setSharePointToasts] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  // Pflicht-Dokumente view only (Ordnerstruktur entfernt – erst nach Onboarding-Abschluss relevant)

  // Sync: Einwilligung scan upload → shared context
  useEffect(() => {
    if (data.scans["einwilligung_datenschutz"] && !einwilligung.status.signiert) {
      einwilligung.signScan(data.scans["einwilligung_datenschutz"].timestamp);
    }
  }, [data.scans["einwilligung_datenschutz"]]);

  const requiredKeys = getPatientRequiredDocKeys();
  // Count einwilligung as uploaded if signiert (via any path)
  const uploadedRequired = requiredKeys.filter((k) => k === "einwilligung_datenschutz" ? (!!data.scans[k] || einwilligung.status.signiert) : !!data.scans[k]).length;
  const totalRequired = requiredKeys.length;
  const allComplete = uploadedRequired === totalRequired && totalRequired > 0;
  const docGroups = getDocGroups();

  const openCamera = (key: string, label: string) => {
    setCameraDocKey(key);
    setCameraDocLabel(label);
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: PatientScanFile) => {
    onChange({ ...data, scans: { ...data.scans, [cameraDocKey]: file } });
    // Einwilligung scanned → update shared context
    if (cameraDocKey === "einwilligung_datenschutz") {
      einwilligung.signScan(new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }));
    }
    setCameraOpen(false);
    setSharePointToasts((prev) => new Set(prev).add(cameraDocKey));
    setTimeout(() => {
      setSharePointToasts((prev) => {
        const next = new Set(prev);
        next.delete(cameraDocKey);
        return next;
      });
    }, 4000);
  };

  const removeScan = (key: string) => {
    onChange({ ...data, scans: { ...data.scans, [key]: null } });
  };

  return (
    <div className="space-y-5">
      {/* View toggle + Summary bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allComplete ? "bg-success-light" : "bg-primary-light"
            }`}
          >
            {allComplete ? (
              <FileCheck className="w-5 h-5 text-success" />
            ) : (
              <FileText className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
              Pflicht-Dokumente
            </p>
            <p className="text-[12px] text-muted-foreground">
              {uploadedRequired} von {totalRequired} hochgeladen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] ${
              allComplete
                ? "bg-success-light text-success-foreground"
                : "bg-warning-light text-warning-foreground"
            }`}
            style={{ fontWeight: 600 }}
          >
            {allComplete ? (
              <><CheckCircle2 className="w-3 h-3" /> Vollständig</>
            ) : (
              <><AlertCircle className="w-3 h-3" /> Ausstehend</>
            )}
          </span>

          {/* Progress ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
              <circle
                cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${(uploadedRequired / Math.max(totalRequired, 1)) * 125.6} 125.6`}
                strokeLinecap="round"
                className={allComplete ? "text-success" : "text-primary"}
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <span
              className={`absolute inset-0 flex items-center justify-center text-[11px] tabular-nums ${
                allComplete ? "text-success" : "text-foreground"
              }`}
              style={{ fontWeight: 700 }}
            >
              {totalRequired > 0 ? `${Math.round((uploadedRequired / totalRequired) * 100)}%` : "–"}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Pflicht-Dokumente ═══ */}
      {(
        <>
          {/* Grouped document items */}
          {docGroups.map((group) => (
            <div key={group.group}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 px-1" style={{ fontWeight: 600 }}>
                {group.group}
              </p>
              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const scan = data.scans[item.key] ?? null;
                  const isEinwilligungItem = item.key === "einwilligung_datenschutz";
                  const einwilligungDigital = isEinwilligungItem && einwilligung.status.signiert && !scan;
                  const isUploaded = !!scan || einwilligungDigital;
                  const isRequired = item.mandatory;
                  const showToast = sharePointToasts.has(item.key);
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.key}
                      className={`rounded-xl border transition-all ${
                        isUploaded
                          ? "border-success/25 bg-success-light/10"
                          : isRequired
                          ? "border-warning/20 bg-warning-light/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3.5 p-4">
                        {/* Status icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isUploaded
                              ? "bg-success text-white"
                              : isRequired
                              ? "bg-warning-light text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isUploaded ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                                  {item.label}
                                </p>
                                {isRequired && !isUploaded && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded text-[9px] bg-error/10 text-error shrink-0"
                                    style={{ fontWeight: 600 }}
                                  >
                                    Pflicht
                                  </span>
                                )}
                                {!isRequired && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-[1px] rounded text-[9px] bg-muted text-muted-foreground shrink-0"
                                    style={{ fontWeight: 600 }}
                                  >
                                    Optional
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] shrink-0 ${
                                isUploaded
                                  ? "bg-success-light text-success-foreground"
                                  : isRequired
                                  ? "bg-error/10 text-error"
                                  : "bg-muted text-muted-foreground"
                              }`}
                              style={{ fontWeight: 600 }}
                            >
                              {einwilligungDigital ? (
                                <><CheckCircle2 className="w-3 h-3" /> Signiert digital · {einwilligung.status.datum}</>
                              ) : isUploaded ? (
                                <><CheckCircle2 className="w-3 h-3" /> Hochgeladen</>
                              ) : isRequired ? (
                                <><AlertCircle className="w-3 h-3" /> Fehlend</>
                              ) : (
                                <><Circle className="w-3 h-3" /> Nicht vorhanden</>
                              )}
                            </span>
                          </div>

                          {/* Digital signature info (no scan file) */}
                          {einwilligungDigital && (
                            <div className="mt-3 p-3 rounded-lg bg-success-light/30 border border-success/10">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                <div>
                                  <p className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>
                                    Digital signiert in Vertragsunterzeichnung
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {einwilligung.status.datum}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Uploaded file details */}
                          {isUploaded && scan && !einwilligungDigital && (
                            <div className="mt-3 p-3 rounded-lg bg-success-light/30 border border-success/10">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCheck className="w-4 h-4 text-success shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[12px] text-foreground truncate" style={{ fontWeight: 500 }}>
                                      {scan.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {scan.size} · {scan.timestamp}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {scan.previewUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewOpen(previewOpen === item.key ? null : item.key)}
                                      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted border border-border transition-colors"
                                      title="Vorschau"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeScan(item.key)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-error/5 border border-border hover:border-error/20 transition-colors"
                                    title="Entfernen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-error" />
                                  </button>
                                </div>
                              </div>

                              {/* Image preview */}
                              {previewOpen === item.key && scan.previewUrl && (
                                <div className="mt-2.5 rounded-lg overflow-hidden border border-success/10">
                                  <img src={scan.previewUrl} alt={item.label} className="w-full max-h-40 object-contain bg-white" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* SharePoint toast */}
                          {showToast && (
                            <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg bg-success-light border border-success/15 animate-in fade-in slide-in-from-bottom-2">
                              <FolderSync className="w-4 h-4 text-success shrink-0" />
                              <p className="text-[12px] text-success-foreground" style={{ fontWeight: 500 }}>
                                Dokument im SharePoint gespeichert.
                              </p>
                            </div>
                          )}

                          {/* Action buttons */}
                          {!isUploaded && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              {/*
                               * Einwilligung: zusätzlich "Digital signieren"-Aktion.
                               * Die Einwilligung ist die Rechtsgrundlage der Arzt-Anfrage und wird
                               * real beim Erstkontakt signiert, nicht am Onboarding-Ende.
                               */}
                              {isEinwilligungItem && (
                                <button
                                  onClick={() => einwilligung.signDigital(new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }))}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
                                  style={{ fontWeight: 500, border: "none" }}
                                >
                                  <Check className="w-3.5 h-3.5" /> Digital signieren
                                </button>
                              )}
                              <PatientScanUploadButton
                                scanKey={item.key}
                                docLabel={item.label}
                                data={data}
                                onChange={onChange}
                                onCameraOpen={() => openCamera(item.key, item.label)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Missing mandatory warning */}
          {!allComplete && uploadedRequired > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-light/40 border border-warning/15">
              <div className="w-9 h-9 rounded-lg bg-warning-light flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-[18px] h-[18px] text-warning" />
              </div>
              <div>
                <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  {totalRequired - uploadedRequired} Pflicht-Dokument{totalRequired - uploadedRequired !== 1 ? "e" : ""} fehlen
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                  {PATIENT_DOC_ITEMS.filter((i) => i.mandatory && !data.scans[i.key]).map((i) => i.label).join(", ")}
                  . Dieser Abschnitt kann erst als vollständig markiert werden, wenn alle Pflichtdokumente hochgeladen sind.
                </p>
              </div>
            </div>
          )}

          {/* All complete celebration */}
          {allComplete && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-success-light/40 border border-success/15">
              <div className="w-9 h-9 rounded-lg bg-success-light flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="w-[18px] h-[18px] text-success" />
              </div>
              <div>
                <p className="text-[13px] text-success-foreground" style={{ fontWeight: 500 }}>
                  Alle Pflichtdokumente vollständig
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <FolderSync className="w-3.5 h-3.5 text-success" />
                  <p className="text-[12px] text-muted-foreground">
                    Alle Dokumente wurden im SharePoint-Unterordner des Patienten gespeichert.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Dokumente werden als PDF konvertiert und automatisch im SharePoint-Unterordner des Patienten abgelegt. Auf dem Tablet können Sie die Kamerafunktion nutzen, um Dokumente direkt abzufotografieren. Alternativ laden Sie bestehende Dateien über «Datei wählen» hoch.
        </p>
      </div>

      {/* Camera modal */}
      <PatientCameraModal
        open={cameraOpen}
        docLabel={cameraDocLabel}
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   ONBOARDING CLINICAL TABS (read by onboardingId)
   ══════════════════════════════════════════ */

function OnboardingTabBA({ onboardingId }: { onboardingId: string }) {
  const ba = MOCK_ASSESSMENTS.find(a => a.onboardingId === onboardingId);

  // Empty state: no assessment yet
  if (!ba) return (
    <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--radius-card)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <ClipboardList style={{ width: 22, height: 22, color: "var(--text-tertiary)" }} />
      </div>
      <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 6 }}>Noch kein InterRAI</div>
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 16, maxWidth: 320, margin: "0 auto 16px" }}>
        Starte ein Gespräch über den Recording-Button im Header oder erfasse die Items manuell.
      </div>
      <button onClick={() => alert("InterRAI starten – erstellt neues Assessment (Demo)")} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}>
        <ClipboardList style={{ width: 14, height: 14 }} /> InterRAI starten
      </button>
    </div>
  );

  // In-progress: embed the full Arbeitsbereich directly
  if (ba.status === "in-bearbeitung") {
    return (
      <Arbeitsbereich
        assessmentId={ba.id}
        patientName={ba.patientName}
        typ={ba.typ}
        startDatum={ba.startDatum}
        initialItems={ba.items}
        onboardingId={ba.onboardingId}
      />
    );
  }

  // Completed: read-only summary with Scales, CAPs, and Items
  const scales = ba.outcomeScales;
  const caps = ba.getriggerteCaps;
  const sectionItems = SEKTIONEN.map(s => ({ ...s, items: ba.items.filter(i => i.sektion === s.id) })).filter(s => s.items.length > 0);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <TabHeader
        titel="InterRAI"
        statusPill={<span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-success-bg)", color: "var(--status-success-text)" }}><Check style={{ width: 11, height: 11 }} /> Abgeschlossen</span>}
        meta={<HeaderMeta modus="zusammenfassung" text={`${ba.items.length} Items erfasst`} />}
      />
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: -8, marginBottom: 12 }}>{ba.startDatum}</div>

      {/* Outcome-Scales */}
      {scales.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Outcome-Scales</div>
          <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 6 }}>
            {scales.map(s => {
              const pct = s.maxWert > 0 ? s.wert / s.maxWert : 0;
              const color = s.richtung === "hoeher-schlechter" ? (pct > 0.5 ? "var(--status-danger)" : pct > 0.25 ? "var(--status-warning)" : "var(--status-success)") : (pct > 0.5 ? "var(--status-success)" : "var(--status-warning)");
              return (
                <div key={s.id} style={{ padding: "8px 12px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>{s.abkuerzung}</div>
                  <div className="flex items-end" style={{ gap: 3, marginTop: 2 }}><span style={{ fontSize: 16, fontWeight: "var(--weight-medium)", color }}>{s.wert}</span><span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>/{s.maxWert}</span></div>
                  <div style={{ height: 3, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", marginTop: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(5, pct * 100)}%`, background: color, borderRadius: "var(--radius-pill)" }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CAPs */}
      {caps.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Aktive CAPs ({caps.length})</div>
          {caps.map(cap => (
            <div key={cap.id} style={{ padding: "8px 12px", background: cap.prioritaet === "hoch" ? "rgba(168,50,31,0.04)" : "var(--bg-elevated)", border: `var(--border-thin) solid ${cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--border-default)"}`, borderRadius: "var(--radius-card)", marginBottom: 4 }}>
              <div className="flex items-center" style={{ gap: 6 }}>
                <AlertTriangle style={{ width: 12, height: 12, color: cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--status-warning)" }} />
                <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{cap.name}</span>
                <span style={{ padding: "1px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: cap.prioritaet === "hoch" ? "var(--status-danger-bg)" : "var(--status-warning-bg)", color: cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--status-warning-text)" }}>{cap.prioritaet === "hoch" ? "Hoch" : "Mittel"}</span>
              </div>
              <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 3 }}>{cap.beschreibung}</div>
            </div>
          ))}
        </div>
      )}

      {/* Items by section (compact read-only) */}
      {sectionItems.length > 0 && (
        <div>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Erfasste Items ({ba.items.length})</div>
          <div className="flex flex-col" style={{ gap: 4 }}>
            {sectionItems.map(s => (
              <div key={s.id} style={{ padding: "8px 12px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
                <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 3 }}>Sektion {s.id} – {s.name}</div>
                {s.items.map(item => (
                  <div key={item.id} className="flex items-center" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "1px 0", gap: 5 }}>
                    <span style={{ padding: "0 4px", borderRadius: 3, fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>{item.code}</span>
                    <span className="truncate" style={{ color: "var(--text-primary)" }}>{item.frageKurz}</span>
                    <span className="truncate" style={{ flex: 1 }}>{getAntwortText(item) || "–"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 12 }}>
        Folgt dem Schema InterRAI HC Schweiz. Item-Texte sinngemäss formuliert.
      </div>
    </div>
  );
}

function OnboardingTabPP({ onboardingId }: { onboardingId: string }) {
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

  if (!pp) return (
    <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)" }}>
      <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Noch keine Pflegeplanung</div>
      <div style={{ fontSize: "var(--text-small)" }}>Wird aus dem Gespräch oder manuell erstellt.</div>
    </div>
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
      <TabHeader
        titel="Pflegeplanung"
        statusPill={<span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }}><Clock style={{ width: 11, height: 11 }} /> {statusLabel}</span>}
        meta={vorschlaegeCount > 0 ? (
          <button
            onClick={scrollToFirstVorschlag}
            className="inline-flex items-center cursor-pointer"
            style={{ gap: 3, padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-warning-bg)", color: "var(--status-warning-text)", border: "none" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <Clock style={{ width: 10, height: 10 }} />
            {vorschlaegeCount} {vorschlaegeCount === 1 ? "Vorschlag" : "Vorschläge"} zu prüfen
          </button>
        ) : undefined}
        aktion={<button onClick={() => setShowAddDiagnose(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}><Plus style={{ width: 14, height: 14 }} /> Pflegediagnose hinzufügen</button>}
      />

      {/* ═══ Sektion: Ärztliche Diagnosen (eine Sektion, alle Zustände) ═══ */}
      <div style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ärztliche Diagnosen</span>
          <div className="flex items-center" style={{ gap: 2 }}>
            {/* Flow-Status ersetzt die Anfrage-Aktion nur bei "gesendet" (stille Statuszeile).
               antwort_erhalten hat eigenen prominenten ReviewBlock — keine Ghost-Aktion nötig. */}
            {arztAnfrage && arztAnfrage.anfrage.status === "gesendet" && !showArztAnfrage ? (
              <SectionAction
                icon={<Stethoscope style={{ width: 10, height: 10 }} />}
                label="Beim Arzt anfragen"
                statusText={`${arztAnfrage.anfrage.empfaengerName} · ${arztAnfrage.tageSeitVersand} Tage`}
                onClick={() => { setShowArztAnfrage(true); setShowAddArztDiag(false); }}
              />
            ) : (
              <SectionAction
                icon={<Stethoscope style={{ width: 10, height: 10 }} />}
                label="Beim Arzt anfragen"
                onClick={() => { setShowArztAnfrage(!showArztAnfrage); setShowAddArztDiag(false); }}
                active={showArztAnfrage}
              />
            )}
            <SectionAction
              icon={<Plus style={{ width: 10, height: 10 }} />}
              label="Erfassen"
              onClick={() => { setShowAddArztDiag(!showAddArztDiag); setShowArztAnfrage(false); }}
              active={showAddArztDiag}
            />
          </div>
        </div>

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
                <span className="inline-flex items-center" style={{ gap: 3, padding: "1px 8px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }}>
                  <Clock style={{ width: 9, height: 9 }} /> Vorschlag
                </span>
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
      <div className="flex items-center" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pflegediagnosen</span>
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
  const patient = klv?.patientId ? patients.find(p => p.id === klv.patientId) : null;
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

  // ─── Empty state ─────────────────────────────────────
  if (!klv) return (
    <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)" }}>
      <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Noch keine KLV-Verordnung</div>
      <div style={{ fontSize: "var(--text-small)", marginBottom: 16 }}>Wird aus dem Gespräch oder manuell erstellt.</div>
      <button onClick={() => navigate("/klv/neu")} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}>
        <FileText style={{ width: 14, height: 14 }} /> KLV anlegen
      </button>
    </div>
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
