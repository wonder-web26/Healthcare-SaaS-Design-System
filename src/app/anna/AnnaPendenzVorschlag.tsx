import { useState, useEffect } from "react";
import { Sparkles, ExternalLink, Copy, Download, Mail, Play, CheckCircle2 } from "lucide-react";
import { pendenzTypen, type AnnaAction } from "../../types/pendenz";
import type { UnifiedEntry } from "../../lib/mocks/service-desk-unified";
import { useCurrentRole } from "../auth";
import { toast } from "sonner";

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

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

function fillTemplate(template: string, entry: UnifiedEntry): string {
  const personName = entry.person?.name ?? "–";
  return template
    .replace(/\{personName\}/g, personName)
    .replace(/\{beschreibung\}/g, entry.beschreibung || entry.kontext)
    .replace(/\{vertragsstart\}/g, "15.01.2026")
    .replace(/\{srkFrist\}/g, "15.01.2027")
    .replace(/\{aubZeitraum\}/g, "03.03.–07.03.2026")
    .replace(/\{quellensteuerTarif\}/g, "A")
    .replace(/\{steueramt\}/g, "Kanton Zürich");
}

function generateMockVorschlag(entry: UnifiedEntry): string {
  const typDef = pendenzTypen[entry.pendenzTyp];
  if (typDef?.annaPromptTemplate) {
    let text = fillTemplate(typDef.annaPromptTemplate, entry);
    // Add overdue warning if applicable
    if (entry.faellig) {
      const today = new Date("2026-03-03");
      const due = new Date(entry.faellig);
      const daysOverdue = Math.round((today.getTime() - due.getTime()) / 86400000);
      if (daysOverdue > 0) {
        text += ` {{danger}}Achtung: ${daysOverdue} Tage überfällig.{{/danger}}`;
      }
    }
    return text;
  }
  // Generic fallback for types without specific config
  const personName = entry.person?.name ?? "–";
  return `${typDef?.label || entry.typLabel} für ${personName}. ${entry.kontext}`;
}

function generateCopyData(entry: UnifiedEntry): string {
  const p = entry.person;
  if (!p) return entry.kontext;
  return [
    `Name: ${p.name}`,
    `Pendenz: ${entry.typLabel}`,
    `Kontext: ${entry.kontext}`,
    entry.faellig ? `Fällig: ${entry.faellig}` : null,
    `Status: ${entry.status}`,
  ].filter(Boolean).join("\n");
}

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */

