/**
 * Tests der Blatt-Ableitung (Lauf 6b) — reines node:assert, ausführbar mit
 *   npx tsx src/lib/pflegeplan/blatt.test.ts
 *
 * Geprüft werden: die Zusammenfassung zweier Massnahmen auf einer Position
 * (Zeit summiert, Rest gestapelt), die gestapelten Qualifikationen mit
 * erkennbarem Katalogminimum (V18), die Begründungskette je Position, der
 * Ausschluss von I/A/V und Einmaligen aus den Summen, und dass die
 * Blatt-Gesamtsumme der Wochensumme des Plans entspricht (V9).
 */
import assert from "node:assert/strict";
import { blattAbleiten } from "./blatt";
import { wochenMinuten } from "./planung";
import { positionFuer } from "./mock-adapter";
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

/* Die Doppelbelegung: zwei Massnahmen auf 10506, drei Ziele, zwei Diagnosen. */
massnahmeVerknuepfen("I-GLEICHGEWICHT", "Gleichgewichts- und Kraftübungen anleiten", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });
massnahmeVerknuepfen("I-GLEICHGEWICHT", "Gleichgewichts- und Kraftübungen anleiten", { diagnoseCode: "00085", zielId: "Z-BALANCE" });
massnahmePlanen("I-GLEICHGEWICHT", { wiederholung: "woechentlich", wochentage: [0, 2, 4], anzahl: 1 }); // 3 × 17 = 51
massnahmeVerknuepfen("I-BEWEGUNG", "Aktive und passive Bewegungsübungen durchführen", { diagnoseCode: "00085", zielId: "Z-BEWEGLICH" });
massnahmePlanen("I-BEWEGUNG", { wiederholung: "taeglich", anzahl: 2, qualifikation: "FaGe" }); // 2 × 7 × 17 = 238

/* Wöchentliche Einzelposition, Einmalige, Nicht-durch-uns, Planerische. */
massnahmeVerknuepfen("I-TEILWAESCHE", "Teilwäsche durchführen", { diagnoseCode: "00085", zielId: "Z-BEWEGLICH" });
massnahmePlanen("I-TEILWAESCHE", { wiederholung: "taeglich", anzahl: 1 }); // 7 × 20 = 140
massnahmeVerknuepfen("I-STURZASSESS", "Sturzrisiko-Assessment durchführen", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });
massnahmePlanen("I-STURZASSESS", { wiederholung: "einmalig", einmalDatum: "2026-08-20" }); // 60 min, NICHT in der Woche
massnahmeVerknuepfen("I-HAARWAESCHE", "Haare waschen", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });
massnahmePlanen("I-HAARWAESCHE", { wiederholung: "woechentlich", wochentage: [1], erbringer: "A", erbringerNotiz: "Coiffeuse kommt ins Haus." });
massnahmeVerknuepfen("I-WOHNUMFELD", "Wohnumfeld anpassen und Gefahrenquellen beseitigen", { diagnoseCode: "00155", zielId: "Z-STURZFREI" });

const plan = planSchnappschuss();
const blatt = blattAbleiten(plan);

/* ── 1: Zusammenfassung — eine Zeile 10506, Zeit summiert, Rest gestapelt ── */
{
  const c = blatt.abschnitte.find(a => a.klv === "c")!;
  const zeile = c.zeilen.find(z => z.nummer === "10506")!;
  assert.ok(zeile, "10506 erscheint als eine Zeile");
  assert.equal(zeile.teile.length, 2, "zwei gestapelte Unterzeilen, keine Verrechnung");
  assert.equal(zeile.wochenMin, 51 + 238, "Wochenminuten summiert: 51 + 238 = 289");
  const haeufigkeiten = zeile.teile.map(t => t.haeufigkeit);
  assert.ok(haeufigkeiten.some(h => h?.includes("wöchentlich")) && haeufigkeiten.some(h => h?.includes("täglich")),
    "Häufigkeiten bleiben je Massnahme stehen — nie addiert");
  console.log("✓ 1  Zusammenfassung: eine Zeile, Zeit summiert (289 min), Häufigkeiten gestapelt");
}

