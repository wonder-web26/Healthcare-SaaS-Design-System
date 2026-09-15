/**
 * Mock-Datensatz des Pflegeplan-Vertrags — Testklient mit realistischer Fülle.
 *
 * TAUSCHGRENZE: Diese Tabellen liest ausschliesslich der Mock-Adapter
 * (mock-adapter.ts) und die Vertragstest-Datei. Das UI importiert nie von
 * hier, sondern nur die Vertragsabfragen — wer den echten Katalog
 * anschliesst, tauscht diese Datei, nicht das UI.
 *
 * Die drei Relationen tragen dieselben Namen und dieselbe Richtung wie die
 * Katalogseite der dbml:
 *   PROB_MAS        (NandaDiagnosisIntervention) — Diagnose → Interventionen
 *   MAS_ZIEL        (EnpInterventionGoal)        — Intervention → Ziele
 *   PROB_ZIEL_HIDE  (NandaDiagnosisGoalHidden)   — Unterdrückungen je Diagnose
 *
 * Diagnosetitel und Definitionen sind sinngemäss formuliert, nicht aus einer
 * lizenzierten NANDA-Vorlage übernommen (dieselbe Regel wie bei interRAI).
 * Alle fachlichen Zuordnungen in dieser Datei sind für den Prototyp frei
 * gewählt — Herkunft "mock"; der Adapter trägt das an jedes Feld.
 *
 * AUCH DIE CODES SIND MOCK: Sie decken sich nicht mit der realen
 * NANDA-Zuordnung. 00257 etwa trägt hier das Gebrechlichkeitssyndrom —
 * im realen Katalog steht dieser Code für eine andere Diagnose. Wer die
 * Mock-Codes später für real hält, ordnet falsch zu.
 */
import type { Beleg, CapCode, Diagnose, DiagnoseCode, PositionsNummer, ZielId } from "./vertrag";

/** Interne Kennung der ENP-Rohtabellen. Seit dem Modellwechsel (Massnahme =
 *  Leistungsposition) tauchen Interventionen nirgends mehr im Vertrag auf —
 *  die Relationen bleiben als Ableitungs-Rohdaten für Ziele (PROB_MAS,
 *  MAS_ZIEL) und Positions-Vorschläge (DETAILDIALOGE, STANDARD_POSITION). */
type InterventionId = string;

/** Rohform des früheren Detaildialogs — nur noch Quelltabelle der
 *  Positions-Vorschläge, kein Vertragstyp mehr. */
interface RohDetaildialog {
  gruppen: { label: string; items: { label: string; folgePosition: PositionsNummer | null }[] }[];
}

