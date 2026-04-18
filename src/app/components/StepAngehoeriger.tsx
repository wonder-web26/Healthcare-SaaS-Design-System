import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  User,
  Receipt,
  Heart,
  Baby,
  Briefcase,
  FileText,
  Loader2,
  AlertCircle,
  Info,
  ShieldAlert,
  HeartHandshake,
  ChevronDown,
  Plus,
  Trash2,
  GraduationCap,
  Landmark,
  CreditCard,
  Building2,
  CalendarDays,
  BadgeAlert,
  Camera,
  Upload,
  X,
  FolderSync,
  Shield,
  FileCheck,
  RotateCcw,
  ImageIcon,
  ScanLine,
  CloudUpload,
  Eye,
  Mail,
  Phone,
  MapPin,
  Cross,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/* ══════════════════════════════════════════
   TYPES (unchanged export contract)
   ══════════════════════════════════════════ */
export interface AngehoerigerFormData {
  /* 1. Personalien – Identität */
  name: string;
  vorname: string;
  geschlecht: string;
  geburtsdatum: string;
  ahvNummer: string;
  nationalitaet: string;
  heimatort: string;
  aufenthaltsstatus: string;
  spezialbewilligungStatus: "nicht_erforderlich" | "ausstehend" | "eingereicht" | "bewilligt";
  spezialbewilligungDokument: { name: string; size: string } | null;
  spezialbewilligungEinreichungsDatum: string;
  spezielleGenehmigung: string;
  zivilstand: string;
  zivilstandSeit: string;
  /* 1. Personalien – Kontaktdaten */
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  /* 1. Personalien – Krankenkasse */
  krankenkasseName: string;
  versicherungsnummer: string;
  /* 2. Steuer & Sozialversicherung */
  quellensteuer: string;
  konfession: string;
  quellensteuerTarif: string;
  steuergemeinde: string;
  bvgVersichert: string;
  uvgVersichert: string;
  sozialamtInvolviert: string;
  sozialamtKontakt: string;
  lohnabtretung: string;
  /* 3. Partner */
  partnerName: string;
  partnerVorname: string;
  partnerGeburtsdatum: string;
  partnerAhvNummer: string;
  partnerZemisNummer: string;
  partnerAufenthaltsstatus: string;
  partnerFbAusweisAngemeldet: string;
  partnerAnmeldungDatum: string;
  partnerBerufstaetig: string;
  partnerAhv: string;
  /* 4. Kinder & Zulagen */
  hatUnterhaltspflichtigeKinder: string;
  kinder: KindEntry[];
  kinderzulagenUeberSpitex: string;
  anzahlKinder: string;
  kinderzulagenBeantragt: string;
  familienausgleichskasse: string;
  /* 5. Anstellung & Auszahlung */
  funktion: string;
  eintrittsdatum: string;
  stundenlohn: string;
  bankname: string;
  iban: string;
  /* 6. Dokumente */
  scans: Record<string, ScanFile | null>;
}

export interface KindEntry {
  id: string;
  name: string;
  vorname: string;
  geburtsdatum: string;
  ahvNummer: string;
  geschlecht: string;
  zulagenart: string;
  ausbildungsstatus: string;
  ausbildungsbeginn: string;
}

function createEmptyKind(): KindEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    vorname: "",
    geburtsdatum: "",
    ahvNummer: "",
    geschlecht: "",
    zulagenart: "K",
    ausbildungsstatus: "",
    ausbildungsbeginn: "",
  };
}

function isKindComplete(k: KindEntry): boolean {
  const base =
    filled(k.name) &&
    filled(k.vorname) &&
    isValidDate(k.geburtsdatum) &&
    isValidAHV(k.ahvNummer) &&
    filled(k.geschlecht) &&
    filled(k.zulagenart);
  if (!base) return false;
  if (k.zulagenart === "W") {
    return filled(k.ausbildungsstatus) && isValidDate(k.ausbildungsbeginn);
  }
  return true;
}

function kindProgress(k: KindEntry): { done: number; total: number } {
  const checks: boolean[] = [
    filled(k.name),
    filled(k.vorname),
    isValidDate(k.geburtsdatum),
    isValidAHV(k.ahvNummer),
    filled(k.geschlecht),
    filled(k.zulagenart),
  ];
  if (k.zulagenart === "W") {
    checks.push(filled(k.ausbildungsstatus), isValidDate(k.ausbildungsbeginn));
  }
  return { done: checks.filter(Boolean).length, total: checks.length };
}

interface ScanFile {
  name: string;
  type: string;
  size: string;
  timestamp: string;
  previewUrl: string | null;
}

export const emptyAngehoerigerForm: AngehoerigerFormData = {
  name: "",
  vorname: "",
  geschlecht: "",
  geburtsdatum: "",
  ahvNummer: "",
  nationalitaet: "",
  heimatort: "",
  aufenthaltsstatus: "",
  spezialbewilligungStatus: "nicht_erforderlich",
  spezialbewilligungDokument: null,
  spezialbewilligungEinreichungsDatum: "",
  spezielleGenehmigung: "",
  zivilstand: "ledig",
  zivilstandSeit: "",
  strasse: "",
  plz: "",
  ort: "",
  email: "",
  telefon: "",
  krankenkasseName: "",
  versicherungsnummer: "",
  quellensteuer: "nein",
  konfession: "",
  quellensteuerTarif: "",
  steuergemeinde: "",
  bvgVersichert: "ja",
  uvgVersichert: "ja",
  sozialamtInvolviert: "nein",
  sozialamtKontakt: "",
  lohnabtretung: "nein",
  partnerName: "",
  partnerVorname: "",
  partnerGeburtsdatum: "",
  partnerAhvNummer: "",
  partnerZemisNummer: "",
  partnerAufenthaltsstatus: "",
  partnerFbAusweisAngemeldet: "nein",
  partnerAnmeldungDatum: "",
  partnerBerufstaetig: "nein",
  partnerAhv: "",
  hatUnterhaltspflichtigeKinder: "nein",
  kinder: [],
  kinderzulagenUeberSpitex: "nein",
  anzahlKinder: "0",
  kinderzulagenBeantragt: "nein",
  familienausgleichskasse: "",
  funktion: "",
  eintrittsdatum: "",
  stundenlohn: "",
  bankname: "",
  iban: "",
  scans: {
    id_scan: null,
    krankenkassenkarte: null,
    bankkarte: null,
    partner_krankenkassenkarte: null,
    kinder_krankenkassenkarte: null,
    familienbuchlein: null,
  },
};

/* ══════════════════════════════════════════
   VALIDATION HELPERS
   ══════════════════════════════════════════ */
function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidAHV(v: string | undefined | null): boolean {
  if (!v) return false;
  const clean = v.replace(/[\s.]/g, "");
  return /^756\d{10}$/.test(clean);
}

function isValidIBAN(v: string | undefined | null): boolean {
  if (!v) return false;
  const clean = v.replace(/\s/g, "");
  return /^CH\d{19}$/i.test(clean);
}

function isValidDate(v: string | undefined | null): boolean {
  if (!v) return false;
  return /^\d{2}\.\d{2}\.\d{4}$/.test(v);
}

/* ══════════════════════════════════════════
   SUB-STEP DEFINITIONS
   ══════════════════════════════════════════ */
interface SubStepDef {
  id: number;
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const subSteps: SubStepDef[] = [
  {
    id: 1,
    key: "personalien",
    label: "Personalien",
    icon: User,
    description: "Identität, Kontaktdaten, Krankenkasse",
  },
  {
    id: 2,
    key: "steuer",
    label: "Steuer & Sozialvers.",
    icon: Receipt,
    description: "Quellensteuer, BVG, UVG-Angaben",
  },
  {
    id: 3,
    key: "partner",
    label: "Partner",
    icon: Heart,
    description: "Zivilstand, Partnerangaben",
  },
  {
    id: 4,
    key: "kinder",
    label: "Kinder & Zulagen",
    icon: Baby,
    description: "Kinderzulagen, Familienausgleichskasse",
  },
  {
    id: 5,
    key: "anstellung",
    label: "Anstellung & Auszahlung",
    icon: Briefcase,
    description: "Funktion, Stundenlohn, Bankdaten",
  },
  {
    id: 6,
    key: "dokumente",
    label: "Dokumente",
    icon: FileText,
    description: "Pflicht-Scans und Uploads",
  },
];

/* ── Sub-step completion logic ─────────── */
function getSubStepStatus(
  key: string,
  data: AngehoerigerFormData
): "empty" | "partial" | "complete" {
  switch (key) {
    case "personalien": {
      const isSwiss = data.nationalitaet === "schweiz";
      const checks = [
        /* Identität */
        filled(data.name),
        filled(data.vorname),
        filled(data.geschlecht),
        isValidDate(data.geburtsdatum),
        isValidAHV(data.ahvNummer),
        filled(data.nationalitaet),
        filled(data.zivilstand),
        isValidDate(data.zivilstandSeit),
        /* Kontaktdaten */
        filled(data.strasse),
        filled(data.plz),
        filled(data.ort),
        filled(data.email),
        filled(data.telefon),
        /* Krankenkasse */
        filled(data.krankenkasseName),
        // versicherungsnummer is optional
      ];
      // Conditional: Heimatort only for Swiss, Aufenthaltsstatus only for non-Swiss
      if (isSwiss) checks.push(filled(data.heimatort));
      if (filled(data.nationalitaet) && !isSwiss) checks.push(filled(data.aufenthaltsstatus));
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "steuer": {
      const isQuellensteuer = data.quellensteuer === "ja";
      const isSozialamt = data.sozialamtInvolviert === "ja";
      const checks = [
        filled(data.quellensteuer),
        filled(data.konfession),
        filled(data.bvgVersichert),
        filled(data.uvgVersichert),
        filled(data.sozialamtInvolviert),
        filled(data.lohnabtretung),
      ];
      // Conditional fields
      if (isQuellensteuer) checks.push(filled(data.quellensteuerTarif));
      if (isSozialamt) checks.push(filled(data.sozialamtKontakt));
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "partner": {
      const needsPartner =
        data.zivilstand === "verheiratet" ||
        data.zivilstand === "eingetragene_partnerschaft" ||
        data.quellensteuer === "ja";
      if (!needsPartner) return "complete"; // not applicable → auto-complete
      const isFbAngemeldet = data.partnerFbAusweisAngemeldet === "ja";
      const checks = [
        filled(data.partnerName),
        filled(data.partnerVorname),
        isValidDate(data.partnerGeburtsdatum),
        isValidAHV(data.partnerAhvNummer),
        filled(data.partnerAufenthaltsstatus),
      ];
      if (isFbAngemeldet) checks.push(isValidDate(data.partnerAnmeldungDatum));
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "kinder": {
      const hasKids = data.hatUnterhaltspflichtigeKinder === "ja";
      if (!hasKids) return "complete"; // no children → auto-complete
      if (data.kinder.length === 0) return "empty";
      const allKidsComplete = data.kinder.every(isKindComplete);
      if (allKidsComplete && filled(data.kinderzulagenUeberSpitex))
        return "complete";
      return "partial";
    }
    case "anstellung": {
      const checks = [
        filled(data.funktion),
        isValidDate(data.eintrittsdatum),
        isValidStundenlohn(data.stundenlohn),
        filled(data.bankname),
        isValidIBAN(data.iban),
      ];
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "dokumente": {
      const requiredKeys = getRequiredScanKeys(data);
      const uploadedCount = requiredKeys.filter((k) => !!data.scans[k]).length;
      if (uploadedCount === requiredKeys.length && requiredKeys.length > 0)
        return "complete";
      if (uploadedCount > 0) return "partial";
      return "empty";
    }
    default:
      return "empty";
  }
}

/* ══════════════════════════════════════════
   PROPS (unchanged export contract)
   ══════════════════════════════════════════ */
interface StepAngehoerigerProps {
  data: AngehoerigerFormData;
  onChange: (data: AngehoerigerFormData) => void;
  onValidityChange?: (isValid: boolean) => void;
  onOpenSpezialbewilligung?: () => void;
}

/* ══════��═══════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepAngehoeriger({
  data,
  onChange,
  onValidityChange,
  onOpenSpezialbewilligung,
}: StepAngehoerigerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  /* ── Compute statuses ──────────────────── */
  const statuses = subSteps.map((s) => ({
    ...s,
    status: getSubStepStatus(s.key, data),
  }));

  const completedCount = statuses.filter((s) => s.status === "complete").length;
  const allComplete = completedCount === subSteps.length;

  /* ── Sync validity upstream ────────────── */
  useEffect(() => {
    onValidityChange?.(allComplete);
  }, [allComplete, onValidityChange]);

  /* ── Save simulation ───────────────────── */
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    }, 900);
  }, []);

