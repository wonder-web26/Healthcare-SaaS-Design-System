/**
 * Der entstehende Pflegeplan — UI-Anbindung des Vertrags (Lauf 2).
 *
 * Modul-State für die Aufbau-Ansicht: Diagnosen, Ziele je Diagnose,
 * Massnahmen mit ihren Zielbezügen, Verwerfungen mit Grund. Sitzungsdauer,
 * keine Persistenz — wie im Repo üblich (Muster: lib/vitalzeichen/store.ts).
 *
 * Zwei Grundsätze aus dem Lauf:
 * - EINE Massnahme, n Zielbezüge. Eine Leistung wird einmal erbracht und
 *   einmal verrechnet — zwei Einträge wären ein Fehler mit Geldfolge.
 * - Wird ein Ziel entfernt, verlieren seine Massnahmen nur den Bezug und
 *   fallen in «Ohne Zuordnung». Das ist ein Arbeitszustand, kein Fehler.
 */
import { useSyncExternalStore } from "react";
import type { CapCode, DetailAuswahl, DiagnoseCode, DiagnoseTyp, InterventionId, ZielId } from "./vertrag";

export interface PlanDiagnose {
  code: DiagnoseCode;
  titel: string;
  typ: DiagnoseTyp;
  /** Belegzeile aus dem Vorschlag — bleibt nach der Übernahme am Element. */
  belegZeile: string;
  /** Die auslösenden CAPs, strukturiert — als Text wären sie für die
   *  Herleitung und die spätere Prüfung (Lauf 6) nicht auswertbar. */
  ausloesendeCaps: CapCode[];
}

/** Die erfasste Zielerreichung — Stufe aus der Vertragsskala, mit Datum und
 *  Autorin. Einmal je Ziel (nicht je Diagnose-Bindung). */
export interface ZielEinschaetzung {
  stufe: 1 | 2 | 3 | 4 | 5;
  /** ISO-Datum. */
  datum: string;
  autorin: string;
}

export interface PlanZiel {
  /** Katalog-Zielkennung — oder eigene Kennung bei selbst formulierten Zielen. */
  zielId: ZielId;
  /** null = ungebunden (Zone der Unverbundenen): die letzte
   *  Diagnose-Verbindung wurde in der Struktur-Ansicht gelöst. Das Ziel
   *  verschwindet nicht — Verschwinden wäre selbst eine Aussage. */
  diagnoseCode: DiagnoseCode | null;
  titel: string;
  /** Selbst formuliert statt aus der hergeleiteten Liste übernommen. */
  eigenes: boolean;
  /** ISO-Datum; "" = keines. NIE automatisch vorbelegt — ein Ziel ohne
   *  Zieldatum ist ein Zustand, der in Lauf 6 zum Wirksamkeitsbefund wird. */
  zieldatum: string;
  /** Freitext, z.B. «alle 4 Wochen»; "" = keines. */
  evaluationsIntervall: string;
  einschaetzung: ZielEinschaetzung | null;
}

/** Ein Zielbezug einer Massnahme: unter welcher Diagnose, zu welchem Ziel. */
export interface ZielBezug {
  diagnoseCode: DiagnoseCode;
  zielId: ZielId;
}

/* ── Feinplanung (Lauf 3) ──────────────────────────────────────────────── */

export type Wiederholung = "einmalig" | "taeglich" | "werktage" | "woechentlich" | "monatlich" | "benutzerdefiniert";

/** Die vier Erbringer-Werte entscheiden über die Verrechnung, nicht über die
 *  Rolle: nur S wird verrechnet und zählt zur Wochensumme; I, A und V bleiben
 *  im Plan (Bedarf gedeckt / anderer Anbieter / Bedarf festgestellt und
 *  abgelehnt), werden aber nicht von uns verrechnet. */
export type ErbringerCode = "S" | "I" | "A" | "V";

