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
import { diagnoseVorschlaege, zieleZuDiagnose, interventionenZuZiel, detaildialog, positionFuer, ausgeschlosseneZiele, unbehandelteCaps, zielBewertungsSkala, qualifikationsStufen, diagnoseDetails, merkmalsEintrag } from "./mock-adapter";
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

/* ── Lauf-5-Ergänzung: die Bewertungsskala — Ordnung ist Vertragsbestandteil ── */
{
  const skala = zielBewertungsSkala();
  assert.deepEqual(skala.map(s => s.stufe), [5, 4, 3, 2, 1], "absteigend geordnet: 5 (bestes) zuerst, 1 (schlechtestes) zuletzt");
  assert.deepEqual(skala.map(s => s.label), [
    "vollständig erreicht", "weitgehend erreicht", "teilweise erreicht", "kaum erreicht", "nicht erreicht",
  ], "die fünf Bezeichnungen der Katalog-Lieferung");
  for (const s of skala) assert.equal(s.herkunft.stufe, "katalog", "Herkunft katalog — gelieferte Fachlichkeit");
  console.log("✓ 14 zielBewertungsSkala: fünf Stufen, Ordnung 5→1, Herkunft katalog");
}

/* ── Lauf-6-Ergänzung: die Qualifikationsleiter — Ordnung ist Vertragsbestandteil ── */
{
  const stufen = qualifikationsStufen();
  assert.deepEqual(stufen.map(s => s.rang), [1, 2, 3], "aufsteigend geordnet: Rang 1 (niedrigste) zuerst");
  assert.deepEqual(stufen.map(s => s.label), [
    "Pflegehelfer/in SRK", "FaGe", "Dipl. Pflegefachperson HF",
  ], "die drei Stufen in aufsteigender Ordnung");
  for (const s of stufen) {
    assert.equal(s.herkunft.rang, "mock", "Herkunft mock — die echte Quelle (Personalstamm) fehlt");
    assert.equal(s.herkunft.label, "mock");
  }
  // Deckung mit der Positions-Anreicherung: jedes Katalogminimum ist rangierbar.
  const bekannt = new Set(stufen.map(s => s.label));
  for (const nr of ["10101", "10102", "10103", "10505"]) {
    const p = leistungsposition(nr);
    assert.ok(p?.mindestqualifikation && bekannt.has(p.mindestqualifikation),
      `${nr}: Mindestqualifikation «${p?.mindestqualifikation}» liegt auf der Leiter`);
  }
  console.log("✓ 15 qualifikationsStufen: drei Stufen, Ordnung 1→3, Herkunft mock, deckt die Positionsminima");
}

