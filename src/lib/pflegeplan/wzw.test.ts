/**
 * Tests der WZW-Prüfung (Lauf 6) — reines node:assert, ausführbar mit
 *   npx tsx src/lib/pflegeplan/wzw.test.ts
 *
 * Geprüft werden: die Signatur (abgeleitet, Meta ausgeschlossen), alle
 * zwölf Prüfungen, die Aktualitätserkennung, das Überleben und Entfallen
 * von Übergehungen (inkl. Verifikationspunkt 19: Wiederauftauchen) und die
 * Veröffentlichungs-Vorbedingung mit Rollen-Gate.
 */
import assert from "node:assert/strict";
import { befundeErmitteln, planSignatur } from "./wzw";
import { leistungsposition } from "./positionen";
import { GEGENWART_ISO } from "../gegenwart";
import {
  planZuruecksetzen, planSchnappschuss,
  diagnoseUebernehmen, diagnoseVerwerfen,
  zielUebernehmen, zielTerminieren, zielEntfernen, eigenesZielHinzufuegen,
  massnahmeVerknuepfen, massnahmenBezugLoesen, massnahmePlanen,
  pruefungDurchfuehren, befundUebergehen, uebergehungZuruecknehmen,
  pruefungAktuell, offeneBefunde,
  veroeffentlichungsVorbedingung, veroeffentlichen, planAendern,
} from "./plan-store";

const DIAGNOSE_STURZ = { code: "00155", titel: "Sturzgefahr", typ: "risiko" as const, belegZeile: "Test", ausloesendeCaps: ["CAP-FALLS"] };
const DIAGNOSE_HAUT = { code: "00108", titel: "Selbstversorgungsdefizit Körperpflege", typ: "problem" as const, belegZeile: "Test", ausloesendeCaps: ["CAP-ADL"] };

function befundIds(): string[] {
  return befundeErmitteln(planSchnappschuss()).map(b => b.id);
}

/* ── 1: Signatur — Meta ausgeschlossen, Inhalt (inkl. Verwerfungen) drin ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_HAUT);
  zielUebernehmen({ zielId: "Z-HAUT", diagnoseCode: "00108", titel: "Intakte Haut", eigenes: false });
  const sig1 = planSignatur(planSchnappschuss());

  pruefungDurchfuehren(GEGENWART_ISO);
  assert.equal(planSignatur(planSchnappschuss()), sig1, "Prüfung selbst (Meta) ändert die Signatur nicht");

  zielTerminieren("Z-HAUT", { zieldatum: "2026-09-30" });
  const sig2 = planSignatur(planSchnappschuss());
  assert.notEqual(sig2, sig1, "Inhaltsänderung (Zieldatum) ändert die Signatur");

  diagnoseVerwerfen("00201", "Nicht zutreffend", "M. Keller", GEGENWART_ISO);
  assert.notEqual(planSignatur(planSchnappschuss()), sig2, "Verwerfungen (Lauf 2) liegen im Inhalt und damit in der Signatur");
  console.log("✓ 1  planSignatur: Meta ausgeschlossen, Inhalt samt Verwerfungen eingeschlossen");
}

/* ── 2: Die sieben Wirksamkeits-Prüfungen ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_STURZ); // ohne Ziel
  diagnoseUebernehmen(DIAGNOSE_HAUT);
  zielUebernehmen({ zielId: "Z-HAUT", diagnoseCode: "00108", titel: "Intakte Haut", eigenes: false }); // ohne Massnahme, ohne Datum
  eigenesZielHinzufuegen("00108", "Überfälliges Testziel");
  const ueberfaellig = planSchnappschuss().ziele.find(z => z.eigenes)!;
  zielTerminieren(ueberfaellig.zielId, { zieldatum: "2026-07-01" }); // vor GEGENWART, keine Einschätzung

  massnahmeVerknuepfen("I-HAUTPFLEGE", "Hautpflege durchführen", { diagnoseCode: "00108", zielId: ueberfaellig.zielId });
  massnahmenBezugLoesen("I-HAUTPFLEGE", { diagnoseCode: "00108", zielId: ueberfaellig.zielId }); // ohne Zielbezug
  massnahmePlanen("I-HAUTPFLEGE", { wiederholung: "einmalig" }); // einmalig ohne Datum

  massnahmeVerknuepfen("I-GEHTRAINING", "Gleichgewichts- und Kraftübungen anleiten", { diagnoseCode: "00108", zielId: ueberfaellig.zielId });
  massnahmePlanen("I-GEHTRAINING", { erbringer: "V" }); // Verweigerung ohne Begründung

  const ids = befundIds();
  for (const erwartet of [
    "W-DIAGNOSE-OHNE-ZIEL:00155",
    `W-ZIEL-OHNE-MASSNAHME:00108|Z-HAUT`,
    "W-MASSNAHME-OHNE-ZIEL:I-HAUTPFLEGE",
    `W-ZIEL-UEBERFAELLIG:${ueberfaellig.zielId}`,
    "W-EINMALIG-OHNE-DATUM:I-HAUTPFLEGE",
    "W-VERWEIGERUNG-OHNE-GRUND:I-GEHTRAINING",
  ]) {
    assert.ok(ids.includes(erwartet), `Befund ${erwartet} wird erkannt`);
  }
  /* Z-HAUT trägt kein Zieldatum — und das ist KEIN Befund: das Zieldatum
     ist bewusst optional. */
  assert.ok(!ids.some(id => id.startsWith("W-ZIEL-OHNE-DATUM")), "ein Ziel ohne Zieldatum löst keinen Befund aus");
  const befunde = befundeErmitteln(planSchnappschuss());
  for (const b of befunde.filter(x => x.id.startsWith("W-"))) {
    assert.equal(b.kriterium, "wirksamkeit", `${b.id} liegt in der Gruppe Wirksamkeit`);
  }
  console.log("✓ 2  Wirksamkeit: alle sechs Prüfungen lösen aus; ohne Zieldatum ist kein Befund");
}

