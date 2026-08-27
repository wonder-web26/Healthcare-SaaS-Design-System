/**
 * Unit-Tests für die Fall-Entität und ihre Ableitungen — ohne Test-Framework
 * (keine neue Abhängigkeit): reines node:assert, ausführbar mit
 *   npx tsx src/lib/interrai/store.test.ts
 * Bei einem Fehlschlag wirft assert und der Prozess endet mit Code 1.
 *
 * Der Store seedet beim Import (initDemo). Die Tests nutzen den Seed dort, wo er
 * deterministisch ist, und legen für die Nummernvergabe eigene Fälle in Jahren
 * an, die der Seed nicht belegt (2099/2100).
 */
import assert from "node:assert/strict";
import {
  vergibFallnummer,
  eroeffneFall,
  offenerFallFuerKlient,
  formulareFuerFall,
  klientZustand,
  createAssessment,
} from "./store";

// ── vergibFallnummer: Format, Fortlaufen je Jahr, Jahreswechsel ──────────────

// Frisches Jahr ohne Fälle → 0001, Format ORG-JJJJ-NNNN mit führenden Nullen.
assert.equal(vergibFallnummer("2099-03-01"), "SKA-2099-0001");

const t1 = eroeffneFall("PERS-TEST", "2099-03-01");
assert.equal(t1.fallnummer, "SKA-2099-0001");
const t2 = eroeffneFall("PERS-TEST", "2099-06-01");
assert.equal(t2.fallnummer, "SKA-2099-0002"); // fortlaufend im selben Jahr

// Jahreswechsel: das Folgejahr beginnt wieder bei 0001, unabhängig von 2099.
assert.equal(vergibFallnummer("2100-01-01"), "SKA-2100-0001");
const t3 = eroeffneFall("PERS-TEST", "2100-02-01");
assert.equal(t3.fallnummer, "SKA-2100-0001");

// Fallnummer ist unveränderlich: es gibt keinen Setter (nur Typprüfung hier —
// die Abwesenheit eines Setters wird per grep in der Verifikation belegt).

// ── offenerFallFuerKlient: nur der offene Fall (geschlossenAm === null) ───────

// Seed-Klient PERS-003 (Wiedereintritt): ein geschlossener, ein offener Fall.
const offenBianchi = offenerFallFuerKlient("PERS-003");
assert.ok(offenBianchi, "PERS-003 muss einen offenen Fall haben");
assert.equal(offenBianchi!.geschlossenAm, null);
assert.equal(offenBianchi!.fallnummer, "SKA-2026-0003"); // der laufende, nicht der Vorjahresfall

// Klient ohne Fall → undefined.
assert.equal(offenerFallFuerKlient("PERS-GIBTS-NICHT"), undefined);

// ── formulareFuerFall: Formulare des geschlossenen Falls NICHT unter dem offenen

// Wiedereintritts-Nachweis: der offene Fall trägt nur NEU-ASS-004,
// der abgeschlossene Vorfall (NEU-ASS-003) taucht dort nicht auf.
const formOffen = formulareFuerFall(offenBianchi!.id);
const idsOffen = formOffen.map((f) => f.id);
assert.deepEqual(idsOffen, ["NEU-ASS-004"]);
assert.ok(!idsOffen.includes("NEU-ASS-003"), "Formular des geschlossenen Falls darf nicht unter dem offenen erscheinen");

// ── klientZustand: abgeleitet aus patientId, nicht gespeichert ───────────────

assert.equal(klientZustand("PERS-001"), "im_onboarding"); // Onboarding, keine patientId
assert.equal(klientZustand("PERS-002"), "aktiv");         // trägt patientId
assert.equal(klientZustand("PERS-003"), "aktiv");         // Wiedereintritt-Patientin
assert.equal(klientZustand("PERS-GIBTS-NICHT"), "im_onboarding"); // unbekannt → Onboarding

// ── createAssessment: kein Formular ohne Fall; A5b aus der Fallnummer ────────

// Unbekannte fallId → Fehler statt still einen Fall zu erzeugen.
assert.throws(() => createAssessment("FALL-GIBTS-NICHT", "erstabklaerung"), /unzulässig/);

// Feld A5b (Interne Fallnummer) wird aus dem Fall befüllt, nicht getippt.
const tf = eroeffneFall("PERS-TEST", "2099-09-09");
const form = createAssessment(tf.id, "erstabklaerung");
assert.equal(form.fallId, tf.id);
assert.equal(form.answers["A5b"], tf.fallnummer);

console.log("store.test.ts: alle Zusicherungen erfüllt");
