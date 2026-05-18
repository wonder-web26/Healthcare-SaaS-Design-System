import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Users,
  HeartPulse,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Save,
  Clock,
  Loader2,
  ArrowLeft,
  FileSignature,
  FileText,
  ShieldAlert,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  StepAngehoeriger,
  emptyAngehoerigerForm,
  type AngehoerigerFormData,
} from "./StepAngehoeriger";
import {
  StepPatient,
  emptyPatientForm,
  type PatientFormData,
} from "./StepPatient";
import { VertragsunterzeichnungPhase } from "./VertragsunterzeichnungPhase";
import { SpezialbewilligungDialog } from "./SpezialbewilligungDialog";
import { SpezialbewilligungStep } from "./form/SpezialbewilligungStep";
import { VertragsStep } from "./form/VertragsStep";
import { AnnaListenEinordnung, type DetailKontext } from "../anna/AnnaListenEinordnung";

/* ══════════════════════════════════════════
   STEP DEFINITIONS
   ══════════════════════════════════════════ */
interface WizardStep {
  id: number;
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  sections: string[];
  blocked?: boolean;
  danger?: boolean;
}

const baseSteps: WizardStep[] = [
  {
    id: 1,
    key: "angehoeriger",
    label: "Angehöriger (HR)",
    shortLabel: "Angehöriger",
    icon: Users,
    description: "Personalangaben und HR-Daten des Angehörigen",
    sections: [
      "Personalien",
      "Steuer & Sozialversicherung",
      "Partner",
      "Kinder & Zulagen",
      "Anstellung & Auszahlung",
      "Dokumente",
    ],
  },
  {
    id: 2,
    key: "patient",
    label: "Patient (Medizin)",
    shortLabel: "Patient",
    icon: HeartPulse,
    description: "Medizinische und pflegerische Angaben zum Patienten",
    sections: [
      "Personalien",
      "Steuer & Sozialversicherungen",
      "Anamnese",
      "Aktivitäten",
      "Dokumente",
    ],
  },
  {
    id: 3,
    key: "vertrag",
    label: "Vertragsunterzeichnung",
    shortLabel: "Vertrag",
    icon: FileSignature,
    description: "Arbeitsvertrag auswählen und digital unterzeichnen",
    sections: [
      "Vertragstyp",
      "Dokumentenerstellung",
      "Digitale Signatur",
    ],
  },
];

function buildSteps(requiresB: boolean, bewilligungEingereicht: boolean): WizardStep[] {
  if (!requiresB) return baseSteps;
  const eingereicht = bewilligungEingereicht;
  return [
    baseSteps[0],
    {
      id: 2,
      key: "spezialbewilligung",
      label: "Spezialbewilligung B",
      shortLabel: "Bewilligung B",
      icon: eingereicht ? CheckCircle2 : ShieldAlert,
      description: "Erwerbstätigkeitsbewilligung beim Migrationsamt",
      sections: ["Antragstellung"],
      danger: !eingereicht,
    },
    { ...baseSteps[1], id: 3 },
    { ...baseSteps[2], id: 4, icon: eingereicht ? FileSignature : Lock, blocked: !eingereicht },
  ];
}

/* ══════════════════════════════════════════
   CASE LOOKUP (mock) — maps caseId to patient context
   ══════════════════════════════════════════ */
