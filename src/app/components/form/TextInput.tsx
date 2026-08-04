import { useState, type InputHTMLAttributes } from "react";
import { FormField } from "./FormField";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  /** Maximalbreite des Bedienelements; die Beschriftung bleibt spaltenbreit. */
  steuerelementMaxBreite?: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ label, required, error, success, hint, steuerelementMaxBreite, value, onChange, ...inputProps }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} steuerelementMaxBreite={steuerelementMaxBreite} focused={focused}>
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
    </FormField>
  );
}
