/**
 * Übernahme Pflegeplanung → Leistungsplanungsblatt (Lauf 7, Block Ü) —
 * reine Funktionen, getrennt vom UI.
 *
 * Ü1: Beim Anlegen einer Periode wird der GESAMTE Planbestand übernommen —
 * das Blatt ist nie leer, solange die Pflegeplanung nicht leer ist. Dazu
 * kommen die vorbelegten Prozess-Positionen (10901–10907, retrospektiv)
 * und der Hauswirtschaftsbestand (Herkunft «hauswirtschaft»).
 *
 * Ü6: Die Wiederholung der Pflegeplanung wird auf t2–t7, w, m oder e
 * abgebildet — NIE nach oben gerundet (eine Aufrundung wäre eine stille
 * Mengenerhöhung, Halt-Bedingung 4). «Alle 2 Tage» sind 3,5 Tage je
 * Woche und werden t3, nicht t4. Jede Abbildung trägt das Etikett
 * «Einheit abgebildet».
 */
import { leistungsposition } from "../pflegeplan/mock-adapter";
import type { Einheit, Leistungsart } from "./rechenkern";
import {
  pflegeplanBestand, hauswirtschaftsBestand,
  type LieferPosition, type LieferWiederholung, type LieferZielBezug,
} from "./schnittstelle";

export type Herkunft = "pflegeplan" | "hauswirtschaft" | "prozess" | "manuell";
export type Erbringer = "S" | "I" | "A" | "V";
export type Einsatzblock = "" | "morgen" | "mittag" | "abend" | "einzeln";
export type Ausfuehrung = "" | "ang" | "fach" | "hw";

export interface LpbPosition {
  id: string;
  nummer: string;
  bezeichnung: string;
  leistungsart: Leistungsart;
  herkunft: Herkunft;
  /** Retrospektive Prozessleistung (10901–10907, einmalig) — eigener Block,
   *  nie hochgerechnet (C15). */
  retro: boolean;
  zielBezuege: LieferZielBezug[];
  anzahl: number;
  einheit: Einheit;
  /** Ü6: die Einheit entstand durch Abbildung einer benutzerdefinierten
   *  Wiederholung — sichtbare Pflegeplan-Inkonsistenz, kein Blocker. */
  einheitAbgebildet: boolean;
  /** Vergleichswerte aus der Pflegeplanung — Grundlage des Etiketts «≠ Plan». */
  planAnzahl: number | null;
  planEinheit: Einheit | null;
  /** Minuten je Ausführung — der eingetragene Wert ist der geplante Wert (D4). */
  zeit: number;
  /** Katalog-Richtzeit; null = der Katalog nennt keine (C7: kein Delta,
   *  keine Begründungspflicht). */
  richtzeit: number | null;
  zeitBegruendung: string;
  training: boolean;
  w: Erbringer;
  wGrund: string;
  mandatId: string | null;
  block: Einsatzblock;
  ausfuehrung: Ausfuehrung;
  mindestqualifikation: string | null;
  einfuegeGrund: string;
}

/** Ü6 — Abbildung der Plan-Wiederholung auf die LPB-Einheit. */
export function einheitAusWiederholung(w: LieferWiederholung): { einheit: Einheit; abgebildet: boolean } {
  switch (w.art) {
    case "einmalig": return { einheit: "e", abgebildet: false };
    case "taeglich": return { einheit: "t7", abgebildet: false };
    case "werktage": return { einheit: "t5", abgebildet: false };
    case "monatlich": return { einheit: "m", abgebildet: false };
    case "woechentlich": {
      const n = w.wochentage.length;
      if (n >= 7) return { einheit: "t7", abgebildet: false };
      if (n >= 2) return { einheit: `t${n}` as Einheit, abgebildet: false };
      return { einheit: "w", abgebildet: false };
    }
    case "benutzerdefiniert": {
      /* Tage je Woche, dann ABGERUNDET auf die nächstliegende Einheit —
         nie nach oben (Halt-Bedingung 4). */
      const tageProWoche = w.intervallEinheit === "tage"
        ? 7 / Math.max(1, w.intervallN)
        : Math.max(1, w.wochentage.length) / Math.max(1, w.intervallN);
      if (tageProWoche >= 7) return { einheit: "t7", abgebildet: true };
      if (tageProWoche >= 2) return { einheit: `t${Math.floor(tageProWoche)}` as Einheit, abgebildet: true };
      if (tageProWoche >= 1) return { einheit: "w", abgebildet: true };
      /* Seltener als wöchentlich: monatlich — die Anzahl bleibt unverändert,
         die Abbildung untertreibt eher, als dass sie erhöht. */
      return { einheit: "m", abgebildet: true };
    }
    default: return { einheit: "w", abgebildet: false };
  }
}

/** Katalogstandard-Häufigkeit («1x/Tag», «2x/Monat», «einmalig», «n.B.») —
 *  greift, wenn die Pflegeplanung keine Wiederholung setzt (Ü2). */
export function katalogHaeufigkeit(text: string | null): { anzahl: number; einheit: Einheit } {
  const m = text ? /^(\d+)x\/(Tag|Woche|Monat)$/.exec(text.trim()) : null;
  if (m) {
    const anzahl = Number(m[1]);
    const einheit: Einheit = m[2] === "Tag" ? "t7" : m[2] === "Woche" ? "w" : "m";
    return { anzahl, einheit };
  }
  if (text?.trim() === "einmalig") return { anzahl: 1, einheit: "e" };
  return { anzahl: 1, einheit: "w" };
}

