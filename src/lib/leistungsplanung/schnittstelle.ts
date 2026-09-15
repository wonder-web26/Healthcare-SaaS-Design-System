/**
 * Schnittstelle Pflegeplanung → Leistungsplanung (Lauf 7, Ü8) — LESEND.
 *
 * Die Leistungsplanung liest den Planbestand ausschliesslich über diese
 * Datei; sie greift nie in die Pflegeplanung hinein und schreibt nie
 * zurück (Halt-Bedingung 1).
 *
 * GEMELDETER BEDARF (siehe docs/schema-delta-pflegeplan.md): Die
 * Pflegeplanung führt heute KEINE Änderungszeitstempel und KEINE Urheber
 * je Wert. Ohne sie ist der Dreiwegabgleich (Block G) nicht ableitbar.
 * Solange die Quelle das nicht liefert, trägt diese Datei einen
 * dokumentierten MOCK-Planbestand für den Testklienten P-2026-0041 —
 * jeder übernommene Wert mit Mock-Zeitstempel und Mock-Urheber. Die
 * Formen entsprechen dem echten Plan-Store (die Katalognummer ist seit
 * dem Modellwechsel zugleich die Massnahmenkennung); der Anschluss der
 * echten Quelle tauscht diese Datei, nicht die Leistungsplanung.
 *
 * HAUSWIRTSCHAFT: Ein Hauswirtschafts-Planungsmodul existiert im Repo
 * noch nicht. Der Hauswirtschaftsbestand hier ist deshalb vollständig
 * Mock — vorbelegte Nicht-KLV-Positionen mit Herkunft «hauswirtschaft»
 * (Freigabe-Entscheid 6 zum Vorbericht).
 */

/** Ein übernommener Wert samt Spur: wann zuletzt geändert, von wem.
 *  Beides ist heute Mock (siehe Kopfkommentar). */
export interface WertMitSpur<T> {
  wert: T;
  geaendertAm: string;
  geaendertVon: string;
}

/** Ein Zielbezug: das Diagnose-Ziel-Paar, das die Position trägt. */
export interface LieferZielBezug {
  diagnoseCode: string;
  diagnoseTitel: string;
  zielId: string;
  zielTitel: string;
}

/** Die Wiederholung, wie die Pflegeplanung sie führt — noch NICHT auf die
 *  LPB-Einheiten t2–t7/w/m/e abgebildet; das leistet uebernahme.ts (Ü6). */
export interface LieferWiederholung {
  art: "einmalig" | "taeglich" | "werktage" | "woechentlich" | "monatlich" | "benutzerdefiniert" | null;
  /** 0 = Montag … 6 = Sonntag; nur bei «woechentlich»/«benutzerdefiniert». */
  wochentage: number[];
  intervallN: number;
  intervallEinheit: "tage" | "wochen";
  einmalDatum: string;
}

export interface LieferPosition {
  positionsNummer: string;
  zielBezuege: LieferZielBezug[];
  anzahl: WertMitSpur<number>;
  wiederholung: WertMitSpur<LieferWiederholung>;
  /** null = die Pflegeplanung setzt keine eigene Zeit — der Katalogstandard gilt. */
  zeitMin: WertMitSpur<number | null>;
  /** Bereits im Plan erfasste Begründung einer Zeitabweichung. */
  zeitBegruendung: string;
  w: WertMitSpur<"S" | "I" | "A" | "V">;
  wNotiz: string;
  mandatId: WertMitSpur<string | null>;
  qualifikation: WertMitSpur<string | null>;
  tageszeiten: string[];
}

/** Ein Pflegeziel ohne zugeordnete Position (F8, Teil 2). */
export interface ZielOhnePosition {
  diagnoseCode: string;
  zielId: string;
  titel: string;
}

const SPUR = (am: string, von: string) => ({ geaendertAm: am, geaendertVon: von });
const FREI = SPUR("2026-07-28", "S. Frei");
const KELLER = SPUR("2026-08-03", "M. Keller");

const w = (art: LieferWiederholung["art"], rest?: Partial<LieferWiederholung>): LieferWiederholung =>
  ({ art, wochentage: [], intervallN: 2, intervallEinheit: "tage", einmalDatum: "", ...rest });

const BZ = {
  koerperpflege: { diagnoseCode: "00108", diagnoseTitel: "Selbstversorgungsdefizit Körperpflege", zielId: "Z-SELBSTPFLEGE", zielTitel: "Grösstmögliche Selbstständigkeit bei der Körperpflege" },
  haut: { diagnoseCode: "00046", diagnoseTitel: "Beeinträchtigte Hautintegrität", zielId: "Z-HAUT", zielTitel: "Die Haut bleibt intakt" },
  sturz: { diagnoseCode: "00155", diagnoseTitel: "Sturzgefahr", zielId: "Z-STURZFREI", zielTitel: "Bleibt im Beobachtungszeitraum sturzfrei" },
  balance: { diagnoseCode: "00085", diagnoseTitel: "Beeinträchtigte körperliche Mobilität", zielId: "Z-BALANCE", zielTitel: "Verbesserte Gleichgewichtsfähigkeit" },
  ernaehrung: { diagnoseCode: "00002", diagnoseTitel: "Unausgewogene Ernährung: weniger als der Bedarf", zielId: "Z-ERNAEHRUNG", zielTitel: "Ausreichende Nahrungs- und Flüssigkeitsaufnahme" },
  medikamente: { diagnoseCode: "00078", diagnoseTitel: "Unwirksames Gesundheitsmanagement", zielId: "Z-MEDIKAMENTE", zielTitel: "Medikamente werden zuverlässig eingenommen" },
  anleitung: { diagnoseCode: "00062", diagnoseTitel: "Gefahr einer Rollenüberlastung pflegender Angehöriger", zielId: "Z-ANLEITUNG", zielTitel: "Angehörige fühlen sich der Pflege gewachsen" },
} as const;

