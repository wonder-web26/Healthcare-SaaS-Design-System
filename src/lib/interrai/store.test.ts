/**
 * Unit-Tests für Fall-Lebenszyklus, Route und Eröffnungsregeln (produktives
 * Vokabular) — reines node:assert, ausführbar mit
 *   npx tsx src/lib/interrai/store.test.ts
 *
 * Die Vollständigkeitszählung ist HC-gebunden; für Registrierung/Entlassung
 * wird `vollstaendig` daher synthetisch gesetzt (synthetische Formulare).
 */
import assert from "node:assert/strict";
import {
  vergibFallnummer,
  eroeffneFall,
  offenerFallFuerKlient,
  formulareFuerFall,
  getFaelleFuerKlient,
  klientZustand,
  createFormular,
  sperreFormular,
  kannFormularEroeffnen,
  fallStatus,
  brecheFallAb,
  getFall,
  updateAssessmentAnswers,
  type Fall,
  type Formular,
  type EroeffnungsErgebnis,
} from "./store";

const grundVon = (r: EroeffnungsErgebnis): string => (r.zulaessig ? "" : r.grund);

let n = 0;
const frischerFall = (jahr = "2099", klient?: string): Fall => {
  n += 1;
  return eroeffneFall(klient ?? `PERS-T-${n}`, `${jahr}-01-01`);
};
/** Registriert und sperrt: vergibt Fallnummer + route, öffnet den Fall. */
function registriere(fall: Fall, bb16: string): Formular {
  const r = createFormular(fall.id, "registration");
  r.answers["BB16"] = bb16;
  r.status = "vollstaendig"; // HC-gebundene Zählung → synthetisch
  sperreFormular(r.id, "Test");
  return r;
}
/** Sperrt ein synthetisch vollständiges Formular. */
function sperre(f: Formular): void {
  f.status = "vollstaendig";
  sperreFormular(f.id, "Test");
}

// ── vergibFallnummer: Format + Jahreswechsel (reine Funktion) ────────────────
assert.match(vergibFallnummer("2099-03-01"), /^SKA-2099-\d{4}$/);
assert.equal(vergibFallnummer("2099-03-01"), "SKA-2099-0001"); // kein 2099-Fall im Seed
assert.equal(vergibFallnummer("2100-01-01"), "SKA-2100-0001"); // Jahreswechsel → 0001

// ── klientZustand (Regression) ───────────────────────────────────────────────
assert.equal(klientZustand("PERS-001"), "im_onboarding");
assert.equal(klientZustand("PERS-002"), "aktiv");
assert.equal(klientZustand("PERS-004"), "aktiv");

// ── V4: Fallnummer erst beim Sperren der Registrierung ───────────────────────
{
  const f = frischerFall();
  const r = createFormular(f.id, "registration");
  assert.equal(getFall(f.id)!.fallnummer, null); // registering → keine Nummer
  assert.equal(fallStatus(f.id), "registering");
  r.answers["BB16"] = "1";
  sperre(r);
  assert.ok(getFall(f.id)!.fallnummer, "nach dem Sperren hat der Fall eine Nummer");
  assert.equal(fallStatus(f.id), "open");
}

// ── V5: Fallnummer ist am Formular hinterlegt (Defekt nicht nachgebaut) ──────
{
  const f = frischerFall();
  const r = registriere(f, "1");
  // Die Registrierung trägt ihre Fallnummer (BB5b) — nicht dauerhaft NULL.
  assert.equal(r.answers["BB5b"], getFall(f.id)!.fallnummer);
  assert.ok(r.answers["BB5b"]);
}

// ── V6: interRAI-Sperrung ohne Wirkung auf den Fall ──────────────────────────
{
  const f = frischerFall();
  registriere(f, "1"); // open, route somatic
  const vor = { st: fallStatus(f.id), openedAt: getFall(f.id)!.openedAt, closedAt: getFall(f.id)!.closedAt };
  const hc = createFormular(f.id, "interrai_hc");
  sperre(hc);
  assert.equal(fallStatus(f.id), vor.st); // weiterhin open
  assert.equal(getFall(f.id)!.openedAt, vor.openedAt);
  assert.equal(getFall(f.id)!.closedAt, vor.closedAt); // weiterhin null
}

// ── V7: alle sieben BB16-Codes → Route ───────────────────────────────────────
const ROUTEN: [string, string][] = [
  ["1", "somatic"], ["2", "mental_health"], ["3", "palliative"], ["4", "paediatric"],
  ["5", "isolated_therapeutic"], ["6", "housekeeping"], ["7", "declined"],
];
for (const [code, route] of ROUTEN) {
  const f = frischerFall();
  registriere(f, code);
  assert.equal(getFall(f.id)!.route, route, `BB16=${code} → ${route}`);
}

// ── V8: Systemgrenze palliative — kein Abklärungsformular ────────────────────
{
  const f = frischerFall();
  registriere(f, "3"); // palliative
  for (const typ of ["interrai_hc", "interrai_cmh", "housekeeping"] as const) {
    assert.equal(kannFormularEroeffnen(f.id, typ).zulaessig, false, `${typ} bei palliative`);
  }
  assert.match(grundVon(kannFormularEroeffnen(f.id, "interrai_hc")), /Instrument erforderlich/);
}

// ── V9: CMH-Pfad — cmh zulässig, hc nicht ────────────────────────────────────
{
  const f = frischerFall();
  registriere(f, "2"); // mental_health
  assert.equal(kannFormularEroeffnen(f.id, "interrai_cmh").zulaessig, true);
  assert.equal(kannFormularEroeffnen(f.id, "interrai_hc").zulaessig, false);
}

