import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { FormField } from "./FormField";

interface Option { value: string; label: string }

interface SelectProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ label, required, error, success, hint, value, onChange, options, placeholder = "Bitte wählen", disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => { if (open) setFocusIdx(options.findIndex(o => o.value === value)); }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label;
  const borderColor = error ? "var(--status-danger)" : (open || focused) ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || open || focused ? "1.5px" : "var(--border-thin)";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (open && focusIdx >= 0) { onChange(options[focusIdx].value); setOpen(false); } else { setOpen(true); } }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) { setOpen(true); } else { setFocusIdx(i => (i + 1) % options.length); } }
    if (e.key === "ArrowUp") { e.preventDefault(); if (!open) { setOpen(true); } else { setFocusIdx(i => (i - 1 + options.length) % options.length); } }
  };

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} focused={open || focused}>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          className="w-full text-left outline-none transition-all flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            padding: "11px 40px 11px 16px",
            borderRadius: "var(--radius-card)",
            border: `${borderWidth} solid ${borderColor}`,
            background: "var(--bg-elevated)",
            fontSize: "var(--text-body)",
            color: selectedLabel ? "var(--text-primary)" : "var(--text-tertiary)",
            fontWeight: "var(--weight-regular)",
            position: "relative",
          }}
        >
          <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
          <ChevronDown style={{ position: "absolute", right: 16, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : "rotate(0)"}`, width: 14, height: 14, color: "var(--text-tertiary)", transition: "transform 0.15s" }} />
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
            background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
            borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)",
            padding: 4, maxHeight: 320, overflowY: "auto",
          }}>
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isFocused = i === focusIdx;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  onMouseEnter={() => setFocusIdx(i)}
                  className="w-full text-left flex items-center cursor-pointer transition-colors"
                  style={{
                    padding: "10px 16px",
                    borderRadius: "var(--radius-card)",
                    fontSize: "var(--text-body)",
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
        )}
      </div>
    </FormField>
  );
}
