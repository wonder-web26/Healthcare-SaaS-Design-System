import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Listenansicht } from "../../../lib/pendenzen/listenansichten";

/**
 * Ansichtsumschalter — Knopf plus Menü. Ersetzt den früheren Segmentumschalter;
 * „Mir zugewiesen" und „Alle Pendenzen" stehen hier als Systemansichten.
 *
 * Das Menü kennt genau zwei Gruppen und eine Hinweiszeile. Linsen anzulegen oder
 * abzulegen ist hier nicht vorgesehen — das ist Sache der Administration.
 */
export function AnsichtsUmschalter({ ansichten, aktivId, zaehler, gefiltert, onWaehle }: {
  ansichten: Listenansicht[];
  /** Kennung der aktiven Ansicht — auch dann, wenn sie unbekannt ist. */
  aktivId: string;
  /** Trefferzahl je Ansicht (nur Ansichtsfilter, ohne Ad-hoc-Filter). */
  zaehler: Record<string, number>;
  /** Ad-hoc-Filter gesetzt → Marke am Knopf. */
  gefiltert: boolean;
  onWaehle: (id: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);

  const aktiv = ansichten.find(a => a.id === aktivId);
  // Unbekannte oder nicht freigegebene Ansicht: nur die Kennung, kein Name.
  const knopfText = aktiv ? aktiv.name : aktivId;

  const system = ansichten.filter(a => a.art === "system");
  const freigegeben = ansichten.filter(a => a.art === "freigegeben");

  const gruppe = (titel: string, liste: Listenansicht[]) => (
    <div role="group" aria-label={titel}>
      <div style={{ padding: "6px 8px 4px", fontSize: "var(--text-micro)", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", fontWeight: "var(--weight-medium)" }}>
        {titel}
      </div>
      {liste.map(a => {
        const istAktiv = a.id === aktivId;
        return (
          <button key={a.id} type="button" role="menuitemradio" aria-checked={istAktiv}
            onClick={() => { onWaehle(a.id); setOffen(false); }}
            className="ui-fokusring w-full inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: 8, padding: "7px 8px", borderRadius: 6, background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ flex: 1, minWidth: 0, fontWeight: istAktiv ? "var(--weight-medium)" : "var(--weight-regular)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-tertiary)" }}>{zaehler[a.id] ?? 0}</span>
            <span className="inline-flex items-center justify-center shrink-0" style={{ width: 14 }}>
              {istAktiv && <Check style={{ width: 13, height: 13, color: "var(--brand-primary)" }} />}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative shrink-0" ref={ref}>
      <button type="button" onClick={() => setOffen(o => !o)} aria-haspopup="menu" aria-expanded={offen}
        className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
        style={{ gap: 8, padding: "7px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap", maxWidth: 320 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{knopfText}</span>
        {gefiltert && (
          <span style={{ padding: "1px 7px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)" }}>
            gefiltert
          </span>
        )}
        <ChevronDown style={{ width: 14, height: 14, opacity: 0.7 }} />
      </button>

      {offen && (
        <div role="menu" className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 300, maxHeight: 380, overflowY: "auto", padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
          {gruppe("Systemansichten", system)}
          <div style={{ borderTop: "var(--border-thin) solid var(--border-light)", margin: "6px 0" }} />
          {gruppe("Für mich freigegeben", freigegeben)}
          <div style={{ borderTop: "var(--border-thin) solid var(--border-light)", margin: "6px 0" }} />
          {/* Text, keine Schaltfläche — es gibt hier nichts anzulegen. */}
          <div style={{ padding: "4px 8px 6px", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            Ansichten werden von der Administration verwaltet.
          </div>
        </div>
      )}
    </div>
  );
}
