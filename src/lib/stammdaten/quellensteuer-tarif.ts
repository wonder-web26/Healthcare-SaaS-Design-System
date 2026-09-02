/**
 * SP-10: Quellensteuer-Tarifcode herleiten.
 *
 * Code-Struktur: [Buchstabe][Anzahl Kinder][Y/N], z.B. "B2Y"
 *
 * Buchstabe (abgeleitet werden nur A/B/C/H):
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
 * Grenzgänger-/Sondertarife (E, G, L, M, N, P, Q) werden NICHT automatisch
 * hergeleitet — ob eine Person Grenzgängerin ist, ergibt sich aus heute nicht
 * erfassten Angaben. Sie stehen nur in der Auswahl der Abweichung zur Verfügung
 * (siehe TARIF_BUCHSTABEN), nicht in dieser Ableitung.
 */

import { istKirchensteuerRelevant } from "./konfession";
import { istVerheiratetOderPartnerschaft } from "./zivilstand";
import { istSchweiz } from "./staatsangehoerigkeit";

/**
 * Die Werteliste der Tarifbuchstaben — die EINE Stelle, gelesen von der Ableitung
 * (nur A/B/C/H) und von der Auswahl der Abweichung (alle). L/M/N/P/Q sind die
 * Grenzgängercodes für Deutschland und entsprechen A/B/C/H/G.
 */
export interface TarifBuchstabe {
  code: string;
  label: string;
}

export const TARIF_BUCHSTABEN: TarifBuchstabe[] = [
  { code: "A", label: "A – ledig / geschieden / verwitwet" },
  { code: "B", label: "B – verheiratet, Einverdiener" },
  { code: "C", label: "C – verheiratet, Doppelverdiener" },
  { code: "H", label: "H – alleinerziehend" },
  { code: "E", label: "E – vereinfachtes Abrechnungsverfahren" },
  { code: "G", label: "G – Ersatzeinkünfte" },
  { code: "L", label: "L – Grenzgängerin Deutschland (wie A)" },
  { code: "M", label: "M – Grenzgängerin Deutschland (wie B)" },
  { code: "N", label: "N – Grenzgängerin Deutschland (wie C)" },
  { code: "P", label: "P – Grenzgängerin Deutschland (wie H)" },
  { code: "Q", label: "Q – Grenzgängerin Deutschland (wie G)" },
];

/** Eine Zeile der Herleitung: ein Zeichen des Codes und seine Quelle. */
export interface TarifcodeHerleitung {
  /** Das Zeichen im Code, z.B. 'B', '1', 'Y'. */
  zeichen: string;
  /** Was das Zeichen bedeutet. */
  bedeutung: string;
  /** Bezeichnung von Feld und Reiter der Quelle. */
  quelleFeld: string;
  /** Sprungziel — semantischer Schlüssel, den die Oberfläche auf einen Reiter abbildet. */
  quelleAnker: "zivilstand" | "kinder" | "konfession";
}

export interface TarifcodeErgebnis {
  code: string;
  buchstabe: string;
  anzahlKinder: number;
  kirchensteuer: boolean;
  begruendung: string;
  /** Je Zeichen eine Zeile — macht die Herleitung nachvollziehbar. */
  herleitung: TarifcodeHerleitung[];
}

/** „1 Kind", sonst „N Kinder" — Grammatik der Kinderzahl. */
function kinderText(n: number): string {
  return `${n} ${n === 1 ? "Kind" : "Kinder"}`;
}

/**
 * Leitet den QSt-Tarifcode aus den Stammdaten ab. Die Logik ist unverändert;
 * zusätzlich liefert sie die Herleitung je Zeichen.
 */
