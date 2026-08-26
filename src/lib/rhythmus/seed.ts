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
import { generiereRhythmusTickets } from "./engine";

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