let laufNr = 0;
const neueId = (nummer: string) => `${nummer}#${++laufNr}`;

function basis(nummer: string): { bezeichnung: string; leistungsart: Leistungsart; richtzeit: number | null; mindestqualifikation: string | null; standard: { anzahl: number; einheit: Einheit } } {
  const kat = leistungsposition(nummer);
  if (!kat) throw new Error(`Leistungsplanung: unbekannte Katalogposition ${nummer}`);
  return {
    bezeichnung: kat.bezeichnung,
    leistungsart: kat.klv === "nein" ? "n" : kat.klv,
    richtzeit: kat.vorgabeMinuten,
    mindestqualifikation: kat.mindestqualifikation,
    standard: katalogHaeufigkeit(null),
  };
}

function leer(nummer: string, herkunft: Herkunft): LpbPosition {
  const b = basis(nummer);
  return {
    id: neueId(nummer), nummer, bezeichnung: b.bezeichnung, leistungsart: b.leistungsart,
    herkunft, retro: false, zielBezuege: [],
    anzahl: 1, einheit: "w", einheitAbgebildet: false,
    planAnzahl: null, planEinheit: null,
    zeit: b.richtzeit ?? 0, richtzeit: b.richtzeit, zeitBegruendung: "",
    training: false, w: "S", wGrund: "", mandatId: null,
    block: "", ausfuehrung: "", mindestqualifikation: b.mindestqualifikation,
    einfuegeGrund: "",
  };
}

function ausLieferung(l: LieferPosition): LpbPosition {
  const p = leer(l.positionsNummer, "pflegeplan");
  const { einheit, abgebildet } = einheitAusWiederholung(l.wiederholung.wert);
  p.zielBezuege = [...l.zielBezuege];
  p.anzahl = l.anzahl.wert;
  p.einheit = einheit;
  p.einheitAbgebildet = abgebildet;
  p.planAnzahl = l.anzahl.wert;
  p.planEinheit = einheit;
  p.zeit = l.zeitMin.wert ?? p.richtzeit ?? 0;
  p.zeitBegruendung = l.zeitBegruendung;
  p.w = l.w.wert;
  p.wGrund = l.wNotiz;
  p.mandatId = l.mandatId.wert;
  return p;
}

/** Die vorbelegten Prozess-Positionen des Abklärungsvorgangs (C15). */
const PROZESS: { nummer: string; anzahl: number; einheit: Einheit; retro: boolean }[] = [
  { nummer: "10901", anzahl: 1, einheit: "e", retro: true },
  { nummer: "10904", anzahl: 1, einheit: "e", retro: true },
  { nummer: "10907", anzahl: 1, einheit: "e", retro: true },
  { nummer: "10906", anzahl: 1, einheit: "m", retro: false },
];

/**
 * Ü1/Ü4 — der vollständige Anfangsbestand eines neuen Blattes. Mehrere
 * Zielbezüge auf dieselbe Katalognummer werden zu EINER Position
 * zusammengeführt (Bezüge vereinigt, nie Zeiten addiert).
 */
export function uebernahmeErstellen(patientId: string): LpbPosition[] {
  const jeNummer = new Map<string, LpbPosition>();
  for (const l of pflegeplanBestand(patientId)) {
    const bestehend = jeNummer.get(l.positionsNummer);
    if (bestehend) {
      for (const b of l.zielBezuege) {
        if (!bestehend.zielBezuege.some(x => x.diagnoseCode === b.diagnoseCode && x.zielId === b.zielId)) {
          bestehend.zielBezuege.push(b);
        }
      }
      continue;
    }
    jeNummer.set(l.positionsNummer, ausLieferung(l));
  }

  const prozess = PROZESS.map(v => {
    const p = leer(v.nummer, "prozess");
    p.anzahl = v.anzahl;
    p.einheit = v.einheit;
    p.retro = v.retro;
    p.block = "einzeln";
    p.ausfuehrung = "fach";
    return p;
  });

  const hauswirtschaft = hauswirtschaftsBestand(patientId).map(h => {
    const p = leer(h.positionsNummer, "hauswirtschaft");
    const { einheit, abgebildet } = einheitAusWiederholung(h.wiederholung);
    p.anzahl = h.anzahl;
    p.einheit = einheit;
    p.einheitAbgebildet = abgebildet;
    p.zeit = h.zeitMin ?? p.richtzeit ?? 0;
    p.block = "einzeln";
    p.ausfuehrung = "hw";
    return p;
  });

  return [...prozess, ...jeNummer.values(), ...hauswirtschaft];
}

/** C12/C13 — eine manuell eingefügte Position: Herkunft «manuell»,
 *  Katalogstandard als Startwerte, Grund folgt als Pflicht. */
export function manuellEinfuegen(nummer: string, defaultHaeufigkeit: string | null): LpbPosition {
  const p = leer(nummer, "manuell");
  const std = katalogHaeufigkeit(defaultHaeufigkeit);
  p.anzahl = std.anzahl;
  p.einheit = std.einheit;
  return p;
}
