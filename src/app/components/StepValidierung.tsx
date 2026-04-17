import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Users,
  HeartPulse,
  Camera,
  Loader2,
  CircleDot,
  XCircle,
  ArrowRight,
  Lock,
  ReceiptText,
  ListChecks,
  FileCheck2,
  Info,
  Ban,
} from "lucide-react";
import type { AngehoerigerFormData } from "./StepAngehoeriger";
import type { PatientFormData } from "./StepPatient";
import type { DokumenteFormData } from "./StepDokumente";

/* ══════════════════════════════════════════
   VALIDATION ENGINE
   ══════════════════════════════════════════ */
interface ValidationItem {
  id: string;
  label: string;
  step: number;
  stepLabel: string;
  category: "field" | "scan" | "document";
  status: "ok" | "missing" | "warning";
  detail?: string;
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

function isValidPhone(v: string | undefined | null): boolean {
  if (!v) return false;
  const clean = v.replace(/[\s\-+()]/g, "");
  return clean.length >= 9 && /^\d+$/.test(clean);
}

function runValidation(
  ang: AngehoerigerFormData,
  pat: PatientFormData,
  dok: DokumenteFormData
): ValidationItem[] {
  const items: ValidationItem[] = [];

  /* ── Step 1: Angehöriger ─────────────── */
  const s1 = (id: string, label: string, ok: boolean, detail?: string) =>
    items.push({ id, label, step: 1, stepLabel: "Angehöriger (HR)", category: "field", status: ok ? "ok" : "missing", detail });

  s1("ang_name", "Nachname Angehöriger", filled(ang.name), "Pflichtfeld leer");
  s1("ang_vorname", "Vorname Angehöriger", filled(ang.vorname), "Pflichtfeld leer");
  s1("ang_geburtsdatum", "Geburtsdatum Angehöriger", isValidDate(ang.geburtsdatum), "Format TT.MM.JJJJ");
  s1("ang_ahv", "AHV-Nummer Angehöriger", isValidAHV(ang.ahvNummer), "Ungültiges Format (756.XXXX.XXXX.XX)");
  s1("ang_nationalitaet", "Nationalität Angehöriger", filled(ang.nationalitaet), "Pflichtfeld leer");
  s1("ang_geschlecht", "Geschlecht Angehöriger", filled(ang.geschlecht), "Pflichtfeld leer");
  s1("ang_zivilstandSeit", "Zivilstand seit", isValidDate(ang.zivilstandSeit), "Format TT.MM.JJJJ");
  s1("ang_strasse", "Adresse (Strasse)", filled(ang.strasse), "Pflichtfeld leer");
  s1("ang_plz", "PLZ", filled(ang.plz), "4-stellige PLZ erwartet");
  s1("ang_ort", "Ort", filled(ang.ort), "Pflichtfeld leer");
  s1("ang_email", "E-Mail", filled(ang.email), "Pflichtfeld leer");
  s1("ang_telefon", "Telefon", filled(ang.telefon), "Pflichtfeld leer");
  s1("ang_krankenkasse", "Krankenkasse Name", filled(ang.krankenkasseName), "Pflichtfeld leer");
  s1("ang_funktion", "Funktion", filled(ang.funktion), "Pflichtfeld leer");
  s1("ang_eintrittsdatum", "Eintrittsdatum", isValidDate(ang.eintrittsdatum), "Format TT.MM.JJJJ");
  s1("ang_stundenlohn", "Stundenlohn (CHF)", filled(ang.stundenlohn) && parseFloat(ang.stundenlohn) > 0, "Gültiger CHF-Betrag erwartet");
  s1("ang_bankname", "Bankname", filled(ang.bankname), "Pflichtfeld leer");
  s1("ang_iban", "IBAN", isValidIBAN(ang.iban), "Ungültiges Schweizer IBAN-Format");

  // Scans
  const scanItem = (id: string, label: string, ok: boolean) =>
    items.push({ id, label, step: 1, stepLabel: "Angehöriger (HR)", category: "scan", status: ok ? "ok" : "missing", detail: "Pflicht-Scan fehlt" });

  scanItem("ang_scan_id", "Ausweis / ID (Angehöriger)", !!ang.scans.id_scan);
  scanItem("ang_scan_kk", "Krankenkassenkarte (Angehöriger)", !!ang.scans.krankenkassenkarte);
  scanItem("ang_scan_bank", "Bankkarte (Angehöriger)", !!ang.scans.bankkarte);

  /* ── Step 2: Patient ─────────────────── */
  const s2 = (id: string, label: string, ok: boolean, detail?: string) =>
    items.push({ id, label, step: 2, stepLabel: "Patient (Medizin)", category: "field", status: ok ? "ok" : "missing", detail });

  s2("pat_name", "Nachname Patient", filled(pat.name), "Pflichtfeld leer");
  s2("pat_vorname", "Vorname Patient", filled(pat.vorname), "Pflichtfeld leer");
  s2("pat_geburtsdatum", "Geburtsdatum Patient", isValidDate(pat.geburtsdatum), "Format TT.MM.JJJJ");
  s2("pat_ahv", "AHV-Nummer Patient", isValidAHV(pat.ahvNummer), "Ungültiges AHV-Format");
  s2("pat_notfallkontakt", "Notfallkontakt Name", filled(pat.notfallkontaktName), "Pflichtfeld leer");
  s2("pat_notfalltelefon", "Notfallkontakt Telefon", isValidPhone(pat.notfallkontaktTelefon), "Gültige Telefonnummer");
  s2("pat_hausarzt", "Hausarzt", filled(pat.hausarztName), "Pflichtfeld leer");
  s2("pat_krankenkasse", "Krankenkasse", filled(pat.krankenkasse), "Pflichtfeld leer");
  s2("pat_versicherung", "Versicherungsnr.", filled(pat.versicherungsNr), "Pflichtfeld leer");
  s2("pat_adresse", "Adresse Patient", filled(pat.adresseStrasse) && filled(pat.adressePlz) && filled(pat.adresseOrt), "Strasse, PLZ, Ort");
  s2("pat_groesse", "Grösse (cm)", filled(pat.groesse), "Pflichtfeld leer");
  s2("pat_gewicht", "Gewicht (kg)", filled(pat.gewicht), "Pflichtfeld leer");
  s2("pat_diagnosen", "Chronische Erkrankungen", filled(pat.chronischeErkrankungen), "Mindestens eine Diagnose");

  /* ── Step 3: Dokumente ───────────────── */
  const pflichtDocs: [string, string][] = [
    ["aerztliche_verordnung", "Ärztliche Verordnung"],
    ["kostengutsprache", "Kostengutsprache"],
    ["pflegevertrag", "Pflegevertrag"],
    ["ausweis_patient", "Ausweis Patient"],
    ["krankenkassenkarte", "Krankenkassenkarte"],
  ];

  pflichtDocs.forEach(([key, label]) => {
    items.push({
      id: `dok_${key}`,
      label,
      step: 3,
      stepLabel: "Dokumente",
      category: "document",
      status: dok.documents[key] ? "ok" : "missing",
      detail: "Pflichtdokument fehlt",
    });
  });

  return items;
}

/* ── Billing readiness logic ─────────────── */
interface BillingIssue {
  label: string;
  severity: "blocker" | "warning";
}

function checkBillingReadiness(
  ang: AngehoerigerFormData,
  pat: PatientFormData,
  dok: DokumenteFormData
): { ready: boolean; issues: BillingIssue[] } {
  const issues: BillingIssue[] = [];

  // Blockers
  if (!filled(ang.funktion) || !filled(ang.stundenlohn) || !isValidDate(ang.eintrittsdatum))
    issues.push({ label: "Arbeitsvertrag nicht vollständig erfasst", severity: "blocker" });
  if (!isValidIBAN(ang.iban))
    issues.push({ label: "IBAN ungültig oder fehlend", severity: "blocker" });
  if (!dok.documents.aerztliche_verordnung)
    issues.push({ label: "Ärztliche Verordnung fehlt", severity: "blocker" });
  if (!dok.documents.kostengutsprache)
    issues.push({ label: "Kostengutsprache fehlt", severity: "blocker" });
  if (!dok.documents.pflegevertrag)
    issues.push({ label: "Pflegevertrag nicht unterschrieben", severity: "blocker" });
  if (!filled(pat.krankenkasse) || !filled(pat.versicherungsNr))
    issues.push({ label: "Krankenkassenangaben unvollständig", severity: "blocker" });

  // Warnings
  if (!(ang.scans.id_scan && ang.scans.krankenkassenkarte && ang.scans.bankkarte))
    issues.push({ label: "Pflicht-Scan(s) fehlen (Angehöriger)", severity: "warning" });
  if (!dok.documents.ausweis_patient)
    issues.push({ label: "Ausweis Patient fehlt", severity: "warning" });
  if (pat.sozialamtKontakt === "ja" && !dok.documents.sozialamt_gutsprache)
    issues.push({ label: "Sozialamt-Gutsprache ausstehend", severity: "warning" });
  if (ang.lohnabtretung === "ja" && !dok.documents.lohnabtretung)
    issues.push({ label: "Lohnabtretungserklärung fehlt", severity: "warning" });
  if (pat.ivBezug === "ja")
    issues.push({ label: "IV-Bestätigung ausstehend", severity: "warning" });

  const hasBlocker = issues.some((i) => i.severity === "blocker");
  return { ready: !hasBlocker, issues };
}

/* ══════════════════════════════════════════
   SECTION DEFINITIONS
   ══════════════════════════════════════════ */
interface SectionDef {
  key: string;
  label: string;
  icon: React.ElementType;
}

const sections: SectionDef[] = [
  { key: "vollstaendigkeit", label: "Vollständigkeitsprüfung", icon: ListChecks },
  { key: "billing", label: "Abrechnungsbereitschaft", icon: ReceiptText },
  { key: "actionplan", label: "Action Plan Status", icon: ClipboardCheck },
];

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */
interface StepValidierungProps {
  angehoerigerData: AngehoerigerFormData;
  patientData: PatientFormData;
  dokumenteData: DokumenteFormData;
  onComplete: () => void;
  onGoToStep: (step: number) => void;
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepValidierung({
  angehoerigerData,
  patientData,
  dokumenteData,
  onComplete,
  onGoToStep,
}: StepValidierungProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["vollstaendigkeit", "billing", "actionplan"])
  );
  const [isRunning, setIsRunning] = useState(true);
  const [runComplete, setRunComplete] = useState(false);

