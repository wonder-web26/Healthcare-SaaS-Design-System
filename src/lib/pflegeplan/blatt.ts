/**
 * Das Leistungsplanungsblatt (Lauf 6b) — die Naht: es wird nicht getippt,
 * es FÄLLT aus dem freigegebenen Plan. Reine Ableitung, kein Zustand.
 *
 * Das Blatt ist ein Abrechnungsdokument, kein Pflegeplan: es zählt
 * Positionen, nicht Massnahmen. Mehrere Massnahmen auf derselben Position
 * werden EINE Zeile — dabei gilt (Freigabe im Vorbericht 6b):
 *
 * - Wochenminuten werden SUMMIERT — Zeit ist die einzige Grösse, die sich
 *   legitim addiert.
 * - Häufigkeit, Dauer und QUALIFIKATION werden GESTAPELT, je Massnahme eine
 *   Unterzeile — nie zu einem Wert verrechnet. Die Qualifikations-Spalte
 *   zeigt die ZUGEWIESENE Qualifikation (daran hängt der Tarif), das
 *   Katalogminimum steht daneben, wenn die Zuweisung abweicht.
 * - Nur Erbringer S steht in der Tabelle; I/A/V stehen mit Begründung im
 *   eigenen Abschnitt ausserhalb der Summen — der festgestellte Bedarf
 *   gehört aufs Blatt, auch wenn er nicht verrechnet wird.
 * - Einmalige Leistungen zählen nicht zur Wochensumme und werden separat in
 *   Minuten ausgewiesen (Fachmodell, «Geplant gegen bewilligt»).
 *
 * Die Begründungskette je Position (welche Ziele und Diagnosen sie tragen)
 * kommt aus den Zielbezügen der Massnahmen — ohne sie wäre die
 * Nachweiskette an der entscheidenden Stelle unterbrochen.
 */
import type { PlanZustand, PlanMassnahme } from "./plan-store";
import type { Leistungsposition, MitHerkunft } from "./vertrag";
import { positionFuer, qualifikationsStufen } from "./mock-adapter";
import { haeufigkeitsText, wochenMinuten, ERBRINGER } from "./planung";

/** Ein Glied der Begründungskette: dieses Ziel unter dieser Diagnose trägt
 *  die Position. */
export interface BlattTraeger {
  diagnoseCode: string;
  diagnoseTitel: string;
  zielId: string;
  zielTitel: string;
}

/** Unterzeile einer Positionszeile — je zusammengefasster Massnahme eine. */
export interface BlattTeil {
  massnahmeTitel: string;
  /** null = nicht terminiert; das Blatt sagt es, statt es zu verstecken. */
  haeufigkeit: string | null;
  dauerMin: number | null;
  wochenMin: number;
  /** Die ZUGEWIESENE Qualifikation — wer es tatsächlich tun soll. */
  qualifikation: string | null;
  /** Das Katalogminimum, genannt wenn die Zuweisung davon abweicht. */
  katalogMinimum: string | null;
}

export interface BlattZeile {
  nummer: string;
  bezeichnung: string;
  klv: "a" | "b" | "c" | "nein";
  teile: BlattTeil[];
  /** Summe der Unterzeilen — die eine legitime Addition. */
  wochenMin: number;
  traeger: BlattTraeger[];
}

export interface BlattAbschnitt {
  klv: "a" | "b" | "c" | "nein";
  zeilen: BlattZeile[];
  summeMin: number;
}

export interface BlattEinmalig {
  nummer: string;
  bezeichnung: string;
  klv: "a" | "b" | "c" | "nein";
  massnahmeTitel: string;
  /** "" = ohne Datum (wäre ein offener WZW-Befund). */
  datum: string;
  minuten: number | null;
  traeger: BlattTraeger[];
}

export interface BlattNichtErbracht {
  massnahmeTitel: string;
  erbringerLabel: string;
  begruendung: string;
  positionsNummer: string | null;
  traeger: BlattTraeger[];
}

export interface Blatt {
  abschnitte: BlattAbschnitt[];
  einmalige: BlattEinmalig[];
  nichtErbracht: BlattNichtErbracht[];
  /** Planerische S-Massnahmen (ohne Position) — sie erscheinen nicht in der
   *  Tabelle; das Blatt weist sie aus, statt sie zu verschweigen. */
  ohnePosition: { massnahmeTitel: string; wochenMin: number }[];
  /** Summe der Abschnitte — muss der Wochensumme des Plans entsprechen. */
  gesamtWochenMin: number;
}

const KLV_REIHENFOLGE: Blatt["abschnitte"][number]["klv"][] = ["a", "b", "c", "nein"];

export const KLV_LABEL: Record<"a" | "b" | "c" | "nein", string> = {
  a: "KLV a — Abklärung, Beratung, Koordination",
  b: "KLV b — Untersuchung und Behandlung",
  c: "KLV c — Grundpflege",
  nein: "Nicht KLV-pflichtig",
};

