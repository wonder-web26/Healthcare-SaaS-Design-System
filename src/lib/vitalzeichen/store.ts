/**
 * Bestand der Vitalzeichen-Messungen — Sitzungsdauer.
 *
 * Muster wie lib/allergien/store.ts und lib/medikation/store.ts:
 * useSyncExternalStore, Hoerer-Set, use…()-Hooks. Keine Persistenz (Prototyp).
 *
 * APPEND-ONLY. Eine Korrektur ist ein NEUER Eintrag mit `korrekturVon`; der
 * korrigierte bleibt bestehen und in der Einzelmessungsliste sichtbar,
 * gekennzeichnet und mit Verweis. Nichts wird ueberschrieben — «wer hat wann
 * was gemessen» ist bei einer Kontrolle die Frage, und darauf antwortet kein
 * geloeschter Eintrag.
 *
 * DIE PATIENTENKENNUNG IST IMMER DIE ECHTE. Das Onboarding loest sie ueber
 * patientFuerOnboarding auf (wie Allergien und Medikamente) — beide Einstiege
 * sehen denselben Bestand, und das fruehere Umhaengen in der Konvertierung
 * entfaellt ersatzlos.
 */
import { useSyncExternalStore } from "react";
import { GEGENWART_ISO } from "../gegenwart";
import type { VitalMessung, VitalWert, Zielwert, ParameterCode, Beurteilung, Erhebungsart } from "./vitalzeichen";

/* ── Seed ──────────────────────────────────────────────────────────────────
   P-2026-0041 (Steiner). Deckt die verlangten Faelle ab: mehrere Parameter
   mit Werten, Atemfrequenz nie erhoben, SpO2 zuletzt als nicht erhebbar
   dokumentiert, Blutzucker von der Angehoerigen erhoben, juengster Blutdruck
   als auffaellig hoch beurteilt (mit Pendenz-Vermerk), Koerpergroesse aus
   einem Dokument mit altem Messdatum, eine Gewichtskorrektur (append-only),
   Temperatur an zwei Messorten. Gegenwart des Prototyps: 2026-08-04. ── */

const SUTTER = { id: "U-MSUTTER", name: "M. Sutter", rolle: "Pflegefachfrau HF" };
const WEBER = { id: "U-SWEBER", name: "S. Weber", rolle: "Pflegefachfrau HF" };
const VERA = { id: "A-2026-0101", name: "Vera Steiner", rolle: "Angehörige" };

let laufnummer = 0;
/** Kompakter Seed-Bauer — nur hier, nicht exportiert. */
function m(
  messZeit: string, erfasst: string, person: { id: string; name: string; rolle: string },
  erhebungsart: Erhebungsart, geraet: string | null, notiz: string,
  werte: VitalWert[],
  korrekturVon: string | null = null,
): VitalMessung {
  return {
    id: `VZ-${String(++laufnummer).padStart(3, "0")}`,
    patientId: "P-2026-0041",
    messZeitpunkt: messZeit, erfasstAm: erfasst,
    nachtrag: messZeit.slice(0, 10) !== erfasst.slice(0, 10),
    gemessenDurchUserId: person.id, gemessenDurchName: person.name, gemessenDurchRolle: person.rolle,
    erhebungsart, messgeraet: geraet, notiz, korrekturVon,
    werte,
  };
}
/** Wert-Bauer mit Vorgaben. */
function w(parameterCode: ParameterCode, wert: number | null, extras: Partial<VitalWert> = {}): VitalWert {
  return {
    parameterCode, wert, zweitwert: null, qualifier: {},
    nichtErhebbar: false, nichtErhebbarGrund: "",
    beurteilung: null, beurteilungBegruendung: "", beurteiltVonName: null, beurteiltVonRolle: null,
    ...extras,
  };
}
const beurteilt = (b: Beurteilung, von = SUTTER): Partial<VitalWert> =>
  ({ beurteilung: b, beurteiltVonName: von.name, beurteiltVonRolle: von.rolle });

