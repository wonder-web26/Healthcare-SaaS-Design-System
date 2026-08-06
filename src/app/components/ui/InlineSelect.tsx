/**
 * InlineSelect — Lightweight design-system-compliant select for inline/grid use.
 * Matches styleguide.md 8.2 (12px radius, 0.5px border, correct states).
 * Unlike the full Select component, no FormField wrapper — just the control.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { berechneAufklappLage, useLageNachfuehren, type AufklappLage } from "./aufklappliste";
import { ChevronDown, Check } from "lucide-react";

interface Option { value: string; label: string }

interface InlineSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function InlineSelect({ value, onChange, options, disabled, style }: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const [lage, setLage] = useState<AufklappLage | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const ausloeserRef = useRef<HTMLButtonElement>(null);
  const selectedLabel = options.find(o => o.value === value)?.label || value;

  /* Höhe eines Eintrags: 8px oben + 8px unten + 21px Zeile. */
  const EINTRAG_HOEHE = 37;

  const lageBerechnen = useCallback(() => {
    const feld = ausloeserRef.current?.getBoundingClientRect();
    if (feld) setLage(berechneAufklappLage(feld, options.length, EINTRAG_HOEHE));
  }, [options.length]);

  const oeffnen = () => {
    lageBerechnen();
    setOpen(true);
  };

  useLageNachfuehren(open, lageBerechnen);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const ziel = e.target as Node;
      // Die Liste liegt im Portal, also ausserhalb von ref — sie zählt trotzdem als innen.
      const inListe = ziel instanceof Element && ziel.closest("[data-aufklappliste]") !== null;
      if (ref.current && !ref.current.contains(ziel) && !inListe) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (disabled) {
    return (
      <div style={{
        width: "100%",
        padding: "8px 12px",
        fontSize: 14,
        borderRadius: 12,
        border: "0.5px solid var(--border-default)",
        background: "var(--bg-secondary)",
        color: "var(--text-tertiary)",
        cursor: "not-allowed",
        opacity: 0.4,
        fontFamily: "inherit",
        ...style,
      }}>
        {selectedLabel}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button
        type="button"
        ref={ausloeserRef}
        onClick={() => (open ? setOpen(false) : oeffnen())}
        className="flex items-center justify-between cursor-pointer"
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: 14,
          borderRadius: 12,
          border: open ? "1.5px solid var(--brand-primary)" : "0.5px solid var(--border-default)",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && lage && createPortal(
        <div data-aufklappliste style={{
          position: "fixed",
          top: lage.top,
          left: lage.left,
          width: lage.width,
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-default)",
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          zIndex: 1000,
          maxHeight: lage.maxHeight,
          overflowY: "auto",
          padding: "4px 0",
        }}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="flex items-center cursor-pointer"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  background: isSelected ? "var(--brand-primary-light)" : "transparent",
                  color: isSelected ? "var(--brand-primary)" : "var(--text-primary)",
                  fontWeight: isSelected ? 500 : 400,
                  border: "none",
                  textAlign: "left",
                  fontFamily: "inherit",
                  gap: 8,
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget.style.background = "var(--bg-secondary)"); }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget.style.background = "transparent"); }}
              >
                <span className="flex-1">{opt.label}</span>
                {isSelected && <Check style={{ width: 14, height: 14, color: "var(--brand-primary)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
