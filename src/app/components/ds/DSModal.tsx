import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Trash2, Save, UserPlus, Info } from "lucide-react";

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;
  const widths = { sm: "max-w-[400px]", md: "max-w-[520px]", lg: "max-w-[640px]" };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-card rounded-2xl shadow-2xl border border-border w-full ${widths[size]}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <h4>{title}</h4>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition-colors" aria-label="Schließen">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-light bg-muted/30 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function DemoBtn({
  children,
  onClick,
  variant = "outline",
  icon: Icon,
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  icon?: React.ElementType;
  size?: "sm" | "md";
}) {
  const v: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
    outline: "border border-border bg-card text-foreground hover:bg-secondary/60",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    destructive: "bg-error text-white hover:bg-error/90",
  };
  const s = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]";

  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl transition-all cursor-pointer ${v[variant]} ${s}`} style={{ fontWeight: 500 }}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

export function DSModal() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  return (
    <section>
      <h3 className="mb-1">Dialoge (Modal)</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Modale Fenster für Bestätigungen, Formulare und Systemmeldungen.
      </p>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex flex-wrap gap-3">
          <DemoBtn onClick={() => setConfirmOpen(true)} icon={Save} variant="primary">Bestätigungsdialog</DemoBtn>
          <DemoBtn onClick={() => setDeleteOpen(true)} icon={Trash2} variant="destructive">Löschdialog</DemoBtn>
          <DemoBtn onClick={() => setFormOpen(true)} icon={UserPlus}>Formulardialog</DemoBtn>
          <DemoBtn onClick={() => setSuccessOpen(true)} icon={CheckCircle2} variant="primary">Erfolgsmeldung</DemoBtn>
        </div>
      </div>

      {/* Confirm */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Änderungen speichern" size="sm"
        footer={<>
          <DemoBtn onClick={() => setConfirmOpen(false)} variant="ghost">Abbrechen</DemoBtn>
          <DemoBtn onClick={() => setConfirmOpen(false)} variant="primary" icon={Save}>Speichern</DemoBtn>
        </>}
      >
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Möchten Sie die Änderungen am Behandlungsplan von Patientin Müller, Anna speichern?
          Diese Änderung wird sofort im System wirksam.
        </p>
      </Modal>

      {/* Delete */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Patient endgültig entfernen" size="sm"
        footer={<>
          <DemoBtn onClick={() => setDeleteOpen(false)} variant="ghost">Abbrechen</DemoBtn>
          <DemoBtn onClick={() => setDeleteOpen(false)} variant="destructive" icon={Trash2}>Endgültig löschen</DemoBtn>
        </>}
      >
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-error-light flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div>
            <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Achtung: Unwiderrufliche Aktion</p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              Alle Daten von Patient Fischer, Klaus (P-0044) werden endgültig gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </div>
      </Modal>

      {/* Form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Neuen Patienten erfassen" size="lg"
        footer={<>
          <DemoBtn onClick={() => setFormOpen(false)} variant="ghost">Abbrechen</DemoBtn>
          <DemoBtn onClick={() => setFormOpen(false)} variant="primary" icon={UserPlus}>Patient anlegen</DemoBtn>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Nachname *", placeholder: "Nachname" },
            { label: "Vorname *", placeholder: "Vorname" },
            { label: "AHV-Nummer", placeholder: "756.XXXX.XXXX.XX" },
            { label: "Geburtsdatum *", placeholder: "TT.MM.JJJJ" },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-[12px] text-foreground">{f.label}</label>
              <input
                placeholder={f.placeholder}
                className="w-full bg-card border border-border rounded-xl px-3 py-[9px] text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
          ))}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[12px] text-foreground">Leistungsart</label>
            <select className="w-full bg-card border border-border rounded-xl px-3 py-[9px] text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all appearance-none" defaultValue="" style={{ fontWeight: 400 }}>
              <option value="" disabled>Leistung wählen…</option>
              <option>Pflege HKP</option>
              <option>Pflege A</option>
              <option>Hauswirtschaft</option>
              <option>Beratung</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Success */}
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Erfolgreich" size="sm"
        footer={<DemoBtn onClick={() => setSuccessOpen(false)} variant="primary">Weiter</DemoBtn>}
      >
        <div className="text-center py-3">
          <div className="w-14 h-14 rounded-full bg-success-light flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <p className="text-[14px] text-foreground" style={{ fontWeight: 500 }}>Patient erfolgreich angelegt</p>
          <p className="text-[12px] text-muted-foreground mt-1">ID: P-0047 · Müller, Anna wurde im System erfasst.</p>
        </div>
      </Modal>
    </section>
  );
}
