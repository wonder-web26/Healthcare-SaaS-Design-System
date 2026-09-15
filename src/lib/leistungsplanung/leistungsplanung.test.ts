/**
 * Tests der Leistungsplanung, Teil 1 (Lauf 7) — Rechenkern D und
 * Übernahme Ü. Reines node:assert, ausführbar mit
 *   npx tsx src/lib/leistungsplanung/leistungsplanung.test.ts
 */
import assert from "node:assert/strict";
import {
  positionsMinuten, blattSummen, klvTotal, tageJeWoche, runde1, stundenMinuten,
  KEIN_ABZUG, WOCHEN_JE_MONAT, type RechenPosition,
} from "./rechenkern";
import { einheitAusWiederholung, katalogHaeufigkeit, uebernahmeErstellen, manuellEinfuegen } from "./uebernahme";
import type { LieferWiederholung } from "./schnittstelle";

const w = (art: LieferWiederholung["art"], rest?: Partial<LieferWiederholung>): LieferWiederholung =>
  ({ art, wochentage: [], intervallN: 2, intervallEinheit: "tage", einmalDatum: "", ...rest });

/* ── D1/D2: Hochrechnung und Rundung ── */
{
  // V12: 3 × t7 zu 5 Minuten — Tag, Monat, Periode, Quartal nachvollziehbar.
  const p: RechenPosition = { leistungsart: "c", einheit: "t7", anzahl: 3, zeit: 5, w: "S" };
  const m = positionsMinuten(p);
  assert.equal(m.monat, 3 * 5 * 7 * WOCHEN_JE_MONAT, "Tag→Monat über 7 Tage × 4.286 Wochen");
  const s = blattSummen([p], 6, KEIN_ABZUG);
  assert.equal(runde1(s.c.tag), runde1(m.monat / 30), "Minuten je Tag = Monat / 30");
  assert.equal(s.c.periode, m.monat * 6, "Periode = Monat × Monate");
  assert.equal(s.c.quartal, m.monat * 3, "Quartal = Monat × 3");
  assert.equal(runde1(450.06), 450.1, "eine Nachkommastelle, keine Viertelstundenrundung");
  assert.equal(stundenMinuten(125), "2:05");
  assert.equal(tageJeWoche("t3"), 3);
  assert.equal(tageJeWoche("w"), null);
  console.log("✓ D1/D2 Hochrechnung 3×t7×5min: Monat/Tag/Periode/Quartal konsistent, Rundung auf 0.1");
}

/* ── D3: Einmalige separat, nie hochgerechnet ── */
{
  const e: RechenPosition = { leistungsart: "a", einheit: "e", anzahl: 1, zeit: 60, w: "S" };
  const s = blattSummen([e], 6, KEIN_ABZUG);
  assert.equal(s.a.monat, 0, "einmalig zählt nicht in den Monat");
  assert.equal(s.a.einmalig, 60, "…sondern in die Einmalig-Summe");
  assert.equal(s.a.periode, 60, "Periode enthält die Einmaligen genau einmal");
  assert.equal(s.a.quartal, 0, "Quartal rechnet nur Laufendes");
  console.log("✓ D3 Einmalige: separat geführt, nie hochgerechnet");
}

/* ── D4: keine stille Multiplikation der Zeit ── */
{
  const p: RechenPosition = { leistungsart: "c", einheit: "t7", anzahl: 1, zeit: 34, w: "S" };
  assert.equal(positionsMinuten(p).monat, 34 * 7 * WOCHEN_JE_MONAT, "34 eingetragen, 34 gerechnet");
  console.log("✓ D4 Der eingetragene Wert ist der geplante Wert");
}

/* ── D5/D6: Nettobedarf und Abzug ── */
{
  const s = blattSummen([
    { leistungsart: "c", einheit: "t7", anzahl: 1, zeit: 10, w: "S" },
    { leistungsart: "c", einheit: "t7", anzahl: 1, zeit: 10, w: "I" },
  ], 3, { ...KEIN_ABZUG, c: 50 });
  const brutto = 10 * 7 * WOCHEN_JE_MONAT;
  assert.equal(s.c.monat, brutto, "nur W=Spitex zählt — die I-Position fällt aus allen Summen");
  assert.equal(s.c.monatNetto, brutto - 50, "Abzug je Leistungsart wirkt auf den Nettobedarf");
  assert.equal(blattSummen([{ leistungsart: "a", einheit: "m", anzahl: 1, zeit: 10, w: "S" }], 1, { ...KEIN_ABZUG, a: 99 }).a.monatNetto, 0,
    "Abzug drückt nie unter null");
  console.log("✓ D5/D6 Nettobedarf: W≠S ausgeschlossen, Abzug begrenzt");
}

