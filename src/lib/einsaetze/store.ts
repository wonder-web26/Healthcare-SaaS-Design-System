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
 * Tagessoll ist das Wochensoll durch sieben (47 Min.), weil das Blatt zwar
 * Rhythmen kennt, aber keinen Wochenplan. Ein Regeltag erfasst genau diese
 * 47 Minuten; erfasste Minuten sind die tatsächlichen, nicht die geplanten.
 */
const STEINER_MONAT: TagVorlage[] = [
  { datum: "01.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "Herr Steiner war wach und ansprechbar. Frühstück selbstständig eingenommen, Kreislauf stabil.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "02.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "03.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "04.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "Etwas müde heute. Beim Gehen unsicherer als sonst, ich bin die ganze Strecke mitgegangen.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "06.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "07.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "08.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "Guter Tag. Er hat von früher erzählt und war beim Ankleiden fast selbstständig.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "09.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "10.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "11.07.2026", von: "08:00", bis: "08:32", pruefzustand: "geprueft",
    bericht: "Rechtes Knie schmerzt beim Aufstehen. Habe ihm mehr Zeit gelassen.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 0, false, "Herr Steiner hatte Schmerzen im Knie und wollte im Bett bleiben; das Ankleiden entfiel."], ["LP-S8", 6, true, ""]] },
  { datum: "13.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "14.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "15.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "Unverändert. Appetit gut, keine Auffälligkeiten.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "16.07.2026", von: "08:00", bis: "08:47", pruefzustand: "geprueft",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "17.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "18.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "Nach dem Mittagsschlaf verwirrt gewirkt, nach zwanzig Minuten wieder klar.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "20.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "21.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "22.07.2026", von: "07:55", bis: "08:50", pruefzustand: "zu_pruefen",
    bericht: "Blutdruck etwas tiefer als sonst gemessen, ihm ging es dabei gut.",
    leistungen: [["LP-S6", 30, true, ""], ["LP-S7", 17, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "23.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "24.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "25.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "Er wollte heute allein duschen. Ich habe vor der Tür gewartet.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "27.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "28.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "29.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "Ruhiger Tag, nichts Besonderes zu berichten.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "30.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
  { datum: "31.07.2026", von: "08:00", bis: "08:47", pruefzustand: "zu_pruefen",
    bericht: "Tochter war zu Besuch, er war sehr aufgeräumt.",
    leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 6, true, ""]] },
];

/** An diesem Tag übernahm die Pflegefachkraft — andere Urheberart. */
const STEINER_FACHPERSON_TAG = "18.07.2026";

/** Zimmermann, KLV-2026-033: LP-Z1 dreimal, LP-Z2 zweimal täglich. Do fehlt. */
const ZIMMERMANN_WOCHE: TagVorlage[] = [
  { datum: "27.07.2026", von: "07:30", bis: "08:12", leistungen: [["LP-Z1", 26, true, ""], ["LP-Z2", 16, true, ""]] },
  { datum: "28.07.2026", von: "07:30", bis: "07:46", leistungen: [["LP-Z2", 16, true, ""]] },
  { datum: "29.07.2026", von: "07:30", bis: "08:12", leistungen: [["LP-Z1", 26, true, ""], ["LP-Z2", 16, true, ""]] },
  /* 30.07.2026 fehlt — die Lücke der Woche. */
  { datum: "31.07.2026", von: "07:30", bis: "08:12", leistungen: [["LP-Z1", 26, true, ""], ["LP-Z2", 16, true, ""]] },
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
    einsaetze.push({
      id, patientId, datum: t.datum, von: t.von, bis: t.bis,
      erbrachtDurch: t.datum === STEINER_FACHPERSON_TAG && patientId === "P-2026-0041" ? SANDRA : urheber,
      zustand: "erbracht", pruefzustand: t.pruefzustand ?? "zu_pruefen",
      bemerkung: "", korrigiert: null,
      bericht: t.bericht ?? "",
      berichtVon: t.bericht ? urheberKurz(urheber) : "",
      berichtAm: t.bericht ? `${t.datum} ${t.bis}` : "",
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
