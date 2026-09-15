/**
 * Tests der Blatt-Ableitung (Lauf 6b; angepasst an den Modellwechsel
 * «Massnahme = Leistungsposition») — reines node:assert, ausführbar mit
 *   npx tsx src/lib/pflegeplan/blatt.test.ts
 *
 * Geprüft werden: eine Position ist EINE Zeile, auch wenn sie mehrere Ziele
 * unter mehreren Diagnosen trägt (die frühere Zusammenfassung zweier
 * Interventionen auf einer Position ist im neuen Modell konstruktiv
 * unmöglich — der Store dedupliziert über die Positionsnummer); die
 * Qualifikations-Spalte mit erkennbarem Katalogminimum (V18), die
 * Begründungskette je Position, der Ausschluss von I/A/V und Einmaligen aus
 * den Summen, und dass die Blatt-Gesamtsumme der Wochensumme des Plans
 * entspricht (V9).
 */
import assert from "node:assert/strict";
import { blattAbleiten } from "./blatt";
import { wochenMinuten } from "./planung";
import { leistungsposition } from "./mock-adapter";
import {
  planZuruecksetzen, planSchnappschuss,
  diagnoseUebernehmen, diagnosePriorisieren, zielUebernehmen,
  massnahmeVerknuepfen, massnahmePlanen,
} from "./plan-store";

planZuruecksetzen();
diagnoseUebernehmen({ code: "00155", titel: "Sturzgefahr", typ: "risiko", belegZeile: "Test", ausloesendeCaps: ["CAP-FALLS"], hinzugefuegtVon: "T. Test", hinzugefuegtAm: "2026-08-04" });
diagnoseUebernehmen({ code: "00085", titel: "Beeinträchtigte körperliche Mobilität", typ: "problem", belegZeile: "Test", ausloesendeCaps: ["CAP-FALLS"], hinzugefuegtVon: "T. Test", hinzugefuegtAm: "2026-08-04" });
zielUebernehmen({ zielId: "Z-STURZFREI", diagnoseCode: "00155", titel: "Bleibt im Beobachtungszeitraum sturzfrei", eigenes: false });
zielUebernehmen({ zielId: "Z-BALANCE", diagnoseCode: "00085", titel: "Verbesserte Gleichgewichtsfähigkeit", eigenes: false });
zielUebernehmen({ zielId: "Z-BEWEGLICH", diagnoseCode: "00085", titel: "Erhält die Gelenkbeweglichkeit", eigenes: false });

/* EINE Position (10506), DREI Ziele unter zwei Diagnosen — der Store führt
   sie als eine Massnahme mit drei Zielbezügen. */
massnahmeVerknuepfen("10506", "Aktive/passive Bewegungsunterstützung", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });
massnahmeVerknuepfen("10506", "Aktive/passive Bewegungsunterstützung", { diagnoseCode: "00085", zielId: "Z-BALANCE" });
massnahmeVerknuepfen("10506", "Aktive/passive Bewegungsunterstützung", { diagnoseCode: "00085", zielId: "Z-BEWEGLICH" });
massnahmePlanen("10506", { wiederholung: "taeglich", anzahl: 2, qualifikation: "FaGe" }); // 2 × 7 × 17 = 238

/* Tägliche Einzelposition, Einmalige, Nicht-durch-uns. */
massnahmeVerknuepfen("10103", "Teilwäsche im Bett (inkl. Intimpflege)", { diagnoseCode: "00085", zielId: "Z-BEWEGLICH" });
massnahmePlanen("10103", { wiederholung: "taeglich", anzahl: 1 }); // 7 × 20 = 140
massnahmeVerknuepfen("10901", "Sturzrisiko-Assessment", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });
massnahmePlanen("10901", { wiederholung: "einmalig", einmalDatum: "2026-08-20" }); // 60 min, NICHT in der Woche
massnahmeVerknuepfen("10107", "Haare waschen", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });
massnahmePlanen("10107", { wiederholung: "woechentlich", wochentage: [1], erbringer: "A", erbringerNotiz: "Coiffeuse kommt ins Haus." });

const plan = planSchnappschuss();
const blatt = blattAbleiten(plan);

/* ── 1: Eine Position, eine Zeile — der Store dedupliziert über die Nummer ── */
{
  const c = blatt.abschnitte.find(a => a.klv === "c")!;
  const zeilen10506 = c.zeilen.filter(z => z.nummer === "10506");
  assert.equal(zeilen10506.length, 1, "10506 erscheint als genau eine Zeile");
  const zeile = zeilen10506[0];
  assert.equal(zeile.teile.length, 1, "eine Massnahme = ein Zustand = eine Unterzeile, trotz dreier Zielbezüge");
  assert.equal(zeile.wochenMin, 238, "Wochenminuten: 2 × 7 × 17 = 238 — einmal gezählt, nie je Zielbezug");
  console.log("✓ 1  Eine Position, eine Zeile: 10506 einmal, 238 min, drei Zielbezüge zählen nicht dreifach");
}