// ── V10: nur ein offenes Abklärungsformular pro Fall ─────────────────────────
{
  const f = frischerFall();
  registriere(f, "1"); // somatic
  createFormular(f.id, "interrai_hc"); // offenes hc
  const r = kannFormularEroeffnen(f.id, "interrai_hc");
  assert.equal(r.zulaessig, false);
  assert.match(grundVon(r), /offen/);
}

// ── V11: nur ein offener Fall pro Klient ─────────────────────────────────────
{
  const kl = "PERS-T-case";
  const f1 = eroeffneFall(kl, "2099-01-01");
  registriere(f1, "1"); // open
  assert.throws(() => eroeffneFall(kl, "2099-02-02"), /bereits einen offenen Fall/);
  // Nach der Entlassung ist ein neuer Fall zulässig.
  const entl = createFormular(f1.id, "discharge");
  sperre(entl);
  assert.equal(fallStatus(f1.id), "discharged");
  const f2 = eroeffneFall(kl, "2099-03-03");
  assert.ok(f2);
  // Auch ein Fall in Registrierung blockiert einen zweiten.
  const kl2 = "PERS-T-case2";
  eroeffneFall(kl2); // registering
  assert.throws(() => eroeffneFall(kl2), /bereits einen offenen Fall/);
}

// ── V13: Abbruch → aborted, keine Fallnummer ─────────────────────────────────
{
  const f = frischerFall();
  createFormular(f.id, "registration"); // registering
  brecheFallAb(f.id);
  assert.equal(fallStatus(f.id), "aborted");
  assert.equal(getFall(f.id)!.fallnummer, null);
  // Ein offener Fall lässt sich nicht abbrechen.
  const g = frischerFall();
  registriere(g, "1");
  assert.throws(() => brecheFallAb(g.id), /Registrierung/);
}

// ── V16: kannFormularEroeffnen alle fünf Typen, je zulässig + unzulässig ─────
// registration
{ const f = frischerFall(); assert.equal(kannFormularEroeffnen(f.id, "registration").zulaessig, true);
  createFormular(f.id, "registration"); assert.equal(kannFormularEroeffnen(f.id, "registration").zulaessig, false); }
// interrai_hc
{ const f = frischerFall(); registriere(f, "1"); assert.equal(kannFormularEroeffnen(f.id, "interrai_hc").zulaessig, true);
  const g = frischerFall(); registriere(g, "6"); assert.equal(kannFormularEroeffnen(g.id, "interrai_hc").zulaessig, false); }
// interrai_cmh
{ const f = frischerFall(); registriere(f, "2"); assert.equal(kannFormularEroeffnen(f.id, "interrai_cmh").zulaessig, true);
  const g = frischerFall(); registriere(g, "1"); assert.equal(kannFormularEroeffnen(g.id, "interrai_cmh").zulaessig, false); }
// housekeeping
{ const f = frischerFall(); registriere(f, "6"); assert.equal(kannFormularEroeffnen(f.id, "housekeeping").zulaessig, true);
  const g = frischerFall(); registriere(g, "1"); assert.equal(kannFormularEroeffnen(g.id, "housekeeping").zulaessig, false); }
// discharge
{ const f = frischerFall(); registriere(f, "1"); assert.equal(kannFormularEroeffnen(f.id, "discharge").zulaessig, true);
  const g = frischerFall(); registriere(g, "1"); createFormular(g.id, "interrai_hc"); // offenes Formular
  assert.equal(kannFormularEroeffnen(g.id, "discharge").zulaessig, false); }

// ── laufnummer (Regression) + vorgaengerId desselben Falls ───────────────────
{
  const klient = "PERS-T-lauf";
  const f = frischerFall("2099", klient);
  registriere(f, "1");
  const hc1 = createFormular(f.id, "interrai_hc");
  assert.equal(hc1.laufnummer, 1);
  assert.equal(hc1.reason, "first");
  assert.equal(hc1.vorgaengerId, null);
  sperre(hc1);
  const hc2 = createFormular(f.id, "interrai_hc");
  assert.equal(hc2.laufnummer, 2);
  assert.equal(hc2.reason, null); // Reassessment-Anlass beim Anlegen unbekannt
  assert.equal(hc2.vorgaengerId, hc1.id);
  // Discharge f, dann anderer Fall desselben Klienten → hc beginnt bei 1.
  sperre(hc2);
  const entl = createFormular(f.id, "discharge"); sperre(entl);
  const f2 = eroeffneFall(klient, "2099-06-06");
  registriere(f2, "1");
  const hcAnder = createFormular(f2.id, "interrai_hc");
  assert.equal(hcAnder.laufnummer, 1);
}

// ── formulareFuerFall: geschlossener Fall nicht unter dem offenen ────────────
{
  const kl = "PERS-T-sep";
  const closed = eroeffneFall(kl, "2099-01-01");
  const r1 = registriere(closed, "1");
  const entl = createFormular(closed.id, "discharge"); sperre(entl);
  const open = eroeffneFall(kl, "2099-02-02");
  const r2 = registriere(open, "1");
  const off = offenerFallFuerKlient(kl);
  assert.ok(off);
  assert.equal(off!.id, open.id);
  const idsOffen = formulareFuerFall(off!.id).map((f) => f.id);
  assert.ok(idsOffen.includes(r2.id));
  assert.ok(!idsOffen.includes(r1.id));
  assert.equal(getFaelleFuerKlient(kl).length, 2);
}

// ── Unveränderlichkeit (Regression): Schreiben auf gesperrt wirft ────────────
{
  const f = frischerFall();
  const r = registriere(f, "1");
  assert.throws(() => updateAssessmentAnswers(r.id, { x: "1" }), /gesperrt/);
}

console.log("store.test.ts: alle Zusicherungen erfüllt");
