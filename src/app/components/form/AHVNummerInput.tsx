import { useState, useCallback } from "react";
import { FormField } from "./FormField";

interface AHVNummerInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatAHV(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 3 || i === 7 || i === 11) result += ".";
    result += digits[i];
  }
  return result;
}

export function validateAHVNummer(input: string): { valid: boolean; reason?: string } {
  const digits = input.replace(/\./g, "");

  if (digits.length === 0) return { valid: false, reason: "AHV-Nummer ist erforderlich" };
  if (digits.length !== 13) return { valid: false, reason: "AHV-Nummer muss 13 Ziffern haben" };
  if (!/^\d{13}$/.test(digits)) return { valid: false, reason: "AHV-Nummer darf nur Ziffern enthalten" };
  if (!digits.startsWith("756")) return { valid: false, reason: "Schweizer AHV-Nummer beginnt mit 756" };

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }
  const expected = (10 - (sum % 10)) % 10;
  const actual = parseInt(digits[12], 10);

  if (expected !== actual) return { valid: false, reason: "Prüfziffer ist ungültig" };
  return { valid: true };
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
          padding: "11px 16px",
          borderRadius: "var(--radius-card)",
          border: `${borderWidth} solid ${borderColor}`,
          background: "var(--bg-elevated)",
          fontSize: "var(--text-body)",
          color: "var(--text-primary)",
          fontWeight: "var(--weight-regular)",
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </FormField>
  );
}
