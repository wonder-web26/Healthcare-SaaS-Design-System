/**
 * Bestand der Verordnungen und Kostengutsprachen — Sitzungsdauer.
 *
 * Beide hängen am Mandat, nicht am Patienten: wechselt die Abrechnungs-
 * beziehung, wechseln auch Verordnung und Gutsprache.
 *
 * Der Startbestand ist abgeleitet: je Mandat eine aktive Verordnung ab dessen
 * Beginn. Kostengutsprachen gibt es bewusst nur für fünf Fälle — sie zeigen je
 * eine Regel, statt zehnmal dasselbe zu wiederholen. Die übrigen Patienten
 * haben keine, und die Ansicht sagt das.
 */
import { useSyncExternalStore } from "react";
import type { Verordnung, Kostengutsprache } from "./verordnungen";

/* ── Verordnungen: je Mandat eine, ab dessen Beginn ────────────────────────── */

interface VerordnungSeed {
  mandatId: string;
  aerztin: string;
  beginn: string;
  bis: string;
  /**
   * Bedarfsmeldung in Minuten je Monat. Nur dort gesetzt, wo ein aktives
   * Leistungsplanungsblatt besteht, gegen das sich vergleichen liesse —
   * eine Meldung ohne Blatt wäre eine Zahl ohne Gegenstück.
   */
  gemeldet?: { a: string; b: string; c: string };
}

/** Beginn = Aufnahmedatum des Mandats; die Ärztin steht am jeweiligen Fall. */
const VERORDNUNG_SEED: VerordnungSeed[] = [
  /* Steiner: die Meldung entspricht dem, was das Blatt KLV-2026-101 je Monat
     plant — Kategorie b 147 Min./Woche, c 179 Min./Woche, hochgerechnet auf
     einen Monat von 31 Tagen (4.43 Wochen). Kategorie a trägt nur einmalige
     Positionen und damit keine monatliche Menge. */
  { mandatId: "MAN-2026-1001", aerztin: "Dr. med. Peter Frei", beginn: "12.01.2026", bis: "11.01.2027",
    gemeldet: { a: "0", b: "651", c: "793" } },
  { mandatId: "MAN-2026-1002", aerztin: "Dr. med. Ursula Bachmann", beginn: "20.02.2026", bis: "19.02.2027" },
  { mandatId: "MAN-2026-1003", aerztin: "Dr. med. Peter Frei", beginn: "03.09.2025", bis: "02.09.2026" },
  { mandatId: "MAN-2026-1004", aerztin: "Dr. med. Ursula Bachmann", beginn: "15.06.2025", bis: "14.06.2026" },
  { mandatId: "MAN-2026-1005", aerztin: "Dr. med. Marc Wyss", beginn: "28.07.2025", bis: "27.07.2026" },
  { mandatId: "MAN-2026-1006", aerztin: "Dr. med. Marc Wyss", beginn: "22.02.2026", bis: "21.02.2027" },
  { mandatId: "MAN-2026-1007", aerztin: "Dr. med. Ursula Bachmann", beginn: "01.11.2025", bis: "31.10.2026" },
  { mandatId: "MAN-2026-1008", aerztin: "Dr. med. Peter Frei", beginn: "05.04.2025", bis: "04.04.2026" },
  /* Zimmermann: die Meldung liegt bewusst etwas über dem, was das Blatt
     KLV-2026-033 plant (190 Min./Woche, rund 841 im Monat). Die Bedarfsmeldung
     ist eine Prognose, kein Kontingent — eine Ärztin, die knapp meldet, muss
     nachmelden, also meldet sie mit Reserve. So zeigt der Abschluss beide
     Lagen: Steiner über der Meldung, Zimmermann im Rahmen. */
  { mandatId: "MAN-2026-1009", aerztin: "Dr. med. Marc Wyss", beginn: "18.12.2025", bis: "17.12.2026",
    gemeldet: { a: "0", b: "0", c: "960" } },
  { mandatId: "MAN-2026-1010", aerztin: "Dr. med. Peter Frei", beginn: "10.10.2025", bis: "09.10.2026" },
];

const verordnungenSeed: Verordnung[] = VERORDNUNG_SEED.map((v, i) => ({
  id: `VO-2026-${String(2001 + i)}`,
  mandatId: v.mandatId,
  art: "erst",
  verordnendeAerztin: v.aerztin,
  ausstellungsdatum: v.beginn,
  gueltigAb: v.beginn,
  gueltigBis: v.bis,
  unterzeichnetAm: v.beginn,
  bemerkung: "",
  gemeldeteMinuten: v.gemeldet ?? { a: "", b: "", c: "" },
}));

