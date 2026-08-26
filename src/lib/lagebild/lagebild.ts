/**
 * Annas Lagebild — was bei einem Patienten offen ist, gerechnet.
 *
 * KEIN MODELLAUFRUF. Jede Aussage zählt etwas ab, das an anderer Stelle im
 * Dossier steht, und nennt diese Stelle. Was sich nicht rechnen lässt, steht
 * unter „nicht beurteilbar" — nicht als Vermutung im Befund.
 *
 * Die alte Zusammenfassung sagte „Steiner, Hans-Rudolf (77 Jahre),
 * Schweregrad Mittel, Pflege HKP. Zugewiesen an Sandra Weber." — vier
 * Angaben, die alle in der Kopfzeile darüber stehen, ohne Kennzeichnung als
 * erzeugter Text. Sie beantwortete keine Frage, die der Kopf nicht schon
 * beantwortet hatte.
 */
import type { KLVVerordnung } from "../../types/klinische-artefakte";
import type { Kostengutsprache } from "../mandate/verordnungen";
import { offeneLuecke, tageInklusive } from "../mandate/verordnungen";
import { lpbAmZug, lpbStatusLabel } from "../stammdaten/lpb-status";
import { wartetSeitTagen } from "../klv/warten";
import { abgleichen } from "../klv/abgleich";
import type { MonatsKennzahlen } from "../einsaetze/kontrolle";
import { type Austritt, austrittText } from "../patienten/austritt";
import { WOCHENTAGE_LANG, MONATE } from "../einsaetze/einsaetze";

/** Wie ernst eine Aussage ist — bestimmt Band und Reihenfolge. */
export type Band = "pruefen" | "belegt";

export interface Befund {
  id: string;
  band: Band;
  text: string;
  /** Beschriftung des Quellenverweises. */
  quelle: string;
  /** Ansichtsschlüssel im Dossier, auf den der Verweis führt. */
  ansicht: string;
  /** Optionale Abfrage an der Adresse, etwa der Monat. */
  suchteil?: string;
  /** Kleiner = dringlicher. Nur die fünf dringlichsten erscheinen. */
  rang: number;
}

/** Höchstens so viele Befunde. Mehr liest niemand, und die Reihenfolge sagt schon alles. */
export const BEFUNDE_MAX = 5;

/**
 * Was mangels Datenmodell offen bleibt.
 *
 * Diese Liste ist kein Versäumnis, sondern eine Angabe: sie sagt der
 * Fachperson, worüber das Lagebild schweigt, damit ihr Schweigen nicht als
 * Unbedenklichkeit gelesen wird.
 */
export const NICHT_BEURTEILBAR = [
  "Medikation — es besteht kein Medikationsmodell im Cockpit.",
  "Supervision und fachliche Begleitung der angehörigen Person.",
  "Der Inhalt der Pflegeberichte — gezählt wird, ob einer vorliegt, nicht was darin steht.",
  "Offene Pflichtdokumente — Dokumentstände liegen am Onboarding-Fall, nicht am Patienten.",
];

export interface LagebildQuellen {
  patientId: string;
  klvs: KLVVerordnung[];
  kostengutsprachen: Kostengutsprache[];
  mandatIds: string[];
  kennzahlen: MonatsKennzahlen;
  monat: { jahr: number; monat: number };
  /** Offene Pendenzen der Person: gesamt und davon überfällig. */
  pendenzen: { offen: number; ueberfaellig: number };
  stichtag: Date;
  /** Gesetzt, sobald die Person ausgetreten ist. */
  austritt: Austritt | null;
}

/** Wer am Zug ist, im Klartext — `lpbAmZug` gibt einen Code zurück. */
const AM_ZUG_TEXT: Record<string, string> = {
  spitex: "bei der Spitex",
  arzt: "bei der Ärztin",
  kasse: "bei der Krankenkasse",
  null: "",
};

/** Zahlwörter bis zwölf, darüber die Ziffer — wie in der Pflegekontrolle. */
const WORT = ["kein", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben",
  "acht", "neun", "zehn", "elf", "zwölf"];
const wort = (n: number) => (n < WORT.length ? WORT[n] : String(n));

