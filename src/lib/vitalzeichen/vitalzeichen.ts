/**
 * Vitalzeichen — Typen, Parameterkatalog und reine Ableitungen.
 *
 * Fachlicher Rahmen ist das FHIR Vital Signs Profile (Parameterset, LOINC,
 * UCUM) auf der nationalen Grundlage CH Core. Dieses Modul ist so geschnitten,
 * dass die spaetere Abbildung darauf ohne Umbau moeglich ist: die
 * Parametercodes entsprechen woertlich `Observation.type` aus dem Schema, die
 * Beurteilung traegt die Schemawerte von `Observation.interpretation`, und die
 * qualifizierenden Angaben gehen in `Observation.context` auf.
 *
 * ZWEI GRUPPEN, EINE BEWUSSTE TRENNUNG. Blutzucker und Schmerz sind keine
 * Vitalzeichen im FHIR-Sinn, aber fachlich zentral — sie stehen darum in einer
 * eigenen Gruppe «Messwerte ohne Vitalzeichen-Status», nicht versteckt und
 * nicht dazwischengemogelt. Beim Blutzucker ist der Messkontext PFLICHT, weil
 * er die fachliche Bedeutung des Werts veraendert: nuechtern 7 mmol/l ist eine
 * andere Aussage als 7 mmol/l nach dem Essen.
 *
 * DAS SYSTEM VERGLEICHT NIE SELBST. Alle Funktionen hier LEITEN AB und ZEIGEN
 * AN (Differenztexte, Fensterbestimmung, BMI) — keine bewertet einen Wert als
 * auffaellig, schlaegt eine Beurteilung vor oder faerbt etwas ein. Beurteilen
 * ist ein menschlicher Akt einer fachqualifizierten Rolle; alles andere waere
 * Entscheidungsunterstuetzung und damit regulatorisch ein Medizinprodukt.
 *
 * LOINC-CODES WERDEN HIER NICHT GESETZT. Das Feld existiert je Parameter und
 * bleibt leer. TODO: Die Zuordnung ist aus der HL7-Vital-Signs-Tabelle zu
 * uebernehmen und fachlich zu pruefen — keine Codes erfinden, auch keine
 * plausibel aussehenden.
 */

/** Parametercodes — woertlich aus `Observation.type` (docs/Spit Full.dbml).
 *  `pain_nrs` ist eine Prototyp-Ergaenzung (siehe Schema-Delta): das Schema
 *  kennt keinen Schmerz-Typ, die Pflege braucht ihn. */
export type ParameterCode =
  | "blood_pressure" | "heart_rate" | "respiratory_rate" | "temperature"
  | "oxygen_saturation" | "weight" | "height"
  | "blood_glucose" | "pain_nrs";

export type ParameterGruppe = "vitalzeichen" | "ohne_status";

export const GRUPPE_LABEL: Record<ParameterGruppe, string> = {
  vitalzeichen: "Vitalzeichen",
  ohne_status: "Messwerte ohne Vitalzeichen-Status",
};

/** Eine qualifizierende Angabe eines Parameters. */
export interface QualifierDef {
  feld: string;
  label: string;
  werte: { code: string; label: string }[];
  /** Nur der Blutzucker-Messkontext ist Pflicht. */
  pflicht?: boolean;
  /** Werte verschiedener Auspraegungen gehoeren nicht auf dieselbe Kurve. */
  trennendImVerlauf?: boolean;
}

export interface VitalParameterDef {
  code: ParameterCode;
  label: string;
  einheit: string;
  gruppe: ParameterGruppe;
  /**
   * LOINC — bleibt in diesem Lauf leer.
   * TODO: Zuordnung aus der HL7-Vital-Signs-Tabelle uebernehmen und fachlich
   * pruefen, bevor irgendein Export entsteht.
   */
  loincCode: "";
  /** Erfassbarer Bereich — Tippfehler-Schutz, keine klinische Aussage. */
  minPlausibel: number;
  maxPlausibel: number;
  /** Blutdruck: der diastolische Zweitwert. */
  zweitwert?: { label: string; minPlausibel: number; maxPlausibel: number };
  qualifier: QualifierDef[];
}