/* ── 2 (V18): Qualifikationen gestapelt, Katalogminimum erkennbar ── */
{
  const zeile = blatt.abschnitte.find(a => a.klv === "c")!.zeilen.find(z => z.nummer === "10506")!;
  const bewegung = zeile.teile.find(t => t.massnahmeTitel.startsWith("Aktive"))!;
  const gleichgewicht = zeile.teile.find(t => t.massnahmeTitel.startsWith("Gleichgewichts"))!;
  assert.equal(bewegung.qualifikation, "FaGe", "zugewiesene Qualifikation ist die Leitgrösse");
  assert.equal(bewegung.katalogMinimum, "Pflegehelfer/in SRK", "das Minimum steht daneben, weil die Zuweisung abweicht");
  assert.equal(gleichgewicht.qualifikation, "Pflegehelfer/in SRK", "ohne Zuweisung gilt das Katalogminimum");
  assert.equal(gleichgewicht.katalogMinimum, null, "…und wird nicht doppelt genannt");
  assert.notEqual(bewegung.qualifikation, gleichgewicht.qualifikation, "verschiedene Zuweisungen bleiben verschieden — kein Maximum");
  console.log("✓ 2  V18: Qualifikationen je Unterzeile, Minimum als solches erkennbar, kein Maximum");
}

/* ── 3: Begründungskette je Position — Vereinigung über die Massnahmen ── */
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
  /* V18 (Lauf 6e): jede Massnahme trägt auf dem Blatt GENAU eine Unterzeile
     mit Zeit — auch nach der Prioritätsänderung. */
  const gleichgewichtZeilen = blatt2.abschnitte
    .flatMap(a => a.zeilen)
    .flatMap(z => z.teile)
    .filter(t => t.massnahmeTitel === "Gleichgewichts- und Kraftübungen anleiten");
  assert.equal(gleichgewichtZeilen.length, 1, "eine Massnahme, eine Unterzeile — trotz zweier Diagnosen am ersten Bezugsziel");
  diagnosePriorisieren("00085", "normal", "T. Test", "2026-08-04");
  console.log("✓ 3  Begründungskette: 10506 von drei Zielen unter zwei Diagnosen getragen; Priorität ordnet, rechnet nicht");
}

/* ── 4: Einmalige und I/A/V ausserhalb der Summen; Planerische ausgewiesen ── */
{
  assert.equal(blatt.einmalige.length, 1);
  assert.equal(blatt.einmalige[0].nummer, "10901");
  assert.equal(blatt.einmalige[0].minuten, 60, "einmalig: Minuten je Einsatz, nicht je Woche");
  assert.ok(!blatt.abschnitte.some(a => a.zeilen.some(z => z.nummer === "10901")), "10901 steht nicht in der Wochentabelle");

  assert.equal(blatt.nichtErbracht.length, 1);
  assert.equal(blatt.nichtErbracht[0].erbringerLabel, "A – Andere Anbieter");
  assert.equal(blatt.nichtErbracht[0].begruendung, "Coiffeuse kommt ins Haus.");
  assert.ok(!blatt.abschnitte.some(a => a.zeilen.some(z => z.nummer === "10107")), "10107 (A) steht nicht in der Tabelle");

  assert.deepEqual(blatt.ohnePosition.map(o => o.massnahmeTitel), ["Wohnumfeld anpassen und Gefahrenquellen beseitigen"],
    "planerische Massnahme wird ausgewiesen, nicht verschwiegen");
  console.log("✓ 4  Einmalige (60 min separat), A-Erbringer und Planerische stehen ausserhalb der Summen");
}

/* ── 5 (V9): Blatt-Gesamtsumme == Wochensumme des Plans ── */
{
  /* Die Wochensumme, wie der Plan-Kopf sie rechnet: alle S-Massnahmen,
     Dauer = eigener Wert oder Positionsvorgabe. */
  const planSumme = plan.massnahmen
    .filter(m => m.planung.erbringer === "S")
    .reduce((s, m) => s + wochenMinuten(
      m.planung,
      m.planung.dauerMin ?? positionFuer(m.interventionId, m.planung.detailAuswahl)?.vorgabeMinuten ?? null,
    ), 0);
  assert.equal(blatt.gesamtWochenMin, 289 + 140, "Kategoriensummen: 289 + 140 = 429");
  assert.equal(blatt.gesamtWochenMin, planSumme, "Blatt-Gesamtsumme == Wochensumme des Plans");
  console.log("✓ 5  V9: Gesamtsumme des Blattes (429 min) entspricht der Wochensumme des Plans");
}

planZuruecksetzen();
console.log("\nAlle Blatt-Tests bestanden.");
