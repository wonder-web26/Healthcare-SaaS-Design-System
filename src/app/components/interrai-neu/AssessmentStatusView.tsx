/**
 * Assessment status view — shared component for embedding in tabs.
 *
 * Shows existing assessments for a person with status, open fields, and
 * last-edited timestamp. Provides buttons to continue, start recording,
 * or review suggestions. No own scroll region — fits inside its parent tab.
 */

import { useNavigate } from "react-router";
import { ClipboardList, Play, Plus, CheckCircle2, AlertTriangle, Search, MessageSquare } from "lucide-react";
import {
  type Person,
  getAssessmentsForPerson,
  getOpenFieldCount,
  getActiveFieldCount,
  getAnlassLabel,
  getStatusLabel,
  formatDateTime,
  createAssessment,
  klassifiziereVorschlaege,
} from "../../../lib/interrai/store";

interface AssessmentStatusViewProps {
  person: Person;
  /** Encoded return path for the assessment screen */
  returnTo: string;
}

export function AssessmentStatusView({ person, returnTo }: AssessmentStatusViewProps) {
  const navigate = useNavigate();
  const assessments = getAssessmentsForPerson(person.id);

  const handleOpen = (assessmentId: string, scrollToSuggestion?: boolean) => {
    const base = `/interrai-neu/${assessmentId}?returnTo=${encodeURIComponent(returnTo)}`;
    navigate(scrollToSuggestion ? base + "&scrollToSuggestion=1" : base);
  };

  const handleStartNew = () => {
    const a = createAssessment(person.id, assessments.length === 0 ? "erstabklaerung" : "re_assessment");
    handleOpen(a.id);
  };

  if (assessments.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <ClipboardList style={{ width: 32, height: 32, color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          Noch keine interRAI-Abklärung vorhanden.
        </div>
        <button
          type="button"
          onClick={handleStartNew}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            background: "var(--brand-primary)", color: "#fff",
            border: "none", fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Erstabklärung starten
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Assessment list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {assessments.map((a) => {
          const openFields = getOpenFieldCount(a);
          const activeFields = getActiveFieldCount(a);
          const filledFields = activeFields - openFields;
          const isComplete = a.status === "abgeschlossen";
          const vorschlaegeCount = Object.keys(a.vorschlaege).length;
          const hasVorschlaege = a.vorschlaegeVerfuegbar && vorschlaegeCount > 0;
          const classification = hasVorschlaege ? klassifiziereVorschlaege(a) : null;
          const abweichungCount = classification?.abweichungen.length ?? 0;

          return (
            <div key={a.id} style={{
              border: "0.5px solid var(--border-default)",
              borderRadius: 8,
              overflow: "hidden",
            }}>
              {/* Assessment row */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  background: "var(--bg-elevated)",
                }}
              >
                {/* Status indicator */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: isComplete ? "var(--status-success)" : "var(--status-warning, #e5a100)",
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {getAnlassLabel(a.anlass)}
                    <span style={{ fontWeight: 400, color: "var(--text-tertiary)", marginLeft: 8, fontSize: 12 }}>
                      {getStatusLabel(a.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                    {isComplete
                      ? `Abgeschlossen am ${a.abgeschlossenAm ? formatDateTime(a.abgeschlossenAm) : formatDateTime(a.zuletztBearbeitetAm)} · ${a.abgeschlossenVon ?? ""}`
                      : `${openFields} offen · ${filledFields}/${activeFields} erfasst · Zuletzt ${formatDateTime(a.zuletztBearbeitetAm)}`
                    }
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!isComplete && (
                    <button
                      type="button"
                      onClick={() => handleOpen(a.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 12px", borderRadius: 6,
                        background: "var(--brand-primary)", color: "#fff",
                        border: "none", fontSize: 12, fontWeight: 500,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <Play style={{ width: 12, height: 12 }} />
                      Fortsetzen
                    </button>
                  )}
                  {isComplete && (
                    <CheckCircle2 style={{ width: 16, height: 16, color: "var(--status-success)" }} />
                  )}
                </div>
              </div>

              {/* Conversation origin + suggestion hint */}
              {hasVorschlaege && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px",
                    background: abweichungCount > 0 ? "rgba(180, 140, 20, 0.06)" : "rgba(31, 92, 77, 0.04)",
                    borderTop: "0.5px solid var(--border-default)",
                  }}
                >
                  <MessageSquare style={{ width: 13, height: 13, color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>
                    {vorschlaegeCount} Vorschläge aus Gespräch vom {formatDateTime(a.erstelltAm).split(" ")[0]}
                    {abweichungCount > 0 && (
                      <span style={{ color: "var(--status-warning-text)", fontWeight: 500 }}>
                        {" "}· {abweichungCount} {abweichungCount === 1 ? "Abweichung" : "Abweichungen"}
                      </span>
                    )}
                  </span>
                  {/* Herkunft statt Aktion: leads into the form at the first
                      unconfirmed suggestion — there is no separate review view. */}
                  <button
                    type="button"
                    onClick={() => handleOpen(a.id, true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 6,
                      background: "var(--bg-elevated)", color: "var(--text-primary)",
                      border: "0.5px solid var(--border-default)",
                      fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Im Formular prüfen
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start new */}
      <button
        type="button"
        onClick={handleStartNew}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 6,
          background: "transparent", color: "var(--text-secondary)",
          border: "0.5px solid var(--border-default)",
          fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <Plus style={{ width: 12, height: 12 }} />
        Neue Abklärung starten
      </button>
    </div>
  );
}