export const VITAL_PARAMETER: VitalParameterDef[] = [
  {
    code: "blood_pressure", label: "Blutdruck", einheit: "mmHg", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 60, maxPlausibel: 260,
    zweitwert: { label: "diastolisch", minPlausibel: 30, maxPlausibel: 150 },
    qualifier: [
      { feld: "koerperhaltung", label: "Körperhaltung", werte: [
        { code: "sitzend", label: "sitzend" }, { code: "stehend", label: "stehend" }, { code: "liegend", label: "liegend" },
      ] },
      { feld: "koerperstelle", label: "Körperstelle", werte: [
        { code: "linker_arm", label: "linker Arm" }, { code: "rechter_arm", label: "rechter Arm" },
      ] },
    ],
  },
  {
    code: "heart_rate", label: "Herzfrequenz", einheit: "/min", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 30, maxPlausibel: 220,
    qualifier: [
      { feld: "rhythmus", label: "Rhythmus", werte: [
        { code: "regelmaessig", label: "regelmässig" }, { code: "unregelmaessig", label: "unregelmässig" },
      ] },
    ],
  },
  {
    code: "respiratory_rate", label: "Atemfrequenz", einheit: "/min", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 5, maxPlausibel: 60, qualifier: [],
  },
  {
    code: "temperature", label: "Körpertemperatur", einheit: "°C", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 34, maxPlausibel: 43,
    qualifier: [
      { feld: "messort", label: "Messort", trennendImVerlauf: true, werte: [
        { code: "ohr", label: "Ohr" }, { code: "stirn", label: "Stirn" }, { code: "achsel", label: "Achsel" },
        { code: "rektal", label: "rektal" }, { code: "mund", label: "Mund" },
      ] },
    ],
  },
  {
    code: "oxygen_saturation", label: "Sauerstoffsättigung", einheit: "%", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 50, maxPlausibel: 100,
    qualifier: [
      { feld: "atmung", label: "Atmung", werte: [
        { code: "umgebungsluft", label: "Umgebungsluft" }, { code: "mit_sauerstoff", label: "mit Sauerstoff" },
        { code: "mit_atemunterstuetzung", label: "mit Atemunterstützung" },
      ] },
    ],
  },
  {
    code: "weight", label: "Körpergewicht", einheit: "kg", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 20, maxPlausibel: 300,
    qualifier: [
      { feld: "bedingungen", label: "Bedingungen", werte: [
        { code: "nach_wasserlassen", label: "nach dem Wasserlassen" }, { code: "vor_essen", label: "vor dem Essen" },
      ] },
    ],
  },
  {
    code: "height", label: "Körpergrösse", einheit: "cm", gruppe: "vitalzeichen", loincCode: "",
    minPlausibel: 100, maxPlausibel: 230, qualifier: [],
  },
  {
    code: "blood_glucose", label: "Blutzucker", einheit: "mmol/l", gruppe: "ohne_status", loincCode: "",
    minPlausibel: 1, maxPlausibel: 40,
    qualifier: [
      { feld: "messkontext", label: "Messkontext", pflicht: true, trennendImVerlauf: true, werte: [
        { code: "nuechtern", label: "nüchtern" }, { code: "vor_essen", label: "vor dem Essen" }, { code: "nach_essen", label: "nach dem Essen" },
      ] },
    ],
  },
  {
    /* Kein Vitalzeichen im FHIR-Sinn und kein Observation.type im Schema —
       aber fachlich zentral fuer die Pflege. Prototyp-Code, siehe Schema-Delta. */
    code: "pain_nrs", label: "Schmerz (NRS)", einheit: "Punkte", gruppe: "ohne_status", loincCode: "",
    minPlausibel: 0, maxPlausibel: 10, qualifier: [],
  },
];

export function parameterDef(code: ParameterCode): VitalParameterDef {
  return VITAL_PARAMETER.find(p => p.code === code)!;
}

/** Beurteilung — Schemawerte aus `Observation.interpretation`, woertlich.
 *  Deutsche Beschriftung nur an der Oberflaeche. `null` heisst OFFEN. */
export type Beurteilung = "abnormally_low" | "normal" | "abnormally_high";

export const BEURTEILUNG_LABEL: Record<Beurteilung, string> = {
  abnormally_low: "auffällig tief",
  normal: "im erwarteten Bereich",
  abnormally_high: "auffällig hoch",
};

export type Erhebungsart = "selbst_gemessen" | "angehoerige_berichtet" | "dokument";

export const ERHEBUNGSART_LABEL: Record<Erhebungsart, string> = {
  selbst_gemessen: "selbst gemessen",
  angehoerige_berichtet: "von Angehörigen berichtet",
  dokument: "aus Dokument übernommen",
};