/* ── 3: Auflösen lässt Befunde verschwinden — die Prüfung meldet nur ── */
{
  massnahmePlanen("I-HAUTPFLEGE", { einmalDatum: "2026-08-20" });
  assert.ok(!befundIds().includes("W-EINMALIG-OHNE-DATUM:I-HAUTPFLEGE"), "datierte Einmal-Leistung: Befund entfällt");
  massnahmePlanen("I-GEHTRAINING", { erbringerNotiz: "Klientin lehnt Gehtraining ab — Angst vor Überlastung, dokumentiert am 04.08." });
  assert.ok(!befundIds().includes("W-VERWEIGERUNG-OHNE-GRUND:I-GEHTRAINING"), "begründete Verweigerung: Befund entfällt");
  console.log("✓ 3  Auflösen im Plan lässt den jeweiligen Befund entfallen");
}

/* ── 4: Die vier Zweckmässigkeits- und zwei Wirtschaftlichkeits-Prüfungen ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_HAUT);
  eigenesZielHinzufuegen("00108", "Testziel");
  const ziel = planSchnappschuss().ziele[0];
  zielTerminieren(ziel.zielId, { zieldatum: "2026-10-15" });

  // Ohne Position, Variante «Dialog unbeantwortet»
  massnahmeVerknuepfen("I-GANZWASCHUNG", "Ganzkörperwaschung", { diagnoseCode: "00108", zielId: ziel.zielId });
  // Ohne Position, Variante «bleibt planerisch»
  massnahmeVerknuepfen("I-ZIELGESPRAECH", "Zielvereinbarungsgespräch führen", { diagnoseCode: "00108", zielId: ziel.zielId });
  massnahmePlanen("I-ZIELGESPRAECH", { wiederholung: "woechentlich", wochentage: [0] });

  let ids = befundIds();
  assert.ok(ids.includes("Z-OHNE-POSITION:I-GANZWASCHUNG"), "Dialog unbeantwortet → ohne Position");
  assert.ok(ids.includes("Z-OHNE-POSITION:I-ZIELGESPRAECH"), "keine Regel hinterlegt → ohne Position");
  const varianten = befundeErmitteln(planSchnappschuss()).filter(b => b.id.startsWith("Z-OHNE-POSITION:"));
  assert.notEqual(varianten[0].detail, varianten[1].detail, "die beiden Ohne-Position-Fälle sind im Text unterschieden");

  // Position 10101 herstellen (Ort: Im Bett) und alles Weitere daran prüfen
  massnahmePlanen("I-GANZWASCHUNG", { detailAuswahl: [{ gruppe: "Ort der Durchführung", item: "Im Bett" }] });
  const p10101 = leistungsposition("10101")!;
  assert.equal(p10101.mindestqualifikation, "Pflegehelfer/in SRK");
  assert.deepEqual([p10101.maxAnzahl, p10101.maxEinheit], [1, "tag"], "10101: max. 1× je Tag = 7 je Woche");

  massnahmePlanen("I-GANZWASCHUNG", {
    wiederholung: "werktage", anzahl: 3,                    // 15 je Woche > 7
    qualifikation: "FaGe",                                  // über Minimum SRK
    erbringer: "I", erbringerNotiz: "",                     // ohne Angabe
    tageszeiten: ["morgens"], zeitVerbindlich: true,        // verbindliches Fenster
    dauerMin: (p10101.vorgabeMinuten ?? 30) + 10, dauerBegruendung: "", // Abweichung ohne Grund
  });

  ids = befundIds();
  assert.ok(!ids.includes("Z-OHNE-POSITION:I-GANZWASCHUNG"), "mit Position: Ohne-Position-Befund entfällt");
  for (const erwartet of [
    "Z-QUALIFIKATION-UEBER-MINIMUM:I-GANZWASCHUNG",
    "Z-ERBRINGER-OHNE-ANGABE:I-GANZWASCHUNG",
    "Z-ZEIT-VERBINDLICH:I-GANZWASCHUNG",
    "WI-DAUER-OHNE-GRUND:I-GANZWASCHUNG",
    "WI-HAEUFIGKEIT-UEBER-GRENZE:I-GANZWASCHUNG",
  ]) {
    assert.ok(ids.includes(erwartet), `Befund ${erwartet} wird erkannt`);
  }
  const befunde = befundeErmitteln(planSchnappschuss());
  for (const b of befunde.filter(x => x.id.startsWith("Z-"))) assert.equal(b.kriterium, "zweckmaessigkeit");
  for (const b of befunde.filter(x => x.id.startsWith("WI-"))) assert.equal(b.kriterium, "wirtschaftlichkeit");

  // Wochenbasis ausdrücklich: der Befundtext rechnet 15 gegen 7
  const haeufigkeit = befunde.find(b => b.id === "WI-HAEUFIGKEIT-UEBER-GRENZE:I-GANZWASCHUNG")!;
  assert.ok(haeufigkeit.detail.includes("15"), "geplante 15 je Woche stehen im Befund");
  assert.ok(haeufigkeit.detail.includes("7 je Woche"), "erlaubte 7 je Woche stehen im Befund");

  // Gegenprobe: SRK als Zuweisung ist KEIN Befund (nicht über dem Minimum)
  massnahmePlanen("I-GANZWASCHUNG", { qualifikation: "Pflegehelfer/in SRK" });
  assert.ok(!befundIds().includes("Z-QUALIFIKATION-UEBER-MINIMUM:I-GANZWASCHUNG"), "Zuweisung auf dem Minimum löst nicht aus");
  console.log("✓ 4  Zweckmässigkeit und Wirtschaftlichkeit: alle sechs Prüfungen, Wochenbasis 15 gegen 7");
}

/* ── 5: Aktualität über die Signatur, nicht über einen Zeitstempel ── */
{
  pruefungDurchfuehren(GEGENWART_ISO);
  assert.ok(pruefungAktuell(planSchnappschuss()), "frisch geprüft: aktuell");
  massnahmePlanen("I-GANZWASCHUNG", { anzahl: 1 });
  assert.ok(!pruefungAktuell(planSchnappschuss()), "Planänderung: nicht mehr aktuell — bei UNVERÄNDERTEM Prüfdatum");
  pruefungDurchfuehren(GEGENWART_ISO);
  assert.ok(pruefungAktuell(planSchnappschuss()), "erneut geprüft: wieder aktuell");
  console.log("✓ 5  Aktualität hängt an der Signatur — dasselbe Datum, trotzdem veraltet erkannt");
}

