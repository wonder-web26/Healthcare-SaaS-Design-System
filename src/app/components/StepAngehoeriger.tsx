import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check, User, Receipt, Heart, Baby, Briefcase, FileText } from "lucide-react";

import { PersonalienFormV2, SteuerFormV2, AnstellungFormV2 } from "./form/MigratedAngehoerigerForms";
import { PartnerFormV2, KinderFormV2, DokumenteFormV2 } from "./form/MigratedAngehoerigerForms2";
import { sichtbareDokumenttypen, istDokumentVollstaendig, type DokumentKontext } from "../../lib/stammdaten/dokumenttypen";

/* ══════════════════════════════════════════
   TYPES (unchanged export contract)
   ══════════════════════════════════════════ */
export interface AngehoerigerFormData {
  /* 1. Personalien – Identität */
  name: string;
  vorname: string;
  geschlecht: string;
  geburtsdatum: string;
  ahvNummer: string;
  nationalitaet: string;
  heimatort: string;
  aufenthaltsstatus: string;
  /** Bewilligungs-Felder (nur bei ausländischer Bewilligung, nicht CH/C) */
  einreisedatum: string;
  zemisNummer: string;
  einreichungsdatumMigrationsamt: string;
  bewilligungAblaufdatum: string;
  spezialbewilligungStatus: "nicht_erforderlich" | "ausstehend" | "eingereicht" | "bewilligt";
  spezialbewilligungDokument: { name: string; size: string } | null;
  spezialbewilligungEinreichungsDatum: string;
  spezielleGenehmigung: string;
  zivilstand: string;
  zivilstandSeit: string;
  /* 1. Personalien – Kontaktdaten */
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  /* 1. Personalien – Krankenkasse (SP-02, SP-03) */
  krankenkasseName: string;
  /** SP-03: umbenannt von "Versicherungsnummer" zu "Kartennummer" (Nummer auf der Versichertenkarte) */
  kartennummer: string;
  /** SP-03: BAG-Nr. der Kasse (wird aus Krankenkasse-Picklist vorbefuellt, manuell ueberschreibbar) */
  bagNr: string;
  /* 2. Steuer & Sozialversicherung */
  quellensteuer: string;
  konfession: string;
  /** SP-10: Abgeleiteter oder manuell überschriebener QSt-Tarifcode (z.B. "B2Y") */
  quellensteuerTarif: string;
  /** SP-10: Quelle des Tarifcodes */
  tarifcodeQuelle: string;
  /** SP-10: Begründung bei manuellem Override */
  tarifcodeOverrideBegruendung: string;
  steuergemeinde: string;
  bvgVersichert: string;
  uvgVersichert: string;
  sozialamtInvolviert: string;
  sozialamtKontakt: string;
  lohnabtretung: string;
  /* 3. Partner (SP-06: 3-Zustandslogik) */
  /** Manueller Toggle: User will Partner erfassen, obwohl Bedingung nicht erfuellt */
  partnerManualToggle: boolean;
  partnerVorname: string;
  partnerName: string;
  partnerGeburtsdatum: string;
  partnerNationalitaet: string;
  /** SP-06: Aufenthaltsbewilligung des Partners (Schweizer/C/B/andere) — Basis fuer SP-07 */
  partnerAufenthaltsstatus: string;
  /** SP-06: Erwerbstaetig (Ja/Nein) */
  partnerErwerbstaetig: string;
  /* Legacy-Felder (beibehalten fuer Datenkonsistenz) */
  partnerAhvNummer: string;
  partnerZemisNummer: string;
  partnerFbAusweisAngemeldet: string;
  partnerAnmeldungDatum: string;
  partnerBerufstaetig: string;
  partnerAhv: string;
  /* 4. Kinder & Zulagen */
  hatUnterhaltspflichtigeKinder: string;
  kinder: KindEntry[];
  kinderzulagenUeberSpitex: string;
  anzahlKinder: string;
  kinderzulagenBeantragt: string;
  familienausgleichskasse: string;
  /* 5. Anstellung & Auszahlung */
  funktion: string;
  eintrittsdatum: string;
  stundenlohn: string;
  /** Externe Zweitanstellung (Mehrfacharbeitgeber) */
  arbeitetExtern: string;
  externeFunktion: string;
  externesPensumProzent: string;
  externerEintritt: string;
  bvgAnbindungGewuenscht: string;
  /** Lohnart: stundenlohn oder monatslohn */
  lohnart: string;
  /** Ferienanspruch in Wochen (Dezimalzahl) */
  ferienanspruchWochen: string;
  /** Qualifikation */
  /** Pflegerische Qualifikationsstufe: ohne_srk | srk | fage_dipl */
  qualifikation: string;
  deutschNiveau: string;
  zertifikatVorhanden: string;
  srkZertifikatVorhanden: string;
  bankname: string;
  iban: string;
  /* 6. Dokumente */
  scans: Record<string, ScanFile | null>;
}

