/**
 * Krankenkassen-Abrechnungsregeln — Warn-Engine (Stufe 2, warn-only).
 *
 * ⚠️ HAFTUNGS-VORBEHALT
 * Diese Engine WARNT und PRÜFT, sie BESTÄTIGT NICHT.
 * Es erfolgt keine Konformitäts-Zusicherung, keine Freigabe, keine Aussage
 * "kassenkonform" / "korrekt" / "freigegeben". Eine solche Zusicherung wäre
 * eine Gewährleistung mit Haftungsfolge. Das System bleibt bewusst auf
 * Hinweis-Ebene ("weicht ab", "bitte prüfen").
 *
 * ⚠️ MOCK / MACHBARKEITSNACHWEIS
 * Diese Tabelle enthält eine kleine Auswahl von Demo-Regeln.
 * Die vollständige Regelbasis muss mit den Abrechnungsstellen und
 * Krankenkassen erarbeitet werden. Die Datenstruktur und Prüflogik
 * sind dafür vorbereitet.
 *
 * Erkennung: rein regelbasiert (Tabellen-Abgleich), keine LLM-Inferenz.
 */

import type { KLVLeistung } from "../../types/klinische-artefakte";

export type KassenregelTyp = "maxTage" | "maxZeitMin";

export interface Kassenregel {
  /** Krankenkasse, für die diese Regel gilt */
  kasse: string;
  /** Betroffene KLV-Nummer (oder "*" für alle Leistungen dieser Kasse) */
  klvNummer: string;
  /** Art der Einschränkung */
  typ: KassenregelTyp;
  /** Grenzwert (z.B. 6 Tage, 60 Minuten) */
  grenzwert: number;
  /** Klartext-Begründung für den Hinweis */
  begruendung: string;
}

/**
 * Mock-Regeltabelle: erweiterbar.
 * Neue Regeln = neues Array-Element. Logik und UI ändern sich nicht.
 */
export const KASSEN_REGELN: Kassenregel[] = [
  // Groupe Mutuel: max. 6 Tage verrechenbar (statt Standard 7)
  {
    kasse: "Groupe Mutuel",
    klvNummer: "*",
    typ: "maxTage",
    grenzwert: 6,
    begruendung: "Groupe Mutuel erlaubt max. 6 Tage pro Woche",
  },
  // KPT: Erstassessment max. 60 Min (statt Standard 180 Min / 3 Std)
  {
    kasse: "KPT",
    klvNummer: "10901",
    typ: "maxZeitMin",
    grenzwert: 60,
    begruendung: "KPT vergütet Erstassessment mit max. 60 Minuten",
  },
  // KPT: Reassessment max. 45 Min
  {
    kasse: "KPT",
    klvNummer: "10902",
    typ: "maxZeitMin",
    grenzwert: 45,
    begruendung: "KPT vergütet Reassessment mit max. 45 Minuten",
  },
];

/** Ergebnis einer Kassenregel-Prüfung */
export interface KassenregelTreffer {
  kasse: string;
  typ: KassenregelTyp;
  grenzwert: number;
  erfassterWert: number;
  begruendung: string;
  /** Menschenlesbare Zusammenfassung */
  hinweis: string;
}

/**
 * Tage pro Woche aus der Einheit ableiten.
 * t2=2, t3=3, ..., t7=7, w=1 (1×/Wo), andere=0.
 */
function tageAusEinheit(einheit: string): number {
  if (einheit.startsWith("t")) {
    const n = parseInt(einheit.slice(1));
    return isNaN(n) ? 0 : n;
  }
  if (einheit === "w") return 1;
  return 0;
}

/**
 * Prüft eine erfasste Leistung gegen die Kassenregeln der zugeordneten Kasse.
 * Gibt alle Treffer zurück (kann mehrere sein, z.B. Tage UND Zeit).
 *
 * Rein regelbasiert, kein LLM, keine Inferenz.
 */
export function pruefeKassenregeln(
  leistung: KLVLeistung,
  krankenkasse: string,
): KassenregelTreffer[] {
  const treffer: KassenregelTreffer[] = [];

  for (const regel of KASSEN_REGELN) {
    // Kasse muss übereinstimmen
    if (regel.kasse !== krankenkasse) continue;
    // KLV-Nummer muss übereinstimmen (oder "*" für alle)
    if (regel.klvNummer !== "*" && regel.klvNummer !== leistung.klvNummer) continue;

    if (regel.typ === "maxTage") {
      const erfassteTage = tageAusEinheit(leistung.einheit);
      if (erfassteTage > regel.grenzwert) {
        treffer.push({
          kasse: regel.kasse,
          typ: regel.typ,
          grenzwert: regel.grenzwert,
          erfassterWert: erfassteTage,
          begruendung: regel.begruendung,
          hinweis: `${regel.kasse}: max. ${regel.grenzwert} Tage – erfasst ${erfassteTage}, bitte prüfen`,
        });
      }
    }

    if (regel.typ === "maxZeitMin") {
      if (leistung.zeitMin > regel.grenzwert) {
        treffer.push({
          kasse: regel.kasse,
          typ: regel.typ,
          grenzwert: regel.grenzwert,
          erfassterWert: leistung.zeitMin,
          begruendung: regel.begruendung,
          hinweis: `${regel.kasse}: max. ${regel.grenzwert} Min. – erfasst ${leistung.zeitMin} Min., bitte prüfen`,
        });
      }
    }
  }

  return treffer;
}