/* ── 6: Übergehen — live gezählt, rücknehmbar, überlebt die Neuprüfung ── */
{
  const plan = planSchnappschuss();
  const offen = offeneBefunde(plan);
  const erster = offen[0];
  const vorher = offen.length;

  befundUebergehen(erster.id, { text: "Fachlich gewollt — Begründung im Test", autorin: "M. Keller", datum: GEGENWART_ISO });
  assert.equal(offeneBefunde(planSchnappschuss()).length, vorher - 1, "Übergehen senkt den Zähler sofort");
  assert.ok(pruefungAktuell(planSchnappschuss()), "Übergehen veraltet die Prüfung NICHT — sonst wäre «aktuell geprüft, alles übergangen» unerreichbar");

  pruefungDurchfuehren(GEGENWART_ISO);
  const nachher = planSchnappschuss().pruefung!.befunde.find(b => b.id === erster.id)!;
  assert.ok(nachher.uebergehung !== null, "Übergehung überlebt die Neuprüfung, solange der Befund wieder auftritt");

  uebergehungZuruecknehmen(erster.id);
  assert.equal(offeneBefunde(planSchnappschuss()).length, vorher, "Zurücknehmen erhöht den Zähler sofort — ohne Neuprüfung");
  console.log("✓ 6  Übergehen: live gezählt, rücknehmbar, neuprüfungsfest");
}

