/**
 * Unit-Tests für den abweichenden Pflegeort — node:assert, ausführbar mit
 *   npx tsx src/lib/patienten/store.test.ts
 *
 * pflegeAdresse liefert den Pflegeort, wenn abweichend, sonst die
 * Wohnsitzadresse — kein Aufrufer entscheidet das selbst.
 */
import assert from "node:assert/strict";
import { pflegeAdresse, aktualisierePatient, getPatient } from "./store";
import { patientGemeinde } from "../../app/components/patientData";

const ID = "P-2026-0041"; // Seed-Patient
const p = getPatient(ID);
assert.ok(p, "Seed-Patient vorhanden");

// Nicht abweichend → Wohnsitzadresse.
{
  const a = pflegeAdresse(ID);
  assert.ok(a);
  assert.equal(a!.abweichend, false);
  assert.equal(a!.strasse, p!.strasse);
  assert.equal(a!.plz, p!.plz);
  assert.equal(a!.ort, p!.ort);
}

// Abweichend → Pflegeort.
aktualisierePatient(ID, {
  pflegeortAbweichend: true, pflegeortStrasse: "Rosenweg 14", pflegeortPlz: "8400", pflegeortOrt: "Winterthur",
});
{
  const a = pflegeAdresse(ID);
  assert.ok(a);
  assert.equal(a!.abweichend, true);
  assert.equal(a!.strasse, "Rosenweg 14");
  assert.equal(a!.plz, "8400");
  assert.equal(a!.ort, "Winterthur");
  assert.notEqual(a!.ort, p!.ort, "Pflegeort weicht vom Wohnsitz ab");
}

// Zurückgesetzt → wieder Wohnsitz.
aktualisierePatient(ID, { pflegeortAbweichend: false });
assert.equal(pflegeAdresse(ID)!.ort, p!.ort);

// Unbekannter Patient → null.
assert.equal(pflegeAdresse("P-GIBTS-NICHT"), null);

// ── politische Gemeinde: `gemeinde` hält immer den Namen (kein Abweichend-Schalter) ──
{
  const ort = getPatient(ID)!.ort;
  // Migration: der Seed hält die Gemeinde als Namen (= Ort, weil vormals nicht abweichend).
  assert.equal(getPatient(ID)!.gemeinde, ort, "Seed: gemeinde = Ort nach Migration");
  assert.equal(patientGemeinde(getPatient(ID)!), ort, "patientGemeinde liefert die erfasste Gemeinde");

  // Abweichende Gemeinde erfassen → patientGemeinde liefert sie.
  aktualisierePatient(ID, { gemeinde: "Illnau-Effretikon" });
  assert.equal(patientGemeinde(getPatient(ID)!), "Illnau-Effretikon");
  assert.notEqual(patientGemeinde(getPatient(ID)!), ort);

  // Zurück auf den Ort.
  aktualisierePatient(ID, { gemeinde: ort });
  assert.equal(patientGemeinde(getPatient(ID)!), ort);
}

console.log("patienten/store.test.ts: alle Zusicherungen erfüllt");
