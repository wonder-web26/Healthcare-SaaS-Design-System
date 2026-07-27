/**
 * Global Recording Context — manages background conversation recording
 * across the entire app. The recording is bound to a person and assessment,
 * persists while navigating between pages, and survives any route change.
 *
 * After stopping, the pre-built demo suggestions are revealed on the
 * assessment (vorschlaegeVerfuegbar flag). No real speech recognition —
 * the conversation data is a fixed demo dataset.
 */
import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate, type NavigateFunction } from "react-router";
import { toast } from "sonner";
import { revealVorschlaege } from "../../lib/interrai/store";

/* ── Types ─────────────────────────── */

export type RecordingPhase = "idle" | "recording" | "processing";

export interface RecordingSession {
  personId: string;
  assessmentId: string;
  personName: string;
  startedAt: number;
}

interface RecordingContextValue {
  phase: RecordingPhase;
  session: RecordingSession | null;
  elapsedMs: number;
  startRecording: (personId: string, assessmentId: string, personName: string) => void;
  stopRecording: () => void;
}

const RecordingCtx = createContext<RecordingContextValue | null>(null);

export function useRecording(): RecordingContextValue {
  const ctx = useContext(RecordingCtx);
  if (!ctx) throw new Error("useRecording must be used within RecordingProvider");
  return ctx;
}

/* ── Provider ──────────────────────── */

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateRef = useRef<NavigateFunction | null>(null);

  // Elapsed-time timer — runs only during recording phase
  useEffect(() => {
    if (phase === "recording") {
      timerRef.current = setInterval(() => setElapsedMs((ms) => ms + 1000), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const startRecording = useCallback(
    (personId: string, assessmentId: string, personName: string) => {
      if (phase !== "idle") return;
      setSession({ personId, assessmentId, personName, startedAt: Date.now() });
      setElapsedMs(0);
      setPhase("recording");
    },
    [phase],
  );

  const stopRecording = useCallback(() => {
    if (phase !== "recording" || !session) return;
    setPhase("processing");

    // Simulate processing delay, then reveal suggestions
    setTimeout(() => {
      revealVorschlaege(session.assessmentId);
      toast("Vorschläge verfügbar — prüfen Sie die Ergebnisse in der Zustandsansicht.");
      setPhase("idle");
      setSession(null);
      setElapsedMs(0);
    }, 2000);
  }, [phase, session]);

  const value: RecordingContextValue = {
    phase,
    session,
    elapsedMs,
    startRecording,
    stopRecording,
  };

  return (
    <RecordingCtx.Provider value={value}>
      <NavigateBridge ref={navigateRef} />
      {children}
    </RecordingCtx.Provider>
  );
}

/* ── NavigateBridge — captures useNavigate inside Router ── */
import { forwardRef, useImperativeHandle } from "react";

const NavigateBridge = forwardRef<NavigateFunction | null>(function NavigateBridge(_, ref) {
  const navigate = useNavigate();
  useImperativeHandle(ref, () => navigate, [navigate]);
  return null;
});

/* ── Format helper ──────────────────── */
export function formatRecordingTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