/** Ein Wert innerhalb einer Messung. */
export interface VitalWert {
  parameterCode: ParameterCode;
  /** null bei dokumentierter Nichterhebung. */
  wert: number | null;
  /** Blutdruck: diastolisch. */
  zweitwert: number | null;
  /** feld → code, aus den QualifierDefs des Parameters. */
  qualifier: Record<string, string>;
  /**
   * «Nicht erhebbar» ist eine dokumentierte Nichterhebung MIT Grund — ein
   * eigener Zustand, kein fehlender Wert. Leer gelassene Parameter erzeugen
   * dagegen gar keinen VitalWert.
   */
  nichtErhebbar: boolean;
  nichtErhebbarGrund: string;
  /**
   * null = offen. Wird NIE vom System gesetzt — auch nicht als Vorschlag.
   * Eine nicht fachqualifizierte Rolle laesst sie offen; das erzeugt eine
   * Pendenz bei der Bezugsfachperson.
   */
  beurteilung: Beurteilung | null;
  /** Pflicht bei auffaelliger Beurteilung. */
  beurteilungBegruendung: string;
  beurteiltVonName: string | null;
  beurteiltVonRolle: string | null;
}

/** Eine Messung — ein Besuch, mehrere Werte. APPEND-ONLY. */
export interface VitalMessung {
  id: string;
  patientId: string;
  /** Wann gemessen wurde — editierbar, ISO mit Zeit. */
  messZeitpunkt: string;
  /** Wann erfasst wurde — systemseitig, unveraenderlich, ISO mit Zeit.
   *  Weichen beide ab, ist die Messung ein NACHTRAG und traegt das sichtbar. */
  erfasstAm: string;
  nachtrag: boolean;
  gemessenDurchUserId: string;
  gemessenDurchName: string;
  gemessenDurchRolle: string;
  erhebungsart: Erhebungsart;
  /** null = «nicht dokumentiert» — eine bewusste Angabe, kein Vergessen. */
  messgeraet: string | null;
  notiz: string;
  /**
   * Korrektur als NEUER Eintrag — nichts wird ueberschrieben. Der korrigierte
   * Eintrag bleibt in der Einzelmessungsliste sichtbar, gekennzeichnet und
   * mit Verweis hierauf.
   */
  korrekturVon: string | null;
  werte: VitalWert[];
}

/** Aerztlicher Zielwert — wird ANGEZEIGT, nie ausgewertet. */
export interface Zielwert {
  patientId: string;
  parameterCode: ParameterCode;
  /** Anzeige-Text, z.B. «unter 140/90 mmHg». */
  text: string;
  /** Band fuers Diagramm; null wenn nicht als Bereich darstellbar. */
  bandMin: number | null;
  bandMax: number | null;
  quelle: string;
  /** ISO */
  hinterlegtAm: string;
}

/* ── Reine Ableitungen ───────────────────────────────────────────────────── */

/** BMI — berechnet, nie erfasst. null, wenn eine Grundlage fehlt. */
export function berechneBmi(gewichtKg: number | null, groesseCm: number | null): number | null {
  if (!gewichtKg || !groesseCm || groesseCm <= 0) return null;
  const m = groesseCm / 100;
  return Math.round((gewichtKg / (m * m)) * 10) / 10;
}

/** Erfassbarer Bereich — Tippfehler-Schutz. Wortlaut technisch, nicht klinisch. */
export function pruefePlausibilitaet(def: VitalParameterDef, wert: number, zweitwert: number | null): string | null {
  if (wert < def.minPlausibel || wert > def.maxPlausibel) {
    return `${def.label}: ${wert} ${def.einheit} liegt ausserhalb des erfassbaren Bereichs (${def.minPlausibel}–${def.maxPlausibel}) – bitte prüfen.`;
  }
  if (def.zweitwert && zweitwert !== null
    && (zweitwert < def.zweitwert.minPlausibel || zweitwert > def.zweitwert.maxPlausibel)) {
    return `${def.label} ${def.zweitwert.label}: ${zweitwert} ${def.einheit} liegt ausserhalb des erfassbaren Bereichs (${def.zweitwert.minPlausibel}–${def.zweitwert.maxPlausibel}) – bitte prüfen.`;
  }
  return null;
}

const TAG_MS = 86_400_000;

export function tageZwischen(aIso: string, bIso: string): number {
  return Math.round(Math.abs(new Date(bIso).getTime() - new Date(aIso).getTime()) / TAG_MS);
}

