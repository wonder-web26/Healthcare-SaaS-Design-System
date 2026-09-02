/**
 * Migrated Spezialbewilligung B step for the onboarding wizard.
 * Replaces the old inline blocks in OnboardingPage.
 */
import { useState } from "react";
import { AlertTriangle, Info, CircleCheck, Calendar } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { DateField } from "./DateField";
import { DocumentUploader, type UploadedFile } from "./DocumentUploader";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import type { AngehoerigerFormData } from "../StepAngehoeriger";
import { auslaenderrechtEingabe } from "../StepAngehoeriger";
import { pruefeAuslaenderrecht } from "../../../lib/regeln/auslaenderrecht";

interface Props {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  /** Kanton des Arbeitsorts — für die zuständige Stelle. */
  arbeitsortKanton?: string | null;
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

export function SpezialbewilligungStep({ data, onChange, arbeitsortKanton }: Props) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const ergebnis = pruefeAuslaenderrecht(auslaenderrechtEingabe(data, arbeitsortKanton ?? null));
  const istMeldung = ergebnis.regime === "meldung";
  const stelle = ergebnis.zustaendigeStelle;

  // Nachweis je Regime: Meldung → Meldedatum + optionale Bestätigung;
  // Bewilligung → Einreichungsdatum + optionale Bestätigung. Freigabe: nur das Datum.
  const datumWert = istMeldung ? (data.meldungDatum ?? "") : data.spezialbewilligungEinreichungsDatum;
  const dokument = istMeldung ? data.meldungBestaetigung : data.spezialbewilligungDokument;
  const hasDate = !!datumWert;
  const isComplete = hasDate; // Datum genügt für die Freigabe; die Bestätigung ist optional.

  const docAsUploadedFile: UploadedFile | null = dokument
    ? { id: "nachweis", filename: dokument.name, mimeType: "application/pdf", sizeBytes: parseInt(dokument.size) || 0, dataUrl: "", uploadedAt: new Date() }
    : null;

  const handleDateChange = (d: Date | null) => {
    if (istMeldung) {
      onChange({ ...data, meldungDatum: toISO(d) || null });
    } else {
      onChange({ ...data, spezialbewilligungEinreichungsDatum: toISO(d), spezialbewilligungStatus: d ? "eingereicht" : "ausstehend" });
    }
  };

  const handleDocChange = (file: UploadedFile | null) => {
    const doc = file ? { name: file.filename, size: String(file.sizeBytes) } : null;
    onChange(istMeldung ? { ...data, meldungBestaetigung: doc } : { ...data, spezialbewilligungDokument: doc });
  };

  const titel = istMeldung ? "Meldung des Stellenantritts" : "Bewilligung für den Stellenantritt";

  return (
    <div style={{ padding: "16px 32px var(--space-8)" }}>
      {/* Step header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-5)" }}>
        <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
          <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-card)", background: isComplete ? "var(--status-success-bg)" : "var(--status-warning-bg)" }}>
            {isComplete ? <CircleCheck style={{ width: 16, height: 16, color: "var(--status-success)" }} /> : <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-warning-text)" }} />}
          </div>
          <div>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>Nachweisschritt</div>
          </div>
        </div>
        <span className="inline-flex items-center" style={{
          gap: 5, padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
          background: isComplete ? "var(--status-success-bg)" : "var(--bg-secondary)",
          color: isComplete ? "var(--status-success-text)" : "var(--text-secondary)",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: isComplete ? "var(--status-success)" : "var(--text-tertiary)" }} />
          {isComplete ? "Dokumentiert" : "Ausstehend"}
        </span>
      </div>

      {/* Explanation */}
      <div className="flex" style={{ gap: "var(--space-3)", padding: "var(--space-5)", background: "var(--brand-primary-light)", borderRadius: "var(--radius-card)", marginBottom: "var(--space-8)" }}>
        <Info style={{ width: 20, height: 20, color: "var(--brand-primary)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>{titel}</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {istMeldung
              ? "Der Stellenantritt ist vor Arbeitsbeginn zu melden. Erfasse hier das Meldedatum und lade die Bestätigung hoch, sofern vorhanden."
              : "Für diese Anstellung ist eine Bewilligung erforderlich. Sie ist vor Arbeitsbeginn beim zuständigen Amt zu beantragen. Erfasse hier das Einreichungsdatum und lade die Bestätigung hoch. Die Arbeitsaufnahme darf erst nach Erteilung der Bewilligung erfolgen. Das System kann das nicht prüfen."}
            {stelle ? ` Zuständig: ${stelle}${istMeldung && ergebnis.meldekanal ? ` · Meldekanal: ${ergebnis.meldekanal}` : ""}.` : ""}
          </div>
        </div>
      </div>

      {/* Input fields */}
      <SectionHeader icon={Calendar} label={istMeldung ? "Meldung" : "Einreichung"} first />

      <div className="flex flex-col" style={{ gap: "var(--space-4)" }}>
        <DateField
          label={istMeldung ? "Meldedatum" : "Einreichungsdatum beim Migrationsamt"}
          required
          wertFormat="date"
          bereich="past"
          value={parseDate(datumWert)}
          onChange={(v) => handleDateChange(v as Date | null)}
          hint={istMeldung ? "Datum, an dem der Stellenantritt gemeldet wurde" : "Datum, an dem die Bewilligung eingereicht wurde"}
        />

        <DocumentUploader
          label={istMeldung ? "Bestätigung der Meldung (optional)" : "Einreichungs-Bestätigung (optional)"}
          description={istMeldung ? "Sofern vorhanden, lade die Bestätigung der Meldung hoch." : "Sofern vorhanden, lade die Bestätigung des Migrationsamts hoch."}
          value={docAsUploadedFile}
          onChange={handleDocChange}
          onPreview={f => setPreviewFile(f)}
        />
      </div>

      {/* Bestätigung, sobald das Datum erfasst ist */}
      {isComplete && (
        <div className="flex items-center" style={{ gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", background: "var(--status-success-bg)", borderRadius: "var(--radius-card)", marginTop: "var(--space-8)" }}>
          <CircleCheck style={{ width: 18, height: 18, color: "var(--status-success)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--status-success-text)" }}>Dokumentiert</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginTop: 2 }}>
              {istMeldung ? "Die Meldung wurde am " : "Die Einreichung wurde am "}{formatDateDE(datumWert)} erfasst.
            </div>
          </div>
        </div>
      )}

      {previewFile && <DocumentPreviewModal file={previewFile} isOpen onClose={() => setPreviewFile(null)} />}
    </div>
  );
}
