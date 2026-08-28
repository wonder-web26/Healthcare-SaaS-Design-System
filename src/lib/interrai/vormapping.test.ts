/**
 * Unit-Tests für leseVorgemapptesFeld / schreibeVorgemapptesFeld — reines
 * node:assert, ausführbar mit
 *   npx tsx src/lib/interrai/vormapping.test.ts
 *
 * ONBOARDING_ICODE_MAPPING führt nur `spitalaufenthalte` (iA13, Herkunft
 * formular). Die Herkunfts-Verzweigung (klient/fall/formular) wird zusätzlich
 * über die reine Auflösung geprüft: sdaHerkunft klassifiziert die drei Fälle,
 * die Store-/Patient-Zugriffe sind an anderer Stelle getestet.
 */
import assert from "node:assert/strict";
import {
  ONBOARDING_ICODE_MAPPING,
  leseVorgemapptesFeld,
  schreibeVorgemapptesFeld,
} from "./vormapping";
import { sdaHerkunft } from "./katalog/sda-herkunft";
import {
  registrierungFuerOnboarding,
  getOrCreatePersonForOnboarding,
  offenenFallSicherstellen,
  sperreFormular,
} from "./store";

// ── Drei Herkünfte: die Auflösung deckt alle drei ab ─────────────────────────
assert.equal(sdaHerkunft("iA11b"), "klient");   // Wohnsituation → Patient
assert.equal(sdaHerkunft("iA5d"), "fall");      // Fallnummer → nur lesen
assert.equal(sdaHerkunft("iA13"), "formular");  // Spitalaufenthalt → Registrierung

// Das Mapping führt genau die formular-vorgemappten Felder.
assert.equal(ONBOARDING_ICODE_MAPPING["spitalaufenthalte"], "iA13");

// ── formular: lesen (leer) → schreiben (legt Registrierung an) → lesen ───────
{
  const ob = "OB-TEST-VM-1";
  // Person + Fall vorbereiten, damit die Auto-Anlage einen Klienten hat.
  const p = getOrCreatePersonForOnboarding(ob, "Test", "Person");
  offenenFallSicherstellen(p.id);
  assert.equal(registrierungFuerOnboarding(ob), undefined); // noch keine Registrierung
  assert.equal(leseVorgemapptesFeld(ob, "spitalaufenthalte"), undefined);

  schreibeVorgemapptesFeld(ob, "spitalaufenthalte", "2"); // legt die Registrierung an
  const reg = registrierungFuerOnboarding(ob);
  assert.ok(reg, "Schreiben legt das Registrierungsformular an");
  assert.equal(reg!.typ, "registration");
  assert.equal(reg!.answers["iA13"], "2");
  assert.equal(leseVorgemapptesFeld(ob, "spitalaufenthalte"), "2");
}

// ── unbekanntes Feld → undefined, schreiben ist ein No-op ────────────────────
{
  const ob = "OB-TEST-VM-2";
  assert.equal(leseVorgemapptesFeld(ob, "gibtsNicht"), undefined);
  schreibeVorgemapptesFeld(ob, "gibtsNicht", "x"); // kein Wurf, keine Wirkung
  assert.equal(registrierungFuerOnboarding(ob), undefined);
}

// ── Wurf bei gesperrtem Formular ─────────────────────────────────────────────
{
  const ob = "OB-TEST-VM-3";
  const p = getOrCreatePersonForOnboarding(ob, "Test", "Sperr");
  offenenFallSicherstellen(p.id);
  schreibeVorgemapptesFeld(ob, "spitalaufenthalte", "1"); // legt die Registrierung an
  const reg = registrierungFuerOnboarding(ob)!;
  reg.answers["CHBB16"] = "1"; // Route für das Sperren
  reg.status = "vollstaendig";
  sperreFormular(reg.id, "Test");
  assert.throws(() => schreibeVorgemapptesFeld(ob, "spitalaufenthalte", "3"), /gesperrt/);
}

console.log("vormapping.test.ts: alle Zusicherungen erfüllt");
