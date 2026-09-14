/**
 * Vertragstests des Pflegeplan-Moduls (Lauf 1) — reines node:assert,
 * ausführbar mit
 *   npx tsx src/lib/pflegeplan/vertrag.test.ts
 *
 * Nummerierung folgt den Verifikationspunkten des Laufs. Punkt 12 (leerer
 * git diff der Bestandsquellen) und 13 (tsc/vite build) laufen ausserhalb.
 */
import assert from "node:assert/strict";
import { ableitungAlsText } from "./vertrag";
import { diagnoseVorschlaege, zieleZuDiagnose, interventionenZuZiel, detaildialog, positionFuer, ausgeschlosseneZiele, unbehandelteCaps } from "./mock-adapter";
import { leistungsposition } from "./positionen";
import { MAS_ZIEL, PROB_MAS, PROB_ZIEL_HIDE } from "./mock-daten";

const VIER_CAPS = ["CAP-FALLS", "CAP-ADL", "CAP-PAIN", "CAP-MOOD"];

/* ── 1: Kandidatenliste vollständig, dedupliziert, belegt ── */
{
  const vorschlaege = diagnoseVorschlaege(VIER_CAPS);
  assert.ok(vorschlaege.length >= 40, `mindestens 40 Kandidaten, erhalten: ${vorschlaege.length}`);
  const codes = vorschlaege.map(v => v.diagnose.code);
  assert.equal(new Set(codes).size, codes.length, "dedupliziert: kein Code doppelt");
  for (const v of vorschlaege) {
    assert.ok(v.belege.length >= 1, `${v.diagnose.code}: mindestens ein Beleg`);
    assert.ok(v.ausloesendeCaps.length >= 1, `${v.diagnose.code}: mindestens ein CAP`);
  }
  console.log(`✓ 1  diagnoseVorschlaege: ${vorschlaege.length} Kandidaten, dedupliziert, alle belegt`);
}

/* ── 2: Kein Aufruf entfernt Kandidaten — Menge unabhängig von der Sortierung ── */
{
  const hin = diagnoseVorschlaege(VIER_CAPS).map(v => v.diagnose.code).sort();
  const her = diagnoseVorschlaege([...VIER_CAPS].reverse()).map(v => v.diagnose.code).sort();
  assert.deepEqual(hin, her, "Rückgabemenge unabhängig von der CAP-Reihenfolge");
  // Vollständigkeit: die Menge ist die Vereinigung der Einzelaufrufe.
  const einzeln = new Set(VIER_CAPS.flatMap(c => diagnoseVorschlaege([c]).map(v => v.diagnose.code)));
  assert.deepEqual(hin, [...einzeln].sort(), "vollständig: Vereinigung der Einzelaufrufe");
  console.log("✓ 2  Sortierung ändert die Menge nicht; nichts wird entfernt");
}

/* ── 3: Diagnose ohne verknüpfte Ziele → leeres Array, kein Wurf ── */
{
  const ziele = zieleZuDiagnose("00162");
  assert.deepEqual(ziele, [], "00162 (Bereitschaftsdiagnose ohne Interventionen) liefert []");
  console.log("✓ 3  zieleZuDiagnose der zielloser Diagnose: leeres Array, wirft nicht");
}

/* ── 4: Die Ausschlussliste wirkt — die Zusicherung aus Abfrage 2 ── */
{
  // Beleg der Erreichbarkeit: Z-WOHLBEFINDEN hängt an einer Intervention von 00155 …
  const erreichbar = (PROB_MAS["00155"] ?? []).some(i => (MAS_ZIEL[i] ?? []).includes("Z-WOHLBEFINDEN"));
  assert.ok(erreichbar, "Z-WOHLBEFINDEN ist über eine Intervention von 00155 erreichbar");
  assert.ok(PROB_ZIEL_HIDE.has("00155|Z-WOHLBEFINDEN"), "… und steht für 00155 in der Ausschlussliste");
  // … erscheint dort aber nicht:
  const bei00155 = zieleZuDiagnose("00155").map(z => z.id);
  assert.ok(!bei00155.includes("Z-WOHLBEFINDEN"), "unterdrücktes Ziel fehlt bei 00155");
  // … und bleibt bei einer anderen Diagnose sichtbar (nicht global gelöscht):
  const bei00108 = zieleZuDiagnose("00108").map(z => z.id);
  assert.ok(bei00108.includes("Z-WOHLBEFINDEN"), "dasselbe Ziel bleibt bei 00108 sichtbar");
  console.log("✓ 4  Ausschlussliste angewendet: erreichbar, aber unterdrückt — nur im Kontext 00155");
}

/* ── 5: Detailauswahl schaltet die Position um ── */
{
  const imBett = positionFuer("I-GANZWASCHUNG", [{ gruppe: "Ort der Durchführung", item: "Im Bett" }]);
  const inDusche = positionFuer("I-GANZWASCHUNG", [{ gruppe: "Ort der Durchführung", item: "In Dusche oder Bad" }]);
  assert.equal(imBett?.nummer, "10101");
  assert.equal(inDusche?.nummer, "10102");
  assert.notEqual(imBett?.nummer, inDusche?.nummer, "zwei Auswahlen, zwei Positionen");
  console.log("✓ 5  positionFuer: Im Bett → 10101, In Dusche oder Bad → 10102");
}

