/**
 * Unit-Tests für die Adressauflösung — node:assert, ausführbar mit
 *   npx tsx src/lib/adresse/adresssuche.test.ts
 */
import assert from "node:assert/strict";
import {
  sucheAdresse,
  kantonNameZuCode,
  trefferAnwenden,
  braucheGemeindeHinweis,
  type AdressTreffer,
} from "./adresssuche";

// Ein vollständiger Treffer (Gemeinde, BFS, Kanton als Klarname vorhanden).
const vollstaendig: AdressTreffer = {
  label: "Bahnhofstrasse 1, 8001 Zürich",
  strasse: "Bahnhofstrasse 1", plz: "8001", ort: "Zürich", land: "CH",
  gemeinde: "Zürich", bfsNummer: "261", kanton: "Zürich",
};

// Ein Treffer ohne Gemeinde/BFS — der Dienst konnte sie nicht auflösen.
const ohneGemeinde: AdressTreffer = {
  label: "Dorfstrasse 2, 8494 Bauma", strasse: "Dorfstrasse 2", plz: "8494", ort: "Bauma",
  land: "CH", gemeinde: null, bfsNummer: null, kanton: "Zürich",
};

async function main() {
  // §1/§5: ohne Backend keine Treffer — kein Mock, keine PLZ-Ableitung.
  assert.deepEqual(await sucheAdresse("Bahnhofstrasse 1"), [], "sucheAdresse liefert []");

  // §5: Kantons-Klarname → Code über die eine Zuordnung; kein CH-Kanton → leer.
  assert.equal(kantonNameZuCode("Zürich"), "ZH");
  assert.equal(kantonNameZuCode("Bern"), "BE");
  assert.equal(kantonNameZuCode("ZH"), "ZH", "Code bleibt Code");
  assert.equal(kantonNameZuCode("Bayern"), "", "Nicht-CH-Kanton → leer, kein Klarname");
  assert.equal(kantonNameZuCode(null), "", "null → leer");

  // §3/§5: Treffer übernehmen — anschrift nur Basis, voll ergänzt + mappt Kanton.
  assert.deepEqual(
    trefferAnwenden(vollstaendig, "anschrift"),
    { strasse: "Bahnhofstrasse 1", plz: "8001", ort: "Zürich" },
    "anschrift übernimmt nur Strasse/PLZ/Ort",
  );
  {
    const v = trefferAnwenden(vollstaendig, "voll");
    assert.equal(v.gemeinde, "Zürich");
    assert.equal(v.bfsNummer, "261");
    assert.equal(v.kanton, "ZH", "Kanton als Code, nicht als Klarname");
    assert.equal(v.land, "CH");
  }
  {
    // mitKanton: Kanton (Code) + Land, aber keine Gemeinde/BFS.
    const m = trefferAnwenden(vollstaendig, "mitKanton");
    assert.equal(m.kanton, "ZH");
    assert.equal(m.land, "CH");
    assert.equal(m.gemeinde, undefined, "mitKanton ohne Gemeinde");
    assert.equal(m.bfsNummer, undefined, "mitKanton ohne BFS-Nummer");
  }

  // §6: vollständiger Treffer → kein Hinweis.
  assert.equal(braucheGemeindeHinweis(vollstaendig), false);

  // §6: Treffer ohne Gemeinde/BFS → Hinweis; voll setzt leere Felder (nie aus PLZ).
  assert.equal(braucheGemeindeHinweis(ohneGemeinde), true);
  {
    const v = trefferAnwenden(ohneGemeinde, "voll");
    assert.equal(v.gemeinde, "", "keine Gemeinde erraten");
    assert.equal(v.bfsNummer, "", "keine BFS-Nummer erraten");
    assert.equal(v.kanton, "ZH", "Kanton bleibt, weil im Treffer vorhanden");
  }

  console.log("adresssuche.test.ts: alle Zusicherungen erfüllt");
}

main();
