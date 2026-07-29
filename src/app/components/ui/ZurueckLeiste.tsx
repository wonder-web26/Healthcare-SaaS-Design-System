/**
 * ZurueckLeiste — the one navigation frame for the back link.
 *
 * Der Rückweg ist KEIN Knopf: eigene Leiste oberhalb der Objektkarte, an
 * derselben Stelle in jeder Detailansicht. Pfeil nach links, danach der Name des
 * Ziels, ohne Fläche, ohne Rahmen, in Sekundärfarbe. Die Beschriftung nennt das
 * Ziel, nicht die Handlung ("Patienten", "Onboardings", "Angehörige"; bei einem
 * einzelnen Objekt "Zurück zu {Name}").
 *
 * Visuell identisch zur Vorlage (DetailNavigation-Rücklink in der Patientenansicht).
 */
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export interface ZurueckLeisteProps {
  /** Name of the destination (e.g. "Patienten", "Onboardings"). */
  label: string;
  /** Target path; ignored when onBack is given. */
  to?: string;
  onBack?: () => void;
}

export function ZurueckLeiste({ label, to, onBack }: ZurueckLeisteProps) {
  const navigate = useNavigate();
  const handleBack = () => { if (onBack) onBack(); else if (to) navigate(to); };
  return (
    <div style={{ padding: "var(--space-4) var(--space-6) 0" }}>
      <button
        onClick={handleBack}
        className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
        style={{ gap: 6, marginLeft: -2, padding: 0, background: "none", border: "none", fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: 450, color: "var(--text-secondary)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        <span>{label}</span>
      </button>
    </div>
  );
}
