/**
 * Migrated form sub-components for StepPatient Tabs 1, 2, 3.
 * Uses new form components from components/form/.
 */
import { useState } from "react";
import { User, Users, MapPin, Shield, Phone, IdCard, HeartPulse, Receipt, Stethoscope, Home, ClipboardList, Languages, ChevronDown, ChevronUp, CheckCircle2, FileText } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { FELD_MAX, katalogFeldBreite } from "./feldbreiten";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { NumberInput } from "./NumberInput";
import { AHVNummerInput } from "./AHVNummerInput";
import { SegmentedControl } from "./SegmentedControl";
import { Combobox as FormSelect } from "./Combobox";
import { AdressFelder } from "../ui/AdressFelder";
import { KANTON_OPTIONS } from "../../../lib/stammdaten/kantone";
import { FormField } from "./FormField";
import { DateField } from "./DateField";
import type { PatientFormData } from "../StepPatient";
import { toast } from "sonner";
import { leseVorgemapptesFeld, schreibeVorgemapptesFeld } from "../../../lib/interrai/vormapping";
import { KONFESSION_OPTIONS } from "../../../lib/stammdaten/konfession";
import { VersicherungenAbschnitt } from "../versicherung/VersicherungenAbschnitt";
import { BezugsteamAbschnitt } from "../beziehungen/BezugsteamAbschnitt";
import { patientFuerOnboarding } from "../../../lib/patienten/store";
import { SDA_WOHNSITUATION_OPTIONS } from "../../../lib/stammdaten/sda-wohnsituation";
import { SDA_SPITALAUFENTHALT_OPTIONS } from "../../../lib/stammdaten/sda-spitalaufenthalt";
import { GESCHLECHT_OPTIONS } from "../../../lib/stammdaten/geschlecht";
import { ANREDE_OPTIONS } from "../../../lib/stammdaten/anrede";
import { ZIVILSTAND_OPTIONS } from "../../../lib/stammdaten/zivilstand";
import { STAATSANGEHOERIGKEIT_OPTIONS, istSchweiz } from "../../../lib/stammdaten/staatsangehoerigkeit";
import { AUFENTHALTSSTATUS_OPTIONS } from "../../../lib/stammdaten/aufenthaltsstatus";
import { SDA_EROEFFNUNGSGRUND_OPTIONS } from "../../../lib/stammdaten/sda-eroeffnungsgrund";
import { SDA_ANMELDENDE_INSTITUTION_OPTIONS, INSTITUTION_ANDERE } from "../../../lib/stammdaten/sda-anmeldende-institution";
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
// TabAnmeldungV2 entfernt (§6): der Anmeldung-Reiter ist ein Statusblock, die
// AA-/BB16-/BB17-Felder leben im Registrierungsformular (SDA).

/* ══════════════════════════════════════════
   TAB 1: PERSONALIEN (migrated)
   ══════════════════════════════════════════ */