/* ── 6: Intervention ohne Regel → null ── */
{
  assert.equal(positionFuer("I-ZIELGESPRAECH", []), null, "planerische Intervention liefert null");
  console.log("✓ 6  positionFuer ohne Regel: null (gültiger Zustand)");
}

/* ── 7: Die Ableitung als Zeichenkette ── */
{
  const text = ableitungAlsText({
    cap: "CAP-ADL", diagnoseCode: "00108", zielId: "Z-SELBSTPFLEGE",
    interventionId: "I-GANZWASCHUNG", positionsNummer: "10102",
  });
  for (const teil of ["CAP-ADL", "00108", "Z-SELBSTPFLEGE", "I-GANZWASCHUNG", "10102"]) {
    assert.ok(text.includes(teil), `Ableitungstext enthält ${teil}`);
  }
  console.log(`✓ 7  Ableitung: ${text}`);
}

/* ── 8: Jedes Feld einer Leistungsposition liefert seine Herkunft ── */
{
  const p = leistungsposition("10101");
  assert.ok(p, "10101 existiert");
  const feldNamen = Object.keys(p!).filter(k => k !== "herkunft");
  for (const feld of feldNamen) {
    const h = (p!.herkunft as Record<string, string>)[feld];
    assert.ok(["katalog", "kuratiert", "mock"].includes(h), `Feld ${feld} trägt eine gültige Herkunft (${h})`);
  }
  assert.equal(Object.keys(p!.herkunft).length, feldNamen.length, "Herkunftskarte deckt genau die Felder ab");
  console.log(`✓ 8  Herkunft je Feld: ${feldNamen.length} Felder, alle belegt`);
}

/* ── 9: Teilhandlungen aus der Vorlage → "kuratiert" ── */
{
  const p = leistungsposition("10101");
  assert.ok(p?.teilhandlungen && p.teilhandlungen.length > 0, "10101 hat Teilhandlungen");
  assert.equal(p!.herkunft.teilhandlungen, "kuratiert");
  console.log(`✓ 9  10101: ${p!.teilhandlungen!.length} Teilhandlungen, Herkunft kuratiert`);
}

/* ── 10: Position 10102 — die echten zehn, belegt ── */
{
  const p = leistungsposition("10102");
  assert.ok(p?.teilhandlungen, "10102 hat Teilhandlungen");
  assert.equal(p!.teilhandlungen!.length, 10, "genau zehn Teilhandlungen");
  assert.equal(p!.herkunft.teilhandlungen, "katalog");
  console.log("✓ 10 10102: zehn Teilhandlungen, Herkunft katalog");
}

/* ── 11: Position ohne Ausführungsschritte → teilhandlungen null, kein Wurf ── */
{
  const p = leistungsposition("10001");
  assert.ok(p, "10001 existiert im Katalog");
  assert.equal(p!.teilhandlungen, null, "keine Teilhandlungen hinterlegt");
  console.log("✓ 11 10001: teilhandlungen null, Abfrage wirft nicht");
}

/* ── Zusatz: der Detaildialog selbst ── */
{
  const dialog = detaildialog("I-GANZWASCHUNG");
  assert.ok(dialog && dialog.gruppen.length === 2, "Ganzkörperwaschung trägt den Dialog");
  assert.equal(detaildialog("I-TEILWAESCHE"), null, "ohne Dialog: null");
  const interventionen = interventionenZuZiel("00108", "Z-SELBSTPFLEGE").map(i => i.id);
  assert.deepEqual(interventionen.sort(), ["I-ANLEITUNG-SELBSTPFLEGE", "I-GANZWASCHUNG"], "Schnittmenge Diagnose ∩ Ziel");
  console.log("✓ +  Detaildialog und interventionenZuZiel konsistent");
}

/* ── Lauf-2-Ergänzungen: die Gegenliste und die unbehandelten CAPs ── */
{
  const bei00155 = ausgeschlosseneZiele("00155");
  assert.equal(bei00155.length, 1, "00155: genau ein unterdrücktes Ziel");
  assert.equal(bei00155[0].id, "Z-WOHLBEFINDEN", "… und zwar das erreichbare, das die Ausschlussliste verschluckt");
  assert.deepEqual(ausgeschlosseneZiele("00108"), [], "Diagnose ohne Unterdrückung: leere Liste");
  console.log("✓ 12 ausgeschlosseneZiele: 00155 → [Z-WOHLBEFINDEN], 00108 → []");
}
{
  assert.deepEqual(unbehandelteCaps(["CAP-FALLS", "CAP-CARDIO"]), ["CAP-CARDIO"], "unbekannter CAP wird ausgewiesen");
  assert.deepEqual(unbehandelteCaps(["CAP-FALLS", "CAP-ADL", "CAP-PAIN", "CAP-MOOD"]), [], "bekannte CAPs: nichts unbehandelt");
  console.log("✓ 13 unbehandelteCaps: kein CAP verschwindet spurlos");
}

console.log("\nAlle Vertragstests bestanden.");
