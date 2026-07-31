import { type ReactNode } from "react";
import { breiteFuerInhalt, type Inhaltstyp } from "./inhaltstyp";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  children: ReactNode;
  focused?: boolean;
  /** Inhaltstyp → Höchstbreite (Breite kommt weiter aus dem Raster, dies ist nur der Deckel). */
  inhaltstyp?: Inhaltstyp;
}

export function FormField({ label, required, error, success, hint, children, focused, inhaltstyp }: FormFieldProps) {
  const labelColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--text-secondary)";
  const labelWeight = focused ? "var(--weight-medium)" : "var(--weight-regular)";

  return (
    <div style={{ maxWidth: breiteFuerInhalt(inhaltstyp) }}>
      {/* §C Formularskala: Beschriftung 12 (Beschriftungsgrau), Abstand Beschriftung/Feld 4 */}
      <label style={{ display: "block", fontSize: "var(--text-meta)", color: labelColor, fontWeight: labelWeight, marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: "var(--status-danger)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {/* Hilfstext/Feedback unter dem Feld: 11 */}
      {error && <div style={{ fontSize: "var(--text-micro)", color: "var(--status-danger)", marginTop: 4 }}>{error}</div>}
      {success && !error && <div style={{ fontSize: "var(--text-micro)", color: "var(--status-success-text)", marginTop: 4 }}>{success}</div>}
      {hint && !error && !success && <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
