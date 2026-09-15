/**
 * Mock-Adapter — die Leseabfragen des Pflegeplan-Vertrags, bedient aus
 * dem Mock-Datensatz. Wer später den echten Katalog (NANDA-I PLUS mit ENP,
 * CAP-NANDA-Zuordnungsliste) anschliesst, schreibt einen zweiten Adapter
 * hinter denselben Vertrag und tauscht die Datenquelle — nicht das UI.
 */
import type {
  Beleg, BewertungsStufe, CapCode, Diagnose, DiagnoseCode,
  DiagnoseDetails, DiagnoseVorschlag, FeldHerkunft,
  Leistungsposition, MerkmalsEintrag, Merkmalsliste, MitHerkunft, PflegeplanAbfragen,
  PositionsNummer, QualifikationsStufe, Ziel, ZielId,
} from "./vertrag";
import {
  CAP_ZUORDNUNG, DETAILDIALOGE, DIAGNOSE_DETAILS, MAS_ZIEL, MOCK_DIAGNOSEN,
  MOCK_ZIELE, PROB_MAS, PROB_ZIEL_HIDE, STANDARD_POSITION,
  type RohMerkmal,
} from "./mock-daten";
import { alleLeistungspositionen, leistungsposition } from "./positionen";

/* Herkunft der Mock-Objekte: alles in mock-daten.ts ist für den Prototyp
   frei gewählt. Die Leistungsposition trägt ihre differenzierte Herkunft
   (katalog/kuratiert/mock) in positionen.ts. */
const HERKUNFT_DIAGNOSE: FeldHerkunft<Diagnose> = { code: "mock", titel: "mock", typ: "mock", definition: "mock" };
const HERKUNFT_ZIEL: FeldHerkunft<Ziel> = { id: "mock", titel: "mock" };

const diagnoseJeCode = new Map(MOCK_DIAGNOSEN.map(d => [d.code, d]));

function mitDiagnoseHerkunft(d: Diagnose): MitHerkunft<Diagnose> {
  return { ...d, herkunft: HERKUNFT_DIAGNOSE };
}

/**
 * (1) Vollständige Kandidatenliste zu den getriggerten CAPs.
 *
 * Dedupliziert über den Diagnosecode: schlagen mehrere CAPs dieselbe
 * Diagnose vor, werden CAPs und Belege vereinigt und der beste (kleinste)
 * Rang behalten. Sortiert nach Rang, dann Code — NIE gefiltert: eine
 * unterdrückte Diagnose, die die Fachperson dadurch übersieht, wäre ein
 * klinischer Fehler, den keine Metrik sichtbar macht.
 */
export function diagnoseVorschlaege(caps: CapCode[]): DiagnoseVorschlag[] {
  const gesammelt = new Map<DiagnoseCode, { caps: Set<CapCode>; belege: Beleg[]; rang: number }>();
  for (const cap of caps) {
    const liste = CAP_ZUORDNUNG[cap] ?? [];
    liste.forEach((eintrag, index) => {
      const rang = index + 1;
      const bisher = gesammelt.get(eintrag.code);
      if (bisher) {
        bisher.caps.add(cap);
        for (const b of eintrag.belege) {
          if (!bisher.belege.some(x => x.itemCode === b.itemCode && x.wert === b.wert)) bisher.belege.push(b);
        }
        bisher.rang = Math.min(bisher.rang, rang);
      } else {
        gesammelt.set(eintrag.code, { caps: new Set([cap]), belege: [...eintrag.belege], rang });
      }
    });
  }
  return [...gesammelt.entries()]
    .map(([code, e]) => {
      const diagnose = diagnoseJeCode.get(code);
      if (!diagnose) throw new Error(`Mock-Datenfehler: CAP-Zuordnung nennt unbekannte Diagnose ${code}`);
      return { diagnose: mitDiagnoseHerkunft(diagnose), ausloesendeCaps: [...e.caps], belege: e.belege, rang: e.rang };
    })
    .sort((a, b) => a.rang - b.rang || a.diagnose.code.localeCompare(b.diagnose.code));
}

