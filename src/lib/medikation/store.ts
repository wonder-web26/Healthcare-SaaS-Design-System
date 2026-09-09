/**
 * Bestand der Medikationspositionen — Sitzungsdauer.
 *
 * Muster wie lib/allergien/store.ts und lib/diagnosen/store.ts:
 * useSyncExternalStore, Hoerer-Set, use…()-Hooks, …Sichern()-Funktionen.
 * Keine Persistenz — Absicht (Prototyp).
 *
 * DIE NEGATIV-AUSSAGE IST EIN ZUSTAND, KEINE LEERE LISTE. «Die Klientin nimmt
 * keine Medikamente ein» traegt Zeitpunkt und Person, wie
 * `Patient.noKnownAllergies` im Schema. Sie ist zugleich die Bestaetigung der
 * (leeren) Gesamtliste — darum setzt sie dieselben Sign-off-Felder.
 */
import { useSyncExternalStore } from "react";
import { GEGENWART_ISO } from "../gegenwart";
import type { Medikationsposition, MedikationsErhebung, BefundBearbeitung } from "./medikation";

/** Angemeldete Pflegefachperson des Prototyps — wie im Allergien-Store. */
export const ANGEMELDETE_PFLEGEFACHPERSON = {
  userId: "U-SWEBER",
  name: "S. Weber",
  qualifikation: "Pflegefachfrau HF",
} as const;

/* ── Seed ─────────────────────────────────────────────────────────────────
   Sechs Positionen fuer P-2026-0041 (Steiner). Enthaelt die vier verlangten
   Faelle: eine `zu_pruefen` mit `free`-Posologie, eine `unbestaetigt` ohne
   Verordner, eine Reserve und eine Selbstmedikation. Zwei Positionen
   blockieren damit den Sign-off. ── */
