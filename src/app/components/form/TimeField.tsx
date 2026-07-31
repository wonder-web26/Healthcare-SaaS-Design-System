/**
 * TimeField — produktweite Uhrzeit-Eingabekomponente.
 *
 * Gleiches Muster wie DateField: getippt statt natives Browser-Control, kein
 * Dropdown. Platzhalter SS:MM, der Doppelpunkt wird gesetzt. Beim Verlassen
 * tolerante Interpretation (0930 · 9:30 · 09.30 → 09:30). Eine ungültige
 * Eingabe bleibt stehen und wird gekennzeichnet, der gespeicherte Wert bleibt
 * leer. Der gespeicherte Wert ist "SS:MM" oder "". Höhe aus --field-height,
 * Höchstbreite 120 (--field-w-xs). inputMode numeric → Zifferntastatur.
 */
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FormField } from "./FormField";

export interface TimeFieldProps {
  /** Gespeicherter Wert: "SS:MM" oder "" */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

/** Ziffern → maskierter Anzeigestring; den Doppelpunkt setzt das Feld nach 2 Stellen. */
function maskiere(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  let out = d.slice(0, 2);
  if (d.length > 2) out += ":" + d.slice(2, 4);
  return out;
}

type ParseErgebnis = { status: "leer" | "ok" | "ungueltig"; wert?: string };

/** Tolerante Interpretation: 0930 · 9:30 · 09.30 → 09:30. Leer bleibt leer. */
function parseZeit(raw: string): ParseErgebnis {
  const d = raw.replace(/\D/g, "");
  if (d.length === 0) return { status: "leer" };
  let hh: number, mm: number;
  if (d.length <= 2) { hh = parseInt(d, 10); mm = 0; }
  else if (d.length === 3) { hh = parseInt(d.slice(0, 1), 10); mm = parseInt(d.slice(1, 3), 10); }
  else { hh = parseInt(d.slice(0, 2), 10); mm = parseInt(d.slice(2, 4), 10); }
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh > 23 || mm > 59) return { status: "ungueltig" };
  return { status: "ok", wert: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` };
}

export function TimeField({ value, onChange, label, required, hint, disabled, onBlur }: TimeFieldProps) {
  const [text, setText] = useState<string>(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  // Externe Wertänderung übernehmen — nicht während Eingabe und nicht, während
  // eine ungültige Eingabe angezeigt wird (die muss stehen bleiben).
  useEffect(() => {
    if (focused || error) return;
    setText(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = () => {
    const r = parseZeit(text);
    if (r.status === "leer") {
      setError(null);
      if (value !== "") onChange("");
    } else if (r.status === "ok") {
      setText(r.wert!);
      setError(null);
      if (value !== r.wert) onChange(r.wert!);
    } else {
      // ungültig: Eingabe bleibt stehen, gespeicherter Wert bleibt leer.
      setError("Keine gültige Uhrzeit (SS:MM).");
      if (value !== "") onChange("");
    }
    onBlur?.();
  };

  const borderColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || focused ? "1.5px" : "var(--border-thin)";

  const control = (
    <div
      style={{
        display: "flex", alignItems: "center", width: "100%", maxWidth: "var(--field-w-xs)",
        height: "var(--field-height)", boxSizing: "border-box",
        borderRadius: "var(--radius-card)",
        border: `${borderWidth} solid ${borderColor}`,
        background: disabled ? "var(--bg-secondary)" : "var(--bg-elevated)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={text}
        placeholder="SS:MM"
        aria-invalid={!!error}
        onChange={(e) => { setText(maskiere(e.target.value)); if (error) setError(null); }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); commit(); }}
        style={{
          flex: 1, minWidth: 0, height: "100%",
          padding: "0 8px 0 14px",
          border: "none", outline: "none", background: "transparent",
          fontSize: "var(--text-body)", color: "var(--text-primary)",
          fontFamily: "inherit", fontVariantNumeric: "tabular-nums",
        }}
      />
      {error && (
        <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-danger)", flexShrink: 0, marginRight: 10 }} />
      )}
    </div>
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error ?? undefined} hint={!error ? hint : undefined} focused={focused} inhaltstyp="zeit">
        {control}
      </FormField>
    );
  }

  return (
    <div>
      {control}
      {error && <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 4 }}>{error}</div>}
    </div>
  );
}