/** «vor 2 Tagen», «heute», «vor 3 Wochen» — fuer Zeitabstaende in der Anzeige.
 *  Kalendertage, nicht 24-Stunden-Fenster: eine Messung von gestern Abend ist
 *  «gestern», auch wenn seither keine 24 Stunden vergangen sind. */
export function relativText(iso: string, jetztIso: string): string {
  const tag = (s: string) => new Date(`${s.slice(0, 10)}T00:00`).getTime();
  const tage = Math.round((tag(jetztIso) - tag(iso)) / TAG_MS);
  if (tage <= 0) return "heute";
  if (tage === 1) return "gestern";
  if (tage < 14) return `vor ${tage} Tagen`;
  if (tage < 60) return `vor ${Math.round(tage / 7)} Wochen`;
  if (tage < 700) return `vor ${Math.round(tage / 30)} Monaten`;
  return `vor ${Math.round(tage / 365)} Jahren`;
}

/** Messkadenz eines Parameters: Anzahl, ungefaehrer Rhythmus, erste Messung. */
export function kadenzVon(zeitpunkteIso: string[]): { anzahl: number; ersteAm: string | null; rhythmusText: string } {
  const sortiert = [...zeitpunkteIso].sort();
  const anzahl = sortiert.length;
  if (anzahl === 0) return { anzahl: 0, ersteAm: null, rhythmusText: "" };
  if (anzahl === 1) return { anzahl, ersteAm: sortiert[0], rhythmusText: "einmalig" };
  const spanneTage = tageZwischen(sortiert[0], sortiert[anzahl - 1]);
  const mittel = spanneTage / (anzahl - 1);
  let rhythmusText: string;
  if (mittel < 0.75) rhythmusText = "mehrmals täglich";
  else if (mittel < 1.5) rhythmusText = "etwa täglich";
  else {
    const unten = Math.floor(mittel);
    const oben = Math.ceil(mittel);
    rhythmusText = unten === oben ? `etwa alle ${unten} Tage` : `etwa alle ${unten}–${oben} Tage`;
  }
  return { anzahl, ersteAm: sortiert[0], rhythmusText };
}

export type FensterCode = "standard" | "7t" | "30t" | "3m" | "alle";

export interface FensterWahl {
  code: FensterCode;
  label: string;
  aktiv: boolean;
  /** Nur bei deaktivierten Voreinstellungen: warum. */
  grund: string | null;
  /** Zeitpunkte, die im Fenster liegen (ISO, aufsteigend). */
  zeitpunkte: string[];
}

/**
 * Zeitfenster NACH ANZAHL MESSUNGEN, nicht nach Kalender. Standard ist der
 * Zeitraum der letzten rund zwanzig Messungen; die Kalender-Voreinstellungen
 * sind deaktiviert (mit Grund), wenn die Daten den Zeitraum nicht hergeben —
 * eine leere Kurve waere schlimmer als ein gesperrter Knopf.
 */
export function fensterBestimmen(zeitpunkteIso: string[], jetztIso: string, standardAnzahl = 20): FensterWahl[] {
  const sortiert = [...zeitpunkteIso].sort();
  const erste = sortiert[0] ?? null;
  const standardZeitpunkte = sortiert.slice(-standardAnzahl);

  const kalender = (code: FensterCode, label: string, tage: number): FensterWahl => {
    const ab = new Date(new Date(jetztIso).getTime() - tage * TAG_MS).toISOString();
    const drin = sortiert.filter(z => z >= ab);
    // Deaktiviert, wenn die Daten den Zeitraum nicht abdecken: die erste
    // Messung liegt junger als das Fenster — das Fenster zeigte nur den
    // ohnehin sichtbaren Anfang.
    const abgedeckt = !!erste && tageZwischen(erste, jetztIso) >= tage;
    return {
      code, label, aktiv: abgedeckt, zeitpunkte: drin,
      grund: abgedeckt ? null : (erste
        ? `${label} deaktiviert — es liegen erst Messungen ab ${erste.slice(8, 10)}.${erste.slice(5, 7)}. vor`
        : `${label} deaktiviert — es liegen keine Messungen vor`),
    };
  };

  return [
    {
      code: "standard",
      label: `Letzte ${standardZeitpunkte.length} Messungen`,
      aktiv: standardZeitpunkte.length > 0,
      grund: null,
      zeitpunkte: standardZeitpunkte,
    },
    kalender("7t", "7 Tage", 7),
    kalender("30t", "30 Tage", 30),
    kalender("3m", "3 Monate", 90),
    { code: "alle", label: "Alle", aktiv: sortiert.length > 0, grund: null, zeitpunkte: sortiert },
  ];
}