/**
 * (2) Ziele einer Diagnose.
 *
 * Es gibt KEINE direkte Relation Diagnose → Ziel — Ziele hängen an
 * Interventionen (MAS_ZIEL). Die Ableitung, die der nächste Entwickler
 * nicht aus dem Schema errät:
 *
 *   zieleZuDiagnose(d) = Vereinigung der Ziele aller Interventionen von d
 *                        (PROB_MAS, dann MAS_ZIEL),
 *                        abzüglich PROB_ZIEL_HIDE(d).
 *
 * Die Ausschlussliste existiert genau deshalb: über die Vereinigung erreicht
 * man Ziele, die im Kontext dieser Diagnose klinisch keinen Sinn ergeben.
 * Ihre Anwendung ist keine Optimierung, sondern Vertragszusicherung.
 */
export function zieleZuDiagnose(code: DiagnoseCode): MitHerkunft<Ziel>[] {
  const interventionen = PROB_MAS[code] ?? [];
  const gesehen = new Set<ZielId>();
  const ergebnis: MitHerkunft<Ziel>[] = [];
  for (const interventionId of interventionen) {
    for (const zielId of MAS_ZIEL[interventionId] ?? []) {
      if (gesehen.has(zielId)) continue;
      gesehen.add(zielId);
      if (PROB_ZIEL_HIDE.has(`${code}|${zielId}`)) continue;
      const ziel = MOCK_ZIELE[zielId];
      if (ziel) ergebnis.push({ id: zielId, titel: ziel.titel, herkunft: HERKUNFT_ZIEL });
    }
  }
  return ergebnis;
}

/**
 * (3) Positions-Vorschläge, mit denen ein Ziel im Kontext einer Diagnose
 * verfolgt wird — die Massnahme IST seit dem Modellwechsel eine
 * Leistungsposition.
 *
 * Die Zuordnung entsteht durch ZUSAMMENLEGEN der früheren ENP-Kette: die
 * Interventions-Relationen (PROB_MAS ∩ MAS_ZIEL) bleiben als interne
 * Rohtabellen liegen, und je Intervention werden ihre Positionsnummern
 * eingesammelt — die Standardregel und alle Folgepositionen des früheren
 * Detaildialogs («Ganzwäsche im Bett» UND «in Bad/Dusche» sind jetzt zwei
 * Vorschläge). Frühere planerische Interventionen ohne Position tragen
 * nichts bei. Beim echten Katalog ersetzt eine kuratierte Zuordnungsliste
 * Diagnose/Ziel → Positionen diese Ableitung — die Abfrage bleibt.
 */
export function positionenZuZiel(code: DiagnoseCode, zielId: ZielId): MitHerkunft<Leistungsposition>[] {
  const nummern: PositionsNummer[] = [];
  const merken = (nr: PositionsNummer) => { if (!nummern.includes(nr)) nummern.push(nr); };
  for (const interventionId of (PROB_MAS[code] ?? [])) {
    if (!(MAS_ZIEL[interventionId] ?? []).includes(zielId)) continue;
    const dialog = DETAILDIALOGE[interventionId];
    if (dialog) {
      for (const gruppe of dialog.gruppen) {
        for (const item of gruppe.items) {
          if (item.folgePosition) merken(item.folgePosition);
        }
      }
    }
    const standard = STANDARD_POSITION[interventionId];
    if (standard) merken(standard);
  }
  return nummern
    .map(nr => leistungsposition(nr))
    .filter((p): p is MitHerkunft<Leistungsposition> => p !== null);
}

/** (4) Der ganze Leistungskatalog — für die freie Auswahl jenseits der
 *  Vorschläge, in Katalogreihenfolge. */
export function leistungsKatalog(): MitHerkunft<Leistungsposition>[] {
  return alleLeistungspositionen();
}

/* (5) Einzelauflösung einer Position per Nummer — re-exportiert aus
   positionen.ts; die Massnahme trägt nur die Nummer. */
export { leistungsposition };

