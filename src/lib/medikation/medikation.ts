/**
 * Medikation bei Eintritt — Typen und Regeln.
 *
 * Der Reiter «Medikamente» ist ein ERFASSUNGS- UND ABGLEICHWERKZEUG, kein
 * Betriebswerkzeug. Er beantwortet drei Fragen: Was nimmt diese Klientin bei
 * Eintritt ein, woher stammt die Angabe, und wer hat sie geprueft.
 * Verabreichungsansichten, Gaben-Dokumentation und Medikationspruefung sind
 * eigene, spaetere Module und hier ausdruecklich nicht abgebildet.
 *
 * Fachlicher Bezugsrahmen: eMediplan / CHMED (IG eMediplan) als Struktur- und
 * Darstellungskonvention, damit ein spaeterer Export ohne Umbau moeglich bleibt.
 *
 * ZWEI ACHSEN, WIE BEI DEN ALLERGIEN. `status` ist der klinische Lebenszyklus
 * und traegt die Werte des Schemas (Medication.status). `pruefstatus` ist eine
 * ZWEITE, davon unabhaengige Achse: hat eine Fachperson die Angabe geprueft.
 * Beide nie zusammenziehen — eine laufende Medikation kann ungeprueft sein,
 * eine gestoppte kann geprueft sein.
 *
 * SCHEMABEZUG: Feldnamen und Wertemengen stammen, wo vorhanden, woertlich aus
 * `docs/Spit Full.dbml`, Table `Medication`. Alles Uebrige ist eine
 * Prototyp-Ergaenzung und in `docs/schema-delta-medikation.md` aufgefuehrt.
 */

/**
 * Posologie-Typ — die acht Werte aus `Medication.scheduleType`, WOERTLICH:
 * '#-#-#-# | single | periodic | day_plan | week_plan | free | rate | reserve'.
 *
 * Die Oberflaeche bedient in V1 nur `#-#-#-#`, `free` und `reserve`; die
 * uebrigen fuenf sind hier mitgefuehrt, damit spaeter kein Datenbestand
 * migriert werden muss. Deutsche Beschriftungen ausschliesslich an der
 * Oberflaeche (POSOLOGIE_LABEL), nie im gespeicherten Wert.
 *
 * TODO: Vor einem eMediplan-/CH-EMED-Export ist die Abbildung dieser Werte auf
 * die CHMED-Spezifikation zu verifizieren. Hier werden keine CHMED-Feldnamen
 * erfunden.
 */
export type PosologieTyp =
  | "#-#-#-#" | "single" | "periodic" | "day_plan" | "week_plan" | "free" | "rate" | "reserve";

/** Die drei Typen, die die Oberflaeche in V1 bedient. */
export const POSOLOGIE_TYPEN_V1: PosologieTyp[] = ["#-#-#-#", "free", "reserve"];

export const POSOLOGIE_LABEL: Record<PosologieTyp, string> = {
  "#-#-#-#": "Blockschema",
  free: "Freitext",
  reserve: "Reserve",
  single: "Einzelgabe",
  periodic: "Periodisch",
  day_plan: "Tagesplan",
  week_plan: "Wochenplan",
  rate: "Rate",
};

/**
 * Inhalt von `Medication.schedule` (json) — die Form folgt dem Typ, so wie es
 * die Schema-Notiz verlangt («dose per slot; shape follows scheduleType»).
 * Der letzte Arm haelt die fuenf noch nicht bedienten Typen darstellbar.
 */
export type Posologie =
  | { typ: "#-#-#-#"; morgen: string; mittag: string; abend: string; nacht: string }
  | { typ: "free"; text: string }
  | { typ: "reserve"; bedingung: string; tageshoechstmenge: string; mindestabstandStunden: string }
  | { typ: "single" | "periodic" | "day_plan" | "week_plan" | "rate"; rohwert: Record<string, string> };

