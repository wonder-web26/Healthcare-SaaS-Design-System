/**
 * Tests der Planungslogik (Lauf 3) — reines node:assert, ausführbar mit
 *   npx tsx src/lib/pflegeplan/planung.test.ts
 *
 * 15a ersetzt die Browser-Beobachtung des Mandatsfelds: der Mock-Klient hat
 * genau ein Mandat (lib/mandate bleibt bis Lauf 6 unberührt), die Logik für
 * mehrere ist hier belegt.
 */
import assert from "node:assert/strict";
import { LEERE_PLANUNG, type MassnahmenPlanung } from "./plan-store";
import { wochenMinuten, mandatAuswahlSichtbar, mandatImSatz, massnahmenSatz, haeufigkeitsText } from "./planung";

const p = (patch: Partial<MassnahmenPlanung>): MassnahmenPlanung => ({ ...LEERE_PLANUNG, ...patch });

/* ── 15a: Mandats-Sichtbarkeit und Satz-Regel ── */
{
  const eins = [{ id: "M1", label: "KVG Pflege" }];
  const zwei = [{ id: "M1", label: "KVG Pflege" }, { id: "M2", label: "UVG Unfall" }];

  assert.equal(mandatAuswahlSichtbar(eins), false, "ein Mandat: Auswahl unsichtbar");
  assert.equal(mandatAuswahlSichtbar(zwei), true, "zwei Mandate: Auswahl sichtbar");

  const satzEins = massnahmenSatz(p({ mandatId: "M1" }), { positionsText: "Position 10101", vorgabeMinuten: 40, qualifikation: null }, eins);
  assert.ok(!satzEins.some(t => t.text.includes("KVG")), "ein Mandat: der Satz nennt es nie");

  const satzErstes = massnahmenSatz(p({ mandatId: "M1" }), { positionsText: "Position 10101", vorgabeMinuten: 40, qualifikation: null }, zwei);
  assert.ok(!satzErstes.some(t => t.text.includes("KVG") || t.text.includes("UVG")), "erstes von zweien: nicht im Satz");

  const satzZweites = massnahmenSatz(p({ mandatId: "M2" }), { positionsText: "Position 10101", vorgabeMinuten: 40, qualifikation: null }, zwei);
  assert.ok(satzZweites.some(t => t.text === "UVG Unfall" && t.fett), "zweites von zweien: im Satz, fett");
  console.log("✓ 15a Mandat: unsichtbar bei einem, sichtbar bei zweien, im Satz nur wenn nicht das erste");
}

/* ── Wochenzeit: Umrechnung je Wiederholungsform ── */
{
  assert.equal(wochenMinuten(p({ wiederholung: null }), 40), 0, "ungeplant zählt null");
  assert.equal(wochenMinuten(p({ wiederholung: "einmalig" }), 40), 0, "einmalig zählt null");
  assert.equal(wochenMinuten(p({ wiederholung: "taeglich", anzahl: 1 }), 40), 280, "täglich ×7");
  assert.equal(wochenMinuten(p({ wiederholung: "taeglich", anzahl: 3 }), 10), 210, "Anzahl je Tag zählt mit");
  assert.equal(wochenMinuten(p({ wiederholung: "werktage", anzahl: 1 }), 20), 100, "Werktage ×5");
  assert.equal(wochenMinuten(p({ wiederholung: "woechentlich", anzahl: 1, wochentage: [0, 2, 4] }), 40), 120, "wöchentlich × gewählte Tage");
  assert.equal(Math.round(wochenMinuten(p({ wiederholung: "monatlich", anzahl: 2 }), 60)), 28, "monatlich ÷ 4.33");
  assert.equal(wochenMinuten(p({ wiederholung: "benutzerdefiniert", anzahl: 1, intervallN: 2, intervallEinheit: "tage" }), 30), 105, "alle 2 Tage → 3.5 Vorkommen");
  console.log("✓ WZ Wochenzeit-Umrechnung deckt alle sechs Formen");
}

/* ── Satzzeile: fett nur Gesetztes, Warnteil bei Nicht-S ── */
{
  const katalog = { positionsText: "Position 10102 Ganzwäsche", vorgabeMinuten: 40, qualifikation: "Pflegehelfer/in SRK" };
  const ungeplant = massnahmenSatz(LEERE_PLANUNG, katalog, []);
  assert.ok(ungeplant.some(t => t.text === "40 min" && !t.fett), "Katalogdauer erscheint, nicht fett");

  const geplant = massnahmenSatz(
    p({ wiederholung: "woechentlich", anzahl: 3, wochentage: [0, 2, 4], tageszeiten: ["nachmittags"], dauerMin: 45 }),
    katalog, []);
  assert.ok(geplant.some(t => t.fett && t.text.includes("3× wöchentlich, Mo Mi Fr") && t.text.includes("nachmittags")), "Gesetztes steht fett im Satz");
  assert.ok(geplant.some(t => t.text === "45 min" && t.fett), "überschriebene Dauer fett");

  const dritte = massnahmenSatz(p({ erbringer: "I" }), katalog, []);
  const warnTeil = dritte.find(t => t.warn);
  assert.ok(warnTeil && warnTeil.text.includes("nicht verrechnet"), "Nicht-S: Warnteil «nicht verrechnet»");
  assert.equal(haeufigkeitsText(p({ wiederholung: "einmalig", einmalDatum: "2026-08-12" })), "einmalig am 12.08.2026");
  console.log("✓ SZ Satzzeile: Katalog normal, Gesetztes fett, Nicht-S gewarnt");
}

console.log("\nAlle Planungstests bestanden.");