/* ── Ü6: Einheiten-Abbildung — nie aufrunden ── */
{
  assert.deepEqual(einheitAusWiederholung(w("taeglich")), { einheit: "t7", abgebildet: false });
  assert.deepEqual(einheitAusWiederholung(w("werktage")), { einheit: "t5", abgebildet: false });
  assert.deepEqual(einheitAusWiederholung(w("woechentlich", { wochentage: [0, 2, 4] })), { einheit: "t3", abgebildet: false });
  assert.deepEqual(einheitAusWiederholung(w("woechentlich", { wochentage: [4] })), { einheit: "w", abgebildet: false });
  assert.deepEqual(einheitAusWiederholung(w("monatlich")), { einheit: "m", abgebildet: false });
  assert.deepEqual(einheitAusWiederholung(w("einmalig")), { einheit: "e", abgebildet: false });
  // V3: alle 2 Tage = 3,5 Tage je Woche → t3, NICHT t4.
  assert.deepEqual(einheitAusWiederholung(w("benutzerdefiniert", { intervallN: 2, intervallEinheit: "tage" })),
    { einheit: "t3", abgebildet: true }, "alle 2 Tage → t3 — nie nach oben gerundet");
  assert.deepEqual(einheitAusWiederholung(w("benutzerdefiniert", { intervallN: 3, intervallEinheit: "tage" })),
    { einheit: "t2", abgebildet: true }, "alle 3 Tage = 2,33 → t2");
  assert.deepEqual(einheitAusWiederholung(w("benutzerdefiniert", { intervallN: 5, intervallEinheit: "tage" })),
    { einheit: "w", abgebildet: true }, "alle 5 Tage = 1,4 je Woche → w");
  assert.deepEqual(einheitAusWiederholung(w("benutzerdefiniert", { intervallN: 3, intervallEinheit: "wochen", wochentage: [0] })),
    { einheit: "m", abgebildet: true }, "seltener als wöchentlich → m, Anzahl unverändert");
  assert.deepEqual(katalogHaeufigkeit("3x/Tag"), { anzahl: 3, einheit: "t7" });
  assert.deepEqual(katalogHaeufigkeit("2x/Monat"), { anzahl: 2, einheit: "m" });
  assert.deepEqual(katalogHaeufigkeit("einmalig"), { anzahl: 1, einheit: "e" });
  console.log("✓ Ü6 Einheiten-Abbildung: alle 2 Tage → t3 (nie t4), Katalogstandard geparst");
}

/* ── Ü1/Ü4/Ü2: Übernahme vollständig, Zielbezüge vereinigt ── */
{
  const bestand = uebernahmeErstellen("P-2026-0041");
  assert.equal(bestand.length, 18, "12 Plan- + 4 Prozess- + 2 Hauswirtschafts-Positionen");
  assert.ok(bestand.every(p => p.nummer && p.bezeichnung && p.leistungsart), "jede Position aus dem Katalog aufgelöst");

  const p10506 = bestand.find(p => p.nummer === "10506")!;
  assert.equal(p10506.zielBezuege.length, 2, "Ü4: zwei Zielbezüge, EINE Position");
  assert.equal(p10506.zeit, 20, "Plan-Zeit übernommen (20 statt Richtzeit 17)");
  assert.equal(p10506.richtzeit, 17, "Richtzeit aus dem Katalog");
  assert.ok(p10506.zeitBegruendung.length > 0, "Ü2: die Plan-Begründung reist mit");
  assert.equal(p10506.einheit, "t6", "6 Wochentage → t6");

  const p10107 = bestand.find(p => p.nummer === "10107")!;
  assert.equal(p10107.einheit, "t3", "V3: alle 2 Tage → t3");
  assert.ok(p10107.einheitAbgebildet, "…und als abgebildet etikettiert");

  const p10302 = bestand.find(p => p.nummer === "10302")!;
  assert.equal(p10302.richtzeit, null, "10302: der Katalog nennt keine Richtzeit (C7)");
  assert.equal(p10302.zeit, 20, "…die Plan-Zeit gilt");

  const p10505 = bestand.find(p => p.nummer === "10505")!;
  assert.equal(p10505.w, "I", "Erbringer aus dem Plan übernommen");

  // Ü5/V1: nur Einsatzblock und Ausführungskategorie sind leer.
  for (const p of bestand.filter(x => x.herkunft === "pflegeplan")) {
    assert.equal(p.block, "", `${p.nummer}: Einsatzblock leer`);
    assert.equal(p.ausfuehrung, "", `${p.nummer}: Ausführungskategorie leer`);
  }

  const retro = bestand.filter(p => p.retro);
  assert.deepEqual(retro.map(p => p.nummer).sort(), ["10901", "10904", "10907"], "C15: retrospektive Prozessleistungen");
  assert.ok(retro.every(p => p.einheit === "e"), "retrospektiv = einmalig, nie hochgerechnet");

  const hw = bestand.filter(p => p.herkunft === "hauswirtschaft");
  assert.equal(hw.length, 2);
  assert.ok(hw.every(p => p.leistungsart === "n"), "Hauswirtschaft ist Nicht-KLV");

  assert.deepEqual(uebernahmeErstellen("P-XXXX").filter(p => p.herkunft === "pflegeplan"), [],
    "fremder Klient: kein Planbestand");
  console.log(`✓ Ü1/Ü2/Ü4/Ü5 Übernahme: ${bestand.length} Positionen, Bezüge vereinigt, Spuren intakt`);
}

/* ── C12/C13: manuelles Einfügen ── */
{
  const p = manuellEinfuegen("10108", "2x/Monat");
  assert.equal(p.herkunft, "manuell");
  assert.deepEqual([p.anzahl, p.einheit], [2, "m"], "Katalogstandard als Startwert");
  assert.equal(p.einfuegeGrund, "", "der Grund ist offen — Pflicht folgt im UI");
  console.log("✓ C13 Manuell eingefügt: Herkunft manuell, Katalogstandard, Grund offen");
}

console.log("\nAlle Leistungsplanungs-Tests bestanden.");
