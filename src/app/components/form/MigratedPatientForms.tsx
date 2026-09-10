/**
 * Migrated form sub-components for StepPatient Tabs 1, 2, 3.
 * Uses new form components from components/form/.
 */
import { User, Users, MapPin, Shield, Phone, IdCard, Receipt, Stethoscope, Home, ClipboardList, Languages, ChevronDown, ChevronUp, CheckCircle2, FileText, Plus, X } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { FELD_MAX, katalogFeldBreite } from "./feldbreiten";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { NumberInput } from "./NumberInput";
import { AHVNummerInput } from "./AHVNummerInput";
import { SegmentedControl } from "./SegmentedControl";
import { Combobox as FormSelect } from "./Combobox";
import { AdressBlock } from "../ui/AdressBlock";
import { FormField } from "./FormField";
import { DateField } from "./DateField";
import type { PatientFormData, VorgeschichteEintrag } from "../StepPatient";
import { useCurrentUser } from "../../auth";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { getBeziehungen } from "../../../lib/beziehungen/store";
import { personName as beziehungsPersonName } from "../../../lib/beziehungen/beziehungen";
import { getAngehoerige } from "../../../lib/angehoerige/store";
import { DokumentScanUpload } from "./DokumentScanUpload";
import { KONFESSION_OPTIONS } from "../../../lib/stammdaten/konfession";
import { VersicherungenAbschnitt } from "../versicherung/VersicherungenAbschnitt";
import { BezugsteamAbschnitt } from "../beziehungen/BezugsteamAbschnitt";
import { patientFuerOnboarding } from "../../../lib/patienten/store";
import { SDA_WOHNSITUATION_OPTIONS } from "../../../lib/stammdaten/sda-wohnsituation";
import { GESCHLECHT_OPTIONS } from "../../../lib/stammdaten/geschlecht";
import { ANREDE_OPTIONS } from "../../../lib/stammdaten/anrede";
import { ZIVILSTAND_OPTIONS } from "../../../lib/stammdaten/zivilstand";
import { STAATSANGEHOERIGKEIT_OPTIONS, istSchweiz } from "../../../lib/stammdaten/staatsangehoerigkeit";
import { AUFENTHALTSSTATUS_OPTIONS } from "../../../lib/stammdaten/aufenthaltsstatus";
import { SDA_EROEFFNUNGSGRUND_OPTIONS } from "../../../lib/stammdaten/sda-eroeffnungsgrund";
import { SDA_ANMELDENDE_INSTITUTION_OPTIONS, INSTITUTION_ANDERE } from "../../../lib/stammdaten/sda-anmeldende-institution";
import { SDA_ZUSAMMENLEBEN_OPTIONS } from "../../../lib/stammdaten/sda-zusammenleben";
import { SDA_JA_NEIN_OPTIONS } from "../../../lib/stammdaten/sda-ja-nein";
import { HILFLOSENENTSCHAEDIGUNG_GRAD_OPTIONS } from "../../../lib/stammdaten/hilflosenentschaedigung";
import { Switch } from "../ui/switch";
import { SDA_SPRACHE_OPTIONS, SPRACHE_ANDERE } from "../../../lib/stammdaten/sda-sprache";
import { AppButton } from "../ui/AppButton";

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];
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
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div><FormSelect label="Anrede" value={data.anrede || null} onChange={v => onUpdate("anrede", v || "")} options={ANREDE_OPTIONS} placeholder="Anrede wählen" /></div>
        <div><FormSelect label="Geschlecht" required value={data.geschlecht || null} onChange={v => onUpdate("geschlecht", v || "")} options={GESCHLECHT_OPTIONS} placeholder="Geschlecht wählen" /></div>
        <div><TextInput label="Name" required value={data.name} onChange={v => onUpdate("name", v)} onBlur={() => onBlur("name")} placeholder="Nachname" error={t("name") && !filled(data.name) ? "Pflichtfeld" : undefined} /></div>
        <div><TextInput label="Vorname" required value={data.vorname} onChange={v => onUpdate("vorname", v)} onBlur={() => onBlur("vorname")} placeholder="Vorname" error={t("vorname") && !filled(data.vorname) ? "Pflichtfeld" : undefined} /></div>
        <div><DateField label="Geburtsdatum" required wertFormat="display" bereich="past" value={data.geburtsdatum || null} onChange={v => onUpdate("geburtsdatum", (v as string) ?? "")} onBlur={() => onBlur("geburtsdatum")} /></div>
        <div><AHVNummerInput label="AHV-Nummer" required value={data.ahvNummer} onChange={v => onUpdate("ahvNummer", v)} /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Staatsangehörigkeit" value={data.staatsangehoerigkeit || null} onChange={v => onUpdate("staatsangehoerigkeit", v || "")} options={STAATSANGEHOERIGKEIT_OPTIONS} placeholder="Staatsangehörigkeit wählen" /></div>
        {istSchweizerin && <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Heimatort" value={data.heimatort} onChange={v => onUpdate("heimatort", v)} placeholder="z.B. Bern" /></div>}
        {istAusland && (
          <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Aufenthaltsstatus" value={data.aufenthaltsstatus || null} onChange={v => onUpdate("aufenthaltsstatus", v || "")}
            options={AUFENTHALTSSTATUS_OPTIONS} placeholder="Status wählen" /></div>
        )}
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Zivilstand" value={data.zivilstand || null} onChange={v => onUpdate("zivilstand", v || "")} options={ZIVILSTAND_OPTIONS} placeholder="Zivilstand wählen" /></div>
      </div>

      {/* Erreichbarkeit steht bewusst ÜBER der Adresse: zwei kurze Felder vor dem
          grössten, aufklappbaren Abschnitt (Adresse mit Gemeinde- und Pflegeort-
          Umschaltern). */}
      <SectionHeader icon={Phone} label="Erreichbarkeit" />
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="E-Mail" value={data.email} onChange={v => onUpdate("email", v)} placeholder="name@example.com" /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Telefon (Festnetz)" value={data.telefon} onChange={v => onUpdate("telefon", v)} placeholder="+41 44 000 00 00" /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Mobil" value={data.mobil} onChange={v => onUpdate("mobil", v)} placeholder="+41 79 000 00 00" /></div>
      </div>

      <SectionHeader icon={MapPin} label="Adresse" />
      {/* Voll-Variante: Gemeinde, BFS-Nummer und Kanton gehören zum Patienten und
          stehen im Block; die Adresssuche löst sie mit auf. */}
      <AdressBlock
        required
        variante="voll"
        wert={{
          strasse: data.adresseStrasse, plz: data.adressePlz, ort: data.adresseOrt,
          land: data.land, gemeinde: data.gemeinde, bfsNummer: data.bfsNummer, kanton: data.kanton,
        }}
        onChange={patch => {
          const p: Partial<PatientFormData> = {};
          if (patch.strasse !== undefined) p.adresseStrasse = patch.strasse;
          if (patch.plz !== undefined) p.adressePlz = patch.plz;
          if (patch.ort !== undefined) p.adresseOrt = patch.ort;
          if (patch.land !== undefined) p.land = patch.land;
          if (patch.gemeinde !== undefined) p.gemeinde = patch.gemeinde;
          if (patch.bfsNummer !== undefined) p.bfsNummer = patch.bfsNummer;
          if (patch.kanton !== undefined) p.kanton = patch.kanton;
          if (onUpdateMehrere) onUpdateMehrere(p);
          else Object.entries(p).forEach(([k, v]) => onUpdate(k as keyof PatientFormData, v as string));
        }}
        onBlur={feld => onBlur(feld === "strasse" ? "adresseStrasse" : feld === "plz" ? "adressePlz" : "adresseOrt")}
        fehler={{
          strasse: t("adresseStrasse") && !filled(data.adresseStrasse) ? "Pflichtfeld" : undefined,
          ort: t("adresseOrt") && !filled(data.adresseOrt) ? "Pflichtfeld" : undefined,
        }}
      />

      <div style={{ marginTop: "var(--space-4)" }}>
        {/* Muster K (Lauf 1c): unter 1024px eine Zeile — Frage links, Schalter
            rechts, der erklärende Satz gedämpft darunter. Vorgabe aus = Pflege
            an der Wohnadresse. Desktop behält die zwei Pillen unverändert. */}
        <div className="hidden lg:block">
          <SegmentedControl label="Pflegeort" value={data.pflegeortAbweichend ? "abweichend" : "gleich"}
            onChange={v => onUpdateMehrere?.({ pflegeortAbweichend: v === "abweichend" })}
            options={[
              { value: "gleich", label: "Pflege findet an dieser Adresse statt" },
              { value: "abweichend", label: "Pflege findet an einer anderen Adresse statt" },
            ]} />
        </div>
        <div className="lg:hidden m1-schalterzeile" data-pflegeort-zeile>
          {/* Frage links, der erklärende Satz gedämpft DARUNTER (nicht im
              Bedienelement); der Schalter rechts, vertikal zentriert. */}
          <div style={{ minWidth: 0 }}>
            <label htmlFor="pflegeort-schalter" style={{ display: "block", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", cursor: "pointer", lineHeight: 1.3 }}>
              Pflege an einer anderen Adresse
            </label>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2, lineHeight: 1.3 }}>
              Wohnsitz bleibt für die Restkosten massgebend
            </div>
          </div>
          <Switch id="pflegeort-schalter" className="m1-schalter" checked={data.pflegeortAbweichend} onCheckedChange={c => onUpdateMehrere?.({ pflegeortAbweichend: c })} />
        </div>
      </div>
      {data.pflegeortAbweichend && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <SectionHeader icon={MapPin} label="Pflegeort" />
          {/* Voll-Variante auch hier: der Einsatz findet an diesem Ort statt, darum
              Gemeinde, BFS-Nummer und Kanton. Ohne Hinweistext — der Restkosten-Satz
              gilt am Wohnsitz, nicht hier. */}
          <AdressBlock idPrefix="pflegeort"
            variante="voll"
            gemeindeHinweis=""
            wert={{
              strasse: data.pflegeortStrasse, plz: data.pflegeortPlz, ort: data.pflegeortOrt,
              land: data.pflegeortLand, gemeinde: data.pflegeortGemeinde,
              bfsNummer: data.pflegeortBfsNummer, kanton: data.pflegeortKanton,
            }}
            onChange={patch => {
              const p: Partial<PatientFormData> = {};
              if (patch.strasse !== undefined) p.pflegeortStrasse = patch.strasse;
              if (patch.plz !== undefined) p.pflegeortPlz = patch.plz;
              if (patch.ort !== undefined) p.pflegeortOrt = patch.ort;
              if (patch.land !== undefined) p.pflegeortLand = patch.land;
              if (patch.gemeinde !== undefined) p.pflegeortGemeinde = patch.gemeinde;
              if (patch.bfsNummer !== undefined) p.pflegeortBfsNummer = patch.bfsNummer;
              if (patch.kanton !== undefined) p.pflegeortKanton = patch.kanton;
              if (onUpdateMehrere) onUpdateMehrere(p);
              else Object.entries(p).forEach(([k, v]) => onUpdate(k as keyof PatientFormData, v as string));
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
export function TabSteuerV2({ data, touched, onUpdate, onUpdateMehrere, onBlur, onboardingId, onNavigate }: TabProps & { onboardingId?: string; onNavigate?: (reiter: string) => void }) {
  // Bezeichnete Person aus dem Bezugsteam (Merkmal an der Beziehung) — nur lesend.
  const vorsorgePatientId = onboardingId ? patientFuerOnboarding(onboardingId)?.id : undefined;
  const bezeichnete = vorsorgePatientId
    ? getBeziehungen(vorsorgePatientId).filter(b => b.inPatientenverfuegungBezeichnet)
    : [];
  const angehoerigeListe = getAngehoerige();
  const bezeichneteNamen = bezeichnete.map(b =>
    beziehungsPersonName(b, k => { const a = angehoerigeListe.find(x => x.id === k); return a ? `${a.vorname} ${a.nachname}` : k; }, k => k));
  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={IdCard} label="IV & Sozialversicherung" first />
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <SegmentedControl label="IV-Bezug?" required value={data.ivBezug} onChange={v => onUpdate("ivBezug", v)} options={JA_NEIN} />
        {/* Nachbarzelle derselben Rasterzeile — auf gleicher Höhe wie die Frage */}
        {data.ivBezug === "ja" && (
          <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="IV-Bezug" required value={data.ivBezugProzent} onChange={v => onUpdate("ivBezugProzent", v)} suffix="%" placeholder="z.B. 100" /></div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        {/* Löschregel: verlässt die Frage «ja», wird der Grad geleert —
            ein Grad ohne Bezug wäre eine stille Falschangabe. */}
        <SegmentedControl label="Hilflosenentschädigung?" required value={data.hilflosenentschaedigung} onChange={v => {
          if (v !== "ja" && onUpdateMehrere) onUpdateMehrere({ hilflosenentschaedigung: v, hilflosenentschaedigungGrad: "" });
          else onUpdate("hilflosenentschaedigung", v);
        }} options={JA_NEIN} />
        {/* Nachbarzelle derselben Rasterzeile — auf gleicher Höhe wie die Frage */}
        {data.hilflosenentschaedigung === "ja" && (
          <div style={{ maxWidth: FELD_MAX.mittel }}>
            <FormSelect label="Grad" required value={data.hilflosenentschaedigungGrad || null} onChange={v => onUpdate("hilflosenentschaedigungGrad", v || "")} options={HILFLOSENENTSCHAEDIGUNG_GRAD_OPTIONS} placeholder="Grad wählen" />
          </div>
        )}
        <SegmentedControl label="Bezieht der Patient einen IV-Assistenzbeitrag?" required value={data.assistenzbeitrag} onChange={v => onUpdate("assistenzbeitrag", v)} options={JA_NEIN} />
      </div>

      <SectionHeader icon={Users} label="Soziales" />
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
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

      {/* ── Vorsorge: zwei getrennte Instrumente nach ZGB — keine Zusammenlegung.
             Vorgabe je "unbekannt": "nein" heisst, es gibt keine; "unbekannt"
             heisst, niemand hat gefragt (für interRAI O2 beides 0). ── */}
      <SectionHeader icon={FileText} label="Vorsorge" />
      <div style={{ maxWidth: FELD_MAX.mittel }}>
        <SegmentedControl label="Patientenverfügung vorhanden" value={data.patientenverfuegungVorhanden || "unbekannt"} onChange={v => onUpdate("patientenverfuegungVorhanden", v)} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }, { value: "unbekannt", label: "Unbekannt" }]} />
      </div>
      {data.patientenverfuegungVorhanden === "ja" && (
        <>
          <div style={{ marginTop: "var(--space-3)", maxWidth: FELD_MAX.schmal }}>
            <DateField label="Datum der Verfügung" wertFormat="display" bereich="past" value={data.patientenverfuegungDatum || null} onChange={v => onUpdate("patientenverfuegungDatum", (v as string) ?? "")} hint="Steht im Dokument." />
          </div>
          <div style={{ marginTop: "var(--space-3)" }}>
            <TextareaInput label="Bemerkung" required value={data.patientenverfuegungBemerkung} onChange={v => onUpdate("patientenverfuegungBemerkung", v)} placeholder="z.B. Notfallmappe im Küchenschrank, Kopie bei Tochter Vera, Original beim Hausarzt" error={touched.has("patientenverfuegungBemerkung") && !data.patientenverfuegungBemerkung.trim() ? "Pflichtfeld — wo liegt die Verfügung?" : undefined} onBlur={() => onBlur("patientenverfuegungBemerkung")} />
          </div>
          <div style={{ marginTop: "var(--space-3)" }}>
            <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: 6 }}>Dokument (optional)</div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <DokumentScanUpload scanKey="patientenverfuegung" docLabel="Patientenverfügung" onFile={() => {}} />
            </div>
          </div>
          {/* Verweis — kein Hinweisstreifen, keine Warnung: eine Verfügung muss keine Person bezeichnen. */}
          <div style={{ marginTop: "var(--space-3)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            {bezeichneteNamen.length > 0
              ? <>Bezeichnete Person: <span style={{ color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{bezeichneteNamen.join(", ")}</span>{" "}</>
              : <>Keine bezeichnete Person erfasst. Sie wird im Bezugs- und Pflegeteam gesetzt.{" "}</>}
            <button type="button" onClick={() => onNavigate?.("personalien")} className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}>
              Zum Bezugs- und Pflegeteam
            </button>
          </div>
        </>
      )}

      <div style={{ marginTop: "var(--space-4)", maxWidth: FELD_MAX.mittel }}>
        <SegmentedControl label="Vorsorgeauftrag vorhanden" value={data.vorsorgeauftragVorhanden || "unbekannt"} onChange={v => onUpdate("vorsorgeauftragVorhanden", v)} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }, { value: "unbekannt", label: "Unbekannt" }]} />
      </div>
      {data.vorsorgeauftragVorhanden === "ja" && (
        <>
          <div style={{ marginTop: "var(--space-3)", maxWidth: FELD_MAX.mittel }}>
            <SegmentedControl label="Durch die KESB validiert" value={data.vorsorgeauftragValidiert || "unbekannt"} onChange={v => onUpdate("vorsorgeauftragValidiert", v)} options={[{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }, { value: "unbekannt", label: "Unbekannt" }]} hint="Ein Vorsorgeauftrag entfaltet erst Wirkung, wenn ihn die KESB validiert hat." />
          </div>
          <div style={{ marginTop: "var(--space-3)" }}>
            <TextareaInput label="Bemerkung" required value={data.vorsorgeauftragBemerkung} onChange={v => onUpdate("vorsorgeauftragBemerkung", v)} placeholder="z.B. öffentlich beurkundet bei Notariat Müller, Kopie im Dossier" error={touched.has("vorsorgeauftragBemerkung") && !data.vorsorgeauftragBemerkung.trim() ? "Pflichtfeld — wo liegt der Auftrag?" : undefined} onBlur={() => onBlur("vorsorgeauftragBemerkung")} />
          </div>
        </>
      )}
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
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", alignItems: "start" }}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div><TextInput label="Etage" steuerelementMaxBreite={FELD_MAX.schmal} value={data.etage} onChange={v => onUpdate("etage", v)} placeholder="z.B. 2. OG" /></div>
        <SegmentedControl label="Lift vorhanden" value={data.liftVorhanden} onChange={v => onUpdate("liftVorhanden", v)} options={JA_NEIN} />
        <SegmentedControl label="Treppen" value={data.treppen} onChange={v => onUpdate("treppen", v)} options={JA_NEIN} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 3: ANAMNESE — Situation und Vorgeschichte
   ══════════════════════════════════════════ */

/** Zwölf-Monats-Grenze für den Überprüfungshinweis, gemessen an der Mock-Gegenwart. */
function aelterAlsZwoelfMonate(iso: string): boolean {
  if (!iso) return false;
  const grenze = new Date(GEGENWART_ISO + "T00:00:00");
  grenze.setFullYear(grenze.getFullYear() - 1);
  return new Date(iso + "T00:00:00") < grenze;
}

function datumAnzeige(iso: string): string {
  const [j, m, t] = iso.split("-");
  return j && m && t ? `${t}.${m}.${j}` : iso;
}

/** Bearbeitungsstand eines Blocks (Autor · Datum) mit Überprüfungshinweis ab
 *  zwölf Monaten. Der Hinweis informiert nur — er sperrt nichts. */
function BearbeitungsStand({ von, am }: { von: string; am: string }) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
        {am ? <>Bearbeitungsstand: {von} · {datumAnzeige(am)}</> : "Noch nicht bearbeitet"}
      </div>
      {aelterAlsZwoelfMonate(am) && (
        <div style={{ marginTop: "var(--space-2)", padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
          Dieser Block wurde seit über zwölf Monaten nicht bearbeitet — bitte prüfen, ob die Angaben noch aktuell sind.
        </div>
      )}
    </div>
  );
}

/** Zeilenliste der Vorgeschichte (Bezeichnung + Zeitangabe, ergänzbar und
 *  entfernbar). Freitext ohne Codes — bewusst keine Diagnose-Objekte. */
function VorgeschichteListe({ eintraege, zeitLabel, bezeichnungPlatzhalter, zeitPlatzhalter, erfassenText, weitereText, onChange }: {
  eintraege: VorgeschichteEintrag[];
  zeitLabel: string;
  bezeichnungPlatzhalter: string;
  zeitPlatzhalter: string;
  erfassenText: string;
  weitereText: string;
  onChange: (neu: VorgeschichteEintrag[]) => void;
}) {
  const zeileAendern = (id: string, feld: "bezeichnung" | "zeitangabe", wert: string) =>
    onChange(eintraege.map(e => e.id === id ? { ...e, [feld]: wert } : e));

  return (
    <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
      {eintraege.length === 0 && (
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Keine Einträge erfasst.</div>
      )}
      {eintraege.map(e => (
        <div key={e.id} className="flex items-end" style={{ gap: "var(--space-3)" }}>
          <div style={{ flex: 1 }}>
            <TextInput label="Bezeichnung" value={e.bezeichnung} onChange={v => zeileAendern(e.id, "bezeichnung", v)} placeholder={bezeichnungPlatzhalter} />
          </div>
          <div style={{ width: 180, flexShrink: 0 }}>
            <TextInput label={zeitLabel} value={e.zeitangabe} onChange={v => zeileAendern(e.id, "zeitangabe", v)} placeholder={zeitPlatzhalter} />
          </div>
          <button
            type="button"
            aria-label={e.bezeichnung ? `Eintrag entfernen: ${e.bezeichnung}` : "Eintrag entfernen"}
            onClick={() => onChange(eintraege.filter(x => x.id !== e.id))}
            className="inline-flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 32, height: "var(--field-height)", flexShrink: 0, color: "var(--text-tertiary)", borderRadius: "var(--radius-card)" }}
            onMouseEnter={ev => ev.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={ev => ev.currentTarget.style.color = "var(--text-tertiary)"}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={() => onChange([...eintraege, { id: crypto.randomUUID(), bezeichnung: "", zeitangabe: "" }])}
          className="inline-flex items-center cursor-pointer transition-colors"
          style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
          onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-secondary)"}
          onMouseLeave={ev => ev.currentTarget.style.background = "var(--bg-elevated)"}
        >
          <Plus style={{ width: 14, height: 14 }} /> {eintraege.length === 0 ? erfassenText : weitereText}
        </button>
      </div>
    </div>
  );
}

/**
 * Zwei erzählende Blöcke mit je eigenem Bearbeitungsstand. Die früheren
 * Einzel-Items sind entfallen: Körpermasse führen die Vitalzeichen, die
 * interRAI-Items (Brille, Hörgerät, Gewichtsverlust, Sturz, Stimmung) die
 * Bedarfsabklärung. BB11 (Spitalaufenthalt) lebt im Registrierungsformular.
 */
export function TabAnamneseV2({ data, onUpdateMehrere }: TabProps) {
  const benutzer = useCurrentUser();
  const kuerzel = `${benutzer.vorname.charAt(0)}. ${benutzer.name}`;
  // Jede Änderung stempelt ihren Block neu — der Bearbeitungsstand ist der
  // jeweils letzte Schreibzugriff, nicht ein eigener Bestätigen-Schritt.
  const situationAendern = (patch: Partial<PatientFormData>) =>
    onUpdateMehrere?.({ ...patch, situationBearbeitetVon: kuerzel, situationBearbeitetAm: GEGENWART_ISO });
  const vorgeschichteAendern = (patch: Partial<PatientFormData>) =>
    onUpdateMehrere?.({ ...patch, vorgeschichteBearbeitetVon: kuerzel, vorgeschichteBearbeitetAm: GEGENWART_ISO });

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      {/* Block 1 — Situation */}
      <SectionHeader icon={Home} label="Situation" first />
      <BearbeitungsStand von={data.situationBearbeitetVon} am={data.situationBearbeitetAm} />
      <div className="flex flex-col" style={{ gap: "var(--space-4)" }}>
        <TextareaInput label="Häusliche Situation" value={data.situationHaeuslich} onChange={v => situationAendern({ situationHaeuslich: v })} placeholder="Wohnverhältnisse, Unterstützung im Alltag, Hilfsmittel zu Hause" />
        <TextareaInput label="Soziale Situation" value={data.situationSozial} onChange={v => situationAendern({ situationSozial: v })} placeholder="Familie, Bezugspersonen, Kontakte, Tagesstruktur" />
        <TextareaInput label="Ressourcen" value={data.situationRessourcen} onChange={v => situationAendern({ situationRessourcen: v })} placeholder="Was die Klientin oder der Klient selbst kann und was im Alltag trägt" />
        <TextareaInput label="Sonstiges" value={data.situationSonstiges} onChange={v => situationAendern({ situationSonstiges: v })} placeholder="Weitere Beobachtungen zur Situation" />
      </div>

      {/* Block 2 — Vorgeschichte */}
      <SectionHeader icon={Stethoscope} label="Vorgeschichte" />
      <BearbeitungsStand von={data.vorgeschichteBearbeitetVon} am={data.vorgeschichteBearbeitetAm} />

      <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>Chronische Erkrankungen</div>
      <VorgeschichteListe
        eintraege={data.chronischeErkrankungenListe}
        zeitLabel="Zeitangabe"
        bezeichnungPlatzhalter="z.B. Arterielle Hypertonie"
        zeitPlatzhalter="z.B. seit 2018"
        erfassenText="Erkrankung erfassen"
        weitereText="Weitere Erkrankung hinzufügen"
        onChange={liste => vorgeschichteAendern({ chronischeErkrankungenListe: liste })}
      />

      <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginTop: "var(--space-6)", marginBottom: "var(--space-3)" }}>Operationen und Eingriffe</div>
      <VorgeschichteListe
        eintraege={data.operationenListe}
        zeitLabel="Jahr"
        bezeichnungPlatzhalter="z.B. Hüft-Totalprothese rechts"
        zeitPlatzhalter="z.B. 2019"
        erfassenText="Eingriff erfassen"
        weitereText="Weiteren Eingriff hinzufügen"
        onChange={liste => vorgeschichteAendern({ operationenListe: liste })}
      />

      <div style={{ marginTop: "var(--space-6)" }}>
        <TextareaInput label="Krankheitsverlauf" value={data.krankheitsverlauf} onChange={v => vorgeschichteAendern({ krankheitsverlauf: v })} placeholder="Verlauf der Erkrankungen, wichtige Ereignisse, aktuelle Entwicklung" />
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
