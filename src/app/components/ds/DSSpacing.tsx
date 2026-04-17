import React from "react";

const spacingTokens = [
  { name: "1", px: 4 },
  { name: "2", px: 8 },
  { name: "3", px: 12 },
  { name: "4", px: 16 },
  { name: "5", px: 20 },
  { name: "6", px: 24 },
  { name: "8", px: 32 },
  { name: "10", px: 40 },
  { name: "12", px: 48 },
  { name: "16", px: 64 },
];

const radii = [
  { name: "sm", value: "6px" },
  { name: "md", value: "8px" },
  { name: "lg", value: "10px" },
  { name: "xl", value: "14px" },
  { name: "2xl", value: "18px" },
  { name: "full", value: "9999px" },
];

export function DSSpacing() {
  return (
    <section>
      <h3 className="mb-1">Abstände & Rundungen</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        8px-Raster als Grundlage — konsistente Abstände für harmonische Layouts.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Spacing Scale */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h5 className="mb-4">Abstandsskala (8px Grid)</h5>
          <div className="space-y-2.5">
            {spacingTokens.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <div className="w-8 text-[12px] text-muted-foreground font-mono shrink-0 text-right">
                  {s.name}
                </div>
                <div className="w-12 text-[11px] text-muted-foreground shrink-0">
                  {s.px}px
                </div>
                <div className="flex-1 h-6 flex items-center">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-primary/70 to-primary/30 transition-all"
                    style={{ width: `${Math.min(s.px * 2.5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radius */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h5 className="mb-4">Eckenradien</h5>
          <div className="grid grid-cols-3 gap-5">
            {radii.map((r) => (
              <div key={r.name} className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 bg-primary/8 border-2 border-primary/20"
                  style={{ borderRadius: r.value }}
                />
                <div className="text-[12px] mt-2" style={{ fontWeight: 500 }}>{r.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{r.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-border-light">
            <h5 className="mb-3">Verwendung</h5>
            <div className="space-y-2 text-[12px] text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-primary" style={{ fontWeight: 600 }}>sm</span>
                <span>Chips, kleine Tags, Badges</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary" style={{ fontWeight: 600 }}>lg</span>
                <span>Buttons, Inputs, Dropdowns</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary" style={{ fontWeight: 600 }}>xl</span>
                <span>Cards, Modals, Panels</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary" style={{ fontWeight: 600 }}>2xl</span>
                <span>Große Container, Hero-Bereiche</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
