/**
 * DateField — produktweite Datums-Eingabekomponente.
 *
 * Baut auf shadcn Popover + shadcn Calendar (react-day-picker) auf und nutzt
 * ausschliesslich das zentrale Datums-Util (lib/datum). Intern arbeitet die
 * Komponente immer mit einem Date, nie mit Zeichenketten.
 *
 * Entkopplung: Über `wertFormat` passt sich die Komponente dem bestehenden
 * Speicherformat der Aufrufstelle an (ISO / Anzeigestring / Date-Objekt),
 * statt es zu vereinheitlichen.
 */
import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { de } from "date-fns/locale";
import { Popover, PopoverAnchor, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { FormField } from "./FormField";
import {
  formatAnzeige,
  formatMitWochentag,
  parseEingabe,
  istGueltig,
  isoZuDate,
  dateZuIso,
} from "../../../lib/datum";

/** In welchem Format nimmt die Komponente ihren Wert entgegen und gibt ihn zurück. */
export type DatumWertFormat = "iso" | "display" | "date";
/** Erwarteter Wertebereich — steuert nur Hinweis, "Heute"-Aktion und Kalender-Voreinstellung. Blockiert nie. */
export type DatumBereich = "past" | "future" | "any";

export interface DateFieldProps {
  value: string | Date | null;
  onChange: (value: string | Date | null) => void;
  wertFormat: DatumWertFormat;
  bereich?: DatumBereich;
  label?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

// ── Wert-Konversion je nach Aufrufstellen-Format ─────────────────────────────

function toDate(value: string | Date | null, fmt: DatumWertFormat): Date | null {
  if (value == null || value === "") return null;
  if (fmt === "date") return value instanceof Date && istGueltig(value) ? value : null;
  if (fmt === "iso") return isoZuDate(value as string);
  const { date, status } = parseEingabe(value as string);
  return status === "ok" ? date : null;
}

function fromDate(d: Date | null, fmt: DatumWertFormat): string | Date | null {
  if (!d) return fmt === "date" ? null : "";
  if (fmt === "date") return d;
  if (fmt === "iso") return dateZuIso(d);
  return formatAnzeige(d);
}

/** Ziffern → maskierter Anzeigestring; Trennpunkte setzt das Feld. */
function maskiere(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 4);
  if (d.length > 4) out += "." + d.slice(4, 8);
  return out;
}

function plausibilitaet(d: Date, bereich: DatumBereich): string | null {
  if (d.getFullYear() < 1900) return "Jahr vor 1900 — bitte prüfen.";
  const heute = new Date();
  const nurTag = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nurHeute = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate()).getTime();
  if (bereich === "past" && nurTag > nurHeute) return "Datum liegt in der Zukunft.";
  if (bereich === "future" && nurTag < nurHeute) return "Datum liegt in der Vergangenheit.";
  return null;
}