/* ── Zeitreihen-Ableitung aus den Messungen ──────────────────────────────── */

/** Kennungen aller Messungen, die durch eine spaetere korrigiert wurden. */
export function korrigierteIds(messungen: VitalMessung[]): Set<string> {
  return new Set(messungen.map(x => x.korrekturVon).filter((x): x is string => !!x));
}

/** Ein Eintrag eines Parameters — Wert plus Kontext seiner Messung. */
export interface ParameterEintrag {
  messungId: string;
  messZeitpunkt: string;
  erfasstAm: string;
  nachtrag: boolean;
  wert: number | null;
  zweitwert: number | null;
  qualifier: Record<string, string>;
  nichtErhebbar: boolean;
  nichtErhebbarGrund: string;
  beurteilung: Beurteilung | null;
  beurteilungBegruendung: string;
  beurteiltVonName: string | null;
  beurteiltVonRolle: string | null;
  gemessenDurchName: string;
  gemessenDurchRolle: string;
  erhebungsart: Erhebungsart;
  /** Diese Messung wurde spaeter korrigiert — sie zaehlt nicht mehr als Wert,
   *  bleibt aber in der Einzelmessungsliste sichtbar. */
  korrigiert: boolean;
  /** Kennung der Messung, die diese ersetzt (wenn korrigiert). */
  korrigiertDurch: string | null;
  /** Diese Messung IST eine Korrektur (Verweis auf die ersetzte). */
  korrekturVon: string | null;
}

/**
 * Alle Eintraege eines Parameters, zeitlich aufsteigend. Korrigierte Messungen
 * sind enthalten und als solche gekennzeichnet — fuer Reihen und Vergleiche
 * filtert man sie mit `!e.korrigiert` heraus, fuer die Einzelmessungsliste
 * nicht: dort bleiben sie sichtbar, mit Verweis.
 */
export function eintraegeVon(messungen: VitalMessung[], code: ParameterCode): ParameterEintrag[] {
  const korrigiert = korrigierteIds(messungen);
  const ersetztDurch = new Map<string, string>();
  for (const x of messungen) if (x.korrekturVon) ersetztDurch.set(x.korrekturVon, x.id);
  const liste: ParameterEintrag[] = [];
  for (const x of messungen) {
    for (const v of x.werte) {
      if (v.parameterCode !== code) continue;
      liste.push({
        messungId: x.id, messZeitpunkt: x.messZeitpunkt, erfasstAm: x.erfasstAm, nachtrag: x.nachtrag,
        wert: v.wert, zweitwert: v.zweitwert, qualifier: v.qualifier,
        nichtErhebbar: v.nichtErhebbar, nichtErhebbarGrund: v.nichtErhebbarGrund,
        beurteilung: v.beurteilung, beurteilungBegruendung: v.beurteilungBegruendung,
        beurteiltVonName: v.beurteiltVonName, beurteiltVonRolle: v.beurteiltVonRolle,
        gemessenDurchName: x.gemessenDurchName, gemessenDurchRolle: x.gemessenDurchRolle,
        erhebungsart: x.erhebungsart,
        korrigiert: korrigiert.has(x.id), korrigiertDurch: ersetztDurch.get(x.id) ?? null,
        korrekturVon: x.korrekturVon,
      });
    }
  }
  return liste.sort((a, b) => a.messZeitpunkt.localeCompare(b.messZeitpunkt));
}

/** Nur die gueltigen Wertpunkte (ohne korrigierte, ohne Nichterhebungen). */
export function gueltigePunkte(eintraege: ParameterEintrag[]): (ParameterEintrag & { wert: number })[] {
  return eintraege.filter((e): e is ParameterEintrag & { wert: number } =>
    !e.korrigiert && !e.nichtErhebbar && e.wert !== null);
}

/* ── Veraenderung — beschriftete Differenz, keine Grafik ─────────────────── */

export interface WertPunkt {
  messZeitpunkt: string;
  wert: number;
  zweitwert: number | null;
  qualifier: Record<string, string>;
}

const anzeigeDatum = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

