/**
 * WF-01 / WF-02: Sammelansicht — alle fälligen/überfälligen Tickets einer Person.
 *
 * Sortiert nach Fälligkeit, über alle Subjekte hinweg.
 */
import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  User,
  GraduationCap,
  Users,
  ClipboardList,
  RefreshCw,
  Layers,
  FileText,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getOffeneTicketsFuerPerson,
  ticketErledigen,
  type RhythmusTicket,
  type TicketStatus,
} from "../../../lib/rhythmus/engine";

interface Props {
  zugewiesenAn: string;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  offen:        { label: "Offen",      bg: "var(--bg-secondary)",      text: "var(--text-secondary)" },
  ueberfaellig: { label: "Überfällig", bg: "var(--status-warning-bg)", text: "var(--status-warning-text)" },
  erledigt:     { label: "Erledigt",   bg: "var(--status-success-bg)", text: "var(--status-success)" },
};

const TYP_ICON: Record<string, typeof GraduationCap> = {
  schulung: GraduationCap,
  kontrolle: ClipboardList,
  fallbesprechung: Users,
  reassessment: RefreshCw,
  kombiniert: Layers,
};

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function RhythmusSammelansicht({ zugewiesenAn }: Props) {
  const tickets = getOffeneTicketsFuerPerson(zugewiesenAn);
  const [, forceUpdate] = useState(0);

  if (tickets.length === 0) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--status-success-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <CheckCircle2 style={{ width: 22, height: 22, color: "var(--status-success)" }} />
        </div>
        <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Keine offenen Aufgaben</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          Alle Betreuungs-Rhythmus-Aufgaben sind erledigt.
        </div>
      </div>
    );
  }

  const ueberfaelligCount = tickets.filter(t => t.status === "ueberfaellig").length;

  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>Meine Betreuungs-Aufgaben</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>
            {tickets.length} offen{ueberfaelligCount > 0 ? ` · ${ueberfaelligCount} überfällig` : ""}
          </div>
        </div>
      </div>

      {/* Ticket-Liste */}
      <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
        {tickets.map(ticket => (
          <SammelTicketZeile
            key={ticket.id}
            ticket={ticket}
            aktuellerBenutzer={zugewiesenAn}
            onErledigt={() => forceUpdate(n => n + 1)}
          />
        ))}
      </div>
    </div>
  );
}

function SammelTicketZeile({ ticket, aktuellerBenutzer, onErledigt }: {
  ticket: RhythmusTicket;
  aktuellerBenutzer: string;
  onErledigt: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [protokoll, setProtokoll] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);

  const config = STATUS_CONFIG[ticket.status];
  const TypIcon = TYP_ICON[ticket.typ] || FileText;
  const subjektLabel = ticket.subjektTyp === "angehoeriger" ? "Angehörige/r" : "Patient/in";

  const handleErledigen = () => {
    const result = ticketErledigen(ticket.id, aktuellerBenutzer, protokoll || undefined);
    if (!result.ok) {
      setFehler(result.fehler ?? "Fehler");
      return;
    }
    setFehler(null);
    setExpanded(false);
    onErledigt();
  };

  return (
    <div
      style={{
        padding: "12px 16px", borderRadius: 10,
        background: "var(--bg-elevated)",
        border: `0.5px solid ${ticket.status === "ueberfaellig" ? "var(--status-warning)" : "var(--border-default)"}`,
      }}
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <TypIcon style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
          <div>
            <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{ticket.label}</div>
            <div className="flex items-center" style={{ gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                <User style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                {ticket.subjektName} ({subjektLabel})
              </span>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                <Clock style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                {formatDatum(ticket.faelligAm)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{
            padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500,
            background: config.bg, color: config.text,
          }}>
            {config.label}
          </span>
          {expanded ? <ChevronUp style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} /> : <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: "0.5px solid var(--border-default)", paddingTop: 12 }} onClick={e => e.stopPropagation()}>
          {ticket.protokollPflicht ? (
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>
                Protokoll <span style={{ color: "var(--status-danger)" }}>*</span>
              </label>
              <textarea
                value={protokoll}
                onChange={e => { setProtokoll(e.target.value); setFehler(null); }}
                placeholder="Beobachtungen, Massnahmen, Vereinbarungen…"
                rows={3}
                style={{ width: "100%", padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>
                Protokoll (optional)
              </label>
              <textarea
                value={protokoll}
                onChange={e => setProtokoll(e.target.value)}
                placeholder="Bemerkungen…"
                rows={2}
                style={{ width: "100%", padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          )}
          {fehler && (
            <div className="flex items-center" style={{ gap: 6, marginBottom: 8, fontSize: "var(--text-small)", color: "var(--status-danger)" }}>
              <Info style={{ width: 12, height: 12 }} /> {fehler}
            </div>
          )}
          <button
            onClick={handleErledigen}
            className="inline-flex items-center cursor-pointer"
            style={{ gap: 6, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
          >
            <Check style={{ width: 12, height: 12 }} /> Erledigen
          </button>
        </div>
      )}
    </div>
  );
}
