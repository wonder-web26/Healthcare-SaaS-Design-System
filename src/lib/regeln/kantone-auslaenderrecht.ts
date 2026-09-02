/**
 * Kantonstabelle der ausländerrechtlichen Prüfung — Abschnitt 5 des
 * Regelwerks (docs/auslaenderrecht/Regelwerk_Auslaenderrecht_DE.md).
 *
 * Sechs Kantone. Je Regime die zuständige Stelle, dazu der Meldekanal. Der
 * massgebende Kanton ist der des Arbeitsorts (Einsatzort der Angehörigen), nicht
 * der Sitz der Organisation. Ist der Kanton nicht in der Tabelle, bleiben
 * `zustaendigeStelle` und `meldekanal` null und es erscheint der Hinweis
 * `kanton_unbekannt`.
 *
 * Die Behördennamen sind Daten aus dem Regelwerk, keine Anzeigetexte im Sinne
 * von Abschnitt 6.
 */
import type { Regime, Sicherheit } from "./auslaenderrecht";

interface KantonRegelung {
  /** Zuständige Stelle für Regime bewilligung (Drittstaat, nicht Ausweis N). */
  bewilligungDrittstaat: string;
  /** Zuständige Stelle für Regime meldung. */
  meldung: string;
  /** Zuständige Stelle für Regime bewilligung bei Ausweis N. */
  bewilligungN: string;
}

const KANTONE_AR: Record<string, KantonRegelung> = {
  ZH: {
    bewilligungDrittstaat: "Amt für Wirtschaft (AWI), danach SEM, danach Migrationsamt",
    meldung: "Amt für Wirtschaft (AWI)",
    bewilligungN: "kantonale Stellen im Asylbereich",
  },
  BE: {
    bewilligungDrittstaat: "Migrationsdienst (MIDI)",
    meldung: "Migrationsdienst (MIDI)",
    bewilligungN: "Migrationsdienst, mit RAV-Bestätigung",
  },
  AG: {
    bewilligungDrittstaat: "Amt für Migration und Integration (MIKA)",
    meldung: "Amt für Migration und Integration (MIKA)",
    bewilligungN: "Amt für Migration und Integration (MIKA)",
  },
  BS: {
    bewilligungDrittstaat: "Amt für Wirtschaft und Arbeit (AWA)",
    meldung: "Amt für Wirtschaft und Arbeit (AWA)",
    bewilligungN: "AWA und Migrationsamt",
  },
  BL: {
    bewilligungDrittstaat: "KIGA Baselland, danach SEM, danach Migrationsamt",
    meldung: "KIGA Baselland oder Amt für Migration",
    bewilligungN: "Amt für Migration",
  },
  SO: {
    bewilligungDrittstaat: "Migrationsamt, Departement des Innern",
    meldung: "Migrationsamt",
    bewilligungN: "Migrationsamt",
  },
};

/**
 * Meldekanal für das Regime meldung — in allen Kantonen EasyGov als bevorzugter
 * Kanal (alternativ das kantonale Formular). Der Online-Schalter des Bundes wählt
 * die zuständige Behörde anhand des Arbeitsorts.
 */
export const MELDEKANAL = "EasyGov";

/** Ist der Kanton in der Tabelle hinterlegt? */
export function kantonBekannt(kanton: string | null): boolean {
  return !!kanton && !!KANTONE_AR[kanton];
}

/**
 * Zuständige Stelle aus Kanton und Regime. Null bei unbekanntem Kanton und bei
 * Regimen ohne Behördengang (frei, unzulaessig, nicht_bestimmbar).
 */
export function zustaendigeStelle(kanton: string | null, regime: Regime, ausweisN: boolean): string | null {
  if (!kanton) return null;
  const k = KANTONE_AR[kanton];
  if (!k) return null;
  if (regime === "meldung") return k.meldung;
  if (regime === "bewilligung") return ausweisN ? k.bewilligungN : k.bewilligungDrittstaat;
  return null;
}

/** Meldekanal — nur beim Regime meldung und nur bei bekanntem Kanton (§4: sonst null). */
export function meldekanal(kanton: string | null, regime: Regime): string | null {
  if (!kantonBekannt(kanton)) return null;
  return regime === "meldung" ? MELDEKANAL : null;
}

/**
 * Kanton-bedingte Sicherheit (Deckelung). Grundlage: die ⚠️-Notiz und
 * Abschnitt 5 des Regelwerks — für SO, BS und BL ist die Zuständigkeit im
 * Meldeverfahren ungeklaert; SO trägt insgesamt zu_bestaetigen. Für die übrigen
 * Regime/Kantone erfolgt keine Deckelung (belegt).
 */
export function kantonSicherheit(kanton: string | null, regime: Regime): Sicherheit {
  if (!kantonBekannt(kanton)) return "belegt";
  if (regime === "meldung") {
    return kanton === "SO" || kanton === "BS" || kanton === "BL" ? "ungeklaert" : "belegt";
  }
  if (regime === "bewilligung") {
    return kanton === "SO" ? "zu_bestaetigen" : "belegt";
  }
  return "belegt";
}
