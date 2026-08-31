/**
 * Unit-Tests für die automatische pflegende_angehoerige-Beziehung — node:assert,
 *   npx tsx src/lib/beziehungen/store.test.ts
 *
 * V10: Nach dem Ausfüllen des Angehörigen-Reiters existiert eine Beziehung mit
 * der Rolle pflegende_angehoerige; ändert sich die Person, folgt die Beziehung
 * (keine zweite aktive entsteht).
 */
import assert from "node:assert/strict";
import { sichereGepflegteAngehoerige, getBeziehungen } from "./store";

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

console.log("beziehungen/store.test.ts: alle Zusicherungen erfüllt");