/**
 * (6) Die Gegenliste zur Zusicherung aus (2): Ziele, die über eine
 * Intervention dieser Diagnose erreichbar wären, aber durch die
 * Ausschlussliste (PROB_ZIEL_HIDE) unterdrückt sind. Die Kontextkarte
 * nutzt nur die Länge; die Liste selbst beantwortet später die Frage
 * «welche Ziele unterdrückt ihr bei dieser Diagnose».
 */
export function ausgeschlosseneZiele(code: DiagnoseCode): MitHerkunft<Ziel>[] {
  const gesehen = new Set<ZielId>();
  const ergebnis: MitHerkunft<Ziel>[] = [];
  for (const interventionId of PROB_MAS[code] ?? []) {
    for (const zielId of MAS_ZIEL[interventionId] ?? []) {
      if (gesehen.has(zielId)) continue;
      gesehen.add(zielId);
      if (!PROB_ZIEL_HIDE.has(`${code}|${zielId}`)) continue;
      const ziel = MOCK_ZIELE[zielId];
      if (ziel) ergebnis.push({ id: zielId, titel: ziel.titel, herkunft: HERKUNFT_ZIEL });
    }
  }
  return ergebnis;
}

/**
 * (7) Ausgelöste CAPs ohne Zuordnungsliste. diagnoseVorschlaege überspringt
 * sie — hier werden sie ausgewiesen, damit keiner spurlos verschwindet.
 */
export function unbehandelteCaps(caps: CapCode[]): CapCode[] {
  return caps.filter(cap => !(cap in CAP_ZUORDNUNG));
}

/**
 * (8) Die Bewertungsskala der Zielerreichung — gelieferte
 * Katalog-Fachlichkeit, deshalb Herkunft «katalog». Absteigend geordnet:
 * 5 ist das beste Ergebnis, 1 das schlechteste; die Ordnung ist Teil des
 * Vertrags.
 */
const BEWERTUNGS_SKALA: BewertungsStufe[] = [
  { stufe: 5, label: "vollständig erreicht" },
  { stufe: 4, label: "weitgehend erreicht" },
  { stufe: 3, label: "teilweise erreicht" },
  { stufe: 2, label: "kaum erreicht" },
  { stufe: 1, label: "nicht erreicht" },
];
const HERKUNFT_STUFE: FeldHerkunft<BewertungsStufe> = { stufe: "katalog", label: "katalog" };

export function zielBewertungsSkala(): MitHerkunft<BewertungsStufe>[] {
  return BEWERTUNGS_SKALA.map(s => ({ ...s, herkunft: HERKUNFT_STUFE }));
}

/**
 * (9) Die Qualifikationsleiter — aufsteigend geordnet, Rang 1 ist die
 * niedrigste Stufe; die Ordnung ist Teil des Vertrags. Die Werte decken
 * sich mit der Mock-Anreicherung der Positionen (mindestqualifikation in
 * positionen.ts); die echte Quelle (Personalstamm, Tarifstufen) fehlt —
 * deshalb Herkunft «mock».
 */
const QUALIFIKATIONS_STUFEN: QualifikationsStufe[] = [
  { rang: 1, label: "Pflegehelfer/in SRK" },
  { rang: 2, label: "FaGe" },
  { rang: 3, label: "Dipl. Pflegefachperson HF" },
];
const HERKUNFT_QUALIFIKATION: FeldHerkunft<QualifikationsStufe> = { rang: "mock", label: "mock" };

export function qualifikationsStufen(): MitHerkunft<QualifikationsStufe>[] {
  return QUALIFIKATIONS_STUFEN.map(s => ({ ...s, herkunft: HERKUNFT_QUALIFIKATION }));
}

/**
 * (10) Die Detailangaben einer Diagnose. Die Abbildung der Rohzeilen
 * (Gruppenerkennung, Code-Auflösung) leistet merkmalsEintrag — als eigene,
 * testbare Funktion, damit die Logik beim Anschluss des echten Katalogs
 * unverändert bleibt.
 */

