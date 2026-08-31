/**
 * Telefon-Formatierung und -Prüfung.
 * Lauf mit: npx tsx src/lib/telefon.test.ts
 */
import assert from "node:assert";
import { formatTelefon, pruefeTelefon } from "./telefon";

// Schweizer Nummern → internationale Form.
assert.strictEqual(formatTelefon("0441234567"), "+41 44 123 45 67");
assert.strictEqual(formatTelefon("044 123 45 67"), "+41 44 123 45 67");
assert.strictEqual(formatTelefon("+41 44 123 45 67"), "+41 44 123 45 67");
assert.strictEqual(formatTelefon("0041 44 123 45 67"), "+41 44 123 45 67");
assert.strictEqual(formatTelefon("079 412 55 08"), "+41 79 412 55 08");

// Ausländische Nummern bleiben unverändert.
assert.strictEqual(formatTelefon("+49 30 12345678"), "+49 30 12345678");
assert.strictEqual(formatTelefon("+33 1 42 68 53 00"), "+33 1 42 68 53 00");

// Nicht deutbar → wie getippt (kein Blockieren, aber Prüfung schlägt an).
assert.strictEqual(formatTelefon("12345"), "12345");
assert.strictEqual(formatTelefon(""), "");

// Prüfung.
assert.strictEqual(pruefeTelefon("0441234567").gueltig, true);
assert.strictEqual(pruefeTelefon("+41 44 123 45 67").gueltig, true);
assert.strictEqual(pruefeTelefon("+49 30 12345678").gueltig, true);
assert.strictEqual(pruefeTelefon("").gueltig, true); // optional
assert.strictEqual(pruefeTelefon("12345").gueltig, false);
assert.ok(pruefeTelefon("12345").hinweis, "ungültige Nummer trägt einen Hinweis");

console.log("telefon.test: OK");
