import React, { useState } from "react";
import { Search, Calendar, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

function InputField({
  label,
  placeholder,
  hint,
  error,
  success,
  disabled,
  type = "text",
  icon: Icon,
  required,
}: {
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  type?: string;
  icon?: React.ElementType;
  required?: boolean;
}) {
  const ring = error
    ? "border-error/60 focus-within:ring-error/10 focus-within:border-error"
    : success
    ? "border-success/60 focus-within:ring-success/10 focus-within:border-success"
    : "border-border focus-within:ring-primary/10 focus-within:border-primary/60";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[13px] text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-error">*</span>}
        </label>
      )}
      <div
        className={`flex items-center bg-card border ${ring} rounded-xl px-3 py-[9px] transition-all focus-within:ring-[3px] ${
          disabled ? "opacity-50 cursor-not-allowed bg-muted" : ""
        }`}
      >
        {Icon && <Icon className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/50 disabled:cursor-not-allowed"
          style={{ fontWeight: 400 }}
        />
        {error && <AlertCircle className="w-4 h-4 text-error ml-2 shrink-0" />}
        {success && <CheckCircle2 className="w-4 h-4 text-success ml-2 shrink-0" />}
      </div>
      {hint && !error && !success && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-error">{error}</p>}
      {success && <p className="text-[11px] text-success">{success}</p>}
    </div>
  );
}

function SelectField({ label, placeholder, options }: { label: string; placeholder: string; options: string[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-foreground">{label}</label>
      <div className="relative">
        <select
          className="w-full bg-card border border-border rounded-xl px-3 py-[9px] text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all appearance-none pr-8"
          defaultValue=""
          style={{ fontWeight: 400 }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

export function DSForms() {
  const [showPw, setShowPw] = useState(false);

  return (
    <section>
      <h3 className="mb-1">Formularfelder</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Einheitliche Eingabekomponenten mit Validierung und barrierefreier Gestaltung.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Inputs */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h5>Texteingaben</h5>
          <InputField label="Patientenname" placeholder="z.B. Müller, Anna" required />
          <InputField label="Suche" placeholder="Suchen…" icon={Search} />
          <InputField label="Geburtsdatum" placeholder="TT.MM.JJJJ" icon={Calendar} />
          <InputField label="AHV-Nummer" placeholder="756.XXXX.XXXX.XX" hint="13-stellige Versichertennummer" />
        </div>

        {/* States */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h5>Feldzustände</h5>
          <InputField label="Standard" placeholder="Eingabe hier…" />
          <InputField label="Fehler" placeholder="" error="Bitte geben Sie eine gültige AHV-Nummer ein." />
          <InputField label="Erfolg" placeholder="" success="AHV-Nummer bestätigt." />
          <InputField label="Deaktiviert" placeholder="Nicht bearbeitbar" disabled />
        </div>

        {/* Selects */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h5>Auswahl (Dropdown)</h5>
          <SelectField
            label="Abteilung"
            placeholder="Abteilung wählen…"
            options={["Pflege", "Hauswirtschaft", "Beratung", "Therapie"]}
          />
          <SelectField
            label="Status"
            placeholder="Status wählen…"
            options={["Aktiv", "In Vorbereitung", "Gekündigt", "Pausiert"]}
          />
          <SelectField
            label="Priorität"
            placeholder="Priorität wählen…"
            options={["Niedrig", "Mittel", "Hoch", "Dringend"]}
          />
        </div>

        {/* Textarea + Toggles */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h5>Textbereich & Schalter</h5>
          <div className="space-y-1.5">
            <label className="text-[13px] text-foreground">Anmerkungen</label>
            <textarea
              placeholder="Zusätzliche Informationen zum Patienten…"
              rows={3}
              className="w-full bg-card border border-border rounded-xl px-3 py-[9px] text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all resize-y placeholder:text-muted-foreground/50"
              style={{ fontWeight: 400 }}
            />
          </div>

          <div className="space-y-3 pt-1">
            <label className="text-[13px] text-foreground block mb-2">Schalter</label>
            {[
              { label: "Automatische Abrechnung aktiviert", defaultOn: true },
              { label: "E-Mail-Benachrichtigungen", defaultOn: false },
              { label: "KI-Vorschläge anzeigen", defaultOn: true },
            ].map((item) => (
              <ToggleRow key={item.label} label={item.label} defaultOn={item.defaultOn} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-primary" : "bg-switch-background"}`}
      >
        <span className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}