/* ── Diagnosekandidaten (41) ────────────────────────────────────────────── */
export const MOCK_DIAGNOSEN: readonly Diagnose[] = [
  // Sturz, Mobilität, Kognition
  { code: "00155", titel: "Sturzgefahr", typ: "risiko", definition: "Erhöhte Anfälligkeit für Stürze mit möglicher Verletzungsfolge." },
  { code: "00035", titel: "Verletzungsgefahr", typ: "risiko", definition: "Gefahr einer Verletzung durch Umgebungs- oder personenbezogene Risiken." },
  { code: "00085", titel: "Beeinträchtigte körperliche Mobilität", typ: "problem", definition: "Eingeschränkte selbstständige, gezielte Bewegung des Körpers." },
  { code: "00088", titel: "Beeinträchtigte Gehfähigkeit", typ: "problem", definition: "Eingeschränkte Fähigkeit, sich zu Fuss fortzubewegen." },
  { code: "00091", titel: "Beeinträchtigte Mobilität im Bett", typ: "problem", definition: "Eingeschränkte Fähigkeit, die Lage im Bett selbstständig zu wechseln." },
  { code: "00090", titel: "Beeinträchtigte Transferfähigkeit", typ: "problem", definition: "Eingeschränkte Fähigkeit, sich zwischen zwei nahen Flächen umzusetzen." },
  { code: "00092", titel: "Aktivitätsintoleranz", typ: "problem", definition: "Unzureichende Energie zur Bewältigung gewünschter täglicher Aktivitäten." },
  { code: "00093", titel: "Fatigue", typ: "problem", definition: "Anhaltendes überwältigendes Erschöpfungsgefühl mit verminderter Leistungsfähigkeit." },
  { code: "00128", titel: "Akute Verwirrtheit", typ: "problem", definition: "Plötzlich einsetzende, reversible Störung von Bewusstsein und Aufmerksamkeit." },
  { code: "00129", titel: "Chronische Verwirrtheit", typ: "problem", definition: "Fortschreitende, irreversible Beeinträchtigung von Intellekt und Persönlichkeit." },
  { code: "00131", titel: "Beeinträchtigtes Gedächtnis", typ: "problem", definition: "Anhaltende Unfähigkeit, Informationen oder Fertigkeiten zu erinnern." },
  { code: "00126", titel: "Defizitäres Wissen", typ: "problem", definition: "Fehlen von Informationen zu einem bestimmten gesundheitsbezogenen Thema." },
  { code: "00161", titel: "Bereitschaft für ein verbessertes Wissen", typ: "bereitschaft", definition: "Muster kognitiver Informationen, das gestärkt werden kann." },
  { code: "00004", titel: "Infektionsgefahr", typ: "risiko", definition: "Erhöhte Anfälligkeit für das Eindringen pathogener Organismen." },
  // Selbstversorgung, Haut, Ernährung, Ausscheidung
  { code: "00108", titel: "Selbstversorgungsdefizit Körperpflege", typ: "problem", definition: "Eingeschränkte Fähigkeit, Waschen und Körperpflege selbstständig durchzuführen." },
  { code: "00109", titel: "Selbstversorgungsdefizit Sich-Kleiden", typ: "problem", definition: "Eingeschränkte Fähigkeit, sich selbstständig an- und auszukleiden." },
  { code: "00102", titel: "Selbstversorgungsdefizit Essen", typ: "problem", definition: "Eingeschränkte Fähigkeit, selbstständig zu essen." },
  { code: "00110", titel: "Selbstversorgungsdefizit Toilettenbenutzung", typ: "problem", definition: "Eingeschränkte Fähigkeit, die Toilette selbstständig zu benutzen." },
  { code: "00046", titel: "Beeinträchtigte Hautintegrität", typ: "problem", definition: "Veränderte Epidermis und/oder Dermis." },
  { code: "00047", titel: "Gefahr einer beeinträchtigten Hautintegrität", typ: "risiko", definition: "Erhöhte Anfälligkeit für eine Schädigung der Haut." },
  { code: "00044", titel: "Beeinträchtigte Gewebeintegrität", typ: "problem", definition: "Schädigung von Schleimhaut, Kornea, Haut oder subkutanem Gewebe." },
  { code: "00002", titel: "Unausgewogene Ernährung: weniger als der Bedarf", typ: "problem", definition: "Nährstoffaufnahme, die den metabolischen Bedarf nicht deckt." },
  { code: "00103", titel: "Beeinträchtigtes Schlucken", typ: "problem", definition: "Abnorme Funktion des Schluckmechanismus." },
  { code: "00016", titel: "Beeinträchtigte Urinausscheidung", typ: "problem", definition: "Störung der Harnausscheidung." },
  { code: "00011", titel: "Obstipation", typ: "problem", definition: "Verminderte Stuhlfrequenz mit erschwerter oder unvollständiger Entleerung." },
  { code: "00098", titel: "Beeinträchtigte Haushaltsführung", typ: "problem", definition: "Unfähigkeit, ein sicheres, förderliches unmittelbares Wohnumfeld selbstständig zu erhalten." },
  // Schmerz, Schlaf, Coping
  { code: "00132", titel: "Akuter Schmerz", typ: "problem", definition: "Unangenehmes Sinnes- und Gefühlserlebnis mit absehbarem Ende." },
  { code: "00133", titel: "Chronischer Schmerz", typ: "problem", definition: "Anhaltendes oder wiederkehrendes Schmerzerleben über mehr als drei Monate." },
  { code: "00095", titel: "Insomnie", typ: "problem", definition: "Störung von Einschlafen und Durchschlafen mit Funktionsbeeinträchtigung." },
  { code: "00096", titel: "Schlafentzug", typ: "problem", definition: "Längere Phasen ohne anhaltende natürliche Schlafperioden." },
  { code: "00069", titel: "Unwirksames Coping", typ: "problem", definition: "Unfähigkeit, Stressoren angemessen einzuschätzen oder zu bewältigen." },
  // Stimmung, Rollen, Teilhabe
  { code: "00146", titel: "Angst", typ: "problem", definition: "Unbestimmtes Gefühl des Unbehagens oder der Bedrohung." },
  { code: "00124", titel: "Hoffnungslosigkeit", typ: "problem", definition: "Subjektiver Zustand begrenzter oder fehlender Handlungsalternativen." },
  { code: "00119", titel: "Chronisch geringes Selbstwertgefühl", typ: "problem", definition: "Langandauernde negative Selbstbewertung der eigenen Fähigkeiten." },
  { code: "00053", titel: "Soziale Isolation", typ: "problem", definition: "Vom Individuum als negativ erlebte Einsamkeit." },
  { code: "00052", titel: "Beeinträchtigte soziale Interaktion", typ: "problem", definition: "Unzureichender oder unwirksamer sozialer Austausch." },
  { code: "00097", titel: "Beeinträchtigte Freizeitbeschäftigung", typ: "problem", definition: "Vermindertes Anregungs- und Beschäftigungserleben in der freien Zeit." },
  { code: "00061", titel: "Rollenüberlastung pflegender Angehöriger", typ: "problem", definition: "Schwierigkeit, die Pflegerolle in der Familie zu erfüllen." },
  { code: "00062", titel: "Gefahr einer Rollenüberlastung pflegender Angehöriger", typ: "risiko", definition: "Erhöhte Anfälligkeit für eine Überforderung in der Pflegerolle." },
  { code: "00162", titel: "Bereitschaft für ein verbessertes Gesundheitsmanagement", typ: "bereitschaft", definition: "Muster der Steuerung der eigenen Gesundheit, das gestärkt werden kann." },
  { code: "00078", titel: "Unwirksames Gesundheitsmanagement", typ: "problem", definition: "Unzureichende Steuerung von Therapieplan und Gesundheitsverhalten im Alltag." },
  // Syndrom (Lauf 6g): die Bestimmenden Merkmale sind selbst Diagnosen
  { code: "00257", titel: "Gebrechlichkeitssyndrom des älteren Menschen", typ: "problem", definition: "Dynamischer Zustand instabilen Gleichgewichts, der ältere Menschen für den Verlust von Selbstständigkeit in einem oder mehreren Lebensbereichen anfällig macht." },
] as const;

