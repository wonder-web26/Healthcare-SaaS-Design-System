import { type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  children: ReactNode;
  focused?: boolean;
}

export function FormField({ label, required, error, success, hint, children, focused }: FormFieldProps) {
  const labelColor = error ? "var(--status-danger)" : focused ? "var(--brand-primary)" : "var(--text-secondary)";
  const labelWeight = focused ? "var(--weight-medium)" : "var(--weight-regular)";

  return (
    <div>
      <label style={{ display: "block", fontSize: "var(--text-small)", color: labelColor, fontWeight: labelWeight, marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: "var(--status-danger)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 4 }}>{error}</div>}
      {success && !error && <div style={{ fontSize: "var(--text-meta)", color: "var(--status-success-text)", marginTop: 4 }}>{success}</div>}
      {hint && !error && !success && <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
