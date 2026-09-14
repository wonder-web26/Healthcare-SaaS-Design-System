/**
 * Mock-Adapter — die fünf Leseabfragen des Pflegeplan-Vertrags, bedient aus
 * dem Mock-Datensatz. Wer später den echten Katalog (NANDA-I PLUS mit ENP,
 * CAP-NANDA-Zuordnungsliste) anschliesst, schreibt einen zweiten Adapter
 * hinter denselben Vertrag und tauscht die Datenquelle — nicht das UI.
 */
import type {
  Beleg, BewertungsStufe, CapCode, DetailAuswahl, Detaildialog, Diagnose, DiagnoseCode,
  DiagnoseVorschlag, FeldHerkunft, Intervention, InterventionId,
  Leistungsposition, MitHerkunft, PflegeplanAbfragen, QualifikationsStufe, Ziel, ZielId,
} from "./vertrag";
import {
  CAP_ZUORDNUNG, DETAILDIALOGE, MAS_ZIEL, MOCK_DIAGNOSEN,
  MOCK_INTERVENTIONEN, MOCK_ZIELE, PROB_MAS, PROB_ZIEL_HIDE, STANDARD_POSITION,
} from "./mock-daten";
import { leistungsposition } from "./positionen";

/* Herkunft der Mock-Objekte: alles in mock-daten.ts ist für den Prototyp
   frei gewählt. Die Leistungsposition trägt ihre differenzierte Herkunft
   (katalog/kuratiert/mock) in positionen.ts. */
const HERKUNFT_DIAGNOSE: FeldHerkunft<Diagnose> = { code: "mock", titel: "mock", typ: "mock", definition: "mock" };
const HERKUNFT_ZIEL: FeldHerkunft<Ziel> = { id: "mock", titel: "mock" };
const HERKUNFT_INTERVENTION: FeldHerkunft<Intervention> = { id: "mock", titel: "mock", hatDetaildialog: "mock" };
const HERKUNFT_DETAILDIALOG: FeldHerkunft<Detaildialog> = { gruppen: "mock" };

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
 * (3) Interventionen, mit denen ein Ziel im Kontext einer Diagnose verfolgt
 * wird — die Umkehrung derselben Ableitung:
 *
 *   interventionenZuZiel(d, z) = Interventionen von d (PROB_MAS),
 *                                geschnitten mit den Interventionen,
 *                                die z vorschlagen (MAS_ZIEL).
 */
export function interventionenZuZiel(code: DiagnoseCode, zielId: ZielId): MitHerkunft<Intervention>[] {
  return (PROB_MAS[code] ?? [])
    .filter(interventionId => (MAS_ZIEL[interventionId] ?? []).includes(zielId))
    .map(interventionId => ({
      id: interventionId,
      titel: MOCK_INTERVENTIONEN[interventionId]?.titel ?? interventionId,
      hatDetaildialog: interventionId in DETAILDIALOGE,
      herkunft: HERKUNFT_INTERVENTION,
    }));
}

/** (4) Präzisierungs-Dialog einer Intervention — null, wenn keiner hinterlegt ist. */
export function detaildialog(interventionId: InterventionId): MitHerkunft<Detaildialog> | null {
  const dialog = DETAILDIALOGE[interventionId];
  if (!dialog) return null;
  return { gruppen: dialog.gruppen, herkunft: HERKUNFT_DETAILDIALOG };
}

/**
 * (5) Leistungsposition zu einer Intervention und der getroffenen
 * Detailauswahl.
 *
 * Mit Dialog entscheidet die Auswahl: die erste gewählte Option mit
 * `folgePosition` (in Dialogreihenfolge der Gruppen) bestimmt die Position.
 * Ohne Treffer — und ohne Dialog — gilt die Standardregel der Intervention.
 * Ohne jede Regel: null. Das ist ein gültiger Zustand, kein Fehler —
 * die Massnahme bleibt planerisch und wird nicht verrechnet.
 */
export function positionFuer(interventionId: InterventionId, detailauswahl: DetailAuswahl): MitHerkunft<Leistungsposition> | null {
  const dialog = DETAILDIALOGE[interventionId];
  if (dialog) {
    for (const gruppe of dialog.gruppen) {
      const wahl = detailauswahl.find(a => a.gruppe === gruppe.label);
      if (!wahl) continue;
      const item = gruppe.items.find(i => i.label === wahl.item);
      if (item?.folgePosition) return leistungsposition(item.folgePosition);
    }
  }
  const standard = STANDARD_POSITION[interventionId];
  return standard ? leistungsposition(standard) : null;
}

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

/** Der Vertrag als ein Objekt — für Übergabe an Komponenten oder Tests. */
export const mockPflegeplanKatalog: PflegeplanAbfragen = {
  diagnoseVorschlaege, zieleZuDiagnose, interventionenZuZiel, detaildialog, positionFuer,
  ausgeschlosseneZiele, unbehandelteCaps, zielBewertungsSkala, qualifikationsStufen,
};
