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
import { Combobox as FormSelect } from "./Combobox";
import { GroupBox } from "./GroupBox";
import { DocumentUploader, type UploadedFile } from "./DocumentUploader";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import type { AngehoerigerFormData } from "../StepAngehoeriger";
import { pruefeQuellensteuerAutomatik } from "../../../lib/stammdaten/quellensteuer-automatik";
import { toast } from "sonner";

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];
const GESCHLECHT = [{ value: "maennlich", label: "Männlich" }, { value: "weiblich", label: "Weiblich" }, { value: "divers", label: "Divers" }];
const ZULAGENART = [{ value: "K", label: "K (Kinderzulage)" }, { value: "W", label: "W (Weiterbildung)" }];
const AUSBILDUNG = [{ value: "gymnasium", label: "Gymnasium" }, { value: "lehre", label: "Lehre" }, { value: "fachhochschule", label: "Fachhochschule" }, { value: "universitaet", label: "Universität" }, { value: "andere", label: "Andere" }];
/** Aufenthaltsbewilligung des Partners — vollstaendige Liste wie beim Angehoerigen selbst */
const AUFENTHALT_PARTNER = [
  { value: "CH", label: "Schweizer Buerger/in" },
  { value: "B", label: "B – Aufenthaltsbewilligung" },
  { value: "C", label: "C – Niederlassungsbewilligung" },
  { value: "L", label: "L – Kurzaufenthaltsbewilligung" },
  { value: "G", label: "G – Grenzgaengerbewilligung" },
  { value: "F", label: "F – Vorlaeufige Aufnahme" },
  { value: "N", label: "N – Asylsuchende" },
  { value: "S", label: "S – Schutzbeduertige" },
];

/* ══════════════════════════════════════════
   TAB 3: PARTNER (SP-06 — 3-Zustandslogik)

   Zustand 1 (STANDARD):  Bedingung nicht erfuellt + Toggle aus → nur Toggle sichtbar
   Zustand 2 (MANUELL):   Toggle an, Bedingung nicht erfuellt → Felder optional
   Zustand 3 (PFLICHT):   Bedingung erfuellt → Felder Pflicht, Toggle gesperrt

   Bedingung: zivilstand IN ("verheiratet", "eingetragene_partnerschaft") UND quellensteuer == "ja"
   "Eingetragene Partnerschaft" ist der Ehe steuerlich gleichgestellt (DBG Art. 9 Abs. 1bis).

   Reaktives Verhalten: Aenderungen an Zivilstand/QST wirken live.
   Datenverlust-Schutz: Bei Wechsel zu inaktiv werden Daten NICHT geloescht.
   ══════════════════════════════════════════ */
