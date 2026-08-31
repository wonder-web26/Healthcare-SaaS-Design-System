/**
 * Unit-Tests für das Versicherungs-Datenmodell — reines node:assert, ausführbar mit
 *   npx tsx src/lib/versicherung/store.test.ts
 *
 * V8 istAktiv/aktiveVersicherung über Stichtag vor/während/nach + offenes Ende;
 * V6 Kassenwechsel befristet die bisherige auf den Vortag; V7 keine zwei aktiven
 * desselben Typs.
 */
import assert from "node:assert/strict";
import {
  istAktiv,
  aktiveVersicherung,
  addVersicherung,
  versicherungenFuerPatient,
  TYP_PFLICHTFELDER,
  type Versicherungsverhaeltnis,
} from "./store";

const mk = (over: Partial<Versicherungsverhaeltnis>): Versicherungsverhaeltnis => ({
  id: "x", patientId: "P", typ: "kvg", versichererId: "css",
  gueltigAb: "2025-01-01", gueltigBis: null,
  kartennummer: "1", policennummer: null, schadennummer: null,
  verfuegungsnummer: null, unfalldeckung: "unbekannt", unfalldatum: null,
  verfuegungsdatum: null, bemerkung: null,
  ...over,
});

// ── V11: typabhängige Pflichtfelder über alle fünf Typen ─────────────────────
assert.deepEqual(TYP_PFLICHTFELDER.kvg, ["kartennummer", "unfalldeckung"]);
assert.deepEqual(TYP_PFLICHTFELDER.vvg, ["policennummer"]);
assert.deepEqual(TYP_PFLICHTFELDER.uvg, ["schadennummer", "unfalldatum"]);
assert.deepEqual(TYP_PFLICHTFELDER.ivg, ["verfuegungsnummer", "verfuegungsdatum"]);
assert.deepEqual(TYP_PFLICHTFELDER.mvg, ["verfuegungsnummer"]);

// ── V8: istAktiv über den Zeitraum ───────────────────────────────────────────
const befristet = mk({ gueltigAb: "2025-06-01", gueltigBis: "2025-12-31" });
assert.equal(istAktiv(befristet, "2025-05-01"), false, "vor dem Zeitraum → inaktiv");
assert.equal(istAktiv(befristet, "2025-08-01"), true, "während → aktiv");
assert.equal(istAktiv(befristet, "2026-01-01"), false, "nach dem Zeitraum → inaktiv");
assert.equal(istAktiv(befristet, "2025-06-01"), true, "Startrand inklusiv");
assert.equal(istAktiv(befristet, "2025-12-31"), true, "Endrand inklusiv");
assert.equal(istAktiv(mk({ gueltigAb: "2025-06-01", gueltigBis: null }), "2030-01-01"), true, "offenes Ende → laufend aktiv");

// ── V6 + V7: Kassenwechsel, keine zwei gleichzeitig aktiven desselben Typs ────
{
  const P = "P-TEST-KW";
  addVersicherung(mk({ patientId: P, typ: "kvg", versichererId: "css", gueltigAb: "2025-01-01", gueltigBis: null }));
  assert.equal(aktiveVersicherung(P, "kvg", "2025-06-01")?.versichererId, "css");

  // Zweite aktive KVG anlegen → Kassenwechsel
  addVersicherung(mk({ patientId: P, typ: "kvg", versichererId: "helsana", gueltigAb: "2026-01-01", gueltigBis: null }));

  const aktivNach = versicherungenFuerPatient(P, "2026-06-01").filter(v => v.typ === "kvg" && istAktiv(v, "2026-06-01"));
  assert.equal(aktivNach.length, 1, "V7: nur eine aktive KVG");
  assert.equal(aktivNach[0].versichererId, "helsana", "die neue ist aktiv");

  const alte = versicherungenFuerPatient(P).find(v => v.versichererId === "css");
  assert.equal(alte?.gueltigBis, "2025-12-31", "V6: bisherige auf den Vortag befristet");
  assert.equal(istAktiv(alte!, "2026-06-01"), false, "die bisherige ist nicht mehr aktiv");
}

// ── Ein anderer Typ kollidiert nicht mit der KVG ─────────────────────────────
{
  const P = "P-TEST-TYP";
  addVersicherung(mk({ patientId: P, typ: "kvg", versichererId: "css", gueltigAb: "2025-01-01", schadennummer: null }));
  addVersicherung(mk({ patientId: P, typ: "uvg", versichererId: "suva", gueltigAb: "2025-01-01", kartennummer: null, schadennummer: "SC-1" }));
  assert.ok(aktiveVersicherung(P, "kvg", "2025-06-01"), "KVG weiter aktiv");
  assert.ok(aktiveVersicherung(P, "uvg", "2025-06-01"), "UVG aktiv");
}

console.log("versicherung/store.test.ts: alle Zusicherungen erfüllt");
