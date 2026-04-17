import React from "react";

interface SwatchGroupProps {
  title: string;
  description: string;
  swatches: { name: string; hex: string; token: string; light?: boolean }[];
}

function SwatchGroup({ title, description, swatches }: SwatchGroupProps) {
  return (
    <div>
      <h5 className="mb-0.5">{title}</h5>
      <p className="text-[11px] text-muted-foreground mb-3">{description}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {swatches.map((s) => (
          <div key={s.token} className="group">
            <div
              className="h-12 rounded-xl border border-border/50 flex items-end px-2.5 pb-1.5 transition-transform group-hover:scale-[1.02]"
              style={{ backgroundColor: s.hex }}
            >
              <span className={`text-[10px] font-mono ${s.light ? "text-foreground/60" : "text-white/80"}`}>
                {s.hex}
              </span>
            </div>
            <div className="mt-1.5 px-0.5">
              <div className="text-[12px]" style={{ fontWeight: 500 }}>{s.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{s.token}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DSColors() {
  return (
    <section>
      <h3 className="mb-1">Farbsystem</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Ruhige, natürliche Palette mit klaren Statusfarben für sofortige Erkennung.
      </p>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Primary */}
          <SwatchGroup
            title="Primär"
            description="Hauptfarbe für Aktionen und Fokus"
            swatches={[
              { name: "Primary", hex: "#4F46E5", token: "--primary" },
              { name: "Primary Hover", hex: "#4338CA", token: "--primary-hover" },
              { name: "Primary Light", hex: "#EEF2FF", token: "--primary-light", light: true },
            ]}
          />

          {/* Neutral */}
          <SwatchGroup
            title="Neutral"
            description="Hintergründe, Rahmen, Text"
            swatches={[
              { name: "Foreground", hex: "#111827", token: "--foreground" },
              { name: "Muted Text", hex: "#6B7280", token: "--muted-foreground" },
              { name: "Background", hex: "#F7F8FA", token: "--background", light: true },
            ]}
          />

          {/* Success */}
          <SwatchGroup
            title="Erfolg — Abrechenbar"
            description="Bestätigungen, abrechenbare Leistungen"
            swatches={[
              { name: "Success", hex: "#059669", token: "--success" },
              { name: "Success Medium", hex: "#D1FAE5", token: "--success-medium", light: true },
              { name: "Success Light", hex: "#ECFDF5", token: "--success-light", light: true },
            ]}
          />

          {/* Warning */}
          <SwatchGroup
            title="Warnung — In Vorbereitung"
            description="Warnungen, ausstehende Vorgänge"
            swatches={[
              { name: "Warning", hex: "#D97706", token: "--warning" },
              { name: "Warning Medium", hex: "#FEF3C7", token: "--warning-medium", light: true },
              { name: "Warning Light", hex: "#FFFBEB", token: "--warning-light", light: true },
            ]}
          />

          {/* Error */}
          <SwatchGroup
            title="Fehler — Gekündigt / Nicht abrechenbar"
            description="Fehler, Kündigungen, nicht abrechenbar"
            swatches={[
              { name: "Error", hex: "#DC2626", token: "--error" },
              { name: "Error Medium", hex: "#FEE2E2", token: "--error-medium", light: true },
              { name: "Error Light", hex: "#FEF2F2", token: "--error-light", light: true },
            ]}
          />

          {/* Neutral Status */}
          <SwatchGroup
            title="Neutral Status"
            description="Entwürfe, inaktive Einträge"
            swatches={[
              { name: "Neutral", hex: "#6B7280", token: "--neutral" },
              { name: "Neutral Medium", hex: "#F3F4F6", token: "--neutral-medium", light: true },
              { name: "Neutral Light", hex: "#F9FAFB", token: "--neutral-light", light: true },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