/* ── CAP → Diagnosen (die fehlende Zuordnungsliste, als Mock) ───────────── */
/** Je CAP eine geordnete Kandidatenliste; die Position ist der Rang.
 *  Belege: welches Assessment-Item mit welchem Wert den Vorschlag stützt. */
export const CAP_ZUORDNUNG: Readonly<Record<CapCode, ReadonlyArray<{ code: DiagnoseCode; belege: Beleg[] }>>> = {
  "CAP-FALLS": [
    { code: "00155", belege: [{ itemCode: "iJ1", wert: "2" }, { itemCode: "iG3", wert: "1" }] },
    { code: "00085", belege: [{ itemCode: "iG1", wert: "3" }] },
    { code: "00088", belege: [{ itemCode: "iG2", wert: "2" }] },
    { code: "00035", belege: [{ itemCode: "iJ1", wert: "2" }] },
    { code: "00090", belege: [{ itemCode: "iG4", wert: "2" }] },
    { code: "00091", belege: [{ itemCode: "iG5", wert: "1" }] },
    { code: "00092", belege: [{ itemCode: "iG6", wert: "2" }] },
    { code: "00093", belege: [{ itemCode: "iE4", wert: "1" }] },
    { code: "00128", belege: [{ itemCode: "iC1", wert: "1" }] },
    { code: "00129", belege: [{ itemCode: "iC2", wert: "2" }] },
    { code: "00131", belege: [{ itemCode: "iC3", wert: "1" }] },
    { code: "00126", belege: [{ itemCode: "iJ2", wert: "1" }] },
    { code: "00161", belege: [{ itemCode: "iJ2", wert: "0" }] },
    { code: "00004", belege: [{ itemCode: "iK4", wert: "1" }] },
    { code: "00257", belege: [{ itemCode: "iJ1", wert: "2" }, { itemCode: "iG6", wert: "2" }] },
  ],
  "CAP-ADL": [
    { code: "00108", belege: [{ itemCode: "iG1a", wert: "3" }, { itemCode: "iG1b", wert: "2" }] },
    { code: "00109", belege: [{ itemCode: "iG1c", wert: "2" }] },
    { code: "00102", belege: [{ itemCode: "iG1d", wert: "1" }] },
    { code: "00110", belege: [{ itemCode: "iG1e", wert: "2" }] },
    { code: "00046", belege: [{ itemCode: "iK1", wert: "1" }] },
    { code: "00047", belege: [{ itemCode: "iK2", wert: "1" }] },
    { code: "00044", belege: [{ itemCode: "iK3", wert: "1" }] },
    { code: "00002", belege: [{ itemCode: "iK5", wert: "1" }] },
    { code: "00103", belege: [{ itemCode: "iK6", wert: "1" }] },
    { code: "00016", belege: [{ itemCode: "iH1", wert: "2" }] },
    { code: "00011", belege: [{ itemCode: "iH2", wert: "1" }] },
    { code: "00098", belege: [{ itemCode: "iF1", wert: "2" }] },
  ],
  "CAP-PAIN": [
    { code: "00132", belege: [{ itemCode: "iJ5", wert: "2" }] },
    { code: "00133", belege: [{ itemCode: "iJ5", wert: "3" }, { itemCode: "iJ6", wert: "2" }] },
    { code: "00095", belege: [{ itemCode: "iE7", wert: "2" }] },
    { code: "00096", belege: [{ itemCode: "iE7", wert: "3" }] },
    { code: "00085", belege: [{ itemCode: "iJ5", wert: "2" }] },
    { code: "00092", belege: [{ itemCode: "iJ5", wert: "2" }] },
    { code: "00069", belege: [{ itemCode: "iE5", wert: "1" }] },
    { code: "00146", belege: [{ itemCode: "iE1", wert: "1" }] },
  ],
  "CAP-MOOD": [
    { code: "00146", belege: [{ itemCode: "iE1a", wert: "2" }] },
    { code: "00124", belege: [{ itemCode: "iE1b", wert: "1" }] },
    { code: "00119", belege: [{ itemCode: "iE1c", wert: "1" }] },
    { code: "00053", belege: [{ itemCode: "iF2", wert: "2" }] },
    { code: "00052", belege: [{ itemCode: "iF3", wert: "1" }] },
    { code: "00097", belege: [{ itemCode: "iF4", wert: "1" }] },
    { code: "00061", belege: [{ itemCode: "iF5", wert: "2" }] },
    { code: "00062", belege: [{ itemCode: "iF5", wert: "1" }] },
    { code: "00162", belege: [{ itemCode: "iJ7", wert: "0" }] },
    { code: "00078", belege: [{ itemCode: "iJ7", wert: "2" }] },
  ],
};

