/**
 * Migrated form sub-components for StepPatient Tabs 1, 2, 3.
 * Uses new form components from components/form/.
 */
import { useState } from "react";
import { User, Users, MapPin, Shield, Mail, Phone, IdCard, HeartPulse, Receipt, Stethoscope, Home, ClipboardList, Languages, ChevronDown, ChevronUp, CheckCircle2, FileText } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { FELD_MAX, katalogFeldBreite } from "./feldbreiten";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { NumberInput } from "./NumberInput";
import { AHVNummerInput } from "./AHVNummerInput";
import { SegmentedControl } from "./SegmentedControl";
import { Combobox as FormSelect } from "./Combobox";
import { FormField } from "./FormField";
import { DateField } from "./DateField";
import type { PatientFormData } from "../StepPatient";
import { KONFESSION_OPTIONS } from "../../../lib/stammdaten/konfession";
import { KRANKENKASSEN_OPTIONS, getBagNummer } from "../../../lib/stammdaten/krankenkassen";
import { SDA_WOHNSITUATION_OPTIONS } from "../../../lib/stammdaten/sda-wohnsituation";
import { SDA_SPITALAUFENTHALT_OPTIONS } from "../../../lib/stammdaten/sda-spitalaufenthalt";
import { GESCHLECHT_OPTIONS } from "../../../lib/stammdaten/geschlecht";
import { ZIVILSTAND_OPTIONS } from "../../../lib/stammdaten/zivilstand";
import { STAATSANGEHOERIGKEIT_OPTIONS, istSchweiz } from "../../../lib/stammdaten/staatsangehoerigkeit";
import { AUFENTHALTSSTATUS_OPTIONS } from "../../../lib/stammdaten/aufenthaltsstatus";
import { SDA_EROEFFNUNGSGRUND_OPTIONS } from "../../../lib/stammdaten/sda-eroeffnungsgrund";
import { SDA_ANMELDENDE_INSTITUTION_OPTIONS, INSTITUTION_ANDERE } from "../../../lib/stammdaten/sda-anmeldende-institution";
import { SDA_EINSCHAETZUNG_SITUATION_OPTIONS, sdaEinschaetzungFolge } from "../../../lib/stammdaten/sda-einschaetzung-situation";
import { SDA_ZUSAMMENLEBEN_OPTIONS } from "../../../lib/stammdaten/sda-zusammenleben";
import { SDA_JA_NEIN_OPTIONS } from "../../../lib/stammdaten/sda-ja-nein";
import { SDA_SPRACHE_OPTIONS, SPRACHE_ANDERE } from "../../../lib/stammdaten/sda-sprache";
import { AppButton } from "../ui/AppButton";

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];
const STIMMUNG = [{ value: "stabil", label: "Stabil" }, { value: "gedrueckt", label: "Gedrückt" }, { value: "wechselhaft", label: "Wechselhaft" }, { value: "belastet", label: "Sehr belastet" }];
const PERSONEN = [{ value: "1", label: "1 (alleinlebend)" }, { value: "2", label: "2 Personen" }, { value: "3", label: "3 Personen" }, { value: "4+", label: "4+ Personen" }];

interface TabProps {
  data: PatientFormData;
  touched: Set<string>;
  onUpdate: (field: keyof PatientFormData, value: string) => void;
  /** Mehrere Felder in einem Zug — nötig, wo ein Feld ein zweites mitschreibt. */
  onUpdateMehrere?: (patch: Partial<PatientFormData>) => void;
  onBlur: (field: string) => void;
}

/* ══════════════════════════════════════════
   REITER: ANMELDUNG (Bereich AA + BB16)
   ══════════════════════════════════════════ */

/**
 * Der Bereich AA wird zum Zeitpunkt der Anmeldung erhoben — meist telefonisch,
 * bevor jemand die Person gesehen hat. Deshalb steht dieser Reiter vor allen
 * anderen Angaben.
 *
 * BB16 hat eine Triagefunktion; der Hilfetext unter dem Feld nennt die künftige
 * Folge, löst sie aber nicht aus. Dasselbe gilt für den Eröffnungsgrund 2.
 */
