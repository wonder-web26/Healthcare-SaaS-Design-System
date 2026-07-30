import { useState, useCallback } from "react";
import { FormField } from "./FormField";
import { validiereAHV, maskiereAHV } from "../../../lib/validierung";

interface AHVNummerInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Format und Prüfung laufen zentral über lib/validierung (keine zweite
// Implementierung derselben Prüfung). Die Export-Signatur bleibt erhalten.
const formatAHV = maskiereAHV;

export function validateAHVNummer(input: string): { valid: boolean; reason?: string } {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return { valid: false, reason: "AHV-Nummer ist erforderlich" };
  const res = validiereAHV(input);
  return res.status === "ok" ? { valid: true } : { valid: false, reason: res.meldung };
}

export function AHVNummerInput({ label, required, value, onChange, placeholder = "756.1234.5678.97", disabled }: AHVNummerInputProps) {
  const [focused, setFocused] = useState(false);
  const [blurred, setBlurred] = useState(false);

  const digits = value.replace(/\./g, "");
  const validation = blurred && digits.length > 0 ? validateAHVNummer(value) : null;
  const error = validation && !validation.valid ? validation.reason : undefined;
  const success = validation?.valid ? "Prüfziffer korrekt" : undefined;

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  const handleChange = useCallback((raw: string) => {
    setBlurred(false);
    onChange(formatAHV(raw));
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    onChange(formatAHV(pasted));
  }, [onChange]);

  return (
    <FormField label={label} required={required} error={error} success={success} hint={!error && !success ? "Format: 756.XXXX.XXXX.XX" : undefined} focused={focused}>
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onPaste={handlePaste}
        onFocus={() => { setFocused(true); setBlurred(false); }}
        onBlur={() => { setFocused(false); setBlurred(true); }}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={16}
        className="w-full outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          height: "var(--field-height)", padding: "0 16px",
          borderRadius: "var(--radius-card)",
          border: `${borderWidth} solid ${borderColor}`,
          background: "var(--bg-elevated)",
          fontSize: "var(--text-small)",
          color: "var(--text-primary)",
          fontWeight: "var(--weight-regular)",
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </FormField>
  );
}