/* ── PROB_MAS: Diagnose → Interventionen ────────────────────────────────── */
/** 00162 (Bereitschaftsdiagnose) hat bewusst KEINE Interventionen — die
 *  Diagnose ohne verknüpfte Ziele. I-GLEICHGEWICHT dient zwei Diagnosen. */
export const PROB_MAS: Readonly<Record<DiagnoseCode, readonly InterventionId[]>> = {
  "00155": ["I-STURZASSESS", "I-WOHNUMFELD", "I-GLEICHGEWICHT", "I-HILFSMITTEL", "I-STURZBERATUNG", "I-ZIELGESPRAECH"],
  "00085": ["I-GEHTRAINING", "I-TRANSFER", "I-BEWEGUNG", "I-GLEICHGEWICHT", "I-LAGERUNG"],
  "00108": ["I-GANZWASCHUNG", "I-TEILWAESCHE", "I-HAUTPFLEGE", "I-ANLEITUNG-SELBSTPFLEGE", "I-HAARWAESCHE"],
  "00162": [],
};

/* ── Ziele ──────────────────────────────────────────────────────────────── */
export const MOCK_ZIELE: Readonly<Record<ZielId, { titel: string }>> = {
  "Z-STURZFREI": { titel: "Bleibt im Beobachtungszeitraum sturzfrei" },
  "Z-BALANCE": { titel: "Verbesserte Gleichgewichtsfähigkeit" },
  "Z-HILFSMITTEL-SICHER": { titel: "Setzt die Gehhilfe sicher und regelmässig ein" },
  "Z-WISSEN-STURZ": { titel: "Kennt die eigenen Sturzrisiken und Schutzmassnahmen" },
  "Z-WOHNUMFELD": { titel: "Bewegt sich in einem angepassten, sicheren Wohnumfeld" },
  "Z-GEHSTRECKE": { titel: "Erhält die Gehstrecke innerhalb der Wohnung" },
  "Z-TRANSFER": { titel: "Führt Transfers selbstständig und sicher durch" },
  "Z-BEWEGLICH": { titel: "Erhält die Gelenkbeweglichkeit" },
  "Z-HAUT": { titel: "Die Haut bleibt intakt" },
  "Z-SELBSTPFLEGE": { titel: "Grösstmögliche Selbstständigkeit bei der Körperpflege" },
  "Z-WOHLBEFINDEN": { titel: "Fühlt sich wohl und gepflegt" },
};

