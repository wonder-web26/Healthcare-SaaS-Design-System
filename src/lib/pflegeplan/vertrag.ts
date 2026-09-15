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

/* ── Diagnose-Details ───────────────────────────────────────────────────── */
/**
 * Die Leseansicht einer Diagnose: woran man sie erkennt (Bestimmende
 * Merkmale), warum (Beeinflussende Faktoren), wen sie betrifft
 * (Risikopopulation). Ohne diese Listen ist die Definition allein keine
 * Beurteilungsgrundlage.
 *
 * Quellabbildung, die der Adapter leistet:
 * - Die Listen sind gegliedert. ITEM_ART 1 ist Gruppenüberschrift, 3 ist
 *   Item; unbekannte Werte werden als Item behandelt und gemeldet, nicht
 *   verworfen.
 * - Manche Einträge sind selbst Pflegediagnosen. Ihr Code steht
 *   maschinenlesbar in EXT_TAXONOMIE («9» plus NANDA-Code, 00326 → 900326)
 *   — der Adapter liest ihn von dort, nie aus dem Fliesstext des Titels.
 *
 * Kein Ressourcenfeld: R_DLG_ID ist in der gesamten Lieferung 0. Falls
 * Ressourcen je geliefert werden, gehören sie an die Plan-Diagnose,
 * nicht hierher.
 */
export interface MerkmalsEintrag {
  art: "gruppe" | "item";
  text: string;
  /** Nur belegt, wenn der Eintrag selbst eine Pflegediagnose ist. */
  diagnoseCode: DiagnoseCode | null;
}

export type Merkmalsliste = MerkmalsEintrag[];

export interface TaxonomieAchse {
  art: string;
  wert: string;
}

export interface DiagnoseDetails {
  code: DiagnoseCode;
  titel: string;
  typ: DiagnoseTyp;
  definition: string;
  /** z.B. «Gesundheitsmanagement». */
  gebiet: string;
  /** z.B. «Gesundheitsförderung». */
  thema: string;
  /** null = im Katalog nicht belegt — die Ansicht zeigt dann keinen
   *  Abschnitt, keinen leeren Platzhalter. */
  bestimmendeMerkmale: Merkmalsliste | null;
  beeinflussendeFaktoren: Merkmalsliste | null;
  risikofaktoren: Merkmalsliste | null;
  risikopopulation: Merkmalsliste | null;
  assoziierteBedingungen: Merkmalsliste | null;
  achsen: TaxonomieAchse[];
  /** Katalogkennzahlen, keine Planzahlen — abgeleitet aus denselben
   *  Strukturen, die zieleZuDiagnose und positionenZuZiel bedienen,
   *  damit keine zweite Zahlenquelle entsteht. 0 ist eine gültige,
   *  ehrliche Antwort. */
  anzahlPositionen: number;
  anzahlZiele: number;
}

/* ── Ziel ───────────────────────────────────────────────────────────────── */
export interface Ziel {
  id: ZielId;
  titel: string;
}

/* ── Leistungsposition ──────────────────────────────────────────────────── */
/**
 * Seit dem Modellwechsel IST die Massnahme eine Leistungsposition aus dem
 * Spitex-Leistungskatalog — es gibt keine ENP-Interventionsebene und keinen
 * Detaildialog mehr. Varianten («Ganzwäsche im Bett» vs «in Bad/Dusche»)
 * sind eigenständige Positionen und stehen einzeln in der Auswahl.
 */
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

/* ── Qualifikationsleiter ───────────────────────────────────────────────── */
/**
 * Die geordneten Qualifikationsstufen — Grundlage für «zugewiesene
 * Qualifikation über dem Katalogminimum» (WZW-Prüfung, Lauf 6) und für die
 * Auswahlliste des Editors.
 *
 * DIE ORDNUNG IST TEIL DES VERTRAGS: aufsteigend geliefert, Rang 1 ist die
 * niedrigste Stufe. Eine Ordnung, die nur als UI-Konstante lebt, ist bei der
 * ersten Auswertung falsch — derselbe Fund wie bei der Bewertungsskala.
 */
