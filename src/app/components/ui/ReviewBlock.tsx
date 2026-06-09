/**
 * ReviewBlock — Einheitliches Anna-Entwurf-Element gemäss styleguide.md 8.10.
 *
 * Standardisiert Rahmen, Herkunft, Status und Aktionen.
 * Der fachliche Inhalt wird als children übergeben.
 *
 * Status: "vorschlag" | "bestaetigt" (| "signiert" — Typ vorhanden, UI folgt später)
 * Herkunft: "anna" | "diplomierte" | "angehoerige"
 * Zustände: kompakt (nur Kopf) | offen (Kopf + Körper + Aktionen)
 */
import { useState, type ReactNode } from "react";
import { Sparkles, User, HeartHandshake, Clock, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export type ReviewStatus = "vorschlag" | "bestaetigt" | "signiert";
export type ReviewHerkunft = "anna" | "diplomierte" | "angehoerige";

interface ReviewBlockProps {
  /** Titel des Elements (z.B. NANDA-Code + Diagnose, KLV-Nummer + Bezeichnung) */
  titel: ReactNode;
  /** Optionale Untertitel-Zeile (z.B. Domäne, Kontext-Info) */
  untertitel?: ReactNode;
  /** Aktueller Status */
  status: ReviewStatus;
  /** Wer hat den Entwurf erzeugt */
  herkunft?: ReviewHerkunft;
  /** Fachlicher Inhalt — nur sichtbar im offenen Zustand */
  children?: ReactNode;
  /** Default offen/kompakt. Gesteuert von Confidence (unsichtbar) oder manuell. */
  defaultOffen?: boolean;
  /** Callback bei "Bestätigen" */
  onBestaetigen?: () => void;
  /** Callback bei "Verwerfen" (nur für Vorschläge) */
  onVerwerfen?: () => void;
  /** Callback bei "Löschen" (Trash-Icon, immer sichtbar wenn gesetzt) */
  onLoeschen?: () => void;
  /** Ob Aktionen angezeigt werden (false für read-only) */
  aktionen?: boolean;
}

const AKZENT: Record<ReviewStatus, string> = {
  vorschlag: "var(--status-warning)",
  bestaetigt: "var(--status-success)",
  signiert: "var(--brand-primary)",
};

const STATUS_PILL: Record<ReviewStatus, { bg: string; color: string; label: string; icon: typeof Clock }> = {
  vorschlag: { bg: "var(--status-warning-bg)", color: "var(--status-warning-text)", label: "Vorschlag", icon: Clock },
  bestaetigt: { bg: "var(--status-success-bg)", color: "var(--status-success-text)", label: "Bestätigt", icon: Check },
  signiert: { bg: "var(--brand-primary-light)", color: "var(--brand-primary)", label: "Signiert", icon: Check },
};

function HerkunftMarker({ herkunft }: { herkunft: ReviewHerkunft }) {
  const icon = herkunft === "anna" ? Sparkles : herkunft === "angehoerige" ? HeartHandshake : User;
  const label = herkunft === "anna" ? "ANNA" : herkunft === "angehoerige" ? "ANGEHÖRIGE" : "DIPLOMIERTE";
  const Icon = icon;
  return (
    <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
      <Icon style={{ width: 14, height: 14, color: herkunft === "anna" ? "var(--brand-primary)" : "var(--text-secondary)" }} />
      <span style={{ fontSize: 9, fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{label}</span>
    </div>
  );
}

export function ReviewBlock({
  titel,
  untertitel,
  status,
  herkunft = "anna",
  children,
  defaultOffen = false,
  onBestaetigen,
  onVerwerfen,
  onLoeschen,
  aktionen = true,
}: ReviewBlockProps) {
  const [offen, setOffen] = useState(defaultOffen);
  const pill = STATUS_PILL[status];
  const PillIcon = pill.icon;

  return (
    <div style={{
      display: "flex",
      background: "var(--bg-elevated)",
      border: "0.5px solid var(--border-default)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 6,
    }}>
      {/* Status-Akzent-Leiste links */}
      <div style={{
        width: 4,
        flexShrink: 0,
        background: AKZENT[status],
        borderRadius: "2px 0 0 2px",
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Kopf */}
        <div
          className="flex items-center cursor-pointer"
          style={{ padding: "12px 16px", gap: 8 }}
          onClick={() => setOffen(!offen)}
        >
          <HerkunftMarker herkunft={herkunft} />

          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
              {titel}
            </div>
            {untertitel && (
              <div className="truncate" style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>
                {untertitel}
              </div>
            )}
          </div>

          {/* Status-Pill */}
          <div className="flex items-center shrink-0" style={{ gap: 4, padding: "2px 10px", borderRadius: 999, background: pill.bg, color: pill.color }}>
            <PillIcon style={{ width: 11, height: 11 }} />
            <span style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>{pill.label}</span>
          </div>

          {/* Löschen (immer sichtbar wenn gesetzt) */}
          {onLoeschen && (
            <button
              onClick={e => { e.stopPropagation(); onLoeschen(); }}
              className="cursor-pointer"
              title="Löschen"
              style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          )}

          {/* Expand toggle */}
          <button
            onClick={e => { e.stopPropagation(); setOffen(!offen); }}
            className="cursor-pointer"
            style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 2, flexShrink: 0 }}
          >
            {offen ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          </button>
        </div>

        {/* Körper + Aktionen (nur offen) */}
        {offen && (
          <>
            {children && (
              <div style={{ padding: "0 16px 12px", borderTop: "0.5px solid var(--border-default)" }}>
                <div style={{ paddingTop: 12 }}>
                  {children}
                </div>
              </div>
            )}

            {/* Aktionen */}
            {aktionen && status === "vorschlag" && (onBestaetigen || onVerwerfen) && (
              <div className="flex items-center" style={{ gap: 8, padding: "0 16px 12px" }}>
                {onBestaetigen && (
                  <button
                    onClick={e => { e.stopPropagation(); onBestaetigen(); }}
                    className="inline-flex items-center cursor-pointer"
                    style={{
                      gap: 5,
                      padding: "10px 22px",
                      borderRadius: 999,
                      background: "var(--brand-primary)",
                      color: "var(--text-on-dark)",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                    }}
                  >
                    <Check style={{ width: 14, height: 14 }} /> Bestätigen
                  </button>
                )}
                {onVerwerfen && (
                  <button
                    onClick={e => { e.stopPropagation(); onVerwerfen(); }}
                    className="inline-flex items-center cursor-pointer"
                    style={{
                      gap: 5,
                      padding: "10px 18px",
                      borderRadius: 999,
                      background: "transparent",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                    }}
                  >
                    Verwerfen
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
