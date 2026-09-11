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

/* ══════════════════════════════════════════
   QUELLENSTEUERPFLICHT — ABLEITUNG
   ══════════════════════════════════════════ */

export type Steuerpflicht = "ja" | "nein";

export interface SteuerpflichtErgebnis {
  /** Der abgeleitete Wert, oder `null`, wenn die Regel ihn nicht bestimmen kann. */
  wert: Steuerpflicht | null;
  /** Warum — ein Satz, der im Formular unter dem Feld steht. */
  begruendung: string;
  /** Fehlt eine Angabe, die zur Entscheidung nötig wäre? Dann ist `wert` null,
   *  aber es liegt kein Zweifelsfall vor, sondern nur eine Lücke. */
  unvollstaendig: boolean;
}

export interface SteuerpflichtEingabe {
  nationalitaet: string;
  aufenthaltsstatus: string;
  zivilstand: string;
  partnerNationalitaet: string;
  partnerAufenthaltsstatus: string;
}

/**
 * Quellensteuerpflicht aus den erfassten Angaben ableiten.
 *
 * Drei Konstellationen, alle drei entscheidbar:
 *
 *   1. eigene Schweizer Staatsangehörigkeit oder Ausweis C → NEIN
 *   2. ausländisch, nicht mit CH/C verheiratet             → JA
 *   3. ausländisch, mit CH/C verheiratet                   → NEIN
 *
 * Der dritte Fall stand hier zunächst als Zweifelsfall ohne Wert, mit der
 * Begründung, er sei am Einzelfall zu klären. Das war zu vorsichtig: DBG
 * Art. 83 regelt ihn ausdrücklich — wer in ungetrennter Ehe mit einer Person
 * mit Schweizer Bürgerrecht oder Niederlassungsbewilligung lebt, unterliegt
 * nicht der Quellensteuer, sondern der ordentlichen Veranlagung.
 *
 * ZWEI VORAUSSETZUNGEN, DIE DAS FORMULAR NICHT ERHEBT, und die deshalb im
 * Begründungstext stehen statt in der Bedingung:
 *   - «rechtlich und tatsächlich ungetrennt»: die Zivilstandsliste kennt kein
 *     «getrennt», eine getrennt lebende Person steht weiter auf «verheiratet».
 *   - gemeinsamer steuerrechtlicher Wohnsitz in der Schweiz: vom Partner wird
 *     keine Adresse erfasst.
 * Wer eine der beiden Angaben aufnimmt, gehört sie hier in die Bedingung.
 *
 * ZWEI GRENZEN, die diese Ableitung NICHT kennt:
 *
 * - Der Ausweis G (Grenzgänger) ist immer quellensteuerpflichtig. Er fällt hier
 *   unter Regel 2 und kommt damit richtig heraus — aber als Rest, nicht weil
 *   die Regel ihn kennt. Käme je eine Ausnahme für Grenzgänger dazu, müsste sie
 *   hier ausdrücklich stehen.
 * - Die Pflicht endet bei hohem Einkommen (nachträgliche ordentliche
 *   Veranlagung ab 120'000 Franken Jahreslohn). Das Formular erfasst keinen
 *   Jahreslohn, also kann die Regel das nicht prüfen. Bei einem Stundenlohn im
 *   Angehörigenpflege-Rahmen ist die Schwelle ausser Reichweite; sicher ist es
 *   damit nicht, nur unwahrscheinlich.
 */
