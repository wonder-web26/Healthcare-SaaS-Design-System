/**
 * Prüfbereitschaft — hält dieses Dossier einer Kassenkontrolle stand?
 *
 * Bei einer Kontrolle verlangt der Versicherer die Unterlagen der letzten
 * drei Monate. Bei Kaufmann sind das rund 90 Berichte und ein bis zwei Wochen
 * Arbeit — nachträglich zusammengesucht. GeKoZH Vorschlag Nr. 9 fordert die
 * Versicherer ausdrücklich auf, bei der Angehörigenpflege Qualitätskontrollen
 * durchzuführen und eine angemessene Pflege- und Verlaufsdokumentation
 * einzufordern; die Kontrolle wird häufiger, nicht seltener.
 *
 * Diese Rechnung beantwortet die Frage vorher statt nachher.
 *
 * KEIN PUNKTESYSTEM, KEINE PROZENTZAHL. Eine Kontrolle bestehen heisst nicht
 * achtzig Prozent — es heisst, dass jede verlangte Unterlage vorliegt. Eine
 * Gesamtnote verwischte genau das.
 */
import type { KLVVerordnung } from "../../types/klinische-artefakte";
import type { Verordnung, Kostengutsprache } from "../mandate/verordnungen";
import { ausAnzeigedatum, alsAnzeigedatum, lueckenBerechnen } from "../mandate/verordnungen";
import { lpbRang, lpbStatusLabel } from "../stammdaten/lpb-status";
import { srkZertifikatFehlt } from "../angehoerige/store";
import type { Angehoeriger } from "../../app/components/angehoerigeData";
import type { MonatsKennzahlen } from "../einsaetze/kontrolle";
import { MONATE } from "../einsaetze/einsaetze";

export type Zustand = "vollstaendig" | "lueckenhaft" | "fehlt";

export interface PruefZeile {
  id: string;
  unterlage: string;
  zustand: Zustand;
  /** Was genau fehlt, mit Zahlen und Daten. Leer, wenn vollständig. */
  befund: string;
  /** Ansichtsschlüssel im Dossier, wo es zu beheben ist. */
  ansicht: string;
  verweis: string;
}

/**
 * Ab diesem Zustand gilt das Leistungsplanungsblatt als unterzeichnet.
 *
 * Der Rang in der Ablaufkette entscheidet, nicht eine zweite Liste von
 * Codes — sonst liefen Kette und Prüfung auseinander, sobald ein Zustand
 * dazukommt.
 */
const UNTERZEICHNET_AB = "unterzeichnet";

export interface Zeitraum {
  von: Date;
  bis: Date;
  monate: { jahr: number; monat: number }[];
}

/** Zeitraum von n Monaten, endend im angegebenen Monat (einschliesslich). */
export function zeitraumMonate(jahr: number, monat: number, anzahl: number): Zeitraum {
  const monate: { jahr: number; monat: number }[] = [];
  for (let i = anzahl - 1; i >= 0; i--) {
    const d = new Date(jahr, monat - i, 1);
    monate.push({ jahr: d.getFullYear(), monat: d.getMonth() });
  }
  return {
    von: new Date(monate[0].jahr, monate[0].monat, 1),
    bis: new Date(jahr, monat + 1, 0),
    monate,
  };
}

export function zeitraumText(z: Zeitraum): string {
  const a = z.monate[0];
  const b = z.monate[z.monate.length - 1];
  return `${MONATE[a.monat]} ${a.jahr} bis ${MONATE[b.monat]} ${b.jahr}`;
}

export interface PruefQuellen {
  patientId: string;
  zeitraum: Zeitraum;
  blatt: KLVVerordnung | null;
  verordnungen: Verordnung[];
  kostengutsprachen: Kostengutsprache[];
  /** Hat der Pflegeplan des Patienten Pflegediagnosen? null = kein Pflegeplan. */
  pflegediagnosen: number | null;
  /** Kennzahlen je Monat des Zeitraums, in derselben Reihenfolge. */
  jeMonat: MonatsKennzahlen[];
  /** Angehörige, über die im Zeitraum abgerechnet wurde. Leer = keine. */
  abgerechnete: Angehoeriger[];
  /** Rhythmusschritte der abgerechneten Angehörigen: fällig im Zeitraum. */
  rhythmus: { faellig: number; ueberfaellig: number };
  /** Fehlende oder abgelaufene Pflichtdokumente des Patienten. */
  dokumentluecken: { fehlend: string[]; abgelegt: number };
}

/**
 * Deckt die Verordnung den ganzen Zeitraum?
 *
 * Eine Verordnung, die mitten im Zeitraum beginnt, deckt ihn nicht — für die
 * Tage davor besteht keine ärztliche Anordnung, und ohne sie darf nicht
 * abgerechnet werden.
 */