/* ── MAS_ZIEL: Intervention → Ziele ─────────────────────────────────────── */
/** I-GLEICHGEWICHT dient zwei Zielen (die Massnahme mit zwei Zielen);
 *  Z-BALANCE ist über I-GLEICHGEWICHT von zwei Diagnosen aus erreichbar
 *  (das Ziel, das zwei Diagnosen dient). */
export const MAS_ZIEL: Readonly<Record<InterventionId, readonly ZielId[]>> = {
  "I-STURZASSESS": ["Z-STURZFREI"],
  "I-WOHNUMFELD": ["Z-WOHNUMFELD", "Z-STURZFREI"],
  "I-GLEICHGEWICHT": ["Z-BALANCE", "Z-STURZFREI"],
  "I-HILFSMITTEL": ["Z-HILFSMITTEL-SICHER"],
  "I-STURZBERATUNG": ["Z-WISSEN-STURZ", "Z-WOHLBEFINDEN"],
  "I-ZIELGESPRAECH": ["Z-WISSEN-STURZ"],
  "I-GEHTRAINING": ["Z-GEHSTRECKE"],
  "I-TRANSFER": ["Z-TRANSFER"],
  "I-BEWEGUNG": ["Z-BEWEGLICH"],
  "I-LAGERUNG": ["Z-BEWEGLICH", "Z-HAUT"],
  "I-GANZWASCHUNG": ["Z-SELBSTPFLEGE", "Z-WOHLBEFINDEN"],
  "I-TEILWAESCHE": ["Z-WOHLBEFINDEN"],
  "I-HAUTPFLEGE": ["Z-HAUT"],
  "I-ANLEITUNG-SELBSTPFLEGE": ["Z-SELBSTPFLEGE"],
  "I-HAARWAESCHE": ["Z-WOHLBEFINDEN"],
};

/* ── PROB_ZIEL_HIDE: Unterdrückungen je Diagnose ────────────────────────── */
/**
 * Z-WOHLBEFINDEN ist bei der Sturzgefahr (00155) über I-STURZBERATUNG
 * transitiv erreichbar, ergibt dort klinisch aber keinen Sinn — genau der
 * Fall, für den die Ausschlussliste existiert. Bei 00108 bleibt dasselbe
 * Ziel sichtbar.
 */
export const PROB_ZIEL_HIDE: ReadonlySet<string> = new Set([
  "00155|Z-WOHLBEFINDEN",
]);

/* ── Detaildialoge ──────────────────────────────────────────────────────── */
/** Nur die Ganzkörperwaschung präzisiert; die Ortswahl schaltet die
 *  Leistungsposition um (Vorbild aus dem Lauf: Bett → 10101, Dusche → 10102).
 *  Die zweite Gruppe zeigt den Fall ohne Positionswirkung. */
export const DETAILDIALOGE: Readonly<Record<InterventionId, RohDetaildialog>> = {
  "I-GANZWASCHUNG": {
    gruppen: [
      {
        label: "Ort der Durchführung",
        items: [
          { label: "Im Bett", folgePosition: "10101" },
          { label: "In Dusche oder Bad", folgePosition: "10102" },
        ],
      },
      {
        label: "Haarwäsche einschliessen",
        items: [
          { label: "Ja", folgePosition: null },
          { label: "Nein", folgePosition: null },
        ],
      },
    ],
  },
};

/* ── Positionsregeln ohne Dialog ────────────────────────────────────────── */
/** Feste Standardposition je Intervention. Interventionen ohne Eintrag —
 *  etwa I-ZIELGESPRAECH — haben keine Regel: sie bleiben planerisch und
 *  werden nicht verrechnet (positionFuer liefert null, gültiger Zustand).
 *  I-STURZASSESS → 10901 ist eine frei gewählte Prototyp-Zuordnung (mock,
 *  Lauf 3): 10901 trägt keine Ausführungsschritte, damit der Fall «Position
 *  ohne Teilhandlungen» über die Oberfläche beobachtbar ist. */
