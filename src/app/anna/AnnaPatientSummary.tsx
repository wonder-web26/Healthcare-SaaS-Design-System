import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useCurrentRole } from "../auth";
import type { Patient } from "../components/patientData";
import { tageBisReAssessment } from "../../lib/patienten/store";

function parseMarkers(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\{\{(danger|warning)\}\}(.*?)\{\{\/\1\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const color = match[1] === "danger" ? "var(--status-danger)" : "var(--status-warning-text)";
    parts.push(<span key={match.index} style={{ color, fontWeight: "var(--weight-medium)" }}>{match[2]}</span>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function generatePatientSummary(p: Patient): string {
  const parts: string[] = [];

  // Sentence 1: Demographics
  const age = p.geburtsdatum ? (() => {
    const [d, m, y] = p.geburtsdatum.split(".");
    return Math.floor((new Date("2026-03-03").getTime() - new Date(+y, +m - 1, +d).getTime()) / 31557600000);
  })() : null;

  const sgLabel = p.schweregrad === "kritisch" ? "Kritisch" : p.schweregrad === "schwer" ? "Schwer" : p.schweregrad === "mittel" ? "Mittel" : "Leicht";
  parts.push(`${p.nachname}, ${p.vorname}${age ? ` (${age} Jahre)` : ""}, Schweregrad „${sgLabel}", ${p.leistungsart}.`);

  // Sentence 2: Current state
  if (p.status === "nicht_abrechenbar") {
    parts.push(`{{danger}}Aktuell nicht abrechenbar${p.abrechnungsstoppGrund ? ` – ${p.abrechnungsstoppGrund}` : ""}.{{/danger}}`);
  } else if (p.pflegefachkraft === "—") {
    parts.push(`{{warning}}Noch keiner Pflegefachperson zugewiesen.{{/warning}}`);
  } else {
    parts.push(`Zugewiesen an ${p.pflegefachkraft}.`);
  }

  // Sentence 3: Operative triggers
  if (p.prozessStatus?.ueberfaellig) {
    parts.push(`{{danger}}${p.prozessStatus.naechsteAufgabe} ist überfällig (fällig ${p.prozessStatus.faelligDatum}).{{/danger}}`);
  } else if (p.prozessStatus) {
    parts.push(`Nächste Aufgabe: ${p.prozessStatus.naechsteAufgabe}, fällig am ${p.prozessStatus.faelligDatum}.`);
  }

  // Sentence 4: Re-assessment
  const reAssessmentTage = tageBisReAssessment(p);
  if (reAssessmentTage !== null) {
    if (reAssessmentTage <= 0) {
      parts.push(`{{danger}}Re-Assessment überfällig.{{/danger}}`);
    } else if (reAssessmentTage <= 14) {
      parts.push(`{{warning}}Re-Assessment in ${reAssessmentTage} Tagen fällig.{{/warning}}`);
    }
  }

  return parts.join(" ");
}

interface Props {
  patient: Patient;
}

export function AnnaPatientSummary({ patient }: Props) {
  const role = useCurrentRole();
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [displayed, setDisplayed] = useState("");

  const cacheId = `anna_patient_${patient.id}`;
  const dataHash = JSON.stringify({ id: patient.id, status: patient.status, schweregrad: patient.schweregrad, role });

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheId);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.hash === dataHash) {
          setText(parsed.text);
          setDisplayed(parsed.text);
          setStreaming(false);
          return;
        }
      } catch {}
    }

    setText("");
    setDisplayed("");
    setStreaming(true);

    const timer = setTimeout(() => {
      const generated = generatePatientSummary(patient);
      setText(generated);
      sessionStorage.setItem(cacheId, JSON.stringify({ hash: dataHash, text: generated }));
    }, 600);

    return () => clearTimeout(timer);
  }, [cacheId, dataHash]);

  useEffect(() => {
    if (!text || !streaming) return;
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setStreaming(false); }
    }, 14);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div style={{
      background: "linear-gradient(135deg, var(--brand-primary-light), var(--brand-accent-light))",
      border: "var(--border-thin) solid rgba(31,92,77,0.3)",
      borderRadius: "var(--radius-card)",
      padding: "16px 20px",
    }}>
      <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
        <div className="shrink-0 flex items-center justify-center" style={{
          width: 28, height: 28, borderRadius: "var(--radius-pill)",
          background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
        }}>
          <Sparkles style={{ width: 13, height: 13, color: "var(--text-on-dark)" }} />
        </div>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)" }}>
          Patient-Zusammenfassung
        </span>
      </div>
      <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.6, minHeight: 20 }}>
        {streaming && !displayed && (
          <div className="flex items-center" style={{ gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", animation: `anna-dots 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
            <style>{`@keyframes anna-dots { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        )}
        {displayed && parseMarkers(displayed)}
      </div>
    </div>
  );
}
