/**
 * Migrated form sub-components for StepAngehoeriger Tabs 1, 2, 5.
 * Uses new form components from components/form/.
 * Form logic (state, validation, conditional fields) unchanged.
 */
import { useState } from "react";
import { User, Mail, Shield, Receipt, Briefcase, CreditCard, Info } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TextInput } from "./TextInput";
import { NumberInput } from "./NumberInput";
import { AHVNummerInput } from "./AHVNummerInput";
import { IBANInput } from "./IBANInput";
import { SegmentedControl } from "./SegmentedControl";
import { Combobox as FormSelect } from "./Combobox";
import { Combobox } from "./Combobox";
import type { AngehoerigerFormData } from "../StepAngehoeriger";
import { KONFESSION_OPTIONS } from "../../../lib/stammdaten/konfession";
import { KRANKENKASSEN_OPTIONS, getBagNummer } from "../../../lib/stammdaten/krankenkassen";
import { ZIVILSTAND_OPTIONS } from "../../../lib/stammdaten/zivilstand";

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];

const NATIONALITAETEN = [
  { value: "schweiz", label: "Schweiz" }, { value: "deutschland", label: "Deutschland" },
  { value: "frankreich", label: "Frankreich" }, { value: "italien", label: "Italien" },
  { value: "oesterreich", label: "Österreich" }, { value: "portugal", label: "Portugal" },
  { value: "spanien", label: "Spanien" }, { value: "tuerkei", label: "Türkei" }, { value: "andere", label: "Andere" },
];

const AUFENTHALTSSTATUS = [
  { value: "B", label: "B – Aufenthaltsbewilligung" }, { value: "C", label: "C – Niederlassungsbewilligung" },
  { value: "L", label: "L – Kurzaufenthaltsbewilligung" }, { value: "G", label: "G – Grenzgängerbewilligung" },
  { value: "F", label: "F – Vorläufige Aufnahme" }, { value: "N", label: "N – Asylsuchende" },
  { value: "S", label: "S – Schutzbedürftige" },
];

const GESCHLECHT = [{ value: "maennlich", label: "Männlich" }, { value: "weiblich", label: "Weiblich" }, { value: "divers", label: "Divers" }];

// Zivilstand aus shared stammdaten
const ZIVILSTAND = ZIVILSTAND_OPTIONS;

// SP-01: Konfession aus shared stammdaten (ersetzt die alte lokale Liste)

const QS_TARIF = [
  { value: "A", label: "A – Alleinstehend" }, { value: "B", label: "B – Verheiratet" },
  { value: "C", label: "C – Doppelverdiener" }, { value: "H", label: "H – Alleinerziehend" },
];

const FUNKTIONEN = [
  { value: "pflegefachperson_hf", label: "Pflegefachperson HF" }, { value: "pflegefachperson_fh", label: "Pflegefachperson FH (BSc)" },
  { value: "fage", label: "Fachperson Gesundheit (FaGe)" }, { value: "age", label: "Assistent/in Gesundheit (AGS)" },
  { value: "pflegehilfe", label: "Pflegehelfer/in SRK" }, { value: "hauswirtschaft", label: "Hauswirtschaft" },
  { value: "sozialbetreuung", label: "Sozialbetreuung" }, { value: "administration", label: "Administration" },
  { value: "teamleitung", label: "Teamleitung" }, { value: "andere", label: "Andere Funktion" },
];

/* ══════════════════════════════════════════
   TAB 1: PERSONALIEN (migrated)
   ══════════════════════════════════════════ */
