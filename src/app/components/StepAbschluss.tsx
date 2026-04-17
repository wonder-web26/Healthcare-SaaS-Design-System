import React, { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Cloud,
  Database,
  Bell,
  FileCheck2,
  Sparkles,
  ArrowRight,
  PartyPopper,
  Shield,
  Clock,
  ExternalLink,
} from "lucide-react";

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */
interface StepAbschlussProps {
  onGoToDashboard: () => void;
  onStartNewMandat: () => void;
}

/* ── Sync steps ──────────────────────────── */
interface SyncStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  duration: number; // ms delay before completing
}

const syncSteps: SyncStep[] = [
  {
    id: "validate",
    label: "Datenvalidierung abgeschlossen",
    description: "Alle Pflichtfelder und Formate geprüft",
    icon: Shield,
    duration: 800,
  },
  {
    id: "pdf",
    label: "PDF-Dossier generiert",
    description: "Mandatsdossier als PDF erstellt",
    icon: FileCheck2,
    duration: 1600,
  },
  {
    id: "sharepoint",
    label: "SharePoint Ablage erstellt",
    description: "Ordnerstruktur und Dokumente synchronisiert",
    icon: Cloud,
    duration: 2600,
  },
  {
    id: "medlink",
    label: "MedLink Synchronisation gestartet",
    description: "Patientendaten an MedLink übermittelt",
    icon: Database,
    duration: 3800,
  },
  {
    id: "notify",
    label: "Benachrichtigungen versendet",
    description: "PDL, Hausarzt und Angehörige informiert",
    icon: Bell,
    duration: 4800,
  },
];

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepAbschluss({ onGoToDashboard, onStartNewMandat }: StepAbschlussProps) {
  const [completedSyncs, setCompletedSyncs] = useState<Set<string>>(new Set());
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    syncSteps.forEach((step) => {
      const timer = setTimeout(() => {
        setCompletedSyncs((prev) => new Set([...prev, step.id]));
      }, step.duration);
      timers.push(timer);
    });

    // Final "all done" state
    const finalTimer = setTimeout(() => {
      setAllDone(true);
    }, syncSteps[syncSteps.length - 1].duration + 600);
    timers.push(finalTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  const completedCount = completedSyncs.size;
  const totalSteps = syncSteps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const mandatId = `MAN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const timestamp = new Date().toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-3">
      {/* ── Success Header ───────────────── */}
      <div
        className={`rounded-2xl border p-6 lg:p-8 text-center transition-all duration-700 ${
          allDone
            ? "bg-success-light/30 border-success/20"
            : "bg-card border-border"
        }`}
      >
        {/* Animated icon */}
        <div className="flex justify-center mb-5">
          <div
            className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-700 ${
              allDone ? "bg-success-light" : "bg-primary-light"
            }`}
          >
            {allDone ? (
              <PartyPopper className="w-10 h-10 text-success" />
            ) : (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            )}
            {allDone && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        <h2
          className={`transition-colors duration-500 ${
            allDone ? "text-success-foreground" : "text-foreground"
          }`}
        >
          {allDone ? "Onboarding erfolgreich abgeschlossen" : "Onboarding wird abgeschlossen..."}
        </h2>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-lg mx-auto">
          {allDone
            ? "Das Mandat wurde erfolgreich eröffnet. Alle Daten sind synchronisiert und die zuständigen Stellen wurden benachrichtigt."
            : "Daten werden validiert, synchronisiert und an die Zielsysteme übermittelt. Bitte warten..."}
        </p>

        {/* Mandat info badges */}
        {allDone && (
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-light text-success-foreground text-[12px]"
              style={{ fontWeight: 600 }}
            >
              <Database className="w-3.5 h-3.5" />
              {mandatId}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-[12px]"
              style={{ fontWeight: 500 }}
            >
              <Clock className="w-3.5 h-3.5" />
              {timestamp}
            </span>
          </div>
        )}
      </div>

      {/* ── Sync Progress ────────────────── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Progress header */}
        <div className="px-5 py-4 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {allDone ? (
                <CheckCircle2 className="w-[18px] h-[18px] text-success" />
              ) : (
                <Loader2 className="w-[18px] h-[18px] text-primary animate-spin" />
              )}
              <span className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
                {allDone ? "Synchronisation abgeschlossen" : "MedLink Synchronisation"}
              </span>
            </div>
            <span
              className={`text-[12px] tabular-nums px-2.5 py-1 rounded-lg ${
                allDone
                  ? "bg-success-light text-success-foreground"
                  : "bg-primary-light text-primary"
              }`}
              style={{ fontWeight: 600 }}
            >
              {completedCount}/{totalSteps}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                allDone ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sync steps */}
        <div className="divide-y divide-border-light">
          {syncSteps.map((step) => {
            const isComplete = completedSyncs.has(step.id);
            const isCurrent =
              !isComplete &&
              syncSteps.findIndex((s) => !completedSyncs.has(s.id)) ===
                syncSteps.indexOf(step);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3.5 px-5 py-3.5 transition-all duration-300 ${
                  isComplete ? "bg-success-light/15" : isCurrent ? "bg-primary-light/30" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isComplete
                      ? "bg-success-light"
                      : isCurrent
                      ? "bg-primary-light"
                      : "bg-muted/50"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[13px] ${
                      isComplete
                        ? "text-success-foreground"
                        : isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                    style={{ fontWeight: isComplete || isCurrent ? 500 : 400 }}
                  >
                    {step.label}
                  </span>
                  {(isComplete || isCurrent) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
                {isComplete && (
                  <Check className="w-4 h-4 text-success shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Next Steps (after complete) ──── */}
      {allDone && (
        <>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
                Nächste Schritte
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                "Erstassessment durch PDL planen",
                "Einsatzplanung in MedLink konfigurieren",
                "Schlüsselübergabe organisieren",
                "Medikamentenplan mit Hausarzt abstimmen",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30"
                >
                  <div className="w-5 h-5 rounded-md bg-primary-light flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-primary" style={{ fontWeight: 700 }}>
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-[12px] text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onGoToDashboard}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[14px] bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all"
              style={{ fontWeight: 600 }}
            >
              Zum Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onStartNewMandat}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[14px] border border-border bg-card text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Neues Mandat eröffnen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