export function PartnerFormV2({ data, onChange }: { data: AngehoerigerFormData; onChange: (d: AngehoerigerFormData) => void }) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));
  const set = (f: keyof AngehoerigerFormData, v: unknown) => onChange({ ...data, [f]: v });

  // SP-06: Pflicht-Bedingung
  const pflichtBedingung = (data.zivilstand === "verheiratet" || data.zivilstand === "eingetragene_partnerschaft") && data.quellensteuer === "ja";
  const manuellesToggle = data.partnerManualToggle === true;
  const partnerSichtbar = pflichtBedingung || manuellesToggle;
  const istPflicht = pflichtBedingung;

  // Hat der Partner bereits Daten? (fuer sanftes Zurueckfallen)
  const hatPartnerDaten = filled(data.partnerName) || filled(data.partnerVorname) || filled(data.partnerGeburtsdatum);

  // Zustand 1: STANDARD (ausgeblendet) — nur Toggle sichtbar
  if (!partnerSichtbar && !hatPartnerDaten) {
    return (
      <div style={{ padding: "var(--space-6)" }}>
        <button
          onClick={() => set("partnerManualToggle", true)}
          className="inline-flex items-center cursor-pointer"
          style={{ gap: 6, padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}
        >
          <Users style={{ width: 14, height: 14 }} /> Partner erfassen
        </button>
      </div>
    );
  }

  // Zustand 2 oder 3: Felder sichtbar
  const errIfPflicht = (field: string, val: string) =>
    istPflicht && touched[field] && !filled(val) ? "Pflichtfeld" : undefined;

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      {/* Zustand-Hinweis */}
      {!istPflicht && (
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", fontStyle: "italic" }}>
            {/* revDSG: Partnerdaten = Personendaten Dritter, Erhebung nur mit Zweck */}
            Nur noetig bei Quellensteuerpflicht. Freiwillige Angabe.
          </div>
          {!pflichtBedingung && (
            <button
              onClick={() => set("partnerManualToggle", false)}
              className="cursor-pointer"
              style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", padding: "2px 6px" }}
            >
              Ausblenden
            </button>
          )}
        </div>
      )}
      {istPflicht && (
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-4)", padding: "8px 12px", background: "var(--status-info-bg)", borderRadius: 8 }}>
          Partnerangaben sind Pflicht (verheiratet / eingetragene Partnerschaft + quellensteuerpflichtig).
        </div>
      )}

      <SectionHeader icon={Users} label="Partnerangaben" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="Vorname" required={istPflicht} value={data.partnerVorname} onChange={v => set("partnerVorname", v)} onBlur={() => touch("partnerVorname")} placeholder="Vorname" error={errIfPflicht("partnerVorname", data.partnerVorname)} />
        <TextInput label="Nachname" required={istPflicht} value={data.partnerName} onChange={v => set("partnerName", v)} onBlur={() => touch("partnerName")} placeholder="Nachname" error={errIfPflicht("partnerName", data.partnerName)} />
        <TextInput label="Geburtsdatum" required={istPflicht} value={data.partnerGeburtsdatum} onChange={v => set("partnerGeburtsdatum", v)} onBlur={() => touch("partnerGeburtsdatum")} placeholder="01.01.1985" hint="Format: TT.MM.JJJJ" error={errIfPflicht("partnerGeburtsdatum", data.partnerGeburtsdatum)} />
        <TextInput label="Nationalitaet" value={data.partnerNationalitaet} onChange={v => set("partnerNationalitaet", v)} placeholder="z.B. Schweiz, Deutschland" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        {/* SP-06/SP-07: Aufenthaltsbewilligung des Partners — triggert Quellensteuer-Automatik (Regel 1) */}
        <FormSelect label="Aufenthaltsbewilligung" required={istPflicht} value={data.partnerAufenthaltsstatus || null} onChange={v => {
          const bewilligung = v || "";
          set("partnerAufenthaltsstatus", bewilligung);
          touch("partnerAufenthaltsstatus");

          // SP-07 Regel 1: Partner CH/C → Quellensteuer automatisch entfernen
          if (bewilligung && data.quellensteuer === "ja") {
            const mitarbeiterName = `${data.vorname || ""} ${data.name || ""}`.trim();
            const ergebnis = pruefeQuellensteuerAutomatik(bewilligung, true, mitarbeiterName, "onboarding");
            if (ergebnis.geaendert) {
              set("quellensteuer", ergebnis.quellensteuerpflichtig ? "ja" : "nein");
              toast(ergebnis.quellensteuerpflichtig
                ? "Quellensteuerpflicht bleibt bestehen"
                : "Quellensteuerpflicht automatisch entfernt (Partner CH/C)");
            }
            if (ergebnis.auditEintrag) console.info(`[SP-07 Audit] ${ergebnis.auditEintrag}`);
            // SP-07 Regel 2 (Pendenz): erfolgt erst bei Onboarding-Konvertierung,
            // nicht waehrend der Erfassung (Mitarbeiter existiert noch nicht).
          }
        }} options={AUFENTHALT_PARTNER} placeholder="Bewilligung waehlen" error={errIfPflicht("partnerAufenthaltsstatus", data.partnerAufenthaltsstatus)} />
        {/* SP-06: Erwerbstaetig */}
        <SegmentedControl label="Erwerbstaetig?" required={istPflicht} value={data.partnerErwerbstaetig} onChange={v => set("partnerErwerbstaetig", v)} options={JA_NEIN} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 4: KINDER & ZULAGEN (SP-08 — zweistufiges Gating)

   Frage 1: "Unterhaltspflichtige Kinder?" (immer sichtbar)
     Ja → Stufe 1: "Anzahl Kinder" (Pflicht, unabhaengig von Frage 2)
          + Frage 2: "Kinderzulagen ueber Spitex?"
     Nein → nichts weiter

   Frage 2: (nur wenn Frage 1 = Ja)
     Ja → Stufe 2: Kinder-Detailblock (Pflicht, pro Kind: Vorname, Name, Geburtsdatum)
     Nein → nur Anzahl aus Stufe 1, kein Detailblock

   Reaktiv: Live Ein-/Ausblenden, kein Datenverlust.
   ══════════════════════════════════════════ */
