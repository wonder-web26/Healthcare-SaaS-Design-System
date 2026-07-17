/**
 * PA-07: Gemeinsame Upload-Komponente für alle Dokument-Slots mit modus=upload.
 *
 * Bietet IMMER beide Wege:
 *   (a) Scannen mit der Kamera → automatische Konvertierung in PDF
 *   (b) Datei auswählen (Upload einer bestehenden Datei)
 *
 * Gilt für BEIDE Seiten: entitaet=patient UND entitaet=angehoeriger.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Upload,
  ScanLine,
  CloudUpload,
  RotateCcw,
  X,
  Check,
  CheckCircle2,
  Loader2,
  FolderSync,
} from "lucide-react";

/* ══════════════════════════════════════════
   SHARED TYPE
   ══════════════════════════════════════════ */

export interface ScanFile {
  name: string;
  type: string;
  size: string;
  timestamp: string;
  previewUrl: string | null;
}

/* ══════════════════════════════════════════
   UPLOAD BUTTONS (Scannen + Datei wählen)
   ══════════════════════════════════════════ */

interface DokumentScanUploadProps {
  /** Eindeutiger Schlüssel für den Scan-Slot */
  scanKey: string;
  /** Angezeigtes Label im Kamera-Modal */
  docLabel: string;
  /** Callback wenn eine Datei hochgeladen oder gescannt wird */
  onFile: (key: string, file: ScanFile) => void;
}

/**
 * Rendert zwei Buttons: «Scannen» (öffnet Kamera-Modal) und «Datei wählen».
 * Beide erzeugen ein ScanFile und rufen onFile(scanKey, file) auf.
 */
export function DokumentScanUpload({ scanKey, docLabel, onFile }: DokumentScanUploadProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const now = new Date();
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
      onFile(scanKey, {
        name: file.name,
        type: file.type,
        size: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(0)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        timestamp: now.toLocaleString("de-CH"),
        previewUrl,
      });
    }
    e.target.value = "";
  };

  const handleCameraCapture = (scanFile: ScanFile) => {
    onFile(scanKey, scanFile);
    setCameraOpen(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileInput}
      />
      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] hover:bg-primary/90 transition-colors cursor-pointer"
        style={{ fontWeight: 500, border: "none" }}
      >
        <Camera className="w-3.5 h-3.5" />
        Scannen
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <Upload className="w-3.5 h-3.5" />
        Datei wählen
      </button>

      <CameraModal
        open={cameraOpen}
        docLabel={docLabel}
        onCapture={handleCameraCapture}
        onClose={() => setCameraOpen(false)}
      />
    </>
  );
}

/* ══════════════════════════════════════════
   KAMERA-MODAL (Scan → PDF)
   ══════════════════════════════════════════ */

function CameraModal({
  open,
  docLabel,
  onCapture,
  onClose,
}: {
  open: boolean;
  docLabel: string;
  onCapture: (file: ScanFile) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"viewfinder" | "capturing" | "preview" | "uploading" | "done">("viewfinder");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("viewfinder");
      setCapturedImage(null);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  if (!open) return null;

  const handleCapture = () => {
    setPhase("capturing");
    timerRef.current = setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 280;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 400, 280);
        grad.addColorStop(0, "#f0f4ff");
        grad.addColorStop(0.5, "#e8eeff");
        grad.addColorStop(1, "#f5f7ff");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 280);
        ctx.strokeStyle = "#c7d2fe";
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 20, 340, 240);
        ctx.fillStyle = "#94a3b8";
        for (let i = 0; i < 6; i++) {
          const w = 120 + Math.random() * 180;
          ctx.fillRect(55, 50 + i * 32, w, 8);
        }
      }
      setCapturedImage(canvas.toDataURL("image/png"));
      setPhase("preview");
    }, 600);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhase("viewfinder");
  };

  const handleConfirm = () => {
    setPhase("uploading");
    timerRef.current = setTimeout(() => {
      setPhase("done");
      timerRef.current = setTimeout(() => {
        const now = new Date();
        onCapture({
          name: `${docLabel.replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, "_")}_${now.getTime()}.pdf`,
          type: "application/pdf",
          size: `${(Math.random() * 2 + 0.3).toFixed(1)} MB`,
          timestamp: now.toLocaleString("de-CH"),
          previewUrl: capturedImage,
        });
      }, 800);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>Dokument scannen</p>
              <p className="text-[11px] text-muted-foreground">{docLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative bg-black/95 aspect-[4/3] flex items-center justify-center overflow-hidden">
          {phase === "viewfinder" && (
            <>
              <div className="absolute inset-6 border-2 border-white/20 rounded-xl">
                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-md" />
                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-md" />
                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-md" />
                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-md" />
              </div>
              <div className="absolute inset-x-8 top-8 bottom-8">
                <div className="h-0.5 bg-primary/60 rounded-full" style={{ animation: "docscanline 2.5s ease-in-out infinite" }} />
                <style>{`@keyframes docscanline { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(calc(100% - 2px)); } }`}</style>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <ScanLine className="w-10 h-10 text-white/40" />
                <p className="text-[12px] text-white/50" style={{ fontWeight: 500 }}>Dokument im Rahmen positionieren</p>
              </div>
            </>
          )}
          {phase === "capturing" && (
            <div className="absolute inset-0 bg-white animate-pulse flex items-center justify-center">
              <Camera className="w-12 h-12 text-primary/30" />
            </div>
          )}
          {(phase === "preview" || phase === "uploading" || phase === "done") && capturedImage && (
            <div className="relative w-full h-full">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              {phase === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <CloudUpload className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <p className="text-white text-[13px]" style={{ fontWeight: 500 }}>Wird hochgeladen…</p>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ animation: "docuploadbar 1.5s ease-out forwards" }} />
                    <style>{`@keyframes docuploadbar { 0% { width: 0%; } 60% { width: 75%; } 100% { width: 100%; } }`}</style>
                  </div>
                </div>
              )}
              {phase === "done" && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-[14px]" style={{ fontWeight: 600 }}>Erfolgreich gespeichert</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <FolderSync className="w-3.5 h-3.5 text-white/70" />
                      <p className="text-white/70 text-[12px]">Dokument im SharePoint gespeichert.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-border-light">
          {phase === "viewfinder" && (
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors" style={{ fontWeight: 500 }}>Abbrechen</button>
              <button type="button" onClick={handleCapture} className="flex-[2] h-10 rounded-xl bg-primary text-primary-foreground text-[13px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors" style={{ fontWeight: 600 }}>
                <Camera className="w-4 h-4" /> Aufnahme
              </button>
            </div>
          )}
          {phase === "preview" && (
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={handleRetake} className="flex-1 h-10 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5" style={{ fontWeight: 500 }}>
                <RotateCcw className="w-3.5 h-3.5" /> Wiederholen
              </button>
              <button type="button" onClick={handleConfirm} className="flex-[2] h-10 rounded-xl bg-success text-white text-[13px] flex items-center justify-center gap-2 hover:bg-success/90 transition-colors" style={{ fontWeight: 600 }}>
                <Upload className="w-4 h-4" /> Hochladen & Speichern
              </button>
            </div>
          )}
          {(phase === "capturing" || phase === "uploading" || phase === "done") && (
            <div className="flex items-center justify-center h-10">
              {phase !== "done" ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px]">{phase === "capturing" ? "Wird aufgenommen…" : "Wird hochgeladen…"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[13px]" style={{ fontWeight: 500 }}>Dokument im SharePoint gespeichert.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
