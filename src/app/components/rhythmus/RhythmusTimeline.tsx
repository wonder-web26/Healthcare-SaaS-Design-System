/**
 * WF-01 / WF-02: Betreuungs-Rhythmus Timeline — per-Subjekt-Ansicht.
 *
 * Zeigt alle Schritte einer Rhythmus-Instanz als vertikale Timeline
 * mit Status, Fälligkeit, Protokoll und Erledigen-Aktion.
 */
import { useState } from "react";
import { DateField } from "../form/DateField";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  FileText,
  GraduationCap,
  Users,
  ClipboardList,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  CalendarDays,
  Briefcase,
  Send,
  Pen,
} from "lucide-react";
import {
  getTicketsFuerSubjekt,
  getInstanzFuerSubjekt,
  ticketErledigen,
  ticketFaelligkeitAendern,
  type RhythmusTicket,
  type TicketStatus,
} from "../../../lib/rhythmus/engine";
import type { RhythmusEntitaet } from "../../../lib/rhythmus/vorlage";

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */

interface Props {
  subjektTyp: RhythmusEntitaet;
  subjektId: string;
  /** Aktueller Benutzer für erledigt_von */
  aktuellerBenutzer?: string;
}

/* ══════════════════════════════════════════
   HELFER
   ══════════════════════════════════════════ */

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  offen:       { label: "Offen",       bg: "var(--bg-secondary)",       text: "var(--text-secondary)",      icon: Circle },
  ueberfaellig:{ label: "Überfällig",  bg: "var(--status-warning-bg)",  text: "var(--status-warning-text)", icon: AlertTriangle },
  erledigt:    { label: "Erledigt",    bg: "var(--status-success-bg)",  text: "var(--status-success)",      icon: CheckCircle2 },
};

const TYP_ICON: Record<string, typeof GraduationCap> = {
  schulung: GraduationCap,
  kontrolle: ClipboardList,
  fallbesprechung: Users,
  reassessment: RefreshCw,
  kombiniert: Layers,
  administration: Briefcase,
  klinisch: FileText,
  kommunikation: Send,
};

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ══════════════════════════════════════════
   KOMPONENTE
   ══════════════════════════════════════════ */