/* ── Kostengutsprachen: fünf Fälle, je einer für eine Regel ────────────────── */

const leer = { bewilligteMinutenProTag: "", bewilligteEinsatztage: "", kuerzungsgrund: "" };

const kostengutsprachenSeed: Kostengutsprache[] = [
  /* Normalfall — bewilligt und laufend. Steiner, MAN-2026-1001.
     Die bewilligte Menge liegt bewusst unter dem, was sein aktives Blatt
     plant (326 Min./Woche): so zeigt der Abgleich den Fall, für den er da
     ist — die Spitex plant mehr, als die Kasse zahlt. */
  {
    id: "KGS-2026-3001", mandatId: "MAN-2026-1001",
    eingereichtAm: "05.01.2026", entscheidAm: "14.01.2026", entscheidart: "bewilligt",
    gueltigAb: "12.01.2026", gueltigBis: "31.12.2026",
    bewilligteMinutenProWoche: "300", bewilligteMinutenProTag: "60",
    bewilligteEinsatztage: "5", kuerzungsgrund: "",
  },

  /* V2 — offene Lücke seit Anfang Februar. Huber, MAN-2026-1005. */
  {
    id: "KGS-2025-3002", mandatId: "MAN-2026-1005",
    eingereichtAm: "20.07.2025", entscheidAm: "29.07.2025", entscheidart: "bewilligt",
    gueltigAb: "28.07.2025", gueltigBis: "31.01.2026",
    bewilligteMinutenProWoche: "420", bewilligteMinutenProTag: "60",
    bewilligteEinsatztage: "7", kuerzungsgrund: "",
  },

  /* V3 — gekürzt, mit Begründung. Rexhepi, MAN-2026-1003. */
  {
    id: "KGS-2025-3003", mandatId: "MAN-2026-1003",
    eingereichtAm: "25.08.2025", entscheidAm: "08.09.2025", entscheidart: "gekuerzt",
    gueltigAb: "03.09.2025", gueltigBis: "31.12.2026",
    bewilligteMinutenProWoche: "480", bewilligteMinutenProTag: "80",
    bewilligteEinsatztage: "6",
    kuerzungsgrund: "Beantragt waren 630 Minuten je Woche. Die Kasse anerkennt die Grundpflege nur an sechs statt sieben Tagen und kürzt entsprechend auf 480 Minuten.",
  },

  /* V4 — eingereicht, Entscheid seit über vierzehn Tagen ausstehend.
     Da Silva, MAN-2026-1006. */
  {
    id: "KGS-2026-3004", mandatId: "MAN-2026-1006",
    eingereichtAm: "15.06.2026", entscheidAm: "", entscheidart: "ausstehend",
    gueltigAb: "01.07.2026", gueltigBis: "30.06.2027",
    bewilligteMinutenProWoche: "", ...leer,
  },

  /* V5 — läuft in weniger als dreissig Tagen ab. Zimmermann, MAN-2026-1009. */
  {
    id: "KGS-2025-3005", mandatId: "MAN-2026-1009",
    eingereichtAm: "10.12.2025", entscheidAm: "17.12.2025", entscheidart: "bewilligt",
    gueltigAb: "18.12.2025", gueltigBis: "15.08.2026",
    bewilligteMinutenProWoche: "360", bewilligteMinutenProTag: "60",
    bewilligteEinsatztage: "6", kuerzungsgrund: "",
  },
];

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let verordnungen: Verordnung[] = verordnungenSeed;
let kostengutsprachen: Kostengutsprache[] = kostengutsprachenSeed;
const hoerer = new Set<() => void>();

function melden(): void {
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

const vSchnappschuss = () => verordnungen;
const kSchnappschuss = () => kostengutsprachen;

export function useVerordnungen(): Verordnung[] {
  return useSyncExternalStore(subscribe, vSchnappschuss, vSchnappschuss);
}

export function useKostengutsprachen(): Kostengutsprache[] {
  return useSyncExternalStore(subscribe, kSchnappschuss, kSchnappschuss);
}

export function aktualisiereVerordnung(id: string, felder: Partial<Omit<Verordnung, "id" | "mandatId">>): void {
  verordnungen = verordnungen.map(v => (v.id === id ? { ...v, ...felder } : v));
  melden();
}

export function aktualisiereKostengutsprache(id: string, felder: Partial<Omit<Kostengutsprache, "id" | "mandatId">>): void {
  kostengutsprachen = kostengutsprachen.map(k => (k.id === id ? { ...k, ...felder } : k));
  melden();
}