interface Props {
  pendenz: UnifiedEntry;
  onActionExecuted?: (actionId: string) => void;
  onDemoAction?: (mockType: string) => void;
}

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function AnnaPendenzVorschlag({ pendenz, onActionExecuted, onDemoAction }: Props) {
  const role = useCurrentRole();
  const typDef = pendenzTypen[pendenz.pendenzTyp];

  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [displayed, setDisplayed] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const cacheId = `anna_pendenz_${pendenz.id}_${role}`;
  const dataHash = JSON.stringify({ id: pendenz.id, typ: pendenz.pendenzTyp, status: pendenz.status, faellig: pendenz.faellig });

  // Generate / load cached text
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
      const generated = generateMockVorschlag(pendenz);
      setText(generated);
      sessionStorage.setItem(cacheId, JSON.stringify({ hash: dataHash, text: generated }));
    }, 600);

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
    }, 14);
    return () => clearInterval(interval);
  }, [text]);

  // Actions: use type-specific or generic fallback
  const actions: AnnaAction[] = typDef?.defaultActions ?? [
    { id: "take-over", label: "In Bearbeitung nehmen", variant: "primary", type: "internal-action", payload: { action: "set-in-bearbeitung" } },
  ];

  // Only show action buttons after streaming is done (for stage B/C)
  const showActions = !streaming && displayed.length > 0 && typDef?.annaStage !== "A";

  const handleAction = (action: AnnaAction) => {
    switch (action.type) {
      case "open-url": {
        const url = (action.payload as { url: string })?.url;
        if (url) window.open(url, "_blank", "noopener");
        break;
      }
      case "copy-data": {
        const data = generateCopyData(pendenz);
        navigator.clipboard.writeText(data).then(() => {
          setCopySuccess(true);
          toast("In Zwischenablage kopiert");
          setTimeout(() => setCopySuccess(false), 2000);
        });
        break;
      }
      case "download-file": {
        const filename = (action.payload as { filename: string })?.filename || "dokument.txt";
        const content = `Spitex Cockpit – ${typDef?.label || pendenz.typLabel}\n\n${generateCopyData(pendenz)}\n\nGeneriert am 03.03.2026`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast(`${filename} heruntergeladen`);
        break;
      }
      case "open-mailto": {
        const p = action.payload as { to?: string; subject?: string } | undefined;
        const to = p?.to || "";
        const subject = encodeURIComponent((p?.subject || "").replace("{personName}", pendenz.person?.name || ""));
        window.location.href = `mailto:${to}?subject=${subject}`;
        break;
      }
      case "demo-mock": {
        const mockType = (action.payload as { mockType: string })?.mockType || "generic";
        onDemoAction?.(mockType);
        break;
      }
      case "internal-action": {
        toast("Aktion ausgeführt");
        break;
      }
    }
    onActionExecuted?.(action.id);
  };

  const actionIcon = (type: AnnaAction["type"]) => {
    switch (type) {
      case "open-url": return <ExternalLink style={{ width: 13, height: 13 }} />;
      case "copy-data": return copySuccess ? <CheckCircle2 style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />;
      case "download-file": return <Download style={{ width: 13, height: 13 }} />;
      case "open-mailto": return <Mail style={{ width: 13, height: 13 }} />;
      case "demo-mock": return <Sparkles style={{ width: 13, height: 13 }} />;
      default: return <Play style={{ width: 13, height: 13 }} />;
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, var(--brand-primary-light), var(--brand-accent-light))",
      border: "var(--border-thin) solid rgba(31,92,77,0.3)",
      borderRadius: "var(--radius-card)",
      padding: "16px 18px",
      marginBottom: 20,
    }}>
      {/* Header */}
      <div className="flex items-center" style={{ gap: 10, marginBottom: 12 }}>
        <div className="shrink-0 flex items-center justify-center" style={{
          width: 24, height: 24,
          borderRadius: "var(--radius-pill)",
          background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
        }}>
          <Sparkles style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />
        </div>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)" }}>
          Anna empfiehlt
        </span>
        {typDef?.annaStage === "C" && (
          <span style={{
            padding: "1px 8px", borderRadius: "var(--radius-pill)",
            fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
            background: "var(--brand-accent-light)", color: "var(--status-info)",
          }}>
            Beta
          </span>
        )}
      </div>

      {/* Text */}
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

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className="inline-flex items-center cursor-pointer transition-colors"
              style={{
                gap: 6, padding: "8px 16px",
                borderRadius: "var(--radius-pill)",
                fontSize: 13, fontWeight: "var(--weight-medium)",
                border: action.variant === "primary" ? "none" : "var(--border-thin) solid var(--border-default)",
                background: action.variant === "primary" ? "var(--brand-primary)" : "var(--bg-elevated)",
                color: action.variant === "primary" ? "var(--text-on-dark)" : "var(--text-primary)",
              }}
              onMouseEnter={e => {
                if (action.variant === "primary") e.currentTarget.style.background = "var(--brand-primary-dark)";
                else e.currentTarget.style.background = "var(--bg-secondary)";
              }}
              onMouseLeave={e => {
                if (action.variant === "primary") e.currentTarget.style.background = "var(--brand-primary)";
                else e.currentTarget.style.background = "var(--bg-elevated)";
              }}
            >
              {actionIcon(action.type)}
              {action.label}
              {action.isDemoMock && (
                <Sparkles style={{ width: 10, height: 10, opacity: 0.7 }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Stage A: generic action after streaming */}
      {!streaming && displayed.length > 0 && typDef?.annaStage === "A" && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => { onActionExecuted?.("take-over"); toast("Aktion ausgeführt"); }}
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: 6, padding: "8px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 13, fontWeight: "var(--weight-medium)",
              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
          >
            <Play style={{ width: 13, height: 13 }} />
            In Bearbeitung nehmen
          </button>
        </div>
      )}
    </div>
  );
}
