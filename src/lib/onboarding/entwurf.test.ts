/**
 * Unit-Tests für den Onboarding-Entwurf — node:assert, ausführbar mit
 *   npx tsx src/lib/onboarding/entwurf.test.ts
 *
 * Der Entwurf trägt den gespeicherten Formularstand eines Falls. Er ist die
 * Quelle für das Zurückladen beim Öffnen und damit die Grundlage dafür, dass
 * «unverändert» und «ungespeichert» überhaupt unterscheidbar sind.
 */
import assert from "node:assert/strict";
import { getEntwurf, sichereEntwurf, setzeEntwuerfeZurueck, type OnboardingEntwurf } from "./entwurf";
import { emptyPatientForm } from "../../app/components/StepPatient";
import { emptyAngehoerigerForm } from "../../app/components/StepAngehoeriger";

const leer = (): OnboardingEntwurf => ({ patient: emptyPatientForm, angehoeriger: emptyAngehoerigerForm });

setzeEntwuerfeZurueck();

// Ohne Speichern kennt der Bestand den Fall nicht — das unterscheidet einen
// nie gespeicherten Fall von einem leer gespeicherten.
{
  assert.equal(getEntwurf("OB-2026-900"), undefined, "unbekannter Fall liefert undefined");
}

// Gespeicherte Werte kommen zurück.
{
  const e = leer();
  e.patient = { ...e.patient, name: "Steiner", vorname: "Ruth" };
  e.angehoeriger = { ...e.angehoeriger, name: "Steiner", vorname: "Marc" };
  sichereEntwurf("OB-2026-901", e);

  const zurueck = getEntwurf("OB-2026-901");
  assert.ok(zurueck, "gespeicherter Fall wird gefunden");
  assert.equal(zurueck!.patient.name, "Steiner");
  assert.equal(zurueck!.patient.vorname, "Ruth");
  assert.equal(zurueck!.angehoeriger.vorname, "Marc");
}

// Der Bestand hält eine Kopie: wer sein Formularobjekt weiterbearbeitet,
// verändert den gespeicherten Stand nicht. Sonst wäre der Vergleich
// «geändert gegenüber gespeichert» immer falsch.
{
  const e = leer();
  sichereEntwurf("OB-2026-902", e);
  e.patient = { ...e.patient, name: "Nachtraeglich" };

  assert.equal(getEntwurf("OB-2026-902")!.patient.name, "", "spätere Änderung dringt nicht durch");
}

// Erneutes Speichern ersetzt den Stand vollständig.
{
  const erst = leer();
  erst.patient = { ...erst.patient, name: "Erst" };
  sichereEntwurf("OB-2026-903", erst);

  const dann = leer();
  dann.patient = { ...dann.patient, vorname: "Dann" };
  sichereEntwurf("OB-2026-903", dann);

  const zurueck = getEntwurf("OB-2026-903")!;
  assert.equal(zurueck.patient.name, "", "alter Wert ist fort");
  assert.equal(zurueck.patient.vorname, "Dann");
}

// Fälle stehen nebeneinander, nicht übereinander.
{
  const a = leer(); a.patient = { ...a.patient, name: "Fall A" };
  const b = leer(); b.patient = { ...b.patient, name: "Fall B" };
  sichereEntwurf("OB-2026-904", a);
  sichereEntwurf("OB-2026-905", b);

  assert.equal(getEntwurf("OB-2026-904")!.patient.name, "Fall A");
  assert.equal(getEntwurf("OB-2026-905")!.patient.name, "Fall B");
}

console.log("entwurf.test.ts — alle Prüfungen bestanden");
