/**
 * Migrated form sub-components for StepAngehoeriger Tabs 3, 4, 6.
 * Uses new form components from components/form/.
 */
import { useState } from "react";
import { Users, IdCard, Coins, FileText, Plus, Upload, Eye, Check } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TextInput } from "./TextInput";
import { AHVNummerInput } from "./AHVNummerInput";
import { SegmentedControl } from "./SegmentedControl";
import { Select as FormSelect } from "./Select";
import { GroupBox } from "./GroupBox";
import { DocumentUploader, type UploadedFile } from "./DocumentUploader";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import type { AngehoerigerFormData } from "../StepAngehoeriger";

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];
const GESCHLECHT = [{ value: "maennlich", label: "Männlich" }, { value: "weiblich", label: "Weiblich" }, { value: "divers", label: "Divers" }];
const ZULAGENART = [{ value: "K", label: "K (Kinderzulage)" }, { value: "W", label: "W (Weiterbildung)" }];
const AUSBILDUNG = [{ value: "gymnasium", label: "Gymnasium" }, { value: "lehre", label: "Lehre" }, { value: "fachhochschule", label: "Fachhochschule" }, { value: "universitaet", label: "Universität" }, { value: "andere", label: "Andere" }];
const AUFENTHALT_PARTNER = [
  { value: "schweiz", label: "Schweizer Bürger/in" }, { value: "B", label: "B – Aufenthaltsbewilligung" },
  { value: "C", label: "C – Niederlassungsbewilligung" }, { value: "L", label: "L – Kurzaufenthalts." },
  { value: "G", label: "G – Grenzgänger" }, { value: "F", label: "F – Vorläufige Aufnahme" },
];

/* ══════════════════════════════════════════
   TAB 3: PARTNER (migrated)
   ══════════════════════════════════════════ */
