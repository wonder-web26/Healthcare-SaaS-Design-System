/**
 * Bestand der Einsätze und erbrachten Leistungen — Sitzungsdauer.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts: Modulzustand hinter
 * useSyncExternalStore, benannte Schreibwege, keine Zugriffe auf innere
 * Strukturen von aussen.
 *
 * Jede schreibende Funktion prüft zuerst die Unveränderbarkeit. Ein geprüfter
 * Einsatz wird nicht mehr angefasst; wer korrigieren will, legt einen Nachtrag
 * an, der auf den Ursprung verweist. Beide bleiben sichtbar — beim Controlling
 * zählt, was dokumentiert wurde, nicht was zuletzt dastand.
 *
 * Der Startbestand deckt einen vollen Monat für Herrn Steiner ab (Juli 2026)
 * und eine Woche für Frau Zimmermann. Ein Monat, weil sich erst über diese
 * Länge zeigt, was die Kontrolle finden soll: ein Wochentag, der regelmässig
 * ausfällt, ein Tag mit weniger als geplant und einer mit mehr. Erbracht durch
 * die am Mandat abgerechnete angehörige Person, Positionen und Minuten aus
 * dem jeweils aktiven Leistungsplanungsblatt.
 */
import { useSyncExternalStore } from "react";
import type { Einsatz, ErbrachteLeistung, EinsatzUrheber } from "./einsaetze";
import { istUnveraenderbar } from "./einsaetze";

/** Bezugsmonat der Mock-Demo: Juli 2026. Startwert der Zeitraumschaltung. */
export const EINSATZ_BEZUGSMONAT = new Date(2026, 6, 1);

const VERA: EinsatzUrheber = { art: "angehoeriger", kennung: "A-2026-0101" };
const KARL: EinsatzUrheber = { art: "angehoeriger", kennung: "A-2026-0109" };
/* Die Multi-Author-Erkennung braucht beide Arten: die angehörige Person erfasst
   täglich, die diplomierte Pflegefachperson übernimmt einzelne Einsätze selbst.
   Mitarbeitende erscheinen als Name — es gibt für sie kein Register. */
const SANDRA: EinsatzUrheber = { art: "mitarbeitende", name: "Sandra Weber" };

/* ── Startbestand ──────────────────────────────────────────────────────────── */

interface TagVorlage {
  datum: string;
  von: string;
  bis: string;
  /** [PositionsId, Minuten, erbracht, Grund] */
  leistungen: [string, number, boolean, string][];
  bericht?: string;
  pruefzustand?: Einsatz["pruefzustand"];
}

/**
 * Steiner, KLV-2026-101 — Juli 2026, ohne Sonntage.
 *
 * Erfasst wird nach der Häufigkeit des Blattes, nicht nach einem Mittelwert:
 * die täglich verordneten Positionen LP-S3/S4/S5/S8 an jedem erfassten Tag
 * (29 Min. Tagessoll), die dreimal wöchentlich verordneten LP-S6/S7 nur an
 * Montag, Mittwoch und Freitag. LP-S7 entfällt an vier dieser Tage — so
 * unterschreitet genau eine periodische Position ihre Verordnung.
 *
 * LP-S1 und LP-S2 sind einmalig und erscheinen hier nicht: sie sind gegen
 * keinen Zeitraum prüfbar.
 */
