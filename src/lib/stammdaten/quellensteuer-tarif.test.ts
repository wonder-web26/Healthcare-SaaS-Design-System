/**
 * Unit-Tests für die QSt-Tarifableitung, die Grammatik und den Steuerpflicht-
 * Hinweis — node:assert, ausführbar mit
 *   npx tsx src/lib/stammdaten/quellensteuer-tarif.test.ts
 */
import assert from "node:assert/strict";
import { leiteTarifcodeAb, steuerpflichtHinweis } from "./quellensteuer-tarif";

// ── Ableitung unverändert: sechs Kombinationen, Code wie zuvor ──
const faelle: Array<[Parameters<typeof leiteTarifcodeAb>[0], string, string]> = [
  [{ zivilstand: "ledig", hatKinder: false, anzahlKinder: 0, partnerErwerbstaetig: "", konfession: "" }, "A0N", "ledig ohne Kinder"],
  [{ zivilstand: "verheiratet", hatKinder: false, anzahlKinder: 2, partnerErwerbstaetig: "ja", konfession: "roemisch_katholisch" }, "C2Y", "verheiratet, Partner erwerbstätig"],
  [{ zivilstand: "verheiratet", hatKinder: true, anzahlKinder: 1, partnerErwerbstaetig: "nein", konfession: "" }, "B1N", "verheiratet, Einverdiener"],
  [{ zivilstand: "ledig", hatKinder: true, anzahlKinder: 3, partnerErwerbstaetig: "", konfession: "" }, "H3N", "alleinerziehend"],
  [{ zivilstand: "ledig", hatKinder: false, anzahlKinder: 0, partnerErwerbstaetig: "", konfession: "evangelisch_reformiert" }, "A0Y", "ledig mit Kirchensteuer"],
  [{ zivilstand: "verheiratet", hatKinder: false, anzahlKinder: 0, partnerErwerbstaetig: "ja", konfession: "" }, "C0N", "verheiratet, keine Kinder, Doppelverdiener"],
];
for (const [params, code, name] of faelle) {
  assert.equal(leiteTarifcodeAb(params).code, code, `Ableitung: ${name} → ${code}`);
}

// ── Herleitung: drei Zeichen mit den richtigen Ankern, Zeichen = Codezeichen ──
{
  const r = leiteTarifcodeAb({ zivilstand: "verheiratet", hatKinder: true, anzahlKinder: 1, partnerErwerbstaetig: "nein", konfession: "roemisch_katholisch" });
  assert.equal(r.code, "B1Y");
  assert.equal(r.herleitung.length, 3, "eine Zeile je Zeichen");
  assert.deepEqual(r.herleitung.map(h => h.zeichen), ["B", "1", "Y"]);
  assert.deepEqual(r.herleitung.map(h => h.quelleAnker), ["zivilstand", "kinder", "konfession"]);
}

// ── Grammatik: 1 Kind, 2 Kinder, 0 Kinder ──
const kinderZeile = (n: number) =>
  leiteTarifcodeAb({ zivilstand: "ledig", hatKinder: n > 0, anzahlKinder: n, partnerErwerbstaetig: "", konfession: "" }).herleitung[1].bedeutung;
assert.equal(kinderZeile(1), "1 Kind", "Einzahl");
assert.equal(kinderZeile(2), "2 Kinder", "Mehrzahl");
assert.equal(kinderZeile(0), "0 Kinder", "Null");
assert.ok(
  leiteTarifcodeAb({ zivilstand: "ledig", hatKinder: true, anzahlKinder: 1, partnerErwerbstaetig: "", konfession: "" }).begruendung.includes("1 Kind,"),
  "Begründung nutzt dieselbe Grammatik (1 Kind)",
);

// ── Steuerpflicht-Hinweis: drei Bedingungen, einschliesslich ledig mit Ausweis B ──
const NICHT = "Nicht quellensteuerpflichtig.";
const MOEGLICH = "Möglicherweise nicht quellensteuerpflichtig. Wer mit einer Schweizerin oder einem Niedergelassenen verheiratet ist, unterliegt der ordentlichen Veranlagung. Vor der ersten Lohnabrechnung klären.";
const PFLICHTIG = "Quellensteuerpflichtig, sofern nicht mit einer Schweizerin oder einem Niedergelassenen verheiratet.";

// 1. eigene Schweizer Staatsangehörigkeit → nicht pflichtig
assert.equal(steuerpflichtHinweis({ nationalitaet: "schweiz", aufenthaltsstatus: "", zivilstand: "ledig", partnerNationalitaet: "", partnerAufenthaltsstatus: "" }), NICHT);
// 1b. eigener Ausweis C → nicht pflichtig
assert.equal(steuerpflichtHinweis({ nationalitaet: "deutschland", aufenthaltsstatus: "C", zivilstand: "ledig", partnerNationalitaet: "", partnerAufenthaltsstatus: "" }), NICHT);
// 2. verheiratet, Partner Schweizer → möglicherweise nicht
assert.equal(steuerpflichtHinweis({ nationalitaet: "deutschland", aufenthaltsstatus: "B", zivilstand: "verheiratet", partnerNationalitaet: "schweiz", partnerAufenthaltsstatus: "CH" }), MOEGLICH);
// 2b. verheiratet, Partner Ausweis C → möglicherweise nicht
assert.equal(steuerpflichtHinweis({ nationalitaet: "deutschland", aufenthaltsstatus: "B", zivilstand: "verheiratet", partnerNationalitaet: "italien", partnerAufenthaltsstatus: "C" }), MOEGLICH);
// 3. ledig mit Ausweis B → pflichtig
assert.equal(steuerpflichtHinweis({ nationalitaet: "deutschland", aufenthaltsstatus: "B", zivilstand: "ledig", partnerNationalitaet: "", partnerAufenthaltsstatus: "" }), PFLICHTIG);

console.log("quellensteuer-tarif.test.ts: alle Zusicherungen erfüllt");
