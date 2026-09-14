/**
 * Pflegeplan — der Datenvertrag (Lauf 1).
 *
 * Die fachliche Kette: Pflegediagnose → Ziel → Massnahme → Detailintervention
 * → KLV-Leistungsposition. Das UI der Läufe 2–8 arbeitet ausschliesslich gegen
 * diesen Vertrag; dahinter liegt heute der Mock-Adapter (mock-adapter.ts).
 *
 * TAUSCHGRENZE: Die echten Kataloge (NANDA-I PLUS 2024–2026 mit ENP 3.4,
 * CAP-NANDA-Zuordnungsliste von Spitex Schweiz) sind lizenzrechtlich und
 * fachlich noch nicht freigegeben. Der spätere Anschluss ist ein weiterer
 * Adapter hinter DIESEM Vertrag — ein Tausch der Datenquelle, kein Umbau
 * des UI. Wer hier Typen ändert, ändert den Vertrag für beide Seiten.
 */

/* ── Herkunft ─────────────────────────────────────────────────────────────
   Jedes Feld trägt eine Herkunft — nicht pro Abfrage, sondern pro Feld.
   Das UI muss unterscheiden können, was amtlich belegt ist und was nicht,
   besonders wo Teilhandlungen als Handlungsanleitung erscheinen.

   - "katalog":  amtlich belegt (offizieller Leistungskatalog bzw. dessen
                 belegte Teilhandlungen)
   - "kuratiert": aus einer internen Vorlage strukturiert übernommen
                 (Initialschulungs-Vorlage), fachlich noch nicht validiert
   - "mock":     für den Prototyp frei gewählt                              */
export type Herkunft = "katalog" | "kuratiert" | "mock";

/** Herkunft je Feld eines Wertobjekts — parallele Karte, kein Hüllobjekt.
 *  Auch ein null-Feld trägt eine Herkunft: die Aussage «nicht vorhanden»
 *  hat selbst eine Quelle. */
export type FeldHerkunft<T> = { readonly [K in keyof T]: Herkunft };

/** Ein Vertragsobjekt samt seiner Herkunftskarte. Der Wert bleibt direkt
 *  lesbar (`position.nummer`), die Herkunft daneben (`position.herkunft.nummer`). */
export type MitHerkunft<T> = T & { readonly herkunft: FeldHerkunft<T> };

/* ── Fachliche Kennungen ────────────────────────────────────────────────── */
export type CapCode = string;
export type DiagnoseCode = string;
export type ZielId = string;
export type InterventionId = string;
export type PositionsNummer = string;

/* ── Diagnose ───────────────────────────────────────────────────────────── */
/**
 * Der Diagnosetyp steuert später, welche Begründungsfelder das UI zeigt:
 * Problemdiagnosen bekommen Bestimmende Merkmale und Beeinflussende Faktoren,
 * Risikodiagnosen bekommen Risikofaktoren. Deshalb gehört er in den Vertrag,
 * auch wenn dieser Lauf die Felder selbst noch nicht liefert.
 */
export type DiagnoseTyp = "problem" | "risiko" | "bereitschaft";

export interface Diagnose {
  code: DiagnoseCode;
  titel: string;
  typ: DiagnoseTyp;
  definition: string;
}

/** Ein Beleg aus dem Assessment: welches Item mit welchem Wert die
 *  Diagnose stützt. */
export interface Beleg {
  itemCode: string;
  wert: string;
}

export interface DiagnoseVorschlag {
  diagnose: MitHerkunft<Diagnose>;
  ausloesendeCaps: CapCode[];
  belege: Beleg[];
  rang: number;
}

/* ── Ziel und Intervention ──────────────────────────────────────────────── */
export interface Ziel {
  id: ZielId;
  titel: string;
}

export interface Intervention {
  id: InterventionId;
  titel: string;
  /** Kündigt an, dass detaildialog(id) nicht null liefert — das UI zeigt
   *  dann den Präzisierungs-Schritt vor der Positionsableitung. */
  hatDetaildialog: boolean;
}

/* ── Detaildialog ───────────────────────────────────────────────────────── */
/** Ein Item der Präzisierung. `folgePosition` bestimmt, welche
 *  Leistungsposition die Wahl dieses Items nach sich zieht — null, wenn die
 *  Wahl die Position nicht beeinflusst. */
export interface DetaildialogItem {
  label: string;
  folgePosition: PositionsNummer | null;
}

export interface DetaildialogGruppe {
  label: string;
  items: DetaildialogItem[];
}

export interface Detaildialog {
  gruppen: DetaildialogGruppe[];
}

/** Die im Dialog getroffene Wahl: je Gruppe das gewählte Item (per Label). */
export type DetailAuswahl = ReadonlyArray<{ gruppe: string; item: string }>;

