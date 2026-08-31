/**
 * Fallverlauf — reines Anzeigemodell für den Reiter Bedarfsabklärung.
 *
 * KEINE neue Logik: Zulässigkeit stammt ausschliesslich aus kannFormularEroeffnen,
 * der Fallstatus aus fallStatus, die Route aus Fall.route. Diese Datei ist die
 * EINZIGE Quelle für Routenbezeichnungen, Bedingungs- und Hinweistexte sowie den
 * neutralen Abklärungstitel (styleguide-Verifikation 14). Formulartitel kommen
 * aus getTypLabel (store).
 *
 * Die Anzeige erzwingt zusätzlich die Kette Registrierung → Abklärung → Entlassung:
 * die Entlassung ist erst der nächste Schritt, wenn keine Abklärung mehr offen ist —
 * auch wenn kannFormularEroeffnen('discharge') technisch schon zulässig wäre
 * (sobald alle vorhandenen Formulare gesperrt sind). Deshalb ist immer HÖCHSTENS
 * eine Zeile der nächste Schritt.
 */
import {
  type Fall,
  type Formular,
  type FormularTyp,
  type FallStatus,
  fallStatus,
  formulareFuerFall,
  kannFormularEroeffnen,
  getFaelleFuerKlient,
  getOpenFieldCount,
  getActiveFieldCount,
  getTypLabel,
} from "./store";
import { type FallRoute } from "../stammdaten/sda-einschaetzung-situation";

/** Routenbezeichnung — einzige Quelle (Kopf-Chip UND Hinweisblock). */
export const ROUTE_LABEL: Record<Exclude<FallRoute, null>, string> = {
  somatic: "Somatische Situation",
  mental_health: "Psychiatrische Situation",
  palliative: "Palliative Situation",
  paediatric: "Pädiatrische Situation",
  isolated_therapeutic: "Isoliert-therapeutische Situation",
  housekeeping: "Vorübergehende Betreuung",
  declined: "Abklärung abgelehnt",
};

/** Neutraler Titel der Abklärungszeile, solange die Route offen ist (`route === null`,
 *  die interRAI SDA noch nicht gesperrt). Bewusst KEIN konkretes Instrument und
 *  NICHT aus getTypLabel abgeleitet — das Instrument ergibt sich erst nach dem
 *  Sperren aus BB16. */
export const ABKLAERUNG_NEUTRAL_TITEL = "Bedarfsabklärung";
/** Bedingung der neutralen Abklärungszeile — das Instrument steht erst nach BB16 fest. */
export const BEDINGUNG_INSTRUMENT_OFFEN = "Welches Instrument folgt, ergibt sich aus BB16 in der Registrierung.";
export const HINWEIS_TITEL = "Keine Bedarfsabklärung verfügbar";
/** „Erst nach Sperrung der Registrierung möglich" — nach dem Inhalt benannt (früher
 *  irreführend BEDINGUNG_BB16, obwohl der Text die Sperrung meint, nicht BB16).
 *  Aktuell ohne Verwender. */
export const BEDINGUNG_REGISTRIERUNG_GESPERRT = `Erst möglich, wenn die ${getTypLabel("registration")} gesperrt ist`;
export const BEDINGUNG_ENTLASSUNG = "Erst möglich, sobald jedes Formular gesperrt ist";
export const ZUSATZ_REGISTRIERUNG = "Erste Erfassung des Falls";
export const ZUSATZ_ENTLASSUNG = "Alle Formulare des Falls sind gesperrt";

/** Verwendungszusammenhang der Fallverlauf-Anzeige. */
export type FallverlaufKontext = "onboarding" | "patient";

/** Die drei Abklärungsinstrumente (ohne Registrierung/Entlassung). */
const ABKLAERUNG_TYPEN: FormularTyp[] = ["interrai_hc", "interrai_cmh", "housekeeping"];

