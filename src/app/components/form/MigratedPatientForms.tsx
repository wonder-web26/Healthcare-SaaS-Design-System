/**
 * Migrated form sub-components for StepPatient Tabs 1, 2, 3.
 * Uses new form components from components/form/.
 */
import { useState } from "react";
import { User, MapPin, Shield, Mail, Phone, IdCard, HeartPulse, Receipt, Stethoscope, Home, ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { NumberInput } from "./NumberInput";
import { AHVNummerInput } from "./AHVNummerInput";
import { SegmentedControl } from "./SegmentedControl";
import { Combobox as FormSelect } from "./Combobox";
import { FormField } from "./FormField";
import type { PatientFormData } from "../StepPatient";
import { KONFESSION_OPTIONS } from "../../../lib/stammdaten/konfession";
import { KRANKENKASSEN_OPTIONS, getBagNummer } from "../../../lib/stammdaten/krankenkassen";
import { ZIVILSTAND_OPTIONS } from "../../../lib/stammdaten/zivilstand";

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];
const JA_NEIN_UNB = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }, { value: "unbekannt", label: "Unbekannt" }];
const GESCHLECHT = [{ value: "weiblich", label: "Weiblich" }, { value: "maennlich", label: "Männlich" }, { value: "divers", label: "Divers" }];
// SP-01: Konfession aus shared stammdaten (ersetzt die alte lokale Liste)
const WOHNSITUATION = [{ value: "wohnung", label: "Eigene Wohnung" }, { value: "haus", label: "Eigenheim" }, { value: "betreut", label: "Betreutes Wohnen" }, { value: "heim", label: "Pflegeheim" }, { value: "sonstige", label: "Sonstige" }];
const STIMMUNG = [{ value: "stabil", label: "Stabil" }, { value: "gedrueckt", label: "Gedrückt" }, { value: "wechselhaft", label: "Wechselhaft" }, { value: "belastet", label: "Sehr belastet" }];
const PERSONEN = [{ value: "1", label: "1 (alleinlebend)" }, { value: "2", label: "2 Personen" }, { value: "3", label: "3 Personen" }, { value: "4+", label: "4+ Personen" }];

interface TabProps {
  data: PatientFormData;
  touched: Set<string>;
  onUpdate: (field: keyof PatientFormData, value: string) => void;
  onBlur: (field: string) => void;
}

/* ══════════════════════════════════════════
   TAB 1: PERSONALIEN (migrated)
   ══════════════════════════════════════════ */