/* ── Leistungsposition ──────────────────────────────────────────────────── */
export interface Leistungsposition {
  nummer: PositionsNummer;
  bezeichnung: string;
  /** Bereichsgruppe des Katalogs, z.B. «Hygiene und Komfort». */
  kategorie: string;
  /** KLV-Kategorie; "nein" = nicht KLV-pflichtig (Hauswirtschaft, Begleitung). */
  klv: "a" | "b" | "c" | "nein";
  vorgabeMinuten: number | null;
  mindestqualifikation: string | null;
  maxAnzahl: number | null;
  maxEinheit: "tag" | "woche" | null;
  /** Teilhandlungen der Position. null = keine hinterlegt — die Position
   *  fällt damit nicht aus dem Vertrag. */
  teilhandlungen: string[] | null;
}

/* ── Zielerreichung ─────────────────────────────────────────────────────── */
/**
 * Die fünfstufige Bewertungsskala der Zielerreichung — gelieferte
 * Katalog-Fachlichkeit (EnpGoalCatalog führt je Ziel eine 5-Stufen-Skala),
 * keine Setzung von uns.
 *
 * DIE ORDNUNG IST TEIL DES VERTRAGS: 5 ist das beste Ergebnis, 1 das
 * schlechteste, geliefert absteigend. Wird die Reihenfolge irgendwo
 * umgedreht, entstehen Auswertungen, die das Gegenteil aussagen — und das
 * merkt niemand.
 */
export interface BewertungsStufe {
  stufe: 1 | 2 | 3 | 4 | 5;
  label: string;
}

/* ── Ableitung ──────────────────────────────────────────────────────────── */
/**
 * Die Kette von CAP über Diagnose, Ziel und Intervention bis zur Position —
 * als Wertobjekt, das später an jeder geplanten Massnahme hängt. Sie ist die
 * Begründungsspur: warum diese Position geplant ist, rückwärts lesbar bis
 * zum Assessment.
 */
export interface Ableitung {
  cap: CapCode;
  diagnoseCode: DiagnoseCode;
  zielId: ZielId;
  interventionId: InterventionId;
  /** null = die Massnahme bleibt planerisch und wird nicht verrechnet. */
  positionsNummer: PositionsNummer | null;
}

/** Die Ableitung als lesbare Zeichenkette, z.B. für Protokolle und Tooltips. */
export function ableitungAlsText(a: Ableitung): string {
  return [a.cap, a.diagnoseCode, a.zielId, a.interventionId, a.positionsNummer ?? "ohne Position"].join(" → ");
}

/* ── Die Abfragen ───────────────────────────────────────────────────────── */
/**
 * Alles, was das UI braucht — und nur das. Alle Abfragen sind lesend.
 *
 * Zu (1): Die Kandidatenliste ist VOLLSTÄNDIG und wird nie gefiltert, nur
 * sortiert. Eine unterdrückte Diagnose, die die Fachperson dadurch übersieht,
 * wäre ein klinischer Fehler, den keine Metrik sichtbar macht.
 *
 * Zu (2): Vertragszusicherung — die Ausschlussliste (PROB_ZIEL_HIDE) ist
 * bereits angewendet.
 *
 * Zu (5): null ist ein gültiger Zustand, kein Fehler. Interventionen ohne
 * hinterlegte Regel bleiben planerisch und werden nicht verrechnet.
 *
 * Zu (6) — Ergänzung aus Lauf 2: die Gegenliste zur Zusicherung aus (2).
 * Nicht als Zahl, sondern als Liste — «welche Ziele unterdrückt ihr bei
 * dieser Diagnose» muss beantwortbar bleiben; die Kontextkarte nutzt nur
 * die Länge, der Rest ist Vorrat für die fachliche Freigabe.
 *
 * Zu (7) — Ergänzung aus Lauf 2: ein ausgelöster CAP ohne Zuordnungsliste
 * wird von (1) übersprungen, darf aber nicht spurlos verschwinden. Diese
 * Abfrage weist ihn aus; das UI sagt dann «ein ausgelöster CAP hat keine
 * Zuordnungsliste».
 *
 * Zu (8) — Ergänzung aus Lauf 5: die Bewertungsskala der Zielerreichung,
 * absteigend geordnet (5 → 1). Mit echten Daten hängt die Skala je Ziel
 * (EnpGoalCatalog.evaluationScaleId), nicht global — siehe Delta.
 */
export interface PflegeplanAbfragen {
  diagnoseVorschlaege(caps: CapCode[]): DiagnoseVorschlag[];
  zieleZuDiagnose(code: DiagnoseCode): MitHerkunft<Ziel>[];
  interventionenZuZiel(code: DiagnoseCode, zielId: ZielId): MitHerkunft<Intervention>[];
  detaildialog(interventionId: InterventionId): MitHerkunft<Detaildialog> | null;
  positionFuer(interventionId: InterventionId, detailauswahl: DetailAuswahl): MitHerkunft<Leistungsposition> | null;
  ausgeschlosseneZiele(code: DiagnoseCode): MitHerkunft<Ziel>[];
  unbehandelteCaps(caps: CapCode[]): CapCode[];
  zielBewertungsSkala(): MitHerkunft<BewertungsStufe>[];
}
