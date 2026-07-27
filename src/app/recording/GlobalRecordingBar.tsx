/**
 * Global recording bar — shows recording/processing state across all pages.
 * Sits between AppTopbar and the content area. Renders null when idle.
 */
import { Mic, Loader2, Square } from "lucide-react";
import { useRecording, formatRecordingTime } from "./RecordingContext";

export function GlobalRecordingBar() {
  const { phase, session, elapsedMs, stopRecording } = useRecording();

  if (phase === "idle") return null;

  // ── Recording ───────────────────────────────────────────────────────────
  if (phase === "recording" && session) {
    return (
      <div
        style={{
          position: "sticky", top: 0, zIndex: 40,
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 20px",
          background: "rgba(168, 50, 31, 0.06)",
          borderBottom: "2px solid var(--status-danger)",
          fontSize: 13,
        }}
      >
        {/* Pulsing dot */}
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--status-danger)",
          animation: "pulse 1.5s ease-in-out infinite",
          flexShrink: 0,
        }} />
        <Mic style={{ width: 14, height: 14, color: "var(--status-danger)", flexShrink: 0 }} />
        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
          Aufnahme läuft
        </span>
        <span style={{ color: "var(--text-secondary)" }}>
          {session.personName}
        </span>
        <span style={{
          fontFamily: "monospace", fontSize: 12,
          color: "var(--text-secondary)", minWidth: 42,
        }}>
          {formatRecordingTime(elapsedMs)}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={stopRecording}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 14px", borderRadius: 999,
            background: "var(--status-danger)", color: "#fff",
            border: "none", fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <Square style={{ width: 10, height: 10 }} />
          Beenden
        </button>
      </div>
    );
  }

  // ── Processing ──────────────────────────────────────────────────────────
  if (phase === "processing") {
    return (
      <div
        style={{
          position: "sticky", top: 0, zIndex: 40,
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 20px",
          background: "rgba(180, 140, 20, 0.06)",
          borderBottom: "2px solid var(--status-warning, #e5a100)",
          fontSize: 13,
        }}
      >
        <Loader2 style={{
          width: 14, height: 14,
          color: "var(--status-warning-text)",
          animation: "spin 1s linear infinite",
        }} />
        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
          Gespräch wird verarbeitet…
        </span>
      </div>
    );
  }

  return null;
}
