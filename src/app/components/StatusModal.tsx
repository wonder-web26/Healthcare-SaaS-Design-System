import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Ban,
  Info,
  AlertTriangle,
  Save,
} from "lucide-react";
import {
  type PatientStatus,
  statusConfig,
  statusExplanations,
} from "./patientData";

/* ── All statuses to display in the modal ── */
const allStatuses: {
  key: string;
  status: PatientStatus;
  icon: React.ElementType;
}[] = [
  { key: "aktiv", status: "aktiv", icon: CheckCircle2 },
  { key: "nicht_abrechenbar", status: "nicht_abrechenbar", icon: XCircle },
  { key: "gekuendigt", status: "gekuendigt", icon: Ban },
];

interface StatusModalProps {
  open: boolean;
  onClose: () => void;
  currentStatus: PatientStatus;
  patientName: string;
}

export function StatusModal({
  open,
  onClose,
  currentStatus,
  patientName,
}: StatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [stopReason, setStopReason] = useState("");

  useEffect(() => {
    setSelectedStatus(currentStatus);
    setStopReason("");
  }, [currentStatus, open]);

  if (!open) return null;

  const explanation = statusExplanations[selectedStatus];
  const showStopReason = selectedStatus !== "aktiv";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-[580px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light shrink-0">
          <div>
            <h4 className="text-foreground">Abrechnungsstatus</h4>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Schliessen"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Status selector grid */}
          <div>
            <label className="text-[12px] text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 500 }}>
              Status wählen
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allStatuses.map((s) => {
                const cfg = statusConfig[s.status];
                const Icon = s.icon;
                const isSelected = selectedStatus === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSelectedStatus(s.key);
                      if (s.key === "aktiv") setStopReason("");
                    }}
                    className={`
                      flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all
                      ${
                        isSelected
                          ? `${cfg.bg} border-current/20 shadow-sm ring-1 ring-current/10`
                          : "border-border bg-card hover:bg-muted/40"
                      }
                    `}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? cfg.bg : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? cfg.text : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <div
                        className={`text-[13px] ${
                          isSelected ? cfg.text : "text-foreground"
                        }`}
                        style={{ fontWeight: isSelected ? 600 : 500 }}
                      >
                        {cfg.label}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {s.key === "aktiv"
                          ? "Abrechenbar"
                          : s.key === "nicht_abrechenbar"
                          ? "Abrechnungsstopp"
                          : "Beendet"}
                      </div>
                    </div>
                    {isSelected && currentStatus === s.status && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-card/80 text-muted-foreground" style={{ fontWeight: 500 }}>
                        Aktuell
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="bg-muted/40 rounded-xl p-4 border border-border-light">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p
                    className="text-[13px] text-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    {explanation.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    {explanation.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed italic">
                    {explanation.detail}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grund für Abrechnungsstopp */}
          {showStopReason && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <label
                  className="text-[13px] text-foreground"
                  style={{ fontWeight: 500 }}
                >
                  Grund für Abrechnungsstopp{" "}
                  <span className="text-error">*</span>
                </label>
              </div>
              <textarea
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                placeholder={
                  selectedStatus === "nicht_abrechenbar"
                    ? "z.B. Fehlende Kostengutsprache, abgelaufene Verordnung, administrativer Stopp…"
                    : "z.B. Patient verstorben, Umzug in Pflegeheim, Kündigung durch Krankenkasse…"
                }
                rows={3}
                className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all resize-none placeholder:text-muted-foreground/50"
                style={{ fontWeight: 400 }}
              />
              <p className="text-[11px] text-muted-foreground">
                Pflichtfeld — Bitte dokumentieren Sie den Grund für den
                Abrechnungsstopp.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-muted/20 rounded-b-2xl shrink-0">
          <p className="text-[11px] text-muted-foreground">
            Letzte Änderung: 25.02.2026, 09:15
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] text-foreground bg-transparent hover:bg-secondary transition-colors"
              style={{ fontWeight: 500 }}
            >
              Abbrechen
            </button>
            <button
              onClick={onClose}
              disabled={showStopReason && !stopReason.trim()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] text-primary-foreground shadow-sm transition-all ${
                showStopReason && !stopReason.trim()
                  ? "bg-primary/40 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover"
              }`}
              style={{ fontWeight: 500 }}
            >
              <Save className="w-4 h-4" />
              Status speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}