/** Hinweistext bei Routen, die kein abbildbares Instrument haben. */
function hinweisText(route: Exclude<FallRoute, null>): string {
  if (route === "declined") return "Die Klientin hat eine umfassende Bedarfsabklärung abgelehnt.";
  return `Für eine ${ROUTE_LABEL[route]} ist ein Instrument erforderlich, das die Software nicht abbildet.`;
}

/** Titel-Zusatz je HC-Laufnummer (Erst- vs. Reassessment). */
function abklaerungTitel(f: Formular): string {
  const basis = getTypLabel(f.typ);
  if (f.typ !== "interrai_hc") return basis;
  return `${basis} · ${f.laufnummer === 1 ? "Erstassessment" : `Reassessment ${f.laufnummer}`}`;
}

export type ZeilenZustand = "gesperrt" | "in_bearbeitung" | "naechster_schritt" | "nicht_moeglich";

export type FormularZeile = {
  art: "formular";
  /** null = noch kein konkretes Instrument (neutrale Abklärungszeile). */
  typ: FormularTyp | null;
  titel: string;
  zustand: ZeilenZustand;
  formularId: string | null;
  gesperrtAm?: string | null;
  gesperrtVon?: string | null;
  erfasst?: number;
  gesamt?: number;
  zuletzt?: string;
  bedingung?: string;
  zusatz?: string;
};

export type HinweisZeile = { art: "hinweis"; titel: string; text: string };
export type FallverlaufZeile = FormularZeile | HinweisZeile;

export type FallKopf = {
  fallnummer: string | null;
  status: FallStatus;
  openedAt: string | null;
  closedAt: string | null;
  erstelltAm: string;
  routeLabel: string | null;
};

export type FallverlaufModell = {
  fallId: string;
  kopf: FallKopf;
  zeilen: FallverlaufZeile[];
  /** Zahl der Formulare (für die eingeklappte Zeile geschlossener Fälle). */
  formularAnzahl: number;
};

/** Zeile eines bestehenden Formulars (gesperrt oder in Bearbeitung). */
function bestehendeZeile(f: Formular): FormularZeile {
  if (f.status === "gesperrt") {
    return { art: "formular", typ: f.typ, titel: abklaerungTitel(f), zustand: "gesperrt", formularId: f.id, gesperrtAm: f.gesperrtAm, gesperrtVon: f.gesperrtVon };
  }
  const gesamt = getActiveFieldCount(f);
  const offen = getOpenFieldCount(f);
  return { art: "formular", typ: f.typ, titel: abklaerungTitel(f), zustand: "in_bearbeitung", formularId: f.id, erfasst: gesamt - offen, gesamt, zuletzt: f.zuletztBearbeitetAm };
}

/**
 * Fallverlauf-Modell eines Falls — die Kette Registrierung → Abklärung → Entlassung.
 *
 * `kontext` steuert nur die Entlassungszeile: im Onboarding gibt es keine
 * Entlassung (der Fall endet mit der Vertragsunterzeichnung), darum erscheint die
 * discharge-Zeile dort NICHT — es sei denn, ein Entlassungsformular liegt bereits
 * vor (geschlossener Fall soll nicht unvollständig wirken). Der übrige Verlauf ist
 * in beiden Kontexten identisch.
 */