let messungen: VitalMessung[] = [
  // Koerpergroesse: aus einem Dokument, Messdatum alt — ein Nachtrag.
  m("2019-03-12T09:00", "2026-06-18T14:20", SUTTER, "dokument", null,
    "Grösse aus dem Austrittsbericht KSW übernommen.",
    [w("height", 174, beurteilt("normal"))]),

  // Blutdruck-/Puls-Reihe ueber sieben Wochen (etwa alle 3–4 Tage).
  m("2026-06-18T09:15", "2026-06-18T09:20", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 138, { zweitwert: 86, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("heart_rate", 74, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal") }),
     w("weight", 79.4, beurteilt("normal")),
     w("temperature", 36.8, { qualifier: { messort: "ohr" }, ...beurteilt("normal") }),
     w("oxygen_saturation", 95, { qualifier: { atmung: "umgebungsluft" }, ...beurteilt("normal") })]),
  m("2026-06-22T10:00", "2026-06-22T10:05", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 134, { zweitwert: 84, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("heart_rate", 72, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal") })]),
  m("2026-06-26T09:40", "2026-06-26T09:45", WEBER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 140, { zweitwert: 88, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal", WEBER) }),
     w("temperature", 37.0, { qualifier: { messort: "ohr" }, ...beurteilt("normal", WEBER) })]),
  m("2026-06-30T09:30", "2026-06-30T09:35", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 136, { zweitwert: 85, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("heart_rate", 76, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal") }),
     w("weight", 79.0, beurteilt("normal"))]),
  // Gewichtskorrektur: Zahlendreher. Die Korrektur STELLT DEN BESUCH NEU DAR —
  // auch die unveraenderten Werte, sonst verloere die Reihe sie mit dem alten
  // Eintrag. Der alte bleibt sichtbar, gekennzeichnet, mit Verweis.
  m("2026-06-30T09:30", "2026-06-30T16:10", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron",
    "Korrektur: Gewicht war mit 97.0 statt 79.0 erfasst (Zahlendreher).",
    [w("blood_pressure", 136, { zweitwert: 85, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("heart_rate", 76, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal") }),
     w("weight", 79.0, beurteilt("normal"))], "VZ-005"),
  m("2026-07-04T10:15", "2026-07-04T10:20", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 142, { zweitwert: 88, qualifier: { koerperhaltung: "sitzend", koerperstelle: "rechter_arm" }, ...beurteilt("normal") }),
     w("temperature", 36.9, { qualifier: { messort: "stirn" }, ...beurteilt("normal") })]),
  m("2026-07-08T09:20", "2026-07-08T09:25", WEBER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 138, { zweitwert: 86, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal", WEBER) }),
     w("heart_rate", 78, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal", WEBER) })]),
  m("2026-07-12T09:10", "2026-07-12T09:15", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 144, { zweitwert: 90, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("weight", 78.6, { qualifier: { bedingungen: "vor_essen" }, ...beurteilt("normal") }),
     w("temperature", 37.2, { qualifier: { messort: "ohr" }, ...beurteilt("normal") })]),
  m("2026-07-16T10:05", "2026-07-16T10:10", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 140, { zweitwert: 87, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("oxygen_saturation", 94, { qualifier: { atmung: "umgebungsluft" }, ...beurteilt("normal") })]),
  m("2026-07-20T09:45", "2026-07-20T09:50", WEBER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 146, { zweitwert: 90, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal", WEBER) }),
     w("heart_rate", 80, { qualifier: { rhythmus: "unregelmaessig" }, ...beurteilt("normal", WEBER) }),
     w("temperature", 37.1, { qualifier: { messort: "stirn" }, ...beurteilt("normal", WEBER) })]),
  m("2026-07-24T09:30", "2026-07-24T09:35", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 143, { zweitwert: 89, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("weight", 78.2, beurteilt("normal"))]),
  m("2026-07-28T09:25", "2026-07-28T09:30", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron", "",
    [w("blood_pressure", 145, { zweitwert: 91, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" }, ...beurteilt("normal") }),
     w("heart_rate", 77, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal") }),
     w("temperature", 37.0, { qualifier: { messort: "ohr" }, ...beurteilt("normal") })]),
  // Blutzucker: von der Angehoerigen berichtet — erkennbar, nicht abgewertet.
  m("2026-07-30T07:10", "2026-07-30T11:40", VERA, "angehoerige_berichtet", "Blutzuckermessgerät der Klientin",
    "Von Frau Steiner telefonisch durchgegeben.",
    [w("blood_glucose", 6.4, { qualifier: { messkontext: "nuechtern" } })]),
  m("2026-08-01T07:05", "2026-08-01T07:30", SUTTER, "selbst_gemessen", "Blutzuckermessgerät der Klientin", "",
    [w("blood_glucose", 6.8, { qualifier: { messkontext: "nuechtern" }, ...beurteilt("normal") }),
     w("pain_nrs", 3, beurteilt("normal"))]),
  m("2026-08-02T13:20", "2026-08-02T13:25", SUTTER, "selbst_gemessen", "Blutzuckermessgerät der Klientin", "",
    [w("blood_glucose", 9.1, { qualifier: { messkontext: "nach_essen" }, ...beurteilt("normal") })]),
  // Juengster Besuch: Blutdruck auffaellig hoch beurteilt, SpO2 nicht erhebbar.
  m("2026-08-03T09:20", "2026-08-03T09:25", SUTTER, "selbst_gemessen", "Oberarm-Messgerät, Omron",
    "Klientin fühlt sich wohl, keine Beschwerden.",
    [w("blood_pressure", 152, { zweitwert: 94, qualifier: { koerperhaltung: "sitzend", koerperstelle: "linker_arm" },
        beurteilung: "abnormally_high",
        beurteilungBegruendung: "Zweite Messung nach 10 Minuten Ruhe unverändert erhöht; Zielwert des Hausarzts überschritten.",
        beurteiltVonName: SUTTER.name, beurteiltVonRolle: SUTTER.rolle }),
     w("heart_rate", 82, { qualifier: { rhythmus: "regelmaessig" }, ...beurteilt("normal") }),
     w("weight", 78.2, { qualifier: { bedingungen: "nach_wasserlassen" }, ...beurteilt("normal") }),
     w("temperature", 37.1, { qualifier: { messort: "ohr" }, ...beurteilt("normal") }),
     w("oxygen_saturation", null, { nichtErhebbar: true, nichtErhebbarGrund: "Pulsoxymeter defekt, Ersatzgerät bestellt." }),
     w("blood_glucose", 6.6, { qualifier: { messkontext: "nuechtern" }, ...beurteilt("normal") }),
     w("pain_nrs", 2, beurteilt("normal"))]),
];

/** Aerztliche Zielwerte — werden angezeigt, nie ausgewertet. */
let zielwerte: Zielwert[] = [
  {
    patientId: "P-2026-0041", parameterCode: "blood_pressure",
    text: "unter 140/90 mmHg", bandMin: 100, bandMax: 140,
    quelle: "Dr. Brunner, Hausarzt", hinterlegtAm: "2026-07-01",
  },
];

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const mSchnappschuss = () => messungen;
const zSchnappschuss = () => zielwerte;

export function useVitalMessungen(): VitalMessung[] {
  return useSyncExternalStore(subscribe, mSchnappschuss, mSchnappschuss);
}

export function useZielwerte(): Zielwert[] {
  return useSyncExternalStore(subscribe, zSchnappschuss, zSchnappschuss);
}

export function getZielwert(patientId: string, code: ParameterCode): Zielwert | undefined {
  return zielwerte.find(z => z.patientId === patientId && z.parameterCode === code);
}

/**
 * Messung erfassen — APPEND-ONLY. `erfasstAm` setzt der Store, nie die
 * Aufrufstelle; der Nachtrags-Vermerk folgt aus der Abweichung zum
 * Messzeitpunkt und wird mitgespeichert, nicht nur angezeigt.
 */
export function messungErfassen(
  e: Omit<VitalMessung, "id" | "erfasstAm" | "nachtrag">,
  erfasstAmIso: string = `${GEGENWART_ISO}T09:00`,
): VitalMessung {
  const neu: VitalMessung = {
    ...e,
    id: `VZ-${String(++laufnummer).padStart(3, "0")}`,
    erfasstAm: erfasstAmIso,
    nachtrag: e.messZeitpunkt.slice(0, 10) !== erfasstAmIso.slice(0, 10),
  };
  messungen = [...messungen, neu];
  melden();
  return neu;
}
