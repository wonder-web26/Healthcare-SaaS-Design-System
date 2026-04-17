import React from "react";
import { Plus, Save, Trash2, Download, ChevronRight, Loader2, Send, Sparkles } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

function Btn({
  variant = "primary",
  size = "md",
  children,
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  loading = false,
}: {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  disabled?: boolean;
  loading?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  const variantMap: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
    outline: "border border-border bg-card text-foreground hover:bg-secondary/60",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    destructive: "bg-error text-white hover:bg-error/90 shadow-sm",
  };

  const sizeMap: Record<Size, string> = {
    sm: "px-3 py-1.5 text-[12px] gap-1.5",
    md: "px-4 py-2 text-[13px]",
    lg: "px-5 py-2.5 text-[14px]",
  };

  const iconSize: Record<Size, string> = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-[18px] h-[18px]",
  };

  return (
    <button
      className={`${base} ${variantMap[variant]} ${sizeMap[size]} ${disabled || loading ? "opacity-40 pointer-events-none" : ""}`}
      disabled={disabled || loading}
      style={{ fontWeight: 500 }}
    >
      {loading ? <Loader2 className={`${iconSize[size]} animate-spin`} /> : Icon ? <Icon className={iconSize[size]} /> : null}
      {children}
      {IconRight && <IconRight className={iconSize[size]} />}
    </button>
  );
}

export function DSButtons() {
  return (
    <section>
      <h3 className="mb-1">Schaltflächen</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Klare Aktionshierarchie — Primary für Hauptaktionen, Secondary für Nebenaktionen.
      </p>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-8">
        {/* Variants */}
        <div>
          <h5 className="mb-3">Varianten</h5>
          <div className="flex flex-wrap gap-3 items-center">
            <Btn variant="primary">Primary</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="outline">Outline</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="destructive">Destructive</Btn>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h5 className="mb-3">Größen</h5>
          <div className="flex flex-wrap gap-3 items-center">
            <Btn size="sm">Klein (sm)</Btn>
            <Btn size="md">Mittel (md)</Btn>
            <Btn size="lg">Groß (lg)</Btn>
          </div>
        </div>

        {/* With Icons */}
        <div>
          <h5 className="mb-3">Mit Symbolen</h5>
          <div className="flex flex-wrap gap-3 items-center">
            <Btn icon={Plus}>Patient anlegen</Btn>
            <Btn variant="secondary" icon={Download}>Exportieren</Btn>
            <Btn variant="outline" icon={Save}>Speichern</Btn>
            <Btn variant="destructive" icon={Trash2}>Löschen</Btn>
            <Btn variant="primary" iconRight={ChevronRight}>Weiter</Btn>
            <Btn variant="outline" icon={Sparkles}>
              KI-Vorschlag
            </Btn>
          </div>
        </div>

        {/* States */}
        <div>
          <h5 className="mb-3">Zustände</h5>
          <div className="flex flex-wrap gap-3 items-center">
            <Btn>Aktiv</Btn>
            <Btn disabled>Deaktiviert</Btn>
            <Btn loading>Wird geladen…</Btn>
          </div>
        </div>

        {/* Contextual examples */}
        <div>
          <h5 className="mb-3">Kontextbeispiele</h5>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border-light">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider mr-auto" style={{ fontWeight: 500 }}>Dialog-Fußzeile</span>
              <Btn variant="ghost" size="sm">Abbrechen</Btn>
              <Btn size="sm" icon={Save}>Änderungen speichern</Btn>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border-light">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider mr-auto" style={{ fontWeight: 500 }}>Werkzeugleiste</span>
              <Btn size="sm" icon={Plus}>Neu</Btn>
              <Btn variant="outline" size="sm" icon={Download}>Export</Btn>
              <Btn variant="outline" size="sm" icon={Send}>Senden</Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
