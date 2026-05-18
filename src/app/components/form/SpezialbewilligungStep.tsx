/**
 * Migrated Spezialbewilligung B step for the onboarding wizard.
 * Replaces the old inline blocks in OnboardingPage.
 */
import { useState } from "react";
import { AlertTriangle, Info, CircleCheck, Calendar } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { DatePicker } from "./DatePicker";
import { DocumentUploader, type UploadedFile } from "./DocumentUploader";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import type { AngehoerigerFormData } from "../StepAngehoeriger";

interface Props {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date | null): string {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDE(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function SpezialbewilligungStep({ data, onChange }: Props) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const datumValue = parseDate(data.spezialbewilligungEinreichungsDatum);
  const hasDate = !!data.spezialbewilligungEinreichungsDatum;
  const hasDoc = !!data.spezialbewilligungDokument;
  const isComplete = hasDate && hasDoc;

  const docAsUploadedFile: UploadedFile | null = data.spezialbewilligungDokument
    ? { id: "spezialbewilligung", filename: data.spezialbewilligungDokument.name, mimeType: "application/pdf", sizeBytes: parseInt(data.spezialbewilligungDokument.size) || 0, dataUrl: "", uploadedAt: new Date() }
    : null;

  const handleDateChange = (d: Date | null) => {
    onChange({ ...data, spezialbewilligungEinreichungsDatum: toISO(d), spezialbewilligungStatus: d && hasDoc ? "eingereicht" : "ausstehend" });
  };

  const handleDocChange = (file: UploadedFile | null) => {
    if (file) {
      onChange({ ...data, spezialbewilligungDokument: { name: file.filename, size: String(file.sizeBytes) }, spezialbewilligungStatus: hasDate ? "eingereicht" : "ausstehend" });
    } else {
      onChange({ ...data, spezialbewilligungDokument: null, spezialbewilligungStatus: "ausstehend" });
    }
  };

  return (
    <div style={{ padding: "16px 32px var(--space-8)" }}>
      {/* Step header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-5)" }}>
        <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
          <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-card)", background: isComplete ? "var(--status-success-bg)" : "var(--status-warning-bg)" }}>
            {isComplete ? <CircleCheck style={{ width: 16, height: 16, color: "var(--status-success)" }} /> : <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-warning-text)" }} />}
          </div>
          <div>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Spezialbewilligung B</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>Compliance-Schritt</div>
          </div>
        </div>
        <span className="inline-flex items-center" style={{
          gap: 5, padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
          background: isComplete ? "var(--status-success-bg)" : hasDate || hasDoc ? "var(--status-warning-bg)" : "var(--bg-secondary)",
          color: isComplete ? "var(--status-success-text)" : hasDate || hasDoc ? "var(--status-warning-text)" : "var(--text-secondary)",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: isComplete ? "var(--status-success)" : hasDate || hasDoc ? "var(--status-warning)" : "var(--text-tertiary)" }} />
          {isComplete ? "Abgeschlossen" : hasDate || hasDoc ? "In Bearbeitung" : "Ausstehend"}
        </span>
      </div>

      {/* Explanation */}
      <div className="flex" style={{ gap: "var(--space-3)", padding: "var(--space-5)", background: "var(--brand-primary-light)", borderRadius: "var(--radius-card)", marginBottom: "var(--space-8)" }}>
        <Info style={{ width: 20, height: 20, color: "var(--brand-primary)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Was ist eine Spezialbewilligung?</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Für Angehörige mit Aufenthaltsstatus B muss vor Vertragsabschluss eine Spezialbewilligung beim Migrationsamt eingereicht werden. Erfasse hier das Einreichungsdatum und lade die Bestätigung der Einreichung hoch.
          </div>
        </div>
      </div>

      {/* Input fields */}
      <SectionHeader icon={Calendar} label="Einreichung" first />

      <div className="flex flex-col" style={{ gap: "var(--space-4)" }}>
        <DatePicker
          label="Einreichungsdatum beim Migrationsamt"
          required
          value={datumValue}
          onChange={handleDateChange}
          maxDate={new Date()}
          hint="Datum, an dem die Spezialbewilligung eingereicht wurde"
        />

        <DocumentUploader
          label="Einreichungs-Bestätigung"
          description="Lade die Bestätigung des Migrationsamts hoch, dass die Spezialbewilligung eingereicht wurde."
          required
          value={docAsUploadedFile}
          onChange={handleDocChange}
          onPreview={f => setPreviewFile(f)}
        />
      </div>

      {/* Warning banner (when not complete) */}
      {!isComplete && (
        <div className="flex items-center" style={{ gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", background: "var(--status-warning-bg)", borderRadius: "var(--radius-card)", marginTop: "var(--space-8)" }}>
          <AlertTriangle style={{ width: 18, height: 18, color: "var(--status-warning-text)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--status-warning-text)" }}>Vertrag noch blockiert</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginTop: 2 }}>
              Sobald du Datum und Bestätigung erfasst hast, ist der Vertragsschritt freigeschaltet.
            </div>
          </div>
        </div>
      )}

      {/* Success banner (when complete) */}
      {isComplete && (
        <div className="flex items-center" style={{ gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", background: "var(--status-success-bg)", borderRadius: "var(--radius-card)", marginTop: "var(--space-8)" }}>
          <CircleCheck style={{ width: 18, height: 18, color: "var(--status-success)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--status-success-text)" }}>Eingereicht</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginTop: 2 }}>
              Die Spezialbewilligung wurde am {formatDateDE(data.spezialbewilligungEinreichungsDatum)} eingereicht. Der Vertragsschritt ist freigeschaltet.
            </div>
          </div>
        </div>
      )}

      {previewFile && <DocumentPreviewModal file={previewFile} isOpen onClose={() => setPreviewFile(null)} />}
    </div>
  );
}
