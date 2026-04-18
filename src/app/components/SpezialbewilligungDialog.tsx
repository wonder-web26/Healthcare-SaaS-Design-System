import { useState, useRef, useCallback } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  X,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { AngehoerigerFormData } from "./StepAngehoeriger";

interface SpezialbewilligungDialogProps {
  data: AngehoerigerFormData;
  onChange: (data: AngehoerigerFormData) => void;
  onClose: () => void;
}

const TODAY_ISO = "2026-03-03";

function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

type UploadPhase = "idle" | "uploading" | "error" | "done";

export function SpezialbewilligungDialog({ data, onChange, onClose }: SpezialbewilligungDialogProps) {
  const isEingereicht = data.spezialbewilligungStatus === "eingereicht";
  const hasDocument = !!data.spezialbewilligungDokument;

  const [einreichungsDatum, setEinreichungsDatum] = useState(
    data.spezialbewilligungEinreichungsDatum || TODAY_ISO
  );
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUpload = useCallback(
    (file: File) => {
      setValidationError(null);

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "jpg", "jpeg", "png"].includes(ext || "") || file.size > 10 * 1024 * 1024) {
        setValidationError("Nur PDF, JPG oder PNG bis 10 MB erlaubt");
        return;
      }

      pendingFileRef.current = file;
      setUploadFileName(file.name);
      setUploadPhase("uploading");

      setTimeout(() => {
        const f = pendingFileRef.current;
        if (!f) return;

        const sizeStr =
          f.size < 1024 * 1024
            ? `${Math.round(f.size / 1024)} KB`
            : `${(f.size / (1024 * 1024)).toFixed(1)} MB`;

        const datumDisplay = formatDateDisplay(einreichungsDatum);
        const fileExt = f.name.split(".").pop()?.toLowerCase() || "pdf";
        const structuredName = `Einreichungs-Bestätigung Spezialbewilligung B – ${datumDisplay}.${fileExt}`;

        onChange({
          ...data,
          spezialbewilligungStatus: "eingereicht",
          spezialbewilligungDokument: { name: structuredName, size: sizeStr },
          spezialbewilligungEinreichungsDatum: einreichungsDatum,
        });

        setUploadPhase("done");
        setIsReplacing(false);
        pendingFileRef.current = null;
      }, 1500);
    },
    [data, onChange, einreichungsDatum]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processUpload(file);
    },
    [processUpload]
  );

  const handleRemove = () => {
    onChange({
      ...data,
      spezialbewilligungStatus: "ausstehend",
      spezialbewilligungDokument: null,
      spezialbewilligungEinreichungsDatum: "",
    });
    setShowRemoveConfirm(false);
    setUploadPhase("idle");
    setIsReplacing(false);
  };

  const retryUpload = () => {
    if (pendingFileRef.current) {
      processUpload(pendingFileRef.current);
    }
  };

  const showUploadZone = (!isEingereicht && uploadPhase !== "uploading") || isReplacing;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={uploadPhase === "uploading" ? undefined : onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-[580px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border-light shrink-0">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isEingereicht ? "bg-success-light" : "bg-error-light"
            }`}>
              {isEingereicht ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-error" />
              )}
            </div>
            <div>
              <h4 className="text-foreground">Spezialbewilligung B</h4>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Erwerbstätigkeits-Bewilligung beim Migrationsamt
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Vor der Vertragsunterzeichnung muss die Erwerbstätigkeitsbewilligung beim Migrationsamt
            beantragt werden. Die Einreichung wird hier dokumentiert, damit die Nachweise revisionssicher
            abgelegt sind und die Vertragsphase freigegeben werden kann.
          </p>

          {/* Step 1 — informational */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-muted text-muted-foreground">
              <span className="text-[11px]" style={{ fontWeight: 700 }}>1</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
                Antrag beim Migrationsamt stellen
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                Stellen Sie den Antrag auf Erwerbstätigkeitsbewilligung beim kantonal zuständigen
                Migrationsamt. Die Spitex-Verwaltung kennt den passenden Zugang.
              </p>
            </div>
          </div>

          {/* Step 2 — upload */}
          <div className="flex gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isEingereicht ? "bg-success text-white" : "bg-primary text-primary-foreground"
            }`}>
              {isEingereicht ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="text-[11px]" style={{ fontWeight: 700 }}>2</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
                Einreichungs-Bestätigung hochladen
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                Lade die Bestätigung vom Migrationsamt hoch, dass der Antrag eingereicht wurde.
                Sobald das Dokument vorliegt, wird die Vertragsphase freigegeben.
              </p>

              {/* Uploaded document display */}
              {isEingereicht && hasDocument && !isReplacing && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-foreground truncate" style={{ fontWeight: 500 }}>
                        {data.spezialbewilligungDokument!.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {data.spezialbewilligungDokument!.size} · Eingereicht am {formatDateDisplay(data.spezialbewilligungEinreichungsDatum)}
                      </div>
                    </div>
                    <CheckCircle2 className="w-4.5 h-4.5 text-success shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReplacing(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-[11px] rounded-lg border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                      Austauschen
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-[11px] rounded-lg border border-error/20 text-error-foreground hover:bg-error-light transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Entfernen
                    </button>
                  </div>
                </div>
              )}

              {/* Upload progress */}
              {uploadPhase === "uploading" && (
                <div className="mt-3 flex items-center gap-3 px-3 py-3 rounded-xl border border-primary/20 bg-primary-light">
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-foreground truncate" style={{ fontWeight: 500 }}>
                      {uploadFileName}
                    </div>
                    <div className="mt-1.5 h-1.5 bg-primary/15 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ animation: "upload-progress 1.5s ease-out forwards" }} />
                    </div>
                  </div>
                  <style>{`@keyframes upload-progress { from { width: 0% } to { width: 100% } }`}</style>
                </div>
              )}

              {/* Upload error */}
              {uploadPhase === "error" && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-error/20 bg-error-light">
                  <AlertCircle className="w-4 h-4 text-error shrink-0" />
                  <span className="text-[12px] text-error-foreground" style={{ fontWeight: 500 }}>
                    Upload fehlgeschlagen ·{" "}
                    <button onClick={retryUpload} className="underline cursor-pointer">erneut versuchen</button>
                  </span>
                </div>
              )}

              {/* Validation error */}
              {validationError && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-error/30 bg-error-light">
                  <AlertCircle className="w-4 h-4 text-error shrink-0" />
                  <span className="text-[12px] text-error-foreground" style={{ fontWeight: 500 }}>
                    {validationError}
                  </span>
                </div>
              )}

              {/* Upload zone */}
              {showUploadZone && uploadPhase !== "uploading" && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>
                      Einreichungs-Datum
                    </label>
                    <input
                      type="date"
                      value={einreichungsDatum}
                      onChange={(e) => setEinreichungsDatum(e.target.value)}
                      className="mt-1 w-full bg-input-background border border-border rounded-xl px-3.5 py-2 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all"
                    />
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl transition-colors ${
                      validationError ? "border-error bg-error-light/30" :
                      isDragOver ? "border-primary bg-primary-light" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <div className="text-center">
                      <span className="text-[12px] text-muted-foreground">
                        Datei hierher ziehen oder{" "}
                      </span>
                      <button
                        onClick={() => { setValidationError(null); fileInputRef.current?.click(); }}
                        className="text-[12px] text-primary hover:underline cursor-pointer"
                        style={{ fontWeight: 500 }}
                      >
                        durchsuchen
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">
                      PDF, JPG oder PNG · max. 10 MB
                    </span>
                  </div>

                  {isReplacing && (
                    <button
                      onClick={() => setIsReplacing(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              )}

              {/* Success banner */}
              {isEingereicht && !isReplacing && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success-light text-[12px] text-success-foreground">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span style={{ fontWeight: 500 }}>Einreichung dokumentiert · Vertragsphase ist jetzt freigegeben</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-muted/20 rounded-b-2xl shrink-0">
          <div className="text-[12px]">
            {isEingereicht ? (
              <span className="text-success-foreground" style={{ fontWeight: 500 }}>
                Status: Eingereicht am {formatDateDisplay(data.spezialbewilligungEinreichungsDatum)}
              </span>
            ) : (
              <span className="text-error-foreground" style={{ fontWeight: 500 }}>
                Status: Ausstehend
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={uploadPhase === "uploading"}
              className="px-4 py-2 rounded-xl text-[13px] text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 500 }}
            >
              Schliessen
            </button>
            <button
              onClick={onClose}
              disabled={uploadPhase === "uploading"}
              className="px-4 py-2 rounded-xl text-[13px] bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 500 }}
            >
              {isEingereicht ? "Fertig" : "Speichern"}
            </button>
          </div>
        </div>

        {/* Remove confirmation */}
        {showRemoveConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-foreground/10 backdrop-blur-[1px]">
            <div className="bg-card rounded-xl border border-border shadow-xl p-5 max-w-[360px] mx-4">
              <h5 className="text-foreground">Dokument entfernen?</h5>
              <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                Damit wird die Vertragsphase wieder blockiert.
              </p>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="px-3 py-[6px] rounded-xl text-[12px] text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleRemove}
                  className="px-3 py-[6px] rounded-xl text-[12px] bg-error text-white hover:bg-error/90 transition-colors cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
