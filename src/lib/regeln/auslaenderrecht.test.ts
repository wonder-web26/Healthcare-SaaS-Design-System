/**
 * Ausländerrechtliche Prüfung — 16 Testfälle des Regelwerks (Abschnitt 9)
 * plus vier ergänzte (T17–T20).
 * Lauf mit: npx tsx src/lib/regeln/auslaenderrecht.test.ts
 */
import assert from "node:assert";
import { pruefeAuslaenderrecht, type AuslaenderrechtEingabe } from "./auslaenderrecht";

const BASIS: AuslaenderrechtEingabe = {
  staatsangehoerigkeitsgruppe: null,
  ausweisart: null,
  aufenthaltsgrund: null,
  ausweisGueltigBis: "01.06.2030", // weit nach Arbeitsbeginn → keine Sperre S2, kein Z1
  arbeitsortKanton: "ZH",
  asylgesuchDatum: null,
  bundesasylzentrumVerlassen: null,
  arbeitsbeginnGeplant: "01.06.2026",
};
const mit = (o: Partial<AuslaenderrechtEingabe>): AuslaenderrechtEingabe => ({ ...BASIS, ...o });

/** Prüft regime, arbeitsbeginn und regelNummer eines Testfalls. */
function pruefe(nr: string, e: AuslaenderrechtEingabe, regime: string, arbeitsbeginn: string, regelNummer: string) {
  const r = pruefeAuslaenderrecht(e);
  assert.strictEqual(r.regime, regime, `${nr} regime`);
  assert.strictEqual(r.arbeitsbeginn, arbeitsbeginn, `${nr} arbeitsbeginn`);
  assert.strictEqual(r.regelNummer, regelNummer, `${nr} regelNummer`);
}

// ── Die sechzehn Testfälle des Regelwerks ──
pruefe("T01", mit({ staatsangehoerigkeitsgruppe: "eu_efta", ausweisart: "B" }), "frei", "sofort", "R03");
pruefe("T02", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "C" }), "frei", "sofort", "R02");
pruefe("T03", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: "familiennachzug" }), "frei", "sofort", "R06");
pruefe("T04", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: "asyl_anerkannt" }), "meldung", "nach_meldung", "R07");
pruefe("T05", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: "erwerbstaetigkeit" }), "bewilligung", "nach_bewilligung", "R08");

// T06 — Grund unbekannt: Regelwerk nennt nur Regime + Regel (Z3).
{
  const r = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: null }));
  assert.strictEqual(r.regime, "nicht_bestimmbar", "T06 regime");
  assert.strictEqual(r.regelNummer, "Z3", "T06 regelNummer");
  assert.ok(r.hinweise.includes("aufenthaltsgrund_fehlt"), "T06 hinweis aufenthaltsgrund_fehlt");
}

pruefe("T07", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "F" }), "meldung", "nach_meldung", "R11");
pruefe("T08", mit({ staatsangehoerigkeitsgruppe: "eu_efta", ausweisart: "S" }), "meldung", "nach_meldung", "R12");
pruefe("T09", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "N", bundesasylzentrumVerlassen: true, asylgesuchDatum: "01.01.2026" }), "bewilligung", "nach_bewilligung", "R13");
pruefe("T10", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "N", bundesasylzentrumVerlassen: true, asylgesuchDatum: "01.05.2026" }), "unzulaessig", "nie", "S4");
pruefe("T11", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "N", bundesasylzentrumVerlassen: false, asylgesuchDatum: "01.01.2026" }), "unzulaessig", "nie", "S3");
pruefe("T12", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "keiner" }), "unzulaessig", "nie", "S1");

// T13 — Ausweis läuft 30 Tage nach Arbeitsbeginn ab → frei plus Hinweis ablauf_nah (R03, Z1)
{
  const r = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "eu_efta", ausweisart: "B", ausweisGueltigBis: "01.07.2026" }));
  assert.strictEqual(r.regime, "frei", "T13 regime");
  assert.strictEqual(r.arbeitsbeginn, "sofort", "T13 arbeitsbeginn");
  assert.strictEqual(r.regelNummer, "R03", "T13 regelNummer");
  assert.ok(r.hinweise.includes("ablauf_nah"), "T13 hinweis ablauf_nah");
}

pruefe("T14", mit({ staatsangehoerigkeitsgruppe: "eu_efta", ausweisart: "B", ausweisGueltigBis: "01.05.2026" }), "unzulaessig", "nie", "S2");
pruefe("T15", mit({ staatsangehoerigkeitsgruppe: "eu_efta", ausweisart: "G" }), "bewilligung", "nach_bewilligung", "R05");
pruefe("T16", mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "G" }), "bewilligung", "nach_bewilligung", "R10");

// ── Vier ergänzte Testfälle ──

// T17 — Kanton nicht in der Tabelle: Regime bestimmt, zustaendigeStelle null, Hinweis kanton_unbekannt
{
  const r = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: "asyl_anerkannt", arbeitsortKanton: "TI" }));
  assert.strictEqual(r.regime, "meldung", "T17 regime");
  assert.strictEqual(r.zustaendigeStelle, null, "T17 zustaendigeStelle null");
  assert.ok(r.hinweise.includes("kanton_unbekannt"), "T17 hinweis kanton_unbekannt");
}

// T18 — staatsangehoerigkeitsgruppe null bei Ausweis B → nicht_bestimmbar
{
  const r = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: null, ausweisart: "B" }));
  assert.strictEqual(r.regime, "nicht_bestimmbar", "T18 regime");
}

// T19 — Regime meldung im Kanton ZH: zustaendigeStelle und meldekanal gesetzt
{
  const r = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: "asyl_anerkannt", arbeitsortKanton: "ZH" }));
  assert.strictEqual(r.regime, "meldung", "T19 regime");
  assert.ok(r.zustaendigeStelle && r.zustaendigeStelle.length > 0, "T19 zustaendigeStelle gesetzt");
  assert.ok(r.meldekanal && r.meldekanal.length > 0, "T19 meldekanal gesetzt");
}

// T20 — Regime bewilligung im Kanton SO: sicherheit zu_bestaetigen
{
  const r = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "L", arbeitsortKanton: "SO" }));
  assert.strictEqual(r.regime, "bewilligung", "T20 regime");
  assert.strictEqual(r.sicherheit, "zu_bestaetigen", "T20 sicherheit");
}

console.log("auslaenderrecht.test: OK (T01–T20)");
