import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

/* ══════════════════════════════════════════
   SHARED TYPES & HELPERS
   ══════════════════════════════════════════ */

export interface ListenKontext {
  seite: string;
  totalCount: number;
  byStatus: Record<string, number>;
  highlights: string[];
}

export interface DetailKontext {
  mandatId: string;
  patientenName: string;
  angehoerigeName: string;
  aufenthaltsstatus: string;
  erfasstePflichtfelder: { erfuellt: number; gesamt: number };
  offeneCompliance: string[];
  tageSeitStart: number;
  completedSteps: number;
  totalSteps: number;
  isBlocked: boolean;
}

type Props =
  | { context: ListenKontext; detailContext?: never }
  | { context?: never; detailContext: DetailKontext };

function hashKontext(ctx: ListenKontext | DetailKontext): string {
  return JSON.stringify(ctx);
}

function parseMarkers(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\{\{(danger|warning)\}\}(.*?)\{\{\/\1\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const color = match[1] === "danger" ? "var(--status-danger)" : "var(--status-warning-text)";
    parts.push(<span key={match.index} style={{ color, fontWeight: "var(--weight-medium)" }}>{match[2]}</span>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/* ══════════════════════════════════════════
   LIST CONTEXT — mock generation
   ══════════════════════════════════════════ */

function generateMockEinordnung(ctx: ListenKontext): string {
  const { totalCount, byStatus, highlights } = ctx;

  if (totalCount === 0) {
    return `Aktuell kein Mandat im Onboarding. Du kannst eines erstellen, sobald ein neuer Angehöriger startet.`;
  }

  const blocked = byStatus["blockiert"] || 0;
  const parts: string[] = [];

  if (blocked > 0 && highlights.length > 0) {
    parts.push(`${totalCount} Mandate sind aktuell im Onboarding. {{danger}}${blocked === 1 ? "Eines ist blockiert" : `${blocked} sind blockiert`}{{/danger}} – ${highlights[0]}.`);
  } else if (blocked > 0) {
    parts.push(`${totalCount} Mandate im Onboarding. {{danger}}${blocked} blockiert{{/danger}}.`);
  } else {
    parts.push(`${totalCount} Mandate im Onboarding, alle laufen planmässig.`);
  }

  if (highlights.length > 1) {
    parts.push(`{{warning}}${highlights[1]}{{/warning}}.`);
  }

  return parts.join(" ");
}

/* ══════════════════════════════════════════
   DETAIL CONTEXT — mock generation
   ══════════════════════════════════════════ */

function generateDetailEinordnung(ctx: DetailKontext): string {
  const { patientenName, angehoerigeName, aufenthaltsstatus, offeneCompliance, tageSeitStart, completedSteps, totalSteps, isBlocked } = ctx;

  const parts: string[] = [];

  // Sentence 1: Who is who + status
  if (completedSteps === 0) {
    parts.push(`${patientenName}, frisches Onboarding mit ${angehoerigeName} als Angehörige. Beginne mit den Personalien.`);
  } else if (completedSteps === totalSteps) {
    parts.push(`Alle Daten für ${patientenName} sind erfasst.`);
  } else {
    parts.push(`${patientenName}: ${completedSteps} von ${totalSteps} Schritten abgeschlossen, ${angehoerigeName} ist die Angehörige.`);
  }

  // Sentence 2: Compliance issues
  if (isBlocked && tageSeitStart > 14) {
    parts.push(`Onboarding ist seit {{danger}}${tageSeitStart} Tagen blockiert{{/danger}} – die Spezialbewilligung wurde noch nicht eingereicht.`);
  } else if (aufenthaltsstatus === "B" && offeneCompliance.length > 0) {
    parts.push(`{{warning}}Aufenthaltsstatus B{{/warning}} – ${offeneCompliance[0]}.`);
  } else if (offeneCompliance.length > 0) {
    // Non-B compliance issue
    const issue = offeneCompliance[0];
    if (issue.toLowerCase().includes("arbeitsvertrag")) {
      parts.push(`Der {{warning}}${issue}{{/warning}} – das ist die letzte Hürde.`);
    } else {
      parts.push(`{{warning}}${issue}{{/warning}}.`);
    }
  } else if (completedSteps === totalSteps) {
    parts.push(`Bereit zum Abschluss.`);
  }

  return parts.join(" ");
}

function generateDetailFallback(ctx: DetailKontext): string {
  const { patientenName, tageSeitStart, erfasstePflichtfelder, offeneCompliance } = ctx;
  let text = `${patientenName}: ${tageSeitStart} Tage offen, ${erfasstePflichtfelder.erfuellt}/${erfasstePflichtfelder.gesamt} Pflichtfelder erfasst`;
  if (offeneCompliance.length > 0) {
    text += `, blockiert: ${offeneCompliance[0]}`;
  }
  return text;
}

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function AnnaListenEinordnung(props: Props) {
  const isDetail = !!props.detailContext;
  const ctx = props.context ?? props.detailContext!;

  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [displayed, setDisplayed] = useState("");
  // Compute a stable cache key and data hash for dependency tracking
  const cacheId = isDetail
    ? `anna_detail_${(ctx as DetailKontext).mandatId}`
    : `anna_einordnung_${(ctx as ListenKontext).seite}`;
  const dataHash = hashKontext(ctx);

  useEffect(() => {
    // Check session cache
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

    // Simulate LLM call
    const timer = setTimeout(() => {
      const generated = isDetail
        ? generateDetailEinordnung(ctx as DetailKontext)
        : generateMockEinordnung(ctx as ListenKontext);
      setText(generated);

      // Save to session cache
      sessionStorage.setItem(cacheId, JSON.stringify({ hash: dataHash, text: generated }));
    }, 800);

    return () => clearTimeout(timer);
  }, [cacheId, dataHash]);

  // Streaming effect
  useEffect(() => {
    if (!text || !streaming) return;
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setStreaming(false);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="flex" style={{ gap: 10, maxWidth: 760 }}>
      {/* Avatar */}
      <div className="shrink-0 flex items-center justify-center" style={{
        width: 24, height: 24, marginTop: 1,
        borderRadius: "var(--radius-pill)",
        background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
      }}>
        <Sparkles style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />
      </div>

      {/* Text */}
      <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.6, minHeight: 24 }}>
        {streaming && !displayed && (
          <div className="flex items-center" style={{ gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-full" style={{ width: 5, height: 5, background: "var(--brand-primary)", animation: `anna-dots 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
            <style>{`@keyframes anna-dots { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        )}
        {displayed && parseMarkers(displayed)}
      </div>
    </div>
  );
}