export const STANDARD_POSITION: Readonly<Record<InterventionId, PositionsNummer>> = {
  "I-TEILWAESCHE": "10103",
  "I-GEHTRAINING": "10505",
  "I-HAARWAESCHE": "10107",
  "I-STURZASSESS": "10901",
  /* Lauf 6b: die bewusste DOPPELBELEGUNG — zwei Interventionen auf derselben
     Position (10506 «Aktive/passive Bewegungsunterstützung», fast wortgleich
     zum Katalogtext). Sie beweist die Zusammenfassung auf dem
     Leistungsplanungsblatt: eine Position, getragen von zwei Massnahmen,
     die drei Ziele unter zwei Diagnosen bedienen. */
  "I-BEWEGUNG": "10506",
  "I-GLEICHGEWICHT": "10506",
};

/* ── Diagnose-Detailangaben (Lauf 6g) ───────────────────────────────────── */
/**
 * Rohform, quellennah: `itemArt` trägt den Zahlencode der Quellspalte
 * ITEM_ART (1 = Gruppenüberschrift, 3 = Item; andere Werte sind nicht
 * ausgeschlossen), `extTaxonomie` den String der Quellspalte EXT_TAXONOMIE
 * («9» + NANDA-Code, wenn der Eintrag selbst eine Pflegediagnose ist).
 * Die ABBILDUNG auf den Vertragstyp — Gruppenerkennung, Code-Auflösung,
 * Umgang mit unbekannter itemArt — leistet der Adapter, nicht diese Datei.
 * Beim Anschluss des echten Katalogs tauscht sich die Quelle, nicht die
 * Logik.
 *
 * Detailliert sind vier Diagnosen (alle Anzeigefälle des Laufs); die
 * übrigen Codes liefern null. Alle Angaben: Herkunft mock.
 */
export interface RohMerkmal {
  itemArt: number;
  text: string;
  extTaxonomie: string | null;
}

export interface RohDetails {
  gebiet: string;
  thema: string;
  achsen: ReadonlyArray<{ art: string; wert: string }>;
  bestimmendeMerkmale?: ReadonlyArray<RohMerkmal>;
  beeinflussendeFaktoren?: ReadonlyArray<RohMerkmal>;
  risikofaktoren?: ReadonlyArray<RohMerkmal>;
  risikopopulation?: ReadonlyArray<RohMerkmal>;
  assoziierteBedingungen?: ReadonlyArray<RohMerkmal>;
}

/* Kurzform für die Rohzeilen: g = Gruppenüberschrift (ITEM_ART 1),
   i = Item (ITEM_ART 3), Code als «9»+NANDA wie in der Quelle. */
const g = (text: string): RohMerkmal => ({ itemArt: 1, text, extTaxonomie: null });
const i = (text: string, code?: string): RohMerkmal => ({ itemArt: 3, text, extTaxonomie: code ? `9${code}` : null });

