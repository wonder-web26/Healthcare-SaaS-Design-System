/**
 * GlobalRecordingBar — Persistent bar with three states:
 * 1. Recording: red pulsing dot, timer, stop button
 * 2. Processing: spinner, "wird verarbeitet"
 * 3. Result: green summary, expandable details, dismiss
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { Mic, Square, Loader2, CheckCircle2, ChevronDown, ChevronUp, X, FileText, Headphones } from "lucide-react";
import { useRecording, formatRecordingTime } from "./RecordingContext";
import { toast } from "sonner";

export function GlobalRecordingBar() {
  const { phase, session, elapsedMs, result, stopRecording, dismissResult } = useRecording();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (phase === "idle") return null;

  // ─── Recording state ───
  if (phase === "recording") {
    return (
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(168, 50, 31, 0.08)", borderBottom: "2px solid var(--status-danger)", padding: "8px 16px" }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--status-danger)", animation: "rec-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
            <style>{`@keyframes rec-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
            <Mic style={{ width: 14, height: 14, color: "var(--status-danger)" }} />
            <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Aufnahme läuft</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>— {session?.patientName}</span>
            <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", fontFamily: "monospace", minWidth: 42 }}>{formatRecordingTime(elapsedMs)}</span>
          </div>
          <button onClick={stopRecording} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "5px 14px", borderRadius: "var(--radius-pill)", background: "var(--status-danger)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}>
            <Square style={{ width: 10, height: 10 }} /> Aufnahme beenden
          </button>
        </div>
      </div>
    );
  }

  // ─── Processing state ───
  if (phase === "processing") {
    return (
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--status-warning-bg)", borderBottom: "2px solid var(--status-warning)", padding: "8px 16px" }}>
        <div className="flex items-center" style={{ maxWidth: 1200, margin: "0 auto", gap: 10 }}>
          <Loader2 style={{ width: 14, height: 14, color: "var(--status-warning)", animation: "rec-spin 1s linear infinite" }} />
          <style>{`@keyframes rec-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Gespräch wird verarbeitet…</span>
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>— {session?.patientName}</span>
        </div>
      </div>
    );
  }

  // ─── Result state ───
  if (phase === "result" && result) {
    return (
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(31, 92, 77, 0.06)", borderBottom: "2px solid var(--status-success)", padding: 0 }}>
        {/* Compact summary row */}
        <div
          className="flex items-center justify-between cursor-pointer"
          style={{ padding: "8px 16px", maxWidth: 1200, margin: "0 auto" }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: "var(--status-success)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Gespräch verarbeitet</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>— {result.patientName}</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>·</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{result.interrai.itemCount} Items</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>·</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{result.pflege.diagnosenCount} Diagnosen</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>·</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{result.klv.positionenCount} KLV-Pos.</span>
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2 }}>
              {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            </button>
            <button onClick={e => { e.stopPropagation(); dismissResult(); }} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2 }} title="Schliessen">
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ padding: "0 16px 12px", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
              {/* InterRAI card */}
              <div
                onClick={() => { if (result.patientId) navigate(`/patienten/${result.patientId}?tab=interrai`); }}
                className="cursor-pointer"
                style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--brand-primary)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>InterRAI</span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--brand-primary)" }}>Öffnen →</span>
                </div>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{result.interrai.itemCount} Items in {result.interrai.sektionCount} Sektionen erkannt</div>
              </div>

              {/* Pflegeplanung card */}
              <div
                onClick={() => { if (result.patientId) navigate(`/patienten/${result.patientId}?tab=pflegeplanung`); }}
                className="cursor-pointer"
                style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--brand-primary)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Pflegeplanung</span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--brand-primary)" }}>Öffnen →</span>
                </div>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{result.pflege.diagnosenCount} Diagnosen · {result.pflege.massnahmenCount} Massnahmen · {result.pflege.zieleCount} Ziele</div>
              </div>

              {/* KLV card */}
              <div
                onClick={() => { if (result.patientId) navigate(`/patienten/${result.patientId}?tab=klv`); }}
                className="cursor-pointer"
                style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--brand-primary)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>KLV</span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--brand-primary)" }}>Öffnen →</span>
                </div>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{result.klv.positionenCount} Positionen · {result.klv.hProWoche.toFixed(2)} h/Wo. (a:{result.klv.katA} b:{result.klv.katB} c:{result.klv.katC})</div>
              </div>
            </div>

            {/* Aufnahme / Transkript */}
            <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
              <button onClick={() => toast("Demo — keine echte Aufnahme vorhanden")} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                <Headphones style={{ width: 12, height: 12 }} /> MP3 abspielen
              </button>
              <button onClick={() => toast("Demo — kein echtes Transkript vorhanden")} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                <FileText style={{ width: 12, height: 12 }} /> Transkript anzeigen
              </button>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{result.datum} · {formatRecordingTime(result.durationMs)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
