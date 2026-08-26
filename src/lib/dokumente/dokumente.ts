/**
 * Dokument — ein abgelegtes Schriftstück, an einer Person.
 *
 * EIN MODELL FÜR PATIENTEN UND ANGEHÖRIGE. Vorher gab es drei: den
 * Typkatalog mit `scans` am Onboarding-Formular, ein eigenes
 * `AngehoerigerDokument` mit freiem Namen und ohne Typbezug, und eine fest
 * verdrahtete Ordnerstruktur am Patienten mit erfundenen Dateien. Drei
 * Wahrheiten über dieselbe Frage — welche Unterlage gehört dazu und liegt sie
 * vor — von denen keine die andere kannte.
 *
 * Der Typkatalog führt: `typCode` verweist auf `DOKUMENT_TYPEN`, der Ordner
 * folgt aus dessen `kategorie`. Die Bezeichnung bleibt frei, weil eine Datei
 * einen Namen hat, den der Katalog nicht kennt.
 *
 * GÜLTIG BIS WIRD GERECHNET, nicht erfasst: aus dem Ausstellungsdatum und der
 * Gültigkeitsdauer des Typs. Ein zweites Datum daneben liesse sich
 * widersprechen.
 */
import {
  dokumenttyp, ordnerVon, ordnerFuer, sichtbareDokumenttypen,
  type DokumentEntitaet, type DokumentKontext,
} from "../stammdaten/dokumenttypen";

export type Herkunft = "hochgeladen" | "onboarding" | "erzeugt";

export const HERKUNFT_TEXT: Record<Herkunft, string> = {
  hochgeladen: "Hochgeladen",
  onboarding: "Aus Onboarding übernommen",
  erzeugt: "Im System erzeugt",
};

/** Typisierte Referenz auf die Person — wie bei den Notizen: Art und Kennung. */
export interface DokumentReferenz {
  art: DokumentEntitaet;
  kennung: string;
}

export interface Dokument {
  id: string;
  ref: DokumentReferenz;
  /** Verweis auf DOKUMENT_TYPEN. Der Ordner folgt daraus. */
  typCode: string;
  bezeichnung: string;
  /** TT.MM.JJJJ */
  ausgestelltAm: string;
  herkunft: Herkunft;
  erfasstVon: string;
  erfasstAm: string;
  /** Verweis auf Verordnung, Kostengutsprache oder Zertifikat; null wenn keiner. */
  bezugId: string | null;
}

export function refGleich(a: DokumentReferenz, b: DokumentReferenz): boolean {
  return a.art === b.art && a.kennung === b.kennung;
}

/** Der Ordner eines Dokuments — aus dem Typ, nicht am Dokument gespeichert. */
export function ordnerDes(d: Dokument): string {
  return ordnerVon(d.typCode);
}

