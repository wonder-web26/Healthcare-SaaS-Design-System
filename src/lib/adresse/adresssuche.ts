/**
 * Adressauflösung — die EINE Stelle, an der eine Adresse zu strukturierten
 * Feldern (inkl. politischer Gemeinde und Kanton) aufgelöst wird.
 *
 * Ohne Backend gibt es keine Treffer. Ein echter Dienst setzt einen Treffer aus
 * ZWEI Quellen zusammen: dem Adress-/Gebäuderegister (Strasse, PLZ, Ort) und dem
 * Gemeindeverzeichnis (politische Gemeinde, BFS-Nummer, Kanton). Beides gehört
 * zusammen, weil eine PLZ mehrere Gemeinden umfassen kann — die Gemeinde wird
 * daher NIE aus der PLZ abgeleitet, sondern kommt aus dem Treffer oder bleibt
 * offen (siehe `braucheGemeindeHinweis`).
 */
import { KANTONE } from "../stammdaten/kantone";

/**
 * Ein Suchergebnis des Adressdienstes. `gemeinde`/`bfsNummer` sind `null`, wenn
 * der Dienst sie nicht liefert (nicht leer geraten). `kanton` trägt den Klarnamen
 * (z. B. „Zürich") und wird beim Übernehmen auf den Code abgebildet.
 */
export interface AdressTreffer {
  label: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  gemeinde: string | null;
  bfsNummer: string | null;
  kanton: string | null;
}

/** Die aus einem Treffer übernommenen Adressfelder. */
export interface AdressUebernahme {
  strasse: string;
  plz: string;
  ort: string;
  land?: string;
  gemeinde?: string;
  bfsNummer?: string;
  kanton?: string;
}

/**
 * Einzige Anbindungsstelle für einen künftigen Adressdienst. Ohne Anbindung
 * keine Treffer — kein Mock, keine Ableitung aus der PLZ. Sobald das Backend
 * steht, funktionieren alle Formulare, die den `AdressBlock` einbinden.
 */
export async function sucheAdresse(_eingabe: string): Promise<AdressTreffer[]> {
  return [];
}

/**
 * Bildet den Kantons-Klarnamen eines Treffers auf den zweibuchstabigen Code ab.
 * `KANTONE` ist die einzige Zuordnung (keine zweite Liste). Findet sich kein
 * Code, bleibt der Wert leer — nie ein Klarname im Feld, weil die Tarifzuordnung
 * über den Code vergleicht (`pflegetarife.tarifgrundlage`, ohne Normalisierung).
 */
export function kantonNameZuCode(nameOderCode: string | null): string {
  if (!nameOderCode) return "";
  const treffer = KANTONE.find(k => k.name === nameOderCode || k.code === nameOderCode);
  return treffer ? treffer.code : "";
}

/**
 * Übernimmt einen Treffer in Adressfelder. `anschrift` nur die Basisfelder;
 * `mitKanton` ergänzt Kanton (Name → Code) und Land; `voll` zusätzlich Gemeinde
 * und BFS-Nummer.
 */
export function trefferAnwenden(t: AdressTreffer, variante: "anschrift" | "mitKanton" | "voll"): AdressUebernahme {
  const basis = { strasse: t.strasse, plz: t.plz, ort: t.ort };
  if (variante === "anschrift") return basis;
  if (variante === "mitKanton") {
    return { ...basis, land: t.land, kanton: kantonNameZuCode(t.kanton) };
  }
  return {
    ...basis,
    land: t.land,
    gemeinde: t.gemeinde ?? "",
    bfsNummer: t.bfsNummer ?? "",
    kanton: kantonNameZuCode(t.kanton),
  };
}

/**
 * Ob nach einem Treffer der Hinweis „Gemeinde nicht ermittelbar" nötig ist: wenn
 * der Dienst weder Gemeinde noch BFS-Nummer geliefert hat. Nur nach einem Treffer
 * relevant — bei manueller Erfassung erscheint der Hinweis nie.
 */
export function braucheGemeindeHinweis(t: AdressTreffer): boolean {
  return !t.gemeinde || !t.bfsNummer;
}