function traegerVon(plan: PlanZustand, m: PlanMassnahme): BlattTraeger[] {
  const aus: BlattTraeger[] = [];
  for (const b of m.zielBezuege) {
    if (aus.some(t => t.diagnoseCode === b.diagnoseCode && t.zielId === b.zielId)) continue;
    aus.push({
      diagnoseCode: b.diagnoseCode,
      diagnoseTitel: plan.diagnosen.find(d => d.code === b.diagnoseCode)?.titel ?? b.diagnoseCode,
      zielId: b.zielId,
      zielTitel: plan.ziele.find(z => z.zielId === b.zielId)?.titel ?? b.zielId,
    });
  }
  return aus;
}

/** Prioritätsreihenfolge (Lauf 6d): wichtige Diagnosen zuerst — die
 *  Priorität ändert am Blatt NUR die Reihenfolge, nie die Zahlen. Läuft
 *  als letzter Schritt, weil zusammengefasste Zeilen ihre Träger über
 *  mehrere Massnahmen vereinigen. */
function traegerNachPrioritaet(plan: PlanZustand, traeger: BlattTraeger[]): BlattTraeger[] {
  const wichtig = new Set(plan.diagnosen.filter(d => d.prioritaet === "wichtig").map(d => d.code));
  return [...traeger.filter(t => wichtig.has(t.diagnoseCode)), ...traeger.filter(t => !wichtig.has(t.diagnoseCode))];
}

function positionVon(m: PlanMassnahme): MitHerkunft<Leistungsposition> | null {
  return positionFuer(m.interventionId, m.planung.detailAuswahl);
}

/** Das Blatt aus dem Plan — deterministisch, ohne Seiteneffekte. */
export function blattAbleiten(plan: PlanZustand): Blatt {
  const stufen = qualifikationsStufen();
  const rang = (label: string | null): number =>
    label === null ? -1 : (stufen.find(s => s.label === label)?.rang ?? -1);

  const zeilenJeNummer = new Map<string, BlattZeile>();
  const einmalige: BlattEinmalig[] = [];
  const nichtErbracht: BlattNichtErbracht[] = [];
  const ohnePosition: Blatt["ohnePosition"] = [];

  for (const m of plan.massnahmen) {
    const p = m.planung;
    const position = positionVon(m);
    const traeger = traegerVon(plan, m);

    if (p.erbringer !== "S") {
      nichtErbracht.push({
        massnahmeTitel: m.titel,
        erbringerLabel: ERBRINGER.find(e => e.code === p.erbringer)?.label ?? p.erbringer,
        begruendung: p.erbringerNotiz.trim(),
        positionsNummer: position?.nummer ?? null,
        traeger,
      });
      continue;
    }

    if (position === null) {
      ohnePosition.push({
        massnahmeTitel: m.titel,
        wochenMin: wochenMinuten(p, p.dauerMin),
      });
      continue;
    }

    const dauer = p.dauerMin ?? position.vorgabeMinuten ?? null;

    if (p.wiederholung === "einmalig") {
      einmalige.push({
        nummer: position.nummer,
        bezeichnung: position.bezeichnung,
        klv: position.klv,
        massnahmeTitel: m.titel,
        datum: p.einmalDatum,
        minuten: dauer,
        traeger,
      });
      continue;
    }

    const zugewiesen = p.qualifikation ?? position.mindestqualifikation;
    const teil: BlattTeil = {
      massnahmeTitel: m.titel,
      haeufigkeit: haeufigkeitsText(p),
      dauerMin: dauer,
      wochenMin: wochenMinuten(p, dauer),
      qualifikation: zugewiesen,
      katalogMinimum:
        position.mindestqualifikation !== null && rang(zugewiesen) > rang(position.mindestqualifikation)
          ? position.mindestqualifikation
          : null,
    };

    const zeile = zeilenJeNummer.get(position.nummer);
    if (zeile) {
      zeile.teile.push(teil);
      zeile.wochenMin += teil.wochenMin;
      for (const t of traeger) {
        if (!zeile.traeger.some(x => x.diagnoseCode === t.diagnoseCode && x.zielId === t.zielId)) {
          zeile.traeger.push(t);
        }
      }
    } else {
      zeilenJeNummer.set(position.nummer, {
        nummer: position.nummer,
        bezeichnung: position.bezeichnung,
        klv: position.klv,
        teile: [teil],
        wochenMin: teil.wochenMin,
        traeger: [...traeger],
      });
    }
  }

  const abschnitte: BlattAbschnitt[] = KLV_REIHENFOLGE
    .map(klv => {
      const zeilen = [...zeilenJeNummer.values()]
        .filter(z => z.klv === klv)
        .sort((a, b) => a.nummer.localeCompare(b.nummer))
        .map(z => ({ ...z, traeger: traegerNachPrioritaet(plan, z.traeger) }));
      return { klv, zeilen, summeMin: zeilen.reduce((s, z) => s + z.wochenMin, 0) };
    })
    .filter(a => a.zeilen.length > 0);

  return {
    abschnitte,
    einmalige: einmalige.map(e => ({ ...e, traeger: traegerNachPrioritaet(plan, e.traeger) })),
    nichtErbracht: nichtErbracht.map(n => ({ ...n, traeger: traegerNachPrioritaet(plan, n.traeger) })),
    ohnePosition,
    gesamtWochenMin: abschnitte.reduce((s, a) => s + a.summeMin, 0),
  };
}
