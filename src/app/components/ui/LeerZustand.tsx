/**
 * LeerZustand — das eine Leerzustands-Muster für alle Module (§B).
 *
 * Zentriert, ~40px Innenabstand oben/unten:
 *   - Symbol 26, Beschriftungsgrau
 *   - Titel 14, mittlerer Schnitt — benennt, was fehlt
 *   - Untertitel 12, Sekundärfarbe — benennt, wie es entsteht
 *   - darunter, sofern eine Aktion existiert, ein SEKUNDÄRER Knopf (Höhe 32)
 *
 * Kein Primärknopf (ein Leerzustand ist kein Hauptweg), kein Zähler und keine
 * Überschrift oberhalb.
 */
import type { ElementType } from "react";
import { AppButton } from "./AppButton";

export interface LeerZustandProps {
  icon: ElementType;
  titel: string;
  untertitel?: string;
  /** Sofern eine Aktion existiert. Ohne Aktion bleibt der Leerzustand ohne Knopf. */
  aktion?: { label: string; onClick: () => void; icon?: ElementType };
}

export function LeerZustand({ icon: Icon, titel, untertitel, aktion }: LeerZustandProps) {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: "40px 24px", gap: 6 }}>
      <Icon style={{ width: 26, height: 26, color: "var(--text-tertiary)", marginBottom: 2 }} />
      <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</div>
      {untertitel && (
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: 420, lineHeight: 1.45 }}>{untertitel}</div>
      )}
      {aktion && (
        // §B: sekundärer Knopf, Höhe 32 (style-Override, AppButton-Komponente unverändert)
        <AppButton variant="sekundaer" icon={aktion.icon} onClick={aktion.onClick} style={{ height: 32, marginTop: 8 }}>
          {aktion.label}
        </AppButton>
      )}
    </div>
  );
}