export function TabAnmeldungV2({ data, touched, onUpdate, onBlur }: TabProps) {
  const t = (f: string) => touched.has(f);
  const istAndereInstitution = data.anmeldendeInstitution === INSTITUTION_ANDERE;
  // Katalogfelder bemessen sich an ihrem längsten Wert — die Regel steht in feldbreiten.ts.
  const bEroeffnungsgrund = katalogFeldBreite(SDA_EROEFFNUNGSGRUND_OPTIONS);
  const bInstitution = katalogFeldBreite(SDA_ANMELDENDE_INSTITUTION_OPTIONS);
  const bEinschaetzung = katalogFeldBreite(SDA_EINSCHAETZUNG_SITUATION_OPTIONS);

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={ClipboardList} label="Anmeldung" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={bEroeffnungsgrund.zelle}><FormSelect label="Eröffnungsgrund" required steuerelementMaxBreite={bEroeffnungsgrund.steuerelement} value={data.eroeffnungsgrund || null} onChange={v => onUpdate("eroeffnungsgrund", v || "")} options={SDA_EROEFFNUNGSGRUND_OPTIONS} placeholder="Bitte wählen" error={t("eroeffnungsgrund") && !filled(data.eroeffnungsgrund) ? "Pflichtfeld" : undefined} /></div>
        <div><DateField label="Datum der Eröffnung des Dossiers" required steuerelementMaxBreite={FELD_MAX.schmal} wertFormat="display" value={data.dossierEroeffnetAm || null} onChange={v => onUpdate("dossierEroeffnetAm", (v as string) ?? "")} onBlur={() => onBlur("dossierEroeffnetAm")} /></div>
      </div>

      <SectionHeader icon={Phone} label="Anmeldende Stelle" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={bInstitution.zelle}><FormSelect label="Anmeldende Institution" required steuerelementMaxBreite={bInstitution.steuerelement} value={data.anmeldendeInstitution || null} onChange={v => onUpdate("anmeldendeInstitution", v || "")} options={SDA_ANMELDENDE_INSTITUTION_OPTIONS} placeholder="Bitte wählen" error={t("anmeldendeInstitution") && !filled(data.anmeldendeInstitution) ? "Pflichtfeld" : undefined} /></div>
        {/* Bei Code 8 ist die Institution als Freitext zu erfassen. */}
        {istAndereInstitution && <div><TextInput label="Welche Institution" required steuerelementMaxBreite={FELD_MAX.mittel} value={data.anmeldendeInstitutionAndere} onChange={v => onUpdate("anmeldendeInstitutionAndere", v)} onBlur={() => onBlur("anmeldendeInstitutionAndere")} placeholder="z.B. Beratungsstelle" error={t("anmeldendeInstitutionAndere") && !filled(data.anmeldendeInstitutionAndere) ? "Pflichtfeld" : undefined} /></div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div><TextInput label="Anmeldende Person" steuerelementMaxBreite={FELD_MAX.mittel} value={data.anmeldendePersonName} onChange={v => onUpdate("anmeldendePersonName", v)} placeholder="Optional — wer angerufen oder geschrieben hat" /></div>
        <div><TextInput label="Funktion oder Rolle" steuerelementMaxBreite={FELD_MAX.mittel} value={data.anmeldendePersonFunktion} onChange={v => onUpdate("anmeldendePersonFunktion", v)} placeholder="Optional" /></div>
        <div><TextInput label="Telefon" steuerelementMaxBreite={FELD_MAX.schmal} value={data.anmeldendePersonTelefon} onChange={v => onUpdate("anmeldendePersonTelefon", v)} placeholder="Optional" /></div>
        <div><TextInput label="E-Mail" steuerelementMaxBreite={FELD_MAX.mittel} value={data.anmeldendePersonEmail} onChange={v => onUpdate("anmeldendePersonEmail", v)} placeholder="Optional" /></div>
      </div>

      <SectionHeader icon={Stethoscope} label="Einschätzung" />
      <div style={bEinschaetzung.zelle}>
        <FormSelect label="Einschätzung der Situation" required steuerelementMaxBreite={bEinschaetzung.steuerelement} value={data.einschaetzungSituation || null} onChange={v => onUpdate("einschaetzungSituation", v || "")} options={SDA_EINSCHAETZUNG_SITUATION_OPTIONS} placeholder="Bitte wählen"
          hint={sdaEinschaetzungFolge(data.einschaetzungSituation) || undefined}
          error={t("einschaetzungSituation") && !filled(data.einschaetzungSituation) ? "Pflichtfeld" : undefined} />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Individuelle Präzisierungen" value={data.anmeldungPraezisierungen} onChange={v => onUpdate("anmeldungPraezisierungen", v)} placeholder="Optional" hint="Zusätzliche Informationen zum Bereich Anmeldung, die für Abklärung, Betreuung oder Pflege wesentlich sind." />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 1: PERSONALIEN (migrated)
   ══════════════════════════════════════════ */
export function TabPersonalienV2({ data, touched, onUpdate, onUpdateMehrere, onBlur }: TabProps) {
  const t = (f: string) => touched.has(f);
  const istSchweizerin = istSchweiz(data.staatsangehoerigkeit);
  const istAusland = filled(data.staatsangehoerigkeit) && !istSchweizerin;
  const istAndereSprache = data.spracheCode === SPRACHE_ANDERE;
  const bSprache = katalogFeldBreite(SDA_SPRACHE_OPTIONS);
  const bUebersetzer = katalogFeldBreite(SDA_JA_NEIN_OPTIONS);

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={User} label="Identität" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Name" required value={data.name} onChange={v => onUpdate("name", v)} onBlur={() => onBlur("name")} placeholder="Nachname" error={t("name") && !filled(data.name) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Vorname" required value={data.vorname} onChange={v => onUpdate("vorname", v)} onBlur={() => onBlur("vorname")} placeholder="Vorname" error={t("vorname") && !filled(data.vorname) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Geburtsdatum" required wertFormat="display" bereich="past" value={data.geburtsdatum || null} onChange={v => onUpdate("geburtsdatum", (v as string) ?? "")} onBlur={() => onBlur("geburtsdatum")} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><FormSelect label="Geschlecht" required value={data.geschlecht || null} onChange={v => onUpdate("geschlecht", v || "")} options={GESCHLECHT_OPTIONS} placeholder="Geschlecht wählen" /></div>
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><AHVNummerInput label="AHV-Nummer" required value={data.ahvNummer} onChange={v => onUpdate("ahvNummer", v)} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Staatsangehörigkeit" value={data.staatsangehoerigkeit || null} onChange={v => onUpdate("staatsangehoerigkeit", v || "")} options={STAATSANGEHOERIGKEIT_OPTIONS} placeholder="Staatsangehörigkeit wählen" /></div>
        {istSchweizerin && <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Heimatort" value={data.heimatort} onChange={v => onUpdate("heimatort", v)} placeholder="z.B. Bern" /></div>}
        {istAusland && (
          <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Aufenthaltsstatus" value={data.aufenthaltsstatus || null} onChange={v => onUpdate("aufenthaltsstatus", v || "")}
            options={AUFENTHALTSSTATUS_OPTIONS} placeholder="Status wählen" /></div>
        )}
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Zivilstand" value={data.zivilstand || null} onChange={v => onUpdate("zivilstand", v || "")} options={ZIVILSTAND_OPTIONS} placeholder="Zivilstand wählen" /></div>
      </div>

      <SectionHeader icon={MapPin} label="Adresse" />
      <div style={{ marginBottom: "var(--space-5)" }}>
        <TextInput label="Strasse" required value={data.adresseStrasse} onChange={v => onUpdate("adresseStrasse", v)} onBlur={() => onBlur("adresseStrasse")} placeholder="Musterstrasse 12" error={t("adresseStrasse") && !filled(data.adresseStrasse) ? "Pflichtfeld" : undefined} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="PLZ" required value={data.adressePlz} onChange={v => onUpdate("adressePlz", v.replace(/\D/g, "").slice(0, 4))} onBlur={() => onBlur("adressePlz")} placeholder="8000" /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Ort" required value={data.adresseOrt} onChange={v => onUpdate("adresseOrt", v)} onBlur={() => onBlur("adresseOrt")} placeholder="Zürich" error={t("adresseOrt") && !filled(data.adresseOrt) ? "Pflichtfeld" : undefined} /></div>
      </div>

      <SectionHeader icon={Shield} label="Krankenkasse & Aerzte" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        {/* SP-02: Picklist statt Freitext */}
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Krankenkasse" required value={data.krankenkasse || null} onChange={v => { const kasse = v || ""; const bag = getBagNummer(kasse); if (onUpdateMehrere) onUpdateMehrere({ krankenkasse: kasse, bagNr: bag || data.bagNr }); else onUpdate("krankenkasse", kasse); }} options={KRANKENKASSEN_OPTIONS} placeholder="Krankenkasse wählen" error={t("krankenkasse") && !filled(data.krankenkasse) ? "Pflichtfeld" : undefined} /></div>
        {/* SP-03: Kartennummer (umbenannt) */}
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Kartennummer" required value={data.kartennummer} onChange={v => onUpdate("kartennummer", v)} onBlur={() => onBlur("kartennummer")} placeholder="Nummer auf der Versichertenkarte" error={t("kartennummer") && !filled(data.kartennummer) ? "Pflichtfeld" : undefined} /></div>
        {/* SP-03: BAG-Nr. */}
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="BAG-Nr. der Kasse" value={data.bagNr} onChange={v => onUpdate("bagNr", v)} placeholder="z.B. 0271" /></div>
        {/* BB7b — bewusst ohne Vorbelegung aus BB7a: Grund- und Zusatzversicherung
            derselben Person können bei verschiedenen Kassen bestehen. */}
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Zusatzversicherung" value={data.zusatzversicherungKasse || null} onChange={v => onUpdate("zusatzversicherungKasse", v || "")} options={KRANKENKASSEN_OPTIONS} placeholder="Krankenkasse wählen" hint="Kann eine andere Krankenkasse sein als die Grundversicherung." /></div>
        {/* BB7c */}
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Invaliden-, Unfall-, Militärversicherung" steuerelementMaxBreite={FELD_MAX.mittel} value={data.weitereVersicherung} onChange={v => onUpdate("weitereVersicherung", v)} placeholder="Optional — Name der Versicherung" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Hausarzt Name" required value={data.hausarztName} onChange={v => onUpdate("hausarztName", v)} onBlur={() => onBlur("hausarztName")} placeholder="Dr. Müller" error={t("hausarztName") && !filled(data.hausarztName) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Hausarzt Telefon" value={data.hausarztTelefon} onChange={v => onUpdate("hausarztTelefon", v)} placeholder="+41 44 123 45 67" /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Hausarzt E-Mail" value={data.hausarztEmail} onChange={v => onUpdate("hausarztEmail", v)} placeholder="praxis@example.ch" /></div>
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Spezialarzt" value={data.spezialAerzte} onChange={v => onUpdate("spezialAerzte", v)} placeholder="Optional — z.B. Kardiologe Dr. Weber" /></div>
      </div>

      <SectionHeader icon={Mail} label="Kontaktdaten" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="E-Mail" value={data.email} onChange={v => onUpdate("email", v)} placeholder="Optional" /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Telefon" value={data.telefon} onChange={v => onUpdate("telefon", v)} placeholder="Optional" /></div>
      </div>

      <SectionHeader icon={Languages} label="Sprache und Verständigung" />
      <div style={bSprache.zelle}>
        <FormSelect label="Üblicherweise gesprochene Sprache" required steuerelementMaxBreite={bSprache.steuerelement}
          value={data.spracheCode || null} onChange={v => onUpdate("spracheCode", v || "")} options={SDA_SPRACHE_OPTIONS} placeholder="Bitte wählen"
          hint="Bevorzugte Sprache für die tägliche Kommunikation. Ist die Person der lokalen Sprache nicht mächtig, wird die Sprache erfasst, die sie normalerweise spricht."
          error={t("spracheCode") && !filled(data.spracheCode) ? "Pflichtfeld" : undefined} />
      </div>
      {/* Bei Code 21 ist die Sprache als Freitext zu erfassen. */}
      {istAndereSprache && (
        <div style={{ marginTop: "var(--space-4)", maxWidth: FELD_MAX.mittel }}>
          <TextInput label="Welche Sprache" required steuerelementMaxBreite={FELD_MAX.mittel} value={data.spracheAndere} onChange={v => onUpdate("spracheAndere", v)} onBlur={() => onBlur("spracheAndere")} placeholder="z.B. Vietnamesisch"
            error={t("spracheAndere") && !filled(data.spracheAndere) ? "Pflichtfeld" : undefined} />
        </div>
      )}
      <div style={{ marginTop: "var(--space-4)" }}>
        <div style={bUebersetzer.zelle}>
          <FormSelect label="Übersetzer/in notwendig" required steuerelementMaxBreite={bUebersetzer.steuerelement}
            value={data.uebersetzerNotwendig || null} onChange={v => onUpdate("uebersetzerNotwendig", v || "")} options={SDA_JA_NEIN_OPTIONS} placeholder="Bitte wählen"
            error={t("uebersetzerNotwendig") && !filled(data.uebersetzerNotwendig) ? "Pflichtfeld" : undefined} />
        </div>
      </div>

      <SectionHeader icon={Phone} label="Notfallkontakt" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Name" required value={data.notfallkontaktName} onChange={v => onUpdate("notfallkontaktName", v)} onBlur={() => onBlur("notfallkontaktName")} placeholder="Kontaktperson" error={t("notfallkontaktName") && !filled(data.notfallkontaktName) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Telefon" required value={data.notfallkontaktTelefon} onChange={v => onUpdate("notfallkontaktTelefon", v)} onBlur={() => onBlur("notfallkontaktTelefon")} placeholder="+41 79 ..." error={t("notfallkontaktTelefon") && !filled(data.notfallkontaktTelefon) ? "Pflichtfeld" : undefined} /></div>
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Beziehung" value={data.notfallkontaktBeziehung} onChange={v => onUpdate("notfallkontaktBeziehung", v)} placeholder="z.B. Ehepartner, Kind, Nachbar" /></div>
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
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
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
          <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="IV-Bezug" required value={data.ivBezugProzent} onChange={v => onUpdate("ivBezugProzent", v)} suffix="%" placeholder="z.B. 100" /></div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Hilflosenentschädigung?" required value={data.hilflosenentschaedigung} onChange={v => onUpdate("hilflosenentschaedigung", v)} options={JA_NEIN} />
        <SegmentedControl label="Bezieht der Patient einen IV-Assistenzbeitrag?" required value={data.assistenzbeitrag} onChange={v => onUpdate("assistenzbeitrag", v)} options={JA_NEIN} />
      </div>

      <SectionHeader icon={Receipt} label="Konfession & Steuer" />
      <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Konfession" required value={data.konfession || null} onChange={v => onUpdate("konfession", v || "")} options={KONFESSION_OPTIONS} placeholder="Bitte wählen" /></div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Quellensteuer-Hinweise" value={data.quellensteuerHinweise} onChange={v => onUpdate("quellensteuerHinweise", v)} placeholder="Optionale Hinweise zur Quellensteuer-Situation" hint="Wird nur an die Lohnbuchhaltung weitergeleitet" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   REITER: WOHNEN & UMFELD (BB9, BB10, BB15)
   ══════════════════════════════════════════ */

/**
 * Der Standard trennt Lebenssituation und Gesundheitszustand. BB9, BB10 und
 * BB15 beschreiben, wo und mit wem die Person lebt — sie gehören deshalb nicht
 * zwischen Grösse, Gewicht und Diagnosen.
 *
 * Organisationseigene Felder (Etage, Lift, Treppen, Personen im Haushalt)
 * stehen unter eigener Zwischenüberschrift, damit erkennbar bleibt, was aus
 * dem Katalog stammt und was nicht.
 */
export function TabWohnenUmfeldV2({ data, touched, onUpdate, onBlur }: TabProps) {
  const t = (f: string) => touched.has(f);
  const bWohnsituation = katalogFeldBreite(SDA_WOHNSITUATION_OPTIONS);
  const bZusammenleben = katalogFeldBreite(SDA_ZUSAMMENLEBEN_OPTIONS);
  const bJaNein = katalogFeldBreite(SDA_JA_NEIN_OPTIONS);

  /** BB15a–e: fünf unabhängige Ja/Nein-Angaben auf derselben Werteliste. */
  const wohnvorgeschichte: { feld: keyof PatientFormData; label: string }[] = [
    { feld: "wohnvorgeschichtePflegeheim", label: "Alters- und Pflegeheim" },
    { feld: "wohnvorgeschichteBetreutesWohnen", label: "Begleitetes oder betreutes Wohnen" },
    { feld: "wohnvorgeschichtePsychischeProbleme", label: "Einrichtung für Personen mit psychischen Problemen" },
    { feld: "wohnvorgeschichtePsychiatrie", label: "Psychiatrische Klinik oder Psychiatrieabteilung eines Spitals" },
    { feld: "wohnvorgeschichteGeistigeBehinderung", label: "Einrichtung für Personen mit einer geistigen Behinderung" },
  ];

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Home} label="Wohnsituation" first />
      <div style={bWohnsituation.zelle}>
        <FormSelect label="Wohnsituation zur Zeit der Abklärung" required steuerelementMaxBreite={bWohnsituation.steuerelement}
          value={data.wohnsituation || null} onChange={v => onUpdate("wohnsituation", v || "")} options={SDA_WOHNSITUATION_OPTIONS} placeholder="Bitte wählen"
          hint="Wohnort für die Zeit, in der Spitex-Leistungen bezogen werden. Weilt die Person aktuell im Spital, wird der Ort erfasst, an dem die Leistung beginnen soll."
          error={t("wohnsituation") && !filled(data.wohnsituation) ? "Pflichtfeld" : undefined} />
      </div>

      <SectionHeader icon={Home} label="Ergänzende Angaben zum Zugang" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div><TextInput label="Etage" steuerelementMaxBreite={FELD_MAX.schmal} value={data.etage} onChange={v => onUpdate("etage", v)} placeholder="z.B. 2. OG" /></div>
        <SegmentedControl label="Lift vorhanden" value={data.liftVorhanden} onChange={v => onUpdate("liftVorhanden", v)} options={JA_NEIN} />
        <SegmentedControl label="Treppen" value={data.treppen} onChange={v => onUpdate("treppen", v)} options={JA_NEIN} />
      </div>

      <SectionHeader icon={Users} label="Zusammenleben" />
      <div style={bZusammenleben.zelle}>
        <FormSelect label="Form des Zusammenlebens" required steuerelementMaxBreite={bZusammenleben.steuerelement}
          value={data.formZusammenleben || null} onChange={v => onUpdate("formZusammenleben", v || "")} options={SDA_ZUSAMMENLEBEN_OPTIONS} placeholder="Bitte wählen"
          hint="Massgebend ist die Situation für die Dauer der Abklärung. Vorübergehende Rahmenbedingungen zählen nicht — etwa wenn die Tochter nur bleibt, bis die Spitex-Leistung angelaufen ist."
          error={t("formZusammenleben") && !filled(data.formZusammenleben) ? "Pflichtfeld" : undefined} />
      </div>
      <div style={{ marginTop: "var(--space-4)" }}>
        <div style={bJaNein.zelle}>
          <FormSelect label="Lebt die Person neu mit jemand anderem zusammen" required steuerelementMaxBreite={bJaNein.steuerelement}
            value={data.neuZusammenlebend || null} onChange={v => onUpdate("neuZusammenlebend", v || "")} options={SDA_JA_NEIN_OPTIONS} placeholder="Bitte wählen"
            hint="Verglichen mit vor 90 Tagen oder seit der letzten Beurteilung. Auch wenn die Partnerin oder der Partner in dieser Zeit verstorben ist."
            error={t("neuZusammenlebend") && !filled(data.neuZusammenlebend) ? "Pflichtfeld" : undefined} />
        </div>
      </div>

      <SectionHeader icon={Users} label="Ergänzende Angaben" />
      <div style={{ maxWidth: FELD_MAX.schmal }}>
        <FormSelect label="Personen im Haushalt" value={data.personenImHaushalt || null} onChange={v => onUpdate("personenImHaushalt", v || "")} options={PERSONEN} placeholder="Wählen" hint="Inklusive Patient" />
      </div>

      <SectionHeader icon={Home} label="Wohn-Vorgeschichte der letzten 5 Jahre" />
      <div className="flex flex-col" style={{ rowGap: "var(--space-3)" }}>
        {wohnvorgeschichte.map(({ feld, label }) => (
          <div key={feld} style={bJaNein.zelle}>
            <FormSelect label={label} required steuerelementMaxBreite={bJaNein.steuerelement}
              value={(data[feld] as string) || null} onChange={v => onUpdate(feld, v || "")} options={SDA_JA_NEIN_OPTIONS} placeholder="Bitte wählen"
              error={t(feld) && !filled(data[feld] as string) ? "Pflichtfeld" : undefined} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 3: ANAMNESE (migrated)
   ══════════════════════════════════════════ */
export function TabAnamneseV2({ data, touched, onUpdate, onBlur }: TabProps) {
  const t = (f: string) => touched.has(f);
  // expandedAnamnese state entfernt — Erweiterte Anamnese ist dauerhaft sichtbar

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Stethoscope} label="Basisanamnese" first />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="Grösse" required value={data.groesse} onChange={v => onUpdate("groesse", v)} suffix="cm" placeholder="170" error={t("groesse") && !filled(data.groesse) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="Gewicht" required value={data.gewicht} onChange={v => onUpdate("gewicht", v)} suffix="kg" placeholder="72" error={t("gewicht") && !filled(data.gewicht) ? "Pflichtfeld" : undefined} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Gewichtsverlust" required value={data.gewichtsverlust} onChange={v => onUpdate("gewichtsverlust", v)} options={JA_NEIN} />
        <SegmentedControl label="Brille" required value={data.brille} onChange={v => onUpdate("brille", v)} options={JA_NEIN} />
        <SegmentedControl label="Hörgerät" required value={data.hoergeraet} onChange={v => onUpdate("hoergeraet", v)} options={JA_NEIN} />
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Chronische Erkrankungen" required value={data.chronischeErkrankungen} onChange={v => onUpdate("chronischeErkrankungen", v)} onBlur={() => onBlur("chronischeErkrankungen")} placeholder="z.B. Diabetes mellitus Typ 2, Arterielle Hypertonie" error={t("chronischeErkrankungen") && !filled(data.chronischeErkrankungen) ? "Mindestens eine Diagnose erforderlich" : undefined} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Zeit seit dem letzten Spitalaufenthalt" value={data.spitalaufenthalte || null} onChange={v => onUpdate("spitalaufenthalte", v || "")} options={SDA_SPITALAUFENTHALT_OPTIONS} placeholder="Bitte wählen" /></div>
        <TextareaInput label="Operationen" value={data.operationen} onChange={v => onUpdate("operationen", v)} placeholder="z.B. Hüft-TEP rechts (2024), Knie-TEP links (2022), Appendektomie (2018)" rows={4} />
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <TextareaInput label="Allergien / Unverträglichkeiten" value={data.allergien} onChange={v => onUpdate("allergien", v)} placeholder="z.B. Penicillin, Latex, Nüsse" hint="Medikamente, Nahrungsmittel, Latex etc." />
      </div>

      {/* Erweiterte Anamnese (dauerhaft sichtbar) */}
      <SectionHeader icon={HeartPulse} label="Erweiterte Anamnese" />
      <div className="flex flex-col" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <TextareaInput label="Ausführliche Anamnese" value={data.anamneseText} onChange={v => onUpdate("anamneseText", v)} placeholder="Detaillierte medizinische Vorgeschichte" />

        {/* PA-03: Sturz-Assessment */}
        <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>Sturz-Assessment</div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><FormSelect label="Stürze in den letzten 12 Monaten?" required value={data.sturzLetzte12m || null} onChange={v => {
          const val = v || "kein_sturz";
          onUpdate("sturzLetzte12m", val);
          if (val === "kein_sturz") { onUpdate("sturzAnzahl", ""); onUpdate("sturzKommentar", ""); }
        }} options={[
          { value: "kein_sturz", label: "Kein Sturz" },
          { value: "innerhalb_6_monate", label: "Ja, innerhalb 6 Monate" },
          { value: "7_bis_12_monate", label: "Ja, vor 7–12 Monaten" },
        ]} placeholder="Bitte wählen" /></div>
        {data.sturzLetzte12m && data.sturzLetzte12m !== "kein_sturz" && (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-3)" }}>
            <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="Anzahl Stürze" value={data.sturzAnzahl} onChange={v => onUpdate("sturzAnzahl", v)} placeholder="z.B. 2" /></div>
            <TextareaInput label="Bemerkungen (Umstände, Verletzungen, Ort)" value={data.sturzKommentar} onChange={v => onUpdate("sturzKommentar", v)} placeholder="z.B. Sturz im Bad, Prellung am Arm" />
          </div>
        )}
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Stimmung" value={data.stimmungAktuell || null} onChange={v => onUpdate("stimmungAktuell", v || "")} options={STIMMUNG} placeholder="Stimmung einschätzen" /></div>
        <TextareaInput label="Behandlungsziel" value={data.behandlungszielFokus} onChange={v => onUpdate("behandlungszielFokus", v)} placeholder="Hauptziel der Pflege und Betreuung" />
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════
   REITER ABSCHLUSS — BB17 und individuelle Präzisierungen
   ══════════════════════════════════════════ */

/**
 * Letzter Reiter des Schritts Patient.
 *
 * Er nimmt die individuelle Präzisierung des Bereichs BB auf, zeigt beide
 * Präzisierungen zusammen, führt das Protokoll nach BB17 und trägt die
 * Aktion "SDA abschliessen".
 *
 * Das Protokoll ersetzt die beiden Unterschriften des Standards (Entscheid
 * 4.8.2026) und ist nicht bearbeitbar.
 */
export function TabAbschlussV2({ data, abschliessbar, onUpdate, onAbschliessen }: {
  data: PatientFormData;
  abschliessbar: boolean;
  onUpdate: (feld: keyof PatientFormData, wert: string) => void;
  onAbschliessen: () => void;
}) {
  const abgeschlossen = data.sdaAbgeschlossenAm !== "";

  return (
    <div className="flex flex-col" style={{ gap: "var(--space-5)" }}>
      <SectionHeader icon={FileText} label="Individuelle Präzisierungen" />
      <TextareaInput
        label="Individuelle Präzisierungen Stammdaten"
        value={data.stammdatenPraezisierungen}
        onChange={v => onUpdate("stammdatenPraezisierungen", v)}
        hint="Zusätzliche Informationen zum Bereich Stammdaten, die für Abklärung, Betreuung oder Pflege wesentlich sind."
        rows={4}
      />
      {/* Anzeige, keine zweite Eingabe — das Feld des Bereichs AA bleibt im
          Reiter Anmeldung. */}
      <div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Individuelle Präzisierungen Anmeldung</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
          {data.anmeldungPraezisierungen || "—"}
        </div>
      </div>

      <SectionHeader icon={User} label="Verantwortliche Personen" />
      <div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Bearbeitende Personen</div>
        {data.sdaBearbeitende.length === 0 ? (
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Noch niemand hat am SDA gearbeitet.</div>
        ) : (
          <div className="flex flex-col" style={{ gap: 2 }}>
            {data.sdaBearbeitende.map((e, i) => (
              <div key={i} style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                {e.benutzer} · {e.zeitpunkt}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Abschliessende Person</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
          {abgeschlossen ? `${data.sdaAbgeschlossenVon} · ${data.sdaAbgeschlossenAm}` : "—"}
        </div>
      </div>

      <SectionHeader icon={CheckCircle2} label="Abschluss" />
      {abgeschlossen ? (
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          Das SDA ist abgeschlossen. Die Angaben beschreiben den Zeitpunkt des Eintritts und sind nicht mehr änderbar; spätere Änderungen gehören in die Pflegedokumentation.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: "var(--space-3)", alignItems: "flex-start" }}>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            {abschliessbar
              ? "Mit dem Abschluss sind die Angaben der Reiter Anmeldung, Personalien, Soziales, Wohnen und Anamnese nicht mehr änderbar. Der Abschluss lässt sich nicht zurücknehmen."
              : "Der Abschluss ist möglich, sobald alle Pflichtfelder der SDA-Reiter gesetzt sind."}
          </div>
          <AppButton variant="primaer" icon={CheckCircle2} onClick={onAbschliessen} disabled={!abschliessbar}>
            SDA abschliessen
          </AppButton>
        </div>
      )}
    </div>
  );
}
