/**
 * WZW-Prüfung (Lauf 6) — Wirksamkeit, Zweckmässigkeit, Wirtschaftlichkeit
 * nach Art. 32 KVG, die Kriterien des Versicherer-Controllings.
 *
 * Die Prüfung MELDET, sie blockiert nicht: jeder Befund wird aufgelöst oder
 * mit Begründung übergangen. Und sie läuft nur auf Knopfdruck — ein Zähler,
 * der im Hintergrund mitläuft, liesse den Plan während des Bauens dauerhaft
 * fehlerhaft aussehen, obwohl er nur noch nicht fertig ist.
 *
 * KEINE KONFORMITÄTSAUSSAGE: geprüft wird Vollständigkeit und
 * Widerspruchsfreiheit des Plans. Ob ein Versicherer ihn akzeptiert, kann
 * hier niemand zusichern — deshalb existiert in diesem Modul kein Begriff
 * wie «konform» und kein Prüfergebnis «bestanden».
 */
import type { PlanZustand, PlanMassnahme } from "./plan-store";
import { positionFuer, detaildialog, qualifikationsStufen } from "./mock-adapter";
import { wochenVorkommen } from "./planung";
import { GEGENWART_ISO } from "../gegenwart";

/* ── Die Plansignatur ───────────────────────────────────────────────────── */
/**
 * Signatur des prüfrelevanten Planinhalts. Erkennt, ob eine Prüfung noch zum
 * Plan passt — über den Inhalt, nicht über einen Zeitstempel.
 *
 * ABGELEITET, NICHT AUFGEZÄHLT: per Rest-Destrukturierung wird nur die
 * Meta-Seite (status, fassungen, pruefung) ausgeschlossen; alles Übrige
 * fliesst automatisch ein. Ein neues fachliches Feld — etwa an der
 * Massnahmen-Planung — landet damit von selbst in der Signatur. Die
 * Fehlerrichtung ist konservativ: ein vergessenes neues Meta-Feld erzeugt
 * höchstens ein fälschliches «nicht mehr aktuell» (sofort sichtbar), nie
 * ein fälschliches «geprüft».
 *
 * Die Verwerfungen aus Lauf 2 liegen im Inhalt und damit in der Signatur.
 * Befund-Übergehungen dagegen hängen am Prüfungsergebnis und NICHT am
 * Inhalt — lägen sie in der Signatur, würde jede Übergehung die eigene
 * Prüfung sofort als veraltet markieren, und «aktuell geprüft, alles
 * übergangen» wäre unerreichbar.
 */
export function planSignatur(plan: PlanZustand): string {
  const { status: _status, fassungen: _fassungen, pruefung: _pruefung, ...inhalt } = plan;
  return JSON.stringify(inhalt);
}

/* ── Der Befund ─────────────────────────────────────────────────────────── */
export type PruefKriterium = "wirksamkeit" | "zweckmaessigkeit" | "wirtschaftlichkeit";

export const KRITERIUM_LABEL: Record<PruefKriterium, { titel: string; frage: string }> = {
  wirksamkeit: { titel: "Wirksamkeit", frage: "Ist ein Zweck belegt?" },
  zweckmaessigkeit: { titel: "Zweckmässigkeit", frage: "Das richtige Mittel für diesen Klienten?" },
  wirtschaftlichkeit: { titel: "Wirtschaftlichkeit", frage: "Die kostengünstigste ausreichende Variante?" },
};

/** Das Element, auf das ein Befund verweist — jedes verweist auf genau eines. */
export interface BefundElement {
  art: "diagnose" | "ziel" | "massnahme";
  /** diagnoseCode, zielId oder interventionId. */
  code: string;
  titel: string;
  /** Bei art «ziel»: die Diagnose der betroffenen Bindung — null bei
   *  ungebundenen Zielen oder Befunden, die am Ziel selbst hängen. */
  diagnoseCode: string | null;
}

