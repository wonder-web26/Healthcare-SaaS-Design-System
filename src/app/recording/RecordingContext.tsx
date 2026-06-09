/**
 * Global Recording Context — manages background audio recording state
 * across the entire app. The recording persists while navigating between pages.
 *
 * After stopping, mock artefacts (InterRAI, Pflegeplanung, KLV) are created
 * in-memory for the recorded patient, plus MP3 + Transcript documents.
 */
import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { MOCK_ASSESSMENTS, MOCK_PFLEGEPLANUNGEN, MOCK_KLV_VERORDNUNGEN, DEMO_ITEMS } from "../../lib/mocks/klinische-artefakte-mock";
import { DEMO_GESPRAECH } from "../../lib/mocks/gespraech-demo";
import type { InterRAIAssessment, Pflegeplanung, KLVVerordnung, KLVLeistung, KLVEinheit } from "../../types/klinische-artefakte";

/* ── Types ─────────────────────────── */

type RecordingPhase = "idle" | "recording" | "processing" | "result";

interface RecordingSession {
  patientId: string | null;
  onboardingId: string | null;
  patientName: string;
  startedAt: number;
}

export interface ResultSummary {
  patientName: string;
  patientId: string | null;
  durationMs: number;
  datum: string;
  interrai: { itemCount: number; sektionCount: number };
  pflege: { diagnosenCount: number; massnahmenCount: number; zieleCount: number };
  klv: { positionenCount: number; hProWoche: number; katA: number; katB: number; katC: number };
}