export function fallverlaufFuerFall(fall: Fall, kontext: FallverlaufKontext): FallverlaufModell {
  const status = fallStatus(fall.id);
  const forms = formulareFuerFall(fall.id);
  const kopf: FallKopf = {
    fallnummer: fall.fallnummer,
    status,
    openedAt: fall.openedAt,
    closedAt: fall.closedAt,
    erstelltAm: fall.erstelltAm,
    routeLabel: fall.route ? ROUTE_LABEL[fall.route] : null,
  };
  const zeilen: FallverlaufZeile[] = [];

  // 1. Registrierung — sobald der Fall existiert.
  const reg = forms.find((f) => f.typ === "registration");
  if (reg) {
    zeilen.push(bestehendeZeile(reg));
  } else {
    const ok = kannFormularEroeffnen(fall.id, "registration").zulaessig;
    zeilen.push({
      art: "formular", typ: "registration", titel: getTypLabel("registration"),
      zustand: ok ? "naechster_schritt" : "nicht_moeglich", formularId: null,
      zusatz: ok ? ZUSATZ_REGISTRIERUNG : undefined,
    });
  }

  // 2. Abklärung — eine Zeile je vorhandenem Formular, sonst je nach Route.
  const abkl = forms.filter((f) => ABKLAERUNG_TYPEN.includes(f.typ)).sort((a, b) => a.laufnummer - b.laufnummer);
  let abklaerungOffen: boolean;
  if (abkl.length > 0) {
    for (const f of abkl) zeilen.push(bestehendeZeile(f));
    abklaerungOffen = abkl.some((f) => f.status !== "gesperrt");
  } else if (fall.route === null) {
    zeilen.push({ art: "formular", typ: null, titel: ABKLAERUNG_NEUTRAL_TITEL, zustand: "nicht_moeglich", formularId: null, bedingung: BEDINGUNG_INSTRUMENT_OFFEN });
    abklaerungOffen = true;
  } else {
    const instrument = ABKLAERUNG_TYPEN.find((t) => kannFormularEroeffnen(fall.id, t).zulaessig);
    if (instrument) {
      zeilen.push({ art: "formular", typ: instrument, titel: getTypLabel(instrument), zustand: "naechster_schritt", formularId: null, zusatz: kopf.routeLabel ?? undefined });
      abklaerungOffen = true;
    } else {
      zeilen.push({ art: "hinweis", titel: HINWEIS_TITEL, text: hinweisText(fall.route) });
      abklaerungOffen = false; // kein Instrument erwartet → blockiert die Entlassung nicht
    }
  }

  // 3. Entlassung — immer. Nächster Schritt nur, wenn keine Abklärung mehr offen
  //    ist UND die Regel es zulässt (alle Formulare gesperrt).
  const dis = forms.find((f) => f.typ === "discharge");
  if (dis) {
    zeilen.push(bestehendeZeile(dis));
  } else if (kontext === "patient") {
    // Im Onboarding gibt es keine Entlassung — die Platzhalterzeile entfällt.
    const ok = !abklaerungOffen && kannFormularEroeffnen(fall.id, "discharge").zulaessig;
    zeilen.push({
      art: "formular", typ: "discharge", titel: getTypLabel("discharge"),
      zustand: ok ? "naechster_schritt" : "nicht_moeglich", formularId: null,
      bedingung: ok ? undefined : BEDINGUNG_ENTLASSUNG,
      zusatz: ok ? ZUSATZ_ENTLASSUNG : undefined,
    });
  }

  // Sicherheit: höchstens EINE Zeile ist der nächste Schritt (§8/V8).
  let gesehen = false;
  for (const z of zeilen) {
    if (z.art === "formular" && z.zustand === "naechster_schritt") {
      if (gesehen) { z.zustand = "nicht_moeglich"; z.zusatz = undefined; z.bedingung = z.bedingung ?? BEDINGUNG_ENTLASSUNG; }
      gesehen = true;
    }
  }

  return { fallId: fall.id, kopf, zeilen, formularAnzahl: forms.length };
}

/** Alle Fälle eines Klienten — offener Fall zuerst, geschlossene danach (neueste zuerst). */
export function fallverlaufFuerKlient(klientId: string, kontext: FallverlaufKontext): FallverlaufModell[] {
  const rang = (f: Fall) => {
    const s = fallStatus(f.id);
    return s === "registering" || s === "open" ? 0 : 1;
  };
  return [...getFaelleFuerKlient(klientId)]
    .sort((a, b) => rang(a) - rang(b) || b.erstelltAm.localeCompare(a.erstelltAm))
    .map((f) => fallverlaufFuerFall(f, kontext));
}
