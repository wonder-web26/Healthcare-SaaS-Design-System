/**
 * Versicherungsverhältnisse — die Zahlerseite eines Mandats.
 *
 * Ein Versicherungsverhältnis verbindet einen Patienten mit einem Versicherer
 * (Kostenträger aus lib/stammdaten/krankenkassen — der EINZIGEN Versichererliste)
 * über einen Typ, einen Gültigkeitszeitraum und die typabhängigen Nummern.
 *
 * KEIN Statusfeld: „aktiv" ergibt sich aus dem Zeitraum (wie bei Mandat).
 * Datumsfelder sind ISO (YYYY-MM-DD); die Oberfläche formatiert zur Anzeige.
 *
 * Entspricht im produktiven Schema `InsurancePolicy` [PARTIAL] (siehe
 * docs/datenmodell-mapping.md).
 */
import { useSyncExternalStore } from "react";
import { GEGENWART_ISO } from "../gegenwart";
import { anzeigeZuIso, isoZuDate, dateZuIso } from "../datum";
import { getVersicherer, type KostentraegerArt } from "../stammdaten/krankenkassen";

export type VersicherungsTyp = "kvg" | "vvg" | "uvg" | "ivg" | "mvg";

/** Unfalldeckung in der Grundversicherung — dreiwertig, der dritte Wert bewusst
 *  („unbekannt" statt geratenem Ja/Nein). Nur bei KVG relevant. */
export type Unfalldeckung = "eingeschlossen" | "ausgeschlossen" | "unbekannt";

/** Abrechnungsart — wohin die Rechnung geht. Kein Standardwert: eine Vereinbarung,
 *  keine Annahme (auch wenn Tiers payant in der Praxis überwiegt). */
export type Abrechnungsart = "tiers_payant" | "tiers_garant";

export type Versicherungsverhaeltnis = {
  id: string;
  patientId: string;
  typ: VersicherungsTyp;
  versichererId: string;
  gueltigAb: string;                 // ISO
  gueltigBis: string | null;         // null = laufend
  kartennummer: string | null;       // nur kvg
  policennummer: string | null;      // nur vvg
  schadennummer: string | null;      // nur uvg
  verfuegungsnummer: string | null;  // nur ivg, mvg
  unfalldeckung: Unfalldeckung;      // nur kvg relevant; sonst "unbekannt"
  unfalldatum: string | null;        // nur uvg (Pflicht dort), ISO
  verfuegungsdatum: string | null;   // nur ivg (Pflicht dort), ISO
  bemerkung: string | null;
  /** Vorgabe für neue Mandate; die verbindliche Entscheidung liegt beim Mandat. */
  abrechnungsart: Abrechnungsart | null;
};

/** Typabhängige Pflicht-Nummer je Typ (das Nummernfeld) — Einzelquelle. */
export const TYP_PFLICHTFELD: Record<VersicherungsTyp, keyof Versicherungsverhaeltnis> = {
  kvg: "kartennummer",
  vvg: "policennummer",
  uvg: "schadennummer",
  ivg: "verfuegungsnummer",
  mvg: "verfuegungsnummer",
};

/** Alle typabhängigen Pflichtfelder je Typ (neben Versicherer und Gültig ab). */
export const TYP_PFLICHTFELDER: Record<VersicherungsTyp, (keyof Versicherungsverhaeltnis)[]> = {
  kvg: ["kartennummer", "unfalldeckung"],
  vvg: ["policennummer"],
  uvg: ["schadennummer", "unfalldatum"],
  ivg: ["verfuegungsnummer", "verfuegungsdatum"],
  mvg: ["verfuegungsnummer"],
};

/** Anzeigetext der Unfalldeckung (Einzelquelle). */
export const UNFALLDECKUNG_LABEL: Record<Unfalldeckung, string> = {
  eingeschlossen: "Unfall eingeschlossen",
  ausgeschlossen: "Unfall ausgeschlossen",
  unbekannt: "Unfalldeckung unbekannt",
};

export const UNFALLDECKUNG_WERTE: Unfalldeckung[] = ["eingeschlossen", "ausgeschlossen", "unbekannt"];

/** Anzeige der Abrechnungsart (Einzelquelle) — Fachbegriff plus erklärender Zusatz. */
export const ABRECHNUNGSART_LABEL: Record<Abrechnungsart, string> = {
  tiers_payant: "Tiers payant",
  tiers_garant: "Tiers garant",
};
export const ABRECHNUNGSART_ZUSATZ: Record<Abrechnungsart, string> = {
  tiers_payant: "Rechnung an die Kasse",
  tiers_garant: "Rechnung an die Klientin",
};
export const ABRECHNUNGSART_WERTE: Abrechnungsart[] = ["tiers_payant", "tiers_garant"];

