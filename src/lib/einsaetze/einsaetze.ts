/**
 * Einsatz und erbrachte Leistung.
 *
 * Ein Einsatz hält fest, wer wann wie lange bei welchem Patienten war. Eine
 * erbrachte Leistung hält fest, welche Position des Leistungsplanungsblatts
 * dabei in welchem Umfang geleistet wurde.
 *
 * Der Urheber ist eine Mitarbeitende ODER eine angehörige Person. Beide Arten
 * müssen dasselbe Feld füllen können — die angehörige Person ist bei der
 * Spitex angestellt und erfasst täglich, die diplomierte Pflegefachperson
 * prüft wöchentlich.
 *
 * Zur Form des Urhebers: für angehörige Personen besteht ein Bestand mit
 * Kennungen (A-…), für Mitarbeitende bewusst keiner — Personaladministration
 * liegt ausserhalb des Produktumfangs, sie erscheinen überall als Name. Der
 * Urheber bildet genau das ab, statt ein Register zu erfinden.
 *
 * NICHT ERBRACHT IST EINE ANGABE, KEIN WEGLASSEN. Wer eine geplante Position
 * nicht erbringt, nennt den Grund — sonst ist beim Controlling nicht
 * unterscheidbar, ob sie vergessen wurde oder nicht nötig war.
 */
import type { EinsatzZustandCode, PruefzustandCode } from "../stammdaten/einsatz";

export type EinsatzUrheber =
  | { art: "mitarbeitende"; name: string }
  | { art: "angehoeriger"; kennung: string };

export interface ErbrachteLeistung {
  id: string;
  einsatzId: string;
  /** Verweis auf die Position des Blattes (LP-…). */
  positionId: string;
  minuten: number;
  erbracht: boolean;
  /** Pflicht, wenn nicht erbracht oder die Zeit abweicht. */
  grund: string;
}

/**
 * Eine Fassung des Pflegeberichts.
 *
 * Der Urheber steht hier und nicht am Einsatz: den Bericht schreibt nicht
 * zwingend, wer den Einsatz geleistet hat. Ergänzt die Fachperson bei der
 * Kontrolle einen Text, stünde er sonst unter dem Namen der angehörigen
 * Person.
 */
export interface Berichtfassung {
  text: string;
  von: string;
  /** TT.MM.JJJJ HH:MM */
  am: string;
}

export interface Einsatz {
  id: string;
  patientId: string;
  /** TT.MM.JJJJ */
  datum: string;
  /** HH:MM */
  von: string;
  bis: string;
  erbrachtDurch: EinsatzUrheber;
  zustand: EinsatzZustandCode;
  pruefzustand: PruefzustandCode;
  /** Prüfvermerk der Fachperson — heute die Rückfrage. Nicht der Bericht. */
  bemerkung: string;
  /**
   * Pflegebericht des Tages, alle Fassungen in Reihenfolge — die letzte gilt.
   *
   * Ein eigenes Feld, nicht `bemerkung`: dort steht der Prüfvermerk der
   * Fachperson. Zwei Bedeutungen in einem Feld liessen später nicht mehr
   * unterscheiden, wer was geschrieben hat. Ein eigenes Objekt ist es
   * bewusst nicht — der Text gehört zum Einsatz.
   *
   * Eine Liste statt eines Textes, weil Überschreiben in der Pflege-
   * dokumentation nichts vernichten darf: was einmal dokumentiert wurde,
   * bleibt lesbar. Angezeigt wird die letzte Fassung, aufbewahrt werden alle.
   * Leere Liste heisst „kein Bericht" — nicht ein Bericht ohne Text.
   */
  berichtFassungen: Berichtfassung[];
  /** Gesetzt bei einem Nachtrag: Kennung des korrigierten Einsatzes. */
  korrigiert: string | null;
}

/**
 * Ein geprüfter Einsatz ist nicht mehr änderbar. Korrekturen erfolgen als
 * Nachtrag mit Verweis auf den Ursprung; beide bleiben sichtbar. Ein Einsatz
 * im Zustand `zu_pruefen` ist änderbar, einer mit Rückfrage ebenfalls — die
 * Rückfrage ist ja gerade die Aufforderung, ihn zu berichtigen.
 */
export function istUnveraenderbar(e: Einsatz): boolean {
  return e.pruefzustand === "geprueft";
}

/** Die geltende Fassung des Pflegeberichts, oder null wenn keiner besteht. */
export function aktuelleFassung(e: Einsatz): Berichtfassung | null {
  return e.berichtFassungen.length ? e.berichtFassungen[e.berichtFassungen.length - 1] : null;
}

/** Frühere Fassungen, neueste zuerst. Leer, solange nie geändert wurde. */
export function fruehereFassungen(e: Einsatz): Berichtfassung[] {
  return e.berichtFassungen.slice(0, -1).reverse();
}

/** Weicht der Einsatz vom Plan ab — nicht erbrachte Position oder Zeitgrund? */
export function hatAbweichung(leistungen: ErbrachteLeistung[]): boolean {
  return leistungen.some(l => !l.erbracht || l.grund.trim() !== "");
}

/* ── Datum und Bezeichnungen ───────────────────────────────────────────────── */

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

export const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WOCHENTAGE_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"];

/* ── Monatsrechnung ────────────────────────────────────────────────────────── */

