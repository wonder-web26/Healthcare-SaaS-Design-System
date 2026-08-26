/**
 * KLV-Bestand — eine Quelle für alle Oberflächen, Sitzungsdauer.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts. Vorher hielt jede
 * Oberfläche eine eigene Kopie der Leistungspositionen: der Arbeitsbereich und
 * der KLV-Reiter des Onboardings kopierten sie in lokalen Zustand und warfen
 * jede Änderung beim Verlassen weg, das Dossier mutierte das Modul-Array
 * unmittelbar. Drei Wahrheiten für dieselbe Sache.
 *
 * Von aussen wird nicht mehr in innere Strukturen gegriffen. Wer etwas ändern
 * will, ruft einen benannten Schreibweg — nur so lässt sich die Sperre an
 * einer Stelle durchsetzen statt an dreien.
 *
 * Kein Speicher über die Sitzung hinaus; der Prototyp hat keine Persistenz.
 */
import { useSyncExternalStore } from "react";
import { MOCK_KLV_VERORDNUNGEN } from "../mocks/klinische-artefakte-mock";
import { onboardingFaelle } from "../onboarding/faelle";
import { getMandate, MANDAT_STICHTAG } from "../mandate/store";
import { istAktiv } from "../mandate/mandate";
import type { KLVVerordnung, KLVLeistung, KLVStatus, KLVDiagnose } from "../../types/klinische-artefakte";
import { lpbGesperrt, lpbNaechster, lpbStatusLabel } from "../stammdaten/lpb-status";

/* ── Patientenkennung auflösen ─────────────────────────────────────────────── */

/**
 * Jede Verordnung trägt eine Patientenkennung. Fehlt sie, wird sie über den
 * Onboarding-Fall aufgelöst; `onboardingId` bleibt als Herkunftsangabe stehen.
 * Findet sich kein Fall, bleibt die Kennung leer — sie wird nicht geraten.
 */
function mitPatientKennung(v: KLVVerordnung): KLVVerordnung {
  if (v.patientId) return v;
  const fall = onboardingFaelle.find(f => f.id === v.onboardingId);
  return fall ? { ...v, patientId: fall.patientId } : v;
}

/**
 * Mandat des Blattes. Fehlt es, wird das aktive Mandat des Patienten
 * eingesetzt — heute trägt jeder Patient genau eines. Gibt es keines oder
 * mehrere, bleibt das Feld leer statt geraten; ein Blatt am falschen Mandat
 * hinge am falschen Zahler und am falschen Tarif.
 */
function mitMandatKennung(v: KLVVerordnung): KLVVerordnung {
  if (v.mandatId || !v.patientId) return v;
  const aktive = getMandate(v.patientId).filter(m => istAktiv(m, MANDAT_STICHTAG));
  return aktive.length === 1 ? { ...v, mandatId: aktive[0].id } : v;
}

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let bestand: KLVVerordnung[] = MOCK_KLV_VERORDNUNGEN.map(mitPatientKennung).map(mitMandatKennung);
const hoerer = new Set<() => void>();

function setzeBestand(neu: KLVVerordnung[]): void {
  bestand = neu;
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

function schnappschuss(): KLVVerordnung[] {
  return bestand;
}

/* ── Die Sperre ────────────────────────────────────────────────────────────── */

/**
 * Gesperrte Verordnungen werden nicht mehr geändert; wer etwas ändern will,
 * legt eine neue Version an.
 *
 * Ab „an Kasse übermittelt" ist das Blatt aus der Hand — es liegt bei der
 * Kasse, und eine stille Änderung würde bedeuten, dass eingereicht und
 * gespeichert auseinanderlaufen. Ersetzte Fassungen sind ohnehin Geschichte.
 *
 * Die Prüfung steht in JEDEM Schreibweg. Damit greift die Sperre in allen drei
 * Oberflächen — auch in denen, die nichts von ihr wissen.
 */
export function istGesperrt(v: KLVVerordnung): boolean {
  return lpbGesperrt(v.status);
}

/** Warum eine Verordnung gesperrt ist — für die Anzeige. */
export function sperrGrund(v: KLVVerordnung): string {
  if (!istGesperrt(v)) return "";
  if (v.status === "ersetzt") return "Diese Fassung wurde durch eine neue Version ersetzt.";
  if (v.status === "an_kasse") {
    return "Das Blatt liegt bei der Kasse. Eine stille Änderung würde bedeuten, dass eingereicht und gespeichert auseinanderlaufen — Änderungen erzeugen eine neue Version.";
  }
  return `Zu diesem Blatt liegt ein Entscheid vor. Es wird nicht mehr geändert; Änderungen erzeugen eine neue Version.`;
}

/** Verordnung samt Sperrprüfung holen; null heisst „nicht schreiben". */
function schreibbar(id: string): KLVVerordnung | null {
  const v = bestand.find(k => k.id === id);
  if (!v || istGesperrt(v)) return null;
  return v;
}

/* ── Lesen ─────────────────────────────────────────────────────────────────── */

export function useKlvVerordnungen(): KLVVerordnung[] {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

export function getKlvVerordnungen(): KLVVerordnung[] {
  return bestand;
}

export function getKlvVerordnung(id: string): KLVVerordnung | undefined {
  return bestand.find(k => k.id === id);
}

/** Verordnungen eines Patienten — der Weg, den das Dossier nimmt. */
export function getKlvFuerPatient(patientId: string): KLVVerordnung[] {
  return bestand.filter(k => k.patientId === patientId);
}

/** Verordnung eines Onboarding-Falls — der Weg, den der Erfassungsschritt nimmt. */
export function getKlvFuerOnboarding(onboardingId: string): KLVVerordnung | undefined {
  return bestand.find(k => k.onboardingId === onboardingId);
}

/* ── Schreiben ─────────────────────────────────────────────────────────────── */

/** Position anfügen. */
export function positionHinzufuegen(klvId: string, position: KLVLeistung): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, leistungspositionen: [...k.leistungspositionen, position] }
    : k));
}