export function PartnerFormV2({ data, onChange }: { data: AngehoerigerFormData; onChange: (d: AngehoerigerFormData) => void }) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });

  const needsPartner = data.zivilstand === "verheiratet" || data.zivilstand === "eingetragene_partnerschaft" || data.quellensteuer === "ja";
  const showZemis = ["F", "B", "L"].includes(data.partnerAufenthaltsstatus);
  const showAnmeldung = data.partnerFbAusweisAngemeldet === "ja";

  if (!needsPartner) {
    return (
      <div style={{ padding: "var(--space-8) var(--space-6)", textAlign: "center" }}>
        <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "var(--radius-avatar)", background: "var(--status-success-bg)", margin: "0 auto var(--space-4)" }}>
          <Check style={{ width: 24, height: 24, color: "var(--status-success)" }} />
        </div>
        <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Keine Partnerangaben erforderlich</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
          Dieser Tab ist für {data.vorname || "diesen Angehörigen"} nicht relevant. Bei Wechsel des Zivilstands oder der Quellensteuer-Pflicht erscheinen hier die Partner-Daten.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Users} label="Partner-Identität" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="Name" required value={data.partnerName} onChange={v => set("partnerName", v)} onBlur={() => touch("partnerName")} placeholder="Nachname" error={touched.partnerName && !filled(data.partnerName) ? "Pflichtfeld" : undefined} />
        <TextInput label="Vorname" required value={data.partnerVorname} onChange={v => set("partnerVorname", v)} onBlur={() => touch("partnerVorname")} placeholder="Vorname" error={touched.partnerVorname && !filled(data.partnerVorname) ? "Pflichtfeld" : undefined} />
        <TextInput label="Geburtsdatum" required value={data.partnerGeburtsdatum} onChange={v => set("partnerGeburtsdatum", v)} onBlur={() => touch("partnerGeburtsdatum")} placeholder="01.01.1985" hint="Format: TT.MM.JJJJ" />
        <div /> {/* spacer */}
      </div>
      <div style={{ marginTop: "var(--space-5)" }}>
        <AHVNummerInput label="AHV-Nummer Partner" required value={data.partnerAhvNummer} onChange={v => set("partnerAhvNummer", v)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-5)" }}>
        <FormSelect label="Aufenthaltsstatus" required value={data.partnerAufenthaltsstatus || null} onChange={v => { set("partnerAufenthaltsstatus", v || ""); touch("partnerAufenthaltsstatus"); }} options={AUFENTHALT_PARTNER} placeholder="Status wählen" />
        {showZemis && <TextInput label="ZEMIS-Nummer" required value={data.partnerZemisNummer} onChange={v => set("partnerZemisNummer", v)} onBlur={() => touch("partnerZemisNummer")} placeholder="ZEMIS-Nummer" hint="Nur bei Status F, B oder L" />}
      </div>

      <SectionHeader icon={IdCard} label="FB-Ausweis" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <SegmentedControl label="FB-Ausweis angemeldet?" required value={data.partnerFbAusweisAngemeldet} onChange={v => set("partnerFbAusweisAngemeldet", v)} options={JA_NEIN} />
        {showAnmeldung && <TextInput label="Anmeldungsdatum" required value={data.partnerAnmeldungDatum} onChange={v => set("partnerAnmeldungDatum", v)} onBlur={() => touch("partnerAnmeldungDatum")} placeholder="15.02.2026" hint="Format: TT.MM.JJJJ" />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 4: KINDER & ZULAGEN (migrated)
   ══════════════════════════════════════════ */
export function KinderFormV2({ data, onChange }: { data: AngehoerigerFormData; onChange: (d: AngehoerigerFormData) => void }) {
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });
  const hasKids = data.hatUnterhaltspflichtigeKinder === "ja";

  const addKind = () => {
    const id = `kind-${Date.now()}`;
    onChange({ ...data, kinder: [...data.kinder, { id, name: "", vorname: "", geburtsdatum: "", ahvNummer: "", geschlecht: "", zulagenart: "K", ausbildungsstatus: "", ausbildungsbeginn: "" }], anzahlKinder: String(data.kinder.length + 1) });
  };

  const removeKind = (id: string) => {
    const next = data.kinder.filter(k => k.id !== id);
    onChange({ ...data, kinder: next, anzahlKinder: String(next.length) });
  };

  const updateKind = (id: string, field: string, value: string) => {
    onChange({ ...data, kinder: data.kinder.map(k => k.id === id ? { ...k, [field]: value } : k) });
  };

  if (!hasKids) {
    return (
      <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
        <SectionHeader icon={Users} label="Unterhaltspflichtige Kinder" first />
        <SegmentedControl label="Unterhaltspflichtige Kinder?" required value={data.hatUnterhaltspflichtigeKinder} onChange={v => {
          if (v === "ja") {
            const id = `kind-${Date.now()}`;
            onChange({ ...data, hatUnterhaltspflichtigeKinder: v, kinder: [{ id, name: "", vorname: "", geburtsdatum: "", ahvNummer: "", geschlecht: "", zulagenart: "K", ausbildungsstatus: "", ausbildungsbeginn: "" }], anzahlKinder: "1" });
          } else {
            onChange({ ...data, hatUnterhaltspflichtigeKinder: v, kinder: [], kinderzulagenUeberSpitex: "nein", anzahlKinder: "0" });
          }
        }} options={JA_NEIN} />
        <div style={{ marginTop: "var(--space-6)", textAlign: "center" }}>
          <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "var(--radius-avatar)", background: "var(--status-success-bg)", margin: "0 auto var(--space-4)" }}>
            <Check style={{ width: 24, height: 24, color: "var(--status-success)" }} />
          </div>
          <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Keine unterhaltspflichtigen Kinder</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>Dieser Abschnitt wird automatisch als vollständig markiert.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Users} label="Unterhaltspflichtige Kinder" first />
      <div style={{ marginBottom: "var(--space-5)" }}>
        <SegmentedControl label="Unterhaltspflichtige Kinder?" required value="ja" onChange={v => {
          if (v === "nein") onChange({ ...data, hatUnterhaltspflichtigeKinder: v, kinder: [], kinderzulagenUeberSpitex: "nein", anzahlKinder: "0" });
        }} options={JA_NEIN} />
      </div>

      {/* Kinder-Liste */}
      <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
        {data.kinder.map((kind, idx) => (
          <GroupBox
            key={kind.id}
            title={`Kind ${idx + 1}`}
            subtitle={kind.zulagenart === "W" ? "W-Zulage" : "K-Zulage"}
            onRemove={() => removeKind(kind.id)}
            removeDisabled={data.kinder.length <= 1}
            removeDisabledTooltip="Mindestens ein Kind erforderlich"
          >
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
              <TextInput label="Name" required value={kind.name} onChange={v => updateKind(kind.id, "name", v)} placeholder="Nachname" />
              <TextInput label="Vorname" required value={kind.vorname} onChange={v => updateKind(kind.id, "vorname", v)} placeholder="Vorname" />
              <TextInput label="Geburtsdatum" required value={kind.geburtsdatum} onChange={v => updateKind(kind.id, "geburtsdatum", v)} placeholder="01.01.2015" hint="TT.MM.JJJJ" />
              <FormSelect label="Geschlecht" required value={kind.geschlecht || null} onChange={v => updateKind(kind.id, "geschlecht", v || "")} options={GESCHLECHT} placeholder="Wählen" />
            </div>
            <div style={{ marginTop: "var(--space-4)" }}>
              <AHVNummerInput label="AHV-Nummer" required value={kind.ahvNummer} onChange={v => updateKind(kind.id, "ahvNummer", v)} />
            </div>
            <div style={{ marginTop: "var(--space-4)" }}>
              <SegmentedControl label="Zulagenart" required value={kind.zulagenart} onChange={v => {
                if (v === "K") updateKind(kind.id, "zulagenart", v);
                else onChange({ ...data, kinder: data.kinder.map(k => k.id === kind.id ? { ...k, zulagenart: v } : k) });
              }} options={ZULAGENART} />
            </div>
            {kind.zulagenart === "W" && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
                <FormSelect label="Ausbildungsstatus" required value={kind.ausbildungsstatus || null} onChange={v => updateKind(kind.id, "ausbildungsstatus", v || "")} options={AUSBILDUNG} placeholder="Status wählen" />
                <TextInput label="Ausbildungsbeginn" required value={kind.ausbildungsbeginn} onChange={v => updateKind(kind.id, "ausbildungsbeginn", v)} placeholder="01.09.2024" hint="TT.MM.JJJJ" />
              </div>
            )}
          </GroupBox>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <button type="button" onClick={addKind} className="inline-flex items-center cursor-pointer transition-colors"
          style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
          <Plus style={{ width: 14, height: 14 }} /> Weiteres Kind hinzufügen
        </button>
      </div>

      {data.kinder.length > 0 && (
        <>
          <SectionHeader icon={Coins} label="Zulagen-Abrechnung" />
          <SegmentedControl label="Kinderzulagen über Spitex abrechnen?" required value={data.kinderzulagenUeberSpitex} onChange={v => set("kinderzulagenUeberSpitex", v)} options={JA_NEIN} hint="Wenn Nein, werden die Zulagen über den Arbeitgeber des Partners abgerechnet" />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 6: DOKUMENTE (migrated visually)
   ══════════════════════════════════════════ */
export function DokumenteFormV2({ data, onChange, onOpenSpezialbewilligung }: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  onOpenSpezialbewilligung?: () => void;
}) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const docSlots: { key: string; label: string; description: string; condition: boolean }[] = [
    { key: "id_scan", label: "ID oder Pass", description: "Gültiger Reisepass oder Identitätskarte (Vorder- und Rückseite)", condition: true },
    { key: "spezialbewilligung_b", label: "Spezialbewilligung B", description: "Einreichungs-Bestätigung vom Migrationsamt", condition: data.aufenthaltsstatus === "B" },
    { key: "krankenkassenkarte", label: "Krankenkassenkarte", description: "Versichertenkarte mit Kartennummer und Versicherungsnummer", condition: true },
    { key: "bankkarte", label: "Bankkarte", description: "Debit-/Kreditkarte mit IBAN-Zuordnung oder Bankbestätigung", condition: true },
    { key: "partner_krankenkassenkarte", label: "Partner-Krankenkassenkarte", description: "Versichertenkarte des Partners / der Partnerin", condition: data.zivilstand === "verheiratet" || data.zivilstand === "eingetragene_partnerschaft" || data.quellensteuer === "ja" },
    { key: "kinder_krankenkassenkarte", label: "Kinder-Krankenkassenkarte", description: "Versichertenkarten aller unterhaltspflichtigen Kinder", condition: data.hatUnterhaltspflichtigeKinder === "ja" },
    { key: "nachweis_unterhaltspflichtige_kinder", label: "Nachweis Unterhaltspflicht", description: "Familienbüchlein oder Geburtsurkunde. Eines der beiden genügt.", condition: data.hatUnterhaltspflichtigeKinder === "ja" },
    { key: "nachweis_kinderzulagen", label: "Nachweis Kinderzulagen", description: "Hochzeitsurkunde oder Familienurkunde. Eines der beiden genügt.", condition: data.kinderzulagenUeberSpitex === "ja" },
    { key: "familienbuchlein", label: "Familienbüchlein", description: "Vollständige Kopie mit allen eingetragenen Kindern", condition: data.kinderzulagenUeberSpitex === "ja" || data.kinderzulagenBeantragt === "ja" },
  ];

  const visible = docSlots.filter(d => d.condition);

  // Convert scan data to UploadedFile format for DocumentUploader
  const getFileForSlot = (key: string): UploadedFile | null => {
    const scan = data.scans[key];
    if (!scan) return null;
    return { id: key, filename: scan.name, mimeType: scan.type || "application/pdf", sizeBytes: parseInt(scan.size) || 0, dataUrl: scan.previewUrl || "", uploadedAt: new Date() };
  };

  const handleUpload = (key: string, file: UploadedFile | null) => {
    if (file) {
      onChange({ ...data, scans: { ...data.scans, [key]: { name: file.filename, type: file.mimeType, size: file.sizeBytes.toString(), timestamp: new Date().toLocaleString("de-CH"), previewUrl: file.dataUrl } } });
    } else {
      onChange({ ...data, scans: { ...data.scans, [key]: null } });
    }
  };

  const uploadedCount = visible.filter(d => !!data.scans[d.key]).length;

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={FileText} label="Pflicht-Dokumente" first />
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-5)" }}>
        {uploadedCount} von {visible.length} Dokumenten hochgeladen
      </div>

      <div className="flex flex-col" style={{ gap: "var(--space-4)" }}>
        {visible.map(doc => (
          <DocumentUploader
            key={doc.key}
            label={doc.label}
            description={doc.description}
            required
            value={getFileForSlot(doc.key)}
            onChange={file => handleUpload(doc.key, file)}
            onPreview={file => setPreviewFile(file)}
          />
        ))}
      </div>

      {previewFile && (
        <DocumentPreviewModal file={previewFile} isOpen onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
