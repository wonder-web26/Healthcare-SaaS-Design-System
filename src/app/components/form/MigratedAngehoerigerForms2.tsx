/**
 * Migrated form sub-components for StepAngehoeriger Tabs 3, 4, 6.
 * Uses new form components from components/form/.
 */
import { useState } from "react";
import { Users, IdCard, Coins, FileText, Plus, Upload, Eye, Check, FileSignature, Trash2, Shield, FileCheck } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TextInput } from "./TextInput";
import { DateField } from "./DateField";
import { AHVNummerInput } from "./AHVNummerInput";
import { SegmentedControl } from "./SegmentedControl";
import { Combobox as FormSelect } from "./Combobox";
import { GroupBox } from "./GroupBox";
import { DokumentScanUpload, type ScanFile } from "./DokumentScanUpload";
import type { AngehoerigerFormData } from "../StepAngehoeriger";
import { pruefeQuellensteuerAutomatik } from "../../../lib/stammdaten/quellensteuer-automatik";
import { sichtbareDokumenttypen, istDokumentVollstaendig, type DokumentKontext } from "../../../lib/stammdaten/dokumenttypen";
import { SEMMeldeBanner, NATIONALITAETEN } from "./MigratedAngehoerigerForms";
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
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <TextInput label="Vorname" required={istPflicht} value={data.partnerVorname} onChange={v => set("partnerVorname", v)} onBlur={() => touch("partnerVorname")} placeholder="Vorname" error={errIfPflicht("partnerVorname", data.partnerVorname)} />
        <TextInput label="Nachname" required={istPflicht} value={data.partnerName} onChange={v => set("partnerName", v)} onBlur={() => touch("partnerName")} placeholder="Nachname" error={errIfPflicht("partnerName", data.partnerName)} />
        <DateField label="Geburtsdatum" required={istPflicht} wertFormat="display" bereich="past" value={data.partnerGeburtsdatum || null} onChange={v => set("partnerGeburtsdatum", (v as string) ?? "")} onBlur={() => touch("partnerGeburtsdatum")} />
        <FormSelect label="Nationalität" value={data.partnerNationalitaet || null} onChange={v => set("partnerNationalitaet", v || "")} options={NATIONALITAETEN} placeholder="Nationalität wählen" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
                      <TextInput label="Vorname" required value={kind.vorname} onChange={v => updateKind(kind.id, "vorname", v)} placeholder="Vorname" />
                      <TextInput label="Nachname" required value={kind.name} onChange={v => updateKind(kind.id, "name", v)} placeholder="Nachname" />
                      <DateField label="Geburtsdatum" required wertFormat="display" bereich="past" value={kind.geburtsdatum || null} onChange={v => updateKind(kind.id, "geburtsdatum", (v as string) ?? "")} />
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
                  <Plus style={{ width: 14, height: 14 }} /> {data.kinder.length === 0 ? "Kind erfassen" : "Weiteres Kind hinzufügen"}
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
/**
 * SP-21 / SP-22: Regelbasierte, dynamische Dokumenten-Checkliste.
 * Dokumenttypen aus zentralem Katalog (src/lib/stammdaten/dokumenttypen.ts).
 * Sichtbarkeit wird live aus den Formulardaten abgeleitet.
 * Bereits hochgeladene Dateien werden bei Bedingungswegfall NICHT gelöscht.
 */