export function lagebild(q: LagebildQuellen): Befund[] {
  const befunde: Befund[] = [];
  const monatSuchteil = `?monat=${q.monat.jahr}-${String(q.monat.monat + 1).padStart(2, "0")}`;

  /* ── Austritt ───────────────────────────────────────────────────────────
     Nach dem Austritt schweigt das Lagebild über alles, was eine Handlung
     verlangt: eine Wartezeit, die niemand mehr abwartet, eine Gutsprache, die
     niemand mehr einholt, ein Abgleich gegen eine Bewilligung, nach der nicht
     mehr gepflegt wird, ein Bericht, den niemand mehr schreibt.

     Was bleibt, ist Vergangenes, das noch abzuschliessen ist: ungeprüfte
     Einsätze, Tage ohne Einsatz im laufenden Monat, offene Pendenzen. Sie
     betreffen einen Zeitraum, in dem gepflegt wurde, und der ist abzurechnen.

     Der Austritt selbst steht zuoberst — er ordnet alles darunter ein. */
  const ausgetreten = q.austritt !== null;
  if (q.austritt) {
    befunde.push({
      id: "austritt", band: "belegt", rang: 0,
      text: `Der Patient ist ${austrittText(q.austritt)}. Vergangenes bleibt abzuschliessen; Neues fällt nicht mehr an.`,
      quelle: "Austritt", ansicht: "austritt",
    });
  }

  /* ── Leistungsplanungsblatt: wartet es, und bei wem? ── */
  const blatt = [...q.klvs]
    .filter(k => k.patientId === q.patientId && k.status !== "ersetzt")
    .sort((a, b) => b.version - a.version)[0] ?? null;
  if (blatt && !ausgetreten) {
    const tage = wartetSeitTagen(blatt);
    if (tage !== null) {
      befunde.push({
        id: "blatt-wartet", band: "pruefen", rang: 20,
        text: `Das Leistungsplanungsblatt ${blatt.id} wartet seit ${tage} Tagen ${AM_ZUG_TEXT[lpbAmZug(blatt.status) ?? "null"]} — Zustand „${lpbStatusLabel(blatt.status)}".`,
        quelle: "Leistungsplanungsblatt", ansicht: "leistungsplanungsblatt",
      });
    }
  }

  /* ── Kostengutsprache: besteht eine Lücke? ──
     Ohne gültige Gutsprache kann die Kasse bis zu fünf Jahre rückwirkend
     zurückfordern — auch für erbrachte und ärztlich verordnete Leistungen. */
  const eigeneKgs = q.kostengutsprachen.filter(k => q.mandatIds.includes(k.mandatId));
  const luecke = offeneLuecke(eigeneKgs, q.stichtag);
  if (luecke && !ausgetreten) {
    const tage = tageInklusive(luecke.von, q.stichtag);
    befunde.push({
      id: "kgs-luecke", band: "pruefen", rang: 10,
      text: `Seit ${tage} Tagen besteht keine gültige Kostengutsprache. Erbrachte Leistungen kann die Kasse bis zu fünf Jahre rückwirkend zurückfordern.`,
      quelle: "Verordnung und Kostengutsprache", ansicht: "verordnung",
    });
  }

  /* ── Geplant gegen bewilligt ── */
  if (blatt && !ausgetreten) {
    const a = abgleichen(blatt, eigeneKgs, q.stichtag);
    /* `differenz` steht in Stunden je Woche (bewilligt − geplant, negativ =
       zu viel geplant). Gerundet auf Minuten; unter einer Minute wird nichts
       gemeldet — eine Aussage über eine halbe Minute ist keine. */
    const zuVielMin = a.lage === "ueber" && a.differenz !== null ? Math.round(-a.differenz * 60) : 0;
    if (zuVielMin >= 1) {
      befunde.push({
        id: "ueber-bewilligung", band: "pruefen", rang: 30,
        text: `Das Blatt plant ${zuVielMin} Minuten je Woche mehr, als die Kasse bewilligt hat.`,
        quelle: "Leistungsplanungsblatt", ansicht: "leistungsplanungsblatt",
      });
    }
  }

  /* ── Pflegekontrolle des laufenden Monats ── */
  const k = q.kennzahlen;
  const monatName = `${MONATE[q.monat.monat]} ${q.monat.jahr}`;
  if (k.ohneEinsatz > 0) {
    const muster = k.muster.wochentag !== null
      ? ` Alle fallen auf einen ${WOCHENTAGE_LANG[k.muster.wochentag]} — das ist ein Muster.`
      : "";
    befunde.push({
      id: "ohne-einsatz", band: "pruefen", rang: 25,
      text: `${wort(k.ohneEinsatz).replace(/^./, c => c.toUpperCase())} Tage im ${monatName} tragen keinen Einsatz, obwohl ein Tagessoll besteht.${muster}`,
      quelle: "Pflegekontrolle", ansicht: "pflegekontrolle", suchteil: monatSuchteil,
    });
  }
  if (k.offen > 0) {
    befunde.push({
      id: "ungeprueft", band: "pruefen", rang: 40,
      text: `${k.offen} von ${k.einsaetzeGesamt} Einsätzen im ${monatName} sind noch ungeprüft.`,
      quelle: "Pflegekontrolle", ansicht: "pflegekontrolle", suchteil: monatSuchteil,
    });
  }
  if (k.mitEinsatz > 0 && k.mitBericht < k.mitEinsatz && !ausgetreten) {
    befunde.push({
      id: "berichte", band: "belegt", rang: 60,
      text: `An ${k.mitEinsatz - k.mitBericht} von ${k.mitEinsatz} Tagen mit Einsatz fehlt der Pflegebericht.`,
      quelle: "Pflegekontrolle", ansicht: "pflegekontrolle", suchteil: monatSuchteil,
    });
  }

  /* ── Pendenzen ── */
  if (q.pendenzen.offen > 0) {
    befunde.push({
      id: "pendenzen", band: q.pendenzen.ueberfaellig > 0 ? "pruefen" : "belegt",
      rang: q.pendenzen.ueberfaellig > 0 ? 35 : 70,
      text: `${q.pendenzen.offen} ${q.pendenzen.offen === 1 ? "Pendenz ist" : "Pendenzen sind"} offen${q.pendenzen.ueberfaellig > 0 ? `, davon ${q.pendenzen.ueberfaellig} überfällig` : ""}.`,
      quelle: "Pendenzen", ansicht: "pendenzen",
    });
  }

  return befunde.sort((a, b) => a.rang - b.rang).slice(0, BEFUNDE_MAX);
}

/**
 * Was das Lagebild geprüft hat — für den Fall, dass nichts offen ist.
 *
 * Ohne diese Aufzählung liesse „nichts offen" nicht erkennen, worauf sich
 * das bezieht, und wäre damit wertlos.
 */
export const GEPRUEFT_WURDE =
  "Leistungsplanungsblatt, Kostengutsprache, Abgleich geplant gegen bewilligt, "
  + "Einsätze und Pflegeberichte des laufenden Monats sowie offene Pendenzen.";
