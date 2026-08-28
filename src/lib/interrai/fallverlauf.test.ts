/**
 * Unit-Tests für das Fallverlauf-Anzeigemodell — reines node:assert, ausführbar mit
 *   npx tsx src/lib/interrai/fallverlauf.test.ts
 *
 * V13 (Anzeige und Regel stimmen überein): Jedes vom Modell angebotene „Eröffnen"
 * (nächster Schritt) ist durch kannFormularEroeffnen gedeckt. V8: höchstens ein
 * nächster Schritt je Fall. Dazu die konkreten Seed-Fälle (Route, Reassessment,
 * geschlossener Fall).
 */
import assert from "node:assert/strict";
import { fallverlaufFuerKlient, type FormularZeile } from "./fallverlauf";
import { kannFormularEroeffnen, fallStatus } from "./store";

const naechste = (zeilen: { art: string }[]) =>
  zeilen.filter((z): z is FormularZeile => z.art === "formular" && (z as FormularZeile).zustand === "naechster_schritt");

// ── V8 + V13 über alle Seed-Klienten/Fälle ───────────────────────────────────
for (const klient of ["PERS-001", "PERS-002", "PERS-003", "PERS-004"]) {
  for (const m of fallverlaufFuerKlient(klient)) {
    const ns = naechste(m.zeilen);
    assert.ok(ns.length <= 1, `${m.fallId}: höchstens ein nächster Schritt (V8), war ${ns.length}`);
    for (const z of ns) {
      assert.ok(z.typ, `${m.fallId}: nächster Schritt trägt einen Formulartyp`);
      assert.equal(
        kannFormularEroeffnen(m.fallId, z.typ!).zulaessig, true,
        `${m.fallId} ${z.typ}: Anzeige bietet Eröffnen, aber die Regel verbietet es (V13)`,
      );
    }
  }
}

// ── Fall B (PERS-002, housekeeping): Hauswirtschaft ist der nächste Schritt ───
{
  const mB = fallverlaufFuerKlient("PERS-002")[0];
  const ns = naechste(mB.zeilen);
  assert.equal(ns.length, 1);
  assert.equal(ns[0].typ, "housekeeping");
}

// ── Fall D (PERS-004, palliative): Hinweisblock, Entlassung ist nächster Schritt
{
  const mD = fallverlaufFuerKlient("PERS-004")[0];
  assert.ok(mD.zeilen.some((z) => z.art === "hinweis"), "palliativ → Hinweisblock statt Abklärungszeile");
  const ns = naechste(mD.zeilen);
  assert.equal(ns.length, 1);
  assert.equal(ns[0].typ, "discharge");
}

// ── PERS-003: offener Fall zuoberst; Reassessment; geschlossener Fall gesperrt ─
{
  const [mCneu, mCalt] = fallverlaufFuerKlient("PERS-003");
  // Reassessment: zwei HC-Zeilen mit Erst- und Reassessment-2-Titel (V11)
  const hc = mCneu.zeilen.filter((z): z is FormularZeile => z.art === "formular" && (z as FormularZeile).typ === "interrai_hc");
  assert.equal(hc.length, 2);
  assert.ok(hc[0].titel.includes("Erstassessment"), `erwartet Erstassessment, war "${hc[0].titel}"`);
  assert.ok(hc[1].titel.includes("Reassessment 2"), `erwartet Reassessment 2, war "${hc[1].titel}"`);
  assert.equal(naechste(mCneu.zeilen).length, 0, "HC2 in Bearbeitung → kein nächster Schritt");
  // Geschlossener Fall: alle Formularzeilen gesperrt, kein nächster Schritt (V10)
  assert.equal(fallStatus(mCalt.fallId), "discharged");
  assert.equal(naechste(mCalt.zeilen).length, 0);
  assert.ok(
    mCalt.zeilen.every((z) => z.art === "hinweis" || (z as FormularZeile).zustand === "gesperrt"),
    "geschlossener Fall: alle Zeilen gesperrt",
  );
}

// ── Fall A (PERS-001): Registrierung gesperrt, HC in Bearbeitung, kein nächster Schritt
{
  const mA = fallverlaufFuerKlient("PERS-001")[0];
  assert.equal(naechste(mA.zeilen).length, 0);
  assert.ok(mA.zeilen.some((z) => z.art === "formular" && (z as FormularZeile).zustand === "in_bearbeitung"));
}

console.log("fallverlauf.test.ts: alle Zusicherungen erfüllt");