export interface Monatstag {
  datum: string;
  /** 1..31 */
  nummer: number;
  /** 0 = Montag */
  wochentag: number;
  einsaetze: Einsatz[];
  /** Erbrachte Minuten aus täglich verordneten Positionen. */
  ist: number;
  /** Tagessoll — Summe der täglich verordneten Positionen. */
  soll: number;
  /** ist − soll. Negativ = weniger erbracht. */
  abweichung: number;
  /**
   * Minuten aus Positionen, die im Zeitraum verordnet sind.
   *
   * Sie stehen ausserhalb der Tagesabweichung: eine Wochenleistung, die heute
   * erbracht wurde, ist kein Mehraufwand des Tages, sondern ein Teil ihres
   * Zeitraums. Zählte sie mit, erschiene jeder solche Tag als Überschreitung.
   */
  periodisch: number;
  /** Kein Einsatz erfasst, obwohl ein Soll besteht. */
  fehlt: boolean;
  hatBericht: boolean;
  /** Mindestens ein Einsatz des Tages wartet noch auf Prüfung. */
  offen: boolean;
}

/**
 * Die Tage eines Monats mit Ist, Soll und Abweichung.
 *
 * Der Kalender rastert nach Wochentagen: Muster richten sich untereinander
 * aus. Fehlt jeder Sonntag, steht das in einer Spalte.
 */
export function monatAufteilen(
  einsaetze: Einsatz[],
  leistungenVon: (einsatzId: string) => ErbrachteLeistung[],
  jahr: number,
  monat: number,
  sollProTag: number,
  /** Gehört die Position zum Tagessoll? Ohne Blatt zählt nichts als täglich. */
  istTaeglichePosition: (positionId: string) => boolean,
): Monatstag[] {
  const tage: Monatstag[] = [];
  const letzter = new Date(jahr, monat + 1, 0).getDate();
  for (let n = 1; n <= letzter; n++) {
    const d = new Date(jahr, monat, n);
    const datum = alsAnzeigedatum(d);
    const desTages = einsaetze.filter(e => e.datum === datum);
    const erbracht = desTages
      .filter(e => e.zustand === "erbracht")
      .flatMap(e => leistungenVon(e.id))
      .filter(l => l.erbracht);
    const ist = erbracht.filter(l => istTaeglichePosition(l.positionId))
      .reduce((s, l) => s + l.minuten, 0);
    const periodisch = erbracht.filter(l => !istTaeglichePosition(l.positionId))
      .reduce((s, l) => s + l.minuten, 0);
    tage.push({
      datum, nummer: n, wochentag: (d.getDay() + 6) % 7,
      einsaetze: desTages, ist, soll: sollProTag, abweichung: ist - sollProTag, periodisch,
      fehlt: sollProTag > 0 && desTages.length === 0,
      hatBericht: desTages.some(e => e.berichtFassungen.length > 0),
      offen: desTages.some(e => e.pruefzustand !== "geprueft"),
    });
  }
  return tage;
}

/**
 * Wie oft und an welchen Tagen eine Position im Monat erbracht wurde.
 *
 * Bewusst ohne Aussage darüber, an welchem Tag sie gefehlt hat: das Blatt
 * kennt keinen Wochentagsplan, also ist nur die Anzahl im Zeitraum prüfbar.
 */
export function periodischeBilanz(
  tage: Monatstag[],
  leistungenVon: (einsatzId: string) => ErbrachteLeistung[],
  positionId: string,
): { anzahl: number; minuten: number; tage: Monatstag[] } {
  const getroffen = tage.filter(t =>
    t.einsaetze.some(e => e.zustand === "erbracht"
      && leistungenVon(e.id).some(l => l.positionId === positionId && l.erbracht)));
  const minuten = getroffen.flatMap(t => t.einsaetze).flatMap(e => leistungenVon(e.id))
    .filter(l => l.positionId === positionId && l.erbracht)
    .reduce((s, l) => s + l.minuten, 0);
  return { anzahl: getroffen.length, minuten, tage: getroffen };
}

/**
 * Abweichung getrennt nach Richtung.
 *
 * Netto verdeckt, dass an einem Tag zu viel gestempelt wurde — und zu viel ist
 * bei einer Kassenkontrolle das grössere Problem. Deshalb werden beide
 * Richtungen einzeln summiert, nicht nur ihre Differenz.
 *
 * Innerhalb von „zu wenig" wird nochmals getrennt: ein Tag ohne jeden Einsatz
 * ist kein knapper Einsatz, sondern ein ausgefallener. Beides in einer Summe
 * liesse den einen Fall im anderen verschwinden.
 */
export function abweichungNachRichtung(tage: Monatstag[]): {
  netto: number; zuWenig: number; zuWenigErbracht: number; ausgefallen: number;
  zuViel: number; ist: number; soll: number; periodisch: number;
} {
  let zuWenig = 0, zuWenigErbracht = 0, ausgefallen = 0, zuViel = 0, ist = 0, soll = 0, periodisch = 0;
  for (const t of tage) {
    ist += t.ist;
    soll += t.soll;
    periodisch += t.periodisch;
    if (t.abweichung < 0) {
      zuWenig += -t.abweichung;
      if (t.fehlt) ausgefallen += -t.abweichung;
      else zuWenigErbracht += -t.abweichung;
    } else if (t.abweichung > 0) zuViel += t.abweichung;
  }
  return { netto: ist - soll, zuWenig, zuWenigErbracht, ausgefallen, zuViel, ist, soll, periodisch };
}

/**
 * Fällt jeder fehlende Tag auf denselben Wochentag? Dann ist es ein Muster
 * und keine Reihe von Zufällen.
 */
export function fehlendeTageMuster(tage: Monatstag[]): { tage: Monatstag[]; wochentag: number | null } {
  const fehlend = tage.filter(t => t.fehlt);
  if (fehlend.length < 2) return { tage: fehlend, wochentag: null };
  const erster = fehlend[0].wochentag;
  return { tage: fehlend, wochentag: fehlend.every(t => t.wochentag === erster) ? erster : null };
}

export { ausAnzeigedatum, alsAnzeigedatum };