function ausAnzeigedatum(wert: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((wert ?? "").trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function alsAnzeigedatum(d: Date): string {
  const zz = (n: number) => String(n).padStart(2, "0");
  return `${zz(d.getDate())}.${zz(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * Gültig bis — aus Ausstellung und Dauer. Null, wenn der Typ nicht abläuft
 * oder kein Ausstellungsdatum vorliegt.
 */
export function gueltigBis(d: Dokument): Date | null {
  const typ = dokumenttyp(d.typCode);
  if (!typ || typ.gueltigkeitMonate === null) return null;
  const ab = ausAnzeigedatum(d.ausgestelltAm);
  if (!ab) return null;
  const bis = new Date(ab);
  bis.setMonth(bis.getMonth() + typ.gueltigkeitMonate);
  return bis;
}

export function gueltigBisText(d: Dokument): string {
  const bis = gueltigBis(d);
  return bis ? alsAnzeigedatum(bis) : "";
}

/**
 * Abgelaufen — nur wo eine Dauer besteht.
 *
 * Ohne hinterlegte Gültigkeitsdauer gibt es kein „abgelaufen", und die
 * Abwesenheit einer Dauer ist keine Aussage über die Gültigkeit.
 */
export function istAbgelaufen(d: Dokument, stichtag: Date): boolean {
  const bis = gueltigBis(d);
  return bis !== null && bis < stichtag;
}

/** Dokumente einer Person, neueste zuerst. */
export function dokumenteVon(alle: Dokument[], ref: DokumentReferenz): Dokument[] {
  return alle
    .filter(d => refGleich(d.ref, ref))
    .sort((a, b) => {
      const da = ausAnzeigedatum(a.ausgestelltAm);
      const db = ausAnzeigedatum(b.ausgestelltAm);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
}

export { ausAnzeigedatum as dokumentDatum, alsAnzeigedatum as dokumentDatumText };

/* ══════════════════════════════════════════
   ORDNER UND PFLICHT
   ══════════════════════════════════════════ */

export interface OrdnerStand {
  ordner: string;
  dokumente: Dokument[];
  /** Pflichttypen dieses Ordners, für die kein Dokument vorliegt. */
  fehlend: string[];
  /** Dokumente dieses Ordners, deren Gültigkeit abgelaufen ist. */
  abgelaufen: Dokument[];
}

export type OrdnerZustand = "vollstaendig" | "pflicht_fehlt" | "abgelaufen" | "leer";

export function ordnerZustand(o: OrdnerStand): OrdnerZustand {
  if (o.abgelaufen.length > 0) return "abgelaufen";
  if (o.fehlend.length > 0) return "pflicht_fehlt";
  if (o.dokumente.length === 0) return "leer";
  return "vollstaendig";
}

/**
 * Die Ordner einer Person mit ihrem Inhalt und Zustand.
 *
 * Ein Ordner ohne Dokument erscheint trotzdem — die Struktur ist fest, und
 * ein fehlender Ordner läse sich als „gibt es nicht" statt als „ist leer".
 */
export function ordnerStand(
  alle: Dokument[], ref: DokumentReferenz, kontext: DokumentKontext, stichtag: Date,
): OrdnerStand[] {
  const eigene = dokumenteVon(alle, ref);
  const pflicht = sichtbareDokumenttypen(kontext, ref.art).filter(t => t.pflicht && !t.mehrfach);
  return ordnerFuer(ref.art).map(ordner => {
    const dokumente = eigene.filter(d => ordnerVon(d.typCode) === ordner);
    return {
      ordner,
      dokumente,
      fehlend: pflicht
        .filter(t => t.kategorie === ordner && !dokumente.some(d => d.typCode === t.code))
        .map(t => t.label),
      abgelaufen: dokumente.filter(d => istAbgelaufen(d, stichtag)),
    };
  });
}

export interface Pflichtluecke {
  typCode: string;
  label: string;
  ordner: string;
  /** Warum das Dokument verlangt wird. */
  begruendung: string;
  /** Gesetzt, wenn ein Dokument vorliegt, aber abgelaufen ist. */
  abgelaufenSeit: string;
}

/**
 * Warum ein Pflichtdokument verlangt wird.
 *
 * Aus der Sichtbarkeitsbedingung des Katalogs abgeleitet: sie sagt bereits,
 * welcher Umstand das Dokument auslöst. Eine zweite Liste von Begründungen
 * liefe davon weg, sobald eine Bedingung dazukommt.
 */
const BEGRUENDUNG: Record<string, string> = {
  IMMER: "Für jede Person verlangt.",
  PARTNER_ERFORDERLICH: "Verlangt, weil ein Partner erfasst ist.",
  HAT_KINDER: "Verlangt, weil Kinder erfasst sind.",
  KINDERZULAGEN_UEBER_SPITEX: "Verlangt, weil Kinderzulagen über die Spitex laufen.",
  UNTERHALTSPFLICHT: "Verlangt wegen unterhaltspflichtiger Kinder.",
  ZERTIFIKAT_DEUTSCH_VORHANDEN: "Verlangt, weil ein Sprachzertifikat angegeben wurde.",
  SRK_ZERTIFIKAT_VORHANDEN: "Verlangt als Qualifikationsnachweis für die Pflege.",
  ASSISTENZBEITRAG_JA: "Verlangt wegen des Assistenzbeitrags.",
  NIE_IN_DOKUMENTE: "",
};

export function pflichtluecken(
  alle: Dokument[], ref: DokumentReferenz, kontext: DokumentKontext, stichtag: Date,
): Pflichtluecke[] {
  const eigene = dokumenteVon(alle, ref);
  return sichtbareDokumenttypen(kontext, ref.art)
    .filter(t => t.pflicht && !t.mehrfach)
    .map(t => {
      const vorhanden = eigene.filter(d => d.typCode === t.code);
      const abgelaufene = vorhanden.filter(d => istAbgelaufen(d, stichtag));
      /* Abgelaufen zählt wie fehlend: ein Nachweis, der nicht mehr gilt,
         belegt nichts. */
      if (vorhanden.length > 0 && abgelaufene.length === 0) return null;
      return {
        typCode: t.code, label: t.label, ordner: t.kategorie,
        begruendung: BEGRUENDUNG[t.sichtbarWenn] ?? "",
        abgelaufenSeit: abgelaufene.length > 0 ? gueltigBisText(abgelaufene[0]) : "",
      };
    })
    .filter((x): x is Pflichtluecke => x !== null);
}

/** Alle geprüften Pflichttypen — für den Satz, wenn keine Lücke besteht. */
export function geprueftePflichttypen(kontext: DokumentKontext, art: DokumentEntitaet): string[] {
  return sichtbareDokumenttypen(kontext, art)
    .filter(t => t.pflicht && !t.mehrfach)
    .map(t => t.label);
}
