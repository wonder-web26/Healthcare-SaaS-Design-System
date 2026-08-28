/**
 * Unit-Tests für Fall, Formulartyp, Lebenszyklus und Triage — ohne Test-
 * Framework (reines node:assert), ausführbar mit
 *   npx tsx src/lib/interrai/store.test.ts
 *
 * Nicht-HC-Formulare (SDA/LPB/Entlassung) haben in diesem Schritt keinen eigenen
 * Katalog; die Vollständigkeitszählung ist HC-gebunden. Für die Lebenszyklus-
 * Tests wird der Zustand `vollstaendig` bei solchen Formularen daher synthetisch
 * gesetzt (Auflage 2: synthetische Formulare, kein Seed-Beleg).
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
/** Ein gesperrtes SDA im gegebenen Fall (vollstaendig synthetisch gesetzt). */
function gesperrtesSda(fall: Fall, bb16: string): Formular {
  const sda = createFormular(fall.id, "sda");
  sda.answers["BB16"] = bb16;
  sda.status = "vollstaendig";
  sperreFormular(sda.id, "Test");
  return sda;
}

// ── Fallnummer: Format, Fortlaufen je Jahr, Jahreswechsel (V7) ───────────────
// Muss VOR den übrigen Tests laufen, die 2099-Fälle anlegen.
assert.equal(vergibFallnummer("2099-03-01"), "SKA-2099-0001");
assert.equal(eroeffneFall("PERS-T-fn", "2099-03-01").fallnummer, "SKA-2099-0001");
assert.equal(eroeffneFall("PERS-T-fn", "2099-06-01").fallnummer, "SKA-2099-0002");
assert.equal(vergibFallnummer("2100-01-01"), "SKA-2100-0001");

// ── klientZustand — abgeleitet, nicht gespeichert (Schritt-1-Regression) ─────
assert.equal(klientZustand("PERS-001"), "im_onboarding");
assert.equal(klientZustand("PERS-002"), "aktiv");
assert.equal(klientZustand("PERS-003"), "aktiv");

// ── Triage: BB16 1/5/7 (V3) ──────────────────────────────────────────────────
{ const f = frischerFall(); gesperrtesSda(f, "1"); assert.equal(getFall(f.id)!.triage, "interrai_hc"); }
{ const f = frischerFall(); gesperrtesSda(f, "5"); assert.equal(getFall(f.id)!.triage, "nur_sda"); }
{ const f = frischerFall(); gesperrtesSda(f, "7"); assert.equal(getFall(f.id)!.triage, "nur_sda"); }

// ── Triage ohne Code: vollständiges SDA ohne BB16 lässt sich nicht sperren (V4)
{
  const f = frischerFall();
  const sda = createFormular(f.id, "sda");
  sda.status = "vollstaendig"; // vollständig, aber KEIN BB16
  assert.throws(() => sperreFormular(sda.id, "Test"), /BB16/);
  assert.equal(getFall(f.id)!.triage, null); // nicht gesetzt, nicht gesperrt
}

// ── Angehörigenfall: HC wird mit Grund abgelehnt, LPB erlaubt (V2) ───────────
{
  const f = frischerFall(); gesperrtesSda(f, "5"); // Triage nur_sda
  const r = kannFormularEroeffnen(f.id, "hc");
  assert.equal(r.zulaessig, false);
  assert.match(grundVon(r), /Triage/);
  assert.equal(kannFormularEroeffnen(f.id, "lpb").zulaessig, true);
  assert.throws(() => createFormular(f.id, "hc"), /Triage/);
}

// ── Reihenfolge: HC nicht ohne gesperrtes SDA (V5) ───────────────────────────
{
  const f = frischerFall(); createFormular(f.id, "sda"); // SDA da, aber NICHT gesperrt
  const r = kannFormularEroeffnen(f.id, "hc");
  assert.equal(r.zulaessig, false);
  assert.match(grundVon(r), /SDA/);
}

// ── kannFormularEroeffnen: alle vier Typen, je zulässig + unzulässig (V16) ────
// sda
{ const f = frischerFall(); assert.equal(kannFormularEroeffnen(f.id, "sda").zulaessig, true);
  createFormular(f.id, "sda"); assert.equal(kannFormularEroeffnen(f.id, "sda").zulaessig, false); }
// hc
{ const f = frischerFall(); gesperrtesSda(f, "1"); assert.equal(kannFormularEroeffnen(f.id, "hc").zulaessig, true);
  const g = frischerFall(); gesperrtesSda(g, "5"); assert.equal(kannFormularEroeffnen(g.id, "hc").zulaessig, false); }
