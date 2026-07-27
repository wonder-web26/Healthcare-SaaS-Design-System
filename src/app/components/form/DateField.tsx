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
import { Calendar as CalendarIcon, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { de } from "date-fns/locale";
import { addMonths, subMonths } from "date-fns";
import { useNavigation } from "react-day-picker";
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

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

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

/**
 * Eigener Kalenderkopf: genau eine Monatsauswahl, eine Jahresauswahl und zwei
 * Pfeile — deutsch, ohne die doppelte Standardüberschrift/-Dropdowns von
 * react-day-picker und ohne Überlagerung.
 */
function macheKalenderKopf(vonJahr: number, bisJahr: number) {
  const jahre: number[] = [];
  for (let y = bisJahr; y >= vonJahr; y--) jahre.push(y);
  const pfeil: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: "var(--radius-pill)",
    background: "transparent", border: "none", cursor: "pointer", flexShrink: 0,
  };
  const auswahl: React.CSSProperties = {
    padding: "5px 8px", borderRadius: "var(--radius-card)",
    border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)",
    fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", cursor: "pointer",
  };
  return function KalenderKopf() {
    const { currentMonth, goToMonth } = useNavigation();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 0 6px" }}>
        <button type="button" aria-label="Vorheriger Monat" style={pfeil} onClick={() => goToMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <select aria-label="Monat" value={currentMonth.getMonth()} style={auswahl}
            onChange={(e) => goToMonth(new Date(currentMonth.getFullYear(), Number(e.target.value), 1))}>
            {MONATE.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
          <select aria-label="Jahr" value={currentMonth.getFullYear()} style={{ ...auswahl, fontVariantNumeric: "tabular-nums" }}
            onChange={(e) => goToMonth(new Date(Number(e.target.value), currentMonth.getMonth(), 1))}>
            {jahre.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" aria-label="Nächster Monat" style={pfeil} onClick={() => goToMonth(addMonths(currentMonth, 1))}>
          <ChevronRight style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
        </button>
      </div>
    );
  };
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
  // Stabiler Schlüssel des aussen anliegenden Werts (auch für "date", das je
  // Render ein neues Date-Objekt liefert).
  const incomingKey = incoming ? dateZuIso(incoming) : "";
  const [selected, setSelected] = useState<Date | null>(incoming);
  const [text, setText] = useState<string>(incoming ? formatAnzeige(incoming) : "");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Externe Wertänderung (z. B. Schrittwechsel) übernehmen — nicht während der
  // Benutzer tippt und nicht, während eine ungültige Eingabe angezeigt wird
  // (die muss stehen bleiben).
  useEffect(() => {
    if (focused || error) return;
    setSelected(incomingKey ? incoming : null);
    setText(incomingKey ? formatAnzeige(incoming!) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey]);

  // Nach aussen nur melden, wenn sich der Wert tatsächlich geändert hat. Das
  // verhindert, dass ein erneutes Verlassen des Feldes ohne Änderung an einer
  // Aufrufstelle mit Toggle-Semantik (interRAI setAnswer) den Wert löscht.
  const emitIfChanged = (d: Date | null) => {
    const neuerKey = d ? dateZuIso(d) : "";
    if (neuerKey !== incomingKey) onChange(fromDate(d, wertFormat));
  };

  const commit = () => {
    const { date, status } = parseEingabe(text);
    if (status === "leer") {
      setError(null); setSelected(null); emitIfChanged(null);
    } else if (status === "ok" && date) {
      setText(formatAnzeige(date)); setError(null); setSelected(date); emitIfChanged(date);
    } else {
      // ungültig / unvollständig: Eingabe bleibt stehen, Wert bleibt leer.
      setError(status === "unvollstaendig"
        ? "Bitte das Jahr vierstellig eingeben."
        : "Kein gültiges Datum.");
      setSelected(null); emitIfChanged(null);
    }
    onBlur?.();
  };

  const waehleImKalender = (d: Date | undefined) => {
    if (!d) return;
    setSelected(d); setText(formatAnzeige(d)); setError(null); emitIfChanged(d);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const aufheben = () => {
    setSelected(null); setText(""); setError(null); emitIfChanged(null);
  };

  const heute = new Date();
  const jahr = heute.getFullYear();
  const zeigeHeute = bereich !== "past"; // nur "past" schliesst den Stichtag aus
  const vonJahr = 1900;
  const bisJahr = jahr + 10;

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
            display: "flex", alignItems: "center", width: "100%", maxWidth: 200, boxSizing: "border-box",
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
        onEscapeKeyDown={() => setOpen(false)}
        onCloseAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
      >
        <Calendar
          className="p-2"
          mode="single"
          locale={de}
          selected={selected ?? undefined}
          onSelect={waehleImKalender}
          month={undefined}
          defaultMonth={selected ?? (bereich === "past" ? new Date(jahr - 30, 0) : new Date())}
          components={{ Caption: macheKalenderKopf(vonJahr, bisJahr) }}
          classNames={{
            day: "size-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
            // Selected day: fill PLUS a visible inset ring (contrasting foreground)
            // PLUS bold — the second cue must not be the same colour as the fill.
            day_selected: "bg-primary text-primary-foreground font-bold ring-2 ring-inset ring-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "border border-muted-foreground",
            head_cell: "w-9 font-normal text-[0.8rem] text-muted-foreground",
          }}
        />
        {/* Fusszeile: eine Aktion füllt die volle Breite, zwei teilen sie sich
            (je flex:1). Innenabstand an das Tagesraster (p-2) angeglichen. */}
        <div
          style={{
            display: "flex", gap: 6, padding: "6px 8px",
            borderTop: "var(--border-thin) solid var(--border-default)",
          }}
        >
          <button
            type="button"
            onClick={aufheben}
            style={{
              flex: 1, minHeight: 44, padding: "0 10px", borderRadius: "var(--radius-card)",
              background: "transparent", border: "none", cursor: "pointer", textAlign: "center",
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
                flex: 1, minHeight: 44, padding: "0 10px", borderRadius: "var(--radius-card)",
                background: "transparent", border: "none", cursor: "pointer", textAlign: "center",
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
