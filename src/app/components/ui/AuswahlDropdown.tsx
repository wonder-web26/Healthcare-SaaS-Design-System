/**
 * Mehrfachauswahl-Feld der Listen — Auf/Zu und Aussenklick, sonst nichts.
 *
 * Lag zuvor dreimal als Ortskopie in Patienten-, Angehörigen- und
 * Onboarding-Liste. Die Fassungen von Patienten und Onboarding waren
 * zeichengleich; die der Angehörigen wich in einem Punkt ab (minWidth 200
 * statt 180) — übernommen ist das Verhalten der beiden zeichengleichen.
 *
 * Die Auswahl selbst liegt im Filterzustand der jeweiligen Liste; dieses
 * Bauteil kennt sie nicht.
 */
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function AuswahlDropdown({ label, optionen, ausgewaehlt, onToggle }: {
  label: string;
  optionen: { value: string; label: string }[];
  ausgewaehlt: Set<string>;
  onToggle: (value: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);
  const anzahl = ausgewaehlt.size;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOffen(o => !o)} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
        style={{ gap: 6, padding: "7px 12px", borderRadius: "var(--radius-pill)", background: anzahl > 0 ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: anzahl > 0 ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: anzahl > 0 ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {label}{anzahl > 0 && <span style={{ fontVariantNumeric: "tabular-nums" }}>· {anzahl}</span>}
        <ChevronDown style={{ width: 14, height: 14, opacity: 0.7 }} />
      </button>
      {offen && (
        <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 180, padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
          {optionen.map(opt => {
            const aktiv = ausgewaehlt.has(opt.value);
            return (
              <button key={opt.value} type="button" onClick={() => onToggle(opt.value)} className="w-full inline-flex items-center cursor-pointer transition-colors"
                style={{ gap: 8, padding: "7px 8px", borderRadius: 6, background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span className="inline-flex items-center justify-center shrink-0" style={{ width: 16, height: 16, borderRadius: 4, border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
                  {aktiv && <Check style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
