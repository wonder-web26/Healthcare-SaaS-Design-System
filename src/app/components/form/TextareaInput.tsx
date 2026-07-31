import { useState, type TextareaHTMLAttributes } from "react";
import { FormField } from "./FormField";

interface TextareaInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  /** Optional — ohne Label wird nur das Textfeld gerendert (für Aufrufstellen mit eigener Überschrift). */
  label?: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextareaInput({ label, required, error, success, hint, value, onChange, ...props }: TextareaInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  const feld = (
    <textarea
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
        minHeight: 80,
        resize: "vertical",
        lineHeight: 1.5,
      }}
      {...props}
    />
  );

  if (!label) return feld;

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint} focused={focused}>
      {feld}
    </FormField>
  );
}
