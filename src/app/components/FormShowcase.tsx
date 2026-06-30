import { useState } from "react";
import { User, Mail, Shield, Briefcase, Home, ToggleLeft, List, Search, Calendar, Box, Wind, Footprints, Heart, Pill, CloudUpload } from "lucide-react";
import { SectionHeader, TextInput, TextareaInput, NumberInput, FormField, SegmentedControl, Select, Combobox, DatePicker, AHVNummerInput, IBANInput, GroupBox, Accordion, AccordionItem, AccordionTrigger, AccordionContent, DocumentUploader, DocumentPreviewModal, type UploadedFile } from "./form";

export function FormShowcase() {
  const [name, setName] = useState("Maria");
  const [vorname, setVorname] = useState("");
  const [email, setEmail] = useState("maria@example");
  const [telefon, setTelefon] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [groesse, setGroesse] = useState("168");
  const [gewicht, setGewicht] = useState("");
  const [stundenlohn, setStundenlohn] = useState("32.50");
  const [erkrankungen, setErkrankungen] = useState("");
  const [allergien, setAllergien] = useState("Penicillin, Hausstaubmilben");

  // 1b state
  const [quellensteuer, setQuellensteuer] = useState("ja");
  const [brille, setBrille] = useState("nein");
  const [liftVorhanden, setLiftVorhanden] = useState("");
  const [schweregrad, setSchweregrad] = useState("mittel");
  const [geschlecht, setGeschlecht] = useState<string | null>(null);
  const [zivilstand, setZivilstand] = useState<string | null>("verheiratet");
  const [nationalitaet, setNationalitaet] = useState<string | null>("schweiz");
  const [aufenthaltsstatus, setAufenthaltsstatus] = useState<string | null>(null);
  const [geburtsdatum, setGeburtsdatum] = useState<Date | null>(null);
  const [eintrittsdatum, setEintrittsdatum] = useState<Date | null>(new Date(2026, 2, 3));
  const [disabledDate, setDisabledDate] = useState<Date | null>(null);
  const [docFile1, setDocFile1] = useState<UploadedFile | null>(null);
  const [docFile2, setDocFile2] = useState<UploadedFile | null>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  // 1c state
  const [ahv1, setAhv1] = useState("");
  const [ahv2, setAhv2] = useState("756.9217.0769.85");
  const [ahv3, setAhv3] = useState("756.1234.5678.99");
  const [ahv4, setAhv4] = useState("123.4567.8901.23");
  const [ahv5, setAhv5] = useState("756.1234.56");
  const [iban1, setIban1] = useState("");
  const [iban2, setIban2] = useState("CH9300762011623852957");
  const [iban3, setIban3] = useState("CH9300762011623852958");
  const [iban4, setIban4] = useState("DE89370400440532013000");
  const [iban5, setIban5] = useState("CH930076201162");

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "var(--space-8) var(--space-6) var(--space-12)" }}>
      <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
        Form-Komponenten Showcase
      </h1>
      <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>
        Visuelle Prüfung aller Basis-Form-Komponenten (1a) gemäss styleguide.md
      </p>

      {/* ── Section: Identität ── */}
      <SectionHeader icon={User} label="Identität" first />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <TextInput label="Name" required value={name} onChange={setName} placeholder="Nachname" />
        <TextInput label="Vorname" required value={vorname} onChange={setVorname} placeholder="Vorname" />
      </div>

      <div style={{ marginTop: "var(--space-5)" }}>
        <TextInput label="E-Mail" required value={email} onChange={setEmail} placeholder="name@example.com" error={email && !email.includes("@") ? undefined : email === "maria@example" ? "Ungültige E-Mail-Adresse" : undefined} hint="Geschäftliche E-Mail-Adresse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)", marginTop: "var(--space-5)" }}>
        <TextInput label="Telefon" value={telefon} onChange={setTelefon} placeholder="+41 79 123 45 67" />
        <TextInput label="AHV-Nummer" required value="" onChange={() => {}} placeholder="756.1234.5678.97" hint="Format: 756.XXXX.XXXX.XX" />
      </div>

      {/* ── Section: Kontaktdaten ── */}
      <SectionHeader icon={Mail} label="Kontaktdaten" />

      <div style={{ marginBottom: "var(--space-5)" }}>
        <TextInput label="Strasse" required value={strasse} onChange={setStrasse} placeholder="Musterstrasse 42" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <TextInput label="PLZ" required value={plz} onChange={setPlz} placeholder="8001" />
        <TextInput label="Ort" required value={ort} onChange={setOrt} placeholder="Zürich" />
      </div>

      {/* ── Section: Krankenkasse ── */}
      <SectionHeader icon={Shield} label="Krankenkasse" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <TextInput label="Krankenkasse" required value="" onChange={() => {}} placeholder="z.B. CSS, Helsana" />
        <TextInput label="Kartennummer" value="" onChange={() => {}} placeholder="Nummer auf der Versichertenkarte" />
      </div>

      {/* ── Section: Number Inputs ── */}
      <SectionHeader icon={Home} label="Anamnese — Basiswerte" />

      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "var(--space-5)" }}>
        <NumberInput label="Grösse" required value={groesse} onChange={setGroesse} suffix="cm" placeholder="170" />
        <NumberInput label="Gewicht" required value={gewicht} onChange={setGewicht} suffix="kg" placeholder="72" />
        <div>
          <FormField label="BMI" hint="Automatisch berechnet">
            <div style={{
              padding: "11px 16px",
              borderRadius: "var(--radius-card)",
              border: "var(--border-thin) solid var(--border-default)",
              background: "var(--bg-secondary)",
              fontSize: "var(--text-body)",
              color: groesse && gewicht ? "var(--text-primary)" : "var(--text-tertiary)",
              fontWeight: "var(--weight-medium)",
            }}>
              {groesse && gewicht
                ? (parseFloat(gewicht) / Math.pow(parseFloat(groesse) / 100, 2)).toFixed(1)
                : "—"}
            </div>
          </FormField>
        </div>
      </div>

      {/* ── Section: Anstellung ── */}
      <SectionHeader icon={Briefcase} label="Anstellung & Auszahlung" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <NumberInput label="Stundenlohn" required value={stundenlohn} onChange={setStundenlohn} suffix="CHF" placeholder="32.00" success={stundenlohn ? "Gültiger Betrag" : undefined} />
        <TextInput label="IBAN" required value="" onChange={() => {}} placeholder="CH93 0076 2011 6238 5295 7" hint="Schweizer IBAN im Format CH## ####..." />
      </div>

      {/* ── Section: Textareas ── */}
      <SectionHeader icon={Shield} label="Medizinische Angaben" />

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <TextareaInput
          label="Chronische Erkrankungen"
          required
          value={erkrankungen}
          onChange={setErkrankungen}
          placeholder="z.B. Diabetes mellitus Typ 2, Arterielle Hypertonie"
        />
        <TextareaInput
          label="Allergien"
          value={allergien}
          onChange={setAllergien}
          placeholder="z.B. Penicillin, Latex"
        />
        <TextareaInput
          label="Quellensteuer-Hinweise"
          value=""
          onChange={() => {}}
          placeholder="Optionale Hinweise für die Quellensteuer-Abrechnung"
          hint="Wird nur an die Lohnbuchhaltung weitergeleitet"
        />
      </div>

      {/* ── States Demo ── */}
      <SectionHeader icon={Shield} label="Input-States Demo" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <TextInput label="Default-State" value="" onChange={() => {}} placeholder="Normaler Zustand" />
        <TextInput label="Mit Fehler" required value="abc" onChange={() => {}} error="Ungültiges Format — nur Zahlen erlaubt" />
        <TextInput label="Mit Erfolg" value="756.1234.5678.97" onChange={() => {}} success="AHV-Nummer gültig ✓" />
        <TextInput label="Mit Hilfstext" value="" onChange={() => {}} hint="Format: TT.MM.JJJJ" placeholder="01.01.1990" />
        <NumberInput label="Mit Suffix" value="42" onChange={() => {}} suffix="%" />
        <NumberInput label="Leer mit Suffix" value="" onChange={() => {}} suffix="CHF" placeholder="0.00" />
      </div>

      {/* ════════════════════════════════════
         TEIL 1b — Komplexere Komponenten
         ════════════════════════════════════ */}

      <div style={{ marginTop: "var(--space-12)", paddingTop: "var(--space-8)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
          Teil 1b — Komplexere Komponenten
        </h2>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>
          SegmentedControl, Select, Combobox, DatePicker
        </p>
      </div>

      {/* ── SegmentedControl ── */}
      <SectionHeader icon={ToggleLeft} label="SegmentedControl" first />

      <div className="flex flex-col" style={{ gap: "var(--space-5)" }}>
        <SegmentedControl label="Quellensteuer" required value={quellensteuer} onChange={setQuellensteuer} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} />
        <SegmentedControl label="Brille" value={brille} onChange={setBrille} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} />
        <SegmentedControl label="Lift vorhanden" value={liftVorhanden} onChange={setLiftVorhanden} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }, { value: "unbekannt", label: "Unbekannt" }]} hint="Drei Optionen" />
        <SegmentedControl label="Schweregrad" required value={schweregrad} onChange={setSchweregrad} options={[{ value: "leicht", label: "Leicht" }, { value: "mittel", label: "Mittel" }, { value: "schwer", label: "Schwer" }, { value: "kritisch", label: "Kritisch" }]} />
        <SegmentedControl label="Disabled" value="ja" onChange={() => {}} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} disabled />
      </div>

      {/* ── Select ── */}
      <SectionHeader icon={List} label="Select (Dropdown)" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <Select label="Geschlecht" required value={geschlecht} onChange={setGeschlecht} placeholder="Geschlecht wählen" options={[{ value: "maennlich", label: "Männlich" }, { value: "weiblich", label: "Weiblich" }, { value: "divers", label: "Divers" }]} />
        <Select label="Zivilstand" required value={zivilstand} onChange={setZivilstand} placeholder="Zivilstand wählen" options={[{ value: "ledig", label: "Ledig" }, { value: "verheiratet", label: "Verheiratet" }, { value: "geschieden", label: "Geschieden" }, { value: "verwitwet", label: "Verwitwet" }, { value: "eingetragene_partnerschaft", label: "Eingetragene Partnerschaft" }]} />
        <Select label="Mit Fehler" required value={null} onChange={() => {}} placeholder="Pflichtfeld leer" options={[{ value: "a", label: "A" }]} error="Pflichtfeld — bitte wählen" />
        <Select label="Disabled" value="a" onChange={() => {}} options={[{ value: "a", label: "Option A" }]} disabled />
      </div>

      {/* ── Combobox ── */}
      <SectionHeader icon={Search} label="Combobox (suchbares Dropdown)" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <Combobox label="Nationalität" required value={nationalitaet} onChange={setNationalitaet} placeholder="Nationalität suchen" options={[
          { value: "schweiz", label: "Schweiz" },
          { value: "deutschland", label: "Deutschland" },
          { value: "frankreich", label: "Frankreich" },
          { value: "italien", label: "Italien" },
          { value: "oesterreich", label: "Österreich" },
          { value: "portugal", label: "Portugal" },
          { value: "spanien", label: "Spanien" },
          { value: "tuerkei", label: "Türkei" },
          { value: "niederlande", label: "Niederlande" },
          { value: "belgien", label: "Belgien" },
          { value: "polen", label: "Polen" },
          { value: "rumaenien", label: "Rumänien" },
          { value: "kroatien", label: "Kroatien" },
          { value: "serbien", label: "Serbien" },
          { value: "kosovo", label: "Kosovo" },
        ]} />
        <Combobox label="Aufenthaltsstatus" value={aufenthaltsstatus} onChange={setAufenthaltsstatus} placeholder="Status wählen" options={[
          { value: "CH", label: "Schweizer Bürger/in", group: "Schweiz" },
          { value: "B", label: "B – Aufenthaltsbewilligung", group: "EU/EFTA" },
          { value: "C", label: "C – Niederlassungsbewilligung", group: "EU/EFTA" },
          { value: "L", label: "L – Kurzaufenthaltsbewilligung", group: "Drittstaaten" },
          { value: "G", label: "G – Grenzgängerbewilligung", group: "Drittstaaten" },
          { value: "F", label: "F – Vorläufige Aufnahme", group: "Drittstaaten" },
          { value: "N", label: "N – Asylsuchende", group: "Drittstaaten" },
          { value: "S", label: "S – Schutzbedürftige", group: "Drittstaaten" },
        ]} hint="Gruppiert nach Herkunft" />
      </div>

      {/* ── DatePicker ── */}
      <SectionHeader icon={Calendar} label="DatePicker" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <DatePicker label="Geburtsdatum" required value={geburtsdatum} onChange={setGeburtsdatum} maxDate={new Date()} />
        <DatePicker label="Eintrittsdatum" required value={eintrittsdatum} onChange={setEintrittsdatum} />
        <DatePicker label="Mit Fehler" required value={null} onChange={() => {}} error="Datum muss in der Zukunft liegen" />
        <DatePicker label="Disabled" value={null} onChange={() => {}} disabled />
        <DatePicker label="Mit minDate (ab heute)" value={disabledDate} onChange={setDisabledDate} minDate={new Date()} hint="Vergangene Tage sind nicht wählbar" />
      </div>

      {/* ════════════════════════════════════
         TEIL 1c — Spezial-Inputs
         ════════════════════════════════════ */}

      <div style={{ marginTop: "var(--space-12)", paddingTop: "var(--space-8)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
          Teil 1c — Spezial-Inputs
        </h2>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>
          AHV-Nummer mit EAN-13-Prüfziffer, IBAN mit Modulo-97-Validierung. Fokussiere ein Feld und drücke Tab, um die Validierung auszulösen.
        </p>
      </div>

      {/* ── AHV-Nummer ── */}
      <SectionHeader icon={User} label="AHV-Nummer (756.XXXX.XXXX.XX)" first />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <AHVNummerInput label="Leer (Pflicht)" required value={ahv1} onChange={setAhv1} />
        <AHVNummerInput label="Gültige Nummer" required value={ahv2} onChange={setAhv2} />
        <AHVNummerInput label="Falsche Prüfziffer" required value={ahv3} onChange={setAhv3} />
        <AHVNummerInput label="Falsches Präfix" required value={ahv4} onChange={setAhv4} />
        <AHVNummerInput label="Unvollständig" required value={ahv5} onChange={setAhv5} />
        <AHVNummerInput label="Disabled" value="756.9217.0769.85" onChange={() => {}} disabled />
      </div>

      {/* ── IBAN ── */}
      <SectionHeader icon={Briefcase} label="IBAN (CH## #### #### #### #### #)" />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-5)" }}>
        <IBANInput label="Leer (Pflicht)" required value={iban1} onChange={setIban1} />
        <IBANInput label="Gültige Postfinance-IBAN" required value={iban2} onChange={setIban2} />
        <IBANInput label="Falsche Prüfsumme" required value={iban3} onChange={setIban3} />
        <IBANInput label="Falsches Präfix (DE)" required value={iban4} onChange={setIban4} />
        <IBANInput label="Unvollständig" required value={iban5} onChange={setIban5} />
        <IBANInput label="Disabled" value="CH9300762011623852957" onChange={() => {}} disabled />
      </div>

      {/* ════════════════════════════════════
         TEIL 2b — GroupBox
         ════════════════════════════════════ */}

      <div style={{ marginTop: "var(--space-12)", paddingTop: "var(--space-8)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>GroupBox</h2>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>Container für gruppierte Felder (z.B. Kinder)</p>
      </div>

      <SectionHeader icon={Box} label="GroupBox-Varianten" first />

      <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
        <GroupBox title="Adresse" subtitle="Hauptwohnsitz">
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
            <TextInput label="Strasse" value="" onChange={() => {}} placeholder="Musterstrasse 12" />
            <TextInput label="Ort" value="" onChange={() => {}} placeholder="Zürich" />
          </div>
        </GroupBox>

        <GroupBox title="Kind 1" subtitle="K-Zulage" onRemove={() => alert("Entfernen geklickt")}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
            <TextInput label="Name" required value="Müller" onChange={() => {}} />
            <TextInput label="Vorname" required value="Sophie" onChange={() => {}} />
            <TextInput label="Geburtsdatum" required value="15.03.2018" onChange={() => {}} hint="TT.MM.JJJJ" />
            <AHVNummerInput label="AHV-Nummer" required value="756.9217.0769.85" onChange={() => {}} />
          </div>
        </GroupBox>

        <GroupBox title="Kind 2" subtitle="W-Zulage" onRemove={() => alert("Entfernen geklickt")}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
            <TextInput label="Name" required value="Müller" onChange={() => {}} />
            <TextInput label="Vorname" required value="Liam" onChange={() => {}} />
          </div>
        </GroupBox>
      </div>

      {/* ════════════════════════════════════
         TEIL 3b — Accordion
         ════════════════════════════════════ */}

      <div style={{ marginTop: "var(--space-12)", paddingTop: "var(--space-8)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>Accordion</h2>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>Für ATL-Assessment und andere gruppierte Listen</p>
      </div>

      <Accordion defaultValue={["item-2"]}>
        <AccordionItem value="item-1">
          <AccordionTrigger value="item-1" icon={Wind} title="Atmung" subtitle="3 Items" status="leer" />
          <AccordionContent value="item-1">
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Atemnot, Husten, Sauerstoffbedarf — alle noch nicht ausgefüllt.</div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger value="item-2" icon={Footprints} title="Sich Bewegen" subtitle="3 Items" status="teilweise" />
          <AccordionContent value="item-2">
            <div className="flex flex-col" style={{ gap: "var(--space-4)" }}>
              <SegmentedControl label="Selbständige Mobilität" value="ja" onChange={() => {}} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} />
              <SegmentedControl label="Lagern / Transferhilfe" value="" onChange={() => {}} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }]} />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger value="item-3" icon={Heart} title="Geschlechtsidentität" subtitle="1 Item" status="vollstaendig" />
          <AccordionContent value="item-3">
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Alle Items ausgefüllt.</div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger value="item-4" icon={Pill} title="Medikamente" subtitle="3 Items" status="leer" />
          <AccordionContent value="item-4">
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Noch nicht ausgefüllt.</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ════════════════════════════════════
         DocumentUploader
         ════════════════════════════════════ */}

      <div style={{ marginTop: "var(--space-12)", paddingTop: "var(--space-8)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>DocumentUploader</h2>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>Drag-and-Drop mit Vorschau, Ersetzen, Entfernen. PDF- und Bild-Vorschau im Modal.</p>
      </div>

      <SectionHeader icon={CloudUpload} label="Upload-Varianten" first />
      <div className="flex flex-col" style={{ gap: "var(--space-5)" }}>
        <DocumentUploader label="ID oder Pass" description="Vorderseite und Rückseite" required value={docFile1} onChange={setDocFile1} onPreview={f => setPreviewFile(f)} />
        <DocumentUploader label="Krankenkassenkarte" value={docFile2} onChange={setDocFile2} onPreview={f => setPreviewFile(f)} />
        <DocumentUploader label="Disabled" disabled value={null} onChange={() => {}} />
      </div>

      {previewFile && <DocumentPreviewModal file={previewFile} isOpen onClose={() => setPreviewFile(null)} />}
    </div>
  );
}