  const angehName =
    filled(data.vorname) && filled(data.name)
      ? `${data.vorname} ${data.name}`
      : filled(data.name)
      ? data.name
      : "Neuer Angehöriger";

  const statusLabel = allComplete
    ? "Vollständig"
    : completedCount > 0
    ? "In Erfassung"
    : "Ausstehend";

  const statusBadgeColor = allComplete
    ? "bg-success-light text-success-foreground"
    : completedCount > 0
    ? "bg-warning-light text-warning-foreground"
    : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-0">
      {/* ═══════════════════════════════════════
         TOP HEADER
         ═══════════════════════════════════════ */}
      <div className="bg-card rounded-t-2xl border border-border px-5 py-4 lg:px-6 lg:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                allComplete ? "bg-success-light" : "bg-primary-light"
              }`}
            >
              {allComplete ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-foreground">{angehName}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] ${statusBadgeColor}`}
                  style={{ fontWeight: 500 }}
                >
                  <span
                    className={`w-[5px] h-[5px] rounded-full ${
                      allComplete
                        ? "bg-success"
                        : completedCount > 0
                        ? "bg-warning"
                        : "bg-muted-foreground"
                    }`}
                  />
                  {statusLabel}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Angehöriger / HR-Daten — Schritt 3
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showSaved && (
              <span className="text-[11px] text-success-foreground flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle2 className="w-3 h-3" />
                Gespeichert
              </span>
            )}
            <span
              className={`text-[12px] px-2.5 py-1 rounded-lg tabular-nums ${
                allComplete
                  ? "bg-success-light text-success-foreground"
                  : "bg-primary-light text-primary"
              }`}
              style={{ fontWeight: 600 }}
            >
              {completedCount}/{subSteps.length}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════��═══════════════
         HORIZONTAL TAB NAVIGATION
         ═══════════════════════════════════════ */}
      <div className="bg-card border-x border-border px-5 lg:px-6 overflow-x-auto">
        <div className="flex gap-0 min-w-max border-b border-border">
          {subSteps.map((tab, idx) => {
            const isActive = activeTab === idx;
            const tabStatus = statuses[idx].status;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(idx)}
                className={`relative flex items-center gap-2 px-4 py-3 text-[13px] whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-primary"
                    : tabStatus === "complete"
                    ? "text-success-foreground hover:text-success-foreground/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontWeight: isActive ? 600 : 500 }}
              >
                {tabStatus === "complete" && !isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                ) : (
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                )}
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
         CONTENT AREA
         ═══════════════════════════════════════ */}
      <div className="bg-card rounded-b-2xl border-x border-b border-border">
        <div className="p-5 lg:p-6">
          {activeTab === 0 && <PersonalienForm data={data} onChange={onChange} onOpenSpezialbewilligung={onOpenSpezialbewilligung} />}
          {activeTab === 1 && <SteuerForm data={data} onChange={onChange} />}
          {activeTab === 2 && <PartnerForm data={data} onChange={onChange} />}
          {activeTab === 3 && <KinderForm data={data} onChange={onChange} />}
          {activeTab === 4 && <AnstellungForm data={data} onChange={onChange} />}
          {activeTab === 5 && <DokumenteForm data={data} onChange={onChange} onOpenSpezialbewilligung={onOpenSpezialbewilligung} />}
        </div>
      </div>

      {/* ── Hint ── */}
      <div className="flex items-center gap-2 px-1 pt-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">
          Navigieren Sie zwischen den Tabs, um alle Angehörigen-Daten zu erfassen. Pflichtfelder sind mit * markiert.
        </span>
      </div>
    </div>
  );
}

/* ═════════════════��════════════════════════
   SHARED UI HELPERS
   ══════════════════════════════════════════ */

function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-[13px]">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function JaNeinToggle({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {(["ja", "nein"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onValueChange(v)}
          className={`flex-1 h-9 rounded-md text-[13px] border transition-all ${
            value === v
              ? v === "ja"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-foreground border-border"
              : "bg-input-background text-muted-foreground border-input hover:border-primary/30"
          }`}
          style={{ fontWeight: 500 }}
        >
          {v === "ja" ? "Ja" : "Nein"}
        </button>
      ))}
    </div>
  );
}

function formatAHV(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 11));
  if (digits.length > 11) parts.push(digits.slice(11, 13));
  return parts.join(".");
}

function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  return parts.join(".");
}

function formatIBAN(raw: string): string {
  // Keep only alphanumerics, uppercase
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 21);
  // Group: CH## #### #### #### #### #
  const groups: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    groups.push(clean.slice(i, i + 4));
  }
  return groups.join(" ");
}

function isValidStundenlohn(v: string): boolean {
  if (!filled(v)) return false;
  const n = parseFloat(v);
  return !isNaN(n) && n > 0;
}

function isValidEmail(v: string): boolean {
  if (!filled(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v: string): boolean {
  if (!filled(v)) return false;
  const clean = v.replace(/[\s\-\(\)]/g, "");
  return /^\+?\d{8,15}$/.test(clean);
}

function isValidPLZ(v: string): boolean {
  if (!filled(v)) return false;
  return /^\d{4}$/.test(v.trim());
}

/* Payroll-critical field wrapper */
function PayrollField({
  label,
  required,
  error,
  hint,
  children,
  className,
  critical = false,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  critical?: boolean;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-[13px] flex items-center gap-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
        {critical && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded text-[9px] bg-warning-light text-warning-foreground" style={{ fontWeight: 600 }}>
            <BadgeAlert className="w-2.5 h-2.5" />
            Lohnrelevant
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 1 – PERSONALIEN FORM
   ══════════════════════════════════════════ */
function PersonalienForm({
  data,
  onChange,
  onOpenSpezialbewilligung,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  onOpenSpezialbewilligung?: () => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const set = (field: keyof AngehoerigerFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isSwiss = data.nationalitaet === "schweiz";
  const isNatSelected = filled(data.nationalitaet);

  return (
    <div className="space-y-6">
      {/* ── Section 1: Identität ─────��──────── */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Identität
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField
            label="Name"
            required
            error={touched.name && !filled(data.name) ? "Pflichtfeld" : undefined}
          >
            <Input
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => touch("name")}
              placeholder="Nachname"
            />
          </FormField>

          <FormField
            label="Vorname"
            required
            error={touched.vorname && !filled(data.vorname) ? "Pflichtfeld" : undefined}
          >
            <Input
              value={data.vorname}
              onChange={(e) => set("vorname", e.target.value)}
              onBlur={() => touch("vorname")}
              placeholder="Vorname"
            />
          </FormField>

          <FormField
            label="Geschlecht"
            required
            error={touched.geschlecht && !filled(data.geschlecht) ? "Pflichtfeld" : undefined}
          >
            <Select
              value={data.geschlecht}
              onValueChange={(v) => { set("geschlecht", v); touch("geschlecht"); }}
            >
              <SelectTrigger className={!filled(data.geschlecht) ? "text-muted-foreground" : ""}>
                <SelectValue placeholder="Geschlecht wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maennlich">Männlich</SelectItem>
                <SelectItem value="weiblich">Weiblich</SelectItem>
                <SelectItem value="divers">Divers</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Geburtsdatum"
            required
            hint="Format: TT.MM.JJJJ"
            error={
              touched.geburtsdatum && filled(data.geburtsdatum) && !isValidDate(data.geburtsdatum)
                ? "Ungültiges Format (TT.MM.JJJJ)"
                : touched.geburtsdatum && !filled(data.geburtsdatum)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.geburtsdatum}
              onChange={(e) => set("geburtsdatum", formatDate(e.target.value))}
              onBlur={() => touch("geburtsdatum")}
              placeholder="01.01.1990"
              maxLength={10}
            />
          </FormField>

          <FormField
            label="AHV-Nummer"
            required
            hint="Format: 756.XXXX.XXXX.XX (13-stellig)"
            error={
              touched.ahvNummer && filled(data.ahvNummer) && !isValidAHV(data.ahvNummer)
                ? "Ungültige AHV-Nummer (13-stellig, beginnt mit 756)"
                : touched.ahvNummer && !filled(data.ahvNummer)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.ahvNummer}
              onChange={(e) => set("ahvNummer", formatAHV(e.target.value))}
              onBlur={() => touch("ahvNummer")}
              placeholder="756.1234.5678.97"
              maxLength={16}
            />
          </FormField>

          <FormField
            label="Nationalität"
            required
            error={touched.nationalitaet && !filled(data.nationalitaet) ? "Pflichtfeld" : undefined}
          >
            <Select
              value={data.nationalitaet}
              onValueChange={(v) => {
                touch("nationalitaet");
                if (v === "schweiz") {
                  onChange({ ...data, nationalitaet: v, aufenthaltsstatus: "CH" });
                } else {
                  onChange({ ...data, nationalitaet: v, heimatort: "", aufenthaltsstatus: "" });
                }
              }}
            >
              <SelectTrigger className={!filled(data.nationalitaet) ? "text-muted-foreground" : ""}>
                <SelectValue placeholder="Nationalität wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schweiz">Schweiz</SelectItem>
                <SelectItem value="deutschland">Deutschland</SelectItem>
                <SelectItem value="frankreich">Frankreich</SelectItem>
                <SelectItem value="italien">Italien</SelectItem>
                <SelectItem value="oesterreich">Österreich</SelectItem>
                <SelectItem value="portugal">Portugal</SelectItem>
                <SelectItem value="spanien">Spanien</SelectItem>
                <SelectItem value="tuerkei">Türkei</SelectItem>
                <SelectItem value="andere">Andere</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {isNatSelected && (
            <FormField
              label="Aufenthaltsstatus"
              required
              error={touched.aufenthaltsstatus && !filled(data.aufenthaltsstatus) ? "Pflichtfeld" : undefined}
            >
              <Select
                value={data.aufenthaltsstatus}
                onValueChange={(v) => {
                  onChange({
                    ...data,
                    aufenthaltsstatus: v,
                    spezialbewilligungStatus: v === "B" ? "ausstehend" : "nicht_erforderlich",
                    spezialbewilligungDokument: v === "B" ? data.spezialbewilligungDokument : null,
                    spezialbewilligungEinreichungsDatum: v === "B" ? data.spezialbewilligungEinreichungsDatum : "",
                  });
                  touch("aufenthaltsstatus");
                }}
              >
                <SelectTrigger className={`${!filled(data.aufenthaltsstatus) ? "text-muted-foreground" : ""} ${data.aufenthaltsstatus === "B" && data.spezialbewilligungStatus !== "eingereicht" ? "!border-error !border-2 !ring-error/20" : ""}`}>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  {isSwiss && (
                    <SelectItem value="CH">Schweizer Bürger/in</SelectItem>
                  )}
                  <SelectItem value="B">B – Aufenthaltsbewilligung</SelectItem>
                  <SelectItem value="C">C – Niederlassungsbewilligung</SelectItem>
                  <SelectItem value="L">L – Kurzaufenthaltsbewilligung</SelectItem>
                  <SelectItem value="G">G – Grenzgängerbewilligung</SelectItem>
                  <SelectItem value="F">F – Vorläufige Aufnahme</SelectItem>
                  <SelectItem value="N">N – Asylsuchende</SelectItem>
                  <SelectItem value="S">S – Schutzbedürftige</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          {data.aufenthaltsstatus === "B" && data.spezialbewilligungStatus === "ausstehend" && (
            <div className="rounded-xl border-2 border-error bg-error-light p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-error-foreground" style={{ fontWeight: 600 }}>
                    Spezialbewilligung B erforderlich
                  </div>
                  <p className="text-[12px] text-error-foreground/80 mt-1 leading-relaxed">
                    Für Personen mit Aufenthaltsstatus B muss eine Erwerbstätigkeitsbewilligung beim
                    Migrationsamt beantragt werden, bevor ein Arbeitsvertrag ausgestellt werden darf.
                    Das Onboarding ist an der Vertragsphase blockiert, bis dieser Schritt erledigt ist.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onOpenSpezialbewilligung}
                      className="inline-flex items-center gap-1.5 px-3 py-[6px] text-[12px] rounded-xl bg-error text-white hover:bg-error/90 transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      Spezialbewilligung jetzt ausfüllen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.aufenthaltsstatus === "B" && data.spezialbewilligungStatus === "eingereicht" && (
            <div className="rounded-xl border border-success/30 bg-success-light p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-success-foreground" style={{ fontWeight: 600 }}>
                    Spezialbewilligung B
                  </div>
                  <p className="text-[12px] text-success-foreground/80 mt-1 leading-relaxed">
                    Einreichungs-Bestätigung vom {data.spezialbewilligungEinreichungsDatum ? formatDateDisplay(data.spezialbewilligungEinreichungsDatum) : "–"} liegt vor. Die Vertragsunterzeichnung ist freigegeben.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onOpenSpezialbewilligung}
                      className="inline-flex items-center gap-1.5 px-3 py-[6px] text-[12px] rounded-xl border border-success/30 text-success-foreground hover:bg-success-medium transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      Dokument ansehen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {["F", "N", "S"].includes(data.aufenthaltsstatus) && (
            <FormField label="Spezielle Genehmigung">
              <Select
                value={data.spezielleGenehmigung}
                onValueChange={(v) => { set("spezielleGenehmigung", v); touch("spezielleGenehmigung"); }}
              >
                <SelectTrigger className={!filled(data.spezielleGenehmigung) ? "text-muted-foreground" : ""}>
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">Ja</SelectItem>
                  <SelectItem value="nein">Nein</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          {isSwiss && (
            <FormField
              label="Heimatort"
              required
              error={touched.heimatort && !filled(data.heimatort) ? "Pflichtfeld für Schweizer Bürger" : undefined}
            >
              <Input
                value={data.heimatort}
                onChange={(e) => set("heimatort", e.target.value)}
                onBlur={() => touch("heimatort")}
                placeholder="z.B. Zürich"
              />
            </FormField>
          )}

          <FormField label="Zivilstand" required>
            <Select value={data.zivilstand} onValueChange={(v) => set("zivilstand", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Zivilstand wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ledig">Ledig</SelectItem>
                <SelectItem value="verheiratet">Verheiratet</SelectItem>
                <SelectItem value="geschieden">Geschieden</SelectItem>
                <SelectItem value="verwitwet">Verwitwet</SelectItem>
                <SelectItem value="eingetragene_partnerschaft">Eingetragene Partnerschaft</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Zivilstand seit"
            required
            hint="Format: TT.MM.JJJJ"
            error={
              touched.zivilstandSeit && filled(data.zivilstandSeit) && !isValidDate(data.zivilstandSeit)
                ? "Ungültiges Format (TT.MM.JJJJ)"
                : touched.zivilstandSeit && !filled(data.zivilstandSeit)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.zivilstandSeit}
              onChange={(e) => set("zivilstandSeit", formatDate(e.target.value))}
              onBlur={() => touch("zivilstandSeit")}
              placeholder="01.06.2020"
              maxLength={10}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section 2: Kontaktdaten ─────────── */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Kontaktdaten
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField
            label="Strasse & Nr."
            required
            className="md:col-span-2"
            error={touched.strasse && !filled(data.strasse) ? "Pflichtfeld" : undefined}
          >
            <Input
              value={data.strasse}
              onChange={(e) => set("strasse", e.target.value)}
              onBlur={() => touch("strasse")}
              placeholder="Musterstrasse 12"
            />
          </FormField>

          <FormField
            label="PLZ"
            required
            error={
              touched.plz && filled(data.plz) && !isValidPLZ(data.plz)
                ? "PLZ muss 4-stellig sein"
                : touched.plz && !filled(data.plz)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.plz}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                set("plz", v);
              }}
              onBlur={() => touch("plz")}
              placeholder="8000"
              maxLength={4}
            />
          </FormField>

          <FormField
            label="Ort"
            required
            error={touched.ort && !filled(data.ort) ? "Pflichtfeld" : undefined}
          >
            <Input
              value={data.ort}
              onChange={(e) => set("ort", e.target.value)}
              onBlur={() => touch("ort")}
              placeholder="Zürich"
            />
          </FormField>

          <FormField
            label="E-Mail"
            required
            error={
              touched.email && filled(data.email) && !isValidEmail(data.email)
                ? "Ungültige E-Mail-Adresse"
                : touched.email && !filled(data.email)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <div className="relative">
              <Input
                value={data.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => touch("email")}
                placeholder="name@beispiel.ch"
                type="email"
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </FormField>

          <FormField
            label="Telefon"
            required
            hint="Mobilnummer bevorzugt"
            error={
              touched.telefon && filled(data.telefon) && !isValidPhone(data.telefon)
                ? "Ungültige Telefonnummer"
                : touched.telefon && !filled(data.telefon)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <div className="relative">
              <Input
                value={data.telefon}
                onChange={(e) => set("telefon", e.target.value)}
                onBlur={() => touch("telefon")}
                placeholder="+41 79 123 45 67"
                type="tel"
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* ── Section 3: Krankenkasse ─────────── */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Cross className="w-4 h-4 text-primary" />
          Krankenkasse
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField
            label="Krankenkasse Name"
            required
            error={touched.krankenkasseName && !filled(data.krankenkasseName) ? "Pflichtfeld" : undefined}
          >
            <Input
              value={data.krankenkasseName}
              onChange={(e) => set("krankenkasseName", e.target.value)}
              onBlur={() => touch("krankenkasseName")}
              placeholder="z.B. CSS, Helsana, Swica"
            />
          </FormField>

          <FormField
            label="Versicherungsnummer"
            hint="Optional – falls auf der Karte ersichtlich"
          >
            <Input
              value={data.versicherungsnummer}
              onChange={(e) => set("versicherungsnummer", e.target.value)}
              placeholder="Versicherungsnummer"
            />
          </FormField>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10 mt-2">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Die AHV-Nummer wird automatisch formatiert und geprüft (756.XXXX.XXXX.XX). Das Geburtsdatum und Zivilstand-seit-Datum müssen im Schweizer Format (TT.MM.JJJJ) eingegeben werden. Bei ausländischen Staatsangehörigen ist die Aufenthaltsbewilligung ein Pflichtfeld. Heimatort wird nur für Schweizer Bürger angezeigt.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2 – STEUER & SOZIALVERSICHERUNG
   ══════════════════════════════════════════ */
function SteuerForm({
  data,
  onChange,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const set = (field: keyof AngehoerigerFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isQuellensteuer = data.quellensteuer === "ja";
  const isSozialamt = data.sozialamtInvolviert === "ja";

  return (
    <div className="space-y-6">
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          Quellensteuer
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField label="Quellensteuerpflichtig?" required hint="Nicht-CH-Bürger mit B/L-Bewilligung sind i.d.R. quellensteuerpflichtig">
            <JaNeinToggle
              value={data.quellensteuer}
              onValueChange={(v) => {
                if (v === "nein") {
                  onChange({ ...data, quellensteuer: v, quellensteuerTarif: "" });
                } else {
                  set("quellensteuer", v);
                }
              }}
            />
          </FormField>

          <FormField
            label="Konfession"
            required
            hint="Relevant für Kirchensteuer"
            error={touched.konfession && !filled(data.konfession) ? "Pflichtfeld" : undefined}
          >
            <Select
              value={data.konfession}
              onValueChange={(v) => { set("konfession", v); touch("konfession"); }}
            >
              <SelectTrigger className={!filled(data.konfession) ? "text-muted-foreground" : ""}>
                <SelectValue placeholder="Konfession wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reformiert">Evangelisch-reformiert</SelectItem>
                <SelectItem value="katholisch">Römisch-katholisch</SelectItem>
                <SelectItem value="christkatholisch">Christkatholisch</SelectItem>
                <SelectItem value="andere">Andere Konfession</SelectItem>
                <SelectItem value="konfessionslos">Konfessionslos</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {isQuellensteuer && (
            <FormField
              label="Quellensteuer-Tarif"
              required
              error={touched.quellensteuerTarif && !filled(data.quellensteuerTarif) ? "Pflichtfeld bei Quellensteuerpflicht" : undefined}
              hint="A=Alleinstehend, B=Verheiratet, C=Doppelverdiener, H=Alleinerziehend"
            >
              <Select
                value={data.quellensteuerTarif}
                onValueChange={(v) => { set("quellensteuerTarif", v); touch("quellensteuerTarif"); }}
              >
                <SelectTrigger className={!filled(data.quellensteuerTarif) ? "text-muted-foreground" : ""}>
                  <SelectValue placeholder="Tarif wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A – Alleinstehend</SelectItem>
                  <SelectItem value="B">B – Verheiratet, Alleinverdiener</SelectItem>
                  <SelectItem value="C">C – Doppelverdiener</SelectItem>
                  <SelectItem value="H">H – Alleinerziehend</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>
      </div>

      <div className="border-t border-border-light" />

      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Sozialversicherung
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField label="BVG-versichert?" required>
            <JaNeinToggle value={data.bvgVersichert} onValueChange={(v) => set("bvgVersichert", v)} />
          </FormField>
          <FormField label="UVG-versichert?" required>
            <JaNeinToggle value={data.uvgVersichert} onValueChange={(v) => set("uvgVersichert", v)} />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Weitere Angaben
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField label="Sozialamt involviert?" required>
            <JaNeinToggle
              value={data.sozialamtInvolviert}
              onValueChange={(v) => {
                if (v === "nein") {
                  onChange({ ...data, sozialamtInvolviert: v, sozialamtKontakt: "" });
                } else {
                  set("sozialamtInvolviert", v);
                }
              }}
            />
          </FormField>
          <FormField label="Lohnabtretung?" required>
            <JaNeinToggle value={data.lohnabtretung} onValueChange={(v) => set("lohnabtretung", v)} />
          </FormField>

          {isSozialamt && (
            <FormField
              label="Sozialamt Kontaktdaten"
              required
              className="md:col-span-2"
              error={touched.sozialamtKontakt && !filled(data.sozialamtKontakt) ? "Pflichtfeld bei Sozialamtbeteiligung" : undefined}
              hint="Name, Telefon und E-Mail der zuständigen Person"
            >
              <Input
                value={data.sozialamtKontakt}
                onChange={(e) => set("sozialamtKontakt", e.target.value)}
                onBlur={() => touch("sozialamtKontakt")}
                placeholder="z.B. Sozialamt Zürich, Hr. Müller, 044 123 45 67"
              />
            </FormField>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Bei Quellensteuer-Pflicht wird automatisch die korrekte Tarifklasse vorgeschlagen. Die Konfession ist relevant für die Berechnung der Kirchensteuer. Sozialamtangaben werden vertraulich behandelt.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3 – PARTNER
   ══════════════════════════════════════════ */
function PartnerForm({
  data,
  onChange,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const set = (field: keyof AngehoerigerFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const needsPartner =
    data.zivilstand === "verheiratet" ||
    data.zivilstand === "eingetragene_partnerschaft" ||
    data.quellensteuer === "ja";

  const isVerheiratet =
    data.zivilstand === "verheiratet" ||
    data.zivilstand === "eingetragene_partnerschaft";
  const isQuellensteuer = data.quellensteuer === "ja";

  const showZemis =
    filled(data.partnerAufenthaltsstatus) &&
    (data.partnerAufenthaltsstatus === "F" ||
      data.partnerAufenthaltsstatus === "B" ||
      data.partnerAufenthaltsstatus === "L");

  const isFbAngemeldet = data.partnerFbAusweisAngemeldet === "ja";

  /* Not applicable state */
  if (!needsPartner) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-success-light flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
            Keine Partnerangaben erforderlich
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
            Basierend auf dem Zivilstand ({
              data.zivilstand === "ledig" ? "Ledig" :
              data.zivilstand === "geschieden" ? "Geschieden" :
              data.zivilstand === "verwitwet" ? "Verwitwet" :
              data.zivilstand
            }) und dem Quellensteuerstatus (nicht quellensteuerpflichtig) sind in diesem Schritt keine Angaben nötig.
          </p>
          <p className="text-[11px] text-muted-foreground mt-3">
            Dieser Abschnitt wird automatisch als vollständig markiert.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
          <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
          <p className="text-[12px] text-info-foreground leading-relaxed">
            Partnerangaben werden benötigt, wenn der Zivilstand «Verheiratet» oder «Eingetragene Partnerschaft» ist, oder wenn Quellensteuerpflicht besteht. Sie können den Zivilstand jederzeit in Schritt 1 (Personalien) ändern.
          </p>
        </div>
      </div>
    );
  }

  /* Build reason text */
  const reasons: string[] = [];
  if (isVerheiratet) {
    reasons.push(
      data.zivilstand === "eingetragene_partnerschaft"
        ? "eingetragener Partnerschaft"
        : "Verheiratung"
    );
  }
  if (isQuellensteuer) {
    reasons.push("Quellensteuerpflicht");
  }
  const reasonText = reasons.join(" und ");

  return (
    <div className="space-y-6">
      {/* Explanation callout */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-light/40 border border-primary/10">
        <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
          <HeartHandshake className="w-[18px] h-[18px] text-primary" />
        </div>
        <div>
          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
            Partnerangaben erforderlich
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
            Aufgrund der {reasonText} werden die folgenden Angaben zum Partner / zur Partnerin benötigt. Diese Daten sind relevant für die korrekte Berechnung der Quellensteuer-Tarifklasse und ggf. für Sozialversicherungs-Abzüge.
          </p>
        </div>
      </div>

      {/* Section 1: Personalien Partner */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Personalien Partner/in
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField
            label="Name Partner"
            required
            error={
              touched.partnerName && !filled(data.partnerName)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.partnerName}
              onChange={(e) => set("partnerName", e.target.value)}
              onBlur={() => touch("partnerName")}
              placeholder="Nachname"
            />
          </FormField>

          <FormField
            label="Vorname Partner"
            required
            error={
              touched.partnerVorname && !filled(data.partnerVorname)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.partnerVorname}
              onChange={(e) => set("partnerVorname", e.target.value)}
              onBlur={() => touch("partnerVorname")}
              placeholder="Vorname"
            />
          </FormField>

          <FormField
            label="Geburtsdatum Partner"
            required
            hint="Format: TT.MM.JJJJ"
            error={
              touched.partnerGeburtsdatum &&
              filled(data.partnerGeburtsdatum) &&
              !isValidDate(data.partnerGeburtsdatum)
                ? "Ungültiges Format (TT.MM.JJJJ)"
                : touched.partnerGeburtsdatum &&
                  !filled(data.partnerGeburtsdatum)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.partnerGeburtsdatum}
              onChange={(e) =>
                set("partnerGeburtsdatum", formatDate(e.target.value))
              }
              onBlur={() => touch("partnerGeburtsdatum")}
              placeholder="01.01.1985"
              maxLength={10}
            />
          </FormField>

          <FormField
            label="AHV-Nummer Partner"
            required
            hint="Format: 756.XXXX.XXXX.XX"
            error={
              touched.partnerAhvNummer &&
              filled(data.partnerAhvNummer) &&
              !isValidAHV(data.partnerAhvNummer)
                ? "Ungültige AHV-Nummer (13-stellig, beginnt mit 756)"
                : touched.partnerAhvNummer &&
                  !filled(data.partnerAhvNummer)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Input
              value={data.partnerAhvNummer}
              onChange={(e) =>
                set("partnerAhvNummer", formatAHV(e.target.value))
              }
              onBlur={() => touch("partnerAhvNummer")}
              placeholder="756.1234.5678.97"
              maxLength={16}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* Section 2: Aufenthalt & Ausweis */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          Aufenthalt & Ausweis
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField
            label="Aufenthaltsstatus Partner"
            required
            error={
              touched.partnerAufenthaltsstatus &&
              !filled(data.partnerAufenthaltsstatus)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <Select
              value={data.partnerAufenthaltsstatus}
              onValueChange={(v) => {
                touch("partnerAufenthaltsstatus");
                if (v !== "F" && v !== "B" && v !== "L") {
                  onChange({
                    ...data,
                    partnerAufenthaltsstatus: v,
                    partnerZemisNummer: "",
                  });
                } else {
                  set("partnerAufenthaltsstatus", v);
                }
              }}
            >
              <SelectTrigger
                className={
                  !filled(data.partnerAufenthaltsstatus)
                    ? "text-muted-foreground"
                    : ""
                }
              >
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schweiz">Schweizer/in</SelectItem>
                <SelectItem value="B">B – Aufenthaltsbewilligung</SelectItem>
                <SelectItem value="C">C – Niederlassungsbewilligung</SelectItem>
                <SelectItem value="L">L – Kurzaufenthaltsbewilligung</SelectItem>
                <SelectItem value="G">G – Grenzgängerbewilligung</SelectItem>
                <SelectItem value="F">F – Vorläufige Aufnahme</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {showZemis && (
            <FormField
              label="ZEMIS-Nummer"
              hint="Zentrales Migrationsinformationssystem – auf Ausweis F/B/L ersichtlich"
              error={
                touched.partnerZemisNummer &&
                filled(data.partnerZemisNummer) &&
                !/^\d{6,10}$/.test(
                  data.partnerZemisNummer.replace(/[\s.\-]/g, "")
                )
                  ? "Ungültiges Format (6–10 Ziffern)"
                  : undefined
              }
            >
              <Input
                value={data.partnerZemisNummer}
                onChange={(e) => set("partnerZemisNummer", e.target.value)}
                onBlur={() => touch("partnerZemisNummer")}
                placeholder="z.B. 12345678"
              />
            </FormField>
          )}

          <FormField
            label="F/B-Ausweis angemeldet?"
            required
            hint="Wurde der Ausweis beim zuständigen Amt angemeldet?"
          >
            <JaNeinToggle
              value={data.partnerFbAusweisAngemeldet}
              onValueChange={(v) => {
                if (v === "nein") {
                  onChange({
                    ...data,
                    partnerFbAusweisAngemeldet: v,
                    partnerAnmeldungDatum: "",
                  });
                } else {
                  set("partnerFbAusweisAngemeldet", v);
                }
              }}
            />
          </FormField>

          {isFbAngemeldet && (
            <FormField
              label="Datum Anmeldung"
              required
              hint="Format: TT.MM.JJJJ"
              error={
                touched.partnerAnmeldungDatum &&
                filled(data.partnerAnmeldungDatum) &&
                !isValidDate(data.partnerAnmeldungDatum)
                  ? "Ungültiges Format (TT.MM.JJJJ)"
                  : touched.partnerAnmeldungDatum &&
                    !filled(data.partnerAnmeldungDatum)
                  ? "Pflichtfeld bei angemeldetem Ausweis"
                  : undefined
              }
            >
              <Input
                value={data.partnerAnmeldungDatum}
                onChange={(e) =>
                  set("partnerAnmeldungDatum", formatDate(e.target.value))
                }
                onBlur={() => touch("partnerAnmeldungDatum")}
                placeholder="15.03.2024"
                maxLength={10}
              />
            </FormField>
          )}
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Die AHV-Nummer des Partners wird automatisch formatiert und geprüft. Die ZEMIS-Nummer ist nur bei ausländischen Partnern mit F-, B- oder L-Ausweis relevant. Das Anmeldedatum wird bei angemeldetem Ausweis als Pflichtfeld behandelt.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 4 – KINDER & KINDERZULAGEN
   ══════════════════════════════════════════ */
function KinderForm({
  data,
  onChange,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}) {
  const [collapsedKids, setCollapsedKids] = useState<Set<string>>(new Set());
  const [touchedKids, setTouchedKids] = useState<Record<string, Record<string, boolean>>>({});

  const hasKids = data.hatUnterhaltspflichtigeKinder === "ja";

  const toggleCollapse = (id: string) =>
    setCollapsedKids((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const touchKid = (kidId: string, field: string) =>
    setTouchedKids((prev) => ({
      ...prev,
      [kidId]: { ...(prev[kidId] || {}), [field]: true },
    }));

  const isTouched = (kidId: string, field: string) =>
    touchedKids[kidId]?.[field] ?? false;

  const updateKind = (kidId: string, field: keyof KindEntry, value: string) => {
    onChange({
      ...data,
      kinder: data.kinder.map((k) =>
        k.id === kidId ? { ...k, [field]: value } : k
      ),
      anzahlKinder: String(data.kinder.length),
    });
  };

  const addKind = () => {
    const newKid = createEmptyKind();
    onChange({
      ...data,
      kinder: [...data.kinder, newKid],
      anzahlKinder: String(data.kinder.length + 1),
    });
  };

  const removeKind = (kidId: string) => {
    const next = data.kinder.filter((k) => k.id !== kidId);
    setCollapsedKids((prev) => {
      const n = new Set(prev);
      n.delete(kidId);
      return n;
    });
    onChange({
      ...data,
      kinder: next,
      anzahlKinder: String(next.length),
    });
  };

  /* ── No children state ──── */
  if (!hasKids) {
    return (
      <div className="space-y-5">
        <FormField label="Unterhaltspflichtige Kinder?" required>
          <JaNeinToggle
            value={data.hatUnterhaltspflichtigeKinder}
            onValueChange={(v) => {
              if (v === "ja") {
                const firstKid = createEmptyKind();
                onChange({
                  ...data,
                  hatUnterhaltspflichtigeKinder: v,
                  kinder: [firstKid],
                  anzahlKinder: "1",
                });
              } else {
                onChange({
                  ...data,
                  hatUnterhaltspflichtigeKinder: v,
                  kinder: [],
                  kinderzulagenUeberSpitex: "nein",
                  anzahlKinder: "0",
                });
              }
            }}
          />
        </FormField>

        <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-success-light flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
            Keine unterhaltspflichtigen Kinder
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
            Dieser Abschnitt wird automatisch als vollständig markiert. Sollte sich die Situation ändern, können Sie jederzeit «Ja» wählen und Kinder erfassen.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
          <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
          <p className="text-[12px] text-info-foreground leading-relaxed">
            Kinderzulagen werden nur bei unterhaltspflichtigen Kindern abgerechnet. Die Zulagen können über die Spitex-Organisation oder den Arbeitgeber des Partners abgerechnet werden.
          </p>
        </div>
      </div>
    );
  }

  /* ── Has children state ──── */
  const completedKids = data.kinder.filter(isKindComplete).length;
  const totalKids = data.kinder.length;

  return (
    <div className="space-y-5">
      {/* Toggle + summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <FormField label="Unterhaltspflichtige Kinder?" required>
          <JaNeinToggle
            value={data.hatUnterhaltspflichtigeKinder}
            onValueChange={(v) => {
              if (v === "nein") {
                onChange({
                  ...data,
                  hatUnterhaltspflichtigeKinder: v,
                  kinder: [],
                  kinderzulagenUeberSpitex: "nein",
                  anzahlKinder: "0",
                });
              }
            }}
          />
        </FormField>

        {/* Child count summary */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-border bg-muted/20 p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
                Erfasste Kinder
              </p>
              <p className="text-[18px] text-foreground tabular-nums" style={{ fontWeight: 600 }}>
                {totalKids}
              </p>
            </div>
            <div className={`text-[11px] px-2 py-0.5 rounded-md tabular-nums ${
              completedKids === totalKids && totalKids > 0
                ? "bg-success-light text-success-foreground"
                : "bg-warning-light text-warning-foreground"
            }`} style={{ fontWeight: 600 }}>
              {completedKids}/{totalKids} vollständig
            </div>
          </div>
        </div>
      </div>

      {/* ── Child cards ──── */}
      <div className="space-y-3">
        {data.kinder.map((kind, idx) => {
          const isCollapsed = collapsedKids.has(kind.id);
          const prog = kindProgress(kind);
          const complete = isKindComplete(kind);
          const progressPct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

          return (
            <div
              key={kind.id}
              className={`rounded-xl border transition-all ${
                complete
                  ? "border-success/30 bg-success-light/10"
                  : prog.done > 0
                  ? "border-warning/30 bg-warning-light/10"
                  : "border-border bg-card"
              }`}
            >
              {/* Card header */}
              <button
                type="button"
                onClick={() => toggleCollapse(kind.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                {/* Status icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    complete
                      ? "bg-success text-white"
                      : prog.done > 0
                      ? "bg-warning text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {complete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-[12px]" style={{ fontWeight: 600 }}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                    {filled(kind.vorname) || filled(kind.name)
                      ? `${kind.vorname} ${kind.name}`.trim()
                      : `Kind ${idx + 1}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {kind.zulagenart === "W" ? "Weiterbildungszulage" : "Kinderzulage"}
                    {filled(kind.geburtsdatum) && ` · ${kind.geburtsdatum}`}
                  </p>
                </div>

                {/* Progress bar mini */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        complete ? "bg-success" : prog.done > 0 ? "bg-warning" : "bg-border"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] tabular-nums shrink-0 ${
                      complete ? "text-success" : "text-muted-foreground"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {prog.done}/{prog.total}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </div>
              </button>

              {/* Card body */}
              {!isCollapsed && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-border-light pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                      <FormField
                        label="Name"
                        required
                        error={
                          isTouched(kind.id, "name") && !filled(kind.name)
                            ? "Pflichtfeld"
                            : undefined
                        }
                      >
                        <Input
                          value={kind.name}
                          onChange={(e) => updateKind(kind.id, "name", e.target.value)}
                          onBlur={() => touchKid(kind.id, "name")}
                          placeholder="Nachname"
                        />
                      </FormField>

                      <FormField
                        label="Vorname"
                        required
                        error={
                          isTouched(kind.id, "vorname") && !filled(kind.vorname)
                            ? "Pflichtfeld"
                            : undefined
                        }
                      >
                        <Input
                          value={kind.vorname}
                          onChange={(e) => updateKind(kind.id, "vorname", e.target.value)}
                          onBlur={() => touchKid(kind.id, "vorname")}
                          placeholder="Vorname"
                        />
                      </FormField>

                      <FormField
                        label="Geburtsdatum"
                        required
                        hint="Format: TT.MM.JJJJ"
                        error={
                          isTouched(kind.id, "geburtsdatum") &&
                          filled(kind.geburtsdatum) &&
                          !isValidDate(kind.geburtsdatum)
                            ? "Ungültiges Format (TT.MM.JJJJ)"
                            : isTouched(kind.id, "geburtsdatum") && !filled(kind.geburtsdatum)
                            ? "Pflichtfeld"
                            : undefined
                        }
                      >
                        <Input
                          value={kind.geburtsdatum}
                          onChange={(e) =>
                            updateKind(kind.id, "geburtsdatum", formatDate(e.target.value))
                          }
                          onBlur={() => touchKid(kind.id, "geburtsdatum")}
                          placeholder="01.06.2015"
                          maxLength={10}
                        />
                      </FormField>

                      <FormField
                        label="AHV-Nummer"
                        required
                        hint="Format: 756.XXXX.XXXX.XX"
                        error={
                          isTouched(kind.id, "ahvNummer") &&
                          filled(kind.ahvNummer) &&
                          !isValidAHV(kind.ahvNummer)
                            ? "Ungültige AHV-Nummer"
                            : isTouched(kind.id, "ahvNummer") && !filled(kind.ahvNummer)
                            ? "Pflichtfeld"
                            : undefined
                        }
                      >
                        <Input
                          value={kind.ahvNummer}
                          onChange={(e) =>
                            updateKind(kind.id, "ahvNummer", formatAHV(e.target.value))
                          }
                          onBlur={() => touchKid(kind.id, "ahvNummer")}
                          placeholder="756.1234.5678.97"
                          maxLength={16}
                        />
                      </FormField>

                      <FormField
                        label="Geschlecht"
                        required
                        error={
                          isTouched(kind.id, "geschlecht") && !filled(kind.geschlecht)
                            ? "Pflichtfeld"
                            : undefined
                        }
                      >
                        <Select
                          value={kind.geschlecht}
                          onValueChange={(v) => {
                            updateKind(kind.id, "geschlecht", v);
                            touchKid(kind.id, "geschlecht");
                          }}
                        >
                          <SelectTrigger
                            className={!filled(kind.geschlecht) ? "text-muted-foreground" : ""}
                          >
                            <SelectValue placeholder="Geschlecht wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maennlich">Männlich</SelectItem>
                            <SelectItem value="weiblich">Weiblich</SelectItem>
                            <SelectItem value="divers">Divers</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        label="Zulagenart"
                        required
                        hint="K = Kinderzulage (bis 16), W = Weiterbildungszulage (16–25)"
                      >
                        <Select
                          value={kind.zulagenart}
                          onValueChange={(v) => {
                            if (v === "K") {
                              // Clear education fields when switching to K
                              onChange({
                                ...data,
                                kinder: data.kinder.map((k) =>
                                  k.id === kind.id
                                    ? { ...k, zulagenart: v, ausbildungsstatus: "", ausbildungsbeginn: "" }
                                    : k
                                ),
                              });
                            } else {
                              updateKind(kind.id, "zulagenart", v);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="K">K – Kinderzulage</SelectItem>
                            <SelectItem value="W">W – Weiterbildungszulage</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      {/* Conditional education fields for W (Weiterbildungszulage) */}
                      {kind.zulagenart === "W" && (
                        <>
                          <FormField
                            label="Ausbildungsstatus"
                            required
                            error={
                              isTouched(kind.id, "ausbildungsstatus") &&
                              !filled(kind.ausbildungsstatus)
                                ? "Pflichtfeld bei Weiterbildungszulage"
                                : undefined
                            }
                          >
                            <Select
                              value={kind.ausbildungsstatus}
                              onValueChange={(v) => {
                                updateKind(kind.id, "ausbildungsstatus", v);
                                touchKid(kind.id, "ausbildungsstatus");
                              }}
                            >
                              <SelectTrigger
                                className={
                                  !filled(kind.ausbildungsstatus) ? "text-muted-foreground" : ""
                                }
                              >
                                <SelectValue placeholder="Status wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gymnasium">Gymnasium / Kantonsschule</SelectItem>
                                <SelectItem value="lehre">Berufslehre (EFZ/EBA)</SelectItem>
                                <SelectItem value="fachhochschule">Fachhochschule</SelectItem>
                                <SelectItem value="universitaet">Universität / ETH</SelectItem>
                                <SelectItem value="andere">Andere Ausbildung</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>

                          <FormField
                            label="Ausbildungsbeginn"
                            required
                            hint="Format: TT.MM.JJJJ"
                            error={
                              isTouched(kind.id, "ausbildungsbeginn") &&
                              filled(kind.ausbildungsbeginn) &&
                              !isValidDate(kind.ausbildungsbeginn)
                                ? "Ungültiges Format (TT.MM.JJJJ)"
                                : isTouched(kind.id, "ausbildungsbeginn") &&
                                  !filled(kind.ausbildungsbeginn)
                                ? "Pflichtfeld bei Weiterbildungszulage"
                                : undefined
                            }
                          >
                            <Input
                              value={kind.ausbildungsbeginn}
                              onChange={(e) =>
                                updateKind(
                                  kind.id,
                                  "ausbildungsbeginn",
                                  formatDate(e.target.value)
                                )
                              }
                              onBlur={() => touchKid(kind.id, "ausbildungsbeginn")}
                              placeholder="01.08.2024"
                              maxLength={10}
                            />
                          </FormField>
                        </>
                      )}
                    </div>

                    {/* Remove button */}
                    {data.kinder.length > 1 && (
                      <div className="mt-4 pt-3 border-t border-border-light">
                        <button
                          type="button"
                          onClick={() => removeKind(kind.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-error hover:bg-error/5 border border-transparent hover:border-error/15 transition-all"
                          style={{ fontWeight: 500 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Kind {idx + 1} entfernen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add child button */}
      <button
        type="button"
        onClick={addKind}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/25 text-primary hover:bg-primary-light/30 hover:border-primary/40 transition-all"
        style={{ fontWeight: 500 }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-[13px]">Weiteres Kind hinzufügen</span>
      </button>

      {/* Zulagen über Spitex abrechnen */}
      <div className="border-t border-border-light pt-5">
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          Zulagen-Abrechnung
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <FormField
            label="Kinderzulagen über Spitex abrechnen?"
            required
            hint="Wenn Nein, werden die Zulagen über den Arbeitgeber des Partners abgerechnet"
          >
            <JaNeinToggle
              value={data.kinderzulagenUeberSpitex}
              onValueChange={(v) =>
                onChange({ ...data, kinderzulagenUeberSpitex: v })
              }
            />
          </FormField>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Kinderzulagen (K) gelten bis zum 16. Lebensjahr. Ab 16 Jahren kann eine Weiterbildungszulage (W) beantragt werden, sofern sich das Kind in Ausbildung befindet (max. 25 Jahre). Die Abrechnung erfolgt über die kantonale Familienausgleichskasse.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 5 – ANSTELLUNG & AUSZAHLUNG
   ══════════════════════════════════════════ */
function AnstellungForm({
  data,
  onChange,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const set = (field: keyof AngehoerigerFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  /* Completion summary for visual feedback */
  const checks: { key: string; label: string; ok: boolean }[] = [
    { key: "funktion", label: "Funktion", ok: filled(data.funktion) },
    { key: "eintrittsdatum", label: "Eintrittsdatum", ok: isValidDate(data.eintrittsdatum) },
    { key: "stundenlohn", label: "Stundenlohn", ok: isValidStundenlohn(data.stundenlohn) },
    { key: "bankname", label: "Bankname", ok: filled(data.bankname) },
    { key: "iban", label: "IBAN", ok: isValidIBAN(data.iban) },
  ];
  const doneCount = checks.filter((c) => c.ok).length;
  const missingCritical = checks.filter((c) => !c.ok);

  return (
    <div className="space-y-6">
      {/* Missing critical fields callout — only shown when partially filled */}
      {doneCount > 0 && missingCritical.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-light/40 border border-warning/15">
          <div className="w-9 h-9 rounded-lg bg-warning-light flex items-center justify-center shrink-0 mt-0.5">
            <BadgeAlert className="w-[18px] h-[18px] text-warning" />
          </div>
          <div>
            <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
              {missingCritical.length} lohnrelevante{missingCritical.length === 1 ? "s Feld fehlt" : " Felder fehlen"}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              Fehlend: {missingCritical.map((c) => c.label).join(", ")}. Diese Angaben werden für die Lohnabrechnung zwingend benötigt.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Anstellung */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Anstellung
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <PayrollField
            label="Funktion / Rolle"
            required
            critical
            error={
              touched.funktion && !filled(data.funktion)
                ? "Pflichtfeld – wird für die Lohnabrechnung benötigt"
                : undefined
            }
            hint="Haupttätigkeit im Spitex-Betrieb"
          >
            <Select
              value={data.funktion}
              onValueChange={(v) => {
                set("funktion", v);
                touch("funktion");
              }}
            >
              <SelectTrigger
                className={!filled(data.funktion) ? "text-muted-foreground" : ""}
              >
                <SelectValue placeholder="Funktion wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pflegefachperson_hf">Pflegefachperson HF</SelectItem>
                <SelectItem value="pflegefachperson_fh">Pflegefachperson FH (BSc)</SelectItem>
                <SelectItem value="fage">Fachperson Gesundheit (FaGe)</SelectItem>
                <SelectItem value="age">Assistent/in Gesundheit (AGS)</SelectItem>
                <SelectItem value="pflegehilfe">Pflegehelfer/in SRK</SelectItem>
                <SelectItem value="hauswirtschaft">Hauswirtschaft</SelectItem>
                <SelectItem value="sozialbetreuung">Sozialbetreuung</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="teamleitung">Teamleitung</SelectItem>
                <SelectItem value="andere">Andere Funktion</SelectItem>
              </SelectContent>
            </Select>
          </PayrollField>

          <PayrollField
            label="Eintrittsdatum"
            required
            critical
            hint="Format: TT.MM.JJJJ"
            error={
              touched.eintrittsdatum &&
              filled(data.eintrittsdatum) &&
              !isValidDate(data.eintrittsdatum)
                ? "Ungültiges Format (TT.MM.JJJJ)"
                : touched.eintrittsdatum && !filled(data.eintrittsdatum)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <div className="relative">
              <Input
                value={data.eintrittsdatum}
                onChange={(e) =>
                  set("eintrittsdatum", formatDate(e.target.value))
                }
                onBlur={() => touch("eintrittsdatum")}
                placeholder="01.03.2026"
                maxLength={10}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </PayrollField>

          <PayrollField
            label="Stundenlohn (CHF)"
            required
            critical
            hint="Brutto-Stundenlohn in Schweizer Franken"
            error={
              touched.stundenlohn && filled(data.stundenlohn) && !isValidStundenlohn(data.stundenlohn)
                ? "Ungültiger Betrag"
                : touched.stundenlohn && !filled(data.stundenlohn)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <div className="relative">
              <Input
                value={data.stundenlohn}
                onChange={(e) => {
                  // Allow digits and one decimal point
                  const v = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                  set("stundenlohn", v);
                }}
                onBlur={() => touch("stundenlohn")}
                placeholder="z.B. 32.50"
                className="pr-12"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>CHF</span>
              </div>
            </div>
          </PayrollField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* Section 2: Auszahlung / Bankdaten */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-primary" />
          Auszahlung / Bankdaten
        </h5>

        {/* Bank warning callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning-light/30 border border-warning/10 mb-4">
          <CreditCard className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-[12px] text-warning-foreground leading-relaxed">
            Die Bankdaten werden direkt für die monatliche Lohnzahlung verwendet. Bitte prüfen Sie die IBAN sorgfältig — fehlerhafte Angaben führen zu Rückweisungen und Verzögerungen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <PayrollField
            label="Bankname / Institut"
            required
            critical
            error={
              touched.bankname && !filled(data.bankname)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <div className="relative">
              <Input
                value={data.bankname}
                onChange={(e) => set("bankname", e.target.value)}
                onBlur={() => touch("bankname")}
                placeholder="z.B. UBS, PostFinance, Raiffeisen"
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </PayrollField>

          <PayrollField
            label="IBAN"
            required
            critical
            hint="Schweizer IBAN: CHxx xxxx xxxx xxxx xxxx x (21 Zeichen)"
            error={
              touched.iban && filled(data.iban) && !isValidIBAN(data.iban)
                ? "Ungültige IBAN – muss mit CH beginnen und 21 Zeichen haben"
                : touched.iban && !filled(data.iban)
                ? "Pflichtfeld"
                : undefined
            }
          >
            <div className="relative">
              <Input
                value={data.iban}
                onChange={(e) => set("iban", formatIBAN(e.target.value))}
                onBlur={() => touch("iban")}
                placeholder="CH93 0076 2011 6238 5295 7"
                maxLength={26}
                className="pr-10 font-mono tracking-wide"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </PayrollField>
        </div>
      </div>

      <div className="border-t border-border-light" />

      {/* Completion summary */}
      <div>
        <h5 className="text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Vollständigkeit
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {checks.map((c) => (
            <div
              key={c.key}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                c.ok
                  ? "border-success/20 bg-success-light/30"
                  : "border-border bg-muted/15"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  c.ok ? "bg-success text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {c.ok ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span
                className={`text-[12px] truncate ${
                  c.ok ? "text-success-foreground" : "text-muted-foreground"
                }`}
                style={{ fontWeight: 500 }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Alle Felder in diesem Abschnitt sind lohnrelevant und werden direkt in die Lohnbuchhaltung übernommen. Die Anstellung erfolgt grundsätzlich auf Stundenlohnbasis. Die IBAN wird automatisch formatiert und auf das Schweizer Format (CH + 19 Ziffern) geprüft. Änderungen an den Bankdaten erfordern nach dem Onboarding eine separate Bestätigung.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 6 – ERFORDERLICHE DOKUMENTE
   ══════════════════════════════════════════ */

interface ScanItemDef {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  mandatory: boolean;
  condition?: (d: AngehoerigerFormData) => boolean;
}

const SCAN_ITEMS: ScanItemDef[] = [
  {
    key: "id_scan",
    label: "ID oder Pass Angehöriger",
    description: "Gültiger Reisepass oder Identitätskarte (Vorder- und Rückseite)",
    icon: Shield,
    mandatory: true,
  },
  {
    key: "spezialbewilligung_b",
    label: "Einreichungs-Bestätigung Spezialbewilligung B",
    description: "Bestätigung vom Migrationsamt, dass die Erwerbstätigkeits-Bewilligung beantragt wurde. Gibt die Vertragsphase frei.",
    icon: ShieldAlert,
    mandatory: true,
    condition: (d) => d.aufenthaltsstatus === "B",
  },
  {
    key: "krankenkassenkarte",
    label: "Krankenkassenkarte Angehöriger",
    description: "Versichertenkarte mit Kartennummer und Versicherungsnummer",
    icon: CreditCard,
    mandatory: true,
  },
  {
    key: "bankkarte",
    label: "Bankkarte",
    description: "Debit-/Kreditkarte mit IBAN-Zuordnung oder Bankbestätigung",
    icon: Landmark,
    mandatory: true,
  },
  {
    key: "partner_krankenkassenkarte",
    label: "Krankenkassenkarte Partner/in",
    description: "Versichertenkarte des Partners / der Partnerin",
    icon: HeartHandshake,
    mandatory: true,
    condition: (d) =>
      d.zivilstand === "verheiratet" ||
      d.zivilstand === "eingetragene_partnerschaft" ||
      d.quellensteuer === "ja",
  },
  {
    key: "kinder_krankenkassenkarte",
    label: "Krankenkassenkarte Kinder",
    description: "Versichertenkarten aller unterhaltspflichtigen Kinder",
    icon: Baby,
    mandatory: true,
    condition: (d) => d.hatUnterhaltspflichtigeKinder === "ja",
  },
  {
    key: "familienbuchlein",
    label: "Familienbüchlein",
    description: "Vollständige Kopie mit allen eingetragenen Kindern",
    icon: FileText,
    mandatory: true,
    condition: (d) =>
      d.kinderzulagenUeberSpitex === "ja" ||
      d.kinderzulagenBeantragt === "ja",
  },
];

function getRequiredScanKeys(data: AngehoerigerFormData): string[] {
  return SCAN_ITEMS.filter(
    (item) => item.mandatory && (!item.condition || item.condition(data))
  ).map((item) => item.key);
}

function getVisibleScanItems(data: AngehoerigerFormData): ScanItemDef[] {
  return SCAN_ITEMS.filter(
    (item) => !item.condition || item.condition(data)
  );
}

/* ── Camera Modal ───────────────────────── */
function CameraModal({
  open,
  docLabel,
  onCapture,
  onClose,
}: {
  open: boolean;
  docLabel: string;
  onCapture: (file: ScanFile) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<
    "viewfinder" | "capturing" | "preview" | "uploading" | "done"
  >("viewfinder");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Simulate camera flash + capture
    timerRef.current = setTimeout(() => {
      // Generate a placeholder "captured" preview
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 280;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Document-like gradient
        const grad = ctx.createLinearGradient(0, 0, 400, 280);
        grad.addColorStop(0, "#f0f4ff");
        grad.addColorStop(0.5, "#e8eeff");
        grad.addColorStop(1, "#f5f7ff");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 280);
        // Simulated document edges
        ctx.strokeStyle = "#c7d2fe";
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 20, 340, 240);
        // Text lines
        ctx.fillStyle = "#94a3b8";
        for (let i = 0; i < 6; i++) {
          const w = 120 + Math.random() * 180;
          ctx.fillRect(55, 50 + i * 32, w, 8);
        }
        // Photo placeholder
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(280, 45, 65, 80);
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
    // Simulate upload to SharePoint
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
                Dokument scannen
              </p>
              <p className="text-[11px] text-muted-foreground">{docLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black/95 aspect-[4/3] flex items-center justify-center overflow-hidden">
          {phase === "viewfinder" && (
            <>
              {/* Simulated camera viewfinder */}
              <div className="absolute inset-6 border-2 border-white/20 rounded-xl">
                {/* Corner marks */}
                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-md" />
                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-md" />
                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-md" />
                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-md" />
              </div>
              {/* Scan line animation */}
              <div className="absolute inset-x-8 top-8 bottom-8">
                <div
                  className="h-0.5 bg-primary/60 rounded-full"
                  style={{
                    animation: "scanline 2.5s ease-in-out infinite",
                  }}
                />
                <style>{`
                  @keyframes scanline {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(calc(100% - 2px)); }
                  }
                `}</style>
              </div>
              {/* Center icon */}
              <div className="flex flex-col items-center gap-2 z-10">
                <ScanLine className="w-10 h-10 text-white/40" />
                <p className="text-[12px] text-white/50" style={{ fontWeight: 500 }}>
                  Dokument im Rahmen positionieren
                </p>
              </div>
            </>
          )}

          {phase === "capturing" && (
            <div className="absolute inset-0 bg-white animate-pulse flex items-center justify-center">
              <Camera className="w-12 h-12 text-primary/30" />
            </div>
          )}

          {(phase === "preview" || phase === "uploading" || phase === "done") &&
            capturedImage && (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
                {phase === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <CloudUpload className="w-6 h-6 text-white animate-bounce" />
                    </div>
                    <p className="text-white text-[13px]" style={{ fontWeight: 500 }}>
                      Wird in SharePoint hochgeladen…
                    </p>
                    <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          animation: "uploadbar 1.5s ease-out forwards",
                        }}
                      />
                      <style>{`
                        @keyframes uploadbar {
                          0% { width: 0%; }
                          60% { width: 75%; }
                          100% { width: 100%; }
                        }
                      `}</style>
                    </div>
                  </div>
                )}
                {phase === "done" && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center">
                      <Check className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-[14px]" style={{ fontWeight: 600 }}>
                        Erfolgreich gespeichert
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <FolderSync className="w-3.5 h-3.5 text-white/70" />
                        <p className="text-white/70 text-[12px]">
                          Dokument im SharePoint gespeichert.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t border-border-light">
          {phase === "viewfinder" && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors"
                style={{ fontWeight: 500 }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleCapture}
                className="flex-[2] h-10 rounded-xl bg-primary text-primary-foreground text-[13px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Camera className="w-4 h-4" />
                Aufnahme
              </button>
            </div>
          )}

          {phase === "preview" && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 h-10 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                style={{ fontWeight: 500 }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Wiederholen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-[2] h-10 rounded-xl bg-success text-white text-[13px] flex items-center justify-center gap-2 hover:bg-success/90 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Upload className="w-4 h-4" />
                Hochladen & Speichern
              </button>
            </div>
          )}

          {(phase === "capturing" || phase === "uploading" || phase === "done") && (
            <div className="flex items-center justify-center h-10">
              {phase !== "done" ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px]">
                    {phase === "capturing" ? "Wird aufgenommen…" : "Wird hochgeladen…"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[13px]" style={{ fontWeight: 500 }}>
                    Dokument im SharePoint gespeichert.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── File upload via native picker ──────── */
function useFileUpload(
  scanKey: string,
  docLabel: string,
  data: AngehoerigerFormData,
  onChange: (d: AngehoerigerFormData) => void
) {
  const inputRef = useRef<HTMLInputElement>(null);

  const trigger = () => inputRef.current?.click();

  const handleFile = (file: File) => {
    const now = new Date();
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;
    const scanFile: ScanFile = {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
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
      accept="image/*,.pdf"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = "";
      }}
    />
  );

  return { trigger, InputEl };
}

/* ── DokumenteForm ──────────────────────── */
function DokumenteForm({
  data,
  onChange,
  onOpenSpezialbewilligung,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  onOpenSpezialbewilligung?: () => void;
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraDocKey, setCameraDocKey] = useState("");
  const [cameraDocLabel, setCameraDocLabel] = useState("");
  const [sharePointToasts, setSharePointToasts] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);

  // Sync: if dialog already uploaded the document, reflect it in scans
  const syncedData = { ...data };
  if (data.aufenthaltsstatus === "B" && data.spezialbewilligungStatus === "eingereicht" && data.spezialbewilligungDokument && !data.scans.spezialbewilligung_b) {
    syncedData.scans = {
      ...data.scans,
      spezialbewilligung_b: {
        name: data.spezialbewilligungDokument.name,
        type: "application/pdf",
        size: data.spezialbewilligungDokument.size,
        timestamp: formatDateDisplay(data.spezialbewilligungEinreichungsDatum),
        previewUrl: null,
      },
    };
  }

  const handleChange = (updated: AngehoerigerFormData) => {
    const oldScan = data.scans.spezialbewilligung_b;
    const newScan = updated.scans.spezialbewilligung_b;

    if (!oldScan && newScan) {
      const today = "2026-03-03";
      const todayDisplay = formatDateDisplay(today);
      const ext = newScan.name.split(".").pop() || "pdf";
      const structuredName = `Einreichungs-Bestätigung Spezialbewilligung B – ${todayDisplay}.${ext}`;
      onChange({
        ...updated,
        spezialbewilligungStatus: "eingereicht",
        spezialbewilligungDokument: { name: structuredName, size: newScan.size },
        spezialbewilligungEinreichungsDatum: today,
        scans: { ...updated.scans, spezialbewilligung_b: { ...newScan, name: structuredName } },
      });
      return;
    }

    if (oldScan && !newScan) {
      onChange({
        ...updated,
        spezialbewilligungStatus: "ausstehend",
        spezialbewilligungDokument: null,
        spezialbewilligungEinreichungsDatum: "",
      });
      return;
    }

    onChange(updated);
  };

  const visibleItems = getVisibleScanItems(syncedData);
  const requiredKeys = getRequiredScanKeys(syncedData);
  const uploadedRequired = requiredKeys.filter((k) => !!syncedData.scans[k]).length;
  const totalRequired = requiredKeys.length;
  const allComplete = uploadedRequired === totalRequired && totalRequired > 0;

  const openCamera = (key: string, label: string) => {
    setCameraDocKey(key);
    setCameraDocLabel(label);
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: ScanFile) => {
    handleChange({
      ...syncedData,
      scans: { ...syncedData.scans, [cameraDocKey]: file },
    });
    setCameraOpen(false);
    // Show SharePoint toast
    setSharePointToasts((prev) => new Set(prev).add(cameraDocKey));
    setTimeout(() => {
      setSharePointToasts((prev) => {
        const next = new Set(prev);
        next.delete(cameraDocKey);
        return next;
      });
    }, 4000);
  };

  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);

  const removeScan = (key: string) => {
    if (key === "spezialbewilligung_b") {
      setConfirmRemoveKey(key);
      return;
    }
    handleChange({
      ...syncedData,
      scans: { ...syncedData.scans, [key]: null },
    });
  };

  const confirmRemove = () => {
    if (confirmRemoveKey) {
      handleChange({
        ...syncedData,
        scans: { ...syncedData.scans, [confirmRemoveKey]: null },
      });
      setConfirmRemoveKey(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border">
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
        {/* Progress ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/30"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
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
            {totalRequired > 0
              ? `${Math.round((uploadedRequired / totalRequired) * 100)}%`
              : "–"}
          </span>
        </div>
      </div>

      {/* Scan items list */}
      <div className="space-y-2.5">
        {visibleItems.map((item) => {
          const scan = syncedData.scans[item.key] ?? null;
          const isUploaded = !!scan;
          const isRequired = requiredKeys.includes(item.key);
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
                  {isUploaded ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
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
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
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
                      {isUploaded && item.key === "spezialbewilligung_b" && data.spezialbewilligungEinreichungsDatum ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Eingereicht am {formatDateDisplay(data.spezialbewilligungEinreichungsDatum)}
                        </>
                      ) : isUploaded ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Hochgeladen
                        </>
                      ) : isRequired ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Fehlend
                        </>
                      ) : (
                        <>
                          <Circle className="w-3 h-3" />
                          Nicht vorhanden
                        </>
                      )}
                    </span>
                  </div>

                  {/* Uploaded file details */}
                  {isUploaded && scan && (
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
                              onClick={() =>
                                setPreviewOpen(
                                  previewOpen === item.key ? null : item.key
                                )
                              }
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
                          <img
                            src={scan.previewUrl}
                            alt={item.label}
                            className="w-full max-h-40 object-contain bg-white"
                          />
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
                      <ScanUploadButton
                        scanKey={item.key}
                        docLabel={item.label}
                        data={syncedData}
                        onChange={handleChange}
                        onCameraOpen={() => openCamera(item.key, item.label)}
                      />
                      {item.key === "spezialbewilligung_b" && onOpenSpezialbewilligung && (
                        <button
                          type="button"
                          onClick={onOpenSpezialbewilligung}
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                          style={{ fontWeight: 500 }}
                        >
                          <Info className="w-3 h-3" />
                          Mehr zum Bewilligungs-Prozess →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
              {visibleItems
                .filter(
                  (item) =>
                    requiredKeys.includes(item.key) && !data.scans[item.key]
                )
                .map((item) => item.label)
                .join(", ")}
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
                Alle Dokumente wurden im SharePoint gespeichert und sind für die Personaladministration zugänglich.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Dokumente werden als PDF konvertiert und automatisch im SharePoint der Organisation abgelegt. Auf dem Tablet können Sie die Kamerafunktion nutzen, um Dokumente direkt abzufotografieren. Alternativ laden Sie bestehende Dateien über «Datei wählen» hoch. Die Pflichtdokumente variieren je nach Zivilstand, Kinderstatus und Zulagen-Einstellungen.
        </p>
      </div>

      {/* Camera modal */}
      <CameraModal
        open={cameraOpen}
        docLabel={cameraDocLabel}
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
      />

      {/* Spezialbewilligung remove confirmation */}
      {confirmRemoveKey === "spezialbewilligung_b" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]" onClick={() => setConfirmRemoveKey(null)} />
          <div className="relative bg-card rounded-xl border border-border shadow-xl p-5 max-w-[360px]">
            <h5 className="text-foreground">Einreichung entfernen?</h5>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              Die Einreichungs-Bestätigung wird entfernt und der Status auf "ausstehend" zurückgesetzt.
              Die Vertragsphase wird erneut blockiert.
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmRemoveKey(null)}
                className="px-3 py-[6px] rounded-xl text-[12px] text-foreground hover:bg-secondary transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmRemove}
                className="px-3 py-[6px] rounded-xl text-[12px] bg-error text-white hover:bg-error/90 transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Scan Upload Button pair ──────────── */
function ScanUploadButton({
  scanKey,
  docLabel,
  data,
  onChange,
  onCameraOpen,
}: {
  scanKey: string;
  docLabel: string;
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  onCameraOpen: () => void;
}) {
  const { trigger, InputEl } = useFileUpload(scanKey, docLabel, data, onChange);

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

/* ══════════════════════════════════════════
   SUB-STEP CONTENT ROUTER
   ══════════════════════════════════════════ */
function SubStepContent({
  stepKey,
  stepLabel,
  stepDescription,
  stepIcon: Icon,
  status,
  data,
  onChange,
}: {
  stepKey: string;
  stepLabel: string;
  stepDescription: string;
  stepIcon: React.ElementType;
  status: "empty" | "partial" | "complete";
  data: AngehoerigerFormData;
  onChange: (data: AngehoerigerFormData) => void;
}) {
  const fieldHints: Record<string, { fields: string[]; info?: string }> = {
    partner: {
      fields: [
        "Zivilstand *",
        "Partner Name",
        "Partner berufstätig?",
        "Partner AHV-Nummer",
        "Partner Einkommen (optional)",
      ],
      info: "Partnerangaben sind relevant für die Berechnung der Quellensteuer-Tarifklasse und Kinderzulagen.",
    },
    kinder: {
      fields: [
        "Anzahl Kinder *",
        "Kinderzulagen beantragt?",
        "Familienausgleichskasse",
        "Pro Kind: Name, Geburtsdatum, In Ausbildung?",
      ],
      info: "Kinderzulagen werden über die kantonale Familienausgleichskasse abgerechnet. Pro Kind werden separate Angaben erfasst.",
    },
    anstellung: {
      fields: [
        "Funktion / Rolle *",
        "Eintrittsdatum *",
        "Stundenlohn (CHF) *",
        "Bankname *",
        "IBAN (Schweizer Format) *",
      ],
      info: "IBAN wird automatisch validiert. Die Bankdaten werden für die monatliche Lohnauszahlung verwendet.",
    },
    dokumente: {
      fields: [
        "Ausweis / ID (Scan) *",
        "Krankenkassenkarte (Scan) *",
        "Bankkarte (Scan) *",
        "Familienbüchlein (optional)",
        "Sozialamt-Bestätigung (falls relevant)",
        "Lohnabtretungserklärung (falls relevant)",
      ],
      info: "Pflicht-Scans werden als PDF konvertiert und automatisch in SharePoint abgelegt.",
    },
  };

  const hint = fieldHints[stepKey] || { fields: [] };
  const isRealForm = stepKey === "personalien" || stepKey === "steuer" || stepKey === "partner" || stepKey === "kinder" || stepKey === "anstellung" || stepKey === "dokumente";

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* ── Sub-step header ────────────────── */}
      <div className="px-5 py-4 lg:px-6 lg:py-5 border-b border-border-light">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                status === "complete"
                  ? "bg-success-light"
                  : status === "partial"
                  ? "bg-warning-light"
                  : "bg-primary-light"
              }`}
            >
              {status === "complete" ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Icon
                  className={`w-5 h-5 ${
                    status === "partial" ? "text-warning" : "text-primary"
                  }`}
                />
              )}
            </div>
            <div>
              <h4 className="text-foreground">{stepLabel}</h4>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {stepDescription}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] shrink-0 ${
              status === "complete"
                ? "bg-success-light text-success-foreground"
                : status === "partial"
                ? "bg-warning-light text-warning-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            style={{ fontWeight: 500 }}
          >
            {status === "complete" ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Vollständig
              </>
            ) : status === "partial" ? (
              <>
                <AlertCircle className="w-3 h-3" />
                Unvollständig
              </>
            ) : (
              <>
                <Circle className="w-3 h-3" />
                Ausstehend
              </>
            )}
          </span>
        </div>
      </div>

      {/* ── Content area ───────────────────── */}
      <div className="px-5 py-5 lg:px-6 lg:py-6">
        {stepKey === "personalien" && (
          <PersonalienForm data={data} onChange={onChange} onOpenSpezialbewilligung={onOpenSpezialbewilligung} />
        )}
        {stepKey === "steuer" && (
          <SteuerForm data={data} onChange={onChange} />
        )}
        {stepKey === "partner" && (
          <PartnerForm data={data} onChange={onChange} />
        )}
        {stepKey === "kinder" && (
          <KinderForm data={data} onChange={onChange} />
        )}
        {stepKey === "anstellung" && (
          <AnstellungForm data={data} onChange={onChange} />
        )}
        {stepKey === "dokumente" && (
          <DokumenteForm data={data} onChange={onChange} onOpenSpezialbewilligung={onOpenSpezialbewilligung} />
        )}
        {!isRealForm && hint.fields.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hint.fields.map((fieldLabel, i) => {
                const isRequired = fieldLabel.endsWith("*");
                const cleanLabel = fieldLabel.replace(/ \*$/, "");
                return (
                  <div key={i} className="group">
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 transition-all hover:border-primary/20 hover:bg-primary-light/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-foreground flex items-center gap-1" style={{ fontWeight: 500 }}>
                          {cleanLabel}
                          {isRequired && <span className="text-error">*</span>}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${status === "complete" ? "bg-success" : status === "partial" && i < 2 ? "bg-success" : "bg-border"}`} />
                      </div>
                      <div className="h-9 rounded-lg bg-muted/60 border border-border-light flex items-center px-3">
                        <div className={`h-2 rounded-full ${status === "complete" ? "bg-success/20 w-3/4" : status === "partial" && i < 2 ? "bg-primary/15 w-2/3" : "bg-border-light w-1/2"}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hint.info && (
              <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-info-light/50 border border-info/10">
                <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
                <p className="text-[12px] text-info-foreground leading-relaxed">{hint.info}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Completion guidance (skeleton steps only) ── */}
      {!isRealForm && (
        <div className="px-5 pb-4 lg:px-6 lg:pb-5">
          {status === "empty" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Daten erfassen</p>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-sm mx-auto">
                Füllen Sie die Pflichtfelder aus, um diesen Abschnitt abzuschliessen. Felder werden beim Verlassen automatisch validiert.
              </p>
            </div>
          )}
          {status === "partial" && (
            <div className="rounded-xl border border-warning/15 bg-warning-light/40 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning-light flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-[12px] text-warning-foreground" style={{ fontWeight: 500 }}>Noch nicht alle Pflichtfelder ausgefüllt</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Bitte ergänzen Sie die fehlenden Angaben, um fortzufahren.</p>
              </div>
            </div>
          )}
          {status === "complete" && (
            <div className="rounded-xl border border-success/15 bg-success-light/40 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-[12px] text-success-foreground" style={{ fontWeight: 500 }}>Alle Pflichtfelder vollständig</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sie können zum nächsten Abschnitt weitergehen oder die Angaben jederzeit korrigieren.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}