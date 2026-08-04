/**
 * Migrated form sub-components for StepAngehoeriger Tabs 1, 2, 5.
 * Uses new form components from components/form/.
 * Form logic (state, validation, conditional fields) unchanged.
 */
import { useState } from "react";
import { User, Mail, Shield, Receipt, Briefcase, CreditCard, Info, Download, AlertTriangle } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TextInput } from "./TextInput";
import { DateField } from "./DateField";
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
import { GESCHLECHT_OPTIONS } from "../../../lib/stammdaten/geschlecht";
import { STAATSANGEHOERIGKEIT_OPTIONS, istSchweiz } from "../../../lib/stammdaten/staatsangehoerigkeit";
import { AUFENTHALTSSTATUS_OPTIONS, STATUS_B } from "../../../lib/stammdaten/aufenthaltsstatus";
import { FELD_MAX } from "./feldbreiten";
import { leiteTarifcodeAb } from "../../../lib/stammdaten/quellensteuer-tarif";
import { formDataToSEM, erstelleSEMFormular, ermittleFehlendeFelderSEM, downloadBlob } from "../../../lib/sem/meldeformular";
import { FUNKTIONEN_OPTIONS } from "../../../lib/stammdaten/funktionen";
import { DEUTSCH_NIVEAU_OPTIONS } from "../../../lib/stammdaten/sprachkenntnisse";
import { FIRMEN_DEFAULT_FERIENWOCHEN, berechneFerienzuschlagProzent, pruefeFerienMinimum } from "../../../lib/stammdaten/ferien";
// BVG-Schwellen-Logik entfernt: bvg_anbindung_gewuenscht wird immer angezeigt (im Externe-Anstellung-Block)

function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];

/** Qualifikationsstufen — gleiche Werte wie Qualifikation-Typ in angehoerigeData.ts */
const QUALIFIKATION_OPTIONS = [
  { value: "ohne_srk", label: "ohne SRK" },
  { value: "srk", label: "SRK" },
  { value: "fage_dipl", label: "FaGe / Dipl" },
];


// Zivilstand aus shared stammdaten

// SP-01: Konfession aus shared stammdaten (ersetzt die alte lokale Liste)

const QS_TARIF = [
  { value: "A", label: "A – Alleinstehend" }, { value: "B", label: "B – Verheiratet" },
  { value: "C", label: "C – Doppelverdiener" }, { value: "H", label: "H – Alleinerziehend" },
];

