import { useParams, useNavigate } from "react-router";
import { MOCK_ASSESSMENTS, DEMO_CAPS, DEMO_SCALES } from "../../../lib/mocks/klinische-artefakte-mock";
import { SEKTIONEN, getArtefaktContainer } from "../../../types/klinische-artefakte";
import { getAntwortText } from "../../../lib/interrai/helpers";
import { Arbeitsbereich } from "./Arbeitsbereich";
import { ArrowLeft, CheckCircle2, AlertTriangle, Target, FileText, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function InterRAIDetailPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const assessment = MOCK_ASSESSMENTS.find(a => a.id === assessmentId);
  if (!assessment) {
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Assessment nicht gefunden</div>
        <button onClick={() => navigate("/interrai")} className="inline-flex items-center cursor-pointer" style={{ marginTop: 16, gap: 8, padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Zurück
        </button>
      </div>
    );
  }

  // In-progress: full Arbeitsbereich
  if (assessment.status === "in-bearbeitung") {
    return (
      <Arbeitsbereich
        assessmentId={assessment.id}
        patientName={assessment.patientName}
        typ={assessment.typ}
        startDatum={assessment.startDatum}
        initialItems={assessment.items}
        onboardingId={assessment.onboardingId}
      />
    );
  }

  // Completed: read-only
  const container = getArtefaktContainer(assessment);
  const caps = assessment.getriggerteCaps;
  const scales = assessment.outcomeScales;
  const sectionItems = SEKTIONEN.map(s => ({ ...s, items: assessment.items.filter(i => i.sektion === s.id) })).filter(s => s.items.length > 0);

  return (
    <div className="h-full overflow-y-auto">
      <style>{`.ba-d-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); } @media (min-width: 640px) { .ba-d-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }`}</style>
      <div className="ba-d-pad" style={{ paddingTop: "var(--space-4)", paddingBottom: "var(--space-8)" }}>
        <button onClick={() => navigate("/interrai")} className="inline-flex items-center cursor-pointer" style={{ gap: 6, background: "transparent", border: "none", color: "var(--brand-primary)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", marginBottom: 16 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Zurück
        </button>

        {/* Header */}
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "20px 24px", marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{assessment.patientName}</h1>
            <span style={{ padding: "2px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)" }}>Abgeschlossen</span>
          </div>
          <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            <span>{assessment.typ === "erstassessment" ? "Erstassessment" : "Re-Assessment"}</span>
            <span>·</span><span>{assessment.durchgefuehrtVon}</span>
            <span>·</span><span>{assessment.startDatum}</span>
            {container === "konvertiert" && <span style={{ padding: "1px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", background: "var(--status-info-bg)", color: "var(--status-info)" }}>aus Onboarding</span>}
          </div>
        </div>

        {/* Scales */}
        {scales.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Outcome-Scales</div>
            <div className="grid grid-cols-2 lg:grid-cols-3" style={{ gap: 8 }}>
              {scales.map(s => {
                const pct = s.maxWert > 0 ? s.wert / s.maxWert : 0;
                const color = s.richtung === "hoeher-schlechter" ? (pct > 0.5 ? "var(--status-danger)" : pct > 0.25 ? "var(--status-warning)" : "var(--status-success)") : (pct > 0.5 ? "var(--status-success)" : "var(--status-warning)");
                return (
                  <div key={s.id} style={{ padding: "12px 16px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>{s.name}</div>
                    <div className="flex items-end" style={{ gap: 4, marginTop: 4 }}><span style={{ fontSize: 20, fontWeight: "var(--weight-medium)", color }}>{s.wert}</span><span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>/{s.maxWert}</span></div>
                    <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(5, pct * 100)}%`, background: color, borderRadius: "var(--radius-pill)" }} /></div>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 4 }}>{s.interpretation}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CAPs */}
        {caps.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Getriggerte CAPs ({caps.length})</div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {caps.map(cap => (
                <div key={cap.id} style={{ padding: "14px 18px", background: cap.prioritaet === "hoch" ? "rgba(168,50,31,0.04)" : "var(--bg-elevated)", border: `var(--border-thin) solid ${cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--border-default)"}`, borderRadius: "var(--radius-card)" }}>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                    <AlertTriangle style={{ width: 14, height: 14, color: cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--status-warning)" }} />
                    <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{cap.name}</span>
                    <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: cap.prioritaet === "hoch" ? "var(--status-danger-bg)" : "var(--status-warning-bg)", color: cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--status-warning-text)" }}>{cap.prioritaet === "hoch" ? "Hoch" : "Mittel"}</span>
                  </div>
                  <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.5 }}>{cap.beschreibung}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items by section */}
        {sectionItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Erfasste Items ({assessment.items.length})</div>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {sectionItems.map(s => (
                <div key={s.id} style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 4 }}>Sektion {s.id} – {s.name}</div>
                  {s.items.map(item => (
                    <div key={item.id} className="flex items-center" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "2px 0", gap: 6 }}>
                      <span style={{ padding: "0 5px", borderRadius: 3, fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>{item.code}</span>
                      <span style={{ color: "var(--text-primary)" }}>{item.frageKurz}:</span>
                      <span>{getAntwortText(item) || "–"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 20 }}>
          <button onClick={() => toast("KLV-Export (Demo)")} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 18px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            <FileText style={{ width: 14, height: 14 }} /> KLV-Export
          </button>
          <button onClick={() => toast("HomeCareData (Demo)")} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 18px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>
            An HomeCareData
          </button>
        </div>

        {/* InterRAI HC footer */}
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", borderTop: "var(--border-thin) solid var(--border-default)", paddingTop: 12 }}>
          Folgt dem Schema InterRAI HC Schweiz. Item-Texte sinngemäss formuliert.
        </div>
      </div>
    </div>
  );
}