export const DIAGNOSE_DETAILS: Readonly<Record<DiagnoseCode, RohDetails>> = {
  /* Das Syndrom: alle fünfzehn Bestimmenden Merkmale sind selbst
     Pflegediagnosen — der Code steht in EXT_TAXONOMIE, nie im Fliesstext. */
  "00257": {
    gebiet: "Gesundheitsförderung",
    thema: "Gesundheitsmanagement",
    achsen: [
      { art: "Fokus", wert: "Gebrechlichkeitssyndrom" },
      { art: "Subjekt", wert: "Individuum" },
      { art: "Beurteilung", wert: "beeinträchtigt" },
      { art: "Alter", wert: "älterer Mensch" },
      { art: "Zeit", wert: "chronisch" },
      { art: "Status", wert: "vorhanden" },
    ],
    bestimmendeMerkmale: [
      i("Aktivitätsintoleranz", "00092"),
      i("Fatigue", "00093"),
      i("Beeinträchtigte körperliche Mobilität", "00085"),
      i("Beeinträchtigte Gehfähigkeit", "00088"),
      i("Beeinträchtigte Transferfähigkeit", "00090"),
      i("Beeinträchtigte Mobilität im Bett", "00091"),
      i("Selbstversorgungsdefizit Körperpflege", "00108"),
      i("Selbstversorgungsdefizit Sich-Kleiden", "00109"),
      i("Selbstversorgungsdefizit Essen", "00102"),
      i("Selbstversorgungsdefizit Toilettenbenutzung", "00110"),
      i("Unausgewogene Ernährung: weniger als der Bedarf", "00002"),
      i("Hoffnungslosigkeit", "00124"),
      i("Soziale Isolation", "00053"),
      i("Beeinträchtigtes Gedächtnis", "00131"),
      i("Sturzgefahr", "00155"),
    ],
    beeinflussendeFaktoren: [
      i("Immobilität über längere Zeit"),
      i("Erschöpfung"),
      i("Mangelernährung"),
      i("Altersbedingter Muskelabbau"),
      i("Soziale Vereinsamung"),
      i("Depressive Verstimmung"),
      i("Polypharmazie (mehr als fünf Wirkstoffe)"),
      i("Unzureichende Energiezufuhr"),
    ],
    risikopopulation: [
      i("Menschen über 70 Jahre"),
      i("Alleinlebende Menschen"),
      i("Menschen mit niedrigem Einkommen"),
      i("Menschen nach längerem Spitalaufenthalt"),
    ],
    assoziierteBedingungen: [
      i("Chronische Erkrankung"),
      i("Endokrine Störung"),
      i("Psychische Erkrankung"),
      i("Sensorische Beeinträchtigung"),
      i("Sarkopenie"),
      i("Verminderte Serumalbuminwerte"),
    ],
  },

  /* Die Risikodiagnose: keine Bestimmenden Merkmale, keine Beeinflussenden
     Faktoren — dafür 49 Risikofaktoren in vier Gruppen (nach dem Vorbild
     von 00303). Zwei Faktoren tragen selbst einen Diagnosecode. */
  "00155": {
    gebiet: "Sicherheit und Schutz",
    thema: "Physische Verletzung",
    achsen: [
      { art: "Fokus", wert: "Sturz" },
      { art: "Subjekt", wert: "Individuum" },
      { art: "Beurteilung", wert: "Gefahr" },
      { art: "Alter", wert: "älterer Mensch" },
      { art: "Zeit", wert: "akut" },
      { art: "Status", wert: "Risiko" },
    ],
    risikofaktoren: [
      g("Physiologische Faktoren"),
      i("Beeinträchtigtes Gleichgewicht"),
      i("Beeinträchtigte körperliche Mobilität", "00085"),
      i("Beeinträchtigte Gehfähigkeit", "00088"),
      i("Verminderte Muskelkraft der unteren Extremitäten"),
      i("Orthostatische Hypotonie"),
      i("Schwindel beim Lagewechsel"),
      i("Verminderte Sehschärfe"),
      i("Hörbeeinträchtigung"),
      i("Dranginkontinenz"),
      i("Nächtlicher Toilettengang"),
      i("Fussdeformitäten"),
      i("Schmerzen beim Gehen"),
      i("Verminderte Ausdauer"),
      i("Hypoglykämie-Episoden"),
      i("Anämie"),
      i("Dehydratation"),
      i("Schlafmangel"),
      i("Verminderte propriozeptive Wahrnehmung"),
      g("Psychoneurologische Faktoren"),
      i("Akute Verwirrtheit"),
      i("Chronische kognitive Beeinträchtigung"),
      i("Fehleinschätzung der eigenen Fähigkeiten"),
      i("Sturzangst mit Vermeidungsverhalten"),
      i("Unruhe und Agitation"),
      i("Depressive Symptomatik"),
      i("Impulsivität"),
      i("Beeinträchtigte Aufmerksamkeit"),
      i("Delirante Episoden in der Nacht"),
      i("Desorientierung in neuer Umgebung"),
      g("Umweltfaktoren"),
      i("Lose Teppiche und Läufer"),
      i("Fehlende Haltegriffe im Bad"),
      i("Unzureichende Beleuchtung"),
      i("Glatte oder nasse Böden"),
      i("Stolperkanten und Türschwellen"),
      i("Ungeeignetes Schuhwerk"),
      i("Möbel als Gehhilfe benutzt"),
      i("Kabel in Gehwegen"),
      i("Fehlender Handlauf an der Treppe"),
      i("Haustiere im Gehbereich"),
      i("Ungesicherte Leitern und Tritte"),
      i("Wohnung über mehrere Etagen"),
      g("Andere Faktoren"),
      i("Sedierende Medikation"),
      i("Polypharmazie (mehr als fünf Wirkstoffe)"),
      i("Alkoholkonsum"),
      i("Neu angepasste Brille"),
      i("Kürzlich veränderte Medikation"),
      i("Eile beim Gang zur Toilette"),
      i("Ungewohnte Hilfsmittel"),
      i("Fehlende Begleitung bei Transfers"),
      i("Sturz in den letzten drei Monaten"),
    ],
    risikopopulation: [
      i("Menschen über 65 Jahre"),
      i("Alleinlebende Menschen"),
      i("Menschen mit Stürzen in der Vorgeschichte"),
      i("Menschen in den ersten Tagen nach Spitalaustritt"),
      i("Menschen mit nächtlichem Toilettengang"),
      i("Menschen mit Gehhilfen"),
      i("Menschen mit kürzlich verändertem Wohnumfeld"),
      i("Menschen mit orthostatischen Beschwerden"),
    ],
    assoziierteBedingungen: [
      i("Morbus Parkinson"),
      i("Zustand nach Hirnschlag"),
      i("Demenz"),
      i("Diabetes mellitus mit Polyneuropathie"),
      i("Herzrhythmusstörungen"),
      i("Arthrose der unteren Extremitäten"),
      i("Osteoporose"),
      i("Katarakt"),
      i("Periphere Neuropathie"),
      i("Vestibuläre Störung"),
    ],
  },

  /* Der Alltagsfall: vier belegte Listen, kein Eintrag trägt einen
     Diagnosecode — die Gegenprobe zur Anklickbarkeit. */
  "00108": {
    gebiet: "Aktivität und Ruhe",
    thema: "Selbstversorgung",
    achsen: [
      { art: "Fokus", wert: "Selbstversorgung: Körperpflege" },
      { art: "Subjekt", wert: "Individuum" },
      { art: "Beurteilung", wert: "beeinträchtigt" },
      { art: "Alter", wert: "alle Altersgruppen" },
      { art: "Zeit", wert: "anhaltend" },
      { art: "Status", wert: "vorhanden" },
    ],
    bestimmendeMerkmale: [
      i("Unfähigkeit, den Körper vollständig zu waschen"),
      i("Unfähigkeit, Wasser in geeigneter Temperatur bereitzustellen"),
      i("Unfähigkeit, die Badezimmerausstattung zu erreichen"),
      i("Unfähigkeit, sich abzutrocknen"),
      i("Unfähigkeit, Waschutensilien zu beschaffen"),
      i("Auslassen einzelner Körperregionen bei der Pflege"),
      i("Unvollständige Mund- und Zahnpflege"),
      i("Vernachlässigte Haar- und Nagelpflege"),
      i("Ablehnung der Körperpflege bei Übernahme durch Dritte"),
    ],
    beeinflussendeFaktoren: [
      i("Verminderte Ausdauer"),
      i("Schmerz bei Bewegung"),
      i("Beeinträchtigte Wahrnehmung des eigenen Körpers"),
      i("Antriebslosigkeit"),
      i("Angst vor dem Ausrutschen in der Nasszelle"),
      i("Ungeeignete Ausstattung der Nasszelle"),
    ],
    risikopopulation: [
      i("Menschen im hohen Alter"),
      i("Menschen nach längerer Immobilisation"),
      i("Alleinlebende Menschen ohne Unterstützung im Haushalt"),
    ],
    assoziierteBedingungen: [
      i("Neuromuskuläre Erkrankung"),
      i("Kognitive Beeinträchtigung"),
      i("Muskuloskelettale Beeinträchtigung"),
      i("Ausgeprägte Sehbeeinträchtigung"),
      i("Depressive Störung"),
    ],
  },

  /* Die Bereitschaftsdiagnose: genau eine belegte Liste. */
  "00161": {
    gebiet: "Wahrnehmung und Kognition",
    thema: "Kognition",
    achsen: [
      { art: "Fokus", wert: "Wissen" },
      { art: "Subjekt", wert: "Individuum" },
      { art: "Beurteilung", wert: "Bereitschaft für Verbesserung" },
      { art: "Zeit", wert: "anhaltend" },
      { art: "Status", wert: "Gesundheitsförderung" },
    ],
    bestimmendeMerkmale: [
      i("Äussert den Wunsch, mehr über die eigene Erkrankung zu erfahren"),
      i("Stellt gezielte Fragen zu Pflege und Behandlung"),
      i("Greift angebotene Informationsmaterialien auf"),
      i("Wendet Gelerntes im Alltag an"),
      i("Beschreibt frühere Lernerfolge im Umgang mit der Gesundheit"),
    ],
  },
};
