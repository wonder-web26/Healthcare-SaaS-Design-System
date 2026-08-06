import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { berechneAufklappLage, useLageNachfuehren, type AufklappLage } from "../ui/aufklappliste";
import { ChevronDown, Check, Search } from "lucide-react";
import { FormField } from "./FormField";

interface Option { value: string; label: string; group?: string }

interface ComboboxProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  /** Maximalbreite des Bedienelements; die Beschriftung bleibt spaltenbreit. */
  steuerelementMaxBreite?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function Combobox({ label, required, error, success, hint, steuerelementMaxBreite, value, onChange, options, placeholder = "Bitte wählen", searchPlaceholder = "Suchen…", disabled }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const ausloeserRef = useRef<HTMLButtonElement>(null);
  const [lage, setLage] = useState<AufklappLage | null>(null);

  /* Höhe eines Eintrags plus der Suchzeile darüber. Im Browser gemessen:
     39.5 px je Eintrag; aufgerundet, damit acht ganz hineinpassen. */
  const EINTRAG_HOEHE = 40;
  const SUCHZEILE = 42;

  const lageBerechnen = useCallback(() => {
    const feld = ausloeserRef.current?.getBoundingClientRect();
    if (feld) setLage(berechneAufklappLage(feld, options.length, EINTRAG_HOEHE, SUCHZEILE + 9));
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
      if (ref.current && !ref.current.contains(ziel) && !inListe) { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => { if (open) { setFocusIdx(-1); setTimeout(() => searchRef.current?.focus(), 50); } }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // Group filtered options
  const grouped = useMemo(() => {
    const groups: { group: string; items: Option[] }[] = [];
    const map = new Map<string, Option[]>();
    for (const opt of filtered) {
      const g = opt.group || "";
      if (!map.has(g)) { map.set(g, []); groups.push({ group: g, items: map.get(g)! }); }
      map.get(g)!.push(opt);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = filtered;
  const selectedLabel = options.find(o => o.value === value)?.label;
  const borderColor = error ? "var(--status-danger)" : (open || focused) ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || open || focused ? "1.5px" : "var(--border-thin)";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, flatFiltered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && focusIdx >= 0 && focusIdx < flatFiltered.length) { e.preventDefault(); onChange(flatFiltered[focusIdx].value); setOpen(false); setSearch(""); }
  };

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} steuerelementMaxBreite={steuerelementMaxBreite} focused={open || focused}>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          ref={ausloeserRef}
          onClick={() => { if (!disabled) { open ? setOpen(false) : oeffnen(); } }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full text-left outline-none transition-all flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            height: "var(--field-height)", padding: "0 40px 0 16px",
            borderRadius: "var(--radius-card)",
            border: `${borderWidth} solid ${borderColor}`,
            background: "var(--bg-elevated)",
            fontSize: "var(--text-small)",
            color: selectedLabel ? "var(--text-primary)" : "var(--text-tertiary)",
            fontWeight: "var(--weight-regular)",
          }}
        >
          <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
          <ChevronDown style={{ position: "absolute", right: 16, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : "rotate(0)"}`, width: 14, height: 14, color: "var(--text-tertiary)", transition: "transform 0.15s" }} />
        </button>

        {open && lage && createPortal(
          <div
            data-aufklappliste
            onKeyDown={handleKeyDown}
            style={{
              position: "fixed", top: lage.top, left: lage.left, width: lage.width, zIndex: 1000,
              display: "flex", flexDirection: "column", maxHeight: lage.maxHeight,
              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
              borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", overflow: "hidden",
            }}
          >
            {/* Search */}
            <div className="flex items-center" style={{ padding: "10px 14px", borderBottom: "var(--border-thin) solid var(--border-default)", gap: 8 }}>
              <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setFocusIdx(0); }}
                placeholder={searchPlaceholder}
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", border: "none" }}
              />
            </div>

            {/* Options */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 4 }}>
              {flatFiltered.length === 0 ? (
                <div style={{ padding: "var(--space-5)", textAlign: "center", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                  Keine Ergebnisse
                </div>
              ) : (
                grouped.map(g => (
                  <div key={g.group}>
                    {g.group && (
                      <div style={{ padding: "8px 16px 4px", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
                        {g.group}
                      </div>
                    )}
                    {g.items.map(opt => {
                      const isSelected = opt.value === value;
                      const globalIdx = flatFiltered.indexOf(opt);
                      const isFocused = globalIdx === focusIdx;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                          onMouseEnter={() => setFocusIdx(globalIdx)}
                          className="w-full text-left flex items-center cursor-pointer transition-colors"
                          style={{
                            padding: "10px 16px", borderRadius: "var(--radius-card)",
                            fontSize: "var(--text-small)",
                            color: isSelected ? "var(--brand-primary)" : "var(--text-primary)",
                            fontWeight: isSelected ? "var(--weight-medium)" : "var(--weight-regular)",
                            background: isSelected ? "var(--brand-primary-light)" : isFocused ? "var(--bg-secondary)" : "transparent",
                          }}
                        >
                          <span className="flex-1">{opt.label}</span>
                          {isSelected && <Check style={{ width: 14, height: 14, color: "var(--brand-primary)", flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
      </div>
    </FormField>
  );
}