interface RecordingContextValue {
  phase: RecordingPhase;
  session: RecordingSession | null;
  elapsedMs: number;
  result: ResultSummary | null;
  startRecording: (patientId: string | null, patientName: string, onboardingId?: string | null) => void;
  stopRecording: () => void;
  dismissResult: () => void;
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
  const [result, setResult] = useState<ResultSummary | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  // Timer
  useEffect(() => {
    if (phase === "recording") {
      timerRef.current = setInterval(() => setElapsedMs(ms => ms + 1000), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startRecording = useCallback((patientId: string | null, patientName: string, onboardingId?: string | null) => {
    if (phase !== "idle" && phase !== "result") return;
    setResult(null);
    setSession({ patientId, onboardingId: onboardingId || null, patientName, startedAt: Date.now() });
    setElapsedMs(0);
    setPhase("recording");
  }, [phase]);

  const stopRecording = useCallback(() => {
    if (phase !== "recording" || !session) return;
    const duration = elapsedMs;
    setPhase("processing");

    setTimeout(() => {
      const summary = createMockArtefacts(session.patientId, session.onboardingId, session.patientName);
      setResult({ ...summary, patientName: session.patientName, patientId: session.patientId, durationMs: duration, datum: new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) });
      setPhase("result");

      // Navigate to patient detail if from patient context
      if (navigateRef.current && session.patientId) {
        navigateRef.current(`/patienten/${session.patientId}?tab=interrai`);
      }
    }, 2500);
  }, [phase, session, elapsedMs]);

  const dismissResult = useCallback(() => {
    setPhase("idle");
    setSession(null);
    setResult(null);
    setElapsedMs(0);
  }, []);

  const value: RecordingContextValue = { phase, session, elapsedMs, result, startRecording, stopRecording, dismissResult };

  return (
    <RecordingCtx.Provider value={value}>
      <NavigateBridge ref={navigateRef} />
      {children}
    </RecordingCtx.Provider>
  );
}

/* ── NavigateBridge — captures useNavigate inside Router ── */
import { forwardRef, useImperativeHandle } from "react";

const NavigateBridge = forwardRef<ReturnType<typeof useNavigate> | null>(function NavigateBridge(_, ref) {
  const navigate = useNavigate();
  useImperativeHandle(ref, () => navigate, [navigate]);
  return null;
});

/* ── Mock Artefact Creation from DEMO_GESPRAECH ──────────── */

function parseEinheit(haeufigkeit: string): { einheit: KLVEinheit; anzahl: number } {
  if (haeufigkeit.includes("einmalig")) return { einheit: "e", anzahl: 1 };
  if (haeufigkeit.includes("Monat")) return { einheit: "m", anzahl: parseInt(haeufigkeit) || 1 };
  const match = haeufigkeit.match(/(\d+)x\/Woche/);
  if (match) {
    const tage = parseInt(match[1]);
    return { einheit: (tage === 1 ? "w" : `t${tage}`) as KLVEinheit, anzahl: 1 };
  }
  return { einheit: "w", anzahl: 1 };
}

function createMockArtefacts(patientId: string | null, onboardingId: string | null, patientName: string): Omit<ResultSummary, "patientName" | "patientId" | "durationMs" | "datum"> {
  const ts = Date.now();
  const heute = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const baId = `BA-${ts}`;
  const ppId = `PP-${ts}`;
  const klvId = `KLV-${ts}`;

  // Extract all data from DEMO_GESPRAECH
  const allItemCodes = new Set<string>();
  const allDiagnosen: { nandaCode: string; titel: string; begruendung: string }[] = [];
  const allKLV: { klvNummer: string; bezeichnung: string; kategorie: "a"|"b"|"c"; zeitMin: number; haeufigkeit: string; hProWoche: number }[] = [];
  const seenDiagnosen = new Set<string>();
  const seenKLV = new Set<string>();

  for (const seg of DEMO_GESPRAECH) {
    for (const code of seg.erkannteItems) allItemCodes.add(code);
    for (const d of seg.diagnoseVorschlaege) {
      if (!seenDiagnosen.has(d.nandaCode)) { seenDiagnosen.add(d.nandaCode); allDiagnosen.push(d); }
    }
    for (const k of seg.klvVorschlaege) {
      if (!seenKLV.has(k.klvNummer)) { seenKLV.add(k.klvNummer); allKLV.push(k); }
    }
  }

  // Build InterRAI items from DEMO_ITEMS matching erkannteItems codes
  const erkannteItems = DEMO_ITEMS.filter(i => allItemCodes.has(i.code)).map(i => ({
    ...i,
    id: `item-${i.code}-${baId}`,
    assessmentId: baId,
    validiert: false,
    status: "teilweise" as const,
  }));
  const erfassungsgrad = Math.round((erkannteItems.length / DEMO_ITEMS.length) * 100);

  // --- InterRAI Assessment ---
  const findFn = onboardingId
    ? (a: InterRAIAssessment) => a.onboardingId === onboardingId && a.status === "in-bearbeitung"
    : (a: InterRAIAssessment) => a.patientId === patientId && a.status === "in-bearbeitung";
  const existingBA = MOCK_ASSESSMENTS.find(findFn);

  if (!existingBA) {
    MOCK_ASSESSMENTS.push({
      id: baId,
      onboardingId,
      patientId,
      patientName,
      typ: onboardingId ? "erstassessment" : "re-assessment",
      status: "in-bearbeitung",
      durchgefuehrtVon: "Maria Keller",
      startDatum: heute,
      abschlussDatum: null,
      erfassungsgrad,
      items: erkannteItems,
      getriggerteCaps: [],
      outcomeScales: [],
    });
  }

  // --- Pflegeplanung ---
  const findPP = onboardingId
    ? (p: Pflegeplanung) => p.onboardingId === onboardingId && (p.status === "entwurf" || p.status === "in-bearbeitung")
    : (p: Pflegeplanung) => p.patientId === patientId && (p.status === "entwurf" || p.status === "in-bearbeitung");
  const existingPP = MOCK_PFLEGEPLANUNGEN.find(findPP);

  if (!existingPP && allDiagnosen.length > 0) {
    const diagnosen = allDiagnosen.map((d, i) => ({
      id: `PD-${ts}-${i + 1}`, nandaCode: d.nandaCode, titel: d.titel, bezugCap: null, begruendung: d.begruendung, status: "vorschlag" as const, icdIds: [],
    }));
    MOCK_PFLEGEPLANUNGEN.push({
      id: ppId,
      onboardingId,
      patientId,
      patientName,
      interRAIAssessmentId: existingBA?.id || baId,
      status: "entwurf",
      erstelltVon: "Maria Keller",
      erstellDatum: heute,
      abschlussDatum: null,
      pflegediagnosen: diagnosen,
      massnahmen: diagnosen.map((d, i) => ({
        id: `MA-${ts}-${i + 1}`,
        titel: d.titel === "Sturzgefahr" ? "Sturzprophylaxe-Beratung" : d.titel === "Schlafstörung" ? "Schlafhygiene-Beratung" : "Aktivierung und Tagesstruktur",
        bezugDiagnoseId: d.id,
        beschreibung: `Aus Gespräch abgeleitet: ${d.begruendung.slice(0, 60)}`,
        haeufigkeit: "bei Bedarf",
        status: "vorschlag" as const,
      })),
      ziele: diagnosen.slice(0, 2).map((d, i) => ({
        id: `Z-${ts}-${i + 1}`,
        titel: d.titel === "Sturzgefahr" ? "Sturzfreiheit 3 Monate" : "Stimmung stabilisieren",
        bezugDiagnoseId: d.id,
        zeithorizont: "3 Monate",
        messbar: d.titel === "Sturzgefahr" ? "Kein Sturz bis Re-Assessment" : "Soziale Aktivität 1×/Woche",
        status: "vorschlag" as const,
      })),
    });
  }

  // --- KLV ---
  const findKLV = onboardingId
    ? (k: KLVVerordnung) => k.onboardingId === onboardingId && k.status === "entwurf"
    : (k: KLVVerordnung) => k.patientId === patientId && k.status === "entwurf";
  const existingKLV = MOCK_KLV_VERORDNUNGEN.find(findKLV);

  if (!existingKLV && allKLV.length > 0) {
    MOCK_KLV_VERORDNUNGEN.push({
      id: klvId,
      onboardingId,
      patientId,
      patientName,
      pflegeplanungId: existingPP?.id || ppId,
      status: "entwurf",
      erstelltVon: "Maria Keller",
      erstellDatum: heute,
      beginnDatum: null,
      endDatum: null,
      diagnosen: [],
      leistungspositionen: allKLV.map((k, i) => {
        const { einheit, anzahl } = parseEinheit(k.haeufigkeit);
        return {
          id: `LP-${ts}-${i + 1}`,
          klvNummer: k.klvNummer,
          bezeichnung: k.bezeichnung,
          kategorie: k.kategorie,
          wer: "S" as const,
          training: "N" as const,
          anzahl,
          einheit,
          zeitMin: k.zeitMin,
          ausAnna: true,
          annaKonfidenz: "hoch" as const,
          validiert: false,
          simultanGruppe: null,
          bezugMassnahmeId: null,
          diagnoseIds: [],
          wzwBegruendung: null,
        };
      }),
      zielformulierungen: allDiagnosen.map(d => d.titel),
      arztAngeordnetAm: null,
      krankenkasseGutspracheAm: null,
      ablehnungsgrund: null,
    });
  }

  // Compute h/Wo. for KLV summary
  const klvHTotal = allKLV.reduce((s, k) => {
    const { einheit } = parseEinheit(k.haeufigkeit);
    if (einheit === "e" || einheit === "nB") return s;
    return s + k.hProWoche;
  }, 0);

  return {
    interrai: { itemCount: erkannteItems.length, sektionCount: new Set(erkannteItems.map(i => i.sektion)).size },
    pflege: { diagnosenCount: allDiagnosen.length, massnahmenCount: allDiagnosen.length, zieleCount: Math.min(allDiagnosen.length, 2) },
    klv: { positionenCount: allKLV.length, hProWoche: Math.round(klvHTotal * 100) / 100, katA: allKLV.filter(k => k.kategorie === "a").length, katB: allKLV.filter(k => k.kategorie === "b").length, katC: allKLV.filter(k => k.kategorie === "c").length },
  };
}

/* ── Format helper ──────────────────── */
export function formatRecordingTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