/** Klinischer Lebenszyklus — Werte woertlich aus `Medication.status`. */
export type KlinischerStatus =
  | "active" | "on_hold" | "stopped" | "completed" | "cancelled" | "entered_in_error";

/** Pruefachse — Prototyp-Ergaenzung, siehe Schema-Delta. */
export type Pruefstatus = "bestaetigt" | "zu_pruefen" | "unbestaetigt";

/** Herkunft der Angabe — Prototyp-Ergaenzung. In V1 entsteht nur `manuell`. */
export type Quelle = "qr" | "foto" | "manuell";

export const QUELLE_LABEL: Record<Quelle, string> = {
  qr: "eMediplan-QR",
  foto: "Papierliste",
  manuell: "Manuell",
};

/** Gruppen der Liste — abgeleitet, kein gespeichertes Feld. */
export type Gruppe = "fix" | "reserve" | "selbst";

export const GRUPPE_LABEL: Record<Gruppe, string> = {
  fix: "Fixmedikation",
  reserve: "Reservemedikation",
  selbst: "Selbstmedikation",
};

export interface Medikationsposition {
  id: string;
  patientId: string;

  /* ── Felder mit Entsprechung in Table Medication ────────────────────────── */
  /** `productCode` — Compendium / GTIN; null bei freitextlicher Erfassung. */
  productCode: string | null;
  /** `productName` — Handelsname. Stärke und Form stehen getrennt, siehe Delta. */
  productName: string;
  /** `route` — Applikationsart, Werte aus der Schema-Notiz (p.o., topical …). */
  route: string;
  /** `baseUnit` — Einheit, Werte aus der Schema-Notiz (Tabl, Btl, Pfl, Tr …). */
  baseUnit: string;
  /** `scheduleType` + `schedule` in einem typisierten Objekt. */
  posologie: Posologie;
  /** `startDate` — ISO. */
  startDate: string;
  /** `endDate` — ISO; null heisst offen («bis auf Weiteres»). */
  endDate: string | null;
  /** `instructions` — Anwendungsanweisung. */
  instructions: string;
  /** `reserveIndication` — nur bei Posologie `reserve` belegt. */
  reserveIndication: string;
  /** `status` — klinischer Lebenszyklus, hier unangetastet. */
  status: KlinischerStatus;
  /**
   * `approvedByContactId` — der Verordner. Im Schema `[not null]`, hier
   * OPTIONAL: eine Klientin bringt Medikamente mit, deren Verordner beim
   * Eintritt niemand kennt. Siehe Schema-Delta, Punkt 1.
   */
  approvedByContactId: string | null;

  /* ── Prototyp-Ergaenzungen (alle im Schema-Delta aufgefuehrt) ───────────── */
  /** Ausdrueckliche Aussage «Verordner zurzeit unbekannt» — nicht dasselbe
   *  wie «noch nicht erfasst». Setzt den Pruefstatus auf `unbestaetigt`. */
  verordnerUnbekannt: boolean;
  pruefstatus: Pruefstatus;
  quelle: Quelle;
  /** ISO — wann die Angabe in dieses System kam. */
  quelleAm: string;
  /** Freier Herkunftsvermerk, z. B. «Angabe des Ehemanns, Präparat nicht gesichtet». */
  herkunftsvermerk: string;
  /** Selbstmedikation hat definitionsgemaess keinen Verordner. */
  selbstmedikation: boolean;
  /** Grund der Anwendung. */
  behandlungsgrund: string;
  /** Stärke und Darreichungsform — im Schema Teil von `productName`. */
  staerke: string;
  darreichungsform: string;
  /** Uebersteuern der aus den Stammdaten vorbefuellten Angaben wird protokolliert. */
  uebersteuert: boolean;
  uebersteuerungVermerk: string;
  /** Erfasser — `createdBy`-Konvention des Schemas (Kopfzeile der dbml). */
  erfasstDurchUserId: string;
  erfasstVonName: string;
  /** Bestaetiger — wer fachlich geprueft hat. Nie dieselbe Frage wie Erfasser. */
  bestaetigtDurchUserId: string | null;
  bestaetigtVonName: string | null;
  erstelltAm: string;
  geaendertAm: string;
}

