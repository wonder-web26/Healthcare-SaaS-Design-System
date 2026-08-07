/**
 * Ärztliche Verordnung und Kostengutsprache — beide hängen am Mandat.
 *
 * Die Verordnung ist die ärztliche Anordnung. Ohne sie darf nicht abgerechnet
 * werden.
 *
 * Die Kostengutsprache ist die Zusicherung der Kasse. Fehlt sie, kann die
 * Kasse bis zu fünf Jahre rückwirkend zurückfordern — auch wenn die Leistung
 * erbracht und die Verordnung gültig war. Deshalb ist eine Zeit ohne gültige
 * Kostengutsprache hier ein eigenes Objekt (die Lücke) und keine Randnotiz.
 *
 * Beide Status werden ABGELEITET. Es gibt kein gespeichertes Statusfeld: ein
 * zweiter Wert könnte von den Daten abweichen, und bei einer Kontrolle zählt
 * das Datum, nicht die Marke.
 */
import { type EntscheidCode, entscheidDeckt } from "../stammdaten/entscheid";

/* ── Datumshilfen ──────────────────────────────────────────────────────────── */

/** TT.MM.JJJJ → Date; null bei leerem oder unlesbarem Wert. */
export function ausAnzeigedatum(wert: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((wert ?? "").trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function alsAnzeigedatum(d: Date): string {
  const zz = (n: number) => String(n).padStart(2, "0");
  return `${zz(d.getDate())}.${zz(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const TAG_MS = 24 * 60 * 60 * 1000;

/** Ganze Tage zwischen zwei Daten, Ende eingeschlossen. */
export function tageInklusive(von: Date, bis: Date): number {
  const a = Date.UTC(von.getFullYear(), von.getMonth(), von.getDate());
  const b = Date.UTC(bis.getFullYear(), bis.getMonth(), bis.getDate());
  return Math.round((b - a) / TAG_MS) + 1;
}

/** Ganze Tage zwischen zwei Daten, Ende ausgeschlossen. */
export function tageBis(von: Date, bis: Date): number {
  return tageInklusive(von, bis) - 1;
}

function plusTage(d: Date, n: number): Date {
  const k = new Date(d);
  k.setDate(k.getDate() + n);
  return k;
}

/* ── Verordnung ────────────────────────────────────────────────────────────── */

export type VerordnungsartCode = "erst" | "folge";

export interface Verordnung {
  id: string;
  /** Verweis auf das Mandat. */
  mandatId: string;
  art: VerordnungsartCode;
  verordnendeAerztin: string;
  ausstellungsdatum: string;
  gueltigAb: string;
  /** Leer = unbefristet. */
  gueltigBis: string;
  unterzeichnetAm: string;
  bemerkung: string;
  /**
   * Bedarfsmeldung: voraussichtliche Minuten je Leistungsart und Monat
   * (Art. 7 Abs. 2 lit. a bis c KLV). Leerer String heisst „nicht gemeldet",
   * nicht „null Minuten" — ohne gültige Bedarfsmeldung vergütet der
   * Versicherer nichts, und das ist etwas anderes als eine Null.
   *
   * Sie steht an der Verordnung und nicht am Leistungsplanungsblatt: gemeldet
   * wird, was die Ärztin für nötig hält; geplant wird, wie die Spitex es
   * umsetzt. Beides kann auseinanderlaufen, und genau diese Differenz ist
   * das, was bei einer Kontrolle zählt.
   */
  gemeldeteMinuten: { a: string; b: string; c: string };
}

/** Trägt die Verordnung eine ausgefüllte Bedarfsmeldung? */
export function hatBedarfsmeldung(v: Verordnung): boolean {
  const g = v.gemeldeteMinuten;
  return [g.a, g.b, g.c].some(x => x.trim() !== "");
}

export const VERORDNUNGSART = [
  { code: "erst", label: "Erstverordnung" },
  { code: "folge", label: "Folgeverordnung" },
];

export const VERORDNUNGSART_OPTIONS = VERORDNUNGSART.map(v => ({ value: v.code, label: v.label }));

export function verordnungsartLabel(code: string): string {
  return VERORDNUNGSART.find(v => v.code === code)?.label ?? "";
}

export type VerordnungZustand = "aktiv" | "ersetzt" | "abgelaufen";

/**
 * V1 — eine spätere, überschneidende Verordnung ersetzt die frühere.
 *
 * Reihenfolge der Prüfung: erst „ersetzt", dann „aktiv". Eine Verordnung, die
 * heute noch gilt, aber von einer neueren überdeckt wird, ist ersetzt — sonst
 * stünden zwei als aktiv da.
 */
export function verordnungZustand(
  v: Verordnung,
  alleDesMandats: Verordnung[],
  stichtag: Date,
): VerordnungZustand {
  const ab = ausAnzeigedatum(v.gueltigAb);
  if (!ab) return "abgelaufen";
  const bis = ausAnzeigedatum(v.gueltigBis);

  const ersetzt = alleDesMandats.some(a => {
    if (a.id === v.id) return false;
    const aAb = ausAnzeigedatum(a.gueltigAb);
    if (!aAb || aAb <= ab) return false;          // nur spätere ersetzen
    const aBis = ausAnzeigedatum(a.gueltigBis);
    // Überschneidung: die spätere beginnt, bevor diese endet.
    return !bis || aAb <= bis;
  });
  if (ersetzt) return "ersetzt";

  if (stichtag < ab) return "abgelaufen";          // noch nicht in Kraft
  if (bis && stichtag > bis) return "abgelaufen";
  return "aktiv";
}

/* ── Kostengutsprache ──────────────────────────────────────────────────────── */

export interface Kostengutsprache {
  id: string;
  mandatId: string;
  eingereichtAm: string;
  /** Leer, solange die Kasse nicht entschieden hat. */
  entscheidAm: string;
  entscheidart: EntscheidCode;
  gueltigAb: string;
  gueltigBis: string;
  /** Leer, solange nichts bewilligt ist. */
  bewilligteMinutenProWoche: string;
  bewilligteMinutenProTag: string;
  bewilligteEinsatztage: string;
  /** Pflicht bei Kürzung und Ablehnung. */
  kuerzungsgrund: string;
}

/** Frist, nach der ein ausbleibender Entscheid als Annahme gilt. */
export const STILLSCHWEIGEN_TAGE = 14;

/** Vorlauf, ab dem eine ablaufende Gültigkeit angezeigt wird. */
export const ABLAUF_VORLAUF_TAGE = 30;

/**
 * V4 — angezeigter Entscheid. Gespeichert bleibt `ausstehend`; nach vierzehn
 * Tagen ohne Antwort gilt das Blatt als angenommen, das Rückforderungsrisiko
 * bleibt davon unberührt.
 */
export function entscheidAnzeige(k: Kostengutsprache, stichtag: Date): EntscheidCode {
  if (k.entscheidart !== "ausstehend") return k.entscheidart;
  const ein = ausAnzeigedatum(k.eingereichtAm);
  if (!ein) return "ausstehend";
  return tageBis(ein, stichtag) > STILLSCHWEIGEN_TAGE ? "stillschweigend_angenommen" : "ausstehend";
}

/** Tage seit der Einreichung; null ohne lesbares Datum. */
export function tageSeitEinreichung(k: Kostengutsprache, stichtag: Date): number | null {
  const ein = ausAnzeigedatum(k.eingereichtAm);
  return ein ? tageBis(ein, stichtag) : null;
}

/** V3 — Kürzungsgrund ist bei Kürzung und Ablehnung pflichtig. */
export function v3GrundFehlt(k: Kostengutsprache): boolean {
  return (k.entscheidart === "gekuerzt" || k.entscheidart === "abgelehnt")
    && !k.kuerzungsgrund.trim();
}

/** V5 — läuft die Gültigkeit in weniger als dreissig Tagen ab? null ohne Ende. */
export function tageBisAblauf(k: Kostengutsprache, stichtag: Date): number | null {
  const bis = ausAnzeigedatum(k.gueltigBis);
  if (!bis) return null;
  const tage = tageBis(stichtag, bis);
  return tage >= 0 && tage < ABLAUF_VORLAUF_TAGE ? tage : null;
}

/** Deckt diese Kostengutsprache am Stichtag? */
export function kgsDecktAm(k: Kostengutsprache, tag: Date, stichtag: Date): boolean {
  if (!entscheidDeckt(entscheidAnzeige(k, stichtag))) return false;
  const ab = ausAnzeigedatum(k.gueltigAb);
  const bis = ausAnzeigedatum(k.gueltigBis);
  if (!ab || tag < ab) return false;
  return !bis || tag <= bis;
}

/* ── Die Lücke ─────────────────────────────────────────────────────────────── */

export interface Luecke {
  /** Erster ungedeckter Tag. */
  von: Date;
  /** Letzter ungedeckter Tag. */
  bis: Date;
  tage: number;
  /** Reicht die Lücke bis zum Stichtag? Dann ist sie offen. */
  offen: boolean;
}

/**
 * Zeiten ohne gültige Kostengutsprache.
 *
 * Gerechnet wird über die deckenden Gutsprachen: zwischen dem Ende einer und
 * dem Beginn der nächsten, sowie zwischen dem Ende der letzten und dem
 * Stichtag. Vor der ersten Gutsprache wird NICHT gerechnet — davor lief noch
 * kein Anspruch, und der Beginn des Mandats ist eine andere Frage.
 *
 * Eine Gutsprache ohne Ende schliesst alles Folgende; es entsteht keine Lücke.
 */
export function lueckenBerechnen(alle: Kostengutsprache[], stichtag: Date): Luecke[] {
  const deckend = alle
    .filter(k => entscheidDeckt(entscheidAnzeige(k, stichtag)))
    .map(k => ({ ab: ausAnzeigedatum(k.gueltigAb), bis: ausAnzeigedatum(k.gueltigBis) }))
    .filter((k): k is { ab: Date; bis: Date | null } => k.ab !== null)
    .sort((a, b) => a.ab.getTime() - b.ab.getTime());

  if (deckend.length === 0) return [];

  const luecken: Luecke[] = [];
  for (let i = 0; i < deckend.length; i++) {
    const ende = deckend[i].bis;
    if (!ende) return luecken;                     // unbefristet — nichts danach ist offen
    const naechsterBeginn = deckend[i + 1]?.ab ?? null;

    const von = plusTage(ende, 1);
    const bis = naechsterBeginn ? plusTage(naechsterBeginn, -1) : stichtag;
    if (von > bis) continue;                       // lückenlos anschliessend
    luecken.push({ von, bis, tage: tageInklusive(von, bis), offen: naechsterBeginn === null });
  }
  return luecken;
}

/** Die offene Lücke, falls es eine gibt — Grundlage des Warnbands. */
export function offeneLuecke(alle: Kostengutsprache[], stichtag: Date): Luecke | null {
  return lueckenBerechnen(alle, stichtag).find(l => l.offen) ?? null;
}