export interface KindEntry {
  id: string;
  vorname: string;
  name: string;
  geburtsdatum: string;
  geschlecht: string;
  ahvNummer: string;
  /** SP-09: "ja" / "nein" — nachobligatorische Ausbildung */
  inAusbildung: string;
  ausbildungsbeginn: string;
  ausbildungsstatus: string;
  /** SP-09: Zulagentyp (kinderzulage / ausbildungszulage / keine_zulage) */
  zulagenart: string;
  /** SP-09: Quelle des Zulagentyps ("abgeleitet" / "manuell_ueberschrieben") */
  typQuelle: string;
  /** SP-09: Begründung bei manuellem Override (Pflichtfeld) */
  overrideBegruendung: string;
  /** SP-09: Doppelbezugs-Check ("ja" / "nein" / "unbekannt") */
  doppelbezug: string;
}

interface ScanFile {
  name: string;
  type: string;
  size: string;
  timestamp: string;
  previewUrl: string | null;
}

export const emptyAngehoerigerForm: AngehoerigerFormData = {
  name: "",
  vorname: "",
  geschlecht: "",
  geburtsdatum: "",
  ahvNummer: "",
  nationalitaet: "",
  heimatort: "",
  aufenthaltsstatus: "",
  einreisedatum: "",
  zemisNummer: "",
  einreichungsdatumMigrationsamt: "",
  bewilligungAblaufdatum: "",
  spezialbewilligungStatus: "nicht_erforderlich",
  spezialbewilligungDokument: null,
  spezialbewilligungEinreichungsDatum: "",
  spezielleGenehmigung: "",
  zivilstand: "ledig",
  zivilstandSeit: "",
  strasse: "",
  plz: "",
  ort: "",
  email: "",
  telefon: "",
  krankenkasseName: "",
  kartennummer: "",
  bagNr: "",
  quellensteuer: "nein",
  konfession: "",
  quellensteuerTarif: "",
  tarifcodeQuelle: "abgeleitet",
  tarifcodeOverrideBegruendung: "",
  steuergemeinde: "",
  bvgVersichert: "ja",
  uvgVersichert: "ja",
  sozialamtInvolviert: "nein",
  sozialamtKontakt: "",
  lohnabtretung: "nein",
  partnerManualToggle: false,
  partnerVorname: "",
  partnerName: "",
  partnerGeburtsdatum: "",
  partnerNationalitaet: "",
  partnerAufenthaltsstatus: "",
  partnerErwerbstaetig: "",
  partnerAhvNummer: "",
  partnerZemisNummer: "",
  partnerFbAusweisAngemeldet: "nein",
  partnerAnmeldungDatum: "",
  partnerBerufstaetig: "nein",
  partnerAhv: "",
  hatUnterhaltspflichtigeKinder: "nein",
  kinder: [],
  kinderzulagenUeberSpitex: "nein",
  anzahlKinder: "0",
  kinderzulagenBeantragt: "nein",
  familienausgleichskasse: "",
  funktion: "",
  eintrittsdatum: "",
  stundenlohn: "",
  arbeitetExtern: "nein",
  externeFunktion: "",
  externesPensumProzent: "",
  externerEintritt: "",
  bvgAnbindungGewuenscht: "",
  qualifikation: "",
  deutschNiveau: "",
  zertifikatVorhanden: "nein",
  srkZertifikatVorhanden: "nein",
  lohnart: "stundenlohn",
  ferienanspruchWochen: "5.0",
  bankname: "",
  iban: "",
  scans: {
    id_scan: null,
    krankenkassenkarte: null,
    bankkarte: null,
    partner_krankenkassenkarte: null,
    kinder_krankenkassenkarte: null,
    familienbuchlein: null,
  },
};

/* ══════════════════════════════════════════
   VALIDATION HELPERS
   ══════════════════════════════════════════ */