function decktGanz(v: Verordnung, z: Zeitraum): boolean {
  const ab = ausAnzeigedatum(v.gueltigAb);
  const bis = ausAnzeigedatum(v.gueltigBis);
  return (!!ab && ab <= z.von) && (!bis || bis >= z.bis);
}

export function pruefbereitschaft(q: PruefQuellen): PruefZeile[] {
  const zeilen: PruefZeile[] = [];
  const z = q.zeitraum;

  /* ── 1 · Ärztliche Verordnung ── */
  const deckend = q.verordnungen.find(v => decktGanz(v, z));
  const teilweise = q.verordnungen.find(v => {
    const ab = ausAnzeigedatum(v.gueltigAb);
    const bis = ausAnzeigedatum(v.gueltigBis);
    return (!ab || ab <= z.bis) && (!bis || bis >= z.von);
  });
  zeilen.push({
    id: "verordnung", unterlage: "Ärztliche Verordnung",
    zustand: deckend ? "vollstaendig" : teilweise ? "lueckenhaft" : "fehlt",
    befund: deckend ? ""
      : teilweise
        ? `${teilweise.id} deckt nur einen Teil des Zeitraums (gültig ${teilweise.gueltigAb}${teilweise.gueltigBis ? ` bis ${teilweise.gueltigBis}` : ", unbefristet"}).`
        : "Keine ärztliche Verordnung deckt diesen Zeitraum. Ohne sie darf nicht abgerechnet werden.",
    ansicht: "verordnung", verweis: "Verordnung",
  });

  /* ── 2 · Kostengutsprache ──
     Fehlt sie, kann die Kasse bis zu fünf Jahre rückwirkend zurückfordern —
     auch für erbrachte und ärztlich verordnete Leistungen. */
  const luecken = lueckenBerechnen(q.kostengutsprachen, z.bis)
    .filter(l => l.bis >= z.von && l.von <= z.bis);
  const hatKgs = q.kostengutsprachen.length > 0;
  zeilen.push({
    id: "kgs", unterlage: "Kostengutsprache",
    zustand: !hatKgs ? "fehlt" : luecken.length > 0 ? "lueckenhaft" : "vollstaendig",
    befund: !hatKgs
      ? "Keine Kostengutsprache am Mandat. Erbrachte Leistungen kann die Kasse bis zu fünf Jahre rückwirkend zurückfordern."
      : luecken.length > 0
        ? `${luecken.reduce((s, l) => s + l.tage, 0)} Tage ohne Deckung: ${luecken.map(l => `${alsAnzeigedatum(l.von)} bis ${alsAnzeigedatum(l.bis)}`).join(", ")}.`
        : "",
    ansicht: "verordnung", verweis: "Kostengutsprache",
  });

  /* ── 3 · Leistungsplanungsblatt unterzeichnet ── */
  const rangJetzt = q.blatt ? lpbRang(q.blatt.status) : -1;
  const rangNoetig = lpbRang(UNTERZEICHNET_AB);
  zeilen.push({
    id: "blatt", unterlage: "Leistungsplanungsblatt unterzeichnet",
    zustand: !q.blatt ? "fehlt" : rangJetzt >= rangNoetig ? "vollstaendig" : "lueckenhaft",
    befund: !q.blatt
      ? "Kein aktives Leistungsplanungsblatt."
      : rangJetzt >= rangNoetig ? ""
        : `${q.blatt.id} steht auf „${lpbStatusLabel(q.blatt.status)}" — die ärztliche Unterschrift fehlt noch.`,
    ansicht: "leistungsplanungsblatt", verweis: "Leistungsplanungsblatt",
  });

  /* ── 4 · Pflegediagnosen ── */
  zeilen.push({
    id: "diagnosen", unterlage: "Pflegediagnosen erfasst",
    zustand: q.pflegediagnosen === null ? "fehlt" : q.pflegediagnosen > 0 ? "vollstaendig" : "lueckenhaft",
    befund: q.pflegediagnosen === null
      ? "Kein Pflegeplan angelegt."
      : q.pflegediagnosen > 0 ? "" : "Der Pflegeplan besteht, trägt aber keine Pflegediagnose.",
    ansicht: "pflegeplan", verweis: "Pflegeplan",
  });

  /* ── 5 · Pflegeberichte ──
     Geprüft wird, ob einer vorliegt, nicht was darin steht. */
  const mitEinsatz = q.jeMonat.reduce((s, k) => s + k.mitEinsatz, 0);
  const mitBericht = q.jeMonat.reduce((s, k) => s + k.mitBericht, 0);
  const ohneMonate = q.jeMonat
    .map((k, i) => ({ k, m: z.monate[i] }))
    .filter(x => x.k.mitEinsatz > 0 && x.k.mitBericht === 0)
    .map(x => `${MONATE[x.m.monat]} ${x.m.jahr}`);
  zeilen.push({
    id: "berichte", unterlage: "Pflegeberichte",
    zustand: mitEinsatz === 0 ? "fehlt" : mitBericht === mitEinsatz ? "vollstaendig" : "lueckenhaft",
    befund: mitEinsatz === 0
      ? "Im Zeitraum ist kein Einsatz erfasst, zu dem ein Bericht vorliegen könnte."
      : mitBericht === mitEinsatz ? ""
        : `An ${mitEinsatz - mitBericht} von ${mitEinsatz} Tagen mit Einsatz fehlt der Bericht${ohneMonate.length > 0 ? `; ganz ohne Bericht: ${ohneMonate.join(", ")}` : ""}.`,
    ansicht: "pflegekontrolle", verweis: "Pflegekontrolle",
  });

  /* ── 6 · SRK-Zertifikat ──
     Nur, wenn über eine angehörige Person abgerechnet wurde. Ohne sie gibt es
     keine Qualifikation zu belegen, und die Zeile entfällt. */
  if (q.abgerechnete.length > 0) {
    const ohne = q.abgerechnete.filter(srkZertifikatFehlt);
    zeilen.push({
      id: "srk", unterlage: "SRK-Zertifikat der abgerechneten Angehörigen",
      zustand: ohne.length === 0 ? "vollstaendig" : "lueckenhaft",
      befund: ohne.length === 0 ? ""
        : `${ohne.map(a => `${a.vorname} ${a.nachname}`).join(", ")}: Zertifikat nicht hinterlegt.`,
      ansicht: "beziehungen", verweis: "Beziehungen",
    });
  }

  /* ── 7 · Dokumentenablage ──
     Seit die Dokumente am Patienten hängen und nicht mehr am
     Onboarding-Formular, ist die Vollständigkeit prüfbar. Dass sie heute bei
     jedem Patienten „fehlt" ergibt, ist keine Schwäche der Prüfung, sondern
     ihr Befund: es liegt nichts ab. */
  zeilen.push({
    id: "dokumente", unterlage: "Vollständigkeit der Dokumentenablage",
    zustand: q.dokumentluecken.fehlend.length === 0 ? "vollstaendig"
      : q.dokumentluecken.abgelegt === 0 ? "fehlt" : "lueckenhaft",
    befund: q.dokumentluecken.fehlend.length === 0 ? ""
      : q.dokumentluecken.abgelegt === 0
        ? `Kein Dokument abgelegt. Fehlend: ${q.dokumentluecken.fehlend.join(", ")}.`
        : `${q.dokumentluecken.fehlend.length} von ${q.dokumentluecken.fehlend.length + q.dokumentluecken.abgelegt} Pflichtdokumenten fehlen: ${q.dokumentluecken.fehlend.join(", ")}.`,
    ansicht: "pflichtluecken", verweis: "Pflichtlücken",
  });

  /* ── 8 · Betreuungsrhythmus ── */
  zeilen.push({
    id: "rhythmus", unterlage: "Betreuungsrhythmus eingehalten",
    zustand: q.rhythmus.faellig === 0 ? "fehlt" : q.rhythmus.ueberfaellig === 0 ? "vollstaendig" : "lueckenhaft",
    befund: q.rhythmus.faellig === 0
      ? "Im Zeitraum ist kein Schritt des Betreuungsrhythmus fällig geworden."
      : q.rhythmus.ueberfaellig === 0 ? ""
        : `${q.rhythmus.ueberfaellig} von ${q.rhythmus.faellig} fälligen Schritten sind überfällig.`,
    ansicht: "pendenzen", verweis: "Pendenzen",
  });

  return zeilen;
}

/**
 * Was mangels Datenmodell offen bleibt.
 *
 * Wie im Überblick: das Schweigen der Prüfung darf nicht als Unbedenklichkeit
 * gelesen werden.
 */
export const NICHT_BEURTEILBAR_CONTROLLING = [
  "Der Inhalt der Pflegeberichte — geprüft wird, ob einer vorliegt, nicht ob er trägt.",
  "Medikationsdokumentation — es besteht kein Medikationsmodell im Cockpit.",
  "Die im Vertrag zugesagte Kadenz der Betreuung (zweiwöchentlich telefonisch, monatlicher Besuch) — die Rhythmusvorlage kennt Monatsschritte, aber keine zweiwöchentliche Kontaktpflicht.",
];

export function zaehleVollstaendig(zeilen: PruefZeile[]): number {
  return zeilen.filter(z => z.zustand === "vollstaendig").length;
}