/* ── 16 (Lauf 6g): diagnoseDetails — Listen, Gruppen, Code-Auflösung ── */
{
  // Belegte und leere Listen: das Syndrom trägt vier, die Risikodiagnose
  // lässt Bestimmende Merkmale und Beeinflussende Faktoren bei null.
  const syndrom = diagnoseDetails("00257");
  assert.ok(syndrom, "00257 liefert Details");
  assert.ok(syndrom!.bestimmendeMerkmale && syndrom!.beeinflussendeFaktoren
    && syndrom!.risikopopulation && syndrom!.assoziierteBedingungen, "00257: vier belegte Listen");
  assert.equal(syndrom!.risikofaktoren, null, "00257: Risikofaktoren nicht belegt — null, keine leere Liste");

  const sturz = diagnoseDetails("00155");
  assert.ok(sturz, "00155 liefert Details");
  assert.equal(sturz!.bestimmendeMerkmale, null, "00155: keine Bestimmenden Merkmale");
  assert.equal(sturz!.beeinflussendeFaktoren, null, "00155: keine Beeinflussenden Faktoren");

  // Gruppenerkennung: 49 Items unter 4 Überschriften, Überschriften zählen
  // nicht als Items.
  const rf = sturz!.risikofaktoren!;
  assert.equal(rf.filter(e => e.art === "gruppe").length, 4, "00155: vier Gruppenüberschriften");
  assert.equal(rf.filter(e => e.art === "item").length, 49, "00155: 49 Risikofaktoren-Items");
  assert.equal(rf[0].art, "gruppe", "die erste Zeile ist eine Überschrift");

  // Diagnosecode-Auflösung: aus EXT_TAXONOMIE («9» + Code), nie aus dem Text.
  const merkmale = syndrom!.bestimmendeMerkmale!;
  assert.equal(merkmale.length, 15, "00257: fünfzehn Bestimmende Merkmale");
  assert.ok(merkmale.every(m => m.art === "item" && m.diagnoseCode !== null), "alle fünfzehn tragen einen Diagnosecode");
  assert.ok(merkmale.some(m => m.diagnoseCode === "00108"), "00108 ist unter den Merkmalen (Planmarken-Fall)");
  const ohneCode = diagnoseDetails("00108")!.bestimmendeMerkmale!;
  assert.ok(ohneCode.every(m => m.diagnoseCode === null), "00108: kein Merkmal trägt einen Code (Gegenprobe)");

  // Bereitschaftsdiagnose: genau eine belegte Liste.
  const wissen = diagnoseDetails("00161")!;
  const listen = [wissen.bestimmendeMerkmale, wissen.beeinflussendeFaktoren,
    wissen.risikofaktoren, wissen.risikopopulation, wissen.assoziierteBedingungen];
  assert.equal(listen.filter(l => l !== null).length, 1, "00161: genau eine belegte Liste");

  // Katalogkennzahlen abgeleitet, nicht gepflegt: 00257 ehrlich 0/0,
  // 00155 deckungsgleich mit den Abfragen (2)/(3).
  assert.equal(syndrom!.anzahlZiele, 0, "00257: 0 erreichbare Ziele");
  assert.equal(syndrom!.anzahlInterventionen, 0, "00257: 0 Interventionen");
  const ziele155 = zieleZuDiagnose("00155");
  assert.equal(sturz!.anzahlZiele, ziele155.length, "00155: anzahlZiele = zieleZuDiagnose");
  const ids = new Set(ziele155.flatMap(z => interventionenZuZiel("00155", z.id).map(x => x.id)));
  assert.equal(sturz!.anzahlInterventionen, ids.size, "00155: anzahlInterventionen = Vereinigung aus (3)");

  // Unbekannter Code und Herkunft.
  assert.equal(diagnoseDetails("99999"), null, "unbekannter Code liefert null");
  assert.equal(syndrom!.herkunft.gebiet, "mock", "Herkunft je Feld: mock");
  assert.equal(syndrom!.herkunft.bestimmendeMerkmale, "mock");
  console.log(`✓ 16 diagnoseDetails: Listen belegt/null, ${rf.length} Zeilen mit 4 Gruppen, Codes aufgelöst, Kennzahlen abgeleitet`);
}

/* ── 17 (Lauf 6g): merkmalsEintrag — die Abbildung selbst, beobachtbar ── */
{
  // Bekannte Arten: 1 → Gruppe, 3 → Item, nichts gemeldet.
  assert.deepEqual(merkmalsEintrag({ itemArt: 1, text: "Umweltfaktoren", extTaxonomie: null }),
    { eintrag: { art: "gruppe", text: "Umweltfaktoren", diagnoseCode: null }, unbekannteArt: null });
  assert.deepEqual(merkmalsEintrag({ itemArt: 3, text: "Anämie", extTaxonomie: null }),
    { eintrag: { art: "item", text: "Anämie", diagnoseCode: null }, unbekannteArt: null });

  // Ein unbekannter Wert ist ein Datenbefund: er kommt als Item durch UND
  // steht benannt im Ergebnis — nicht nur «stürzt nicht ab».
  const fremd = merkmalsEintrag({ itemArt: 7, text: "Unbekannte Zeile", extTaxonomie: null });
  assert.equal(fremd.eintrag.art, "item", "unbekannte ITEM_ART wird als Item behandelt, nicht verworfen");
  assert.equal(fremd.unbekannteArt, 7, "… und der Fall ist im Rückgabewert erkennbar");

  // EXT_TAXONOMIE: «9» + fünfstelliger Code wird aufgelöst, alles andere nicht.
  assert.equal(merkmalsEintrag({ itemArt: 3, text: "Fatigue", extTaxonomie: "900093" }).eintrag.diagnoseCode, "00093");
  assert.equal(merkmalsEintrag({ itemArt: 3, text: "Fatigue (00093)", extTaxonomie: null }).eintrag.diagnoseCode, null,
    "ohne EXT_TAXONOMIE kein Code — der Fliesstext wird nie gelesen");
  assert.equal(merkmalsEintrag({ itemArt: 3, text: "x", extTaxonomie: "812345" }).eintrag.diagnoseCode, null, "falscher Präfix");
  assert.equal(merkmalsEintrag({ itemArt: 3, text: "x", extTaxonomie: "9123" }).eintrag.diagnoseCode, null, "zu kurz");
  console.log("✓ 17 merkmalsEintrag: 1/3 abgebildet, unbekannte Art als Item + benannt, Codes nur aus EXT_TAXONOMIE");
}

console.log("\nAlle Vertragstests bestanden.");
