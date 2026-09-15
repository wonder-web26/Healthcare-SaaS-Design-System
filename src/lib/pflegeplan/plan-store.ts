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
import type { UserRole } from "../../types/user";
import { befundeErmitteln, planSignatur, type Befund } from "./wzw";

/** Die Priorität ist eine FACHLICHE AUSSAGE der Fachperson bei der
 *  Beurteilung — keine Berechnung, nicht aus dem Vorschlagsrang ableitbar,
 *  und deshalb Plan-Zustand, nicht Vertrag (Lauf 6d). */
export type DiagnosePrioritaet = "wichtig" | "normal";

export interface PlanDiagnose {
  code: DiagnoseCode;
  titel: string;
  typ: DiagnoseTyp;
  /** Belegzeile aus dem Vorschlag — bleibt nach der Übernahme am Element. */
  belegZeile: string;
  /** Die auslösenden CAPs, strukturiert — als Text wären sie für die
   *  Herleitung und die spätere Prüfung (Lauf 6) nicht auswertbar. */
  ausloesendeCaps: CapCode[];
  /** Standard «normal». INHALT, nicht Meta: die Priorität steht auf
   *  Dokument und Blatt — ihre Änderung veraltet die Prüfung bewusst. */
  prioritaet: DiagnosePrioritaet;
}

/** Wichtige zuerst, innerhalb der Gruppen stabil in Übernahme-Reihenfolge —
 *  die eine Sortierung für Baum, Balken, Dokument und Blatt-Träger. */