export function leiteQuellensteuerpflichtAb(e: SteuerpflichtEingabe): SteuerpflichtErgebnis {
  const { nationalitaet, aufenthaltsstatus, zivilstand, partnerNationalitaet, partnerAufenthaltsstatus } = e;

  /* Ohne Staatsangehörigkeit UND ohne Ausweis lässt sich nichts sagen. Das ist
     keine Unsicherheit, sondern eine fehlende Eingabe — die Unterscheidung
     zählt, weil das Formular sie verschieden behandelt. */
  if (!nationalitaet && !aufenthaltsstatus) {
    return {
      wert: null,
      unvollstaendig: true,
      begruendung: "Staatsangehörigkeit und Ausweisart erfassen — danach wird die Pflicht abgeleitet.",
    };
  }

  if (istSchweiz(nationalitaet)) {
    return { wert: "nein", unvollstaendig: false, begruendung: "Schweizer Staatsangehörigkeit — keine Quellensteuerpflicht." };
  }
  if (aufenthaltsstatus === "C") {
    return { wert: "nein", unvollstaendig: false, begruendung: "Ausweis C (Niederlassung) — ordentliche Veranlagung, keine Quellensteuer." };
  }

  const verheiratet = istVerheiratetOderPartnerschaft(zivilstand);
  const partnerBefreit = istSchweiz(partnerNationalitaet)
    || partnerAufenthaltsstatus === "CH"
    || partnerAufenthaltsstatus === "C";

  if (verheiratet && partnerBefreit) {
    return {
      wert: "nein",
      unvollstaendig: false,
      begruendung: "Ehe mit einer Schweizer Staatsangehörigen oder einem Niedergelassenen — ordentliche Veranlagung statt Quellensteuer (DBG Art. 83). Gilt bei ungetrennter Ehe und gemeinsamem Wohnsitz in der Schweiz.",
    };
  }

  /* Verheiratet, aber die Angaben zur Partnerin fehlen noch — dann steht die
     Ausnahme möglicherweise erst bevor. Lieber warten als voreilig setzen. */
  if (verheiratet && !partnerNationalitaet && !partnerAufenthaltsstatus) {
    return {
      wert: null,
      unvollstaendig: true,
      begruendung: "Angaben zur Ehepartnerin oder zum Ehepartner erfassen — sie können die Pflicht aufheben.",
    };
  }

  return {
    wert: "ja",
    unvollstaendig: false,
    begruendung: aufenthaltsstatus === "G"
      ? "Grenzgängerbewilligung (G) — quellensteuerpflichtig."
      : "Ausländische Staatsangehörigkeit ohne Niederlassung — quellensteuerpflichtig.",
  };
}

/**
 * Müssen die Partnerangaben erfasst werden?
 *
 * Ja, wenn die Person verheiratet oder in eingetragener Partnerschaft lebt UND
 * selbst weder Schweizerin noch niedergelassen (Ausweis C) ist.
 *
 * Der Grund ist die Ausnahme in `leiteQuellensteuerpflichtAb`: bei einer
 * ausländischen Person ohne Niederlassung entscheidet die Partnerin darüber,
 * ob überhaupt Quellensteuerpflicht besteht. Genau dann — und nur dann —
 * braucht die Ableitung die Angaben.
 *
 * VORHER HING DIESE FRAGE AN `quellensteuer === "ja"`, und das war ein
 * Ringschluss: die Partnerangaben wurden erst verlangt, wenn die Pflicht
 * feststand, während die Pflicht ohne sie nicht festzustellen war. Solange ein
 * Mensch den Umschalter setzte, fiel das nicht auf; mit der Ableitung wäre das
 * Formular in diesem Fall nie fertig geworden.
 *
 * Wer ledig ist, hat keine Partnerin zu erfassen — die Zivilstands-Bedingung
 * bleibt deshalb stehen.
 */
export function partnerErfassungNoetig(e: {
  zivilstand: string;
  nationalitaet: string;
  aufenthaltsstatus: string;
}): boolean {
  if (!istVerheiratetOderPartnerschaft(e.zivilstand)) return false;

  /* Solange weder Staatsangehörigkeit noch Ausweis erfasst sind, ist NICHT
     bekannt, ob die Person befreit ist — und Unbekanntes ist kein Grund, etwas
     zu verlangen. Ohne diese Zeile gilt `istSchweiz("")` als "nicht
     Schweizerin", und der Reiter erschiene für jede verheiratete Person, sobald
     der Zivilstand gesetzt ist. Genau das war der Fehler.

     Ein Ausweis ohne Staatsangehörigkeit genügt dagegen: wer einen Ausweis
     trägt, ist nicht Schweizerin. */
  if (!e.nationalitaet && !e.aufenthaltsstatus) return false;

  const selbstBefreit = istSchweiz(e.nationalitaet) || e.aufenthaltsstatus === "C";
  return !selbstBefreit;
}

/**
 * Hinweistext zur Quellensteuerpflicht — die ältere, rein textliche Form.
 *
 * Sie bleibt, weil sie an anderen Stellen gelesen wird; im Angehörigenformular
 * ist `leiteQuellensteuerpflichtAb` an ihre Stelle getreten, weil dort nicht
 * nur ein Satz, sondern ein Wert gebraucht wird. Reihenfolge der Bedingungen:
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
