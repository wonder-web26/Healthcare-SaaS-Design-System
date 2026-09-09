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

/** Leere Posologie eines Typs — beim Umschalten im Editor. */
export function leerePosologie(typ: PosologieTyp): Posologie {
  if (typ === "#-#-#-#") return { typ, morgen: "0", mittag: "0", abend: "0", nacht: "0" };
  if (typ === "free") return { typ, text: "" };
  if (typ === "reserve") return { typ, bedingung: "", tageshoechstmenge: "", mindestabstandStunden: "" };
  return { typ, rohwert: {} };
}
