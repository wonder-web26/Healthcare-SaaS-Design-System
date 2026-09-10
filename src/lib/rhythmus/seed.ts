/**
 * Betreuungsrhythmen des Startbestands.
 *
 * Vorher entstanden sie beim Rendern: `Patient360Page` und
 * `Angehoerige360Page` riefen `generiereRhythmusTickets` im Rumpf auf, und
 * damit legte das blosse Ansehen eines Dossiers fünfzehn beziehungsweise
 * fünf Pendenzen an. Der Service Desk zeigte je nach Navigationsverlauf eine
 * andere Zahl, und zwei Personen sahen denselben Bildschirm verschieden.
 *
 * Fachlich hängt der Rhythmus an der Anstellung, nicht an der Betrachtung:
 * der Administrativvertrag verlangt die fachliche Begleitung ab Anstellung.
 * Im Betrieb entsteht er darum beim Abschluss des Onboardings
 * (lib/onboarding/konvertierung.ts). Die zehn Patienten und die angehörigen
 * Personen des Startbestands stammen aus keinem Onboarding — ihre Rhythmen
 * gehören deshalb hierher, wie alle übrigen Mockdaten.
 *
 * Erzeugt wird genau, was vorher beim Öffnen entstand: dieselbe Vorlage,
 * derselbe Anker, dieselben Fälligkeiten. Nichts darüber hinaus.
 */
import { patientenSeed } from "../../app/components/patientData";
import { seedDemoRhythmus } from "../../app/components/demoSteinerFall";
import { angehoerigeSeed } from "../../app/components/angehoerigeData";
import { generiereRhythmusTickets, getTicketsFuerSubjekt, seedTicketErledigt } from "./engine";

/** TT.MM.JJJJ → JJJJ-MM-TT; alles andere unverändert zurück. */
function alsIso(anzeige: string): string {
  const t = anzeige.split(".");
  return t.length === 3 ? `${t[2]}-${t[1]}-${t[0]}` : anzeige;
}

/* Patienten: Anker ist das Aufnahmedatum — dasselbe Feld, das die Vorlage
   nennt (`ankerDatum: "aufnahmedatum"`). Ohne Aufnahmedatum kein Rhythmus. */
for (const p of patientenSeed) {
  if (!p.aufnahmeDatum) continue;
  generiereRhythmusTickets(
    "patient", p.id, `${p.nachname}, ${p.vorname}`,
    alsIso(p.aufnahmeDatum), p.pflegefachkraft,
  );
}

/* Angehörige: Anker ist das Eintrittsdatum. Dieselbe Bedingung wie vorher im
   Dossier — nur angestellte Personen tragen einen Rhythmus. */
for (const a of angehoerigeSeed) {
  if (a.status !== "aktiv" || !a.eintrittsdatum) continue;
  generiereRhythmusTickets(
    "angehoeriger", a.id, `${a.vorname} ${a.nachname}`,
    alsIso(a.eintrittsdatum), a.pflegefachkraft,
  );
}

/* Der Demo-Onboarding-Fall trägt einen eigenen Rhythmus auf seiner
   Fallkennung. Er hing an einem useEffect der Onboarding-Seite und entstand
   damit beim Öffnen — derselbe Fehler eine Ebene weiter. */
seedDemoRhythmus();

/* ── Vera Steiner: ein Rhythmus mit Verlauf ─────────────────────────────────
   Ohne diesen Abschnitt stünden alle fünf Schritte auf "offen" und wären am
   Stichtag längst überfällig — während der Überblick einen künftigen Termin
   zeigt. Genau dieser Widerspruch war der Anlass.

   Erledigt wird, was zum Eintritt 01.03.2026 passt: M1 bis M4 (April bis Juli)
   sind gelaufen und protokolliert, das Reassessment M6 am 01.09.2026 steht
   offen. Damit deckt sich `monatsSchritt` im Überblick (5 von 5, Reassessment,
   01.09.2026) mit dem, was der Reiter "Betreuung" zeigt.

   Die Erledigungsdaten liegen einige Tage nach der Fälligkeit — so arbeitet
   ein Betrieb, und es zeigt zugleich, dass die Angaben nicht gerechnet,
   sondern erfasst sind. */
const VERA_ERLEDIGT: Record<string, { am: string; protokoll: string }> = {
  rk_m1: { am: "2026-04-03", protokoll: "Initialschulung zu Transfer und Lagerung durchgeführt. Vera Steiner führt die Transfers sicher aus; Rollator ist eingestellt. Regelkontrolle ohne Beanstandung." },
  rk_m2: { am: "2026-05-05", protokoll: "Mikroschulung Medikamentenmanagement. Wochendispenser wird korrekt geführt, Insulingabe morgens sitzt. Keine Rückfragen offen." },
  rk_m3: { am: "2026-06-04", protokoll: "Fallbesprechung mit Vera Steiner und Hausarzt Dr. M. Huber. Gangunsicherheit hat zugenommen; Physiotherapie zweimal wöchentlich vereinbart." },
  rk_m4: { am: "2026-07-02", protokoll: "Arbeitskontrolle bestanden, Dokumentation vollständig. Mikroschulung zur Sturzprophylaxe im Bad; Haltegriffe wurden montiert." },
};

for (const t of getTicketsFuerSubjekt("angehoeriger", "A-2026-0101")) {
  const e = VERA_ERLEDIGT[t.schrittCode];
  if (!e) continue;
  const r = seedTicketErledigt(t.id, "Sandra Weber", e.am, e.protokoll);
  // Ein Fehlschlag hiesse, dass Vorlage und Startbestand auseinanderlaufen —
  // das soll auffallen und nicht stillschweigend zu einem leeren Verlauf führen.
  if (!r.ok) console.warn(`[Rhythmus-Seed] ${t.schrittCode} nicht erledigt: ${r.fehler}`);
}