export function TabPersonalienV2({ data, touched, onUpdate, onUpdateMehrere, onBlur, onboardingId }: TabProps & { onboardingId?: string }) {
  const t = (f: string) => touched.has(f);
  const istSchweizerin = istSchweiz(data.staatsangehoerigkeit);
  // Versicherungen hängen am Patienten, nicht am Formular — Patient über das
  // Onboarding auflösen (wird von OnboardingPage fortlaufend angelegt).
  const patientId = onboardingId ? patientFuerOnboarding(onboardingId)?.id : undefined;
  const istAusland = filled(data.staatsangehoerigkeit) && !istSchweizerin;
  const istAndereSprache = data.spracheCode === SPRACHE_ANDERE;
  const bSprache = katalogFeldBreite(SDA_SPRACHE_OPTIONS);
  const bUebersetzer = katalogFeldBreite(SDA_JA_NEIN_OPTIONS);

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={User} label="Identität" first />
      {/* Durchgängig zwei Felder pro Zeile; Anrede vor dem Namen. */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div><FormSelect label="Anrede" value={data.anrede || null} onChange={v => onUpdate("anrede", v || "")} options={ANREDE_OPTIONS} placeholder="Anrede wählen" /></div>
        <div><FormSelect label="Geschlecht" required value={data.geschlecht || null} onChange={v => onUpdate("geschlecht", v || "")} options={GESCHLECHT_OPTIONS} placeholder="Geschlecht wählen" /></div>
        <div><TextInput label="Name" required value={data.name} onChange={v => onUpdate("name", v)} onBlur={() => onBlur("name")} placeholder="Nachname" error={t("name") && !filled(data.name) ? "Pflichtfeld" : undefined} /></div>
        <div><TextInput label="Vorname" required value={data.vorname} onChange={v => onUpdate("vorname", v)} onBlur={() => onBlur("vorname")} placeholder="Vorname" error={t("vorname") && !filled(data.vorname) ? "Pflichtfeld" : undefined} /></div>
        <div><DateField label="Geburtsdatum" required wertFormat="display" bereich="past" value={data.geburtsdatum || null} onChange={v => onUpdate("geburtsdatum", (v as string) ?? "")} onBlur={() => onBlur("geburtsdatum")} /></div>
        <div><AHVNummerInput label="AHV-Nummer" required value={data.ahvNummer} onChange={v => onUpdate("ahvNummer", v)} /></div>
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

      <SectionHeader icon={MapPin} label="Wohnsitzadresse" />
      <AdressFelder
        required
        wert={{ strasse: data.adresseStrasse, plz: data.adressePlz, ort: data.adresseOrt }}
        onChange={patch => {
          if (patch.strasse !== undefined) onUpdate("adresseStrasse", patch.strasse);
          if (patch.plz !== undefined) onUpdate("adressePlz", patch.plz);
          if (patch.ort !== undefined) onUpdate("adresseOrt", patch.ort);
        }}
        fehler={{
          strasse: t("adresseStrasse") && !filled(data.adresseStrasse) ? "Pflichtfeld" : undefined,
          ort: t("adresseOrt") && !filled(data.adresseOrt) ? "Pflichtfeld" : undefined,
        }}
      />
      <div style={{ marginTop: "var(--space-3)" }}>
        <SegmentedControl label="Politische Gemeinde" value={data.gemeindeAbweichend ? "abweichend" : "gleich"}
          onChange={v => onUpdateMehrere?.({ gemeindeAbweichend: v === "abweichend" })}
          options={[
            { value: "gleich", label: "Politische Gemeinde entspricht dem Ort" },
            { value: "abweichend", label: "Politische Gemeinde weicht ab" },
          ]} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-3)" }}>
        {data.gemeindeAbweichend && (
          <TextInput label="Politische Gemeinde" value={data.gemeinde} onChange={v => onUpdate("gemeinde", v)} placeholder="z.B. Illnau-Effretikon" />
        )}
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="BFS-Nummer" value={data.bfsNummer} onChange={v => onUpdate("bfsNummer", v.replace(/\D/g, ""))} placeholder="optional" /></div>
        <FormSelect label="Kanton" value={data.kanton || null} onChange={v => onUpdate("kanton", v || "")} options={KANTON_OPTIONS} placeholder="Kanton wählen" />
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Land" value={data.land} onChange={v => onUpdate("land", v)} placeholder="CH" /></div>
      </div>
      <div style={{ marginTop: "var(--space-2)", fontSize: 12, color: "var(--text-tertiary)" }}>
        Bestimmt den Restkostensatz und den Empfänger der Restkostenrechnung.
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Pflegeort" value={data.pflegeortAbweichend ? "abweichend" : "gleich"}
          onChange={v => onUpdateMehrere?.({ pflegeortAbweichend: v === "abweichend" })}
          options={[
            { value: "gleich", label: "Pflege findet an dieser Adresse statt" },
            { value: "abweichend", label: "Pflege findet an einer anderen Adresse statt" },
          ]} />
      </div>
      {data.pflegeortAbweichend && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <SectionHeader icon={MapPin} label="Pflegeort" />
          <AdressFelder idPrefix="pflegeort"
            wert={{ strasse: data.pflegeortStrasse, plz: data.pflegeortPlz, ort: data.pflegeortOrt }}
            onChange={patch => {
              if (patch.strasse !== undefined) onUpdate("pflegeortStrasse", patch.strasse);
              if (patch.plz !== undefined) onUpdate("pflegeortPlz", patch.plz);
              if (patch.ort !== undefined) onUpdate("pflegeortOrt", patch.ort);
            }} />
        </div>
      )}

      <SectionHeader icon={Shield} label="Versicherungen" />
      <div style={{ marginBottom: "var(--space-5)" }}>
        {patientId
          ? <VersicherungenAbschnitt patientId={patientId} />
          : <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Versicherungen lassen sich erfassen, sobald die Personalien angelegt sind.</div>}
      </div>

      <SectionHeader icon={Users} label="Bezugs- und Pflegeteam" />
      <div style={{ marginBottom: "var(--space-5)" }}>
        {patientId
          ? <BezugsteamAbschnitt patientId={patientId} />
          : <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Personen lassen sich erfassen, sobald die Personalien angelegt sind.</div>}
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

      {/* Notfallkontakt ist ein Merkmal einer Beziehung, kein eigener Block —
          erfasst im Abschnitt Bezugs- und Pflegeteam oben. */}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 2: STEUER & SOZIALVERSICHERUNGEN (migrated)
   ══════════════════════════════════════════ */