/** Bezeichnung des Typs in der Oberfläche. */
export const TYP_LABEL: Record<VersicherungsTyp, string> = {
  kvg: "KVG Grundversicherung",
  vvg: "VVG Zusatzversicherung",
  uvg: "UVG Unfallversicherung",
  ivg: "IVG Invalidenversicherung",
  mvg: "MVG Militärversicherung",
};

/** Kurzform für den Typ-Chip. */
export const TYP_CHIP: Record<VersicherungsTyp, string> = {
  kvg: "KVG", vvg: "VVG", uvg: "UVG", ivg: "IVG", mvg: "MVG",
};

/** Label der typabhängigen Pflicht-Nummer im Dialog. */
export const TYP_NUMMER_LABEL: Record<VersicherungsTyp, string> = {
  kvg: "Versichertenkartennummer",
  vvg: "Policennummer",
  uvg: "Schadennummer",
  ivg: "Verfügungsnummer",
  mvg: "Verfügungsnummer",
};

/** Welche Trägerart passt zu welchem Versicherungstyp (Picker-Filter). */
export const TYP_TRAEGERART: Record<VersicherungsTyp, KostentraegerArt> = {
  kvg: "krankenversicherer",
  vvg: "krankenversicherer",
  uvg: "unfallversicherer",
  ivg: "iv_stelle",
  mvg: "militaerversicherung",
};

export const VERSICHERUNGS_TYPEN: VersicherungsTyp[] = ["kvg", "vvg", "uvg", "ivg", "mvg"];

// ── abgeleitet, nicht gespeichert ────────────────────────────────────────────

export function istAktiv(v: Versicherungsverhaeltnis, stichtag: string = GEGENWART_ISO): boolean {
  if (v.gueltigAb > stichtag) return false;
  return v.gueltigBis === null || v.gueltigBis >= stichtag;
}

// ── Bestand ──────────────────────────────────────────────────────────────────

let alle: Versicherungsverhaeltnis[] = seed();
const listeners = new Set<() => void>();
function setzeAlle(neu: Versicherungsverhaeltnis[]): void {
  alle = neu;
  for (const l of listeners) l();
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
let idZaehler = 1000;
function neueId(): string { idZaehler += 1; return `VV-${idZaehler}`; }

/** Tag vor einem ISO-Datum (für die Befristung beim Kassenwechsel). */
function vortag(iso: string): string {
  const d = isoZuDate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() - 1);
  return dateZuIso(d);
}

export function aktiveVersicherung(patientId: string, typ: VersicherungsTyp, stichtag: string = GEGENWART_ISO): Versicherungsverhaeltnis | undefined {
  return alle.find(v => v.patientId === patientId && v.typ === typ && istAktiv(v, stichtag));
}

/** Name des aktiven Versicherers eines Typs (für CHA7*, WZW, Mandat). "" wenn keiner. */
export function aktiverVersichererName(patientId: string, typ: VersicherungsTyp, stichtag: string = GEGENWART_ISO): string {
  const v = aktiveVersicherung(patientId, typ, stichtag);
  return v ? (getVersicherer(v.versichererId)?.label ?? "") : "";
}

/** Kennung des aktiven Versicherers eines Typs (für das Mandat). null wenn keiner. */
export function aktiverVersichererId(patientId: string, typ: VersicherungsTyp, stichtag: string = GEGENWART_ISO): string | null {
  return aktiveVersicherung(patientId, typ, stichtag)?.versichererId ?? null;
}

/** Alle Verhältnisse eines Patienten: aktive zuerst (gueltigAb absteigend), abgelaufene zuletzt. */
export function versicherungenFuerPatient(patientId: string, stichtag: string = GEGENWART_ISO): Versicherungsverhaeltnis[] {
  const eigene = alle.filter(v => v.patientId === patientId);
  const aktiv = eigene.filter(v => istAktiv(v, stichtag)).sort((a, b) => b.gueltigAb.localeCompare(a.gueltigAb));
  const abgelaufen = eigene.filter(v => !istAktiv(v, stichtag)).sort((a, b) => (b.gueltigBis ?? "").localeCompare(a.gueltigBis ?? ""));
  return [...aktiv, ...abgelaufen];
}