export interface MassnahmenPlanung {
  detailAuswahl: DetailAuswahl;
  /** null = noch nicht geplant; der Satz im Baum zeigt dann nur Position und Zeit. */
  wiederholung: Wiederholung | null;
  /** ISO-Datum; nur bei «einmalig». */
  einmalDatum: string;
  /** Ausführungen je Vorkommen (Tag bzw. Monat). */
  anzahl: number;
  /** «alle N Tage/Wochen» — nur bei «benutzerdefiniert». */
  intervallN: number;
  intervallEinheit: "tage" | "wochen";
  /** 0 = Montag … 6 = Sonntag. */
  wochentage: number[];
  /** Kennungen der gewählten Tageszeitfenster. */
  tageszeiten: string[];
  /** Eigene Uhrzeiten «HH:MM», einzeln entfernbar. */
  eigeneZeiten: string[];
  /** Verbindlich statt nur bevorzugt — nur Ersteres darf später die
   *  Einsatzplanung einschränken. */
  zeitVerbindlich: boolean;
  erbringer: ErbringerCode;
  /** Pflichttext bei I/A/V: wer erbringt bzw. was wurde abgelehnt. */
  erbringerNotiz: string;
  /** Mandatsbezug — existiert immer, angezeigt nur bei mehreren Mandaten. */
  mandatId: string | null;
  /** null = Katalog-Vorgabezeit gilt. */
  dauerMin: number | null;
  /** Pflicht, sobald die Dauer vom Katalogwert abweicht. */
  dauerBegruendung: string;
  /** null = Katalogminimum gilt. */
  qualifikation: string | null;
}

export const LEERE_PLANUNG: MassnahmenPlanung = {
  detailAuswahl: [],
  wiederholung: null,
  einmalDatum: "",
  anzahl: 1,
  intervallN: 2,
  intervallEinheit: "tage",
  wochentage: [],
  tageszeiten: [],
  eigeneZeiten: [],
  zeitVerbindlich: false,
  erbringer: "S",
  erbringerNotiz: "",
  mandatId: null,
  dauerMin: null,
  dauerBegruendung: "",
  qualifikation: null,
};

export interface PlanMassnahme {
  interventionId: InterventionId;
  titel: string;
  /** Leer = «Ohne Zuordnung» (Arbeitszustand). Reihenfolge = Verknüpfungsreihenfolge:
   *  der erste Bezug trägt Position und Zeit, weitere sagen «bereits gezählt». */
  zielBezuege: ZielBezug[];
  /** EIN Zustand je Massnahme — auch wenn sie mehreren Zielen dient. */
  planung: MassnahmenPlanung;
}

export type VerwerfGrund =
  | "Nicht zutreffend"
  | "Wird anderweitig abgedeckt"
  | "Bereits im Plan enthalten"
  | "Klientin lehnt ab";

export interface Verwerfung {
  code: DiagnoseCode;
  grund: VerwerfGrund;
  person: string;
  /** ISO-Datum. */
  datum: string;
}

export type PlanStatus = "in_arbeit" | "veroeffentlicht" | "aenderung_in_arbeit";

export interface Fassung {
  nummer: number;
  /** ISO-Datum. */
  datum: string;
  autorin: string;
}

export interface PlanZustand {
  diagnosen: PlanDiagnose[];
  ziele: PlanZiel[];
  massnahmen: PlanMassnahme[];
  verwerfungen: Verwerfung[];
  status: PlanStatus;
  /** ZÄHLUNG, keine Historie: alte Stände werden im Prototyp nicht
   *  gespeichert und sind nicht lesbar — der Schemabedarf steht im Delta. */
  fassungen: Fassung[];
}

const LEERER_PLAN: PlanZustand = {
  diagnosen: [], ziele: [], massnahmen: [], verwerfungen: [],
  status: "in_arbeit", fassungen: [],
};

let zustand: PlanZustand = { ...LEERER_PLAN };

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const schnappschuss = () => zustand;