export function KinderFormV2({ data, onChange }: { data: AngehoerigerFormData; onChange: (d: AngehoerigerFormData) => void }) {
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });
  const hasKids = data.hatUnterhaltspflichtigeKinder === "ja";
  const zulagenUeberSpitex = data.kinderzulagenUeberSpitex === "ja";
  const anzahlNum = parseInt(data.anzahlKinder) || 0;

  const addKind = () => {
    const id = `kind-${Date.now()}`;
    onChange({ ...data, kinder: [...data.kinder, { id, name: "", vorname: "", geburtsdatum: "", ahvNummer: "", geschlecht: "", zulagenart: "K", ausbildungsstatus: "", ausbildungsbeginn: "" }] });
  };

  const removeKind = (id: string) => {
    onChange({ ...data, kinder: data.kinder.filter(k => k.id !== id) });
  };

  const updateKind = (id: string, field: string, value: string) => {
    onChange({ ...data, kinder: data.kinder.map(k => k.id === id ? { ...k, [field]: value } : k) });
  };

  // Plausibilitaetswarnung: Anzahl vs. Detail
  const anzahlVsDetail = zulagenUeberSpitex && anzahlNum > 0 && data.kinder.length > 0 && anzahlNum < data.kinder.length;

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Users} label="Unterhaltspflichtige Kinder" first />

      {/* Gating-Frage 1 (immer sichtbar) */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <SegmentedControl label="Unterhaltspflichtige Kinder vorhanden?" required value={data.hatUnterhaltspflichtigeKinder} onChange={v => {
          // Beim Wechsel zu "nein": Daten NICHT hart loeschen (Datenverlust-Schutz)
          set("hatUnterhaltspflichtigeKinder", v);
        }} options={JA_NEIN} />
      </div>

      {!hasKids && (
        <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Keine unterhaltspflichtigen Kinder — Abschnitt wird als vollstaendig markiert.</div>
        </div>
      )}

      {/* Stufe 1: Anzahl Kinder (Pflicht, unabhaengig von Frage 2) */}
      {hasKids && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            <TextInput
              label="Anzahl unterhaltspflichtige Kinder"
              required
              value={data.anzahlKinder}
              onChange={v => set("anzahlKinder", v)}
              placeholder="z.B. 2"
              hint="Relevant fuer Quellensteuer-Tarif"
              error={hasKids && (!data.anzahlKinder || data.anzahlKinder === "0") ? "Pflichtfeld" : undefined}
            />
          </div>

          {/* Gating-Frage 2 (nur wenn Frage 1 = Ja) */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <SegmentedControl label="Kinderzulagen werden ueber die Spitex abgerechnet?" required value={data.kinderzulagenUeberSpitex} onChange={v => set("kinderzulagenUeberSpitex", v)} options={JA_NEIN} hint="Wenn Nein, nur Anzahl relevant (fuer QST-Tarif). Details nicht noetig." />
          </div>

          {/* Stufe 2: Kinder-Detailblock (nur wenn Frage 2 = Ja) */}
          {zulagenUeberSpitex && (
            <>
              {/* Plausibilitaetswarnung */}
              {anzahlVsDetail && (
                <div style={{ padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, marginBottom: "var(--space-4)", fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
                  Anzahl Kinder ({anzahlNum}) ist kleiner als erfasste Kinder ({data.kinder.length}). Bitte pruefen.
                </div>
              )}

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
                      <TextInput label="Vorname" required value={kind.vorname} onChange={v => updateKind(kind.id, "vorname", v)} placeholder="Vorname" />
                      <TextInput label="Nachname" required value={kind.name} onChange={v => updateKind(kind.id, "name", v)} placeholder="Nachname" />
                      <TextInput label="Geburtsdatum" required value={kind.geburtsdatum} onChange={v => updateKind(kind.id, "geburtsdatum", v)} placeholder="01.01.2015" hint="TT.MM.JJJJ" />
                      <FormSelect label="Geschlecht" value={kind.geschlecht || null} onChange={v => updateKind(kind.id, "geschlecht", v || "")} options={GESCHLECHT} placeholder="Waehlen" />
                    </div>
                    {/* SP-09: Ausbildungslogik >16/25 hier nicht ausimplementiert */}
                    {/* SP-22: Dokumente (Familienbuechlein/IDs) hier nicht enthalten */}
                  </GroupBox>
                ))}
              </div>

              {/* Kind hinzufuegen */}
              <div style={{ marginTop: "var(--space-4)" }}>
                <button type="button" onClick={addKind} className="inline-flex items-center cursor-pointer transition-colors"
                  style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                  <Plus style={{ width: 14, height: 14 }} /> Weiteres Kind hinzufuegen
                </button>
              </div>
            </>
          )}
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
