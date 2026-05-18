import { useState, useCallback } from "react";
import { FormField } from "./FormField";

interface IBANInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatIBAN(raw: string): string {
  let clean = raw.replace(/\s/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Auto-prefix CH if user starts with digits
  if (clean.length > 0 && /^\d/.test(clean) && !clean.startsWith("CH")) {
    clean = "CH" + clean;
  }
  clean = clean.slice(0, 21);
  // Group in 4s
  let result = "";
  for (let i = 0; i < clean.length; i++) {
    if (i > 0 && i % 4 === 0) result += " ";
    result += clean[i];
  }
  return result;
}

function rawIBAN(formatted: string): string {
  return formatted.replace(/\s/g, "");
}

export function validateIBAN(input: string): { valid: boolean; reason?: string } {
  const iban = input.replace(/\s/g, "").toUpperCase();

  if (iban.length === 0) return { valid: false, reason: "IBAN ist erforderlich" };
  if (!iban.startsWith("CH")) return { valid: false, reason: "Schweizer IBAN beginnt mit CH" };
  if (iban.length !== 21) return { valid: false, reason: "Schweizer IBAN muss 21 Zeichen lang sein" };
  if (!/^[A-Z0-9]+$/.test(iban)) return { valid: false, reason: "IBAN darf nur Buchstaben und Ziffern enthalten" };

  // Modulo-97 (ISO 7064)
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map(ch => (/[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 65 + 10).toString() : ch))
    .join("");

  // BigInt for large number modulo
  try {
    const remainder = BigInt(numeric) % 97n;
    if (remainder !== 1n) return { valid: false, reason: "IBAN-Prüfsumme ist ungültig" };
  } catch {
    return { valid: false, reason: "IBAN konnte nicht geprüft werden" };
  }

  return { valid: true };
}

export function IBANInput({ label, required, value, onChange, placeholder = "CH93 0076 2011 6238 5295 7", disabled }: IBANInputProps) {
  const [focused, setFocused] = useState(false);
  const [blurred, setBlurred] = useState(false);

  const displayValue = formatIBAN(value);
  const validation = blurred && value.length > 0 ? validateIBAN(value) : null;
  const error = validation && !validation.valid ? validation.reason : undefined;
  const success = validation?.valid ? "IBAN gültig" : undefined;

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  const handleChange = useCallback((input: string) => {
    setBlurred(false);
    const formatted = formatIBAN(input);
    onChange(rawIBAN(formatted));
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const formatted = formatIBAN(pasted);
    onChange(rawIBAN(formatted));
  }, [onChange]);

  return (
    <FormField label={label} required={required} error={error} success={success} hint={!error && !success ? "Schweizer IBAN im Format CH## ####…" : undefined} focused={focused}>
      <input
        type="text"
        value={displayValue}
        onChange={e => handleChange(e.target.value)}
        onPaste={handlePaste}
        onFocus={() => { setFocused(true); setBlurred(false); }}
        onBlur={() => { setFocused(false); setBlurred(true); }}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={26}
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
          letterSpacing: "0.5px",
        }}
      />
    </FormField>
  );
}