function vorzeichen(n: number, dezimalen = 1): string {
  const gerundet = Math.round(n * 10 ** dezimalen) / 10 ** dezimalen;
  if (gerundet > 0) return `+${gerundet}`;
  if (gerundet === 0) return "±0";
  return String(gerundet);
}

/**
 * Die Veraenderungsangabe der Uebersicht: Wert, Einheit, Richtung und
 * BEZUGSPUNKT — je Parameter ein anderer, und ohne gueltigen Vergleichswert
 * steht das im Klartext statt einer leeren Zelle. Ein fixes Kalenderfenster
 * gibt es nicht: bei seltener Messung waere es leer, bei haeufiger willkuerlich.
 */
export function veraenderungText(code: ParameterCode, punkte: WertPunkt[], einheit: string): string {
  const sortiert = [...punkte].sort((a, b) => a.messZeitpunkt.localeCompare(b.messZeitpunkt));
  if (sortiert.length === 0) return "Kein Wert erfasst.";
  const letzter = sortiert[sortiert.length - 1];

  if (code === "weight") {
    // Trend ueber die letzten Messungen, mit Nennung des tatsaechlichen Zeitraums.
    const fenster = sortiert.slice(-5);
    if (fenster.length < 2) return "Kein früherer Wert zum Vergleich.";
    const diff = letzter.wert - fenster[0].wert;
    return `${vorzeichen(diff)} ${einheit} über ${fenster.length} Messungen seit ${anzeigeDatum(fenster[0].messZeitpunkt)}`;
  }

  if (code === "temperature") {
    // Nur gegen eine Messung am selben Messort — andere Orte, andere Kurve.
    const ort = letzter.qualifier["messort"] ?? "";
    const frueher = sortiert.slice(0, -1).filter(p => (p.qualifier["messort"] ?? "") === ort);
    if (frueher.length === 0) return "Kein früherer Wert am selben Messort.";
    const bezug = frueher[frueher.length - 1];
    const ortDef = parameterDef("temperature").qualifier[0].werte.find(w => w.code === ort);
    return `${vorzeichen(letzter.wert - bezug.wert)} ${einheit} gegenüber ${anzeigeDatum(bezug.messZeitpunkt)}${ortDef ? ` (${ortDef.label})` : ""}`;
  }

  if (code === "blood_glucose") {
    // Nur im gleichen Messkontext — nuechtern gegen nuechtern.
    const kontext = letzter.qualifier["messkontext"] ?? "";
    const frueher = sortiert.slice(0, -1).filter(p => (p.qualifier["messkontext"] ?? "") === kontext);
    if (frueher.length === 0) return "Kein früherer Wert im gleichen Messkontext.";
    const bezug = frueher[frueher.length - 1];
    const kDef = parameterDef("blood_glucose").qualifier[0].werte.find(w => w.code === kontext);
    return `${vorzeichen(letzter.wert - bezug.wert)} ${einheit} gegenüber ${anzeigeDatum(bezug.messZeitpunkt)}${kDef ? ` (${kDef.label})` : ""}`;
  }

  // Standard: gegen die letzte Messung.
  if (sortiert.length < 2) return "Kein früherer Wert zum Vergleich.";
  const bezug = sortiert[sortiert.length - 2];
  if (code === "blood_pressure" && letzter.zweitwert !== null && bezug.zweitwert !== null) {
    return `${vorzeichen(letzter.wert - bezug.wert, 0)}/${vorzeichen(letzter.zweitwert - bezug.zweitwert, 0)} ${einheit} gegenüber ${anzeigeDatum(bezug.messZeitpunkt)}`;
  }
  return `${vorzeichen(letzter.wert - bezug.wert)} ${einheit} gegenüber ${anzeigeDatum(bezug.messZeitpunkt)}`;
}

/** Trendtext fuer den BERECHNETEN BMI — wie das Gewicht, mit Zeitraum. */
export function bmiVeraenderungText(punkte: { messZeitpunkt: string; bmi: number }[]): string {
  const sortiert = [...punkte].sort((a, b) => a.messZeitpunkt.localeCompare(b.messZeitpunkt));
  const fenster = sortiert.slice(-5);
  if (fenster.length < 2) return "Kein früherer Wert zum Vergleich.";
  const diff = fenster[fenster.length - 1].bmi - fenster[0].bmi;
  return `${vorzeichen(diff)} kg/m² über ${fenster.length} Messungen seit ${anzeigeDatum(fenster[0].messZeitpunkt)}`;
}