/* ── 2 (V18): zugewiesene Qualifikation als Leitgrösse, Minimum erkennbar ── */
{
  const c = blatt.abschnitte.find(a => a.klv === "c")!;
  const bewegung = c.zeilen.find(z => z.nummer === "10506")!.teile[0];
  const teilwaesche = c.zeilen.find(z => z.nummer === "10103")!.teile[0];
  assert.equal(bewegung.qualifikation, "FaGe", "zugewiesene Qualifikation ist die Leitgrösse");
  assert.equal(bewegung.katalogMinimum, "Pflegehelfer/in SRK", "das Minimum steht daneben, weil die Zuweisung abweicht");
  assert.equal(teilwaesche.qualifikation, "Pflegehelfer/in SRK", "ohne Zuweisung gilt das Katalogminimum");
  assert.equal(teilwaesche.katalogMinimum, null, "…und wird nicht doppelt genannt");
  console.log("✓ 2  V18: Qualifikation je Zeile, Minimum als solches erkennbar");
}

/* ── 3: Begründungskette je Position — die Zielbezüge tragen sie ── */
{
  const zeile = blatt.abschnitte.find(a => a.klv === "c")!.zeilen.find(z => z.nummer === "10506")!;
  const paare = zeile.traeger.map(t => `${t.diagnoseCode}|${t.zielId}`).sort();
  assert.deepEqual(paare, ["00085|Z-BALANCE", "00085|Z-BEWEGLICH", "00155|Z-STURZFREI"],
    "drei Ziele unter zwei Diagnosen tragen die Position");
  assert.equal(zeile.traeger.find(t => t.zielId === "Z-STURZFREI")?.diagnoseTitel, "Sturzgefahr", "Titel aufgelöst");

  /* Priorität (Lauf 6d): ändert am Blatt NUR die Reihenfolge, nie die Zahlen. */
  diagnosePriorisieren("00085", "wichtig", "T. Test", "2026-08-04");
  const blatt2 = blattAbleiten(planSchnappschuss());
  const zeile2 = blatt2.abschnitte.find(a => a.klv === "c")!.zeilen.find(z => z.nummer === "10506")!;
  assert.equal(zeile2.traeger[0].diagnoseCode, "00085", "wichtige Diagnose trägt zuerst");
  assert.equal(zeile2.traeger[zeile2.traeger.length - 1].diagnoseCode, "00155", "normale danach");
  assert.equal(zeile2.wochenMin, zeile.wochenMin, "…und nur die Reihenfolge ändert sich, nie die Zahlen");
  diagnosePriorisieren("00085", "normal", "T. Test", "2026-08-04");
  console.log("✓ 3  Begründungskette: 10506 von drei Zielen unter zwei Diagnosen getragen; Priorität ordnet, rechnet nicht");
}

/* ── 4: Einmalige und I/A/V ausserhalb der Summen ── */
{
  assert.equal(blatt.einmalige.length, 1);
  assert.equal(blatt.einmalige[0].nummer, "10901");
  assert.equal(blatt.einmalige[0].minuten, 60, "einmalig: Minuten je Einsatz, nicht je Woche");
  assert.ok(!blatt.abschnitte.some(a => a.zeilen.some(z => z.nummer === "10901")), "10901 steht nicht in der Wochentabelle");

  assert.equal(blatt.nichtErbracht.length, 1);
  assert.equal(blatt.nichtErbracht[0].erbringerLabel, "A – Andere Anbieter");
  assert.equal(blatt.nichtErbracht[0].begruendung, "Coiffeuse kommt ins Haus.");
  assert.equal(blatt.nichtErbracht[0].positionsNummer, "10107", "die Position steht am I/A/V-Eintrag — sie existiert immer");
  assert.ok(!blatt.abschnitte.some(a => a.zeilen.some(z => z.nummer === "10107")), "10107 (A) steht nicht in der Tabelle");
  console.log("✓ 4  Einmalige (60 min separat) und A-Erbringer stehen ausserhalb der Summen");
}

/* ── 5 (V9): Blatt-Gesamtsumme == Wochensumme des Plans ── */
{
  /* Die Wochensumme, wie der Plan-Kopf sie rechnet: alle S-Massnahmen,
     Dauer = eigener Wert oder Positionsvorgabe. */
  const planSumme = plan.massnahmen
    .filter(m => m.planung.erbringer === "S")
    .reduce((s, m) => s + wochenMinuten(
      m.planung,
      m.planung.dauerMin ?? leistungsposition(m.positionsNummer)?.vorgabeMinuten ?? null,
    ), 0);
  assert.equal(blatt.gesamtWochenMin, 238 + 140, "Kategoriensummen: 238 + 140 = 378");
  assert.equal(blatt.gesamtWochenMin, planSumme, "Blatt-Gesamtsumme == Wochensumme des Plans");
  console.log("✓ 5  V9: Gesamtsumme des Blattes (378 min) entspricht der Wochensumme des Plans");
}

planZuruecksetzen();
console.log("\nAlle Blatt-Tests bestanden.");
