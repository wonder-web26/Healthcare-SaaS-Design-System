/**
 * Tests der WZW-Prüfung (Lauf 6) — reines node:assert, ausführbar mit
 *   npx tsx src/lib/pflegeplan/wzw.test.ts
 *
 * Geprüft werden: die Signatur (abgeleitet, Meta ausgeschlossen), alle
 * zehn Prüfungen (Massnahme = Leistungsposition — «ohne Position» gibt es
 * nicht mehr), die Aktualitätserkennung, das Überleben und Entfallen
 * von Übergehungen (inkl. Verifikationspunkt 19: Wiederauftauchen) und die
 * Veröffentlichungs-Vorbedingung mit Rollen-Gate.
 */
import assert from "node:assert/strict";
import { befundeErmitteln, planSignatur } from "./wzw";
import { leistungsposition } from "./positionen";
import { GEGENWART_ISO } from "../gegenwart";
import {
  planZuruecksetzen, planSchnappschuss,
  diagnoseUebernehmen, diagnoseVerwerfen, diagnosePriorisieren,
  zielUebernehmen, zielTerminieren, zielEntfernen, eigenesZielHinzufuegen,
  massnahmeVerknuepfen, massnahmenBezugLoesen, massnahmePlanen,
  pruefungDurchfuehren, befundUebergehen, uebergehungZuruecknehmen,
  pruefungAktuell, offeneBefunde,
  veroeffentlichungsVorbedingung, veroeffentlichen, planAendern,
} from "./plan-store";

const DIAGNOSE_STURZ = { code: "00155", titel: "Sturzgefahr", typ: "risiko" as const, belegZeile: "Test", ausloesendeCaps: ["CAP-FALLS"], hinzugefuegtVon: "T. Test", hinzugefuegtAm: "2026-08-04" };
const DIAGNOSE_HAUT = { code: "00108", titel: "Selbstversorgungsdefizit Körperpflege", typ: "problem" as const, belegZeile: "Test", ausloesendeCaps: ["CAP-ADL"], hinzugefuegtVon: "T. Test", hinzugefuegtAm: "2026-08-04" };

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

  zielTerminieren("Z-HAUT", { evaluationsIntervall: "alle 4 Wochen" });
  const sig2 = planSignatur(planSchnappschuss());
  assert.notEqual(sig2, sig1, "Inhaltsänderung (Evaluationsintervall) ändert die Signatur");

  diagnoseVerwerfen("00201", "Nicht zutreffend", "M. Keller", GEGENWART_ISO);
  const sig3 = planSignatur(planSchnappschuss());
  assert.notEqual(sig3, sig2, "Verwerfungen (Lauf 2) liegen im Inhalt und damit in der Signatur");

  /* Die PRIORITÄT ist Inhalt: sie steht auf Dokument und Blatt — ihre
     Änderung veraltet die Prüfung bewusst (feldweises Herauslösen wäre die
     handverlesene Aufzählung, vor der planSignatur warnt). */
  diagnosePriorisieren("00108", "wichtig", "T. Test", "2026-08-04");
  assert.notEqual(planSignatur(planSchnappschuss()), sig3, "die Priorität (Inhalt) ändert die Signatur");
  console.log("✓ 1  planSignatur: Meta (Prüfung) ausgeschlossen; Inhalt (Verwerfungen, Priorität) eingeschlossen");
}

/* ── 2: Die sieben Wirksamkeits-Prüfungen ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_STURZ); // ohne Ziel
  diagnoseUebernehmen(DIAGNOSE_HAUT);
  zielUebernehmen({ zielId: "Z-HAUT", diagnoseCode: "00108", titel: "Intakte Haut", eigenes: false }); // ohne Massnahme, ohne Datum
  eigenesZielHinzufuegen("00108", "Eigenes Testziel");
  const eigenes = planSchnappschuss().ziele.find(z => z.eigenes)!;

  massnahmeVerknuepfen("10105", "Intimpflege (im Bett oder am Lavabo)", { diagnoseCode: "00108", zielId: eigenes.zielId });
  massnahmenBezugLoesen("10105", { diagnoseCode: "00108", zielId: eigenes.zielId }); // ohne Zielbezug
  massnahmePlanen("10105", { wiederholung: "einmalig" }); // einmalig ohne Datum

  massnahmeVerknuepfen("10505", "Gehtraining", { diagnoseCode: "00108", zielId: eigenes.zielId });
  massnahmePlanen("10505", { erbringer: "V" }); // Verweigerung ohne Begründung

  const ids = befundIds();
  for (const erwartet of [
    "W-DIAGNOSE-OHNE-ZIEL:00155",
    `W-ZIEL-OHNE-MASSNAHME:00108|Z-HAUT`,
    "W-MASSNAHME-OHNE-ZIEL:10105",
    "W-EINMALIG-OHNE-DATUM:10105",
    "W-VERWEIGERUNG-OHNE-GRUND:10505",
  ]) {
    assert.ok(ids.includes(erwartet), `Befund ${erwartet} wird erkannt`);
  }
  /* Ziele tragen kein Zieldatum mehr — Datums-Befunde an Zielen existieren
     nicht. */
  assert.ok(!ids.some(id => id.startsWith("W-ZIEL-OHNE-DATUM") || id.startsWith("W-ZIEL-UEBERFAELLIG")),
    "keine Datums-Befunde an Zielen");
  const befunde = befundeErmitteln(planSchnappschuss());
  for (const b of befunde.filter(x => x.id.startsWith("W-"))) {
    assert.equal(b.kriterium, "wirksamkeit", `${b.id} liegt in der Gruppe Wirksamkeit`);
  }
  console.log("✓ 2  Wirksamkeit: alle fünf Prüfungen lösen aus; Ziele tragen kein Zieldatum");
}

