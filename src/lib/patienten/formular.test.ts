/**
 * Unit-Tests für die Rückabbildung Patient → Formular — node:assert, ausführbar mit
 *   npx tsx src/lib/patienten/formular.test.ts
 *
 * Die Detailansicht zeigt denselben Reitersatz wie der Onboarding-Schritt. Diese
 * Prüfungen sichern die Stelle, an der das scheitern würde: ein Feld, das der
 * Patientendatensatz kennt, aber nicht ins Formular zurückfindet, erscheint in
 * der Ansicht als leeres Pflichtfeld — ohne dass TypeScript etwas merkt, weil
 * `emptyPatientForm` jedes Feld bereits belegt.
 */
import assert from "node:assert/strict";
import { formularAusPatient, getPatientFormular, sicherePatientFormular, anfangsFormular, setzePatientFormulareZurueck } from "./formular";
import { getPatienten, getPatient } from "./store";
import { emptyPatientForm } from "../../app/components/StepPatient";

setzePatientFormulareZurueck();

const STEINER = "P-2026-0041";
const FERRARI = "P-2026-0048";

// Die umbenannten sechs Felder — hier bricht eine Rückabbildung am ehesten.
{
  const p = getPatient(STEINER);
  assert.ok(p, "Seed-Patient vorhanden");
  const f = formularAusPatient(p!);

  assert.equal(f.name, p!.nachname, "name ← nachname");
  assert.equal(f.adresseStrasse, p!.strasse, "adresseStrasse ← strasse");
  assert.equal(f.adressePlz, p!.plz, "adressePlz ← plz");
  assert.equal(f.adresseOrt, p!.ort, "adresseOrt ← ort");
  assert.equal(f.dossierEroeffnetAm, p!.aufnahmeDatum, "dossierEroeffnetAm ← aufnahmeDatum");
  // sprache hält im Bestand die Beschriftung, das Formular den Code.
  assert.notEqual(f.spracheCode, p!.sprache, "spracheCode ist ein Code, keine Beschriftung");
  assert.ok(f.spracheCode.length > 0, "spracheCode ist gesetzt");
}

// Die Ergänzungen füllen genau die Felder, die der Bestand nicht trägt.
{
  const f = formularAusPatient(getPatient(STEINER)!);
  assert.ok(f.anamneseText.length > 0, "Anamnese ist gefüllt");
  assert.ok(f.chronischeErkrankungen.length > 0, "chronische Erkrankungen sind gefüllt");
  assert.ok(f.allergien.length > 0, "Allergien sind gefüllt");
  assert.equal(f.groesse, "174");
  assert.equal(f.sturzLetzte12m, "ja");
  // ATL: mindestens eine beantwortete Position, sonst wäre der Reiter leer.
  const beantwortet = Object.values(f.atlAssessment).filter(e => e.ja !== null);
  assert.ok(beantwortet.length >= 5, `ATL hat ${beantwortet.length} beantwortete Positionen`);
}

// Der Schweregrad schlägt sich in der ATL-Dichte nieder: «kritisch» trägt mehr
// bejahte Positionen als «mittel». Sonst wären die Mockdaten beliebig.
{
  const zaehle = (id: string) =>
    Object.values(formularAusPatient(getPatient(id)!).atlAssessment).filter(e => e.ja === true).length;
  assert.ok(zaehle(FERRARI) > zaehle(STEINER), "kritischer Fall trägt mehr bejahte ATL-Positionen");
}

// JEDER Patient im Bestand liefert ein Formular mit gefüllter Anamnese und ATL.
// Ohne diese Prüfung fällt ein neu aufgenommener Patient erst in der Demo auf.
{
  for (const p of getPatienten()) {
    const f = formularAusPatient(p);
    assert.ok(f.anamneseText.length > 0, `${p.id} (${p.nachname}) hat eine Anamnese`);
    const beantwortet = Object.values(f.atlAssessment).filter(e => e.ja !== null);
    assert.ok(beantwortet.length > 0, `${p.id} (${p.nachname}) hat beantwortete ATL-Positionen`);
  }
}

// Jedes Feld aus emptyPatientForm ist vorhanden — kein undefined im Formular,
// sonst schalten kontrollierte Eingabefelder in den unkontrollierten Zustand.
{
  const f = formularAusPatient(getPatient(STEINER)!);
  for (const schluessel of Object.keys(emptyPatientForm)) {
    assert.ok(schluessel in f, `Feld ${schluessel} ist vorhanden`);
  }
}

// Der Bestand: ohne Speichern kein Eintrag, danach gewinnt der gespeicherte Stand.
{
  assert.equal(getPatientFormular(STEINER), undefined, "ohne Speichern kein Eintrag");

  const abgewandelt = { ...formularAusPatient(getPatient(STEINER)!), anamneseText: "Von Hand geändert" };
  sicherePatientFormular(STEINER, abgewandelt);

  assert.equal(getPatientFormular(STEINER)!.anamneseText, "Von Hand geändert");
  assert.equal(anfangsFormular(getPatient(STEINER)!).anamneseText, "Von Hand geändert",
    "der gespeicherte Stand schlägt die Rückabbildung");
  // Ein anderer Patient bleibt unberührt.
  assert.notEqual(anfangsFormular(getPatient(FERRARI)!).anamneseText, "Von Hand geändert");
}

// Der Bestand hält eine Kopie: spätere Änderungen am übergebenen Objekt dringen
// nicht durch. Sonst wäre der Dirty-Vergleich der Ansicht immer falsch.
{
  setzePatientFormulareZurueck();
  const f = formularAusPatient(getPatient(STEINER)!);
  sicherePatientFormular(STEINER, f);
  f.anamneseText = "Nachträglich";
  assert.notEqual(getPatientFormular(STEINER)!.anamneseText, "Nachträglich");
}

console.log("formular.test.ts — alle Prüfungen bestanden");