/**
 * Erhebungszustand je Patient.
 *
 * `keineMedikamente` ist die GEPRUEFTE ABWESENHEIT — analog
 * `Patient.noKnownAllergies` («a CHECKED absence, which is not the same as no
 * allergy rows»). Sie wird nie als leere Liste modelliert: eine leere Liste
 * heisst «noch nichts erfasst», die Negativ-Aussage heisst «es gibt keine».
 */
export interface MedikationsErhebung {
  patientId: string;
  keineMedikamente: boolean;
  /** Bestaetigung der GESAMTLISTE (auch der leeren, negativen). ISO. */
  bestaetigtAm: string | null;
  bestaetigtVonName: string | null;
  bestaetigtVonQualifikation: string | null;
}

/* ── Regeln ──────────────────────────────────────────────────────────────── */

/** Gruppe einer Position — abgeleitet, nicht gespeichert. */
export function gruppeVon(p: Medikationsposition): Gruppe {
  if (p.selbstmedikation) return "selbst";
  if (p.posologie.typ === "reserve") return "reserve";
  return "fix";
}

/** Blockiert diese Position den Sign-off der Gesamtliste? */
export function blockiertSignOff(p: Medikationsposition): boolean {
  return p.pruefstatus !== "bestaetigt";
}

/** Anzahl blockierender Positionen — Grundlage des Zaehlers an der Leiste. */
export function blockierendeAnzahl(positionen: Medikationsposition[]): number {
  return positionen.filter(blockiertSignOff).length;
}

/**
 * Dosierung als Text fuer die Listenspalte. Das Blockschema erscheint in der
 * schweizerischen Morgen-Mittag-Abend-Nacht-Schreibweise.
 */
export function dosierungText(p: Posologie): string {
  switch (p.typ) {
    case "#-#-#-#": return `${p.morgen}-${p.mittag}-${p.abend}-${p.nacht}`;
    case "free": return p.text;
    case "reserve": {
      const teile = [p.bedingung];
      if (p.tageshoechstmenge) teile.push(`max. ${p.tageshoechstmenge}/Tag`);
      if (p.mindestabstandStunden) teile.push(`Abstand ≥ ${p.mindestabstandStunden} h`);
      return teile.filter(Boolean).join(" · ");
    }
    default: return POSOLOGIE_LABEL[p.typ];
  }
}

/* ── Medikationsprüfung ──────────────────────────────────────────────────── */

/**
 * DIE PRUEFUNG IST NICHT UNSERE AUSSAGE. Sie kommt von einem externen,
 * CE-zertifizierten Prüfdienst; wir zeigen sein Ergebnis an und entscheiden
 * nichts. Darum: kein eigener Schweregrad, keine eigene Ampel, keine
 * Umrechnung fremder Skalen und keine Kürzung des Befundtexts. Was der
 * Anbieter schreibt, steht da — die Entscheidung trifft die Fachperson.
 */
export type Pruefart = "wechselwirkungen" | "doppelmedikation" | "allergien" | "kontraindikationen";

export const PRUEFART_LABEL: Record<Pruefart, string> = {
  wechselwirkungen: "Wechselwirkungen",
  doppelmedikation: "Doppelmedikation",
  allergien: "Allergien",
  kontraindikationen: "Kontraindikationen",
};

/** Etikett eines einzelnen Befunds — Einzahl, im Gegensatz zur Reiterbeschriftung. */
export const PRUEFART_ETIKETT: Record<Pruefart, string> = {
  wechselwirkungen: "Wechselwirkung",
  doppelmedikation: "Doppelmedikation",
  allergien: "Allergie",
  kontraindikationen: "Kontraindikation",
};