  /* Run validation with simulated delay */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRunning(false);
      setRunComplete(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const validationItems = runValidation(angehoerigerData, patientData, dokumenteData);
  const okCount = validationItems.filter((v) => v.status === "ok").length;
  const missingCount = validationItems.filter((v) => v.status === "missing").length;
  const totalCount = validationItems.length;
  const allOk = missingCount === 0;

  const billing = checkBillingReadiness(angehoerigerData, patientData, dokumenteData);
  const blockers = billing.issues.filter((i) => i.severity === "blocker");
  const warnings = billing.issues.filter((i) => i.severity === "warning");

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canComplete = allOk && billing.ready;

  return (
    <div className="space-y-3">
      {/* ── Step Header ──────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isRunning
                  ? "bg-primary-light"
                  : allOk
                  ? "bg-success-light"
                  : "bg-warning-light"
              }`}
            >
              {isRunning ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : allOk ? (
                <ShieldCheck className="w-6 h-6 text-success" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-warning" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-foreground">Validierung & Abschluss</h3>
                {runComplete && allOk && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] bg-success-light text-success-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    <Check className="w-3 h-3" />
                    Alle Prüfungen bestanden
                  </span>
                )}
                {runComplete && !allOk && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] bg-warning-light text-warning-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {missingCount} Problem{missingCount !== 1 ? "e" : ""}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {isRunning
                  ? "Systemprüfung wird durchgeführt..."
                  : "Vollständigkeitsprüfung, Abrechnungsbereitschaft und Action Plan"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[12px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground"
              style={{ fontWeight: 500 }}
            >
              Schritt 4 & 5
            </span>
          </div>
        </div>

        {/* Validation progress bar */}
        {isRunning && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              <div className="flex-1">
                <div className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>
                  Systemprüfung läuft...
                </div>
                <div className="mt-1.5 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-[2000ms] ease-out"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result summary */}
        {runComplete && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border-light">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                allOk ? "bg-success-light" : "bg-warning-light"
              }`}>
                <ListChecks className={`w-4 h-4 ${allOk ? "text-success" : "text-warning"}`} />
              </div>
              <div>
                <div className="text-[17px] text-foreground tabular-nums" style={{ fontWeight: 700 }}>
                  {okCount}/{totalCount}
                </div>
                <div className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>Bestanden</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                billing.ready ? "bg-success-light" : "bg-warning-light"
              }`}>
                <ReceiptText className={`w-4 h-4 ${billing.ready ? "text-success" : "text-warning"}`} />
              </div>
              <div>
                <div className="text-[17px] text-foreground" style={{ fontWeight: 700 }}>
                  {billing.ready ? "OK" : "Nein"}
                </div>
                <div className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>Abrechenbar</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-[17px] text-foreground" style={{ fontWeight: 700 }}>Locked</div>
                <div className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>Action Plan</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sections ─────────────────────── */}
      {runComplete && (
        <>
          {sections.map((sec) => {
            const isOpen = openSections.has(sec.key);
            const Icon = sec.icon;

            const sectionOk =
              sec.key === "vollstaendigkeit" ? allOk :
              sec.key === "billing" ? billing.ready :
              false;

            return (
              <div
                key={sec.key}
                className={`bg-card rounded-2xl border transition-all ${
                  sec.key === "actionplan"
                    ? "border-border"
                    : sectionOk
                    ? "border-success/30"
                    : "border-warning/30"
                }`}
              >
                <button
                  onClick={() => toggleSection(sec.key)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      sec.key === "actionplan"
                        ? "bg-muted"
                        : sectionOk
                        ? "bg-success-light"
                        : isOpen
                        ? "bg-warning-light"
                        : "bg-muted"
                    }`}
                  >
                    {sec.key !== "actionplan" && sectionOk ? (
                      <CheckCircle2 className="w-[18px] h-[18px] text-success" />
                    ) : sec.key === "actionplan" ? (
                      <Lock className="w-[18px] h-[18px] text-muted-foreground" />
                    ) : (
                      <Icon
                        className={`w-[18px] h-[18px] ${
                          isOpen ? "text-warning" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[13px] ${
                          sec.key !== "actionplan" && sectionOk
                            ? "text-success-foreground"
                            : "text-foreground"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {sec.label}
                      </span>
                      {sec.key === "vollstaendigkeit" && !allOk && (
                        <span
                          className="text-[10px] px-1.5 py-[1px] rounded-md bg-warning-light text-warning-foreground"
                          style={{ fontWeight: 500 }}
                        >
                          {missingCount} fehlend
                        </span>
                      )}
                      {sec.key === "billing" && !billing.ready && (
                        <span
                          className="text-[10px] px-1.5 py-[1px] rounded-md bg-warning-light text-warning-foreground"
                          style={{ fontWeight: 500 }}
                        >
                          In Vorbereitung
                        </span>
                      )}
                      {sec.key === "billing" && billing.ready && (
                        <span
                          className="text-[10px] px-1.5 py-[1px] rounded-md bg-success-light text-success-foreground"
                          style={{ fontWeight: 500 }}
                        >
                          Abrechenbar
                        </span>
                      )}
                      {sec.key === "actionplan" && (
                        <span
                          className="text-[10px] px-1.5 py-[1px] rounded-md bg-muted text-muted-foreground"
                          style={{ fontWeight: 500 }}
                        >
                          Gesperrt
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-border-light">
                    {sec.key === "vollstaendigkeit" && (
                      <VollstaendigkeitSection
                        items={validationItems}
                        onGoToStep={onGoToStep}
                      />
                    )}
                    {sec.key === "billing" && (
                      <BillingSection billing={billing} blockers={blockers} warnings={warnings} />
                    )}
                    {sec.key === "actionplan" && (
                      <ActionPlanSection />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Final Action ─────────────── */}
          <div className={`rounded-2xl border p-5 lg:p-6 ${
            canComplete
              ? "bg-success-light/30 border-success/20"
              : "bg-card border-border"
          }`}>
            <div className="flex flex-col items-center text-center gap-4">
              {canComplete ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-success-light flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <h4 className="text-foreground">Bereit zum Abschluss</h4>
                    <p className="text-[13px] text-muted-foreground mt-1 max-w-md mx-auto">
                      Alle Pflichtprüfungen bestanden. Das Mandat kann eröffnet und die MedLink-Synchronisation gestartet werden.
                    </p>
                  </div>
                  <button
                    onClick={onComplete}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] bg-success text-white hover:bg-success/90 shadow-md hover:shadow-lg transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Onboarding abschliessen
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-warning-light flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-warning" />
                  </div>
                  <div>
                    <h4 className="text-foreground">Abschluss noch nicht möglich</h4>
                    <p className="text-[13px] text-muted-foreground mt-1 max-w-md mx-auto">
                      Bitte beheben Sie die offenen Punkte in den vorherigen Schritten. Fehlende Pflichtfelder und Dokumente müssen ergänzt werden.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onGoToStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] border border-border bg-card hover:bg-secondary/60 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Schritt 1
                    </button>
                    <button
                      onClick={() => onGoToStep(2)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] border border-border bg-card hover:bg-secondary/60 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <HeartPulse className="w-4 h-4 text-muted-foreground" />
                      Schritt 2
                    </button>
                    <button
                      onClick={() => onGoToStep(3)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] border border-border bg-card hover:bg-secondary/60 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Schritt 3
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 1: VOLLSTÄNDIGKEITSPRÜFUNG
   ══════════════════════════════════════════ */
function VollstaendigkeitSection({
  items,
  onGoToStep,
}: {
  items: ValidationItem[];
  onGoToStep: (step: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "missing" | "ok">("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const missingItems = items.filter((i) => i.status === "missing");
  const okItems = items.filter((i) => i.status === "ok");

  // Group by step
  const grouped = new Map<number, ValidationItem[]>();
  filtered.forEach((item) => {
    const arr = grouped.get(item.step) || [];
    arr.push(item);
    grouped.set(item.step, arr);
  });

  const stepIcons: Record<number, React.ElementType> = {
    1: Users,
    2: HeartPulse,
    3: FileText,
  };

  return (
    <div className="pt-4 space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${
            filter === "all"
              ? "bg-primary-light text-primary ring-1 ring-primary/15"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
          style={{ fontWeight: 500 }}
        >
          Alle ({items.length})
        </button>
        <button
          onClick={() => setFilter("missing")}
          className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${
            filter === "missing"
              ? "bg-warning-light text-warning-foreground ring-1 ring-warning/15"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
          style={{ fontWeight: 500 }}
        >
          Fehlend ({missingItems.length})
        </button>
        <button
          onClick={() => setFilter("ok")}
          className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${
            filter === "ok"
              ? "bg-success-light text-success-foreground ring-1 ring-success/15"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
          style={{ fontWeight: 500 }}
        >
          Bestanden ({okItems.length})
        </button>
      </div>

      {/* Grouped items */}
      {Array.from(grouped.entries()).map(([step, stepItems]) => {
        const StepIcon = stepIcons[step] || FileText;
        const stepMissing = stepItems.filter((i) => i.status === "missing").length;

        return (
          <div key={step} className="rounded-xl border border-border overflow-hidden">
            {/* Step header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
              <StepIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-[12px] text-foreground flex-1" style={{ fontWeight: 600 }}>
                Schritt {step}: {stepItems[0]?.stepLabel}
              </span>
              {stepMissing > 0 && (
                <button
                  onClick={() => onGoToStep(step)}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  style={{ fontWeight: 500 }}
                >
                  Korrigieren
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Items */}
            <div className="divide-y divide-border-light">
              {stepItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    item.status === "missing" ? "bg-warning-light/20" : ""
                  }`}
                >
                  {item.status === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                  )}
                  <span
                    className={`text-[12px] flex-1 ${
                      item.status === "missing" ? "text-warning-foreground" : "text-foreground"
                    }`}
                    style={{ fontWeight: item.status === "missing" ? 500 : 400 }}
                  >
                    {item.label}
                  </span>
                  {item.status === "missing" && item.detail && (
                    <span className="text-[10px] text-warning-foreground/70 shrink-0">
                      {item.detail}
                    </span>
                  )}
                  {item.category === "scan" && (
                    <Camera className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  )}
                  {item.category === "document" && (
                    <FileCheck2 className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[13px] text-muted-foreground">
          Keine Einträge für diesen Filter
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 2: BILLING READINESS
   ══════════════════════════════════════════ */
function BillingSection({
  billing,
  blockers,
  warnings,
}: {
  billing: { ready: boolean; issues: BillingIssue[] };
  blockers: BillingIssue[];
  warnings: BillingIssue[];
}) {
  return (
    <div className="pt-4 space-y-4">
      {/* Status card */}
      <div
        className={`rounded-xl p-4 flex items-center gap-4 ${
          billing.ready
            ? "bg-success-light/50 border border-success/20"
            : "bg-warning-light/50 border border-warning/20"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            billing.ready ? "bg-success-light" : "bg-warning-light"
          }`}
        >
          {billing.ready ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <Ban className="w-6 h-6 text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
              Status:
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[12px] ${
                billing.ready
                  ? "bg-success text-white"
                  : "bg-warning text-white"
              }`}
              style={{ fontWeight: 600 }}
            >
              <CircleDot className="w-3 h-3" />
              {billing.ready ? "Abrechenbar" : "In Vorbereitung"}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            {billing.ready
              ? "Alle abrechnungsrelevanten Daten und Dokumente sind vollständig vorhanden."
              : "Das Mandat kann noch nicht abgerechnet werden. Folgende Punkte müssen geklärt werden:"}
          </p>
        </div>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="rounded-xl border border-error/15 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-error-light/50 border-b border-error/10">
            <XCircle className="w-4 h-4 text-error shrink-0" />
            <span className="text-[12px] text-error-foreground" style={{ fontWeight: 600 }}>
              Grund für Abrechnungsstopp
            </span>
          </div>
          <div className="divide-y divide-error/5">
            {blockers.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-error-light/20">
                <div className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                <span className="text-[12px] text-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-warning/15 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-warning-light/50 border-b border-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="text-[12px] text-warning-foreground" style={{ fontWeight: 600 }}>
              Warnungen (nicht blockierend)
            </span>
          </div>
          <div className="divide-y divide-warning/5">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-warning-light/10">
                <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                <span className="text-[12px] text-foreground">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {billing.ready && billing.issues.length === 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-success-light/40 border border-success/10">
          <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
          <p className="text-[12px] text-success-foreground leading-relaxed">
            Keine offenen Punkte. Alle abrechnungsrelevanten Prüfungen wurden bestanden.
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 3: ACTION PLAN STATUS
   ══════════════════════════════════════════ */
function ActionPlanSection() {
  const actionPlanItems = [
    { label: "Erstassessment durchführen", tag: "Pflege" },
    { label: "Pflegeplanung erstellen", tag: "Pflege" },
    { label: "Einsatzplanung konfigurieren", tag: "Disposition" },
    { label: "Schlüssel / Zugang organisieren", tag: "Logistik" },
    { label: "Medikamentenplan synchronisieren", tag: "Medizin" },
    { label: "Angehörige informieren", tag: "Kommunikation" },
  ];

  return (
    <div className="pt-4 space-y-4">
      {/* Status banner */}
      <div className="rounded-xl p-4 bg-muted/40 border border-border flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
              Action Plan generiert
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] bg-muted text-muted-foreground"
              style={{ fontWeight: 500 }}
            >
              <Lock className="w-3 h-3" />
              Locked
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Wird freigeschaltet nach Vertragsunterzeichnung und Mandatseröffnung
          </p>
        </div>
      </div>

      {/* Preview items */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border-light">
          <ClipboardCheck className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>
            Geplante Massnahmen (Vorschau)
          </span>
        </div>
        <div className="divide-y divide-border-light">
          {actionPlanItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 opacity-60"
            >
              <div className="w-5 h-5 rounded-md border border-border-light flex items-center justify-center shrink-0">
                <Lock className="w-3 h-3 text-muted-foreground/50" />
              </div>
              <span className="text-[12px] text-foreground flex-1">{item.label}</span>
              <span
                className="text-[10px] px-1.5 py-[1px] rounded-md bg-muted text-muted-foreground shrink-0"
                style={{ fontWeight: 500 }}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-info-light/40 border border-info/10">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Der Action Plan wird nach Abschluss des Onboardings automatisch an die zuständige Pflegedienstleitung weitergeleitet. Alle Massnahmen werden in MedLink synchronisiert.
        </p>
      </div>
    </div>
  );
}