export function DateField({
  value,
  onChange,
  wertFormat,
  bereich = "any",
  label,
  required,
  hint,
  disabled,
  onBlur,
}: DateFieldProps) {
  const incoming = toDate(value, wertFormat);
  // Stable primitive key so a "date"-format caller passing a fresh Date object
  // on every render does not churn the sync effect below.
  const incomingKey = incoming ? dateZuIso(incoming) : "";
  const [selected, setSelected] = useState<Date | null>(incoming);
  const [text, setText] = useState<string>(incoming ? formatAnzeige(incoming) : "");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Externe Wertänderung (z. B. Schrittwechsel) übernehmen, solange nicht getippt wird.
  useEffect(() => {
    if (focused) return;
    setSelected(incomingKey ? incoming : null);
    setText(incomingKey ? formatAnzeige(incoming!) : "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey]);

  const emit = (d: Date | null) => onChange(fromDate(d, wertFormat));

  const commit = () => {
    const { date, status } = parseEingabe(text);
    if (status === "leer") {
      setError(null); setSelected(null); emit(null);
    } else if (status === "ok" && date) {
      setText(formatAnzeige(date)); setError(null); setSelected(date); emit(date);
    } else {
      // ungültig / unvollständig: Eingabe bleibt stehen, Wert bleibt leer.
      setError(status === "unvollstaendig"
        ? "Bitte das Jahr vierstellig eingeben."
        : "Kein gültiges Datum.");
      setSelected(null); emit(null);
    }
    onBlur?.();
  };

  const waehleImKalender = (d: Date | undefined) => {
    if (!d) return;
    setSelected(d); setText(formatAnzeige(d)); setError(null); emit(d);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const aufheben = () => {
    setSelected(null); setText(""); setError(null); emit(null);
  };

  const heute = new Date();
  const jahr = heute.getFullYear();
  const zeigeHeute = bereich === "any"; // past/future schliessen den Stichtag aus
  const fromYear = bereich === "future" ? jahr : 1900;
  const toYear = bereich === "past" ? jahr : jahr + 10;

  const plaus = selected && !error ? plausibilitaet(selected, bereich) : null;

  const borderColor = error
    ? "var(--status-danger)"
    : (focused || open)
    ? "var(--brand-primary)"
    : "var(--border-default)";

  const control = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className="relative"
          style={{
            display: "flex", alignItems: "center",
            borderRadius: "var(--radius-card)",
            border: `${error || focused || open ? "1.5px" : "var(--border-thin)"} solid ${borderColor}`,
            background: disabled ? "var(--bg-secondary)" : "var(--bg-elevated)",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={text}
            placeholder="TT.MM.JJJJ"
            aria-invalid={!!error}
            onChange={(e) => { setText(maskiere(e.target.value)); if (error) setError(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); commit(); }}
            style={{
              flex: 1, minWidth: 0,
              padding: "11px 8px 11px 14px",
              border: "none", outline: "none", background: "transparent",
              fontSize: "var(--text-body)", color: "var(--text-primary)",
              fontFamily: "inherit", fontVariantNumeric: "tabular-nums",
            }}
          />
          {error && (
            <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-danger)", flexShrink: 0, marginRight: 4 }} />
          )}
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Kalender öffnen"
              onClick={() => !disabled && setOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40, flexShrink: 0,
                background: "transparent", border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <CalendarIcon style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        style={{ width: "auto", padding: 0 }}
        onEscapeKeyDown={() => { setOpen(false); }}
        onCloseAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
      >
        <Calendar
          mode="single"
          locale={de}
          selected={selected ?? undefined}
          onSelect={waehleImKalender}
          defaultMonth={selected ?? (bereich === "past" ? new Date(jahr - 30, 0) : new Date())}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
          classNames={{
            day: "size-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
            day_selected: "bg-primary text-primary-foreground border-2 border-primary font-medium hover:bg-primary hover:text-primary-foreground",
            day_today: "border border-muted-foreground",
            head_cell: "w-9 font-normal text-[0.8rem] text-muted-foreground",
          }}
        />
        <div
          style={{
            display: "flex", justifyContent: zeigeHeute ? "space-between" : "flex-start",
            gap: 8, padding: "8px 12px", borderTop: "var(--border-thin) solid var(--border-default)",
          }}
        >
          <button
            type="button"
            onClick={aufheben}
            style={{
              minHeight: 44, padding: "0 12px", borderRadius: "var(--radius-card)",
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: "var(--text-small)", color: "var(--text-secondary)", fontFamily: "inherit",
            }}
          >
            Auswahl aufheben
          </button>
          {zeigeHeute && (
            <button
              type="button"
              onClick={() => waehleImKalender(new Date())}
              style={{
                minHeight: 44, padding: "0 12px", borderRadius: "var(--radius-card)",
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: "var(--text-small)", color: "var(--brand-primary)",
                fontWeight: "var(--weight-medium)", fontFamily: "inherit",
              }}
            >
              Heute
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  // Rückmeldung unter dem Feld: Wochentag (gültig) bzw. Plausibilitätshinweis.
  const feedback = (
    <>
      {selected && !error && (
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 4 }}>
          {formatMitWochentag(selected)}
        </div>
      )}
      {plaus && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 4 }}>
          <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
          {plaus}
        </div>
      )}
    </>
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error ?? undefined} hint={hint} focused={focused || open}>
        {control}
        {feedback}
      </FormField>
    );
  }

  return (
    <div>
      {control}
      {error && <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 4 }}>{error}</div>}
      {feedback}
    </div>
  );
}
