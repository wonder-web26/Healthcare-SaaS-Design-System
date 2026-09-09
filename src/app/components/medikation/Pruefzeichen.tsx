/**
 * Prüfzeichen — DIE eine Stelle, an der aus Prüfart und Status ein Zeichen
 * wird. Legendenleiste, Zeilenmarker und Panel-Reiter zeichnen dasselbe
 * Zeichen, weil sie dieselbe Komponente rufen; eine zweite Zeichnung desselben
 * Symbols darf es nirgends geben.
 *
 * DIE FORM TRAEGT DIE PRUEFART, DIE FARBE DEN STATUS — nie umgekehrt.
 * Ein Dreieck bleibt eine Doppelmedikation, ob geprüft, unbefundet oder nicht
 * aktiv; nur seine Einfärbung ändert sich. Darum bleiben die vier Prüfarten in
 * Graustufen und für farbfehlsichtige Augen unterscheidbar, und darum darf die
 * Farbe nie das einzige Merkmal sein: jedes Zeichen trägt zusätzlich `title`
 * und einen Namen für Screenreader.
 *
 *   Doppelmedikation   Dreieck
 *   Allergien          Sechseck
 *   Wechselwirkungen   zwei überlappende Kreise
 *   Kontraindikationen Achteck
 */
import type { Pruefart } from "../../../lib/medikation/medikation";
import { PRUEFART_LABEL } from "../../../lib/medikation/medikation";

/** Statusstufen des Zeichens — dieselbe Reihenfolge wie in der Legende. */
export type ZeichenStatus = "ohne_befund" | "mit_befund" | "nicht_geprueft" | "nicht_aktiv";

const STATUS_TEXT: Record<ZeichenStatus, string> = {
  ohne_befund: "geprüft, kein Befund",
  mit_befund: "Befund vorhanden",
  nicht_geprueft: "nicht geprüft",
  nicht_aktiv: "nicht aktiv",
};

/** Farbe je Status — Flaeche und Kontur aus den Systemtokens, keine Hexwerte. */
const STATUS_FARBE: Record<ZeichenStatus, { flaeche: string; kontur: string }> = {
  ohne_befund: { flaeche: "var(--status-success-bg)", kontur: "var(--status-success-text)" },
  mit_befund: { flaeche: "var(--status-warning-bg)", kontur: "var(--status-warning-text)" },
  nicht_geprueft: { flaeche: "var(--bg-secondary)", kontur: "var(--text-tertiary)" },
  nicht_aktiv: { flaeche: "transparent", kontur: "var(--border-default)" },
};

/** Umrisse in einem 24×24-Feld — eine Definition je Prüfart. */
function Umriss({ art }: { art: Pruefart }) {
  switch (art) {
    case "doppelmedikation":
      return <polygon points="12,3 22,20 2,20" vectorEffect="non-scaling-stroke" />;
    case "allergien":
      return <polygon points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2" vectorEffect="non-scaling-stroke" />;
    case "wechselwirkungen":
      return (
        <>
          <circle cx="9" cy="12" r="6.5" vectorEffect="non-scaling-stroke" />
          <circle cx="15" cy="12" r="6.5" vectorEffect="non-scaling-stroke" />
        </>
      );
    case "kontraindikationen":
      return <polygon points="8.4,2.5 15.6,2.5 21.5,8.4 21.5,15.6 15.6,21.5 8.4,21.5 2.5,15.6 2.5,8.4" vectorEffect="non-scaling-stroke" />;
  }
}

export function Pruefzeichen({ art, status, groesse = 20 }: {
  art: Pruefart;
  status: ZeichenStatus;
  groesse?: number;
}) {
  const farbe = STATUS_FARBE[status];
  const name = `${PRUEFART_LABEL[art]}: ${STATUS_TEXT[status]}`;
  return (
    <svg width={groesse} height={groesse} viewBox="0 0 24 24" role="img" aria-label={name}
      focusable="false" style={{ flexShrink: 0, overflow: "visible" }}>
      <title>{name}</title>
      <g fill={farbe.flaeche} stroke={farbe.kontur} strokeWidth={1.5}
        strokeLinejoin="round" fillOpacity={status === "nicht_aktiv" ? 0 : 1}
        strokeDasharray={status === "nicht_aktiv" ? "3 2" : undefined}>
        <Umriss art={art} />
      </g>
    </svg>
  );
}

/** Statuswort zum Zeichen — für Stellen, die den Status ausschreiben. */
export function zeichenStatusText(status: ZeichenStatus): string {
  return STATUS_TEXT[status];
}