export function TabSteuerV2({ data, touched, onUpdate, onBlur }: TabProps) {
  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={IdCard} label="IV & Sozialversicherung" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <SegmentedControl label="IV-Bezug?" required value={data.ivBezug} onChange={v => onUpdate("ivBezug", v)} options={JA_NEIN} />
      </div>
      {data.ivBezug === "ja" && (
        <div style={{ marginTop: "var(--space-4)", marginLeft: "var(--space-4)" }}>
          <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="IV-Bezug" required value={data.ivBezugProzent} onChange={v => onUpdate("ivBezugProzent", v)} suffix="%" placeholder="z.B. 100" /></div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <SegmentedControl label="Hilflosenentschädigung?" required value={data.hilflosenentschaedigung} onChange={v => onUpdate("hilflosenentschaedigung", v)} options={JA_NEIN} />
        <SegmentedControl label="Bezieht der Patient einen IV-Assistenzbeitrag?" required value={data.assistenzbeitrag} onChange={v => onUpdate("assistenzbeitrag", v)} options={JA_NEIN} />
      </div>

      <SectionHeader icon={Users} label="Soziales" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <SegmentedControl label="Sozialamt involviert?" required value={data.sozialamtInvolviert} onChange={v => onUpdate("sozialamtInvolviert", v)} options={JA_NEIN} />
        <SegmentedControl label="Gesetzliche Vertretung besteht?" required value={data.gesetzlicheVertretung} onChange={v => onUpdate("gesetzlicheVertretung", v)} options={JA_NEIN} />
      </div>
      <div style={{ marginTop: "var(--space-2)", fontSize: 12, color: "var(--text-tertiary)" }}>
        Die Kontaktperson des Sozialdiensts bzw. die vertretende Person (Beistand) werden im Abschnitt Bezugs- und Pflegeteam (Reiter Personalien) erfasst.
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
export function TabWohnenUmfeldV2({ data, touched, onUpdate }: TabProps) {
  const t = (f: string) => touched.has(f);
  const bWohnsituation = katalogFeldBreite(SDA_WOHNSITUATION_OPTIONS);
  const bZusammenleben = katalogFeldBreite(SDA_ZUSAMMENLEBEN_OPTIONS);

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Home} label="Wohnsituation" first />
      {/* Wohnsituation und Form des Zusammenlebens nebeneinander; Personen im
          Haushalt unter der Wohnsituation. Neu zusammenlebend und die Wohn-
          Vorgeschichte sind ins Registrierungsformular herausgelöst. */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", alignItems: "start" }}>
        <div className="flex flex-col" style={{ rowGap: "var(--space-3)" }}>
          <div style={bWohnsituation.zelle}>
            <FormSelect label="Wohnsituation zur Zeit der Abklärung" required steuerelementMaxBreite={bWohnsituation.steuerelement}
              value={data.wohnsituation || null} onChange={v => onUpdate("wohnsituation", v || "")} options={SDA_WOHNSITUATION_OPTIONS} placeholder="Bitte wählen"
              hint="Wohnort für die Zeit, in der Spitex-Leistungen bezogen werden. Weilt die Person aktuell im Spital, wird der Ort erfasst, an dem die Leistung beginnen soll."
              error={t("wohnsituation") && !filled(data.wohnsituation) ? "Pflichtfeld" : undefined} />
          </div>
          <div style={{ maxWidth: FELD_MAX.schmal }}>
            <FormSelect label="Personen im Haushalt" value={data.personenImHaushalt || null} onChange={v => onUpdate("personenImHaushalt", v || "")} options={PERSONEN} placeholder="Wählen" hint="Inklusive Patient" />
          </div>
        </div>
        <div style={bZusammenleben.zelle}>
          <FormSelect label="Form des Zusammenlebens" required steuerelementMaxBreite={bZusammenleben.steuerelement}
            value={data.formZusammenleben || null} onChange={v => onUpdate("formZusammenleben", v || "")} options={SDA_ZUSAMMENLEBEN_OPTIONS} placeholder="Bitte wählen"
            hint="Massgebend ist die Situation für die Dauer der Abklärung. Vorübergehende Rahmenbedingungen zählen nicht — etwa wenn die Tochter nur bleibt, bis die Spitex-Leistung angelaufen ist."
            error={t("formZusammenleben") && !filled(data.formZusammenleben) ? "Pflichtfeld" : undefined} />
        </div>
      </div>

      <SectionHeader icon={Home} label="Ergänzende Angaben zum Zugang" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div><TextInput label="Etage" steuerelementMaxBreite={FELD_MAX.schmal} value={data.etage} onChange={v => onUpdate("etage", v)} placeholder="z.B. 2. OG" /></div>
        <SegmentedControl label="Lift vorhanden" value={data.liftVorhanden} onChange={v => onUpdate("liftVorhanden", v)} options={JA_NEIN} />
        <SegmentedControl label="Treppen" value={data.treppen} onChange={v => onUpdate("treppen", v)} options={JA_NEIN} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 3: ANAMNESE (migrated)
   ══════════════════════════════════════════ */
export function TabAnamneseV2({ data, touched, onUpdate, onBlur, onboardingId }: TabProps & { onboardingId?: string }) {
  const t = (f: string) => touched.has(f);
  const [, forceAnamnese] = useState(0);
  // BB11 spitalaufenthalte ist vorgemappt (iA13) → Wert aus dem Registrierungs-
  // formular; Schreiben legt es bei Bedarf an (§2). Ohne Onboarding kein Ziel.
  const spital = onboardingId ? String(leseVorgemapptesFeld(onboardingId, "spitalaufenthalte") ?? "") : "";
  const setSpital = (v: string) => {
    if (!onboardingId) return;
    try { schreibeVorgemapptesFeld(onboardingId, "spitalaufenthalte", v); forceAnamnese((n) => n + 1); }
    catch (e) { toast(e instanceof Error ? e.message : "Nicht speicherbar"); }
  };

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
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Zeit seit dem letzten Spitalaufenthalt" value={spital || null} onChange={v => setSpital(v || "")} options={SDA_SPITALAUFENTHALT_OPTIONS} placeholder="Bitte wählen" /></div>
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
        {/* BB8 Behandlungsziel (behandlungszielFokus) ins Registrierungsformular herausgelöst. */}
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
// TabAbschlussV2 entfernt (§6): der Abschluss-Reiter ist ein Statusblock; der
// SDA-Abschluss geschieht durch Sperren des Registrierungsformulars (gesperrtVon
// / gesperrtAm ersetzen das frühere Protokoll).