export function TabPersonalienV2({ data, touched, onUpdate, onBlur }: TabProps) {
  const t = (f: string) => touched.has(f);
  const isSwiss = data.nationalitaet === "schweiz";

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={User} label="Identität" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="Name" required value={data.name} onChange={v => onUpdate("name", v)} onBlur={() => onBlur("name")} placeholder="Nachname" error={t("name") && !filled(data.name) ? "Pflichtfeld" : undefined} />
        <TextInput label="Vorname" required value={data.vorname} onChange={v => onUpdate("vorname", v)} onBlur={() => onBlur("vorname")} placeholder="Vorname" error={t("vorname") && !filled(data.vorname) ? "Pflichtfeld" : undefined} />
        <TextInput label="Geburtsdatum" required value={data.geburtsdatum} onChange={v => onUpdate("geburtsdatum", v)} onBlur={() => onBlur("geburtsdatum")} placeholder="01.01.1950" hint="Format: TT.MM.JJJJ" />
        <FormSelect label="Geschlecht" required value={data.geschlecht || null} onChange={v => onUpdate("geschlecht", v || "")} options={GESCHLECHT} placeholder="Geschlecht wählen" />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <AHVNummerInput label="AHV-Nummer" required value={data.ahvNummer} onChange={v => onUpdate("ahvNummer", v)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <TextInput label="Nationalität" value={data.nationalitaet} onChange={v => onUpdate("nationalitaet", v)} placeholder="z.B. Schweiz" />
        {isSwiss && <TextInput label="Heimatort" value={data.heimatort} onChange={v => onUpdate("heimatort", v)} placeholder="z.B. Bern" />}
        {!isSwiss && filled(data.nationalitaet) && (
          <FormSelect label="Aufenthaltsstatus" value={data.aufenthaltsstatus || null} onChange={v => onUpdate("aufenthaltsstatus", v || "")}
            options={[{ value: "B", label: "B" }, { value: "C", label: "C" }, { value: "L", label: "L" }, { value: "G", label: "G" }, { value: "F", label: "F" }, { value: "N", label: "N" }]} placeholder="Status wählen" />
        )}
        <FormSelect label="Zivilstand" value={data.zivilstand || null} onChange={v => onUpdate("zivilstand", v || "")} options={ZIVILSTAND_OPTIONS} placeholder="Zivilstand wählen" />
      </div>

      <SectionHeader icon={MapPin} label="Adresse" />
      <div style={{ marginBottom: "var(--space-5)" }}>
        <TextInput label="Strasse" required value={data.adresseStrasse} onChange={v => onUpdate("adresseStrasse", v)} onBlur={() => onBlur("adresseStrasse")} placeholder="Musterstrasse 12" error={t("adresseStrasse") && !filled(data.adresseStrasse) ? "Pflichtfeld" : undefined} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="PLZ" required value={data.adressePlz} onChange={v => onUpdate("adressePlz", v.replace(/\D/g, "").slice(0, 4))} onBlur={() => onBlur("adressePlz")} placeholder="8000" />
        <TextInput label="Ort" required value={data.adresseOrt} onChange={v => onUpdate("adresseOrt", v)} onBlur={() => onBlur("adresseOrt")} placeholder="Zürich" error={t("adresseOrt") && !filled(data.adresseOrt) ? "Pflichtfeld" : undefined} />
      </div>

      <SectionHeader icon={Shield} label="Krankenkasse & Aerzte" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        {/* SP-02: Picklist statt Freitext */}
        <FormSelect label="Krankenkasse" required value={data.krankenkasse || null} onChange={v => { const bag = getBagNummer(v || ""); onUpdate("krankenkasse", v || ""); if (bag) setTimeout(() => onUpdate("bagNr", bag), 0); }} options={KRANKENKASSEN_OPTIONS} placeholder="Krankenkasse wählen" error={t("krankenkasse") && !filled(data.krankenkasse) ? "Pflichtfeld" : undefined} />
        {/* SP-03: Kartennummer (umbenannt) */}
        <TextInput label="Kartennummer" required value={data.kartennummer} onChange={v => onUpdate("kartennummer", v)} onBlur={() => onBlur("kartennummer")} placeholder="Nummer auf der Versichertenkarte" error={t("kartennummer") && !filled(data.kartennummer) ? "Pflichtfeld" : undefined} />
        {/* SP-03: BAG-Nr. */}
        <TextInput label="BAG-Nr. der Kasse" value={data.bagNr} onChange={v => onUpdate("bagNr", v)} placeholder="z.B. 0271" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="Hausarzt Name" required value={data.hausarztName} onChange={v => onUpdate("hausarztName", v)} onBlur={() => onBlur("hausarztName")} placeholder="Dr. Müller" error={t("hausarztName") && !filled(data.hausarztName) ? "Pflichtfeld" : undefined} />
        <TextInput label="Hausarzt Telefon" value={data.hausarztTelefon} onChange={v => onUpdate("hausarztTelefon", v)} placeholder="+41 44 123 45 67" />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <TextInput label="Spezialarzt" value={data.spezialAerzte} onChange={v => onUpdate("spezialAerzte", v)} placeholder="Optional — z.B. Kardiologe Dr. Weber" />
      </div>

      <SectionHeader icon={Mail} label="Kontaktdaten" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="E-Mail" value={data.email} onChange={v => onUpdate("email", v)} placeholder="Optional" />
        <TextInput label="Telefon" value={data.telefon} onChange={v => onUpdate("telefon", v)} placeholder="Optional" />
      </div>

      <SectionHeader icon={Phone} label="Notfallkontakt" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <TextInput label="Name" required value={data.notfallkontaktName} onChange={v => onUpdate("notfallkontaktName", v)} onBlur={() => onBlur("notfallkontaktName")} placeholder="Kontaktperson" error={t("notfallkontaktName") && !filled(data.notfallkontaktName) ? "Pflichtfeld" : undefined} />
        <TextInput label="Telefon" required value={data.notfallkontaktTelefon} onChange={v => onUpdate("notfallkontaktTelefon", v)} onBlur={() => onBlur("notfallkontaktTelefon")} placeholder="+41 79 ..." error={t("notfallkontaktTelefon") && !filled(data.notfallkontaktTelefon) ? "Pflichtfeld" : undefined} />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <TextInput label="Beziehung" value={data.notfallkontaktBeziehung} onChange={v => onUpdate("notfallkontaktBeziehung", v)} placeholder="z.B. Ehepartner, Kind, Nachbar" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 2: STEUER & SOZIALVERSICHERUNGEN (migrated)
   ══════════════════════════════════════════ */
export function TabSteuerV2({ data, touched, onUpdate, onBlur }: TabProps) {
  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={IdCard} label="Sozialamt & IV" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <SegmentedControl label="Sozialamt involviert?" required value={data.sozialamtKontakt} onChange={v => onUpdate("sozialamtKontakt", v)} options={JA_NEIN} />
        <SegmentedControl label="IV-Bezug?" required value={data.ivBezug} onChange={v => onUpdate("ivBezug", v)} options={JA_NEIN} />
      </div>
      {data.sozialamtKontakt === "ja" && (
        <div style={{ marginTop: "var(--space-4)", marginLeft: "var(--space-4)" }}>
          <TextInput label="Kontakt Sozialamt" required value={data.sozialamtKontaktDetail} onChange={v => onUpdate("sozialamtKontaktDetail", v)} onBlur={() => onBlur("sozialamtKontaktDetail")} placeholder="Name und Kontaktangaben" />
        </div>
      )}
      {data.ivBezug === "ja" && (
        <div style={{ marginTop: "var(--space-4)", marginLeft: "var(--space-4)" }}>
          <NumberInput label="IV-Bezug" required value={data.ivBezugProzent} onChange={v => onUpdate("ivBezugProzent", v)} suffix="%" placeholder="z.B. 100" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Hilflosenentschädigung?" required value={data.hilflosenentschaedigung} onChange={v => onUpdate("hilflosenentschaedigung", v)} options={JA_NEIN} />
        <SegmentedControl label="Bezieht der Patient einen IV-Assistenzbeitrag?" required value={data.assistenzbeitrag} onChange={v => onUpdate("assistenzbeitrag", v)} options={JA_NEIN} />
      </div>

      <SectionHeader icon={Receipt} label="Konfession & Steuer" />
      <FormSelect label="Konfession" required value={data.konfession || null} onChange={v => onUpdate("konfession", v || "")} options={KONFESSION_OPTIONS} placeholder="Bitte wählen" />
      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Quellensteuer-Hinweise" value={data.quellensteuerHinweise} onChange={v => onUpdate("quellensteuerHinweise", v)} placeholder="Optionale Hinweise zur Quellensteuer-Situation" hint="Wird nur an die Lohnbuchhaltung weitergeleitet" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 3: ANAMNESE (migrated)
   ══════════════════════════════════════════ */
export function TabAnamneseV2({ data, touched, onUpdate, onBlur }: TabProps) {
  const t = (f: string) => touched.has(f);
  const [expandedAnamnese, setExpandedAnamnese] = useState(false);

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Stethoscope} label="Basisanamnese" first />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <NumberInput label="Grösse" required value={data.groesse} onChange={v => onUpdate("groesse", v)} suffix="cm" placeholder="170" error={t("groesse") && !filled(data.groesse) ? "Pflichtfeld" : undefined} />
        <NumberInput label="Gewicht" required value={data.gewicht} onChange={v => onUpdate("gewicht", v)} suffix="kg" placeholder="72" error={t("gewicht") && !filled(data.gewicht) ? "Pflichtfeld" : undefined} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Gewichtsverlust" required value={data.gewichtsverlust} onChange={v => onUpdate("gewichtsverlust", v)} options={JA_NEIN} />
        <SegmentedControl label="Brille" required value={data.brille} onChange={v => onUpdate("brille", v)} options={JA_NEIN} />
        <SegmentedControl label="Hörgerät" required value={data.hoergeraet} onChange={v => onUpdate("hoergeraet", v)} options={JA_NEIN} />
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Chronische Erkrankungen" required value={data.chronischeErkrankungen} onChange={v => onUpdate("chronischeErkrankungen", v)} onBlur={() => onBlur("chronischeErkrankungen")} placeholder="z.B. Diabetes mellitus Typ 2, Arterielle Hypertonie" error={t("chronischeErkrankungen") && !filled(data.chronischeErkrankungen) ? "Mindestens eine Diagnose erforderlich" : undefined} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Spitalaufenthalte (letzte 90 Tage)" value={data.spitalaufenthalte} onChange={v => onUpdate("spitalaufenthalte", v)} options={JA_NEIN} />
        <TextareaInput label="Operationen" value={data.operationen} onChange={v => onUpdate("operationen", v)} placeholder="z.B. Hüft-TEP rechts (2024), Knie-TEP links (2022), Appendektomie (2018)" rows={4} />
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Allergien / Unverträglichkeiten" value={data.allergien} onChange={v => onUpdate("allergien", v)} placeholder="z.B. Penicillin, Latex, Nüsse" hint="Medikamente, Nahrungsmittel, Latex etc." />
      </div>

      {/* Wohnsituation */}
      <SectionHeader icon={Home} label="Wohnsituation" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <FormSelect label="Wohnsituation" value={data.wohnsituation || null} onChange={v => onUpdate("wohnsituation", v || "")} options={WOHNSITUATION} placeholder="Bitte wählen" />
        <TextInput label="Etage" value={data.etage} onChange={v => onUpdate("etage", v)} placeholder="z.B. 2. OG" />
        <SegmentedControl label="Lift vorhanden" value={data.liftVorhanden} onChange={v => onUpdate("liftVorhanden", v)} options={JA_NEIN} />
        <SegmentedControl label="Treppen" value={data.treppen} onChange={v => onUpdate("treppen", v)} options={JA_NEIN} />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <FormSelect label="Personen im Haushalt" value={data.personenImHaushalt || null} onChange={v => onUpdate("personenImHaushalt", v || "")} options={PERSONEN} placeholder="Wählen" hint="Inklusive Patient" />
      </div>

      {/* Erweiterte Anamnese (collapsible) */}
      <div style={{ marginTop: 28 }}>
        <button type="button" onClick={() => setExpandedAnamnese(o => !o)} className="inline-flex items-center cursor-pointer transition-colors"
          style={{ gap: "var(--space-2)", padding: "10px 18px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          {expandedAnamnese ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          {expandedAnamnese ? "Erweiterte Anamnese einklappen" : "Erweiterte Anamnese ausfüllen (optional)"}
        </button>

        {expandedAnamnese && (
          <div className="flex flex-col" style={{ gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
            <TextareaInput label="Ausführliche Anamnese" value={data.anamneseText} onChange={v => onUpdate("anamneseText", v)} placeholder="Detaillierte medizinische Vorgeschichte" />

            {/* PA-03: Sturz-Assessment */}
            <SectionHeader icon={HeartPulse} label="Sturz-Assessment" />
            <FormSelect label="Stürze in den letzten 12 Monaten?" required value={data.sturzLetzte12m || null} onChange={v => {
              const val = v || "kein_sturz";
              onUpdate("sturzLetzte12m", val);
              if (val === "kein_sturz") { onUpdate("sturzAnzahl", ""); onUpdate("sturzKommentar", ""); }
            }} options={[
              { value: "kein_sturz", label: "Kein Sturz" },
              { value: "innerhalb_6_monate", label: "Ja, innerhalb 6 Monate" },
              { value: "7_bis_12_monate", label: "Ja, vor 7–12 Monaten" },
            ]} placeholder="Bitte wählen" />
            {data.sturzLetzte12m && data.sturzLetzte12m !== "kein_sturz" && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--space-4)", marginTop: "var(--space-3)" }}>
                <NumberInput label="Anzahl Stürze" value={data.sturzAnzahl} onChange={v => onUpdate("sturzAnzahl", v)} placeholder="z.B. 2" />
                <TextareaInput label="Bemerkungen (Umstände, Verletzungen, Ort)" value={data.sturzKommentar} onChange={v => onUpdate("sturzKommentar", v)} placeholder="z.B. Sturz im Bad, Prellung am Arm" />
              </div>
            )}
            <FormSelect label="Stimmung" value={data.stimmungAktuell || null} onChange={v => onUpdate("stimmungAktuell", v || "")} options={STIMMUNG} placeholder="Stimmung einschätzen" />
            <TextareaInput label="Behandlungsziel" value={data.behandlungszielFokus} onChange={v => onUpdate("behandlungszielFokus", v)} placeholder="Hauptziel der Pflege und Betreuung" />
          </div>
        )}
      </div>
    </div>
  );
}
