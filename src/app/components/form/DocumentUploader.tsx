import { useState, useRef, useCallback } from "react";
import { CloudUpload, FileText, Eye, RefreshCw, X, Image } from "lucide-react";
import { FormField } from "./FormField";

export interface UploadedFile {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  uploadedAt: Date;
}

interface Props {
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  acceptedFormats?: string[];
  maxSizeBytes?: number;
  onPreview?: (file: UploadedFile) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(d: Date): string {
  return `heute ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function mimeLabel(mime: string): string {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "JPG";
  if (mime.includes("png")) return "PNG";
  return "Datei";
}

async function mockUploadFile(file: File): Promise<UploadedFile> {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { id: crypto.randomUUID(), filename: file.name, mimeType: file.type, sizeBytes: file.size, dataUrl, uploadedAt: new Date() };
}

export function DocumentUploader({ value, onChange, label, description, required, disabled, acceptedFormats = ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes = 10 * 1024 * 1024, onPreview }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!acceptedFormats.includes(file.type)) { setError("Dateiformat nicht unterstützt. Erlaubt: PDF, JPG, PNG"); return; }
    if (file.size > maxSizeBytes) { setError(`Datei zu gross. Maximum: ${formatSize(maxSizeBytes)}`); return; }
    setUploading(true);
    try {
      const uploaded = await mockUploadFile(file);
      onChange(uploaded);
    } catch { setError("Upload fehlgeschlagen. Bitte erneut versuchen."); }
    setUploading(false);
  }, [acceptedFormats, maxSizeBytes, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }, [processFile]);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }, [processFile]);

  const isImage = value?.mimeType.startsWith("image/");

  return (
    <FormField label={label} required={required} hint={description} error={error || undefined}>
      <input ref={inputRef} type="file" accept={acceptedFormats.join(",")} className="hidden" onChange={handleFileInput} disabled={disabled} />

      {/* Uploading */}
      {uploading && (
        <div style={{ background: "var(--bg-elevated)", border: "1px dashed var(--brand-primary)", borderRadius: "var(--radius-card)", padding: 24, textAlign: "center" }}>
          <div className="flex items-center justify-center" style={{ gap: 4, marginBottom: 8 }}>
            {[0, 1, 2].map(i => <div key={i} className="rounded-full" style={{ width: 6, height: 6, background: "var(--brand-primary)", animation: `doc-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            <style>{`@keyframes doc-pulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }`}</style>
          </div>
          <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)" }}>Wird hochgeladen…</div>
        </div>
      )}

      {/* Empty */}
      {!uploading && !value && (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="transition-all"
          style={{
            background: dragOver ? "var(--brand-primary-light)" : "var(--bg-elevated)",
            border: dragOver ? "1.5px solid var(--brand-primary)" : "1px dashed var(--border-default)",
            borderRadius: "var(--radius-card)",
            padding: 24,
            textAlign: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <CloudUpload style={{ width: 32, height: 32, color: dragOver ? "var(--brand-primary)" : "var(--text-tertiary)", margin: "0 auto 8px" }} />
          <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)" }}>Datei hierher ziehen oder klicken zum Auswählen</div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 4 }}>PDF, JPG oder PNG · max. {formatSize(maxSizeBytes)}</div>
        </div>
      )}

      {/* Uploaded */}
      {!uploading && value && (
        <div className="flex items-center" style={{ gap: 14, padding: "16px 18px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
          {/* Thumbnail / Icon */}
          {isImage ? (
            <img src={value.dataUrl} alt={value.filename} style={{ width: 48, height: 48, borderRadius: "var(--radius-card)", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div className="shrink-0 flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "var(--radius-card)", background: "var(--brand-primary-light)" }}>
              <FileText style={{ width: 24, height: 24, color: "var(--brand-primary)" }} />
            </div>
          )}
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{value.filename}</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>
              {mimeLabel(value.mimeType)} · {formatSize(value.sizeBytes)} · {formatTime(value.uploadedAt)}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center shrink-0" style={{ gap: "var(--space-1)" }}>
            {onPreview && (
              <button type="button" onClick={() => onPreview(value)} className="inline-flex items-center cursor-pointer transition-colors"
                style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Eye style={{ width: 14, height: 14 }} /> Vorschau
              </button>
            )}
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center cursor-pointer transition-colors"
              style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <RefreshCw style={{ width: 14, height: 14 }} /> Ersetzen
            </button>
            <button type="button" onClick={() => onChange(null)} className="flex items-center justify-center cursor-pointer transition-colors"
              style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <X style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
            </button>
          </div>
        </div>
      )}
    </FormField>
  );
}