export function PersonalienFormV2({
  data, onChange, onOpenSpezialbewilligung,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
  onOpenSpezialbewilligung?: () => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });

  const isSwiss = data.nationalitaet === "schweiz";
  const isNatSelected = filled(data.nationalitaet);
  const showAufenthalt = isNatSelected && !isSwiss;

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      {/* Identität */}
      <SectionHeader icon={User} label="Identität" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="Name" required value={data.name} onChange={v => set("name", v)} onBlur={() => touch("name")} placeholder="Nachname" error={touched.name && !filled(data.name) ? "Pflichtfeld" : undefined} />
        <TextInput label="Vorname" required value={data.vorname} onChange={v => set("vorname", v)} onBlur={() => touch("vorname")} placeholder="Vorname" error={touched.vorname && !filled(data.vorname) ? "Pflichtfeld" : undefined} />
        <FormSelect label="Geschlecht" required value={data.geschlecht || null} onChange={v => { set("geschlecht", v || ""); touch("geschlecht"); }} options={GESCHLECHT} placeholder="Geschlecht wählen" error={touched.geschlecht && !filled(data.geschlecht) ? "Pflichtfeld" : undefined} />
        <TextInput label="Geburtsdatum" required value={data.geburtsdatum} onChange={v => set("geburtsdatum", v)} onBlur={() => touch("geburtsdatum")} placeholder="01.01.1990" hint="Format: TT.MM.JJJJ" />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <AHVNummerInput label="AHV-Nummer" required value={data.ahvNummer} onChange={v => set("ahvNummer", v)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <Combobox label="Nationalität" required value={data.nationalitaet || null} onChange={v => {
          touch("nationalitaet");
          if (v === "schweiz") onChange({ ...data, nationalitaet: v || "", aufenthaltsstatus: "CH" });
          else onChange({ ...data, nationalitaet: v || "", heimatort: "", aufenthaltsstatus: "" });
        }} options={NATIONALITAETEN} placeholder="Nationalität wählen" error={touched.nationalitaet && !filled(data.nationalitaet) ? "Pflichtfeld" : undefined} />

        {isSwiss && (
          <TextInput label="Heimatort" required value={data.heimatort} onChange={v => set("heimatort", v)} onBlur={() => touch("heimatort")} placeholder="z.B. Zürich" error={touched.heimatort && !filled(data.heimatort) ? "Pflichtfeld" : undefined} />
        )}
        {showAufenthalt && (
          <FormSelect label="Aufenthaltsstatus" required value={data.aufenthaltsstatus || null} onChange={v => {
            onChange({ ...data, aufenthaltsstatus: v || "", spezialbewilligungStatus: v === "B" ? "ausstehend" : "nicht_erforderlich", spezialbewilligungDokument: v === "B" ? data.spezialbewilligungDokument : null, spezialbewilligungEinreichungsDatum: v === "B" ? data.spezialbewilligungEinreichungsDatum : "" });
            touch("aufenthaltsstatus");
          }} options={isSwiss ? [{ value: "CH", label: "Schweizer Bürger/in" }, ...AUFENTHALTSSTATUS] : AUFENTHALTSSTATUS} placeholder="Status wählen" error={touched.aufenthaltsstatus && !filled(data.aufenthaltsstatus) ? "Pflichtfeld" : undefined} />
        )}
      </div>

      {/* Spezialbewilligung alerts remain in original StepAngehoeriger — they reference onOpenSpezialbewilligung */}

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <FormSelect label="Zivilstand" required value={data.zivilstand || null} onChange={v => set("zivilstand", v || "")} options={ZIVILSTAND} placeholder="Zivilstand wählen" />
        <TextInput label="Zivilstand seit" required value={data.zivilstandSeit} onChange={v => set("zivilstandSeit", v)} onBlur={() => touch("zivilstandSeit")} placeholder="01.06.2020" hint="Format: TT.MM.JJJJ" />
      </div>

      {/* Kontaktdaten */}
      <SectionHeader icon={Mail} label="Kontaktdaten" />
      <div style={{ marginBottom: "var(--space-5)" }}>
        <TextInput label="Strasse & Nr." required value={data.strasse} onChange={v => set("strasse", v)} onBlur={() => touch("strasse")} placeholder="Musterstrasse 12" error={touched.strasse && !filled(data.strasse) ? "Pflichtfeld" : undefined} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="PLZ" required value={data.plz} onChange={v => set("plz", v.replace(/\D/g, "").slice(0, 4))} onBlur={() => touch("plz")} placeholder="8000" />
        <TextInput label="Ort" required value={data.ort} onChange={v => set("ort", v)} onBlur={() => touch("ort")} placeholder="Zürich" error={touched.ort && !filled(data.ort) ? "Pflichtfeld" : undefined} />
        <TextInput label="E-Mail" required value={data.email} onChange={v => set("email", v)} onBlur={() => touch("email")} placeholder="name@example.com" />
        <TextInput label="Telefon" required value={data.telefon} onChange={v => set("telefon", v)} onBlur={() => touch("telefon")} placeholder="+41 79 123 45 67" />
      </div>

      {/* Krankenkasse (SP-02, SP-03) */}
      <SectionHeader icon={Shield} label="Krankenkasse" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        {/* SP-02: Picklist statt Freitext */}
        <FormSelect label="Krankenkasse" required value={data.krankenkasseName || null} onChange={v => { set("krankenkasseName", v || ""); touch("krankenkasseName"); const bag = getBagNummer(v || ""); if (bag) set("bagNr", bag); }} options={KRANKENKASSEN_OPTIONS} placeholder="Krankenkasse waehlen" error={touched.krankenkasseName && !filled(data.krankenkasseName) ? "Pflichtfeld" : undefined} />
        {/* SP-03: Kartennummer (umbenannt von Versicherungsnummer) */}
        <TextInput label="Kartennummer" required value={data.kartennummer} onChange={v => set("kartennummer", v)} onBlur={() => touch("kartennummer")} placeholder="Nummer auf der Versichertenkarte" error={touched.kartennummer && !filled(data.kartennummer) ? "Pflichtfeld" : undefined} />
        {/* SP-03: BAG-Nr. (vorbefuellt aus Krankenkasse, manuell ueberschreibbar) */}
        <TextInput label="BAG-Nr. der Kasse" value={data.bagNr} onChange={v => set("bagNr", v)} placeholder="z.B. 0271" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 2: STEUER & SOZIALVERSICHERUNG (migrated)
   ══════════════════════════════════════════ */
export function SteuerFormV2({
  data, onChange,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Receipt} label="Quellensteuer" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <SegmentedControl label="Quellensteuerpflichtig?" required value={data.quellensteuer} onChange={v => { if (v === "nein") onChange({ ...data, quellensteuer: v, quellensteuerTarif: "" }); else set("quellensteuer", v); }} options={JA_NEIN} hint="Nicht-CH-Bürger mit B/L sind i.d.R. quellensteuerpflichtig" />
        <FormSelect label="Konfession" required value={data.konfession || null} onChange={v => { set("konfession", v || ""); touch("konfession"); }} options={KONFESSION_OPTIONS} placeholder="Konfession wählen" hint="Relevant für Kirchensteuer" error={touched.konfession && !filled(data.konfession) ? "Pflichtfeld" : undefined} />
      </div>
      {data.quellensteuer === "ja" && (
        <div style={{ marginTop: "var(--space-4)", marginLeft: "var(--space-4)" }}>
          <FormSelect label="Quellensteuer-Tarif" required value={data.quellensteuerTarif || null} onChange={v => { set("quellensteuerTarif", v || ""); touch("quellensteuerTarif"); }} options={QS_TARIF} placeholder="Tarif wählen" hint="A=Alleinstehend, B=Verheiratet, C=Doppelverdiener, H=Alleinerziehend" error={touched.quellensteuerTarif && !filled(data.quellensteuerTarif) ? "Pflichtfeld" : undefined} />
        </div>
      )}

      <SectionHeader icon={Shield} label="Sozialversicherungen" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <SegmentedControl label="BVG-versichert?" required value={data.bvgVersichert} onChange={v => set("bvgVersichert", v)} options={JA_NEIN} />
        <SegmentedControl label="UVG-versichert?" required value={data.uvgVersichert} onChange={v => set("uvgVersichert", v)} options={JA_NEIN} />
        <SegmentedControl label="Sozialamt involviert?" required value={data.sozialamtInvolviert} onChange={v => { if (v === "nein") onChange({ ...data, sozialamtInvolviert: v, sozialamtKontakt: "" }); else set("sozialamtInvolviert", v); }} options={JA_NEIN} />
        <SegmentedControl label="Lohnabtretung?" required value={data.lohnabtretung} onChange={v => set("lohnabtretung", v)} options={JA_NEIN} />
      </div>
      {data.sozialamtInvolviert === "ja" && (
        <div style={{ marginTop: "var(--space-4)", marginLeft: "var(--space-4)" }}>
          <TextInput label="Sozialamt Kontaktdaten" required value={data.sozialamtKontakt} onChange={v => set("sozialamtKontakt", v)} onBlur={() => touch("sozialamtKontakt")} placeholder="z.B. Sozialamt Zürich, Hr. Müller, 044 123 45 67" hint="Name, Telefon und E-Mail der zuständigen Person" error={touched.sozialamtKontakt && !filled(data.sozialamtKontakt) ? "Pflichtfeld" : undefined} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 5: ANSTELLUNG & AUSZAHLUNG (migrated)
   ══════════════════════════════════════════ */
export function AnstellungFormV2({
  data, onChange,
}: {
  data: AngehoerigerFormData;
  onChange: (d: AngehoerigerFormData) => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Briefcase} label="Anstellung" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <FormSelect label="Funktion / Rolle" required value={data.funktion || null} onChange={v => { set("funktion", v || ""); touch("funktion"); }} options={FUNKTIONEN} placeholder="Funktion wählen" hint="Haupttätigkeit im Spitex-Betrieb" error={touched.funktion && !filled(data.funktion) ? "Pflichtfeld" : undefined} />
        <TextInput label="Eintrittsdatum" required value={data.eintrittsdatum} onChange={v => set("eintrittsdatum", v)} onBlur={() => touch("eintrittsdatum")} placeholder="01.03.2026" hint="Format: TT.MM.JJJJ" />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <NumberInput label="Stundenlohn" required value={data.stundenlohn} onChange={v => set("stundenlohn", v)} suffix="CHF" placeholder="32.00" hint="Brutto-Stundenlohn in Schweizer Franken" />
      </div>

      <SectionHeader icon={CreditCard} label="Auszahlung" />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <TextInput label="Bankname" required value={data.bankname} onChange={v => set("bankname", v)} onBlur={() => touch("bankname")} placeholder="z.B. PostFinance, UBS, Raiffeisen" error={touched.bankname && !filled(data.bankname) ? "Pflichtfeld" : undefined} />
        <IBANInput label="IBAN" required value={data.iban} onChange={v => set("iban", v)} />
      </div>
    </div>
  );
}
