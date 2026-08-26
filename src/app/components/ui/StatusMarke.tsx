/**
 * StatusMarke — non-interactive status/information mark.
 *
 * Grundregel: getönte Fläche OHNE Rahmen bedeutet Information (nie bedienbar).
 * Höhe --marke-height (24), Radius --control-radius (8), Schrift 12, Innenabstand 10.
 *
 * Semantische Marken (erfolg/warnung/info/gefahr) tragen NEBEN der Farbe immer ein
 * Symbol — Farbe ist nie das einzige Merkmal, damit Graustufen-Ausdrucke lesbar
 * bleiben. Nicht semantische Marken (variante "neutral", z. B. "6 Dokumente offen")
 * bekommen die neutrale Flächenfarbe, kein Symbol, keinen Rahmen.
 *
 * Für eine BEDIENBARE Statusanzeige (Auswahl) gilt diese Komponente NICHT — die
 * hat Rahmen + Winkel und ist ein Button (siehe Onboarding-Status).
 */
import type { ElementType, CSSProperties } from "react";
import { CheckCircle2, AlertTriangle, Info, Ban } from "lucide-react";

export type StatusMarkeVariante = "erfolg" | "warnung" | "info" | "gefahr" | "neutral";

/** Aussehen, unabhängig von der Bedeutung. */
export type MarkenStil = "flaeche" | "umriss";

interface VarianteCfg { bg: string; text: string; icon: ElementType | null; }

const VARIANTEN: Record<StatusMarkeVariante, VarianteCfg> = {
  erfolg:  { bg: "var(--status-success-bg)", text: "var(--status-success-text)", icon: CheckCircle2 },
  warnung: { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", icon: AlertTriangle },
  info:    { bg: "var(--status-info-bg)",    text: "var(--status-info)",         icon: Info },
  gefahr:  { bg: "var(--status-danger-bg)",  text: "var(--status-danger)",       icon: Ban },
  neutral: { bg: "var(--bg-secondary)",      text: "var(--text-secondary)",      icon: null },
};

export interface StatusMarkeProps {
  label: string;
  variante: StatusMarkeVariante;
  /** Override the default icon of a semantic variant. Ignored for "neutral". */
  icon?: ElementType;
  /**
   * Aussehen der Marke — eine Eigenschaft mit zwei Werten, kein Schalter.
   *
   * "flaeche" ist die getönte Marke ohne Rahmen, wie sie das Onboarding und
   * InterRAI führen; "umriss" ist Rahmen in der Linienfarbe, Text in der
   * Sekundärfarbe, keine Füllung. Als Eigenschaft und nicht als zwei
   * boolesche Schalter, weil sich zwei Schalter widersprechen können und
   * eine Eigenschaft nicht.
   *
   * Die Bedeutung steckt in `variante`, das Aussehen hier — deshalb keine
   * eigene Variante daneben.
   */
  stil?: MarkenStil;
  style?: CSSProperties;
}

export function StatusMarke({ label, variante, icon, stil = "flaeche", style }: StatusMarkeProps) {
  const umriss = stil === "umriss";
  const cfg = VARIANTEN[variante];
  const Icon = variante === "neutral" ? null : (icon ?? cfg.icon);
  return (
    <span
      className="inline-flex items-center shrink-0"
      style={{
        height: "var(--marke-height)",
        borderRadius: "var(--control-radius)",
        padding: "0 10px",
        gap: 4,
        fontSize: "var(--text-meta)", // 12
        fontWeight: "var(--weight-medium)",
        background: umriss ? "transparent" : cfg.bg,
        color: umriss ? "var(--text-secondary)" : cfg.text,
        border: umriss ? "var(--border-thin) solid var(--border-default)" : "none",
        ...style,
      }}
    >
      {Icon && <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />}
      {label}
    </span>
  );
}
