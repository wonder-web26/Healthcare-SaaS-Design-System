/**
 * Unit-Tests für das Fallverlauf-Anzeigemodell — reines node:assert, ausführbar mit
 *   npx tsx src/lib/interrai/fallverlauf.test.ts
 *
 * V13 (Anzeige und Regel stimmen überein): Jedes vom Modell angebotene „Eröffnen"
 * (nächster Schritt) ist durch kannFormularEroeffnen gedeckt. V8: höchstens ein
 * nächster Schritt je Fall. Dazu die konkreten Seed-Fälle (Route, Reassessment,
 * geschlossener Fall).
 */
import assert from "node:assert/strict";
import { fallverlaufFuerKlient, ABKLAERUNG_NEUTRAL_TITEL, BEDINGUNG_INSTRUMENT_OFFEN, type FormularZeile } from "./fallverlauf";
import { kannFormularEroeffnen, fallStatus, eroeffneFall, createFormular, sperreFormular, getTypLabel } from "./store";

const naechste = (zeilen: { art: string }[]) =>
  zeilen.filter((z): z is FormularZeile => z.art === "formular" && (z as FormularZeile).zustand === "naechster_schritt");

const formularZeile = (m: { zeilen: unknown[] }, typ: string | null) =>
  (m.zeilen as FormularZeile[]).find((z) => z.art === "formular" && z.typ === typ);

/** Registrierung synthetisch sperren (Muster aus store.test.ts) → setzt die Route. */
function registriere(klient: string, bb16: string) {
  const f = eroeffneFall(klient, "2099-01-01");
  const r = createFormular(f.id, "registration");
  r.answers["CHBB16"] = bb16;
  r.status = "vollstaendig";
  sperreFormular(r.id, "Test");
  return f;
}
function sperre(form: { id: string; status: string }) {
  form.status = "vollstaendig";
  sperreFormular(form.id, "Test");
}

// ── V8 + V13 über alle Seed-Klienten/Fälle ───────────────────────────────────
for (const klient of ["PERS-001", "PERS-002", "PERS-003", "PERS-004"]) {
  for (const m of fallverlaufFuerKlient(klient, "patient")) {
    const ns = naechste(m.zeilen);
    assert.ok(ns.length <= 1, `${m.fallId}: höchstens ein nächster Schritt (V8), war ${ns.length}`);
    for (const z of ns) {
      assert.ok(z.typ, `${m.fallId}: nächster Schritt trägt einen Formulartyp`);
      assert.equal(
        kannFormularEroeffnen(m.fallId, z.typ!).zulaessig, true,
        `${m.fallId} ${z.typ}: Anzeige bietet Eröffnen, aber die Regel verbietet es (V13)`,
      );
    }
  }
}

// ── Fall B (PERS-002, housekeeping): Hauswirtschaft ist der nächste Schritt ───
{
  const mB = fallverlaufFuerKlient("PERS-002", "patient")[0];
  const ns = naechste(mB.zeilen);
  assert.equal(ns.length, 1);
  assert.equal(ns[0].typ, "housekeeping");
}

// ── Fall D (PERS-004, palliative): Hinweisblock, Entlassung ist nächster Schritt
{
  const mD = fallverlaufFuerKlient("PERS-004", "patient")[0];
  assert.ok(mD.zeilen.some((z) => z.art === "hinweis"), "palliativ → Hinweisblock statt Abklärungszeile");
  const ns = naechste(mD.zeilen);
  assert.equal(ns.length, 1);
  assert.equal(ns[0].typ, "discharge");
}

// ── PERS-003: offener Fall zuoberst; Reassessment; geschlossener Fall gesperrt ─
{
  const [mCneu, mCalt] = fallverlaufFuerKlient("PERS-003", "patient");
  // Reassessment: zwei HC-Zeilen mit Erst- und Reassessment-2-Titel (V11)
  const hc = mCneu.zeilen.filter((z): z is FormularZeile => z.art === "formular" && (z as FormularZeile).typ === "interrai_hc");
  assert.equal(hc.length, 2);
  assert.ok(hc[0].titel.includes("Erstassessment"), `erwartet Erstassessment, war "${hc[0].titel}"`);
  assert.ok(hc[1].titel.includes("Reassessment 2"), `erwartet Reassessment 2, war "${hc[1].titel}"`);
  assert.equal(naechste(mCneu.zeilen).length, 0, "HC2 in Bearbeitung → kein nächster Schritt");
  // Geschlossener Fall: alle Formularzeilen gesperrt, kein nächster Schritt (V10)
  assert.equal(fallStatus(mCalt.fallId), "discharged");
  assert.equal(naechste(mCalt.zeilen).length, 0);
  assert.ok(
    mCalt.zeilen.every((z) => z.art === "hinweis" || (z as FormularZeile).zustand === "gesperrt"),
    "geschlossener Fall: alle Zeilen gesperrt",
  );
}