export function usePlan(): PlanZustand {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

/* ── Diagnosen ─────────────────────────────────────────────────────────── */

export function diagnoseUebernehmen(d: PlanDiagnose): void {
  if (zustand.diagnosen.some(x => x.code === d.code)) return;
  zustand = { ...zustand, diagnosen: [...zustand.diagnosen, d] };
  melden();
}

/* ── Verwerfen mit Grund ───────────────────────────────────────────────── */

export function diagnoseVerwerfen(code: DiagnoseCode, grund: VerwerfGrund, person: string, datum: string): void {
  if (zustand.verwerfungen.some(v => v.code === code)) return;
  zustand = { ...zustand, verwerfungen: [...zustand.verwerfungen, { code, grund, person, datum }] };
  melden();
}

export function verwerfungZuruecknehmen(code: DiagnoseCode): void {
  zustand = { ...zustand, verwerfungen: zustand.verwerfungen.filter(v => v.code !== code) };
  melden();
}

/* ── Ziele ─────────────────────────────────────────────────────────────── */

/** Ziel übernehmen — OHNE Zieldatum: es wird nie automatisch vorbelegt. */
export function zielUebernehmen(z: Omit<PlanZiel, "zieldatum" | "evaluationsIntervall" | "einschaetzung">): void {
  if (zustand.ziele.some(x => x.diagnoseCode === z.diagnoseCode && x.zielId === z.zielId)) return;
  /* Dient das Ziel bereits einer anderen Diagnose, teilen sich die Einträge
     Zieldatum und Einschätzung — sie gehören zum Ziel, nicht zur Bindung. */
  const bestehend = zustand.ziele.find(x => x.zielId === z.zielId);
  zustand = {
    ...zustand,
    ziele: [...zustand.ziele, {
      ...z,
      zieldatum: bestehend?.zieldatum ?? "",
      evaluationsIntervall: bestehend?.evaluationsIntervall ?? "",
      einschaetzung: bestehend?.einschaetzung ?? null,
    }],
  };
  melden();
}

/** Zieldatum und Intervall setzen — je Ziel, synchron über alle Bindungen. */
export function zielTerminieren(zielId: ZielId, patch: { zieldatum?: string; evaluationsIntervall?: string }): void {
  zustand = {
    ...zustand,
    ziele: zustand.ziele.map(z => z.zielId === zielId ? { ...z, ...patch } : z),
  };
  melden();
}

/** Zielerreichung einschätzen — je Ziel, synchron über alle Bindungen. */
export function zielEinschaetzen(zielId: ZielId, einschaetzung: ZielEinschaetzung): void {
  zustand = {
    ...zustand,
    ziele: zustand.ziele.map(z => z.zielId === zielId ? { ...z, einschaetzung } : z),
  };
  melden();
}

/**
 * Ziel entfernen. Massnahmen verlieren nur diesen Bezug — eine Massnahme
 * ohne verbleibenden Bezug fällt in «Ohne Zuordnung», statt stillschweigend
 * zu verschwinden.
 */
export function zielEntfernen(diagnoseCode: DiagnoseCode, zielId: ZielId): void {
  zustand = {
    ...zustand,
    ziele: zustand.ziele.filter(z => !(z.diagnoseCode === diagnoseCode && z.zielId === zielId)),
    massnahmen: zustand.massnahmen.map(m => ({
      ...m,
      zielBezuege: m.zielBezuege.filter(b => !(b.diagnoseCode === diagnoseCode && b.zielId === zielId)),
    })),
  };
  melden();
}

/* ── Verknüpfen und Lösen (Struktur-Ansicht, Lauf 4) ────────────────────
   Anders als zielEntfernen (Aufbau-✕: der Eintrag verschwindet) LÖST die
   Struktur nur die Verbindung: das letzte gelöste Ziel bleibt ungebunden
   stehen. Massnahmen-Bezüge auf das gelöste Paar werden mitgelöst und
   fallen gegebenenfalls in «Ohne Zuordnung». */

export function zielVerbindungHerstellen(diagnoseCode: DiagnoseCode, zielId: ZielId): void {
  const eintraege = zustand.ziele.filter(z => z.zielId === zielId);
  if (eintraege.length === 0) return;
  if (eintraege.some(z => z.diagnoseCode === diagnoseCode)) return;
  const ungebunden = eintraege.find(z => z.diagnoseCode === null);
  zustand = {
    ...zustand,
    ziele: ungebunden
      ? zustand.ziele.map(z => (z.zielId === zielId && z.diagnoseCode === null) ? { ...z, diagnoseCode } : z)
      : [...zustand.ziele, { ...eintraege[0], diagnoseCode }],
  };
  melden();
}

export function zielVerbindungLoesen(diagnoseCode: DiagnoseCode, zielId: ZielId): void {
  const eintraege = zustand.ziele.filter(z => z.zielId === zielId);
  const betroffen = eintraege.find(z => z.diagnoseCode === diagnoseCode);
  if (!betroffen) return;
  const letzte = eintraege.filter(z => z.diagnoseCode !== null).length === 1;
  zustand = {
    ...zustand,
    ziele: letzte
      ? zustand.ziele.map(z => (z.zielId === zielId && z.diagnoseCode === diagnoseCode) ? { ...z, diagnoseCode: null } : z)
      : zustand.ziele.filter(z => !(z.zielId === zielId && z.diagnoseCode === diagnoseCode)),
    massnahmen: zustand.massnahmen.map(m => ({
      ...m,
      zielBezuege: m.zielBezuege.filter(b => !(b.diagnoseCode === diagnoseCode && b.zielId === zielId)),
    })),
  };
  melden();
}

let eigeneZielNummer = 0;

/** Selbst formuliertes Ziel — für Diagnosen ohne hinterlegte Ziele. */
export function eigenesZielHinzufuegen(diagnoseCode: DiagnoseCode, titel: string): void {
  eigeneZielNummer += 1;
  zustand = {
    ...zustand,
    ziele: [...zustand.ziele, {
      zielId: `Z-EIGEN-${eigeneZielNummer}`, diagnoseCode, titel, eigenes: true,
      zieldatum: "", evaluationsIntervall: "", einschaetzung: null,
    }],
  };
  melden();
}

/* ── Massnahmen ────────────────────────────────────────────────────────── */

/**
 * Massnahme übernehmen oder mit einem weiteren Ziel verknüpfen — dieselbe
 * Funktion, damit dieselbe Intervention nie zweimal im Plan landet.
 */
export function massnahmeVerknuepfen(interventionId: InterventionId, titel: string, bezug: ZielBezug): void {
  const bestehend = zustand.massnahmen.find(m => m.interventionId === interventionId);
  if (bestehend) {
    if (bestehend.zielBezuege.some(b => b.diagnoseCode === bezug.diagnoseCode && b.zielId === bezug.zielId)) return;
    zustand = {
      ...zustand,
      massnahmen: zustand.massnahmen.map(m => m.interventionId === interventionId
        ? { ...m, zielBezuege: [...m.zielBezuege, bezug] }
        : m),
    };
  } else {
    zustand = { ...zustand, massnahmen: [...zustand.massnahmen, { interventionId, titel, zielBezuege: [bezug], planung: { ...LEERE_PLANUNG } }] };
  }
  melden();
}

/** Feinplanung einer Massnahme ändern — ein Zustand, unter allen Zielen gleich. */
export function massnahmePlanen(interventionId: InterventionId, patch: Partial<MassnahmenPlanung>): void {
  zustand = {
    ...zustand,
    massnahmen: zustand.massnahmen.map(m => m.interventionId === interventionId
      ? { ...m, planung: { ...m.planung, ...patch } }
      : m),
  };
  melden();
}

/** Einen Zielbezug lösen; ohne verbleibenden Bezug bleibt die Massnahme in «Ohne Zuordnung». */
export function massnahmenBezugLoesen(interventionId: InterventionId, bezug: ZielBezug): void {
  zustand = {
    ...zustand,
    massnahmen: zustand.massnahmen.map(m => m.interventionId === interventionId
      ? { ...m, zielBezuege: m.zielBezuege.filter(b => !(b.diagnoseCode === bezug.diagnoseCode && b.zielId === bezug.zielId)) }
      : m),
  };
  melden();
}

/* ── Veröffentlichen und Ändern (Lauf 5) ───────────────────────────────── */

/**
 * Vorbedingung des Veröffentlichens — HIER schiebt Lauf 6 die WZW-Prüfung
 * und die Rollenfrage davor. Heute gibt es keine Prüfung und jeder darf;
 * beides ist bewusst als eine Stelle gebaut, nicht verstreut.
 * Rückgabe: Ablehnungsgrund, oder leer.
 */
function veroeffentlichungsVorbedingung(_plan: PlanZustand, _autorin: string): string {
  return "";
}

/** Veröffentlichen: Status setzen, Fassung zählen. Rückgabe: Grund einer
 *  Ablehnung, sonst leer. */
export function veroeffentlichen(autorin: string, datumIso: string): string {
  const grund = veroeffentlichungsVorbedingung(zustand, autorin);
  if (grund) return grund;
  zustand = {
    ...zustand,
    status: "veroeffentlicht",
    fassungen: [...zustand.fassungen, { nummer: zustand.fassungen.length + 1, datum: datumIso, autorin }],
  };
  melden();
  return "";
}

/** Plan ändern: «Änderung in Arbeit» — der Einstieg ist die Struktur. */
export function planAendern(): void {
  if (zustand.status !== "veroeffentlicht") return;
  zustand = { ...zustand, status: "aenderung_in_arbeit" };
  melden();
}

/** Nur für Tests/Neustart der Demo. */
export function planZuruecksetzen(): void {
  zustand = { ...LEERER_PLAN };
  melden();
}
