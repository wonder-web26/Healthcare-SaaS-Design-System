import { useEffect } from "react";
import { X, Download } from "lucide-react";
import type { UploadedFile } from "./DocumentUploader";

interface Props {
  file: UploadedFile;
  isOpen: boolean;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeLabel(mime: string): string {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "JPG";
  if (mime.includes("png")) return "PNG";
  return "Datei";
}

export function DocumentPreviewModal({ file, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType.includes("pdf");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col" style={{
        background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)",
        maxWidth: 800, maxHeight: "90vh", width: "90%", overflow: "hidden",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0" style={{ padding: "16px 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          <div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{file.filename}</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>{mimeLabel(file.mimeType)} · {formatSize(file.sizeBytes)}</div>
          </div>
          <button type="button" onClick={onClose} className="flex items-center justify-center cursor-pointer" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center" style={{ background: "var(--bg-secondary)", minHeight: 300 }}>
          {isImage && <img src={file.dataUrl} alt={file.filename} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />}
          {isPdf && <object data={file.dataUrl} type="application/pdf" width="100%" style={{ height: 600 }}><p style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>PDF-Vorschau nicht verfügbar in diesem Browser.</p></object>}
          {!isImage && !isPdf && <p style={{ padding: 40, color: "var(--text-tertiary)", fontSize: "var(--text-body)" }}>Vorschau für diesen Dateityp nicht verfügbar</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end shrink-0" style={{ padding: "16px 20px", borderTop: "var(--border-thin) solid var(--border-default)", gap: "var(--space-2)" }}>
          <a href={file.dataUrl} download={file.filename} className="inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-1)", padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Download style={{ width: 14, height: 14 }} /> Herunterladen
          </a>
          <button type="button" onClick={onClose} className="inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-1)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
}
