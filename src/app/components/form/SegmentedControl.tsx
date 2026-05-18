import { FormField } from "./FormField";

interface Option {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
}

export function SegmentedControl({ label, required, error, hint, value, onChange, options, disabled }: SegmentedControlProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <div
        role="radiogroup"
        className="inline-flex"
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-pill)",
          padding: 3,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : undefined,
        }}
        onKeyDown={e => {
          if (disabled) return;
          const idx = options.findIndex(o => o.value === value);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = (idx + 1) % options.length;
            onChange(options[next].value);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prev = (idx - 1 + options.length) % options.length;
            onChange(options[prev].value);
          }
        }}
        tabIndex={disabled ? -1 : 0}
      >
        {options.map(opt => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={-1}
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.value)}
              style={{
                padding: "6px 16px",
                borderRadius: "var(--radius-pill)",
                fontSize: 13,
                fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                color: "var(--text-primary)",
                background: isActive ? "var(--bg-elevated)" : "transparent",
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background 0.15s, font-weight 0.15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