export function DokumenteFormV2({ data, onChange, onOpenSpezialbewilligung }: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  onOpenSpezialbewilligung?: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);

  // Bedingungen aus LIVE-Formulardaten ableiten (reaktiv bei jeder Änderung)
  const kontext: DokumentKontext = {
    partnerErforderlich:
      ((data.zivilstand === "verheiratet" || data.zivilstand === "eingetragene_partnerschaft") && data.quellensteuer === "ja")
      || data.partnerManualToggle === true,
    hatKinder: parseInt(data.anzahlKinder) > 0,
    kinderzulagenUeberSpitex: data.kinderzulagenUeberSpitex === "ja",
    unterhaltspflicht: data.hatUnterhaltspflichtigeKinder === "ja",
    zertifikatDeutschVorhanden: data.zertifikatVorhanden === "ja",
    srkZertifikatVorhanden: data.srkZertifikatVorhanden === "ja",
    assistenzbeitragJa: false, // Patient-Feld, nicht Angehörigen — wird im Patient-Dokumente-Tab verdrahtet
  };

  const sichtbar = sichtbareDokumenttypen(kontext, "angehoeriger");

  /** Gemeinsamer Handler: Scan oder Datei → in scans ablegen */
  const handleScanFile = (key: string, file: ScanFile) => {
    onChange({ ...data, scans: { ...data.scans, [key]: file } });
  };

  const removeScan = (key: string) => {
    onChange({ ...data, scans: { ...data.scans, [key]: null } });
  };

  // Pro-Kind-Dokumente (nur wenn Zulagen über Spitex)
  const kinderMitZulagen = kontext.kinderzulagenUeberSpitex ? data.kinder : [];
  const kinderDocsVollstaendig = kinderMitZulagen.filter(k => !!data.scans[`kind_kk_${k.id}`]).length;

  // Mehrfach-Dokumente: eigener State für dynamisch hinzugefügte Einträge
  const [mehrfachEintraege, setMehrfachEintraege] = useState<Record<string, { id: string; label: string }[]>>({});
  const [mehrfachNeuesLabel, setMehrfachNeuesLabel] = useState<Record<string, string>>({});

  // Zähler: Upload-Dokumente + Unterschrift-Dokumente getrennt zählen
  const uploadDocs = sichtbar.filter(d => d.modus === "upload" && !d.mehrfach);
  const unterschriftDocs = sichtbar.filter(d => d.modus === "unterschrift");
  const mehrfachDocs = sichtbar.filter(d => d.mehrfach);

  const katalogVollstaendig = uploadDocs.filter(d => istDokumentVollstaendig(d, data.scans)).length
    + unterschriftDocs.filter(d => istDokumentVollstaendig(d, data.scans)).length;
  const katalogPflichtOffen = uploadDocs.filter(d => d.pflicht && !istDokumentVollstaendig(d, data.scans)).length
    + unterschriftDocs.filter(d => d.pflicht && !istDokumentVollstaendig(d, data.scans)).length;
  const kinderPflichtOffen = kinderMitZulagen.length - kinderDocsVollstaendig;

  const vollstaendig = katalogVollstaendig + kinderDocsVollstaendig;
  const gesamtAnzahl = uploadDocs.length + unterschriftDocs.length + kinderMitZulagen.length;
  const pflichtOffen = katalogPflichtOffen + kinderPflichtOffen;

  const addMehrfachEintrag = (docCode: string) => {
    const label = (mehrfachNeuesLabel[docCode] || "").trim();
    if (!label) { toast("Bitte Bezeichnung eingeben."); return; }
    const id = `${docCode}_${Date.now()}`;
    setMehrfachEintraege(prev => ({ ...prev, [docCode]: [...(prev[docCode] || []), { id, label }] }));
    setMehrfachNeuesLabel(prev => ({ ...prev, [docCode]: "" }));
  };

  const removeMehrfachEintrag = (docCode: string, id: string) => {
    setMehrfachEintraege(prev => ({ ...prev, [docCode]: (prev[docCode] || []).filter(e => e.id !== id) }));
    // Scan ebenfalls entfernen
    onChange({ ...data, scans: { ...data.scans, [id]: null } });
  };

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={FileText} label="Dokumente" first />
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-5)" }}>
        {vollstaendig} von {gesamtAnzahl} vollständig{pflichtOffen > 0 ? ` · ${pflichtOffen} Pflicht offen` : ""}
      </div>

      <div className="flex flex-col" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        {sichtbar.map(doc => {
          /* ── modus=unterschrift: Status-Anzeige, kein Upload-Slot ── */
          if (doc.modus === "unterschrift") {
            const istUnterschrieben = data.scans[doc.code] === "unterschrieben";
            return (
              <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <FileSignature style={{ width: 16, height: 16, color: istUnterschrieben ? "var(--status-success)" : "var(--text-tertiary)" }} />
                    <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                      {doc.label} {doc.pflicht && <span style={{ color: "var(--status-danger)" }}>*</span>}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "var(--text-meta)", fontWeight: 500, padding: "2px 10px", borderRadius: 999,
                    background: istUnterschrieben ? "var(--status-success-bg)" : "var(--status-warning-bg)",
                    color: istUnterschrieben ? "var(--status-success)" : "var(--status-warning-text)",
                  }}>
                    {istUnterschrieben ? "Unterschrieben" : "Offen"}
                  </span>
                </div>
              </div>
            );
          }

          /* ── mehrfach=true: Sammelbehälter mit "Dokument hinzufügen" ── */
          if (doc.mehrfach) {
            const eintraege = mehrfachEintraege[doc.code] || [];
            return (
              <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
                  {doc.label} <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontWeight: 400 }}>(optional, beliebig viele)</span>
                </div>

                {eintraege.length > 0 && (
                  <div className="flex flex-col" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                    {eintraege.map(eintrag => {
                      const scan = data.scans[eintrag.id];
                      return (
                        <div key={eintrag.id} style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8, border: "0.5px solid var(--border-default)" }}>
                          <div className="flex items-center justify-between" style={{ marginBottom: scan ? 0 : 6 }}>
                            <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{eintrag.label}</span>
                            <button onClick={() => removeMehrfachEintrag(doc.code, eintrag.id)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--status-danger)" }} title="Entfernen">
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                          {scan ? (
                            <ScanDisplay scanKey={eintrag.id} scan={scan} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
                          ) : (
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <DokumentScanUpload scanKey={eintrag.id} docLabel={eintrag.label} onFile={handleScanFile} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center" style={{ gap: 8 }}>
                  <input
                    value={mehrfachNeuesLabel[doc.code] || ""}
                    onChange={e => setMehrfachNeuesLabel(prev => ({ ...prev, [doc.code]: e.target.value }))}
                    placeholder="Bezeichnung eingeben"
                    style={{ flex: 1, padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMehrfachEintrag(doc.code); } }}
                  />
                  <button onClick={() => addMehrfachEintrag(doc.code)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: 500 }}>
                    <Plus style={{ width: 12, height: 12 }} /> Hinzufügen
                  </button>
                </div>
              </div>
            );
          }

          /* ── modus=upload + beidseitig ── */
          if (doc.beidseitig) {
            const scanVorne = data.scans[`${doc.code}_vorne`];
            const scanHinten = data.scans[`${doc.code}_hinten`];
            return (
              <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                    {doc.label} {doc.pflicht && <span style={{ color: "var(--status-danger)" }}>*</span>}
                  </div>
                  {istDokumentVollstaendig(doc, data.scans) && <Check style={{ width: 16, height: 16, color: "var(--status-success)" }} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-3)" }}>
                  <ScanSlot label="Vorderseite" scanKey={`${doc.code}_vorne`} docLabel={`${doc.label} — Vorderseite`} scan={scanVorne} onFile={handleScanFile} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
                  <ScanSlot label="Rückseite" scanKey={`${doc.code}_hinten`} docLabel={`${doc.label} — Rückseite`} scan={scanHinten} onFile={handleScanFile} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
                </div>
              </div>
            );
          }

          /* ── modus=upload + einseitig (Standard) ── */
          const scan = data.scans[doc.code];
          return (
            <div key={doc.code} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: scan ? 0 : "var(--space-3)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                  {doc.label}{doc.pflicht ? "" : " (optional)"} {doc.pflicht && <span style={{ color: "var(--status-danger)" }}>*</span>}
                </div>
                {scan && <Check style={{ width: 16, height: 16, color: "var(--status-success)" }} />}
              </div>
              {scan ? (
                <ScanDisplay scanKey={doc.code} scan={scan} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
              ) : (
                <div className="flex items-center" style={{ gap: 8 }}>
                  <DokumentScanUpload scanKey={doc.code} docLabel={doc.label} onFile={handleScanFile} />
                </div>
              )}
            </div>
          );
        })}

        {/* SEM-Meldeformular im Dokumente-Tab (bei B, S, F) */}
        {(data.aufenthaltsstatus === "B" || data.aufenthaltsstatus === "S" || data.aufenthaltsstatus === "F") && (
          <SEMMeldeBanner data={data} />
        )}

        {/* Pro-Kind-Dokumente: ein Upload pro Kind, das über Spitex abgerechnet wird */}
        {kinderMitZulagen.map((kind, idx) => {
          const kindKey = `kind_kk_${kind.id}`;
          const kindLabel = `Krankenkassenkarte — ${kind.vorname || ""} ${kind.name || `Kind ${idx + 1}`}`.trim();
          const kindScan = data.scans[kindKey];
          return (
            <div key={kindKey} style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: kindScan ? 0 : "var(--space-3)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                  {kindLabel} <span style={{ color: "var(--status-danger)" }}>*</span>
                </div>
                {kindScan && <Check style={{ width: 16, height: 16, color: "var(--status-success)" }} />}
              </div>
              {kindScan ? (
                <ScanDisplay scanKey={kindKey} scan={kindScan} onRemove={removeScan} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
              ) : (
                <div className="flex items-center" style={{ gap: 8 }}>
                  <DokumentScanUpload scanKey={kindKey} docLabel={kindLabel} onFile={handleScanFile} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Zeigt einen hochgeladenen Scan mit Vorschau/Entfernen-Aktionen */
export function ScanDisplay({ scanKey, scan, onRemove, previewOpen, setPreviewOpen }: {
  scanKey: string;
  scan: { name: string; size: string; timestamp?: string; previewUrl?: string | null };
  onRemove: (key: string) => void;
  previewOpen: string | null;
  setPreviewOpen: (v: string | null) => void;
}) {
  return (
    <div style={{ marginTop: 6 }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <FileCheck style={{ width: 14, height: 14, color: "var(--status-success)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{scan.name}</div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{scan.size}{scan.timestamp ? ` · ${scan.timestamp}` : ""}</div>
        </div>
        <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
          {scan.previewUrl && (
            <button onClick={() => setPreviewOpen(previewOpen === scanKey ? null : scanKey)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--text-tertiary)" }} title="Vorschau">
              <Eye style={{ width: 14, height: 14 }} />
            </button>
          )}
          <button onClick={() => onRemove(scanKey)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--status-danger)" }} title="Entfernen">
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
      {previewOpen === scanKey && scan.previewUrl && (
        <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "0.5px solid var(--border-default)" }}>
          <img src={scan.previewUrl} alt="Vorschau" style={{ width: "100%", maxHeight: 160, objectFit: "contain", background: "white" }} />
        </div>
      )}
    </div>
  );
}

/** Scan-Slot: zeigt Upload-Buttons oder hochgeladenen Scan */
export function ScanSlot({ label, scanKey, docLabel, scan, onFile, onRemove, previewOpen, setPreviewOpen }: {
  label: string;
  scanKey: string;
  docLabel: string;
  scan: unknown;
  onFile: (key: string, file: ScanFile) => void;
  onRemove: (key: string) => void;
  previewOpen: string | null;
  setPreviewOpen: (v: string | null) => void;
}) {
  const s = scan as { name: string; size: string; timestamp?: string; previewUrl?: string | null } | null | undefined;
  return (
    <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8, border: "0.5px solid var(--border-default)" }}>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {s ? (
        <ScanDisplay scanKey={scanKey} scan={s} onRemove={onRemove} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} />
      ) : (
        <div className="flex items-center" style={{ gap: 8 }}>
          <DokumentScanUpload scanKey={scanKey} docLabel={docLabel} onFile={onFile} />
        </div>
      )}
    </div>
  );
}
