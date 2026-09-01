/**
 * Ableitung der Zulagenart aus Alter und Ausbildungsstand.
 * Lauf mit: npx tsx src/lib/stammdaten/zulagenart.test.ts
 */
import assert from "node:assert";
import { zulagenart, alterInJahren, alterAnzeige } from "./zulagenart";

const STICHTAG = "2026-08-04"; // GEGENWART des Prototyps

// ── Alter (vollendete Jahre) am Stichtag ──
assert.strictEqual(alterInJahren("03.09.2012", STICHTAG), 13); // Geburtstag im September noch nicht erreicht
assert.strictEqual(alterInJahren("15.04.2010", STICHTAG), 16); // Geburtstag im April bereits vorbei
assert.strictEqual(alterInJahren("04.08.2000", STICHTAG), 26); // Geburtstag genau am Stichtag
assert.strictEqual(alterInJahren("", STICHTAG), null);
assert.strictEqual(alterInJahren("Unsinn", STICHTAG), null);

// ── Ableitung ──
// unter 16 → Kinderzulage (Ausbildungsstand irrelevant)
assert.strictEqual(zulagenart("03.09.2012", null, STICHTAG), "kinderzulage");
assert.strictEqual(zulagenart("03.09.2012", false, STICHTAG), "kinderzulage");

// genau 16 und in Ausbildung → Ausbildungszulage
assert.strictEqual(zulagenart("15.04.2010", true, STICHTAG), "ausbildungszulage");
// genau 16, nicht / unbeantwortet → keine
assert.strictEqual(zulagenart("15.04.2010", false, STICHTAG), "keine");
assert.strictEqual(zulagenart("15.04.2010", null, STICHTAG), "keine");

// 21 in Ausbildung → Ausbildungszulage (Fall Lena Steiner)
assert.strictEqual(zulagenart("03.03.2005", true, STICHTAG), "ausbildungszulage");

// 25 in Ausbildung → noch Ausbildungszulage (Grenze inklusiv)
assert.strictEqual(zulagenart("01.01.2001", true, STICHTAG), "ausbildungszulage");
// 26 trotz Ausbildung → keine
assert.strictEqual(zulagenart("04.08.2000", true, STICHTAG), "keine");

// ohne Geburtsdatum → keine
assert.strictEqual(zulagenart("", true, STICHTAG), "keine");

// ── Altersanzeige ──
assert.strictEqual(alterAnzeige("03.09.2012", STICHTAG), "13 Jahre");
assert.strictEqual(alterAnzeige("15.04.2010", STICHTAG), "16 Jahre");
assert.strictEqual(alterAnzeige("04.02.2026", STICHTAG), "6 Monate"); // unter einem Jahr
assert.strictEqual(alterAnzeige("04.07.2026", STICHTAG), "1 Monat");
assert.strictEqual(alterAnzeige("", STICHTAG), "");

console.log("zulagenart.test: OK");
