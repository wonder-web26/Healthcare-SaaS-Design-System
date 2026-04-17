import React, { useState, useCallback, useEffect } from "react";
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

/* ══════════════════════════════════════════
   STEP DEFINITIONS
   ══════════════════════════════════════════ */
const wizardSteps = [
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

  /* ── Sync step 1 validity with completedSteps ── */
  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (step1Valid) next.add(1);
      else next.delete(1);
      return next;
    });
  }, [step1Valid]);

  /* ── Sync step 2 validity with completedSteps ── */
  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (step2Valid) next.add(2);
      else next.delete(2);
      return next;
    });
  }, [step2Valid]);

  /* ── Sync step 3 validity with completedSteps ── */
  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (step3Valid) next.add(3);
      else next.delete(3);
      return next;
    });
  }, [step3Valid]);

  /* ── Progress calculation ──────────────── */
  const progressPercent = Math.round((completedSteps.size / wizardSteps.length) * 100);

  /* ── Navigation ────────────────────────── */
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= wizardSteps.length) {
        setCurrentStep(step);
        setVisitedSteps((prev) => new Set([...prev, step]));
      }
    },
    []
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

  const activeStepData = wizardSteps.find((s) => s.id === currentStep)!;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══════════════════════════════════════
         TOP BAR — Title + Progress + Actions
         ═══════════════════════════════════════ */}
      <div className="shrink-0 px-5 lg:px-8 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Back to list */}
            <button
              onClick={() => navigate("/onboarding")}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-secondary/60 flex items-center justify-center shrink-0 transition-colors"
              title="Zurück zur Übersicht"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="min-w-0">
              <h2 className="text-foreground">
                {isExisting && caseInfo
                  ? `Onboarding — ${caseInfo.patient}`
                  : "Neues Mandat eröffnen"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                
                {isExisting && caseInfo && (
                  <>
                    <span className="text-[11px] text-muted-foreground/40">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      Angehörige/r: {caseInfo.angehoeriger}
                    </span>
                    <span className="text-[11px] text-muted-foreground/40">·</span>
                    <span className="text-[11px] text-success-foreground">
                      Vertrag: {caseInfo.vertragDatum}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Save status */}
            {lastSaved && (
              <span className="text-[11px] text-muted-foreground hidden lg:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Gespeichert um {lastSaved}
              </span>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all disabled:opacity-50"
              style={{ fontWeight: 500 }}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Save className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              Zwischenspeichern
            </button>

            {/* Cancel */}
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden lg:inline">Abbrechen</span>
            </button>
          </div>
        </div>

        {/* ── Global Progress Bar ──────────── */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span
            className="text-[12px] text-primary tabular-nums shrink-0"
            style={{ fontWeight: 600 }}
          >
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
         MAIN SPLIT LAYOUT
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0 px-5 lg:px-8 pb-0">
        <div className="flex gap-5 lg:gap-6 w-full min-h-0">
          {/* ─────────────────────────────────────
             LEFT PANEL — Step Navigation
             ───────────────────────────────────── */}
          <div className="w-[260px] lg:w-[280px] shrink-0 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="bg-card rounded-2xl border border-border p-4 lg:p-5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4" style={{ fontWeight: 500 }}>
                  Fortschritt
                </div>

                <nav className="space-y-1">
                  {wizardSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = completedSteps.has(step.id);
                    const isVisited = visitedSteps.has(step.id);

                    return (
                      <div key={step.id} className="contents">
                        <button
                          onClick={() => goToStep(step.id)}
                          className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all group ${
                            isActive
                              ? "bg-primary-light ring-1 ring-primary/20"
                              : isCompleted
                              ? "hover:bg-success-light/60"
                              : isVisited
                              ? "hover:bg-muted/50"
                              : "hover:bg-muted/30 opacity-70"
                          }`}
                        >
                          {/* Step icon/number */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : isCompleted
                                ? "bg-success text-white"
                                : isVisited
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted/60 text-muted-foreground/50"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>

                          {/* Step label & description */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[13px] truncate ${
                                  isActive
                                    ? "text-primary"
                                    : isCompleted
                                    ? "text-success-foreground"
                                    : "text-foreground"
                                }`}
                                style={{ fontWeight: isActive ? 600 : 500 }}
                              >
                                {step.label}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] mt-0.5 block truncate ${
                                isActive
                                  ? "text-primary/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isCompleted
                                ? "Abgeschlossen"
                                : isActive
                                ? "In Bearbeitung"
                                : isVisited
                                ? "Besucht"
                                : "Ausstehend"}
                            </span>
                          </div>

                          {/* Chevron for active */}
                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                          )}
                        </button>

                        {/* Connector line */}
                        {idx < wizardSteps.length - 1 && (
                          <div className="flex justify-start pl-[26px] py-0">
                            <div
                              className={`w-[2px] h-3 rounded-full transition-colors ${
                                isCompleted ? "bg-success" : "bg-border"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                {/* ── Quick Stats ─────────────── */}
                <div className="mt-5 pt-4 border-t border-border-light space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Abgeschlossen</span>
                    <span className="text-[12px] text-foreground tabular-nums" style={{ fontWeight: 600 }}>
                      {completedSteps.size} / {wizardSteps.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Status</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-[2px] rounded-full ${
                        progressPercent === 100
                          ? "bg-success-light text-success-foreground"
                          : progressPercent > 0
                          ? "bg-primary-light text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      <span
                        className={`w-[5px] h-[5px] rounded-full ${
                          progressPercent === 100
                            ? "bg-success"
                            : progressPercent > 0
                            ? "bg-primary"
                            : "bg-muted-foreground"
                        }`}
                      />
                      {progressPercent === 100
                        ? "Bereit"
                        : progressPercent > 0
                        ? "In Bearbeitung"
                        : "Nicht gestartet"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────
             RIGHT PANEL — Content Area
             ───────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="flex-1 overflow-y-auto pb-4">
              {currentStep === 1 ? (
                <StepAngehoeriger
                  data={angehoerigerData}
                  onChange={setAngehoerigerData}
                  onValidityChange={setStep1Valid}
                />
              ) : currentStep === 2 ? (
                <StepPatient
                  data={patientData}
                  onChange={setPatientData}
                  onValidityChange={setStep2Valid}
                />
              ) : (
                <VertragsunterzeichnungPhase
                  onValidityChange={setStep3Valid}
                  onComplete={() => setStep3Valid(true)}
                  onNavigateToBetreuung={() => navigate("/onboarding")}
                  angehoerigerName={caseInfo?.angehoeriger ?? "Angehörige/r"}
                />
              )}
            </div>

            {/* ─────────────────────────────────
               BOTTOM NAVIGATION BAR
               ───────────────────────────────── */}
            <div className="shrink-0 py-4 border-t border-border bg-background">
              <div className="flex items-center justify-between">
                {/* Left: Back button */}
                <button
                  onClick={goPrev}
                  disabled={currentStep === 1}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] border transition-all ${
                    currentStep === 1
                      ? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                      : "border-border bg-card text-foreground hover:bg-secondary/60"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Zurück
                </button>

                {/* Center: Step indicator text */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-1.5">
                    {wizardSteps.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => goToStep(s.id)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          s.id === currentStep
                            ? "bg-primary scale-110"
                            : completedSteps.has(s.id)
                            ? "bg-success"
                            : "bg-border hover:bg-muted-foreground/30"
                        }`}
                        title={s.label}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-muted-foreground">
                    Schritt {currentStep} von {wizardSteps.length}
                  </span>
                </div>

                {/* Right: Forward / Finish buttons */}
                <div className="flex items-center gap-2">
                  {/* Save (always visible) */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] border border-border bg-card hover:bg-secondary/60 transition-all disabled:opacity-50"
                    style={{ fontWeight: 500 }}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Save className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="hidden lg:inline">Speichern</span>
                  </button>

                  {currentStep < wizardSteps.length ? (
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all"
                    style={{ fontWeight: 500 }}
                  >
                    Weiter
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  ) : (
                  <button
                    onClick={() => {
                      handleSave();
                      setTimeout(() => navigate("/onboarding"), 1400);
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] bg-success text-white hover:bg-success/90 shadow-sm transition-all disabled:opacity-50"
                    style={{ fontWeight: 500 }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Onboarding abschliessen
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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