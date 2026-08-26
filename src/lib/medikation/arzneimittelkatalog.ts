/**
 * Arzneimittelkatalog — PLATZHALTER.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DIESE TABELLE IST EIN PLATZHALTER UND TAUGT NICHT FÜR EINE
 * BEHANDLUNGSENTSCHEIDUNG.
 *
 * Die Werte stammen NICHT aus der Spezialitätenliste des BAG, NICHT aus der
 * Artikeldatenbank der Stiftung refData und NICHT aus dem
 * Arzneimittel-Informations-Publikationssystem. Es sind in der Schweiz
 * gebräuchliche Präparate mit gängigen Stärken, von Hand eingetragen, damit
 * die Auswahl im Prototyp etwas zu wählen hat.
 *
 * Genau ein Eintrag ist belegt: „BELOC ZOK Ret Tabl 25 mg" stammt als
 * Beispiel aus der Umsetzungshilfe „Einführung Medikationsplan im EPD",
 * eHealth Suisse und IPAG, 28.2.2022.
 *
 * Vor produktiver Nutzung wird die Quelle ausgetauscht — gegen eine
 * gelieferte Tabelle oder gegen eine Anbindung an eine der drei genannten
 * Quellen.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * DIE TABELLE WIRD NICHT EXPORTIERT. Ausserhalb dieser Datei ist der Katalog
 * ausschliesslich über `katalogSuche` und `katalogEintrag` erreichbar — das
 * ist die Grenze, an der die Quelle getauscht wird. Wer die Tabelle direkt
 * läse, müsste beim Tausch mitgeändert werden; wer die zwei Funktionen ruft,
 * merkt ihn nicht.
 *
 * AUS DEMSELBEN GRUND GIBT ES KEINE SCHREIBFUNKTION. Der Katalog ist im
 * Prototyp nicht bearbeitbar und nicht löschbar — eine Medikation kann darum
 * nie auf einen Eintrag zeigen, den jemand entfernt hat.
 */

export interface Arzneimittel {
  /** AM-NNNN */
  id: string;
  produktename: string;
  wirkstoff: string;
  /** Code aus DARREICHUNGSFORM. */
  darreichungsform: string;
  /** Wirkstoffmenge pro Einheit, als Text mit Einheit. */
  wirkstoffmenge: string;
  /**
   * Ob das Präparat im Handel ist. Ein ausser Handel gefallenes Präparat
   * bleibt im Katalog, weil bestehende Medikationen darauf zeigen — es
   * verschwinden zu lassen hiesse, ihre Angaben zu verlieren.
   */
  verfuegbar: boolean;
}

const KATALOG: Arzneimittel[] = [
  { id: "AM-0001", produktename: "BELOC ZOK Ret Tabl 25 mg", wirkstoff: "Metoprolol", darreichungsform: "retardtablette", wirkstoffmenge: "25 mg", verfuegbar: true },
  { id: "AM-0002", produktename: "LISINOPRIL Sandoz Tabl 10 mg", wirkstoff: "Lisinopril", darreichungsform: "tablette", wirkstoffmenge: "10 mg", verfuegbar: true },
  { id: "AM-0003", produktename: "AMLODIPIN Mepha Tabl 5 mg", wirkstoff: "Amlodipin", darreichungsform: "tablette", wirkstoffmenge: "5 mg", verfuegbar: true },
  { id: "AM-0004", produktename: "TORASEMID Helvepharm Tabl 10 mg", wirkstoff: "Torasemid", darreichungsform: "tablette", wirkstoffmenge: "10 mg", verfuegbar: true },
  { id: "AM-0005", produktename: "METFIN Filmtabl 500 mg", wirkstoff: "Metformin", darreichungsform: "tablette", wirkstoffmenge: "500 mg", verfuegbar: true },
  { id: "AM-0006", produktename: "LANTUS SoloStar Inj Lös 100 E/ml", wirkstoff: "Insulin glargin", darreichungsform: "injektionsloesung", wirkstoffmenge: "100 E/ml", verfuegbar: true },
  { id: "AM-0007", produktename: "DAFALGAN Filmtabl 1 g", wirkstoff: "Paracetamol", darreichungsform: "tablette", wirkstoffmenge: "1 g", verfuegbar: true },
  { id: "AM-0008", produktename: "NOVALGIN Tropfen 500 mg/ml", wirkstoff: "Metamizol", darreichungsform: "tropfen", wirkstoffmenge: "500 mg/ml", verfuegbar: true },
  { id: "AM-0009", produktename: "XARELTO Filmtabl 20 mg", wirkstoff: "Rivaroxaban", darreichungsform: "tablette", wirkstoffmenge: "20 mg", verfuegbar: true },
  { id: "AM-0010", produktename: "ASPIRIN CARDIO Filmtabl 100 mg", wirkstoff: "Acetylsalicylsäure", darreichungsform: "tablette", wirkstoffmenge: "100 mg", verfuegbar: true },
  { id: "AM-0011", produktename: "PANTOZOL Filmtabl 40 mg", wirkstoff: "Pantoprazol", darreichungsform: "tablette", wirkstoffmenge: "40 mg", verfuegbar: true },
  { id: "AM-0012", produktename: "LAXOBERON Tropfen 7.5 mg/ml", wirkstoff: "Natriumpicosulfat", darreichungsform: "tropfen", wirkstoffmenge: "7.5 mg/ml", verfuegbar: true },
  /* Ausser Handel: Ranitidin wurde 2020 vom Markt zurückgezogen. Der Eintrag
     steht hier, weil bestehende Medikationen auf ausser Handel gefallene
     Präparate zeigen können und die Ansicht das kennzeichnen muss. */
  { id: "AM-0013", produktename: "ZANTIC Filmtabl 150 mg", wirkstoff: "Ranitidin", darreichungsform: "tablette", wirkstoffmenge: "150 mg", verfuegbar: false },
];

/** Wie viele Einträge der Platzhalter hat — für den Hinweis in der Auswahl. */
export const KATALOG_UMFANG = KATALOG.length;

/**
 * Suche über Produktename und Wirkstoff.
 *
 * Leerer Text gibt den ganzen Katalog zurück; bei dreizehn Einträgen ist das
 * die brauchbarste Antwort. Bei einer echten Quelle wird hier begrenzt.
 */
export function katalogSuche(text: string): Arzneimittel[] {
  const q = text.trim().toLowerCase();
  if (q === "") return [...KATALOG];
  return KATALOG.filter(a =>
    `${a.produktename} ${a.wirkstoff}`.toLowerCase().includes(q));
}

/** Ein Eintrag über seine Kennung; undefined, wenn die Quelle ihn nicht kennt. */
export function katalogEintrag(id: string): Arzneimittel | undefined {
  return KATALOG.find(a => a.id === id);
}