// ── Fall A (PERS-001): Registrierung gesperrt, HC in Bearbeitung, kein nächster Schritt
{
  const mA = fallverlaufFuerKlient("PERS-001", "patient")[0];
  assert.equal(naechste(mA.zeilen).length, 0);
  assert.ok(mA.zeilen.some((z) => z.art === "formular" && (z as FormularZeile).zustand === "in_bearbeitung"));
}

// ── §5 Neutraler Titel, solange die Route offen ist (route === null) ─────────
{
  const K = "PERS-T-NEUTRAL";
  eroeffneFall(K, "2099-01-01"); // registrierender Fall, keine Registrierung gesperrt → route null
  const abkl = formularZeile(fallverlaufFuerKlient(K, "patient")[0], null);
  assert.ok(abkl, "neutrale Abklärungszeile vorhanden");
  assert.equal(ABKLAERUNG_NEUTRAL_TITEL, "Bedarfsabklärung");
  assert.equal(abkl!.titel, "Bedarfsabklärung", "route null → Titel Bedarfsabklärung, nicht interRAI HC");
  assert.equal(abkl!.bedingung, BEDINGUNG_INSTRUMENT_OFFEN);
  assert.equal(abkl!.bedingung, "Welches Instrument folgt, ergibt sich aus BB16 in der Registrierung.");
}

// ── §6 Konkretes Instrument nach dem Sperren: BB16=1 → HC, BB16=2 → CMH ──────
{
  registriere("PERS-T-HC", "1"); // somatic
  const hc = formularZeile(fallverlaufFuerKlient("PERS-T-HC", "patient")[0], "interrai_hc");
  assert.ok(hc, "BB16=1 → HC-Abklärungszeile");
  assert.equal(hc!.titel, getTypLabel("interrai_hc"));
  assert.equal(hc!.titel, "interRAI HC");

  registriere("PERS-T-CMH", "2"); // mental_health
  const cmh = formularZeile(fallverlaufFuerKlient("PERS-T-CMH", "patient")[0], "interrai_cmh");
  assert.ok(cmh, "BB16=2 → CMH-Abklärungszeile");
  assert.equal(cmh!.titel, getTypLabel("interrai_cmh"));
  assert.equal(cmh!.titel, "interRAI CMH");
}

// ── §1 Entlassung: im Onboarding keine Platzhalterzeile, in der Patientenansicht schon
{
  const f = registriere("PERS-T-ONB-OPEN", "1");
  sperre(createFormular(f.id, "interrai_hc")); // Abklärung gesperrt → Entlassung wäre nächster Schritt
  assert.ok(formularZeile(fallverlaufFuerKlient("PERS-T-ONB-OPEN", "patient")[0], "discharge"), "Patient: Entlassungszeile vorhanden");
  assert.equal(formularZeile(fallverlaufFuerKlient("PERS-T-ONB-OPEN", "onboarding")[0], "discharge"), undefined, "Onboarding: keine Entlassungszeile");
}

// ── §4 Geschlossener Fall im Onboarding: vorhandene Entlassung erscheint doch ──
{
  const f = registriere("PERS-T-ONB-CLOSED", "1");
  sperre(createFormular(f.id, "interrai_hc"));
  sperre(createFormular(f.id, "discharge")); // Fall geschlossen
  const dis = formularZeile(fallverlaufFuerKlient("PERS-T-ONB-CLOSED", "onboarding")[0], "discharge");
  assert.ok(dis, "Onboarding: geschlossener Fall zeigt die vorhandene Entlassung");
  assert.equal(dis!.zustand, "gesperrt");
}

console.log("fallverlauf.test.ts: alle Zusicherungen erfüllt");
