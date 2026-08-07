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
 * Der Startbestand deckt eine Woche für zwei Patienten ab: eine vollständige
 * mit einem Abweichungstag und eine mit einem fehlenden Tag. Erbracht durch
 * die am Mandat abgerechnete angehörige Person, Positionen und Minuten aus
 * dem jeweils aktiven Leistungsplanungsblatt.
 */
import { useSyncExternalStore } from "react";
import type { Einsatz, ErbrachteLeistung, EinsatzUrheber } from "./einsaetze";
import { istUnveraenderbar } from "./einsaetze";

/** Bezugswoche der Mock-Demo: Montag 27.07.2026 bis Sonntag 02.08.2026. */
export const EINSATZ_BEZUGSWOCHE = new Date(2026, 6, 27);

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
}

/** Steiner, KLV-2026-101: LP-S6/S7 dreimal die Woche, LP-S8 täglich. */
const STEINER_WOCHE: TagVorlage[] = [
  { datum: "27.07.2026", von: "08:00", bis: "08:50", leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "28.07.2026", von: "08:00", bis: "08:10", leistungen: [["LP-S8", 8, true, ""]] },
  { datum: "29.07.2026", von: "08:00", bis: "08:50", leistungen: [["LP-S6", 26, true, ""], ["LP-S7", 15, true, ""], ["LP-S8", 8, true, ""]] },
  { datum: "30.07.2026", von: "08:05", bis: "08:15", leistungen: [["LP-S8", 8, true, ""]] },
  /* Abweichungstag: das An- und Auskleiden entfiel, der Grund steht dabei —
     nicht erbracht ist eine Angabe, kein Weglassen. */
  { datum: "31.07.2026", von: "08:00", bis: "08:36", leistungen: [
    ["LP-S6", 26, true, ""],
    ["LP-S7", 0, false, "Herr Steiner war bereits angekleidet, als ich kam — seine Tochter war vor mir da."],
    ["LP-S8", 8, true, ""]] },
  { datum: "01.08.2026", von: "09:00", bis: "09:10", leistungen: [["LP-S8", 8, true, ""]] },
  { datum: "02.08.2026", von: "09:00", bis: "09:10", leistungen: [["LP-S8", 8, true, ""]] },
];

/** Am Sonntag übernahm die Pflegefachkraft — derselbe Patient, andere Urheberart. */
const STEINER_SONNTAG_URHEBER = "02.08.2026";

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

function bauen(patientId: string, urheber: EinsatzUrheber, praefix: string, woche: TagVorlage[]) {
  const einsaetze: Einsatz[] = [];
  const leistungen: ErbrachteLeistung[] = [];
  woche.forEach((t, i) => {
    const id = `${praefix}-${String(i + 1).padStart(2, "0")}`;
    einsaetze.push({
      id, patientId, datum: t.datum, von: t.von, bis: t.bis,
      erbrachtDurch: t.datum === STEINER_SONNTAG_URHEBER && patientId === "P-2026-0041" ? SANDRA : urheber,
      zustand: "erbracht", pruefzustand: "zu_pruefen",
      bemerkung: "", korrigiert: null,
    });
    t.leistungen.forEach(([positionId, minuten, erbracht, grund], k) => {
      leistungen.push({ id: `${id}-L${k + 1}`, einsatzId: id, positionId, minuten, erbracht, grund });
    });
  });
  return { einsaetze, leistungen };
}

const steiner = bauen("P-2026-0041", VERA, "EIN-2026-S", STEINER_WOCHE);
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