export function getVersicherung(id: string): Versicherungsverhaeltnis | undefined {
  return alle.find(v => v.id === id);
}

// ── Mutationen ───────────────────────────────────────────────────────────────

/**
 * Neues Verhältnis. Kassenwechsel: existiert beim Anlegen bereits ein zum
 * Start-Datum aktives Verhältnis desselben Typs, wird es auf den Vortag von
 * gueltigAb befristet — zwei gleichzeitig aktive desselben Typs sind unzulässig.
 */
export function addVersicherung(eingabe: Omit<Versicherungsverhaeltnis, "id">): Versicherungsverhaeltnis {
  const neu: Versicherungsverhaeltnis = { ...eingabe, id: neueId() };
  const befristet = alle.map(v =>
    (v.patientId === neu.patientId && v.typ === neu.typ && istAktiv(v, neu.gueltigAb))
      ? { ...v, gueltigBis: vortag(neu.gueltigAb) }
      : v,
  );
  setzeAlle([...befristet, neu]);
  return neu;
}

export function updateVersicherung(id: string, patch: Partial<Omit<Versicherungsverhaeltnis, "id" | "patientId">>): void {
  setzeAlle(alle.map(v => (v.id === id ? { ...v, ...patch } : v)));
}

/** Beenden: setzt gueltigBis (kein Löschen). */
export function beendeVersicherung(id: string, gueltigBis: string): void {
  setzeAlle(alle.map(v => (v.id === id ? { ...v, gueltigBis } : v)));
}

/** Löschen — nur zulässig, wenn kein Mandat darauf verweist (Prüfung beim Aufrufer). */
export function loescheVersicherung(id: string): void {
  setzeAlle(alle.filter(v => v.id !== id));
}

// ── React-Anbindung ──────────────────────────────────────────────────────────

export function useVersicherungenFuerPatient(patientId: string, stichtag: string = GEGENWART_ISO): Versicherungsverhaeltnis[] {
  useSyncExternalStore(subscribe, () => alle);
  return versicherungenFuerPatient(patientId, stichtag);
}

// ── Seed: die bestehenden Fixture-Werte als Versicherungsverhältnisse ─────────
// Übernommen aus den zehn Patienten-Fixtures (P-2026-0041..0050): je eine
// laufende KVG. Zusatz-/Weitere-Versicherung waren dort leer → keine VVG/UVG.
// Keine erfundenen Karten- oder GLN-Werte.
function seed(): Versicherungsverhaeltnis[] {
  // Versicherer als Kostenträger-Kennung (Code), nicht als Name — die Namen
  // stehen ausschliesslich in der Versichererliste (krankenkassen.ts).
  const roh: { patientId: string; versichererId: string; karte: string; ab: string }[] = [
    { patientId: "P-2026-0041", versichererId: "groupe_mutuel", karte: "8075600000000041", ab: "12.01.2026" },
    { patientId: "P-2026-0042", versichererId: "css", karte: "8075600000000042", ab: "20.02.2026" },
    { patientId: "P-2026-0043", versichererId: "helsana", karte: "8075600000000043", ab: "03.09.2025" },
    { patientId: "P-2026-0044", versichererId: "groupe_mutuel", karte: "8075600000000044", ab: "15.06.2025" },
    { patientId: "P-2026-0045", versichererId: "swica", karte: "8075600000000045", ab: "28.07.2025" },
    { patientId: "P-2026-0046", versichererId: "sanitas", karte: "8075600000000046", ab: "22.02.2026" },
    { patientId: "P-2026-0047", versichererId: "visana", karte: "8075600000000047", ab: "01.11.2025" },
    { patientId: "P-2026-0048", versichererId: "kpt", karte: "8075600000000048", ab: "05.04.2025" },
    { patientId: "P-2026-0049", versichererId: "css", karte: "8075600000000049", ab: "18.12.2025" },
    { patientId: "P-2026-0050", versichererId: "concordia", karte: "8075600000000050", ab: "10.10.2025" },
  ];
  return roh.map((r, i) => ({
    id: `VV-SEED-${String(i + 1).padStart(3, "0")}`,
    patientId: r.patientId,
    typ: "kvg",
    versichererId: r.versichererId,
    gueltigAb: anzeigeZuIso(r.ab),
    gueltigBis: null,
    kartennummer: r.karte,
    policennummer: null,
    schadennummer: null,
    verfuegungsnummer: null,
    unfalldeckung: "unbekannt",
    unfalldatum: null,
    verfuegungsdatum: null,
    bemerkung: null,
    abrechnungsart: null,
  }));
}