export interface Befund {
  /** STABILE KENNUNG aus Prüfcode und Elementbezug — daran hängen die
   *  Übergehungen über Neuprüfungen hinweg. */
  id: string;
  /** Die Prüfung, die den Befund erzeugt hat — Gruppierschlüssel der
   *  Befundliste (Lauf 6b): gleichartige Befunde sind EIN Problem, nicht N. */
  pruefCode: string;
  kriterium: PruefKriterium;
  titel: string;
  detail: string;
  element: BefundElement;
}

/** Gruppenüberschrift je Prüfcode — Mehrzahl, denn die Gruppe erscheint nur
 *  bei mehreren gleichartigen Befunden («8 Massnahmen ohne Leistungsposition»). */
export const PRUEFUNG_GRUPPE: Record<string, string> = {
  "W-DIAGNOSE-OHNE-ZIEL": "Diagnosen ohne Ziel",
  "W-ZIEL-OHNE-MASSNAHME": "Ziele ohne Massnahme",
  "W-MASSNAHME-OHNE-ZIEL": "Massnahmen ohne Zielbezug",
  "W-ZIEL-UEBERFAELLIG": "Zieldaten überschritten ohne Einschätzung",
  "W-EINMALIG-OHNE-DATUM": "Einmalige Leistungen ohne Datum",
  "W-VERWEIGERUNG-OHNE-GRUND": "Verweigerungen ohne Begründung",
  "Z-OHNE-POSITION": "Massnahmen ohne Leistungsposition",
  "Z-QUALIFIKATION-UEBER-MINIMUM": "Qualifikationen über dem Katalogminimum",
  "Z-ERBRINGER-OHNE-ANGABE": "Erbringer ohne Angabe",
  "Z-ZEIT-VERBINDLICH": "Verbindliche Zeitfenster",
  "WI-DAUER-OHNE-GRUND": "Dauerabweichungen ohne Begründung",
  "WI-HAEUFIGKEIT-UEBER-GRENZE": "Häufigkeiten über der Kataloggrenze",
};

/* ── Die zwölf Prüfungen ────────────────────────────────────────────────── */

function element(art: BefundElement["art"], code: string, titel: string, diagnoseCode: string | null = null): BefundElement {
  return { art, code, titel, diagnoseCode };
}

function befund(pruefCode: string, kriterium: PruefKriterium, el: BefundElement, titel: string, detail: string): Befund {
  return { id: `${pruefCode}:${el.art === "ziel" && el.diagnoseCode ? `${el.diagnoseCode}|` : ""}${el.code}`, pruefCode, kriterium, titel, detail, element: el };
}

function positionVon(m: PlanMassnahme) {
  return positionFuer(m.interventionId, m.planung.detailAuswahl);
}

/**
 * Alle Befunde des Plans, in Kriterienreihenfolge. Reine Funktion — sie
 * verändert nichts und läuft nur, wenn jemand sie ruft (Knopfdruck).
 */