export function nachPrioritaet(diagnosen: PlanDiagnose[]): PlanDiagnose[] {
  return [...diagnosen.filter(d => d.prioritaet === "wichtig"), ...diagnosen.filter(d => d.prioritaet !== "wichtig")];
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
  /** Freitext, z.B. «alle 4 Wochen»; "" = keines. Ein Zieldatum trägt das
   *  Ziel NICHT — fachlicher Entscheid: Ziele werden eingeschätzt
   *  (einschaetzung), nicht terminiert. */
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

/* ── WZW-Prüfung (Lauf 6) ──────────────────────────────────────────────── */

/** Eine Übergehung: der Befund bleibt bestehen, wird aber begründet nicht
 *  aufgelöst. Text, Autorin und Datum wandern ins Dokument («Begründete
 *  Abweichungen») und später ins Leistungsplanungsblatt. */
export interface Uebergehung {
  text: string;
  autorin: string;
  /** ISO-Datum. */
  datum: string;
}

export interface PruefBefund extends Befund {
  uebergehung: Uebergehung | null;
}

/**
 * Das Prüfungsergebnis eines Knopfdrucks. `signatur` hält den Planinhalt
 * zum Prüfzeitpunkt fest — weicht die aktuelle Signatur ab, ist die Prüfung
 * «nicht mehr aktuell». Die Übergehungen hängen HIER, am Ergebnis, nicht am
 * Planinhalt: sonst würde jede Übergehung die eigene Prüfung veralten lassen.
 */
export interface PlanPruefung {
  /** ISO-Datum des Prüflaufs. */
  datum: string;
  signatur: string;
  befunde: PruefBefund[];
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
  /** null = noch nie geprüft. META, nicht Inhalt — von der Signatur
   *  ausgeschlossen (wzw.ts, planSignatur). */
  pruefung: PlanPruefung | null;
}

const LEERER_PLAN: PlanZustand = {
  diagnosen: [], ziele: [], massnahmen: [], verwerfungen: [],
  status: "in_arbeit", fassungen: [], pruefung: null,
};

let zustand: PlanZustand = { ...LEERER_PLAN };

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const schnappschuss = () => zustand;

export function usePlan(): PlanZustand {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

/** Lesender Schnappschuss ausserhalb von React — für Tests und reine Logik. */
export function planSchnappschuss(): PlanZustand {
  return zustand;
}

/* ── Diagnosen ─────────────────────────────────────────────────────────── */

export function diagnoseUebernehmen(d: Omit<PlanDiagnose, "prioritaet"> & { prioritaet?: DiagnosePrioritaet }): void {
  if (zustand.diagnosen.some(x => x.code === d.code)) return;
  zustand = { ...zustand, diagnosen: [...zustand.diagnosen, { ...d, prioritaet: d.prioritaet ?? "normal" }] };
  melden();
}

/**
 * Diagnose entfernen. Bindungen und
 * Bezüge werden mitgelöst — nach dem Muster von zielEntfernen: Massnahmen
 * ohne verbleibenden Bezug fallen in «Ohne Zuordnung», statt still zu
 * verschwinden; anderweitig gebundene Ziele behalten ihre übrigen Einträge.
 */
export function diagnoseEntfernen(code: DiagnoseCode): void {
  zustand = {
    ...zustand,
    diagnosen: zustand.diagnosen.filter(d => d.code !== code),
    ziele: zustand.ziele.filter(z => z.diagnoseCode !== code),
    massnahmen: zustand.massnahmen.map(m => ({
      ...m,
      zielBezuege: m.zielBezuege.filter(b => b.diagnoseCode !== code),
    })),
  };
  melden();
}

/** Die Priorität setzen — die Frage «welche zuerst». */
export function diagnosePriorisieren(code: DiagnoseCode, prioritaet: DiagnosePrioritaet): void {
  zustand = {
    ...zustand,
    diagnosen: zustand.diagnosen.map(d => d.code === code ? { ...d, prioritaet } : d),
  };
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

export function zielUebernehmen(z: Omit<PlanZiel, "evaluationsIntervall" | "einschaetzung">): void {
  if (zustand.ziele.some(x => x.diagnoseCode === z.diagnoseCode && x.zielId === z.zielId)) return;
  /* Dient das Ziel bereits einer anderen Diagnose, teilen sich die Einträge
     Intervall und Einschätzung — sie gehören zum Ziel, nicht zur Bindung. */
  const bestehend = zustand.ziele.find(x => x.zielId === z.zielId);
  zustand = {
    ...zustand,
    ziele: [...zustand.ziele, {
      ...z,
      evaluationsIntervall: bestehend?.evaluationsIntervall ?? "",
      einschaetzung: bestehend?.einschaetzung ?? null,
    }],
  };
  melden();
}

/** Evaluationsintervall setzen — je Ziel, synchron über alle Bindungen. */
export function zielTerminieren(zielId: ZielId, patch: { evaluationsIntervall?: string }): void {
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
      evaluationsIntervall: "", einschaetzung: null,
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

/* ── WZW-Prüfung: durchführen, übergehen, Stand ablesen (Lauf 6) ───────── */

/**
 * Die Prüfung läuft NUR auf Knopfdruck. Bestehende Übergehungen werden über
 * die stabile Befund-Kennung an wiederkehrende Befunde angeheftet; eine
 * Übergehung, deren Befund nicht mehr auftritt, entfällt — eine Begründung,
 * die zu einem früheren Zustand gehörte, darf nicht stillschweigend auf
 * einen neuen zutreffen (siehe wzw.test.ts, Wiederauftauchen-Test).
 */
export function pruefungDurchfuehren(datumIso: string): void {
  const bisherige = zustand.pruefung?.befunde ?? [];
  const befunde: PruefBefund[] = befundeErmitteln(zustand).map(b => ({
    ...b,
    uebergehung: bisherige.find(a => a.id === b.id)?.uebergehung ?? null,
  }));
  zustand = { ...zustand, pruefung: { datum: datumIso, signatur: planSignatur(zustand), befunde } };
  melden();
}

export function befundUebergehen(befundId: string, uebergehung: Uebergehung): void {
  if (!zustand.pruefung) return;
  zustand = {
    ...zustand,
    pruefung: {
      ...zustand.pruefung,
      befunde: zustand.pruefung.befunde.map(b => b.id === befundId ? { ...b, uebergehung } : b),
    },
  };
  melden();
}

export function uebergehungZuruecknehmen(befundId: string): void {
  if (!zustand.pruefung) return;
  zustand = {
    ...zustand,
    pruefung: {
      ...zustand.pruefung,
      befunde: zustand.pruefung.befunde.map(b => b.id === befundId ? { ...b, uebergehung: null } : b),
    },
  };
  melden();
}

/** Passt die Prüfung noch zum Plan? Erkannt über die Inhalts-Signatur,
 *  nicht über einen Zeitstempel. */
export function pruefungAktuell(plan: PlanZustand): boolean {
  return plan.pruefung !== null && plan.pruefung.signatur === planSignatur(plan);
}

/** Offen = weder aufgelöst noch übergangen. Der Zähler rechnet LIVE — eine
 *  zurückgenommene Übergehung erhöht ihn sofort, ohne Neuprüfung. */
export function offeneBefunde(plan: PlanZustand): PruefBefund[] {
  return plan.pruefung?.befunde.filter(b => b.uebergehung === null) ?? [];
}

/* ── Veröffentlichen und Ändern (Lauf 5, verschärft in Lauf 6) ─────────── */

/**
 * Vorbedingung des Veröffentlichens — die eine Stelle, an der Rolle und
 * WZW-Prüfung vor der Freigabe stehen. Die Prüfung blockiert nie inhaltlich
 * (Übergehen ist immer möglich), sie erzwingt nur die Begründung.
 * Rückgabe: Ablehnungsgrund, oder leer.
 */
export function veroeffentlichungsVorbedingung(plan: PlanZustand, rolle: UserRole): string {
  /* Ohne dieses Gate wäre die Nachweiskette wertlos: wenn jede Rolle
     freigeben kann, belegt die Freigabe nichts. */
  if (rolle !== "diplomiert") return "Nur die Pflegefachperson HF darf den Plan freigeben.";
  if (plan.pruefung === null) return "Der Plan ist noch nicht geprüft — die WZW-Prüfung gehört vor die Freigabe.";
  if (!pruefungAktuell(plan)) return "Die Prüfung ist nicht mehr aktuell — der Plan wurde seither geändert.";
  const offene = offeneBefunde(plan);
  if (offene.length > 0) {
    return `${offene.length} ${offene.length === 1 ? "Befund ist" : "Befunde sind"} weder aufgelöst noch begründet übergangen.`;
  }
  return "";
}

/** Veröffentlichen: Status setzen, Fassung zählen. Rückgabe: Grund einer
 *  Ablehnung, sonst leer. */
export function veroeffentlichen(autorin: string, rolle: UserRole, datumIso: string): string {
  const grund = veroeffentlichungsVorbedingung(zustand, rolle);
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