export function RhythmusTimeline({ subjektTyp, subjektId, aktuellerBenutzer = "Sandra Weber" }: Props) {
  const instanz = getInstanzFuerSubjekt(subjektTyp, subjektId);
  const tickets = getTicketsFuerSubjekt(subjektTyp, subjektId);
  const [, forceUpdate] = useState(0);

  if (!instanz || tickets.length === 0) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <Clock style={{ width: 22, height: 22, color: "var(--text-tertiary)" }} />
        </div>
        <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Kein Betreuungs-Rhythmus</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: 320, margin: "0 auto" }}>
          Der Betreuungs-Rhythmus wird automatisch generiert, sobald das Subjekt aktiv wird.
        </div>
      </div>
    );
  }

  const erledigteCount = tickets.filter(t => t.status === "erledigt").length;

  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>Betreuungs-Rhythmus</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>
            {instanz.vorlageName} · Version {instanz.vorlageVersion} · Anker: {formatDatum(instanz.ankerDatum)}
          </div>
        </div>
        <span style={{
          padding: "4px 12px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500,
          background: erledigteCount === tickets.length ? "var(--status-success-bg)" : "var(--bg-secondary)",
          color: erledigteCount === tickets.length ? "var(--status-success)" : "var(--text-secondary)",
        }}>
          {erledigteCount}/{tickets.length} erledigt
        </span>
      </div>

      {/* Timeline */}
      <div className="flex flex-col" style={{ gap: 0 }}>
        {tickets.map((ticket, idx) => (
          <TicketZeile
            key={ticket.id}
            ticket={ticket}
            isLast={idx === tickets.length - 1}
            aktuellerBenutzer={aktuellerBenutzer}
            onErledigt={() => forceUpdate(n => n + 1)}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TICKET-ZEILE
   ══════════════════════════════════════════ */

function TicketZeile({ ticket, isLast, aktuellerBenutzer, onErledigt }: {
  ticket: RhythmusTicket;
  isLast: boolean;
  aktuellerBenutzer: string;
  onErledigt: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [protokoll, setProtokoll] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [showDatumAendern, setShowDatumAendern] = useState(false);
  const [neuesDatum, setNeuesDatum] = useState(ticket.faelligAm);
  const [datumBegruendung, setDatumBegruendung] = useState("");
  const [datumFehler, setDatumFehler] = useState<string | null>(null);

  const config = STATUS_CONFIG[ticket.status];
  const StatusIcon = config.icon;
  const TypIcon = TYP_ICON[ticket.typ] || FileText;
  const wurdeVerschoben = ticket.faelligAm !== ticket.faelligAmUrspruenglich;

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

  const handleDatumAendern = () => {
    const result = ticketFaelligkeitAendern(ticket.id, neuesDatum, datumBegruendung, aktuellerBenutzer);
    if (!result.ok) {
      setDatumFehler(result.fehler ?? "Fehler");
      return;
    }
    setDatumFehler(null);
    setShowDatumAendern(false);
    setDatumBegruendung("");
    onErledigt(); // force re-render
  };

  return (
    <div className="flex" style={{ gap: 0 }}>
      {/* Timeline-Linie + Dot */}
      <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%", flexShrink: 0, marginTop: 16,
          background: ticket.status === "erledigt" ? "var(--status-success)" : ticket.status === "ueberfaellig" ? "var(--status-warning)" : "var(--border-default)",
          border: ticket.status === "erledigt" ? "none" : "2px solid var(--bg-elevated)",
        }} />
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: "var(--border-default)", marginTop: 2, marginBottom: 2 }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "var(--space-2)", paddingTop: "var(--space-2)" }}>
        <div
          className="cursor-pointer"
          onClick={() => ticket.status !== "erledigt" && setExpanded(!expanded)}
          style={{
            padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-elevated)",
            border: `0.5px solid ${ticket.status === "ueberfaellig" ? "var(--status-warning)" : "var(--border-default)"}`,
          }}
        >
          {/* Kopfzeile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 10 }}>
              <TypIcon style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
              <div>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{ticket.label}</div>
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                    <Clock style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                    Fällig: {formatDatum(ticket.faelligAm)}
                  </span>
                  {wurdeVerschoben && (
                    <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", textDecoration: "line-through" }}>
                      {formatDatum(ticket.faelligAmUrspruenglich)}
                    </span>
                  )}
                  {ticket.zugewiesenAn && (
                    <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                      · {ticket.zugewiesenAn}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{
                padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500,
                background: config.bg, color: config.text,
              }}>
                <StatusIcon style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                {config.label}
              </span>
              {ticket.status !== "erledigt" && (
                expanded ? <ChevronUp style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} /> : <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
              )}
            </div>
          </div>

          {/* Erledigt-Info */}
          {ticket.status === "erledigt" && ticket.erledigtAm && (
            <div style={{ marginTop: 8, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
              Erledigt am {new Date(ticket.erledigtAm).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })} von {ticket.erledigtVon}
              {ticket.protokoll && (
                <div style={{ marginTop: 4, padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: 6, fontSize: "var(--text-small)", color: "var(--text-secondary)", fontStyle: "italic" }}>
                  {ticket.protokoll}
                </div>
              )}
            </div>
          )}

          {/* Expanded: Aktionen */}
          {expanded && ticket.status !== "erledigt" && (
            <div style={{ marginTop: 12, borderTop: "0.5px solid var(--border-default)", paddingTop: 12 }} onClick={e => e.stopPropagation()}>

              {/* ── Fälligkeit anpassen ── */}
              {!showDatumAendern ? (
                <button
                  onClick={() => setShowDatumAendern(true)}
                  className="inline-flex items-center cursor-pointer"
                  style={{ gap: 5, padding: "4px 0", marginBottom: 12, background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  <CalendarDays style={{ width: 12, height: 12 }} /> Fälligkeit anpassen
                </button>
              ) : (
                <div style={{ marginBottom: 12, padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                  <div style={{ fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Fälligkeit anpassen</div>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                    <DateField wertFormat="iso" bereich="future" value={neuesDatum || null} onChange={v => { setNeuesDatum((v as string) ?? ""); setDatumFehler(null); }} />
                  </div>
                  <textarea
                    value={datumBegruendung}
                    onChange={e => { setDatumBegruendung(e.target.value); setDatumFehler(null); }}
                    placeholder="Begründung (Pflicht)"
                    rows={2}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical", marginBottom: 6 }}
                  />
                  {datumFehler && (
                    <div className="flex items-center" style={{ gap: 6, marginBottom: 6, fontSize: "var(--text-small)", color: "var(--status-danger)" }}>
                      <Info style={{ width: 12, height: 12 }} /> {datumFehler}
                    </div>
                  )}
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <button onClick={handleDatumAendern} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "6px 14px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-meta)", fontWeight: 500, border: "none" }}>
                      <Check style={{ width: 11, height: 11 }} /> Speichern
                    </button>
                    <button onClick={() => { setShowDatumAendern(false); setDatumFehler(null); setNeuesDatum(ticket.faelligAm); setDatumBegruendung(""); }} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "6px 8px" }}>
                      Abbrechen
                    </button>
                  </div>
                  {/* Änderungs-Historie */}
                  {ticket.faelligkeitsAenderungen.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: "0.5px solid var(--border-default)", paddingTop: 6 }}>
                      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 4 }}>Bisherige Änderungen:</div>
                      {ticket.faelligkeitsAenderungen.map((ae, i) => (
                        <div key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", padding: "2px 0" }}>
                          {formatDatum(ae.altDatum)} → {formatDatum(ae.neuDatum)} · {ae.geaendertVon} · «{ae.begruendung}»
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Protokoll + Erledigen ── */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>
                  Protokoll{ticket.protokollPflicht ? <span style={{ color: "var(--status-danger)" }}> *</span> : " (optional)"}
                </label>
                <textarea
                  value={protokoll}
                  onChange={e => { setProtokoll(e.target.value); setFehler(null); }}
                  placeholder={ticket.protokollPflicht ? "Beobachtungen, Massnahmen, Vereinbarungen…" : "Bemerkungen…"}
                  rows={ticket.protokollPflicht ? 3 : 2}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
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
      </div>
    </div>
  );
}

