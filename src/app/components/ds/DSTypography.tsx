import React from "react";

const typeScale = [
  { tag: "H1", size: "30px / 1.875rem", weight: 600, lineHeight: "1.3", tracking: "-0.025em", sample: "Patientenübersicht" },
  { tag: "H2", size: "24px / 1.5rem", weight: 600, lineHeight: "1.35", tracking: "-0.02em", sample: "Behandlungsplan" },
  { tag: "H3", size: "20px / 1.25rem", weight: 600, lineHeight: "1.4", tracking: "-0.015em", sample: "Abrechnungsdetails" },
  { tag: "H4", size: "16px / 1rem", weight: 600, lineHeight: "1.5", tracking: "0", sample: "Kontaktinformationen" },
  { tag: "H5", size: "14px / 0.875rem", weight: 600, lineHeight: "1.5", tracking: "0", sample: "Letzte Aktivitäten" },
  { tag: "Body", size: "14px / 0.875rem", weight: 400, lineHeight: "1.6", tracking: "0", sample: "Die Patientin zeigt stabile Vitalzeichen und gute Fortschritte in der Rehabilitation." },
  { tag: "Small", size: "12px / 0.75rem", weight: 400, lineHeight: "1.5", tracking: "0", sample: "Zuletzt aktualisiert: 26.02.2026, 14:30" },
  { tag: "Table", size: "13px / 0.8125rem", weight: 400, lineHeight: "1.5", tracking: "0", sample: "P-2026-0041 · Müller, Anna · Kardiologie" },
];

const sizeMap: Record<string, string> = {
  H1: "30px", H2: "24px", H3: "20px", H4: "16px", H5: "14px",
  Body: "14px", Small: "12px", Table: "13px",
};

export function DSTypography() {
  return (
    <section>
      <h3 className="mb-1">Typografie</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Inter Variable — optimiert für Bildschirmlesbarkeit in Gesundheitsanwendungen.
      </p>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {typeScale.map((t, i) => (
          <div
            key={t.tag}
            className={`flex flex-col lg:flex-row lg:items-baseline gap-1 lg:gap-8 px-6 py-5 ${
              i < typeScale.length - 1 ? "border-b border-border-light" : ""
            }`}
          >
            <div className="lg:w-[140px] shrink-0 flex items-baseline gap-3">
              <span
                className="inline-flex items-center justify-center w-[42px] h-[24px] rounded-md bg-primary/5 text-primary text-[11px]"
                style={{ fontWeight: 600 }}
              >
                {t.tag}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono hidden lg:inline">
                {t.size.split(" / ")[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontSize: sizeMap[t.tag],
                  fontWeight: t.weight,
                  lineHeight: t.lineHeight,
                  letterSpacing: t.tracking,
                }}
                className="text-foreground"
              >
                {t.sample}
              </div>
            </div>
            <div className="lg:w-[180px] shrink-0 text-[11px] text-muted-foreground font-mono hidden xl:block">
              w{t.weight} · {t.lineHeight} · {t.tracking === "0" ? "normal" : t.tracking}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