export type PruefartZustand = "geprueft_ohne_befund" | "geprueft_mit_befund" | "nicht_geprueft";

/**
 * Wirkstoffe mit Menge — ABGELEITET, nicht gespeichert.
 *
 * Der Katalog führt heute den Wirkstoff als Text («Valsartan,
 * Hydrochlorothiazid») und die Stärke als Text («80/12.5 mg»). Beide gehören
 * zusammen, sind aber getrennt erfasst; hier werden sie gepaart, damit eine
 * Doppelung sichtbar wird, ohne einen Befund zu öffnen.
 *
 * Gepaart wird NUR, wenn die Zahl der Stärkenteile zur Zahl der Wirkstoffe
 * passt. «25 mcg/h» ist eine Rate und kein Paar — dort bliebe eine Aufteilung
 * falsch, also unterbleibt sie und die Stärke steht als Ganzes.
 *
 * Die Documedis-Stammdaten liefern das später strukturiert; dann ersetzt ein
 * Feld diese Ableitung. Bis dahin wird der Katalog dafür NICHT umgebaut.
 */
export function wirkstoffeMitMenge(wirkstoff: string, staerke: string): string[] {
  const stoffe = wirkstoff.split(",").map(s => s.trim()).filter(Boolean);
  if (stoffe.length === 0) return [];
  const teile = staerke.split("/").map(s => s.trim()).filter(Boolean);
  if (stoffe.length > 1 && teile.length === stoffe.length) {
    // Die Einheit steht nur am letzten Teil («500 mg/800 IE» → beide behalten ihre).
    return stoffe.map((s, i) => `${s} ${teile[i]}`.trim());
  }
  return stoffe.map(s => `${s} ${staerke}`.trim());
}

/**
 * Ergebnis einer Prüfart — IMMER mit Abdeckung. Ein Ergebnis ohne die Angabe,
 * wie viele Positionen tatsächlich geprüft wurden, ist wertlos: «kein Befund»
 * bei null geprüften Positionen liest sich sonst wie Entwarnung.
 */
export interface PruefartErgebnis {
  art: Pruefart;
  zustand: PruefartZustand;
  geprueftePositionen: number;
  gesamtPositionen: number;
  /** Nur bei `nicht_geprueft`: warum nicht. */
  grund: string | null;
  /** Wo der fehlende Wert erfasst würde — null, wenn es dafür keinen Weg gibt. */
  wegText: string | null;
  /** Was geprüft wurde und wogegen — steht auf Reitern ohne Befund, damit dort
   *  keine leere Fläche entsteht. Der Anbieter weiss das, nicht die Oberfläche. */
  umfangText: string;
}

export type BefundZustand = "offen" | "zur_kenntnis_genommen" | "uebersteuert";

export const BEFUNDZUSTAND_LABEL: Record<BefundZustand, string> = {
  offen: "Offen",
  zur_kenntnis_genommen: "Zur Kenntnis genommen",
  uebersteuert: "Übersteuert",
};

/** Schweregrad im Format des Anbieters — Wert, Skalenmaximum, seine Bezeichnung. */
export interface Schweregrad {
  wert: number;
  maximum: number;
  bezeichnung: string;
  /** Name der Skala des Anbieters, damit die Zahl einordenbar bleibt. */
  skala: string;
}

export interface Befund {
  id: string;
  art: Pruefart;
  /** Betroffene Positionen; bei Wechselwirkungen mindestens zwei. */
  positionIds: string[];
  schweregrad: Schweregrad;
  /** Wortlaut des Anbieters — wird unverändert ausgegeben. */
  text: string;
  quelle: string;
  regelstand: string;
  /** ISO */
  geprueftAm: string;
}

