import { useState, type InputHTMLAttributes } from "react";
import { FormField } from "./FormField";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ label, required, error, success, hint, value, onChange, ...inputProps }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} focused={focused}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full outline-none transition-all"
        style={{
          padding: "11px 16px",
          borderRadius: "var(--radius-card)",
          border: `${borderWidth} solid ${borderColor}`,
          background: "var(--bg-elevated)",
          fontSize: "var(--text-body)",
          color: "var(--text-primary)",
          fontWeight: "var(--weight-regular)",
        }}
        {...inputProps}
      />
    </FormField>
  );
}
