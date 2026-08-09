/**
 * SP-21 / SP-22 / PA-07: Dokumenttyp-Katalog — zentrale, pflegbare Stammdaten.
 *
 * Erweiterbar: neuer Eintrag = neues Array-Element, keine Code-Änderung.
 * Sichtbarkeit wird regelbasiert aus dem Vorgangszustand abgeleitet.
 * Status "vollständig" wird live berechnet, nicht roh gespeichert.
 */

export type DokumentBedingung =
  | "IMMER"
  | "PARTNER_ERFORDERLICH"
  | "HAT_KINDER"
  | "KINDERZULAGEN_UEBER_SPITEX"
  | "UNTERHALTSPFLICHT"
  | "ZERTIFIKAT_DEUTSCH_VORHANDEN"
  | "SRK_ZERTIFIKAT_VORHANDEN"
  | "ASSISTENZBEITRAG_JA"
  | "NIE_IN_DOKUMENTE";

export type DokumentModus = "upload" | "unterschrift";
export type DokumentEntitaet = "angehoeriger" | "patient";

export interface DokumentTypDefinition {
  code: string;
  label: string;
  kategorie: string;
  beidseitig: boolean;
  pflicht: boolean;
  sichtbarWenn: DokumentBedingung;
  /** upload = Scan-Upload, unterschrift = kein Upload, Status offen/unterschrieben */
  modus: DokumentModus;
  /** true = beliebig viele Uploads mit freiem Label (Sammelbehälter) */
  mehrfach: boolean;
  entitaet: DokumentEntitaet;
  /**
   * Gültigkeitsdauer in Monaten ab Ausstellung; null = läuft nicht ab.
   *
   * Nur setzen, wo die Frist belegt ist. Beim SRK-Zertifikat etwa gilt eine
   * Frist von zwölf Monaten ab Anstellung — das ist die Frist für den
   * ERWERB des Zertifikats, nicht für seinen Ablauf. Sie hier einzutragen,
   * liesse ein gültiges Zertifikat nach einem Jahr als abgelaufen
   * erscheinen.
   *
   * Wo keine Dauer steht, gibt es kein „abgelaufen" — und keine Behauptung
   * darüber.
   */
  gueltigkeitMonate: number | null;
}

/* ══════════════════════════════════════════
   SEED: Angehörigen-Dokumente
   ══════════════════════════════════════════ */

