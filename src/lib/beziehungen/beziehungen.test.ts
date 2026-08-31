/**
 * kategorieFuerRolle — die einzige Stelle der Rolle→Kategorie-Zuordnung.
 * Lauf mit: npx tsx src/lib/beziehungen/beziehungen.test.ts
 */
import assert from "node:assert";
import { BEZIEHUNGSROLLE, kategorieFuerRolle, ROLLEN_JE_KATEGORIE } from "./beziehungen";

// Jede Rolle hat genau eine Kategorie.
for (const r of BEZIEHUNGSROLLE) {
  const k = kategorieFuerRolle(r.code);
  assert.ok(["benutzer", "fachpersonal", "bezugsperson"].includes(k), `${r.code} ohne gültige Kategorie`);
}

// Konkrete Zuordnungen.
assert.strictEqual(kategorieFuerRolle("hausarzt"), "fachpersonal");
assert.strictEqual(kategorieFuerRolle("therapie"), "fachpersonal");
assert.strictEqual(kategorieFuerRolle("apotheke"), "fachpersonal");
assert.strictEqual(kategorieFuerRolle("bezugsperson"), "benutzer");
assert.strictEqual(kategorieFuerRolle("stellvertretung"), "benutzer");
assert.strictEqual(kategorieFuerRolle("angehoerige"), "bezugsperson");
assert.strictEqual(kategorieFuerRolle("beistand"), "bezugsperson");
assert.strictEqual(kategorieFuerRolle("sozialdienst"), "bezugsperson");
assert.strictEqual(kategorieFuerRolle("weitere"), "bezugsperson");

// pflegende_angehoerige gruppiert unter Bezugsperson, ist aber nicht im Dialog wählbar.
assert.strictEqual(kategorieFuerRolle("pflegende_angehoerige"), "bezugsperson");
assert.ok(!ROLLEN_JE_KATEGORIE.bezugsperson.includes("pflegende_angehoerige" as never), "pflegende_angehoerige darf nicht wählbar sein");

// Wählbare Rollen decken sich mit der Kategorie.
for (const [kat, rollen] of Object.entries(ROLLEN_JE_KATEGORIE)) {
  for (const r of rollen) assert.strictEqual(kategorieFuerRolle(r), kat, `${r} nicht in ${kat}`);
}

console.log("beziehungen.test: OK");