// Funktionen aus shared stammdaten (ersetzt lokale Liste)
const FUNKTIONEN = FUNKTIONEN_OPTIONS;

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

  const isSwiss = istSchweiz(data.nationalitaet);
  const isNatSelected = filled(data.nationalitaet);
  const showAufenthalt = isNatSelected && !isSwiss;

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      {/* Identität */}
      <SectionHeader icon={User} label="Identität" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Name" required value={data.name} onChange={v => set("name", v)} onBlur={() => touch("name")} placeholder="Nachname" error={touched.name && !filled(data.name) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Vorname" required value={data.vorname} onChange={v => set("vorname", v)} onBlur={() => touch("vorname")} placeholder="Vorname" error={touched.vorname && !filled(data.vorname) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><FormSelect label="Geschlecht" required value={data.geschlecht || null} onChange={v => { set("geschlecht", v || ""); touch("geschlecht"); }} options={GESCHLECHT_OPTIONS} placeholder="Geschlecht wählen" error={touched.geschlecht && !filled(data.geschlecht) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Geburtsdatum" required wertFormat="display" bereich="past" value={data.geburtsdatum || null} onChange={v => set("geburtsdatum", (v as string) ?? "")} onBlur={() => touch("geburtsdatum")} /></div>
      </div>
      <div style={{ marginTop: "var(--space-4)", maxWidth: FELD_MAX.mittel }}>
        <AHVNummerInput label="AHV-Nummer" required value={data.ahvNummer} onChange={v => set("ahvNummer", v)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><Combobox label="Staatsangehörigkeit" required value={data.nationalitaet || null} onChange={v => {
          touch("nationalitaet");
          // Schweizer Bürgerrecht: Heimatort statt Aufenthaltsstatus — und umgekehrt.
          if (istSchweiz(v || "")) onChange({ ...data, nationalitaet: v || "", aufenthaltsstatus: "" });
          else onChange({ ...data, nationalitaet: v || "", heimatort: "", aufenthaltsstatus: "" });
        }} options={STAATSANGEHOERIGKEIT_OPTIONS} placeholder="Staatsangehörigkeit wählen" error={touched.nationalitaet && !filled(data.nationalitaet) ? "Pflichtfeld" : undefined} /></div>

        {isSwiss && (
          <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Heimatort" required value={data.heimatort} onChange={v => set("heimatort", v)} onBlur={() => touch("heimatort")} placeholder="z.B. Zürich" error={touched.heimatort && !filled(data.heimatort) ? "Pflichtfeld" : undefined} /></div>
        )}
        {showAufenthalt && (
          <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Aufenthaltsstatus" required value={data.aufenthaltsstatus || null} onChange={v => {
            onChange({ ...data, aufenthaltsstatus: v || "", spezialbewilligungStatus: v === STATUS_B ? "ausstehend" : "nicht_erforderlich", spezialbewilligungDokument: v === STATUS_B ? data.spezialbewilligungDokument : null, spezialbewilligungEinreichungsDatum: v === STATUS_B ? data.spezialbewilligungEinreichungsDatum : "" });
            touch("aufenthaltsstatus");
          }} options={AUFENTHALTSSTATUS_OPTIONS} placeholder="Status wählen" error={touched.aufenthaltsstatus && !filled(data.aufenthaltsstatus) ? "Pflichtfeld" : undefined} /></div>
        )}
      </div>

      {/* Spezialbewilligung alerts remain in original StepAngehoeriger — they reference onOpenSpezialbewilligung */}

      {/* Bewilligungs-Felder: nur bei ausländischer Bewilligung (nicht CH/C) */}
      {filled(data.aufenthaltsstatus) && data.aufenthaltsstatus !== "CH" && data.aufenthaltsstatus !== "C" && (
        <div style={{ marginTop: "var(--space-4)", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
            Angaben zur Aufenthaltsbewilligung
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
            <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Einreisedatum" required wertFormat="display" bereich="past" value={data.einreisedatum || null} onChange={v => set("einreisedatum", (v as string) ?? "")} onBlur={() => touch("einreisedatum")} /></div>
            <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="ZEMIS-Nummer" required value={data.zemisNummer} onChange={v => set("zemisNummer", v)} onBlur={() => touch("zemisNummer")} placeholder="ZEMIS-Nummer" hint="Zentrales Migrationsinformationssystem" error={touched.zemisNummer && !filled(data.zemisNummer) ? "Bitte ausfüllen" : undefined} /></div>
            <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Einreichungsdatum Migrationsamt" required wertFormat="display" bereich="any" value={data.einreichungsdatumMigrationsamt || null} onChange={v => set("einreichungsdatumMigrationsamt", (v as string) ?? "")} onBlur={() => touch("einreichungsdatumMigrationsamt")} /></div>
            <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Ablaufdatum Bewilligung" wertFormat="display" bereich="any" value={data.bewilligungAblaufdatum || null} onChange={v => set("bewilligungAblaufdatum", (v as string) ?? "")} hint="Optional — bei Eingabe wird 30 Tage vor Ablauf eine Erneuerungs-Pendenz erstellt" /></div>
          </div>
        </div>
      )}

      {/* SEM-Meldeformular: bei B, S, F Meldepflicht */}
      {(data.aufenthaltsstatus === "B" || data.aufenthaltsstatus === "S" || data.aufenthaltsstatus === "F") && (
        <SEMMeldeBanner data={data} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Zivilstand" required value={data.zivilstand || null} onChange={v => set("zivilstand", v || "")} options={ZIVILSTAND_OPTIONS} placeholder="Zivilstand wählen" /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Zivilstand seit" required wertFormat="display" bereich="past" value={data.zivilstandSeit || null} onChange={v => set("zivilstandSeit", (v as string) ?? "")} onBlur={() => touch("zivilstandSeit")} /></div>
      </div>

      {/* Kontaktdaten */}
      <SectionHeader icon={Mail} label="Kontaktdaten" />
      <div style={{ marginBottom: "var(--space-5)" }}>
        <TextInput label="Strasse & Nr." required value={data.strasse} onChange={v => set("strasse", v)} onBlur={() => touch("strasse")} placeholder="Musterstrasse 12" error={touched.strasse && !filled(data.strasse) ? "Pflichtfeld" : undefined} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="PLZ" required value={data.plz} onChange={v => set("plz", v.replace(/\D/g, "").slice(0, 4))} onBlur={() => touch("plz")} placeholder="8000" /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Ort" required value={data.ort} onChange={v => set("ort", v)} onBlur={() => touch("ort")} placeholder="Zürich" error={touched.ort && !filled(data.ort) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="E-Mail" required value={data.email} onChange={v => set("email", v)} onBlur={() => touch("email")} placeholder="name@example.com" /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Telefon" required value={data.telefon} onChange={v => set("telefon", v)} onBlur={() => touch("telefon")} placeholder="+41 79 123 45 67" /></div>
      </div>

      {/* Krankenkasse (SP-02, SP-03) */}
      <SectionHeader icon={Shield} label="Krankenkasse" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        {/* SP-02: Picklist statt Freitext */}
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Krankenkasse" required value={data.krankenkasseName || null} onChange={v => { const bag = getBagNummer(v || ""); onChange({ ...data, krankenkasseName: v || "", ...(bag ? { bagNr: bag } : {}) }); touch("krankenkasseName"); }} options={KRANKENKASSEN_OPTIONS} placeholder="Krankenkasse wählen" error={touched.krankenkasseName && !filled(data.krankenkasseName) ? "Pflichtfeld" : undefined} /></div>
        {/* SP-03: Kartennummer (umbenannt von Versicherungsnummer) */}
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Kartennummer" required value={data.kartennummer} onChange={v => set("kartennummer", v)} onBlur={() => touch("kartennummer")} placeholder="Nummer auf der Versichertenkarte" error={touched.kartennummer && !filled(data.kartennummer) ? "Pflichtfeld" : undefined} /></div>
        {/* SP-03: BAG-Nr. (vorbefuellt aus Krankenkasse, manuell ueberschreibbar) */}
        <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="BAG-Nr. der Kasse" value={data.bagNr} onChange={v => set("bagNr", v)} placeholder="z.B. 0271" /></div>
      </div>

      {/* Qualifikation */}
      <SectionHeader icon={User} label="Qualifikation" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Qualifikationsstufe" required value={data.qualifikation || null} onChange={v => { set("qualifikation", v || ""); touch("qualifikation"); }} options={QUALIFIKATION_OPTIONS} placeholder="Qualifikation wählen" error={touched.qualifikation && !filled(data.qualifikation) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Deutschkenntnisse" required value={data.deutschNiveau || null} onChange={v => { set("deutschNiveau", v || ""); touch("deutschNiveau"); }} options={DEUTSCH_NIVEAU_OPTIONS} placeholder="Niveau wählen" error={touched.deutschNiveau && !filled(data.deutschNiveau) ? "Bitte ausfüllen" : undefined} /></div>
        {data.deutschNiveau && data.deutschNiveau !== "muttersprache" && (
          <SegmentedControl label="Sprachzertifikat vorhanden?" value={data.zertifikatVorhanden} onChange={v => set("zertifikatVorhanden", v)} options={JA_NEIN} />
        )}
        <SegmentedControl label="SRK-Pflegehelfer-Zertifikat vorhanden?" required value={data.srkZertifikatVorhanden} onChange={v => set("srkZertifikatVorhanden", v)} options={JA_NEIN} />
      </div>
      {/* Konsistenz Qualifikation ↔ SRK-Zertifikat */}
      {data.qualifikation === "ohne_srk" && data.srkZertifikatVorhanden === "ja" && (
        <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
          Qualifikation «ohne SRK» gewählt, aber SRK-Zertifikat als vorhanden markiert — bitte prüfen.
        </div>
      )}
      {(data.qualifikation === "srk" || data.qualifikation === "fage_dipl") && data.srkZertifikatVorhanden === "nein" && (
        <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
          Qualifikation «{data.qualifikation === "srk" ? "SRK" : "FaGe / Dipl"}» gewählt, aber SRK-Zertifikat nicht als vorhanden markiert — bitte prüfen.
        </div>
      )}
      {/* Konsistenz Funktion ↔ SRK */}
      {data.funktion === "ph_srk" && data.srkZertifikatVorhanden === "nein" && (
        <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
          Funktion «Pflegehelfer/in SRK» setzt SRK-Kurs voraus — Zertifikat fehlt.
        </div>
      )}
      {data.funktion === "ph_ohne_srk" && data.srkZertifikatVorhanden === "ja" && (
        <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", background: "var(--status-info-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          SRK-Zertifikat vorhanden — Funktion ggf. auf «Pflegehelfer/in SRK» anpassen?
        </div>
      )}
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
  const [tarifOverrideOpen, setTarifOverrideOpen] = useState(false);
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));
  const set = (f: keyof AngehoerigerFormData, v: string) => onChange({ ...data, [f]: v });

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      <SectionHeader icon={Receipt} label="Quellensteuer" first />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <SegmentedControl label="Quellensteuerpflichtig?" required value={data.quellensteuer} onChange={v => { if (v === "nein") onChange({ ...data, quellensteuer: v, quellensteuerTarif: "" }); else set("quellensteuer", v); }} options={JA_NEIN} hint="Nicht-CH-Bürger mit B/L sind i.d.R. quellensteuerpflichtig" />
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Konfession" required value={data.konfession || null} onChange={v => { set("konfession", v || ""); touch("konfession"); }} options={KONFESSION_OPTIONS} placeholder="Konfession wählen" hint="Relevant für Kirchensteuer" error={touched.konfession && !filled(data.konfession) ? "Pflichtfeld" : undefined} /></div>
      </div>
      {/* SP-10: QSt-Tarifcode — abgeleitet, read-only + kontrollierter Override */}
      {data.quellensteuer === "ja" && (() => {
        const hatKinder = data.hatUnterhaltspflichtigeKinder === "ja";
        const anzahlKinder = parseInt(data.anzahlKinder) || 0;
        const tarifErgebnis = leiteTarifcodeAb({
          zivilstand: data.zivilstand,
          hatKinder,
          anzahlKinder,
          partnerErwerbstaetig: data.partnerErwerbstaetig || data.partnerBerufstaetig,
          konfession: data.konfession,
        });
        // Auto-Update wenn abgeleitet
        if (data.tarifcodeQuelle !== "manuell_ueberschrieben" && tarifErgebnis.code !== data.quellensteuerTarif) {
          setTimeout(() => set("quellensteuerTarif", tarifErgebnis.code), 0);
        }
        const istOverride = data.tarifcodeQuelle === "manuell_ueberschrieben";
        const hatAbweichung = istOverride && data.quellensteuerTarif !== tarifErgebnis.code;

        return (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div style={{ padding: "12px 16px", background: "var(--status-info-bg)", borderRadius: 10 }}>
              <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                Ermittelter QSt-Tarifcode: {istOverride ? data.quellensteuerTarif : tarifErgebnis.code}
              </div>
              <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {istOverride
                  ? `Manuell festgelegt. Ermittlung wäre: ${tarifErgebnis.code} (${tarifErgebnis.begruendung})`
                  : tarifErgebnis.begruendung}
              </div>
              {!tarifOverrideOpen && (
                <button onClick={() => setTarifOverrideOpen(true)} style={{ marginTop: 6, background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", padding: 0, cursor: "pointer" }}>
                  Abweichend festlegen…
                </button>
              )}
            </div>

            {hatAbweichung && !tarifOverrideOpen && (
              <div style={{ marginTop: "var(--space-2)", padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
                Abweichung: gespeichert «{data.quellensteuerTarif}», aktuell ermittelt «{tarifErgebnis.code}».
                {data.tarifcodeOverrideBegruendung && <> Begründung: {data.tarifcodeOverrideBegruendung}</>}
              </div>
            )}

            {tarifOverrideOpen && (
              <div style={{ marginTop: "var(--space-3)", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 10, border: "0.5px solid var(--border-default)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>Tarifcode abweichend festlegen</div>
                <div style={{ maxWidth: FELD_MAX.schmal }}><TextInput label="Tarifcode" required value={data.quellensteuerTarif} onChange={v => set("quellensteuerTarif", v)} placeholder="z.B. B2Y, A0N, H1Y" /></div>
                <div style={{ marginTop: "var(--space-3)" }}>
                  <TextInput label="Begründung der Abweichung" required value={data.tarifcodeOverrideBegruendung} onChange={v => set("tarifcodeOverrideBegruendung", v)} placeholder="z.B. Grenzgänger Tarif G, gemäss Verfügung Steueramt" hint="Pflichtfeld — wird an die Buchhaltung zur Prüfung weitergeleitet" />
                </div>
                <div className="flex items-center" style={{ gap: 8, marginTop: "var(--space-3)" }}>
                  <button
                    onClick={() => {
                      if (!filled(data.tarifcodeOverrideBegruendung)) return;
                      set("tarifcodeQuelle", "manuell_ueberschrieben");
                      setTarifOverrideOpen(false);
                      console.info(`[SP-10 Audit] Override QSt-Tarifcode: ${tarifErgebnis.code} → ${data.quellensteuerTarif}, Begründung: ${data.tarifcodeOverrideBegruendung}`);
                    }}
                    disabled={!filled(data.tarifcodeOverrideBegruendung)}
                    className="inline-flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ gap: 4, padding: "8px 16px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
                  >
                    Abweichung speichern
                  </button>
                  <button
                    onClick={() => {
                      set("quellensteuerTarif", tarifErgebnis.code);
                      set("tarifcodeQuelle", "abgeleitet");
                      set("tarifcodeOverrideBegruendung", "");
                      setTarifOverrideOpen(false);
                    }}
                    className="cursor-pointer"
                    style={{ background: "none", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "8px 12px" }}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <SectionHeader icon={Shield} label="Sozialversicherungen" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
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
      {/* Externe Anstellung */}
      <SectionHeader icon={Briefcase} label="Externe Anstellung" first />
      <SegmentedControl label="Bereits bei einem anderen Arbeitgeber angestellt?" required value={data.arbeitetExtern} onChange={v => set("arbeitetExtern", v)} options={JA_NEIN} />
      {data.arbeitetExtern === "ja" && (
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)", marginTop: "var(--space-4)" }}>
          <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Funktion extern" required value={data.externeFunktion} onChange={v => set("externeFunktion", v)} onBlur={() => touch("externeFunktion")} placeholder="z.B. Pflegehelferin" error={touched.externeFunktion && !filled(data.externeFunktion) ? "Bitte ausfüllen" : undefined} /></div>
          <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="Pensum extern" required value={data.externesPensumProzent} onChange={v => set("externesPensumProzent", v)} suffix="%" placeholder="50" /></div>
          <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Eintritt extern" required wertFormat="display" bereich="any" value={data.externerEintritt || null} onChange={v => set("externerEintritt", (v as string) ?? "")} onBlur={() => touch("externerEintritt")} /></div>
          <SegmentedControl label="BVG-Anbindung gewünscht?" value={data.bvgAnbindungGewuenscht} onChange={v => set("bvgAnbindungGewuenscht", v)} options={JA_NEIN} />
        </div>
      )}
      {/* Anstellung Spitex — Lohnart ist immer Stundenlohn in der Angehörigenpflege */}
      <SectionHeader icon={Briefcase} label="Anstellung" />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><FormSelect label="Funktion" required value={data.funktion || null} onChange={v => { set("funktion", v || ""); touch("funktion"); }} options={FUNKTIONEN} placeholder="Funktion wählen" error={touched.funktion && !filled(data.funktion) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><DateField label="Eintrittsdatum" required wertFormat="display" bereich="any" value={data.eintrittsdatum || null} onChange={v => set("eintrittsdatum", (v as string) ?? "")} onBlur={() => touch("eintrittsdatum")} /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="Stundenlohn" required value={data.stundenlohn} onChange={v => set("stundenlohn", v)} suffix="CHF" placeholder="32.00" /></div>
        <div style={{ maxWidth: FELD_MAX.schmal }}><NumberInput label="Ferienanspruch" required value={data.ferienanspruchWochen} onChange={v => set("ferienanspruchWochen", v)} suffix="Wochen" placeholder="5" /></div>
        {/* Ferienzuschlag abgeleitet aus Wochen */}
        {parseFloat(data.ferienanspruchWochen) > 0 && (
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", alignSelf: "end", paddingBottom: 10 }}>
            Ferienzuschlag: {berechneFerienzuschlagProzent(parseFloat(data.ferienanspruchWochen))}%
          </div>
        )}
      </div>
      {/* Warnung nur bei echtem Problem: unter gesetzlichem Minimum */}
      {(() => {
        const wochen = parseFloat(data.ferienanspruchWochen) || 0;
        const gebParts = (data.geburtsdatum || "").split(".");
        let alter = 30;
        if (gebParts.length === 3) { const j = parseInt(gebParts[2]); if (!isNaN(j)) alter = new Date().getFullYear() - j; }
        const w = pruefeFerienMinimum(wochen, alter);
        return w ? <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>{w}</div> : null;
      })()}

      <SectionHeader icon={CreditCard} label="Auszahlung" />
      <div style={{ display: "flex", flexDirection: "column", rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div style={{ maxWidth: FELD_MAX.mittel }}><TextInput label="Bankname" required value={data.bankname} onChange={v => set("bankname", v)} onBlur={() => touch("bankname")} placeholder="z.B. PostFinance, UBS, Raiffeisen" error={touched.bankname && !filled(data.bankname) ? "Pflichtfeld" : undefined} /></div>
        <div style={{ maxWidth: FELD_MAX.mittel }}><IBANInput label="IBAN" required value={data.iban} onChange={v => set("iban", v)} /></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SEM-MELDEFORMULAR BANNER
   ══════════════════════════════════════════ */

function SEMMeldeBanner({ data }: { data: AngehoerigerFormData }) {
  const [loading, setLoading] = useState(false);
  const [showLuecken, setShowLuecken] = useState(false);

  const semDaten = formDataToSEM(data);
  const fehlend = ermittleFehlendeFelderSEM(semDaten);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await erstelleSEMFormular(semDaten);
      const datumStr = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `SEM-Meldeformular_${data.name || "Angehoeriger"}_${datumStr}.pdf`);
    } catch (e) {
      console.error("SEM-Formular konnte nicht erstellt werden:", e);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: "var(--space-4)", padding: "14px 18px", background: "var(--status-warning-bg)", borderRadius: 10, border: "0.5px solid var(--status-warning)" }}>
      <div className="flex items-start" style={{ gap: 12 }}>
        <AlertTriangle style={{ width: 18, height: 18, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--status-warning-text)" }}>
            Meldepflicht beim kantonalen Amt für Migration
          </div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginTop: 4 }}>
            Aufenthaltsstatus {data.aufenthaltsstatus}: Bei Stellenantritt muss die Erwerbstätigkeit beim zuständigen kantonalen Amt gemeldet werden.
            Das offizielle SEM-Formular kann mit den erfassten Daten vorausgefüllt heruntergeladen werden.
          </div>

          {/* Fehlende Felder anzeigen */}
          {fehlend.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setShowLuecken(!showLuecken)}
                className="cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", fontWeight: 500, textDecoration: "underline" }}
              >
                {fehlend.length} Feld{fehlend.length !== 1 ? "er" : ""} nicht befüllt {showLuecken ? "▲" : "▼"}
              </button>
              {showLuecken && (
                <div style={{ marginTop: 4, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                  {fehlend.map(f => f.label).join(", ")} — diese Felder bleiben im PDF leer und können manuell ergänzt werden.
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 6, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none", opacity: loading ? 0.6 : 1 }}
            >
              <Download style={{ width: 14, height: 14 }} />
              {loading ? "Wird erstellt…" : "SEM-Meldeformular herunterladen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Exportiert für Wiederverwendung im Dokumente-Tab */
export { SEMMeldeBanner };