export const DOKUMENT_TYPEN: DokumentTypDefinition[] = [
  // Angehöriger — IMMER
  { code: "ausweis_id", label: "Ausweis / ID", kategorie: "Identität", beidseitig: true, pflicht: true, sichtbarWenn: "IMMER", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  { code: "krankenkassenkarte", label: "Krankenkassenkarte", kategorie: "Identität", beidseitig: false, pflicht: true, sichtbarWenn: "IMMER", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  { code: "bankkarte", label: "Bankkarte / IBAN-Nachweis", kategorie: "Finanzen", beidseitig: false, pflicht: true, sichtbarWenn: "IMMER", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  // Angehöriger — NIE_IN_DOKUMENTE (nur im Spezialbewilligungs-Schritt)
  { code: "spezialbewilligung_b", label: "Spezialbewilligung B", kategorie: "Bewilligung", beidseitig: false, pflicht: true, sichtbarWenn: "NIE_IN_DOKUMENTE", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  // Angehöriger — bedingt
  { code: "partner_ausweis", label: "Ausweis Partner", kategorie: "Partner", beidseitig: true, pflicht: true, sichtbarWenn: "PARTNER_ERFORDERLICH", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  { code: "familienbuechlein", label: "Familienbüchlein", kategorie: "Kinder", beidseitig: false, pflicht: false, sichtbarWenn: "UNTERHALTSPFLICHT", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  { code: "sprachzertifikat_deutsch", label: "Sprachzertifikat Deutsch", kategorie: "Qualifikation", beidseitig: false, pflicht: false, sichtbarWenn: "ZERTIFIKAT_DEUTSCH_VORHANDEN", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },
  { code: "srk_zertifikat", label: "SRK-Pflegehelfer-Zertifikat", kategorie: "Qualifikation", beidseitig: false, pflicht: true, sichtbarWenn: "SRK_ZERTIFIKAT_VORHANDEN", modus: "upload", mehrfach: false, entitaet: "angehoeriger", gueltigkeitMonate: null },

  /* ══════════════════════════════════════════
     SEED: Patienten-Dokumente (PA-07)
     ══════════════════════════════════════════ */
  { code: "patient_ausweis_id", label: "Ausweis / ID", kategorie: "Identität", beidseitig: true, pflicht: true, sichtbarWenn: "IMMER", modus: "upload", mehrfach: false, entitaet: "patient", gueltigkeitMonate: null },
  { code: "patient_kk_karte", label: "Krankenkassenkarte", kategorie: "Identität", beidseitig: true, pflicht: true, sichtbarWenn: "IMMER", modus: "upload", mehrfach: false, entitaet: "patient", gueltigkeitMonate: null },
  { code: "patient_einwilligung", label: "Einwilligungserklärung", kategorie: "Vertrag", beidseitig: false, pflicht: true, sichtbarWenn: "IMMER", modus: "unterschrift", mehrfach: false, entitaet: "patient", gueltigkeitMonate: null },
  { code: "patient_sonstige", label: "Sonstige Dokumente", kategorie: "Sonstiges", beidseitig: false, pflicht: false, sichtbarWenn: "IMMER", modus: "upload", mehrfach: true, entitaet: "patient", gueltigkeitMonate: null },
];

/* ══════════════════════════════════════════
   ARCHIV: Entfernte Patienten-Dokumenttypen
   (Append-only / SP-22 — nicht hart gelöscht)
   ══════════════════════════════════════════ */
// { code: "iv_verfuegung_assistenzbeitrag", label: "IV-Verfügung Assistenzbeitrag", kategorie: "Leistungsnachweis", beidseitig: false, pflicht: true, sichtbarWenn: "ASSISTENZBEITRAG_JA", modus: "upload", mehrfach: false, entitaet: "patient", gueltigkeitMonate: null },

/* ══════════════════════════════════════════
   ORDNER
   ══════════════════════════════════════════ */

/**
 * Die Ordnerstruktur der Ablage — abgeleitet aus `kategorie`, nicht daneben
 * gepflegt.
 *
 * Sie ist eine Organisationsvorgabe, kein Ablagebelieben: es gibt genau die
 * Ordner, für die es Dokumenttypen gibt, und keine frei anlegbaren. Zwei
 * Listen von Ordnern liefen auseinander, sobald ein Typ dazukommt.
 *
 * Die Reihenfolge folgt dem Weg durch das Dossier: wer jemand ist, was er
 * unterschrieben hat, was er kann, was daran hängt.
 */
export const ORDNER_REIHENFOLGE = [
  "Identität", "Vertrag", "Qualifikation", "Finanzen",
  "Partner", "Kinder", "Bewilligung", "Sonstiges",
];

/** Ordner eines Dokumenttyps. */
export function ordnerVon(code: string): string {
  return DOKUMENT_TYPEN.find(t => t.code === code)?.kategorie ?? "Sonstiges";
}

/** Die Ordner einer Personenart, in fester Reihenfolge. */
export function ordnerFuer(entitaet: DokumentEntitaet): string[] {
  const vorhanden = new Set(DOKUMENT_TYPEN
    .filter(t => t.entitaet === entitaet && t.sichtbarWenn !== "NIE_IN_DOKUMENTE")
    .map(t => t.kategorie));
  return ORDNER_REIHENFOLGE.filter(o => vorhanden.has(o));
}

/** Ein Dokumenttyp, oder null. */
export function dokumenttyp(code: string): DokumentTypDefinition | null {
  return DOKUMENT_TYPEN.find(t => t.code === code) ?? null;
}

/* ══════════════════════════════════════════
   KONTEXT + FILTER
   ══════════════════════════════════════════ */

export interface DokumentKontext {
  partnerErforderlich: boolean;
  hatKinder: boolean;
  kinderzulagenUeberSpitex: boolean;
  unterhaltspflicht: boolean;
  zertifikatDeutschVorhanden: boolean;
  srkZertifikatVorhanden: boolean;
  assistenzbeitragJa: boolean;
}

function istBedingungErfuellt(bedingung: DokumentBedingung, kontext: DokumentKontext): boolean {
  switch (bedingung) {
    case "IMMER": return true;
    case "NIE_IN_DOKUMENTE": return false;
    case "PARTNER_ERFORDERLICH": return kontext.partnerErforderlich;
    case "HAT_KINDER": return kontext.hatKinder;
    case "KINDERZULAGEN_UEBER_SPITEX": return kontext.kinderzulagenUeberSpitex;
    case "UNTERHALTSPFLICHT": return kontext.unterhaltspflicht;
    case "ZERTIFIKAT_DEUTSCH_VORHANDEN": return kontext.zertifikatDeutschVorhanden;
    case "SRK_ZERTIFIKAT_VORHANDEN": return kontext.srkZertifikatVorhanden;
    case "ASSISTENZBEITRAG_JA": return kontext.assistenzbeitragJa;
    default: return false;
  }
}

/** Sichtbare Dokumenttypen für eine Entität */
export function sichtbareDokumenttypen(kontext: DokumentKontext, entitaet?: DokumentEntitaet): DokumentTypDefinition[] {
  return DOKUMENT_TYPEN.filter(d => {
    if (entitaet && d.entitaet !== entitaet) return false;
    return istBedingungErfuellt(d.sichtbarWenn, kontext);
  });
}

/* ══════════════════════════════════════════
   VOLLSTÄNDIGKEIT + ZÄHLER
   ══════════════════════════════════════════ */

/**
 * Prüft ob ein Dokument vollständig ist.
 * - modus=upload + beidseitig: beide Seiten nötig
 * - modus=upload + einseitig: ein Scan nötig
 * - modus=unterschrift: scans[code] === "unterschrieben"
 * - mehrfach: nie als "offen" gezählt (optional)
 */
export function istDokumentVollstaendig(
  typ: DokumentTypDefinition,
  scans: Record<string, unknown>,
): boolean {
  if (typ.mehrfach) return true; // Sammelbehälter ist nie "offen"
  if (typ.modus === "unterschrift") {
    return scans[typ.code] === "unterschrieben";
  }
  if (typ.beidseitig) {
    return !!scans[`${typ.code}_vorne`] && !!scans[`${typ.code}_hinten`];
  }
  return !!scans[typ.code];
}

/* zaehleOffenePflichtdokumente entfernt — war exportiert aber nirgends aufgerufen.
   Logik lebt direkt in den Verwendungsstellen über sichtbareDokumenttypen + istDokumentVollstaendig. */