// lpb
{ const f = frischerFall(); gesperrtesSda(f, "5"); assert.equal(kannFormularEroeffnen(f.id, "lpb").zulaessig, true);
  const g = frischerFall(); createFormular(g.id, "sda"); assert.equal(kannFormularEroeffnen(g.id, "lpb").zulaessig, false); }
// entlassung (V6): alle Formulare gesperrt → zulässig; ein offenes → unzulässig
{ const f = frischerFall(); gesperrtesSda(f, "1"); assert.equal(kannFormularEroeffnen(f.id, "entlassung").zulaessig, true);
  const g = frischerFall(); gesperrtesSda(g, "1"); createFormular(g.id, "lpb"); // LPB in Bearbeitung
  assert.equal(kannFormularEroeffnen(g.id, "entlassung").zulaessig, false); }

// ── Fallschliessung: Sperren der Entlassung schliesst den Fall (V7) ──────────
{
  const f = frischerFall(); gesperrtesSda(f, "1");
  const entl = createFormular(f.id, "entlassung");
  entl.status = "vollstaendig"; sperreFormular(entl.id, "Test");
  assert.ok(getFall(f.id)!.geschlossenAm, "Entlassung sperren setzt geschlossenAm");
  assert.equal(kannFormularEroeffnen(f.id, "sda").zulaessig, false);
  assert.equal(kannFormularEroeffnen(f.id, "lpb").zulaessig, false);
}

// ── Unveränderlichkeit: Schreibversuch auf gesperrtes Formular wirft (V8) ────
{
  const f = frischerFall(); const sda = gesperrtesSda(f, "1");
  assert.throws(() => updateAssessmentAnswers(sda.id, { x: "1" }), /gesperrt/);
}

// ── laufnummer (V11) + vorgaengerId desselben Falls (V12) ────────────────────
{
  const klient = "PERS-T-lauf";
  const f = frischerFall("2099", klient); gesperrtesSda(f, "1");
  const hc1 = createFormular(f.id, "hc");
  assert.equal(hc1.laufnummer, 1);
  assert.equal(hc1.vorgaengerId, null);
  hc1.status = "vollstaendig"; sperreFormular(hc1.id, "Test");
  const hc2 = createFormular(f.id, "hc");
  assert.equal(hc2.laufnummer, 2);
  assert.equal(hc2.vorgaengerId, hc1.id); // desselben Falls

  // Anderer Fall desselben Klienten → HC beginnt wieder bei 1
  const f2 = eroeffneFall(klient, "2099-05-05"); gesperrtesSda(f2, "1");
  const hcAnder = createFormular(f2.id, "hc");
  assert.equal(hcAnder.laufnummer, 1);
  assert.notEqual(hc2.vorgaengerId, hcAnder.id); // nicht aus einem anderen Fall
}

// ── iA5d: SDA und HC desselben Falls tragen dieselbe Fallnummer (V13) ────────
{
  const f = frischerFall();
  const sda = createFormular(f.id, "sda");
  sda.answers["BB16"] = "1"; sda.status = "vollstaendig"; sperreFormular(sda.id, "Test");
  const hc = createFormular(f.id, "hc");
  assert.equal(sda.answers["BB5b"], f.fallnummer);
  assert.equal(hc.answers["A5b"], f.fallnummer);
  assert.equal(sda.answers["BB5b"], hc.answers["A5b"]);
}

// ── offenerFallFuerKlient / formulareFuerFall: geschlossen nicht unter offen ──
{
  const klient = "PERS-T-sep";
  const closed = eroeffneFall(klient, "2099-01-01");
  const s1 = gesperrtesSda(closed, "1");
  const entl = createFormular(closed.id, "entlassung");
  entl.status = "vollstaendig"; sperreFormular(entl.id, "Test"); // schliesst
  const open = eroeffneFall(klient, "2099-02-02");
  const s2 = createFormular(open.id, "sda");

  const off = offenerFallFuerKlient(klient);
  assert.ok(off);
  assert.equal(off!.geschlossenAm, null);
  assert.equal(off!.id, open.id);
  const idsOffen = formulareFuerFall(off!.id).map((f) => f.id);
  assert.ok(idsOffen.includes(s2.id));
  assert.ok(!idsOffen.includes(s1.id), "Formular des geschlossenen Falls nicht unter dem offenen");
  assert.equal(getFaelleFuerKlient(klient).length, 2);
}

console.log("store.test.ts: alle Zusicherungen erfüllt");