let positionen: Medikationsposition[] = [
  {
    id: "MED-901", patientId: "P-2026-0041",
    productCode: "AM-0003", productName: "BELOC ZOK", staerke: "25 mg", darreichungsform: "Ret Tabl",
    route: "p.o.", baseUnit: "Tabl",
    posologie: { typ: "#-#-#-#", morgen: "1", mittag: "0", abend: "0", nacht: "0" },
    startDate: "2025-11-03", endDate: null,
    instructions: "Morgens nach dem Frühstück.", reserveIndication: "",
    status: "active", approvedByContactId: "K-001", verordnerUnbekannt: false,
    pruefstatus: "bestaetigt", quelle: "manuell", quelleAm: "2026-02-18",
    herkunftsvermerk: "", selbstmedikation: false, behandlungsgrund: "Arterielle Hypertonie",
    uebersteuert: false, uebersteuerungVermerk: "",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    bestaetigtDurchUserId: "U-MSUTTER", bestaetigtVonName: "M. Sutter",
    erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    id: "MED-902", patientId: "P-2026-0041",
    productCode: "AM-0004", productName: "TORASEMID Helvepharm", staerke: "10 mg", darreichungsform: "Tabl",
    route: "p.o.", baseUnit: "Tabl",
    posologie: { typ: "#-#-#-#", morgen: "1", mittag: "0", abend: "0", nacht: "0" },
    startDate: "2025-11-03", endDate: null,
    instructions: "", reserveIndication: "",
    status: "active", approvedByContactId: "K-001", verordnerUnbekannt: false,
    pruefstatus: "bestaetigt", quelle: "manuell", quelleAm: "2026-02-18",
    herkunftsvermerk: "", selbstmedikation: false, behandlungsgrund: "Herzinsuffizienz NYHA II",
    uebersteuert: false, uebersteuerungVermerk: "",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    bestaetigtDurchUserId: "U-MSUTTER", bestaetigtVonName: "M. Sutter",
    erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    /* Fall 1: Posologie liess sich nicht ins Blockschema abbilden — uebernommen,
       aber nicht geprueft. Blockiert den Sign-off. */
    id: "MED-903", patientId: "P-2026-0041",
    productCode: "AM-0006", productName: "FENTANYL Sandoz", staerke: "25 mcg/h", darreichungsform: "Matrixpfl",
    route: "topical", baseUnit: "Pfl",
    posologie: { typ: "free", text: "Pflasterwechsel alle 72 h, jeweils Mo und Do morgens" },
    startDate: "2026-01-12", endDate: null,
    instructions: "Klebestelle jedes Mal wechseln, altes Pflaster entfernen.", reserveIndication: "",
    status: "active", approvedByContactId: "K-001", verordnerUnbekannt: false,
    pruefstatus: "zu_pruefen", quelle: "manuell", quelleAm: "2026-02-18",
    herkunftsvermerk: "Aus der mitgebrachten Liste übernommen.",
    selbstmedikation: false, behandlungsgrund: "Chronische Schmerzen",
    uebersteuert: false, uebersteuerungVermerk: "",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    bestaetigtDurchUserId: null, bestaetigtVonName: null,
    erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    /* Fall 2: Verordner ausdruecklich unbekannt. Blockiert den Sign-off. */
    id: "MED-904", patientId: "P-2026-0041",
    productCode: "AM-0005", productName: "MOVICOL", staerke: "13.8 g", darreichungsform: "Plv Btl",
    route: "p.o.", baseUnit: "Btl",
    posologie: { typ: "#-#-#-#", morgen: "1", mittag: "0", abend: "0", nacht: "0" },
    startDate: "2026-02-01", endDate: null,
    instructions: "In einem Glas Wasser auflösen.", reserveIndication: "",
    status: "active", approvedByContactId: null, verordnerUnbekannt: true,
    pruefstatus: "unbestaetigt", quelle: "manuell", quelleAm: "2026-02-18",
    herkunftsvermerk: "Angabe des Ehemanns, Präparat nicht gesichtet.",
    selbstmedikation: false, behandlungsgrund: "Obstipation",
    uebersteuert: false, uebersteuerungVermerk: "",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    bestaetigtDurchUserId: null, bestaetigtVonName: null,
    erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    /* Fall 3: Reservemedikation. */
    id: "MED-905", patientId: "P-2026-0041",
    productCode: "AM-0008", productName: "NOVALGIN", staerke: "500 mg/ml", darreichungsform: "Tropfen",
    route: "p.o.", baseUnit: "Tr",
    posologie: { typ: "reserve", bedingung: "Bei Schmerzen ab NRS 5", tageshoechstmenge: "80 Tr", mindestabstandStunden: "6" },
    startDate: "2026-01-12", endDate: null,
    instructions: "In wenig Wasser einnehmen.",
    reserveIndication: "Bei Schmerzen ab NRS 5",
    status: "active", approvedByContactId: "K-001", verordnerUnbekannt: false,
    pruefstatus: "bestaetigt", quelle: "manuell", quelleAm: "2026-02-18",
    herkunftsvermerk: "", selbstmedikation: false, behandlungsgrund: "Schmerzreserve",
    uebersteuert: false, uebersteuerungVermerk: "",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    bestaetigtDurchUserId: "U-MSUTTER", bestaetigtVonName: "M. Sutter",
    erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
  {
    /* Fall 4: Selbstmedikation — definitionsgemaess ohne Verordner. */
    id: "MED-906", patientId: "P-2026-0041",
    productCode: "AM-0007", productName: "CALCIMAGON D3", staerke: "500 mg/800 IE", darreichungsform: "Brausetabl",
    route: "p.o.", baseUnit: "Tabl",
    posologie: { typ: "#-#-#-#", morgen: "0", mittag: "0", abend: "1", nacht: "0" },
    startDate: "2024-09-01", endDate: null,
    instructions: "In einem Glas Wasser auflösen.", reserveIndication: "",
    status: "active", approvedByContactId: null, verordnerUnbekannt: false,
    pruefstatus: "bestaetigt", quelle: "manuell", quelleAm: "2026-02-18",
    herkunftsvermerk: "Kauft die Klientin selbst in der Apotheke.",
    selbstmedikation: true, behandlungsgrund: "Osteoporose-Prophylaxe",
    uebersteuert: false, uebersteuerungVermerk: "",
    erfasstDurchUserId: "U-MSUTTER", erfasstVonName: "M. Sutter",
    bestaetigtDurchUserId: "U-MSUTTER", bestaetigtVonName: "M. Sutter",
    erstelltAm: "2026-02-18", geaendertAm: "2026-02-18",
  },
];

let erhebungen: MedikationsErhebung[] = [];

/**
 * Bearbeitung der Prüfbefunde, je Befundkennung.
 *
 * Der Befund selbst kommt vom Prüfdienst und wird nie verändert — was hier
 * liegt, ist ausschliesslich UNSERE Reaktion darauf: gesehen, oder bewusst
 * übersteuert mit Begründung. Darum ein eigener Bestand und kein Feld am
 * Befund.
 */
let befundBearbeitungen: Record<string, BefundBearbeitung> = {};

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const pSchnappschuss = () => positionen;
const eSchnappschuss = () => erhebungen;
const bSchnappschuss = () => befundBearbeitungen;

export function useMedikationspositionen(): Medikationsposition[] {
  return useSyncExternalStore(subscribe, pSchnappschuss, pSchnappschuss);
}

export function useMedikationsErhebungen(): MedikationsErhebung[] {
  return useSyncExternalStore(subscribe, eSchnappschuss, eSchnappschuss);
}

export function useBefundBearbeitungen(): Record<string, BefundBearbeitung> {
  return useSyncExternalStore(subscribe, bSchnappschuss, bSchnappschuss);
}

/** Ohne Eintrag ist ein Befund offen — Nichtstun ist keine Kenntnisnahme. */
export function getBefundBearbeitung(befundId: string): BefundBearbeitung {
  return befundBearbeitungen[befundId]
    ?? { zustand: "offen", vonName: null, am: null, begruendung: null };
}

/** Befund zur Kenntnis nehmen — Person und Zeitpunkt werden festgehalten. */
export function befundQuittieren(befundId: string, vonName: string): void {
  befundBearbeitungen = {
    ...befundBearbeitungen,
    [befundId]: { zustand: "zur_kenntnis_genommen", vonName, am: GEGENWART_ISO, begruendung: null },
  };
  melden();
}

/** Befund übersteuern — nur mit Begründung; ohne sie geschieht nichts. */
export function befundUebersteuern(befundId: string, vonName: string, begruendung: string): void {
  if (!begruendung.trim()) return;
  befundBearbeitungen = {
    ...befundBearbeitungen,
    [befundId]: { zustand: "uebersteuert", vonName, am: GEGENWART_ISO, begruendung: begruendung.trim() },
  };
  melden();
}

/** Erhebung eines Patienten; ohne Eintrag gilt: nichts erfasst, nichts bestaetigt. */
export function getMedikationsErhebung(patientId: string): MedikationsErhebung {
  return erhebungen.find(e => e.patientId === patientId)
    ?? { patientId, keineMedikamente: false, bestaetigtAm: null, bestaetigtVonName: null, bestaetigtVonQualifikation: null };
}

let zaehler = 906;

/** Position anlegen oder aendern; leere Kennung legt an. */
export function positionSichern(e: Omit<Medikationsposition, "erstelltAm" | "geaendertAm"> & { id: string }): Medikationsposition {
  const bestehend = positionen.find(p => p.id === e.id);
  const gespeichert: Medikationsposition = bestehend
    ? { ...bestehend, ...e, geaendertAm: GEGENWART_ISO }
    : { ...e, id: e.id || `MED-${++zaehler}`, erstelltAm: GEGENWART_ISO, geaendertAm: GEGENWART_ISO };
  positionen = bestehend
    ? positionen.map(p => (p.id === e.id ? gespeichert : p))
    : [...positionen, gespeichert];
  melden();
  return gespeichert;
}

/**
 * Negativ-Aussage setzen: «Die Klientin nimmt keine Medikamente ein.»
 * Sie ist zugleich die Bestaetigung der leeren Gesamtliste.
 */
export function keineMedikamenteBestaetigen(patientId: string, name: string, qualifikation: string): void {
  setzeErhebung({
    patientId, keineMedikamente: true,
    bestaetigtAm: GEGENWART_ISO, bestaetigtVonName: name, bestaetigtVonQualifikation: qualifikation,
  });
  melden();
}

/** Sign-off der erfassten Gesamtliste. */
export function listeBestaetigen(patientId: string, name: string, qualifikation: string): void {
  setzeErhebung({
    patientId, keineMedikamente: false,
    bestaetigtAm: GEGENWART_ISO, bestaetigtVonName: name, bestaetigtVonQualifikation: qualifikation,
  });
  melden();
}

/**
 * «Änderung erfassen» — hebt die Bestaetigung auf, damit weitergearbeitet
 * werden kann. Die Positionen bleiben unberuehrt; eine Negativ-Aussage faellt
 * damit weg, denn wer aendert, behauptet nicht mehr «es gibt keine».
 */
export function bestaetigungAufheben(patientId: string): void {
  setzeErhebung({
    patientId, keineMedikamente: false,
    bestaetigtAm: null, bestaetigtVonName: null, bestaetigtVonQualifikation: null,
  });
  melden();
}

function setzeErhebung(neu: MedikationsErhebung): void {
  erhebungen = erhebungen.some(e => e.patientId === neu.patientId)
    ? erhebungen.map(e => (e.patientId === neu.patientId ? neu : e))
    : [...erhebungen, neu];
}
