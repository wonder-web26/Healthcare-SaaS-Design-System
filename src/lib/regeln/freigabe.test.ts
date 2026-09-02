/**
 * Freigabe des Vertragsschritts (Abschnitt 7a).
 * Lauf mit: npx tsx src/lib/regeln/freigabe.test.ts
 */
import assert from "node:assert";
import { pruefeAuslaenderrecht, SPERRGRUND_TEXT, type AuslaenderrechtEingabe } from "./auslaenderrecht";
import { vertragFreigabe, zeigeNachweisschritt, nichtBestimmbarAufgabe } from "./freigabe";

const BASIS: AuslaenderrechtEingabe = {
  staatsangehoerigkeitsgruppe: null, ausweisart: null, aufenthaltsgrund: null,
  ausweisGueltigBis: "01.06.2030", arbeitsortKanton: "ZH",
  asylgesuchDatum: null, bundesasylzentrumVerlassen: null, arbeitsbeginnGeplant: "01.06.2026",
};
const mit = (o: Partial<AuslaenderrechtEingabe>): AuslaenderrechtEingabe => ({ ...BASIS, ...o });
const KEIN_NACHWEIS = { meldungDatum: null, einreichungsdatum: null };

const frei = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "eu_efta", ausweisart: "B" }));
const meldung = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: "asyl_anerkannt" }));
const bewilligung = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "L" }));
const unzulaessig = pruefeAuslaenderrecht(mit({ ausweisart: "keiner" }));
const nichtBestimmbar = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: "drittstaat", ausweisart: "B", aufenthaltsgrund: null }));

// Nachweisschritt erscheint nur bei meldung und bewilligung.
assert.strictEqual(zeigeNachweisschritt(frei.regime), false);
assert.strictEqual(zeigeNachweisschritt(meldung.regime), true);
assert.strictEqual(zeigeNachweisschritt(bewilligung.regime), true);
assert.strictEqual(zeigeNachweisschritt(unzulaessig.regime), false);
assert.strictEqual(zeigeNachweisschritt(nichtBestimmbar.regime), false);

// frei → sofort frei.
assert.deepStrictEqual(vertragFreigabe(frei, KEIN_NACHWEIS), { gesperrt: false, grund: null });

// meldung → gesperrt ohne Meldedatum, frei mit Meldedatum.
assert.strictEqual(vertragFreigabe(meldung, KEIN_NACHWEIS).gesperrt, true);
assert.strictEqual(vertragFreigabe(meldung, KEIN_NACHWEIS).grund, "Der Stellenantritt ist vor Arbeitsbeginn zu melden.");
assert.deepStrictEqual(vertragFreigabe(meldung, { meldungDatum: "20.05.2026", einreichungsdatum: null }), { gesperrt: false, grund: null });

// bewilligung → gesperrt ohne Einreichungsdatum, frei mit Einreichungsdatum.
assert.strictEqual(vertragFreigabe(bewilligung, KEIN_NACHWEIS).gesperrt, true);
assert.strictEqual(vertragFreigabe(bewilligung, KEIN_NACHWEIS).grund, "Die Bewilligung ist vor Arbeitsbeginn zu beantragen.");
assert.deepStrictEqual(vertragFreigabe(bewilligung, { meldungDatum: null, einreichungsdatum: "20.05.2026" }), { gesperrt: false, grund: null });

// unzulaessig → dauerhaft gesperrt, Grund aus 6.2.
assert.strictEqual(vertragFreigabe(unzulaessig, KEIN_NACHWEIS).gesperrt, true);
assert.strictEqual(vertragFreigabe(unzulaessig, KEIN_NACHWEIS).grund, SPERRGRUND_TEXT.kein_ausweis);

// nicht_bestimmbar → frei (Aufgabe entsteht separat bei der Konvertierung).
assert.deepStrictEqual(vertragFreigabe(nichtBestimmbar, KEIN_NACHWEIS), { gesperrt: false, grund: null });

// Werte bleiben: ein erfasstes Meldedatum bleibt gültig; wechselt das Regime auf frei,
// ist der Schritt frei — der Wert wird von der Freigabe nicht verlangt und nicht verändert.
const nachweisMitMeldung = { meldungDatum: "20.05.2026", einreichungsdatum: null };
assert.strictEqual(vertragFreigabe(meldung, nachweisMitMeldung).gesperrt, false);
assert.strictEqual(vertragFreigabe(frei, nachweisMitMeldung).gesperrt, false);
assert.strictEqual(nachweisMitMeldung.meldungDatum, "20.05.2026"); // unverändert

// nicht_bestimmbar → Aufgabe bei der Konvertierung, mit Hinweis auf die fehlende Angabe.
const aufgabeGrund = nichtBestimmbarAufgabe(nichtBestimmbar);
assert.ok(aufgabeGrund, "T: Aufgabe bei nicht_bestimmbar");
assert.strictEqual(aufgabeGrund!.titel, "Ausländerrechtliches Verfahren ungeklärt");
assert.ok(aufgabeGrund!.hinweis.includes("Aufenthaltsgrund"), "Hinweis nennt den fehlenden Aufenthaltsgrund");

// gruppe null bei Ausweis B → ebenfalls nicht_bestimmbar, anderer Hinweis.
const gruppeNull = pruefeAuslaenderrecht(mit({ staatsangehoerigkeitsgruppe: null, ausweisart: "B" }));
const aufgabeGruppe = nichtBestimmbarAufgabe(gruppeNull);
assert.ok(aufgabeGruppe, "T: Aufgabe bei gruppe null");
assert.ok(aufgabeGruppe!.hinweis.includes("Staatsangehörigkeit"), "Hinweis nennt die fehlende Gruppe");

// Andere Regime → keine Aufgabe.
assert.strictEqual(nichtBestimmbarAufgabe(frei), null);
assert.strictEqual(nichtBestimmbarAufgabe(meldung), null);

console.log("freigabe.test: OK");
