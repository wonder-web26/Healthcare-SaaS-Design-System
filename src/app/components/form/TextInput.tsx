import { useState, type InputHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { breiteFuerInhalt, type Inhaltstyp } from "./inhaltstyp";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Optional — ohne Label wird nur das Feld gerendert (für inline-Aufrufstellen mit eigener Beschriftung). */
  label?: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  inhaltstyp?: Inhaltstyp;
}

export function TextInput({ label, required, error, success, hint, value, onChange, inhaltstyp, ...inputProps }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  const feld = (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full outline-none transition-all"
      style={{
        height: "var(--field-height)",
        padding: "0 16px",
        borderRadius: "var(--radius-card)",
        border: `${borderWidth} solid ${borderColor}`,
        background: "var(--bg-elevated)",
        fontSize: "var(--text-small)",
        color: "var(--text-primary)",
        fontWeight: "var(--weight-regular)",
      }}
      {...inputProps}
    />
  );

  if (!label) return <div style={{ maxWidth: breiteFuerInhalt(inhaltstyp) }}>{feld}</div>;

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} focused={focused} inhaltstyp={inhaltstyp}>
      {feld}
    </FormField>
  );
}
