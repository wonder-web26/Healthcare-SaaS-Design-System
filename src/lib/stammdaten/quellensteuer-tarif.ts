/**
 * SP-10: Quellensteuer-Tarifcode herleiten.
 *
 * Code-Struktur: [Buchstabe][Anzahl Kinder][Y/N], z.B. "B2Y"
 *
 * Buchstabe:
 *   A = ledig/geschieden/verwitwet, keine Kinder im Haushalt
 *   B = verheiratet/eingetr. Partnerschaft, Einverdiener (Partner nicht erwerbstätig)
 *   C = verheiratet/eingetr. Partnerschaft, Doppelverdiener (Partner erwerbstätig)
 *   H = alleinerziehend (Kinder im Haushalt, kein Ehe-/Partnerstatus)
 *
 * Anzahl Kinder: Ziffer (minderjährige unterhaltspflichtige Kinder)
 * Suffix: Y = kirchensteuerrelevant, N = nicht
 *
 * Scope V1: NUR Tarifcode herleiten. KEINE Abzugsberechnung, KEINE Tarifsätze.
 * Rechtsverbindliche Berechnung läuft extern über Swissdec-konformen Lohnlauf.
 *
 * Grenzgänger-/Sondertarife (L/M/N/P, F, G, E) werden in V1 NICHT automatisch
 * hergeleitet — über manuellen Override + Begründung erfassbar.
 */

import { istKirchensteuerRelevant } from "./konfession";

export interface TarifcodeErgebnis {
  code: string;
  buchstabe: string;
  anzahlKinder: number;
  kirchensteuer: boolean;
  begruendung: string;
}

/**
 * Leitet den QSt-Tarifcode aus den Stammdaten ab.
 */
export function leiteTarifcodeAb(params: {
  zivilstand: string;
  hatKinder: boolean;
  anzahlKinder: number;
  partnerErwerbstaetig: string;
  konfession: string;
}): TarifcodeErgebnis {
  const { zivilstand, hatKinder, anzahlKinder, partnerErwerbstaetig, konfession } = params;

  const istVerheiratet = zivilstand === "verheiratet" || zivilstand === "eingetragene_partnerschaft";
  const kirchensteuer = istKirchensteuerRelevant(konfession);
  const suffix = kirchensteuer ? "Y" : "N";
  const kinderZiffer = Math.max(0, Math.min(9, anzahlKinder));

  let buchstabe: string;
  let begruendungTeile: string[] = [];

  if (istVerheiratet) {
    if (partnerErwerbstaetig === "ja") {
      buchstabe = "C";
      begruendungTeile.push("verheiratet/eingetr. Partnerschaft", "Doppelverdiener (Partner erwerbstätig)");
    } else {
      buchstabe = "B";
      begruendungTeile.push("verheiratet/eingetr. Partnerschaft", "Einverdiener (Partner nicht erwerbstätig)");
    }
  } else if (hatKinder && !istVerheiratet) {
    buchstabe = "H";
    begruendungTeile.push("alleinerziehend (Kinder im Haushalt, kein Ehe-/Partnerstatus)");
  } else {
    buchstabe = "A";
    begruendungTeile.push(`${zivilstand || "ledig"}, keine Kinder im Haushalt`);
  }

  begruendungTeile.push(`${kinderZiffer} Kinder`);
  begruendungTeile.push(kirchensteuer ? "mit Kirchensteuer" : "ohne Kirchensteuer");

  const code = `${buchstabe}${kinderZiffer}${suffix}`;

  return {
    code,
    buchstabe,
    anzahlKinder: kinderZiffer,
    kirchensteuer,
    begruendung: begruendungTeile.join(", "),
  };
}