export function leiteTarifcodeAb(params: {
  zivilstand: string;
  hatKinder: boolean;
  anzahlKinder: number;
  partnerErwerbstaetig: string;
  konfession: string;
}): TarifcodeErgebnis {
  const { zivilstand, hatKinder, anzahlKinder, partnerErwerbstaetig, konfession } = params;

  const istVerheiratet = istVerheiratetOderPartnerschaft(zivilstand);
  const kirchensteuer = istKirchensteuerRelevant(konfession);
  const suffix = kirchensteuer ? "Y" : "N";
  const kinderZiffer = Math.max(0, Math.min(9, anzahlKinder));

  let buchstabe: string;
  let buchstabeBedeutung: string;
  const begruendungTeile: string[] = [];

  if (istVerheiratet) {
    if (partnerErwerbstaetig === "ja") {
      buchstabe = "C";
      buchstabeBedeutung = "Verheiratet, Partner erwerbstätig (Doppelverdiener)";
      begruendungTeile.push("verheiratet/eingetr. Partnerschaft", "Doppelverdiener (Partner erwerbstätig)");
    } else {
      buchstabe = "B";
      buchstabeBedeutung = "Verheiratet, Partner nicht erwerbstätig (Einverdiener)";
      begruendungTeile.push("verheiratet/eingetr. Partnerschaft", "Einverdiener (Partner nicht erwerbstätig)");
    }
  } else if (hatKinder && !istVerheiratet) {
    buchstabe = "H";
    buchstabeBedeutung = "Alleinerziehend";
    begruendungTeile.push("alleinerziehend (Kinder im Haushalt, kein Ehe-/Partnerstatus)");
  } else {
    buchstabe = "A";
    buchstabeBedeutung = `${zivilstand || "Ledig"}, keine Kinder im Haushalt`;
    begruendungTeile.push(`${zivilstand || "ledig"}, keine Kinder im Haushalt`);
  }

  begruendungTeile.push(kinderText(kinderZiffer));
  begruendungTeile.push(kirchensteuer ? "mit Kirchensteuer" : "ohne Kirchensteuer");

  const code = `${buchstabe}${kinderZiffer}${suffix}`;

  const herleitung: TarifcodeHerleitung[] = [
    { zeichen: buchstabe, bedeutung: buchstabeBedeutung, quelleFeld: "Zivilstand (Personalien)", quelleAnker: "zivilstand" },
    { zeichen: String(kinderZiffer), bedeutung: kinderText(kinderZiffer), quelleFeld: "Kinderzahl (Kinder und Zulagen)", quelleAnker: "kinder" },
    { zeichen: suffix, bedeutung: kirchensteuer ? "Mit Kirchensteuer" : "Ohne Kirchensteuer", quelleFeld: "Konfession (Steuer & Sozialvers.)", quelleAnker: "konfession" },
  ];

  return {
    code,
    buchstabe,
    anzahlKinder: kinderZiffer,
    kirchensteuer,
    begruendung: begruendungTeile.join(", "),
    herleitung,
  };
}

/**
 * Hinweistext zur Quellensteuerpflicht — bestimmt AUSSCHLIESSLICH den Text, nie
 * den Wert des Umschalters. Die Ausnahme (Ehe mit einer Schweizerin oder einem
 * Niedergelassenen) ist fachlich zu bestätigen; darum setzt sie hier keinen
 * Automatismus, sondern macht nur aufmerksam. Reihenfolge der Bedingungen:
 *   1. eigene Schweizer Staatsangehörigkeit oder Ausweis C  → nicht pflichtig
 *   2. verheiratet und Partner CH/Ausweis C                 → möglicherweise nicht pflichtig
 *   3. sonst                                                → pflichtig, mit Vorbehalt
 */
export function steuerpflichtHinweis(params: {
  nationalitaet: string;
  aufenthaltsstatus: string;
  zivilstand: string;
  partnerNationalitaet: string;
  partnerAufenthaltsstatus: string;
}): string {
  const { nationalitaet, aufenthaltsstatus, zivilstand, partnerNationalitaet, partnerAufenthaltsstatus } = params;

  const eigenBefreit = istSchweiz(nationalitaet) || aufenthaltsstatus === "C";
  if (eigenBefreit) return "Nicht quellensteuerpflichtig.";

  const verheiratet = istVerheiratetOderPartnerschaft(zivilstand);
  const partnerBefreit = istSchweiz(partnerNationalitaet) || partnerAufenthaltsstatus === "CH" || partnerAufenthaltsstatus === "C";
  if (verheiratet && partnerBefreit) {
    return "Möglicherweise nicht quellensteuerpflichtig. Wer mit einer Schweizerin oder einem Niedergelassenen verheiratet ist, unterliegt der ordentlichen Veranlagung. Vor der ersten Lohnabrechnung klären.";
  }

  return "Quellensteuerpflichtig, sofern nicht mit einer Schweizerin oder einem Niedergelassenen verheiratet.";
}