/** Bearbeitung eines Befunds — unsere Achse, nicht die des Anbieters. */
export interface BefundBearbeitung {
  zustand: BefundZustand;
  vonName: string | null;
  /** ISO */
  am: string | null;
  /** Pflicht beim Übersteuern. */
  begruendung: string | null;
}

export interface Pruefergebnis {
  /** false = kein Prüfdienst konfiguriert. Dann gibt es kein Ergebnis, kein
   *  Häkchen und keine Zusammenfassung — nur den Klartext dazu. */
  anbieterAktiv: boolean;
  anbieterName: string;
  /** ISO */
  geprueftAm: string;
  arten: PruefartErgebnis[];
  befunde: Befund[];
}

/** Gesamtzustand der Prüfleiste — abgeleitet, nie gespeichert. */
export type PruefGesamtzustand = "nicht_aktiv" | "befunde" | "teilweise_geprueft" | "ohne_befund";

export function pruefGesamtzustand(e: Pruefergebnis): PruefGesamtzustand {
  if (!e.anbieterAktiv) return "nicht_aktiv";
  if (e.befunde.length > 0) return "befunde";
  if (e.arten.some(a => a.zustand === "nicht_geprueft")) return "teilweise_geprueft";
  return "ohne_befund";
}

/** Abdeckung einer Prüfart im Klartext — nie eine blosse Zahl. */
export function abdeckungText(a: PruefartErgebnis): string {
  if (a.zustand === "nicht_geprueft") return "nicht geprüft";
  const basis = `${a.geprueftePositionen} von ${a.gesamtPositionen} Positionen geprüft`;
  return a.zustand === "geprueft_ohne_befund" ? `${basis}, kein Befund` : basis;
}

/* ── Ableitung für die Vorschauen (Tag und Woche) ────────────────────────── */

/**
 * Die vier Verordnungsblöcke des schweizerischen Morgen-Mittag-Abend-Nacht-
 * Schemas. SIE SIND KEINE UHRZEITEN. Wann eine Gabe tatsächlich erfolgt,
 * entscheidet die Verabreichung nach dem Onboarding — hier steht nur, was
 * verordnet ist. Eine Abbildung Block → Uhrzeit gibt es bewusst nicht.
 */
export type Block = "morgen" | "mittag" | "abend" | "nacht";

export const BLOECKE: Block[] = ["morgen", "mittag", "abend", "nacht"];

export const BLOCK_LABEL: Record<Block, string> = {
  morgen: "Morgen", mittag: "Mittag", abend: "Abend", nacht: "Nacht",
};

/**
 * Gaben je Block — die eine Ableitung, die beide Vorschauen nutzen.
 * Rein: kein Zustand, keine Seiteneffekte, kein Datumsbezug.
 *
 * `null` heisst «kein tägliches Blockschema» — Reserve und alle nicht-täglichen
 * Typen. Sie gehören damit in die eigenen Abschnitte der Tagesvorschau, nicht
 * in einen Block.
 */
export function blockGaben(p: Posologie): Record<Block, string> | null {
  if (p.typ !== "#-#-#-#") return null;
  return { morgen: p.morgen, mittag: p.mittag, abend: p.abend, nacht: p.nacht };
}

/** Trägt dieser Blockwert eine Gabe? "0", "" und Unlesbares zählen nicht. */
export function istGabe(wert: string): boolean {
  const n = Number(String(wert).replace(",", "."));
  return Number.isFinite(n) && n > 0;
}

/** Leere Posologie eines Typs — beim Umschalten im Editor. */
export function leerePosologie(typ: PosologieTyp): Posologie {
  if (typ === "#-#-#-#") return { typ, morgen: "0", mittag: "0", abend: "0", nacht: "0" };
  if (typ === "free") return { typ, text: "" };
  if (typ === "reserve") return { typ, bedingung: "", tageshoechstmenge: "", mindestabstandStunden: "" };
  return { typ, rohwert: {} };
}