const STEINER_MONAT: TagVorlage[] = [
  { datum: "01.07.2026", von: "08:00", bis: "09:10", pruefzustand: "geprueft",
    bericht: "Herr Steiner war wach und ansprechbar. Der Blutzucker lag im gewohnten Bereich.\n\nBeim Gehen im Flur brauchte er heute keine Stütze, nur Begleitung.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "02.07.2026", von: "08:00", bis: "08:29", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "03.07.2026", von: "08:00", bis: "09:10", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "04.07.2026", von: "08:00", bis: "08:29", pruefzustand: "geprueft",
    bericht: "Etwas müde. Beim Aufstehen unsicherer als sonst, ich bin die ganze Strecke mitgegangen.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "06.07.2026", von: "08:00", bis: "09:10", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "07.07.2026", von: "08:00", bis: "08:29", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "08.07.2026", von: "08:00", bis: "08:55", pruefzustand: "geprueft",
    bericht: "Guter Tag. Er hat von seiner Zeit bei der Post erzählt und war beim Waschen fast selbstständig.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""]] },
  { datum: "09.07.2026", von: "08:00", bis: "08:29", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "10.07.2026", von: "08:00", bis: "09:10", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "11.07.2026", von: "08:00", bis: "08:19", pruefzustand: "geprueft",
    bericht: "Rechtes Knie schmerzt beim Aufstehen. Habe ihm mehr Zeit gelassen und die Blutentnahme auf morgen verschoben — er hatte sehr kalte Hände.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 0, false, "Herr Steiner hatte sehr kalte Hände, die Kapillarblutentnahme war nicht möglich. Auf morgen verschoben."], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "13.07.2026", von: "08:00", bis: "09:10", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "14.07.2026", von: "08:00", bis: "08:29", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "15.07.2026", von: "08:00", bis: "09:10", pruefzustand: "geprueft",
    bericht: "Unverändert. Appetit gut, Blutdruck im gewohnten Rahmen, keine Auffälligkeiten.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "16.07.2026", von: "08:00", bis: "08:29", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "17.07.2026", von: "08:00", bis: "08:55", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""]] },
  { datum: "18.07.2026", von: "08:00", bis: "08:29", pruefzustand: "zu_pruefen",
    bericht: "Nach dem Mittagsschlaf kurz verwirrt gewirkt, nach zwanzig Minuten wieder klar.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "20.07.2026", von: "08:00", bis: "09:10", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "21.07.2026", von: "08:00", bis: "08:29", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "22.07.2026", von: "07:55", bis: "09:12", pruefzustand: "zu_pruefen",
    bericht: "Blutdruck etwas tiefer als sonst gemessen, ihm ging es dabei gut.",
    leistungen: [["LP-S3", 8, true, ""], ["LP-S4", 12, true, ""], ["LP-S5", 6, true, ""], ["LP-S8", 10, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "23.07.2026", von: "08:00", bis: "08:29", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "24.07.2026", von: "08:00", bis: "08:55", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""]] },
  { datum: "25.07.2026", von: "08:00", bis: "08:29", pruefzustand: "zu_pruefen",
    bericht: "Er wollte heute allein duschen. Ich habe vor der Tür gewartet.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "27.07.2026", von: "08:00", bis: "09:10", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
  { datum: "28.07.2026", von: "08:00", bis: "08:29", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "29.07.2026", von: "08:00", bis: "08:55", pruefzustand: "zu_pruefen",
    bericht: "Ruhiger Tag, nichts Besonderes zu berichten.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""]] },
  { datum: "30.07.2026", von: "08:00", bis: "08:29", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "31.07.2026", von: "08:00", bis: "09:10", pruefzustand: "zu_pruefen",
    bericht: "Tochter war zu Besuch, er war sehr aufgeräumt.",
    leistungen: [["LP-S3", 6, true, ""], ["LP-S4", 10, true, ""], ["LP-S5", 5, true, ""], ["LP-S8", 8, true, ""], ["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""]] },
];

/** An diesem Tag übernahm die Pflegefachkraft — andere Urheberart. */
const STEINER_FACHPERSON_TAG = "18.07.2026";

/**
 * Zimmermann, KLV-2026-033 — eine Woche.
 *
 * LP-Z2 ist täglich zweimal verordnet (16 Min. Tagessoll), LP-Z1 dreimal
 * wöchentlich. Der Donnerstag fehlt ganz — die Lücke der Woche.
 */
const ZIMMERMANN_WOCHE: TagVorlage[] = [
  { datum: "27.07.2026", von: "07:30", bis: "08:12", leistungen: [["LP-Z2", 16, true, ""], ["LP-Z1", 26, true, ""]] },
  { datum: "28.07.2026", von: "07:30", bis: "07:46", leistungen: [["LP-Z2", 16, true, ""]] },
  { datum: "29.07.2026", von: "07:30", bis: "08:12", leistungen: [["LP-Z2", 16, true, ""], ["LP-Z1", 26, true, ""]] },
  /* 30.07.2026 fehlt — die Lücke der Woche. */
  { datum: "31.07.2026", von: "07:30", bis: "08:12", leistungen: [["LP-Z2", 16, true, ""], ["LP-Z1", 26, true, ""]] },
  { datum: "01.08.2026", von: "08:00", bis: "08:16", leistungen: [["LP-Z2", 16, true, ""]] },
  { datum: "02.08.2026", von: "08:00", bis: "08:16", leistungen: [["LP-Z2", 16, true, ""]] },
];

/** Kurzname für den Bericht — Mitarbeitende haben einen Namen, Angehörige eine Kennung. */
function urheberKurz(u: EinsatzUrheber): string {
  return u.art === "mitarbeitende" ? u.name : u.kennung;
}

function bauen(patientId: string, urheber: EinsatzUrheber, praefix: string, woche: TagVorlage[]) {
  const einsaetze: Einsatz[] = [];
  const leistungen: ErbrachteLeistung[] = [];
  woche.forEach((t, i) => {
    const id = `${praefix}-${String(i + 1).padStart(2, "0")}`;
    const wer = t.datum === STEINER_FACHPERSON_TAG && patientId === "P-2026-0041" ? SANDRA : urheber;
    einsaetze.push({
      id, patientId, datum: t.datum, von: t.von, bis: t.bis,
      erbrachtDurch: wer,
      zustand: "erbracht", pruefzustand: t.pruefzustand ?? "zu_pruefen",
      bemerkung: "", korrigiert: null,
      /* Im Startbestand hat den Bericht geschrieben, wer den Einsatz geleistet
         hat. Das ist der Regelfall, nicht die Vorschrift — beim Bearbeiten
         trägt jede Fassung den, der sie tatsächlich verfasst hat. */
      berichtFassungen: t.bericht
        ? [{ text: t.bericht, von: urheberKurz(wer), am: `${t.datum} ${t.bis}` }]
        : [],
    });
    t.leistungen.forEach(([positionId, minuten, erbracht, grund], k) => {
      leistungen.push({ id: `${id}-L${k + 1}`, einsatzId: id, positionId, minuten, erbracht, grund });
    });
  });
  return { einsaetze, leistungen };
}

const steiner = bauen("P-2026-0041", VERA, "EIN-2026-S", STEINER_MONAT);
const zimmermann = bauen("P-2026-0049", KARL, "EIN-2026-Z", ZIMMERMANN_WOCHE);

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let einsaetze: Einsatz[] = [...steiner.einsaetze, ...zimmermann.einsaetze];
let leistungen: ErbrachteLeistung[] = [...steiner.leistungen, ...zimmermann.leistungen];
const hoerer = new Set<() => void>();

function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const eSchnappschuss = () => einsaetze;
const lSchnappschuss = () => leistungen;

export function useEinsaetze(): Einsatz[] {
  return useSyncExternalStore(subscribe, eSchnappschuss, eSchnappschuss);
}

export function useErbrachteLeistungen(): ErbrachteLeistung[] {
  return useSyncExternalStore(subscribe, lSchnappschuss, lSchnappschuss);
}

export function getEinsaetze(patientId: string): Einsatz[] {
  return einsaetze.filter(e => e.patientId === patientId);
}

export function getLeistungen(einsatzId: string): ErbrachteLeistung[] {
  return leistungen.filter(l => l.einsatzId === einsatzId);
}

/** Einsatz samt Unveränderbarkeitsprüfung; null heisst „nicht schreiben". */
function schreibbar(id: string): Einsatz | null {
  const e = einsaetze.find(x => x.id === id);
  if (!e || istUnveraenderbar(e)) return null;
  return e;
}

/* ── Schreiben ─────────────────────────────────────────────────────────────── */

/** Einsatz als geprüft bestätigen. */
export function einsatzBestaetigen(id: string): void {
  const e = schreibbar(id);
  if (!e) return;
  einsaetze = einsaetze.map(x => (x.id === id ? { ...x, pruefzustand: "geprueft" } : x));
  melden();
}

/** Rückfrage stellen: der Einsatz bleibt offen, die Pendenz entsteht daneben. */
export function einsatzRueckfrage(id: string, bemerkung: string): void {
  const e = schreibbar(id);
  if (!e) return;
  einsaetze = einsaetze.map(x => (x.id === id ? { ...x, pruefzustand: "rueckfrage", bemerkung } : x));
  melden();
}

/** Felder eines noch nicht geprüften Einsatzes ändern. */
export function einsatzAendern(id: string, felder: Partial<Omit<Einsatz, "id" | "patientId" | "korrigiert">>): void {
  const e = schreibbar(id);
  if (!e) return;
  einsaetze = einsaetze.map(x => (x.id === id ? { ...x, ...felder } : x));
  melden();
}

/** Erbrachte Leistung eines noch nicht geprüften Einsatzes ändern. */
export function leistungAendern(id: string, felder: Partial<Omit<ErbrachteLeistung, "id" | "einsatzId">>): void {
  const l = leistungen.find(x => x.id === id);
  if (!l || !schreibbar(l.einsatzId)) return;
  leistungen = leistungen.map(x => (x.id === id ? { ...x, ...felder } : x));
  melden();
}

/**
 * Eine neue Fassung des Pflegeberichts anfügen.
 *
 * Bewusst nicht über `schreibbar()`: die Prüfung sperrt die Leistungsdaten,
 * gegen die abgerechnet wird — nicht die Beschreibung dessen, was geschehen
 * ist. Fällt einer Fachperson nach der Prüfung etwas ein, das dokumentiert
 * gehört, darf die Prüfung sie nicht daran hindern. Der Prüfzustand bleibt
 * darum unberührt, und keine Fassung wird überschrieben.
 */
export function berichtSchreiben(einsatzId: string, text: string, von: string, jetzt: string): void {
  const e = einsaetze.find(x => x.id === einsatzId);
  if (!e || !text.trim()) return;
  const fassung = { text: text.trim(), von, am: jetzt };
  einsaetze = einsaetze.map(x =>
    (x.id === einsatzId ? { ...x, berichtFassungen: [...x.berichtFassungen, fassung] } : x));
  melden();
}

/**
 * Nachtrag zu einem geprüften Einsatz: ein neuer Einsatz, der auf den
 * Ursprung verweist. Der Ursprung bleibt unverändert stehen.
 */
export function nachtragAnlegen(ursprungId: string): Einsatz | null {
  const alt = einsaetze.find(e => e.id === ursprungId);
  if (!alt) return null;
  const neu: Einsatz = {
    ...alt,
    id: `${alt.id}-N${einsaetze.filter(e => e.korrigiert === ursprungId).length + 1}`,
    pruefzustand: "zu_pruefen",
    korrigiert: ursprungId,
  };
  const kopien = getLeistungen(ursprungId).map((l, i) => ({ ...l, id: `${neu.id}-L${i + 1}`, einsatzId: neu.id }));
  einsaetze = [...einsaetze, neu];
  leistungen = [...leistungen, ...kopien];
  melden();
  return neu;
}
