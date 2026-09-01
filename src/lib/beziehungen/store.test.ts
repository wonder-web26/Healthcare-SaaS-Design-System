/**
 * Unit-Tests für die automatische pflegende_angehoerige-Beziehung — node:assert,
 *   npx tsx src/lib/beziehungen/store.test.ts
 *
 * V10: Nach dem Ausfüllen des Angehörigen-Reiters existiert eine Beziehung mit
 * der Rolle pflegende_angehoerige; ändert sich die Person, folgt die Beziehung
 * (keine zweite aktive entsteht).
 */
import assert from "node:assert/strict";
import { sichereGepflegteAngehoerige, getBeziehungen, beziehungSichern, sichereEindeutigenHausarzt } from "./store";
import {
  istAktiv, leereBeistandschaft, kategorieFuerRolle, ROLLEN_JE_KATEGORIE, personentypFuerRolle, BEZIEHUNGSROLLE,
  type BeziehungsrolleCode,
} from "./beziehungen";

const P = "P-TEST-BEZ";
const pflegende = () => getBeziehungen(P).filter(b => b.rolle === "pflegende_angehoerige" && b.ende.trim() === "");

// Anlegen
sichereGepflegteAngehoerige(P, "A-2026-9001", "01.01.2026");
let liste = pflegende();
assert.equal(liste.length, 1, "eine aktive pflegende_angehoerige");
assert.equal(liste[0].person.art, "angehoeriger");
assert.equal((liste[0].person as { kennung: string }).kennung, "A-2026-9001");

// Idempotent: gleiche Person → keine zweite
sichereGepflegteAngehoerige(P, "A-2026-9001", "01.01.2026");
assert.equal(pflegende().length, 1, "keine zweite bei gleicher Person");

// Person wechselt → Beziehung folgt, weiterhin genau eine aktive
sichereGepflegteAngehoerige(P, "A-2026-9002", "01.01.2026");
liste = pflegende();
assert.equal(liste.length, 1, "weiterhin genau eine aktive");
assert.equal((liste[0].person as { kennung: string }).kennung, "A-2026-9002", "Person folgt");

// Leere Kennungen: kein Effekt
sichereGepflegteAngehoerige("", "A-x", "01.01.2026");
sichereGepflegteAngehoerige(P, "", "01.01.2026");
assert.equal(pflegende().length, 1);

// ── §7/§8: Hausarzt eindeutig, andere Rollen mehrfach ────────────────────────
{
  const PH = "P-TEST-HAUSARZT";
  const offene = (rolle: string) => getBeziehungen(PH).filter(b => b.rolle === rolle && istAktiv(b));
  const neu = (rolle: BeziehungsrolleCode, kontakt: string) =>
    beziehungSichern({
      id: "", patientId: PH, person: { art: "kontakt", kennung: kontakt }, rolle,
      art: "", beginn: "", ende: "", notfallkontakt: false, auskunftsberechtigt: false,
      telefon: "", beistandschaft: leereBeistandschaft(), bemerkung: "",
    });

  neu("hausarzt", "K-HA-1");
  const h2 = neu("hausarzt", "K-HA-2");
  sichereEindeutigenHausarzt(PH, h2.id, "03.08.2026");
  assert.equal(offene("hausarzt").length, 1, "§7: nur ein offener Hausarzt");
  assert.equal(offene("hausarzt")[0].id, h2.id, "§7: der zuletzt gespeicherte bleibt offen");

  // §8: mehrere Spezialärzte, Apotheken und Spitäler sind zulässig und bleiben unberührt.
  neu("spezialarzt", "K-SP-1"); neu("spezialarzt", "K-SP-2");
  neu("apotheke", "K-AP-1"); neu("apotheke", "K-AP-2");
  neu("spital", "K-KL-1"); neu("spital", "K-KL-2");
  sichereEindeutigenHausarzt(PH, h2.id, "03.08.2026");
  assert.equal(offene("spezialarzt").length, 2, "§8: zwei Spezialärzte bleiben offen");
  assert.equal(offene("apotheke").length, 2, "§8: zwei Apotheken bleiben offen");
  assert.equal(offene("spital").length, 2, "§8: zwei Spitäler bleiben offen");
}

// ── Rolle spital + Personentyp je Rolle (Einzelquelle) ───────────────────────
assert.equal(kategorieFuerRolle("spital"), "fachpersonal", "spital ist Fachpersonal");
assert.deepEqual(ROLLEN_JE_KATEGORIE.fachpersonal, ["hausarzt", "spezialarzt", "therapie", "apotheke", "spital"]);
assert.equal(personentypFuerRolle("hausarzt"), "person");
assert.equal(personentypFuerRolle("spezialarzt"), "person");
assert.equal(personentypFuerRolle("therapie"), "person");
assert.equal(personentypFuerRolle("angehoerige"), "person");
assert.equal(personentypFuerRolle("weitere"), "person");
assert.equal(personentypFuerRolle("apotheke"), "organisation");
assert.equal(personentypFuerRolle("spital"), "organisation");
assert.equal(personentypFuerRolle("sozialdienst"), "organisation");
assert.equal(personentypFuerRolle("beistand"), "umschalter");
// Nur der Beistand ist ein Umschalter.
assert.equal(BEZIEHUNGSROLLE.filter(r => personentypFuerRolle(r.code) === "umschalter").length, 1);

console.log("beziehungen/store.test.ts: alle Zusicherungen erfüllt");
