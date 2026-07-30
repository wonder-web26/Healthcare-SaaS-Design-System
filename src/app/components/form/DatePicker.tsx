import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { FormField } from "./FormField";

interface DatePickerProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function DatePicker({ label, required, error, success, hint, value, onChange, placeholder = "TT.MM.JJJJ", minDate, maxDate, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => value ? value.getMonth() : new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => value ? value.getFullYear() : new Date().getFullYear());
  const ref = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && value) { setViewMonth(value.getMonth()); setViewYear(value.getFullYear()); }
  }, [open]);

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = (days[0].getDay() + 6) % 7; // Monday = 0
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  const borderColor = error ? "var(--status-danger)" : (open || focused) ? "var(--brand-primary)" : "var(--border-default)";
  const borderWidth = error || open || focused ? "1.5px" : "var(--border-thin)";

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const isDisabledDay = (d: Date) => {
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  };

  return (
    <FormField label={label} required={required} error={error} success={success} hint={hint || "Format: TT.MM.JJJJ"} focused={open || focused}>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
          className="w-full text-left outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            height: "var(--field-height)", padding: "0 16px 0 42px",
            borderRadius: "var(--radius-card)",
            border: `${borderWidth} solid ${borderColor}`,
            background: "var(--bg-elevated)",
            fontSize: "var(--text-small)",
            color: value ? "var(--text-primary)" : "var(--text-tertiary)",
            fontWeight: "var(--weight-regular)",
          }}
        >
          <Calendar style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-tertiary)" }} />
          {value ? formatDate(value) : placeholder}
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, width: 280,
            background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
            borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", padding: 16,
          }}>
            {/* Month nav */}
            <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
              <button type="button" onClick={prevMonth} className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <ChevronLeft style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
              </button>
              <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <ChevronRight style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7" style={{ gap: 0, marginBottom: 4 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", padding: "4px 0" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7" style={{ gap: 2 }}>
              {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(d => {
                const isSelected = value && isSameDay(d, value);
                const isToday = isSameDay(d, today);
                const isDis = isDisabledDay(d);
                return (
                  <button
                    key={d.getDate()}
                    type="button"
                    disabled={isDis}
                    onClick={() => { onChange(d); setOpen(false); }}
                    className="flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      width: 34, height: 34,
                      borderRadius: "var(--radius-pill)",
                      fontSize: "var(--text-small)",
                      fontWeight: isSelected ? "var(--weight-medium)" : "var(--weight-regular)",
                      color: isSelected ? "var(--text-on-dark)" : "var(--text-primary)",
                      background: isSelected ? "var(--brand-primary)" : "transparent",
                      border: isToday && !isSelected ? "var(--border-thin) solid var(--brand-primary)" : "none",
                    }}
                    onMouseEnter={e => { if (!isSelected && !isDis) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <div style={{ marginTop: "var(--space-3)", borderTop: "var(--border-thin) solid var(--border-default)", paddingTop: "var(--space-2)", textAlign: "center" }}>
              <button type="button" onClick={() => { onChange(today); setOpen(false); }} className="cursor-pointer" style={{ fontSize: "var(--text-meta)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)", background: "transparent", border: "none" }}>
                Heute
              </button>
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}
