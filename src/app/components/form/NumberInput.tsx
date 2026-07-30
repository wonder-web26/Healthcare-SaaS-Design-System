import { useState, type InputHTMLAttributes } from "react";
import { FormField } from "./FormField";

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}

export function NumberInput({ label, required, error, success, hint, value, onChange, suffix, ...inputProps }: NumberInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} focused={focused}>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => {
            const v = e.target.value.replace(/[^0-9.,]/g, "");
            onChange(v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full outline-none transition-all"
          style={{
            height: "var(--field-height)", padding: suffix ? "0 48px 0 16px" : "0 16px",
            borderRadius: "var(--radius-card)",
            border: `${borderWidth} solid ${borderColor}`,
            background: "var(--bg-elevated)",
            fontSize: "var(--text-small)",
            color: "var(--text-primary)",
            fontWeight: "var(--weight-regular)",
            MozAppearance: "textfield",
          }}
          {...inputProps}
        />
        {suffix && (
          <span className="absolute right-0 top-0 bottom-0 flex items-center" style={{ paddingRight: 16, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", pointerEvents: "none" }}>
            {suffix}
          </span>
        )}
      </div>
    </FormField>
  );
}