/* ── 3: Auflösen lässt Befunde verschwinden — die Prüfung meldet nur ── */
{
  massnahmePlanen("10105", { einmalDatum: "2026-08-20" });
  assert.ok(!befundIds().includes("W-EINMALIG-OHNE-DATUM:10105"), "datierte Einmal-Leistung: Befund entfällt");
  massnahmePlanen("10505", { erbringerNotiz: "Klientin lehnt Gehtraining ab — Angst vor Überlastung, dokumentiert am 04.08." });
  assert.ok(!befundIds().includes("W-VERWEIGERUNG-OHNE-GRUND:10505"), "begründete Verweigerung: Befund entfällt");
  console.log("✓ 3  Auflösen im Plan lässt den jeweiligen Befund entfallen");
}

/* ── 4: Die drei Zweckmässigkeits- und zwei Wirtschaftlichkeits-Prüfungen ── */
{
  planZuruecksetzen();
  diagnoseUebernehmen(DIAGNOSE_HAUT);
  eigenesZielHinzufuegen("00108", "Testziel");
  const ziel = planSchnappschuss().ziele[0];

  /* Die Massnahme IST die Position 10101 (Modellwechsel) — den Fall «ohne
     Position» und die frühere Z-OHNE-POSITION-Prüfung gibt es nicht mehr. */
  massnahmeVerknuepfen("10101", "Ganzwäsche bettlägerige Klientin", { diagnoseCode: "00108", zielId: ziel.zielId });
  const p10101 = leistungsposition("10101")!;
  assert.equal(p10101.mindestqualifikation, "Pflegehelfer/in SRK");
  assert.deepEqual([p10101.maxAnzahl, p10101.maxEinheit], [1, "tag"], "10101: max. 1× je Tag = 7 je Woche");

  massnahmePlanen("10101", {
    wiederholung: "werktage", anzahl: 3,                    // 15 je Woche > 7
    qualifikation: "FaGe",                                  // über Minimum SRK
    erbringer: "I", erbringerNotiz: "",                     // ohne Angabe
    tageszeiten: ["morgens"], zeitVerbindlich: true,        // verbindliches Fenster
    dauerMin: (p10101.vorgabeMinuten ?? 30) + 10, dauerBegruendung: "", // Abweichung ohne Grund
  });

  const ids = befundIds();
  assert.ok(!ids.some(id => id.startsWith("Z-OHNE-POSITION")), "die frühere Ohne-Position-Prüfung existiert nicht mehr");
  for (const erwartet of [
    "Z-QUALIFIKATION-UEBER-MINIMUM:10101",
    "Z-ERBRINGER-OHNE-ANGABE:10101",
    "Z-ZEIT-VERBINDLICH:10101",
    "WI-DAUER-OHNE-GRUND:10101",
    "WI-HAEUFIGKEIT-UEBER-GRENZE:10101",
  ]) {
    assert.ok(ids.includes(erwartet), `Befund ${erwartet} wird erkannt`);
  }
  const befunde = befundeErmitteln(planSchnappschuss());
  for (const b of befunde.filter(x => x.id.startsWith("Z-"))) assert.equal(b.kriterium, "zweckmaessigkeit");
  for (const b of befunde.filter(x => x.id.startsWith("WI-"))) assert.equal(b.kriterium, "wirtschaftlichkeit");

  // Wochenbasis ausdrücklich: der Befundtext rechnet 15 gegen 7
  const haeufigkeit = befunde.find(b => b.id === "WI-HAEUFIGKEIT-UEBER-GRENZE:10101")!;
  assert.ok(haeufigkeit.detail.includes("15"), "geplante 15 je Woche stehen im Befund");
  assert.ok(haeufigkeit.detail.includes("7 je Woche"), "erlaubte 7 je Woche stehen im Befund");

  // Gegenprobe: SRK als Zuweisung ist KEIN Befund (nicht über dem Minimum)
  massnahmePlanen("10101", { qualifikation: "Pflegehelfer/in SRK" });
  assert.ok(!befundIds().includes("Z-QUALIFIKATION-UEBER-MINIMUM:10101"), "Zuweisung auf dem Minimum löst nicht aus");
  console.log("✓ 4  Zweckmässigkeit und Wirtschaftlichkeit: alle fünf Prüfungen, Wochenbasis 15 gegen 7");
}

/* ── 5: Aktualität über die Signatur, nicht über einen Zeitstempel ── */
{
  pruefungDurchfuehren(GEGENWART_ISO);
  assert.ok(pruefungAktuell(planSchnappschuss()), "frisch geprüft: aktuell");
  massnahmePlanen("10101", { anzahl: 1 });
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