export function befundeErmitteln(plan: PlanZustand): Befund[] {
  const aus: Befund[] = [];
  const stufen = qualifikationsStufen();
  const rangVon = (label: string | null): number => {
    if (!label) return -1;
    return stufen.find(s => s.label === label)?.rang ?? -1;
  };

  /* ── Wirksamkeit — ist ein Zweck belegt? ── */

  // Diagnose ohne Ziel
  for (const d of plan.diagnosen) {
    if (!plan.ziele.some(z => z.diagnoseCode === d.code)) {
      aus.push(befund("W-DIAGNOSE-OHNE-ZIEL", "wirksamkeit",
        element("diagnose", d.code, d.titel),
        `Diagnose ohne Ziel: ${d.titel}`,
        "Eine Diagnose ohne Ziel belegt keinen Zweck — Ziel wählen oder die Diagnose begründet übergehen."));
    }
  }

  // Ziel ohne Massnahme (je Bindung — dasselbe Ziel kann unter einer zweiten
  // Diagnose sehr wohl versorgt sein)
  for (const z of plan.ziele) {
    if (z.diagnoseCode === null) continue;
    const versorgt = plan.massnahmen.some(m => m.zielBezuege.some(b => b.diagnoseCode === z.diagnoseCode && b.zielId === z.zielId));
    if (!versorgt) {
      aus.push(befund("W-ZIEL-OHNE-MASSNAHME", "wirksamkeit",
        element("ziel", z.zielId, z.titel, z.diagnoseCode),
        `Ziel ohne Massnahme: ${z.titel}`,
        "Ein Ziel ohne Massnahme wird nicht verfolgt — Massnahme wählen oder das Ziel begründet übergehen."));
    }
  }

  // Massnahme ohne Zielbezug
  for (const m of plan.massnahmen) {
    if (m.zielBezuege.length === 0) {
      aus.push(befund("W-MASSNAHME-OHNE-ZIEL", "wirksamkeit",
        element("massnahme", m.interventionId, m.titel),
        `Massnahme ohne Zielbezug: ${m.titel}`,
        "Eine Massnahme ohne Ziel hat keinen belegten Zweck — in der Struktur verknüpfen oder begründet übergehen."));
    }
  }

  // Zieldatum überschritten ohne Einschätzung — je Ziel, nicht je Bindung:
  // deshalb OHNE diagnoseCode im Element, sonst hinge die Befund-Kennung
  // (und damit die Übergehung) an einer austauschbaren Bindung.
  // Ein Ziel OHNE Zieldatum ist KEIN Befund: das Zieldatum ist bewusst
  // optional — geprüft wird nur ein gesetztes, verstrichenes Datum.
  const gesehen = new Set<string>();
  for (const z of plan.ziele) {
    if (gesehen.has(z.zielId)) continue;
    gesehen.add(z.zielId);
    if (z.zieldatum !== "" && z.zieldatum < GEGENWART_ISO && z.einschaetzung === null) {
      aus.push(befund("W-ZIEL-UEBERFAELLIG", "wirksamkeit", element("ziel", z.zielId, z.titel),
        `Zieldatum überschritten, keine Einschätzung: ${z.titel}`,
        "Das Zieldatum ist vorbei, die Zielerreichung wurde nicht eingeschätzt — im Dokument einschätzen."));
    }
  }

  // Einmalige Leistung ohne Datum / Verweigerung ohne Begründung
  for (const m of plan.massnahmen) {
    const p = m.planung;
    if (p.wiederholung === "einmalig" && p.einmalDatum === "") {
      aus.push(befund("W-EINMALIG-OHNE-DATUM", "wirksamkeit",
        element("massnahme", m.interventionId, m.titel),
        `Einmalige Leistung ohne Datum: ${m.titel}`,
        "Eine einmalige Leistung ohne Datum ist nicht planbar — Datum im Editor setzen."));
    }
    if (p.erbringer === "V" && p.erbringerNotiz.trim() === "") {
      aus.push(befund("W-VERWEIGERUNG-OHNE-GRUND", "wirksamkeit",
        element("massnahme", m.interventionId, m.titel),
        `Verweigerung ohne Begründung: ${m.titel}`,
        "Festgestellter Bedarf wurde abgelehnt — was abgelehnt wurde und mit welcher Begründung gehört in den Plan."));
    }
  }

  /* ── Zweckmässigkeit — das richtige Mittel für diesen Klienten? ── */

  for (const m of plan.massnahmen) {
    const p = m.planung;
    const el = element("massnahme", m.interventionId, m.titel);
    const position = positionVon(m);

    if (position === null) {
      const dialogOffen = detaildialog(m.interventionId) !== null;
      aus.push(befund("Z-OHNE-POSITION", "zweckmaessigkeit", el,
        `Massnahme ohne Leistungsposition: ${m.titel}`,
        dialogOffen
          ? "Die Position ist offen, weil der Detaildialog unbeantwortet ist — im Editor präzisieren."
          : "Keine Position hinterlegt — die Massnahme bleibt planerisch und wird nicht verrechnet. Beabsichtigt? Dann begründet übergehen."));
    }

    if (p.qualifikation !== null && position?.mindestqualifikation != null) {
      const zugewiesen = rangVon(p.qualifikation);
      const minimum = rangVon(position.mindestqualifikation);
      if (zugewiesen > minimum && minimum >= 0) {
        aus.push(befund("Z-QUALIFIKATION-UEBER-MINIMUM", "zweckmaessigkeit", el,
          `Qualifikation über dem Katalogminimum: ${m.titel}`,
          `Zugewiesen ist «${p.qualifikation}», der Katalog verlangt «${position.mindestqualifikation}» — die höhere Stufe kostet mehr und gehört fachlich begründet.`));
      }
    }

    if ((p.erbringer === "I" || p.erbringer === "A") && p.erbringerNotiz.trim() === "") {
      aus.push(befund("Z-ERBRINGER-OHNE-ANGABE", "zweckmaessigkeit", el,
        `Erbringer ohne Angabe: ${m.titel}`,
        "Wer erbringt die Leistung, und wie ist sie abgesichert? Ohne diese Angabe ist die Deckung des Bedarfs nicht belegt."));
    }

    if (p.zeitVerbindlich && (p.tageszeiten.length > 0 || p.eigeneZeiten.length > 0)) {
      aus.push(befund("Z-ZEIT-VERBINDLICH", "zweckmaessigkeit", el,
        `Verbindliches Zeitfenster: ${m.titel}`,
        "Ein verbindliches Zeitfenster schränkt die Einsatzplanung ein und gehört fachlich begründet — oder auf «bevorzugt» zurückgestellt."));
    }
  }

  /* ── Wirtschaftlichkeit — die kostengünstigste ausreichende Variante? ── */

  for (const m of plan.massnahmen) {
    const p = m.planung;
    const el = element("massnahme", m.interventionId, m.titel);
    const position = positionVon(m);

    if (p.dauerMin !== null && position?.vorgabeMinuten != null
      && p.dauerMin !== position.vorgabeMinuten && p.dauerBegruendung.trim() === "") {
      aus.push(befund("WI-DAUER-OHNE-GRUND", "wirtschaftlichkeit", el,
        `Dauer weicht ohne Begründung ab: ${m.titel}`,
        `Geplant sind ${p.dauerMin} min, der Katalog gibt ${position.vorgabeMinuten} min vor — die Abweichung braucht eine Begründung im Editor.`));
    }

    /* Vergleich auf WOCHENBASIS: «3× an Werktagen» sind 15 je Woche gegen
       erlaubte 7 bei «max. 1× je Tag». Ein Einheitenvergleich versagt bei
       «An Werktagen» und bei benutzerdefinierten Intervallen. */
    if (position?.maxAnzahl != null && position.maxEinheit != null) {
      const grenzeJeWoche = position.maxEinheit === "tag" ? position.maxAnzahl * 7 : position.maxAnzahl;
      const geplantJeWoche = wochenVorkommen(p);
      if (geplantJeWoche > grenzeJeWoche) {
        aus.push(befund("WI-HAEUFIGKEIT-UEBER-GRENZE", "wirtschaftlichkeit", el,
          `Häufigkeit über der Kataloggrenze: ${m.titel}`,
          `Geplant sind ${Math.round(geplantJeWoche * 100) / 100} Ausführungen je Woche, der Katalog erlaubt max. ${position.maxAnzahl}× je ${position.maxEinheit === "tag" ? "Tag" : "Woche"} (${grenzeJeWoche} je Woche).`));
      }
    }
  }

  const reihenfolge: PruefKriterium[] = ["wirksamkeit", "zweckmaessigkeit", "wirtschaftlichkeit"];
  return aus.sort((a, b) => reihenfolge.indexOf(a.kriterium) - reihenfolge.indexOf(b.kriterium));
}
