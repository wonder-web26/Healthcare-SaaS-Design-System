import type { ElementType } from "react";

interface SectionHeaderProps {
  icon: ElementType;
  label: string;
  first?: boolean;
}

export function SectionHeader({ icon: Icon, label, first }: SectionHeaderProps) {
  return (
    <div>
      {!first && (
        <div style={{ height: "var(--border-thin)", background: "var(--border-default)", marginBottom: 24 }} />
      )}
      <div className="flex items-center" style={{ gap: "var(--space-2)", paddingBottom: "var(--space-4)" }}>
        <div className="shrink-0 flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
          <Icon style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
        </div>
        <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{label}</span>
      </div>
    </div>
  );
}