function filled(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidAHV(v: string | undefined | null): boolean {
  if (!v) return false;
  const clean = v.replace(/[\s.]/g, "");
  return /^756\d{10}$/.test(clean);
}

function isValidIBAN(v: string | undefined | null): boolean {
  if (!v) return false;
  const clean = v.replace(/\s/g, "");
  return /^CH\d{19}$/i.test(clean);
}

function isValidDate(v: string | undefined | null): boolean {
  if (!v) return false;
  return /^\d{2}\.\d{2}\.\d{4}$/.test(v);
}

/* ══════════════════════════════════════════
   SUB-STEP DEFINITIONS
   ══════════════════════════════════════════ */
interface SubStepDef {
  id: number;
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const subSteps: SubStepDef[] = [
  {
    id: 1,
    key: "personalien",
    label: "Personalien",
    icon: User,
    description: "Identität, Kontaktdaten, Krankenkasse",
  },
  {
    id: 2,
    key: "steuer",
    label: "Steuer & Sozialvers.",
    icon: Receipt,
    description: "Quellensteuer, BVG, UVG-Angaben",
  },
  {
    id: 3,
    key: "partner",
    label: "Partner",
    icon: Heart,
    description: "Zivilstand, Partnerangaben",
  },
  {
    id: 4,
    key: "kinder",
    label: "Kinder & Zulagen",
    icon: Baby,
    description: "Kinderzulagen, Familienausgleichskasse",
  },
  {
    id: 5,
    key: "anstellung",
    label: "Anstellung & Auszahlung",
    icon: Briefcase,
    description: "Funktion, Stundenlohn, Bankdaten",
  },
  {
    id: 6,
    key: "dokumente",
    label: "Dokumente",
    icon: FileText,
    description: "Pflicht-Scans und Uploads",
  },
];

/* ── Sub-step completion logic ─────────── */
function getSubStepStatus(
  key: string,
  data: AngehoerigerFormData
): "empty" | "partial" | "complete" {
  switch (key) {
    case "personalien": {
      const isSwiss = data.nationalitaet === "schweiz";
      const checks = [
        /* Identität */
        filled(data.name),
        filled(data.vorname),
        filled(data.geschlecht),
        isValidDate(data.geburtsdatum),
        isValidAHV(data.ahvNummer),
        filled(data.nationalitaet),
        filled(data.zivilstand),
        isValidDate(data.zivilstandSeit),
        /* Kontaktdaten */
        filled(data.strasse),
        filled(data.plz),
        filled(data.ort),
        filled(data.email),
        filled(data.telefon),
        /* Krankenkasse (SP-02: Pflicht, SP-03: Kartennummer Pflicht) */
        filled(data.krankenkasseName),
        filled(data.kartennummer),
      ];
      // Conditional: Heimatort only for Swiss, Aufenthaltsstatus only for non-Swiss
      if (isSwiss) checks.push(filled(data.heimatort));
      if (filled(data.nationalitaet) && !isSwiss) checks.push(filled(data.aufenthaltsstatus));
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "steuer": {
      const isQuellensteuer = data.quellensteuer === "ja";
      const isSozialamt = data.sozialamtInvolviert === "ja";
      const checks = [
        filled(data.quellensteuer),
        filled(data.konfession),
        filled(data.bvgVersichert),
        filled(data.uvgVersichert),
        filled(data.sozialamtInvolviert),
        filled(data.lohnabtretung),
      ];
      // Conditional fields
      if (isQuellensteuer) checks.push(filled(data.quellensteuerTarif));
      if (isSozialamt) checks.push(filled(data.sozialamtKontakt));
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "partner": {
      // SP-06: 3-Zustandslogik
      // SP-06: "eingetragene Partnerschaft" ist der Ehe steuerlich gleichgestellt (DBG Art. 9 Abs. 1bis)
      const pflichtBedingung = (data.zivilstand === "verheiratet" || data.zivilstand === "eingetragene_partnerschaft") && data.quellensteuer === "ja";
      const manuellesToggle = data.partnerManualToggle;
      const partnerSichtbar = pflichtBedingung || manuellesToggle;
      if (!partnerSichtbar) return "complete"; // not applicable → auto-complete
      // Bei manuellem Toggle (optional) zaehlt vorhandene Daten als "partial" aber nie als Fehler
      const checks = [
        filled(data.partnerName),
        filled(data.partnerVorname),
        filled(data.partnerGeburtsdatum),
        filled(data.partnerAufenthaltsstatus),
        filled(data.partnerErwerbstaetig),
      ];
      const done = checks.filter(Boolean).length;
      if (!pflichtBedingung) {
        // Manuell eingeblendet: alles optional → gilt als complete wenn irgendwas gefuellt
        return done > 0 ? "complete" : "complete";
      }
      // Pflicht: alle Checks muessen bestehen
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "kinder": {
      // SP-08: zweistufiges Gating
      const hasKids = data.hatUnterhaltspflichtigeKinder === "ja";
      if (!hasKids) return "complete"; // Frage 1 = Nein → auto-complete
      // Stufe 1: Anzahl Kinder muss gefuellt sein (Pflicht)
      const anzahlOk = filled(data.anzahlKinder) && data.anzahlKinder !== "0";
      if (!anzahlOk) return "empty";
      // Frage 2 muss beantwortet sein
      if (!filled(data.kinderzulagenUeberSpitex)) return "partial";
      // Stufe 2: Wenn Zulagen ueber Spitex → Detail-Block Pflicht
      if (data.kinderzulagenUeberSpitex === "ja") {
        if (data.kinder.length === 0) return "partial";
        const allKidsComplete = data.kinder.every(k => filled(k.vorname) && filled(k.name) && filled(k.geburtsdatum));
        return allKidsComplete ? "complete" : "partial";
      }
      // Frage 2 = Nein → nur Anzahl noetig, schon geprueft
      return "complete";
    }
    case "anstellung": {
      const checks = [
        filled(data.funktion),
        isValidDate(data.eintrittsdatum),
        isValidStundenlohn(data.stundenlohn),
        filled(data.bankname),
        isValidIBAN(data.iban),
      ];
      const done = checks.filter(Boolean).length;
      if (done === checks.length) return "complete";
      if (done > 0) return "partial";
      return "empty";
    }
    case "dokumente": {
      // Stammdaten-Engine: gleiche Quelle wie DokumenteFormV2
      const kontext: DokumentKontext = {
        partnerErforderlich:
          ((data.zivilstand === "verheiratet" || data.zivilstand === "eingetragene_partnerschaft") && data.quellensteuer === "ja")
          || data.partnerManualToggle === true,
        hatKinder: parseInt(data.anzahlKinder) > 0,
        kinderzulagenUeberSpitex: data.kinderzulagenUeberSpitex === "ja",
        unterhaltspflicht: data.hatUnterhaltspflichtigeKinder === "ja",
        zertifikatDeutschVorhanden: data.zertifikatVorhanden === "ja",
        srkZertifikatVorhanden: data.srkZertifikatVorhanden === "ja",
        assistenzbeitragJa: false,
      };
      const sichtbar = sichtbareDokumenttypen(kontext, "angehoeriger");
      const pflicht = sichtbar.filter(d => d.pflicht && !d.mehrfach);
      const vollstaendig = pflicht.filter(d => istDokumentVollstaendig(d, data.scans)).length;
      if (pflicht.length === 0) return "complete";
      if (vollstaendig === pflicht.length) return "complete";
      if (vollstaendig > 0) return "partial";
      return "empty";
    }
    default:
      return "empty";
  }
}

/* ══════════════════════════════════════════
   PROPS (unchanged export contract)
   ══════════════════════════════════════════ */
interface StepAngehoerigerProps {
  data: AngehoerigerFormData;
  onChange: (data: AngehoerigerFormData) => void;
  onValidityChange?: (isValid: boolean) => void;
  onOpenSpezialbewilligung?: () => void;
  /** Aktion am rechten Ende der Reiterzeile (z. B. "Gespräch"), bleibt fixiert sichtbar. */
  reiterAktion?: React.ReactNode;
}

/* ══════��═══════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepAngehoeriger({
  data,
  onChange,
  onValidityChange,
  onOpenSpezialbewilligung,
  reiterAktion,
}: StepAngehoerigerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // §D: Verlauf am rechten Rand der Abschnittszeile, solange waagrecht scrollbar (nicht am Ende).
  const abschnittScrollRef = useRef<HTMLDivElement>(null);
  const [zeigtVerlauf, setZeigtVerlauf] = useState(false);
  const pruefeVerlauf = useCallback(() => {
    const el = abschnittScrollRef.current;
    if (el) setZeigtVerlauf(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);
  useEffect(() => {
    pruefeVerlauf();
    const el = abschnittScrollRef.current;
    if (!el) return;
    // §C: nach Font-Laden erneut messen + Inhaltsbreite beobachten (siehe StepPatient).
    document.fonts?.ready.then(pruefeVerlauf).catch(() => {});
    const ro = new ResizeObserver(pruefeVerlauf);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", pruefeVerlauf);
    return () => { ro.disconnect(); window.removeEventListener("resize", pruefeVerlauf); };
  }, [pruefeVerlauf]);

  /* ── Compute statuses ──────────────────── */
  const statuses = subSteps.map((s) => ({
    ...s,
    status: getSubStepStatus(s.key, data),
  }));

  const completedCount = statuses.filter((s) => s.status === "complete").length;
  const allComplete = completedCount === subSteps.length;

  /* ── Sync validity upstream ────────────── */
  useEffect(() => {
    onValidityChange?.(allComplete);
  }, [allComplete, onValidityChange]);

  /* ── Save simulation ───────────────────── */
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    }, 900);
  }, []);

  const statusLabel = allComplete
    ? "Vollständig"
    : completedCount > 0
    ? "In Erfassung"
    : "Ausstehend";

  return (
    <div className="space-y-0">
      {/* Workspace-Kopf entfernt — Tab-Leiste rückt direkt unter den Onboarding-Header */}

      {/* ═══════════════════════════════════════
         HORIZONTAL TAB NAVIGATION
         ═══════════════════════════════════════ */}
      {/* ZWEITE Reiterebene: Abschnitte der aktiven Phase (§B). KEINE Tönung (Containerfläche),
          Höhe 48, Schrift 12, KEIN Zustandssymbol, Abstand 16, aktiver Eintrag 1.5px unterstrichen.
          Die Ebenen-Haarlinie trägt die Phasenzeile (borderBottom); hier nur die untere Haarlinie zum Formular.
          "Gespräch" rechts fixiert; Abschnitte scrollen waagrecht mit Verlauf-Hinweis (§C/§D). */}
      <div className="flex items-center" style={{ background: "transparent", padding: "0 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="relative flex-1 min-w-0">
        <div ref={abschnittScrollRef} onScroll={pruefeVerlauf} className="overflow-x-auto">
        <div
          role="tablist"
          aria-label="Abschnitte"
          className="flex min-w-max"
          style={{ gap: 16 }}
          onKeyDown={e => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
            const i = btns.indexOf(document.activeElement as HTMLButtonElement);
            if (i === -1) return;
            e.preventDefault();
            const next = e.key === "ArrowRight" ? btns[i + 1] : btns[i - 1];
            next?.focus();
            next?.scrollIntoView({ inline: "nearest", block: "nearest" });
          }}
        >
          {subSteps.map((tab, idx) => {
            const isActive = activeTab === idx;
            const tabStatus = statuses[idx].status;

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(idx)}
                onFocus={e => e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest" })}
                className="ui-fokusring relative flex items-center whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  height: 48, padding: 0, flexShrink: 0,
                  fontSize: "var(--text-meta)", fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                  color: isActive ? "var(--text-primary)" : tabStatus === "complete" ? "var(--status-success-text)" : "var(--text-secondary)",
                  background: "transparent", border: "none", fontFamily: "inherit",
                }}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute" style={{ bottom: 0, left: 0, right: 0, height: 1.5, background: "var(--text-primary)", borderRadius: 1 }} />
                )}
              </button>
            );
          })}
        </div>
        </div>
        {/* §D: Verlauf von Flächenfarbe zu durchsichtig am rechten Rand, nur wenn scrollbar */}
        {zeigtVerlauf && (
          <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 28, pointerEvents: "none", background: "linear-gradient(to right, transparent, var(--bg-elevated))" }} />
        )}
        </div>
        {reiterAktion && (
          <div className="flex items-center shrink-0" style={{ paddingLeft: 12 }}>{reiterAktion}</div>
        )}
      </div>

      {/* ═══════════════════════════════════════
         CONTENT AREA (flach im Container, kein Kartenrahmen)
         ═══════════════════════════════════════ */}
      <div style={{ background: "var(--bg-elevated)" }}>
        <div style={{ padding: "20px 32px 24px" }}>
          {activeTab === 0 && <PersonalienFormV2 data={data} onChange={onChange} onOpenSpezialbewilligung={onOpenSpezialbewilligung} />}
          {activeTab === 1 && <SteuerFormV2 data={data} onChange={onChange} />}
          {activeTab === 2 && <PartnerFormV2 data={data} onChange={onChange} />}
          {activeTab === 3 && <KinderFormV2 data={data} onChange={onChange} />}
          {activeTab === 4 && <AnstellungFormV2 data={data} onChange={onChange} />}
          {activeTab === 5 && <DokumenteFormV2 data={data} onChange={onChange} onOpenSpezialbewilligung={onOpenSpezialbewilligung} />}
        </div>
      </div>
      {/* Hinweistext entfernt (§A): erklärte, wie Reiter funktionieren, war auf Reitern
         ohne Pflichtfeld falsch und schwebte bei leeren Reitern in der Fläche. */}
    </div>
  );
}

function isValidStundenlohn(v: string): boolean {
  if (!filled(v)) return false;
  const n = parseFloat(v);
  return !isNaN(n) && n > 0;
}
