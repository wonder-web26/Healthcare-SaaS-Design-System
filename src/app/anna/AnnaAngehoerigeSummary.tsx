import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useCurrentRole } from "../auth";
import type { Angehoeriger } from "../components/angehoerigeData";

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

interface DetailData {
  funktion?: string;
  eintrittsdatum?: string;
  stundenlohn?: string;
  aufenthaltsstatus?: string;
  srkStatus?: "abgeschlossen" | "offen" | "ueberfaellig";
  srkDeadline?: string;
}

function generateSummary(a: Angehoeriger, detail?: DetailData): string {
  const parts: string[] = [];
  const patientName = a.zugeordnetePatientenList[0]?.name || "–";

  // Sentence 1: Demographics + context
  parts.push(`${a.nachname}, ${a.vorname}, ${detail?.funktion || "Pflegende/r Angehörige/r"} für ${patientName} seit ${detail?.eintrittsdatum || "–"}.`);

  // Sentence 2: HR status
  const statusParts: string[] = [];
  if (detail?.aufenthaltsstatus && detail.aufenthaltsstatus !== "—" && detail.aufenthaltsstatus !== "Schweizer/in") {
    statusParts.push(`{{warning}}${detail.aufenthaltsstatus}{{/warning}}`);
  }
  if (detail?.stundenlohn) statusParts.push(`CHF ${detail.stundenlohn}/h`);
  if (detail?.srkStatus === "abgeschlossen") statusParts.push("SRK abgeschlossen ✓");
  if (statusParts.length > 0) parts.push(statusParts.join(", ") + ".");

  // Sentence 3: Compliance triggers
  if (detail?.srkStatus === "ueberfaellig") {
    parts.push(`{{danger}}SRK-Schulung überfällig (Frist ${detail.srkDeadline || "–"}).{{/danger}}`);
  } else if (detail?.srkStatus === "offen") {
    parts.push(`{{warning}}SRK-Schulung noch ausstehend, Frist am ${detail.srkDeadline || "–"}.{{/warning}}`);
  }

  // Sentence 4: HR-Check
  const hrIssues: string[] = [];
  if (!a.hrCheck.bankdaten) hrIssues.push("Bankdaten fehlen");
  if (!a.hrCheck.kinderzulagen) hrIssues.push("Kinderzulagen unklar");
  if (a.hrCheck.quellensteuerTarif === null) hrIssues.push("QS-Tarif offen");
  if (hrIssues.length > 0) parts.push(`{{warning}}HR-Check: ${hrIssues.join(", ")}.{{/warning}}`);

  // Stempeltage
  const pct = a.stempelSoll > 0 ? Math.round((a.stempelTage / a.stempelSoll) * 100) : 100;
  if (pct < 80) parts.push(`${a.stempelTage} von ${a.stempelSoll} Stempeltagen erfasst.`);

  return parts.join(" ");
}

interface Props {
  angehoeriger: Angehoeriger;
  detail?: DetailData;
}

export function AnnaAngehoerigeSummary({ angehoeriger, detail }: Props) {
  const role = useCurrentRole();
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [displayed, setDisplayed] = useState("");

  const cacheId = `anna_angehoerige_${angehoeriger.id}`;
  const dataHash = JSON.stringify({ id: angehoeriger.id, status: angehoeriger.status, srkStatus: detail?.srkStatus, role });

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheId);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.hash === dataHash) { setText(parsed.text); setDisplayed(parsed.text); setStreaming(false); return; }
      } catch {}
    }
    setText(""); setDisplayed(""); setStreaming(true);
    const timer = setTimeout(() => {
      const generated = generateSummary(angehoeriger, detail);
      setText(generated);
      sessionStorage.setItem(cacheId, JSON.stringify({ hash: dataHash, text: generated }));
    }, 600);
    return () => clearTimeout(timer);
  }, [cacheId, dataHash]);

  useEffect(() => {
    if (!text || !streaming) return;
    let i = 0; setDisplayed("");
    const interval = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) { clearInterval(interval); setStreaming(false); } }, 14);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div style={{
      background: "linear-gradient(135deg, var(--brand-primary-light), var(--brand-accent-light))",
      border: "var(--border-thin) solid rgba(31,92,77,0.3)",
      borderRadius: "var(--radius-card)", padding: "16px 20px",
    }}>
      <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
        <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
          <Sparkles style={{ width: 13, height: 13, color: "var(--text-on-dark)" }} />
        </div>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)" }}>HR-Zusammenfassung</span>
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