const onboardingCaseLookup: Record<string, { patient: string; patientId: string; angehoeriger: string; vertragDatum: string }> = {
  "OB-2026-001": { patient: "Schmid, Thomas", patientId: "P-2026-0042", angehoeriger: "Lisa Schmid", vertragDatum: "18.02.2026" },
  "OB-2026-002": { patient: "Hoffmann, Peter", patientId: "P-2026-0046", angehoeriger: "Ruth Hoffmann", vertragDatum: "20.02.2026" },
  "OB-2026-003": { patient: "Becker, Sabine", patientId: "P-2026-0045", angehoeriger: "Hans Becker", vertragDatum: "10.02.2026" },
  "OB-2026-004": { patient: "Steiner, Heinrich", patientId: "P-2026-0048", angehoeriger: "Ursula Steiner", vertragDatum: "05.02.2026" },
  "OB-2026-008": { patient: "Graf, Lena", patientId: "P-2026-0051", angehoeriger: "Martin Graf", vertragDatum: "24.02.2026" },
  "OB-2026-009": { patient: "Huber, Fritz", patientId: "P-2026-0052", angehoeriger: "Erika Huber", vertragDatum: "15.02.2026" },
  "OB-2026-010": { patient: "Ammann, Rosa", patientId: "P-2026-0053", angehoeriger: "Daniel Ammann", vertragDatum: "26.02.2026" },
  "OB-2026-011": { patient: "Frei, Walter", patientId: "P-2026-0054", angehoeriger: "Margrit Frei", vertragDatum: "12.02.2026" },
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function OnboardingPage() {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const isExisting = !!caseId;
  const caseInfo = caseId ? onboardingCaseLookup[caseId] : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  /* ── Angehöriger form state (lifted) ───── */
  const [angehoerigerData, setAngehoerigerData] = useState<AngehoerigerFormData>(emptyAngehoerigerForm);
  const [step1Valid, setStep1Valid] = useState(false);

  /* ── Patient form state (lifted) ───── */
  const [patientData, setPatientData] = useState<PatientFormData>(emptyPatientForm);
  const [step2Valid, setStep2Valid] = useState(false);

  /* ── Step 3 (Vertrag) validity ───── */
  const [step3Valid, setStep3Valid] = useState(false);

  /* ── Spezialbewilligung dialog ───── */
  const [showSpezialbewilligung, setShowSpezialbewilligung] = useState(false);

  /* ── Dynamic steps based on Aufenthaltsstatus B ── */
  const requiresB = angehoerigerData.aufenthaltsstatus === "B";
  const bewilligungEingereicht = angehoerigerData.spezialbewilligungStatus === "eingereicht";
  const wizardSteps = buildSteps(requiresB, bewilligungEingereicht);

  /* ── Sync step validity with completedSteps ── */
  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (step1Valid) next.add(1);
      else next.delete(1);
      return next;
    });
  }, [step1Valid]);

  useEffect(() => {
    if (requiresB) {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        if (bewilligungEingereicht) next.add(2);
        else next.delete(2);
        return next;
      });
    }
  }, [requiresB, bewilligungEingereicht]);

  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      const patientStepId = requiresB ? 3 : 2;
      if (step2Valid) next.add(patientStepId);
      else next.delete(patientStepId);
      return next;
    });
  }, [step2Valid, requiresB]);

  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      const vertragStepId = requiresB ? 4 : 3;
      if (step3Valid && !requiresB) next.add(vertragStepId);
      else next.delete(vertragStepId);
      return next;
    });
  }, [step3Valid, requiresB]);

  /* ── Progress calculation ──────────────── */
  const nonBlockedSteps = wizardSteps.filter((s) => !s.blocked);
  const progressPercent = nonBlockedSteps.length > 0
    ? Math.round((completedSteps.size / nonBlockedSteps.length) * 100)
    : 0;

  /* ── Navigation ────────────────────────── */
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= wizardSteps.length) {
        setCurrentStep(step);
        setVisitedSteps((prev) => new Set([...prev, step]));
      }
    },
    [wizardSteps.length]
  );

  const goNext = () => {
    if (currentStep < wizardSteps.length) {
      // Mark current step as completed when moving forward
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      goToStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  /* ── Save simulation ───────────────────── */
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSaved(timeStr);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 1200);
  }, []);

  useEffect(() => {
    if (currentStep > wizardSteps.length) {
      setCurrentStep(wizardSteps.length);
    }
    const currentKey = wizardSteps.find((s) => s.id === currentStep)?.key;
    if (currentKey === "spezialbewilligung" && !requiresB) {
      setCurrentStep(1);
    }
  }, [requiresB, wizardSteps.length]);

  const activeStepData = wizardSteps.find((s) => s.id === currentStep) ?? wizardSteps[0];

  const completedCount = completedSteps.size;
  const totalSteps = wizardSteps.length;

  // A.2: Action-oriented progress label
  const progressLabel = (() => {
    if (progressPercent === 100) return "Onboarding abgeschlossen";
    if (currentStep === totalSteps && !activeStepData.blocked) return "Bereit zum Abschluss";
    if (completedSteps.has(currentStep)) return "Bereit für nächsten Schritt";
    if (completedCount > 0) return "In Bearbeitung";
    return "Nicht gestartet";
  })();

  // D: Anna detail context — computed once per mandate state, cached via session storage in the component
  const annaDetailContext = useMemo<DetailKontext>(() => {
    const offeneCompliance: string[] = [];
    if (requiresB && !bewilligungEingereicht) {
      offeneCompliance.push("Spezialbewilligung muss eingereicht werden, bevor der Vertrag unterzeichnet werden kann");
    }
    if (!step3Valid && completedCount > 0) {
      offeneCompliance.push("Arbeitsvertrag wartet auf die Unterschrift");
    }
    // Estimate pflichtfelder from step validity
    const pflichtGesamt = requiresB ? 4 : 3;
    return {
      mandatId: caseId ?? "new",
      patientenName: caseInfo?.patient ?? "Neuer Patient",
      angehoerigeName: caseInfo?.angehoeriger ?? "Angehörige/r",
      aufenthaltsstatus: angehoerigerData.aufenthaltsstatus || "–",
      erfasstePflichtfelder: { erfuellt: completedCount, gesamt: pflichtGesamt },
      offeneCompliance,
      tageSeitStart: caseInfo ? Math.floor((Date.now() - new Date("2026-02-15").getTime()) / 86400000) : 0,
      completedSteps: completedCount,
      totalSteps,
      isBlocked: requiresB && !bewilligungEingereicht,
    };
  }, [caseId, caseInfo, requiresB, bewilligungEingereicht, step3Valid, completedCount, totalSteps, angehoerigerData.aufenthaltsstatus]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══════════════════════════════════════
         HEADER CARD
         ═══════════════════════════════════════ */}
      <div className="shrink-0" style={{ padding: "var(--space-5) var(--space-6) 0", marginBottom: "var(--space-5)" }}>
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "20px 28px" }}>
          {/* Row 1: Title + Actions */}
          <div className="flex items-start justify-between" style={{ gap: "var(--space-4)" }}>
            <div className="flex items-start min-w-0" style={{ gap: "var(--space-3)" }}>
              <button
                onClick={() => navigate("/onboarding")}
                title="Zurück zur Übersicht"
                className="shrink-0 flex items-center justify-center cursor-pointer transition-colors"
                style={{ width: 32, height: 32, marginTop: 4, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}
              >
                <ArrowLeft style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
              </button>
              <div className="min-w-0">
                <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>
                  {isExisting && caseInfo ? `Onboarding — ${caseInfo.patient}` : "Neues Mandat eröffnen"}
                </h1>
                {isExisting && caseInfo && (
                  <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
                    Angehörige: {caseInfo.angehoeriger} · Eintrittsdatum: {caseInfo.vertragDatum}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center shrink-0" style={{ gap: "var(--space-2)" }}>
              {lastSaved && (
                <span className="hidden lg:flex items-center" style={{ gap: "var(--space-1)", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                  <Clock style={{ width: 12, height: 12 }} /> {lastSaved}
                </span>
              )}
              <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-50"
                style={{ gap: "var(--space-1)", padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}>
                {isSaving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                <span className="hidden sm:inline">Speichern</span>
              </button>
              <button onClick={() => navigate("/onboarding")} className="inline-flex items-center cursor-pointer transition-colors"
                style={{ padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Row 2: Progress bar + Status */}
          <div className="flex items-center" style={{ gap: 14, marginTop: "var(--space-4)" }}>
            <div className="flex-1" style={{ height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPercent}%`, background: "var(--brand-primary)", borderRadius: "var(--radius-pill)", transition: "width 0.5s ease-out" }} />
            </div>
            <span style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Schritt {currentStep} von {totalSteps} · {progressLabel}
            </span>
          </div>
        </div>

        {/* Anna detail einordnung */}
        {isExisting && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <AnnaListenEinordnung detailContext={annaDetailContext} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
         MOBILE STEPPER
         ═══════════════════════════════════════ */}
      <div className="lg:hidden shrink-0 overflow-x-auto" style={{ padding: "var(--space-3) var(--space-4)" }}>
        <div className="flex items-center" style={{ gap: "var(--space-1)" }}>
          {wizardSteps.map((step, idx) => {
            const isSelected = currentStep === step.id;
            const isCompleted = completedSteps.has(step.id);
            const isDanger = !!step.danger;
            const isBlocked = !!step.blocked;
            return (
              <button key={step.key} onClick={() => !isBlocked && goToStep(step.id)} disabled={isBlocked}
                className="inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                style={{
                  gap: "var(--space-1)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-pill)",
                  fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                  opacity: isBlocked ? 0.5 : 1, cursor: isBlocked ? "not-allowed" : "pointer",
                  background: isSelected ? "var(--brand-primary-light)" : isCompleted ? "var(--status-success-bg)" : isDanger ? "var(--status-danger-bg)" : "transparent",
                  color: isSelected ? "var(--brand-primary)" : isCompleted ? "var(--status-success-text)" : isDanger ? "var(--status-danger)" : "var(--text-secondary)",
                }}>
                {isCompleted ? <Check style={{ width: 12, height: 12 }} /> : <step.icon style={{ width: 12, height: 12 }} />}
                <span className="hidden sm:inline">{step.shortLabel}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
         MAIN SPLIT LAYOUT
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0" style={{ padding: "0 var(--space-6)" }}>
        <div className="flex w-full min-h-0" style={{ gap: "var(--space-5)" }}>
          {/* ── LEFT: Sidebar (desktop) ── */}
          <div className="hidden lg:flex shrink-0 flex-col min-h-0" style={{ width: 240 }}>
            <div className="flex-1 overflow-y-auto" style={{ paddingRight: "var(--space-1)" }}>
              <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-4)" }}>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", marginBottom: "var(--space-4)" }}>
                  Fortschritt
                </div>

                <nav className="flex flex-col" style={{ gap: "var(--space-1)" }}>
                  {wizardSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isSelected = currentStep === step.id;
                    const isCompleted = completedSteps.has(step.id);
                    const isDanger = !!step.danger;
                    const isBlocked = !!step.blocked;
                    const isInProgress = visitedSteps.has(step.id) && step.id === currentStep;

                    const iconBg = isBlocked ? "var(--status-danger-bg)" : isDanger ? "var(--status-danger)" : isCompleted ? "var(--status-success)" : isInProgress ? "var(--brand-primary)" : "var(--bg-secondary)";
                    const iconColor = isBlocked ? "var(--status-danger)" : (isDanger || isCompleted || isInProgress) ? "var(--text-on-dark)" : "var(--text-secondary)";

                    let statusText = "Ausstehend";
                    let statusColor = "var(--text-tertiary)";
                    if (isBlocked) { statusText = "Blockiert"; statusColor = "var(--status-danger)"; }
                    else if (isDanger) { statusText = "Pflicht · ausstehend"; statusColor = "var(--status-danger)"; }
                    else if (isCompleted) {
                      statusText = step.key === "spezialbewilligung" && angehoerigerData.spezialbewilligungEinreichungsDatum
                        ? `Eingereicht am ${angehoerigerData.spezialbewilligungEinreichungsDatum.split("-").reverse().join(".")}`
                        : "Abgeschlossen";
                      statusColor = "var(--status-success-text)";
                    } else if (isInProgress) { statusText = "In Bearbeitung"; statusColor = "var(--text-secondary)"; }

                    return (
                      <div key={step.key}>
                        <button
                          onClick={() => !isBlocked && goToStep(step.id)}
                          disabled={isBlocked}
                          className="w-full flex items-start text-left cursor-pointer transition-colors"
                          style={{
                            gap: "var(--space-2)", padding: "8px 10px", borderRadius: "var(--radius-card)",
                            opacity: isBlocked ? 0.6 : 1, cursor: isBlocked ? "not-allowed" : "pointer",
                            background: isSelected ? "var(--brand-primary-light)" : "transparent",
                          }}
                          onMouseEnter={e => { if (!isSelected && !isBlocked) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-card)", background: iconBg }}>
                            {isCompleted ? <Check style={{ width: 14, height: 14, color: iconColor }} /> : <Icon style={{ width: 14, height: 14, color: iconColor }} />}
                          </div>
                          <div className="flex-1 min-w-0" style={{ paddingTop: 2 }}>
                            <div className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: isSelected ? "var(--weight-medium)" : "var(--weight-regular)", color: isSelected ? "var(--brand-primary)" : "var(--text-primary)" }}>
                              {step.label}
                            </div>
                            <div className="truncate" style={{ fontSize: "var(--text-micro)", color: statusColor, marginTop: 2 }}>
                              {statusText}
                            </div>
                          </div>
                          {isSelected && !isBlocked && <ChevronRight style={{ width: 16, height: 16, color: "var(--brand-primary)", flexShrink: 0, marginTop: 2 }} />}
                          {isDanger && <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning)", flexShrink: 0, marginTop: 2 }} title="Erforderlich wegen Aufenthaltsstatus B" />}
                        </button>
                        {idx < wizardSteps.length - 1 && (
                          <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 22 }}>
                            <div style={{ width: "var(--border-thin)", height: 8, background: isCompleted ? "var(--status-success)" : "var(--border-default)", borderRadius: "var(--radius-pill)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

              </div>
            </div>
          </div>

          {/* ── RIGHT: Content ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "var(--space-4)" }}>
              {activeStepData.key === "angehoeriger" && (
                <StepAngehoeriger
                  data={angehoerigerData}
                  onChange={setAngehoerigerData}
                  onValidityChange={setStep1Valid}
                  onOpenSpezialbewilligung={() => setShowSpezialbewilligung(true)}
                />
              )}
              {activeStepData.key === "spezialbewilligung" && (
                <SpezialbewilligungStep data={angehoerigerData} onChange={setAngehoerigerData} />
              )}
              {activeStepData.key === "patient" && (
                <StepPatient
                  data={patientData}
                  onChange={setPatientData}
                  onValidityChange={setStep2Valid}
                />
              )}
              {activeStepData.key === "vertrag" && (
                <VertragsStep
                  angehoerigerName={caseInfo?.angehoeriger ?? "Angehörige/r"}
                  stundenlohn={angehoerigerData.stundenlohn}
                  eintrittsdatum={angehoerigerData.eintrittsdatum}
                  onValidityChange={setStep3Valid}
                  onComplete={() => setStep3Valid(true)}
                />
              )}
            </div>

            {/* ── FOOTER NAVIGATION ── */}
            <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-6)", background: "var(--bg-primary)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <div className="flex items-center justify-between">
                {/* Left: Back */}
                <button onClick={goPrev} disabled={currentStep === 1} className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                  onMouseEnter={e => { if (currentStep > 1) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                  <ChevronLeft style={{ width: 14, height: 14 }} /> Zurück
                </button>

                {/* Center: Step indicator */}
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Schritt {currentStep} von {wizardSteps.length}</span>

                {/* Right: Save + Next/Finish */}
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-50"
                    style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                    {isSaving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                    <span className="hidden lg:inline">Speichern</span>
                  </button>

                  {currentStep < wizardSteps.length ? (
                    (() => {
                      const isOnSpezialbewilligung = activeStepData.key === "spezialbewilligung";
                      const spezialbewilligungIncomplete = isOnSpezialbewilligung && !bewilligungEingereicht;
                      return (
                        <button onClick={spezialbewilligungIncomplete ? undefined : goNext} disabled={spezialbewilligungIncomplete}
                          className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
                          onMouseEnter={e => { if (!spezialbewilligungIncomplete) e.currentTarget.style.background = "var(--brand-primary-dark)"; }}
                          onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
                          title={spezialbewilligungIncomplete ? "Erst Spezialbewilligung einreichen" : undefined}>
                          Weiter <ChevronRight style={{ width: 14, height: 14 }} />
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      onClick={() => { handleSave(); setTimeout(() => navigate("/onboarding"), 1400); }}
                      disabled={isSaving}
                      className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-50"
                      style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
                      <Check style={{ width: 14, height: 14 }} /> Onboarding abschliessen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
         SPEZIALBEWILLIGUNG DIALOG
         ═══════════════════════════════════════ */}
      {showSpezialbewilligung && (
        <SpezialbewilligungDialog
          data={angehoerigerData}
          onChange={setAngehoerigerData}
          onClose={() => setShowSpezialbewilligung(false)}
        />
      )}

      {/* ═══════════════════════════════════════
         SAVE TOAST
         ═══════════════════════════════════════ */}
      {showSaveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-foreground text-background shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span className="text-[13px]" style={{ fontWeight: 500 }}>
              Fortschritt gespeichert
            </span>
            <span className="text-[11px] opacity-70">{lastSaved}</span>
          </div>
        </div>
      )}
    </div>
  );
}