/* ── 7 (V19): Entfällt ein übergangener Befund und kehrt wieder, ist er offen ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_STURZ); // ohne Ziel → Befund
  pruefungDurchfuehren(GEGENWART_ISO);
  const id = "W-DIAGNOSE-OHNE-ZIEL:00155";
  assert.ok(planSchnappschuss().pruefung!.befunde.some(b => b.id === id), "Ausgangsbefund vorhanden");
  befundUebergehen(id, { text: "Ziel folgt nach dem Angehörigengespräch", autorin: "M. Keller", datum: GEGENWART_ISO });

  // Änderung 1: der Befund entfällt
  eigenesZielHinzufuegen("00155", "Zwischenzeitliches Ziel");
  const zwischenZiel = planSchnappschuss().ziele.find(z => z.diagnoseCode === "00155")!;
  pruefungDurchfuehren(GEGENWART_ISO);
  assert.ok(!planSchnappschuss().pruefung!.befunde.some(b => b.id === id), "Befund entfallen — die Übergehung entfällt mit ihm");

  // Änderung 2: der Befund kehrt wieder
  zielEntfernen("00155", zwischenZiel.zielId);
  pruefungDurchfuehren(GEGENWART_ISO);
  const wieder = planSchnappschuss().pruefung!.befunde.find(b => b.id === id);
  assert.ok(wieder, "Befund wieder aufgetaucht");
  assert.equal(wieder!.uebergehung, null,
    "…und OFFEN: die alte Begründung gehörte zu einem früheren Zustand und darf nicht stillschweigend wieder gelten");
  console.log("✓ 7  V19: Wiederauftauchen nach Entfall — der Befund ist offen, die alte Übergehung gilt nicht mehr");
}

/* ── 8: Veröffentlichungs-Vorbedingung — Rolle, Prüfpflicht, offene Befunde ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_STURZ);

  assert.match(veroeffentlichungsVorbedingung(planSchnappschuss(), "backoffice"), /Pflegefachperson HF/,
    "fremde Rolle: abgelehnt mit Begründung");
  assert.match(veroeffentlichungsVorbedingung(planSchnappschuss(), "management"), /Pflegefachperson HF/,
    "auch Management darf nicht");
  assert.match(veroeffentlichungsVorbedingung(planSchnappschuss(), "diplomiert"), /noch nicht geprüft/,
    "ohne Prüfung: abgelehnt");

  pruefungDurchfuehren(GEGENWART_ISO);
  assert.match(veroeffentlichungsVorbedingung(planSchnappschuss(), "diplomiert"), /weder aufgelöst noch begründet übergangen/,
    "offener Befund: abgelehnt");

  for (const b of offeneBefunde(planSchnappschuss())) {
    befundUebergehen(b.id, { text: "Für den Test übergangen", autorin: "M. Keller", datum: GEGENWART_ISO });
  }
  assert.equal(veroeffentlichungsVorbedingung(planSchnappschuss(), "diplomiert"), "", "aktuell geprüft, alles übergangen: frei");
  assert.equal(veroeffentlichen("M. Keller", "diplomiert", GEGENWART_ISO), "", "Veröffentlichen gelingt");
  assert.equal(planSchnappschuss().status, "veroeffentlicht");
  assert.equal(planSchnappschuss().fassungen.length, 1);

  planAendern();
  eigenesZielHinzufuegen("00155", "Neues Ziel nach Änderung");
  assert.match(veroeffentlichungsVorbedingung(planSchnappschuss(), "diplomiert"), /nicht mehr aktuell/,
    "nach Änderung: veraltete Prüfung wird abgelehnt");
  console.log("✓ 8  Vorbedingung: Rollen-Gate, Prüfpflicht, offene Befunde, Veralterung");
}

planZuruecksetzen();
console.log("\nAlle WZW-Tests bestanden.");