/** Einzelne Felder einer Position ändern; alles Übrige bleibt. */
export function positionAendern(klvId: string, positionId: string, patch: Partial<KLVLeistung>): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, leistungspositionen: k.leistungspositionen.map(p => p.id === positionId ? { ...p, ...patch } : p) }
    : k));
}

/** Position entfernen. */
export function positionEntfernen(klvId: string, positionId: string): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, leistungspositionen: k.leistungspositionen.filter(p => p.id !== positionId) }
    : k));
}

/** Mehrere Positionen in einem Zug setzen — für Umrechnungen über die ganze Liste. */
export function positionenSetzen(klvId: string, positionen: KLVLeistung[]): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId ? { ...k, leistungspositionen: positionen } : k));
}

/** Diagnosen der Verordnung setzen. */
export function diagnosenSetzen(klvId: string, diagnosen: KLVDiagnose[]): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => k.id === klvId ? { ...k, diagnosen } : k));
}

/** Kopffelder der Verordnung ändern (Gültigkeit, Ziele, Verantwortliche). */
export function verordnungAendern(
  klvId: string,
  felder: Partial<Omit<KLVVerordnung, "id" | "leistungspositionen" | "status">>,
): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.map(k => (k.id === klvId ? { ...k, ...felder } : k)));
}

/**
 * Statuswechsel — nur vorwärts entlang der Kette, und nur um einen Schritt.
 *
 * `ersetzt` wird hier nie gesetzt: es entsteht ausschliesslich beim Erstellen
 * einer neuen Version. Der Wechsel auf `kontrolliert` verlangt mindestens eine
 * Position — ein leeres Blatt ist kein Blatt.
 *
 * Rückgabe: der Grund einer Ablehnung, sonst leer.
 */
export function statusWechseln(klvId: string, status: KLVStatus, person: string, jetzt: string): string {
  /* Bewusst NICHT über schreibbar(): die Sperre schützt den INHALT — Positionen,
     Diagnosen, Kopffelder. Der Zustand muss weiterlaufen können, sonst endete
     die Kette bei „an Kasse übermittelt" in einer Sackgasse und der Entscheid
     liesse sich nie eintragen. Eine ersetzte Fassung wechselt nichts mehr. */
  const v = bestand.find(k => k.id === klvId);
  if (!v) return "Das Blatt wurde nicht gefunden.";
  if (v.status === "ersetzt") return "Eine ersetzte Fassung wechselt den Zustand nicht mehr.";
  if (status === "ersetzt") return "„Ersetzt“ entsteht nur beim Erstellen einer neuen Version.";
  if (lpbNaechster(v.status) !== status) return "Es wird nur vorwärts gewechselt, und nur um einen Schritt.";
  if (status === "kontrolliert" && v.leistungspositionen.length === 0) {
    return "Ohne Leistungsposition lässt sich nichts kontrollieren.";
  }
  setzeBestand(bestand.map(k => k.id === klvId
    ? { ...k, status, statusProtokoll: [...k.statusProtokoll, { status, person, zeitpunkt: jetzt }] }
    : k));
  return "";
}

/**
 * Neue Version: übernimmt Positionen und Diagnosen der Vorversion, beginnt bei
 * `entwurf`; die Vorversion wird `ersetzt`. Die Versionszahl läuft je Patient
 * über die höchste bereits vergebene weiter.
 */
export function neueVersionErstellen(klvId: string, person: string, jetzt: string): KLVVerordnung | null {
  const alt = bestand.find(k => k.id === klvId);
  if (!alt) return null;
  const hoechste = bestand
    .filter(k => k.patientId === alt.patientId)
    .reduce((m, k) => Math.max(m, k.version), 0);
  const neu: KLVVerordnung = {
    ...alt,
    id: `${alt.id}-V${hoechste + 1}`,
    version: hoechste + 1,
    art: "folge",
    status: "entwurf",
    statusProtokoll: [{ status: "entwurf", person, zeitpunkt: jetzt }],
    erstelltVon: person,
    erstellDatum: jetzt.split(" ")[0],
    leistungspositionen: alt.leistungspositionen.map(p => ({ ...p })),
    diagnosen: alt.diagnosen.map(d => ({ ...d })),
    zielformulierungen: [...alt.zielformulierungen],
  };
  setzeBestand([...bestand.map(k => (k.id === klvId ? { ...k, status: "ersetzt" as KLVStatus } : k)), neu]);
  return neu;
}

/** Neue Verordnung anlegen. */
export function verordnungAnlegen(v: KLVVerordnung): void {
  setzeBestand([...bestand, mitMandatKennung(mitPatientKennung(v))]);
}

/** Verordnung entfernen — im Bestand nur für Entwürfe vorgesehen. */
export function verordnungEntfernen(klvId: string): void {
  const v = schreibbar(klvId);
  if (!v) return;
  setzeBestand(bestand.filter(k => k.id !== klvId));
}