function pos(nummer: string, bezuege: LieferZielBezug[], teil: {
  anzahl: number; wiederholung: LieferWiederholung; zeitMin?: number | null;
  zeitBegruendung?: string; w?: "S" | "I" | "A" | "V"; wNotiz?: string;
  qualifikation?: string | null; tageszeiten?: string[];
}): LieferPosition {
  return {
    positionsNummer: nummer,
    zielBezuege: bezuege,
    anzahl: { wert: teil.anzahl, ...FREI },
    wiederholung: { wert: teil.wiederholung, ...FREI },
    zeitMin: { wert: teil.zeitMin ?? null, ...(teil.zeitMin != null ? KELLER : FREI) },
    zeitBegruendung: teil.zeitBegruendung ?? "",
    w: { wert: teil.w ?? "S", ...FREI },
    wNotiz: teil.wNotiz ?? "",
    mandatId: { wert: "M-2026-0041", ...FREI },
    qualifikation: { wert: teil.qualifikation ?? null, ...FREI },
    tageszeiten: teil.tageszeiten ?? [],
  };
}

/* ── Der Mock-Planbestand des Testklienten ───────────────────────────────
   Zwölf geplante Positionen aus der Pflegeplanung. Die Zahlen sind so
   gewählt, dass jeder Anzeigefall des Laufs erreichbar ist: eine Position
   mit zwei Zielbezügen (Ü4), eine benutzerdefinierte Wiederholung «alle
   2 Tage» (Ü6), eine Zeit über der Richtzeit samt übernommener Begründung
   (Ü2), Positionen ohne Katalog-Richtzeit (C7) und ein Erbringer
   ausserhalb der Spitex (C10). */
const BESTAND_P41: LieferPosition[] = [
  pos("10104", [BZ.koerperpflege], { anzahl: 1, wiederholung: w("taeglich"), tageszeiten: ["morgens"] }),
  pos("10112", [BZ.koerperpflege], { anzahl: 3, wiederholung: w("taeglich") }),
  pos("10114", [BZ.koerperpflege], { anzahl: 2, wiederholung: w("taeglich"), tageszeiten: ["morgens", "abends"] }),
  pos("10102", [BZ.koerperpflege], { anzahl: 1, wiederholung: w("woechentlich", { wochentage: [4] }) }),
  pos("10107", [BZ.koerperpflege], { anzahl: 1, wiederholung: w("benutzerdefiniert", { intervallN: 2, intervallEinheit: "tage" }) }),
  pos("10115", [BZ.haut], { anzahl: 2, wiederholung: w("taeglich") }),
  pos("10506", [BZ.sturz, BZ.balance], {
    anzahl: 1, wiederholung: w("woechentlich", { wochentage: [0, 1, 2, 3, 4, 5] }), zeitMin: 20,
    zeitBegruendung: "Rehabilitationsziel Transfer — Anleitung statt Übernahme braucht mehr Zeit.",
  }),
  pos("10302", [BZ.ernaehrung], { anzahl: 2, wiederholung: w("taeglich"), zeitMin: 20, tageszeiten: ["mittags", "abends"] }),
  pos("10505", [BZ.balance], { anzahl: 3, wiederholung: w("taeglich"), w: "I", wNotiz: "Der Ehemann begleitet die Gänge in der Wohnung." }),
  pos("10601", [BZ.medikamente], { anzahl: 1, wiederholung: w("woechentlich", { wochentage: [0] }), zeitMin: 10, qualifikation: "Dipl. Pflegefachperson HF" }),
  pos("10702", [BZ.haut], { anzahl: 1, wiederholung: w("woechentlich", { wochentage: [0, 2, 4] }), qualifikation: "Dipl. Pflegefachperson HF" }),
  pos("10909", [BZ.anleitung], { anzahl: 1, wiederholung: w("woechentlich", { wochentage: [2] }) }),
];

/** Der geplante Bestand der Pflegeplanung — je Wert mit Spur. */
export function pflegeplanBestand(patientId: string): LieferPosition[] {
  return patientId === "P-2026-0041" ? BESTAND_P41 : [];
}

/* ── Hauswirtschaft (Quellmodul existiert nicht — vollständig Mock) ────── */
export interface HauswirtschaftsPosition {
  positionsNummer: string;
  anzahl: number;
  wiederholung: LieferWiederholung;
  /** null = Katalogstandard; die Nicht-KLV-Richtzeiten sind teils «nach Bedarf». */
  zeitMin: number | null;
}

const HAUSWIRTSCHAFT_P41: HauswirtschaftsPosition[] = [
  { positionsNummer: "10507", anzahl: 1, wiederholung: w("woechentlich", { wochentage: [1] }), zeitMin: null },
  { positionsNummer: "10910", anzahl: 1, wiederholung: w("woechentlich", { wochentage: [3] }), zeitMin: 60 },
];

export function hauswirtschaftsBestand(patientId: string): HauswirtschaftsPosition[] {
  return patientId === "P-2026-0041" ? HAUSWIRTSCHAFT_P41 : [];
}

/* ── Ziele ohne Position (F8, Teil 2) ──────────────────────────────────── */
const ZIELE_OHNE_P41: ZielOhnePosition[] = [
  { diagnoseCode: "00155", zielId: "Z-WOHNUMFELD", titel: "Sicheres Wohnumfeld ohne Stolperquellen" },
];

export function zieleOhnePosition(patientId: string): ZielOhnePosition[] {
  return patientId === "P-2026-0041" ? ZIELE_OHNE_P41 : [];
}