/**
 * Eine Rohzeile der Quelle auf den Vertragstyp abgebildet.
 *
 * ITEM_ART: 1 → Gruppe, 3 → Item. Ein UNBEKANNTER Wert ist ein Datenbefund,
 * kein Log-Eintrag: er kommt als Item durch (nichts wird verworfen) und
 * steht benannt im Rückgabewert — der Vertragstest prüft beides.
 *
 * EXT_TAXONOMIE: «9» + fünfstelliger NANDA-Code («900326» → 00326) →
 * diagnoseCode. Jede andere Form → null; der Code wird nie aus dem
 * Fliesstext gelesen.
 */
export function merkmalsEintrag(roh: RohMerkmal): { eintrag: MerkmalsEintrag; unbekannteArt: number | null } {
  const bekannt = roh.itemArt === 1 || roh.itemArt === 3;
  const treffer = roh.extTaxonomie?.match(/^9(\d{5})$/) ?? null;
  return {
    eintrag: {
      art: roh.itemArt === 1 ? "gruppe" : "item",
      text: roh.text,
      diagnoseCode: treffer ? treffer[1] : null,
    },
    unbekannteArt: bekannt ? null : roh.itemArt,
  };
}

const HERKUNFT_DETAILS: FeldHerkunft<DiagnoseDetails> = {
  code: "mock", titel: "mock", typ: "mock", definition: "mock", gebiet: "mock", thema: "mock",
  bestimmendeMerkmale: "mock", beeinflussendeFaktoren: "mock", risikofaktoren: "mock",
  risikopopulation: "mock", assoziierteBedingungen: "mock", achsen: "mock",
  anzahlPositionen: "mock", anzahlZiele: "mock",
};

export function diagnoseDetails(code: DiagnoseCode): MitHerkunft<DiagnoseDetails> | null {
  const basis = diagnoseJeCode.get(code);
  const roh = DIAGNOSE_DETAILS[code];
  if (!basis || !roh) return null;

  const liste = (zeilen?: ReadonlyArray<RohMerkmal>): Merkmalsliste | null => {
    if (!zeilen) return null;
    const unbekannte = new Set<number>();
    const eintraege = zeilen.map(z => {
      const { eintrag, unbekannteArt } = merkmalsEintrag(z);
      if (unbekannteArt !== null) unbekannte.add(unbekannteArt);
      return eintrag;
    });
    if (unbekannte.size > 0) {
      console.warn(`Pflegeplan-Katalog ${code}: unbekannte ITEM_ART ${[...unbekannte].join(", ")} — als Item behandelt.`);
    }
    return eintraege;
  };

  /* Katalogkennzahlen aus denselben Strukturen wie (2) und (3) — keine
     zweite Zahlenquelle. 0/0 ist eine gültige, ehrliche Antwort. */
  const ziele = zieleZuDiagnose(code);
  const positionsNummern = new Set<PositionsNummer>();
  for (const z of ziele) {
    for (const p of positionenZuZiel(code, z.id)) positionsNummern.add(p.nummer);
  }

  return {
    code: basis.code, titel: basis.titel, typ: basis.typ, definition: basis.definition,
    gebiet: roh.gebiet, thema: roh.thema,
    bestimmendeMerkmale: liste(roh.bestimmendeMerkmale),
    beeinflussendeFaktoren: liste(roh.beeinflussendeFaktoren),
    risikofaktoren: liste(roh.risikofaktoren),
    risikopopulation: liste(roh.risikopopulation),
    assoziierteBedingungen: liste(roh.assoziierteBedingungen),
    achsen: roh.achsen.map(a => ({ ...a })),
    anzahlPositionen: positionsNummern.size,
    anzahlZiele: ziele.length,
    herkunft: HERKUNFT_DETAILS,
  };
}

/** Der Vertrag als ein Objekt — für Übergabe an Komponenten oder Tests. */
export const mockPflegeplanKatalog: PflegeplanAbfragen = {
  diagnoseVorschlaege, zieleZuDiagnose, positionenZuZiel, leistungsKatalog, leistungsposition,
  ausgeschlosseneZiele, unbehandelteCaps, zielBewertungsSkala, qualifikationsStufen,
  diagnoseDetails,
};
