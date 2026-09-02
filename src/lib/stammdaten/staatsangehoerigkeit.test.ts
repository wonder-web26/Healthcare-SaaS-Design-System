/**
 * Ausländerrechtliche Gruppe der Staatsangehörigkeit.
 * Lauf mit: npx tsx src/lib/stammdaten/staatsangehoerigkeit.test.ts
 */
import assert from "node:assert";
import { staatsangehoerigkeitsgruppe, STAATSANGEHOERIGKEIT } from "./staatsangehoerigkeit";

// Alle neun Einträge — Gruppe wird gelesen, nicht abgeleitet.
assert.strictEqual(staatsangehoerigkeitsgruppe("schweiz"), "schweiz");
assert.strictEqual(staatsangehoerigkeitsgruppe("deutschland"), "eu_efta");
assert.strictEqual(staatsangehoerigkeitsgruppe("frankreich"), "eu_efta");
assert.strictEqual(staatsangehoerigkeitsgruppe("italien"), "eu_efta");
assert.strictEqual(staatsangehoerigkeitsgruppe("oesterreich"), "eu_efta");
assert.strictEqual(staatsangehoerigkeitsgruppe("portugal"), "eu_efta");
assert.strictEqual(staatsangehoerigkeitsgruppe("spanien"), "eu_efta");
assert.strictEqual(staatsangehoerigkeitsgruppe("tuerkei"), "drittstaat");
// „Andere" trägt bewusst keine Gruppe.
assert.strictEqual(staatsangehoerigkeitsgruppe("andere"), null);

// Nicht gesetzt / unbekannter Schlüssel → null.
assert.strictEqual(staatsangehoerigkeitsgruppe(""), null);
assert.strictEqual(staatsangehoerigkeitsgruppe("liechtenstein"), null);

// Die Liste bleibt auf neun Einträge (Seed; produktiv vom Backend).
assert.strictEqual(STAATSANGEHOERIGKEIT.length, 9);

console.log("staatsangehoerigkeit.test: OK");