export interface QualifikationsStufe {
  /** 1 = niedrigste Stufe, aufsteigend. */
  rang: number;
  label: string;
}

/* ── Ableitung ──────────────────────────────────────────────────────────── */
/**
 * Die Kette von CAP über Diagnose und Ziel bis zur Position —
 * als Wertobjekt, das später an jeder geplanten Massnahme hängt. Sie ist die
 * Begründungsspur: warum diese Position geplant ist, rückwärts lesbar bis
 * zum Assessment.
 */
export interface Ableitung {
  cap: CapCode;
  diagnoseCode: DiagnoseCode;
  zielId: ZielId;
  positionsNummer: PositionsNummer;
}

/** Die Ableitung als lesbare Zeichenkette, z.B. für Protokolle und Tooltips. */
export function ableitungAlsText(a: Ableitung): string {
  return [a.cap, a.diagnoseCode, a.zielId, a.positionsNummer].join(" → ");
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
 * Zu (3)–(5) — Modellwechsel: die Massnahme IST eine Leistungsposition.
 * (3) liefert die Vorschläge je Diagnose-Ziel-Paar, (4) den ganzen Katalog
 * für die freie Auswahl, (5) die Einzelauflösung per Nummer. Die früheren
 * Abfragen interventionenZuZiel, detaildialog und positionFuer sind damit
 * entfallen — es gibt keine ENP-Interventionsebene und keine planerischen
 * Massnahmen ohne Position mehr.
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
 *
 * Zu (9) — Ergänzung aus Lauf 6: die Qualifikationsleiter, aufsteigend
 * geordnet (Rang 1 = niedrigste). Die echte Quelle sind die
 * Qualifikationsniveaus des Personalstamms und ihre Verknüpfung mit den
 * Tarifstufen — beides liegt nicht vor, deshalb Herkunft mock. Siehe Delta.
 *
 * Zu (10) — Ergänzung aus Lauf 6g: die Detailangaben einer Diagnose zum
 * Lesen. null, wenn der Katalog zu diesem Code keine Detailangaben führt —
 * die Ansicht zeigt dann den Kopf nicht aus anderer Quelle nach, sondern
 * benennt den Zustand. Kennzahlen darin sind Katalogzahlen, keine Planzahlen.
 */
export interface PflegeplanAbfragen {
  diagnoseVorschlaege(caps: CapCode[]): DiagnoseVorschlag[];
  zieleZuDiagnose(code: DiagnoseCode): MitHerkunft<Ziel>[];
  /** Vorschlagsliste je Diagnose-Ziel-Paar — Positionen, die diesem Ziel
   *  dienen. Die Position selbst ist echter Katalog; die ZUORDNUNG ist
   *  kuratierte Fachlichkeit (im Prototyp Mock). */
  positionenZuZiel(code: DiagnoseCode, zielId: ZielId): MitHerkunft<Leistungsposition>[];
  /** Der ganze Leistungskatalog, in Katalogreihenfolge — für die freie
   *  Auswahl jenseits der Vorschläge. */
  leistungsKatalog(): MitHerkunft<Leistungsposition>[];
  /** Einzelauflösung — die Massnahme trägt nur die Nummer. */
  leistungsposition(nummer: PositionsNummer): MitHerkunft<Leistungsposition> | null;
  ausgeschlosseneZiele(code: DiagnoseCode): MitHerkunft<Ziel>[];
  unbehandelteCaps(caps: CapCode[]): CapCode[];
  zielBewertungsSkala(): MitHerkunft<BewertungsStufe>[];
  qualifikationsStufen(): MitHerkunft<QualifikationsStufe>[];
  diagnoseDetails(code: DiagnoseCode): MitHerkunft<DiagnoseDetails> | null;
}
