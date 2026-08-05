/**
 * Angehörigenbestand — ein Objekt von Anfang an, Sitzungsdauer.
 *
 * Gebaut nach dem Vorbild von lib/patienten/store.ts: die angehörige Person
 * entsteht, sobald der Onboarding-Schritt "Angehöriger" zum ersten Mal
 * geöffnet wird, und trägt von da an dieselbe Kennung. Der Abschluss kopiert
 * nichts und erzeugt nichts — er wechselt nur den Zustand.
 *
 * Solange der Zustand "im_onboarding" ist, erscheint die Person weder in der
 * Angehörigenliste noch in deren Zählungen.
 *
 * Kein Speicher über die Sitzung hinaus; der Prototyp hat keine Persistenz.
 */
import { useSyncExternalStore } from "react";
import {
  angehoerigeSeed,
  LEERE_ERHEBUNG,
  type Angehoeriger,
  type AngehoerigerErhebung,
  type AngehoerigerKind,
  type Qualifikation,
} from "../../app/components/angehoerigeData";
import { qualifikationAusFunktion } from "../stammdaten/funktionen";

export const NICHT_ZUGEWIESEN = "—";

/* ── Bestand ───────────────────────────────────────────────────────────────── */

let bestand: Angehoeriger[] = angehoerigeSeed;
let sichtbarerBestand: Angehoeriger[] = bestand.filter(a => a.status !== "im_onboarding");
const hoerer = new Set<() => void>();

function setzeBestand(neu: Angehoeriger[]): void {
  bestand = neu;
  sichtbarerBestand = neu.filter(a => a.status !== "im_onboarding");
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

function getSichtbar(): Angehoeriger[] { return sichtbarerBestand; }

/** Reaktiv, ohne die noch im Onboarding stehenden Personen. */
export function useAngehoerige(): Angehoeriger[] {
  return useSyncExternalStore(subscribe, getSichtbar);
}

/** Nicht-reaktiv, ohne die noch im Onboarding stehenden Personen (Anna). */
export function getAngehoerige(): Angehoeriger[] {
  return sichtbarerBestand;
}

/** Findet auch eine Person im Zustand "im_onboarding". */
export function getAngehoerigen(id: string): Angehoeriger | undefined {
  return bestand.find(a => a.id === id);
}

function angehoerigerFuerOnboarding(onboardingId: string): Angehoeriger | undefined {
  return bestand.find(a => a.onboardingId === onboardingId);
}

/* ── Kennungen ─────────────────────────────────────────────────────────────── */

/**
 * In dieser Sitzung bereits vergebene Kennungen.
 *
 * Nötig, weil der Zähler sonst nur über den Startbestand liefe: eine neu
 * angelegte Person landet zwar im Bestand, aber beim Patienten hat genau
 * diese Konstruktion dazu geführt, dass jeder neue Fall dieselbe Kennung
 * erhielt. Der Zähler läuft deshalb über beides.
 */
const vergebeneKennungen = new Set<string>();

function naechsteAngehoerigenKennung(): string {
  const nummer = (id: string) => {
    const m = id.match(/^A-\d{4}-(\d{4})$/);
    return m ? parseInt(m[1], 10) : 0;
  };
  let hoechste = 0;
  for (const a of bestand) hoechste = Math.max(hoechste, nummer(a.id));
  for (const k of vergebeneKennungen) hoechste = Math.max(hoechste, nummer(k));

  const neu = `A-2026-${String(hoechste + 1).padStart(4, "0")}`;
  vergebeneKennungen.add(neu);
  return neu;
}

/* ── Formular → Bestand ────────────────────────────────────────────────────── */

/**
 * Die Erhebungsfelder, die der Onboarding-Schritt liefert. Bewusst
 * strukturgleich zu AngehoerigerErhebung, aber als eigene Signatur: der Store
 * kennt den Formulartyp nicht, das Formular kennt den Bestandstyp nicht.
 */
export interface AngehoerigenEingabe extends AngehoerigerErhebung {
  vorname: string;
  nachname: string;
}

function kinderAbbilden(kinder: AngehoerigerKind[]): AngehoerigerKind[] {
  return kinder.map(k => ({ ...k }));
}

function erhebungAbbilden(e: AngehoerigenEingabe): AngehoerigerErhebung {
  const { vorname: _v, nachname: _n, ...erhebung } = e;
  return { ...erhebung, kinder: kinderAbbilden(e.kinder) };
}

/**
 * Legt die angehörige Person an oder schreibt ihre Felder fort — dieselbe
 * Kennung, kein zweiter Datensatz.
 *
 * Die Qualifikationsstufe wird nicht übernommen, sondern nach R14 aus der
 * Funktion abgeleitet.
 */
export function erfasseAngehoerigenImOnboarding(
  onboardingId: string,
  eingabe: AngehoerigenEingabe,
): Angehoeriger {
  const vorhanden = angehoerigerFuerOnboarding(onboardingId);
  const erhebung = erhebungAbbilden(eingabe);
  const qualifikation = (qualifikationAusFunktion(eingabe.funktion) || "ohne_srk") as Qualifikation;

  if (vorhanden) {
    const aktualisiert: Angehoeriger = {
      ...vorhanden,
      ...erhebung,
      vorname: eingabe.vorname,
      nachname: eingabe.nachname,
      qualifikation,
    };
    setzeBestand(bestand.map(a => (a.id === vorhanden.id ? aktualisiert : a)));
    return aktualisiert;
  }

  /* Betriebliche Felder bleiben bis zum Abschluss leer oder neutral —
     kein erfundener Anfangswert. */
  const neu: Angehoeriger = {
    ...LEERE_ERHEBUNG,
    ...erhebung,
    id: naechsteAngehoerigenKennung(),
    onboardingId,
    vorname: eingabe.vorname,
    nachname: eingabe.nachname,
    qualifikation,
    status: "im_onboarding",
    billingReadiness: "in_vorbereitung",
    zugeordnetePatientenList: [],
    stempelTage: 0,
    stempelSoll: 0,
    stempelWarnings: [],
    hrCheck: { bankdaten: false, kinderzulagen: false, quellensteuerTarif: null },
    letzteMutationDatum: "",
    letzteMutationUser: "",
    pflegefachkraft: NICHT_ZUGEWIESEN,
    pflegefachkraftInitialen: NICHT_ZUGEWIESEN,
    monatsSchritt: { aktuell: 0, total: 0, label: "" },
  };
  setzeBestand([...bestand, neu]);
  return neu;
}

/**
 * Abschluss: nur der Zustandswechsel. Es wird nichts kopiert und nichts neu
 * erzeugt; die Kennung bleibt dieselbe.
 *
 * Altmandate ohne Datensatz liefern undefined — sie sind vor der Umstellung
 * entstanden und erzeugen auch beim Abschluss keinen.
 */
export function schliesseAngehoerigenOnboardingAb(onboardingId: string): Angehoeriger | undefined {
  const vorhanden = angehoerigerFuerOnboarding(onboardingId);
  if (!vorhanden) return undefined;
  const aktiv: Angehoeriger = { ...vorhanden, status: "aktiv" };
  setzeBestand(bestand.map(a => (a.id === vorhanden.id ? aktiv : a)));
  return aktiv;
}
