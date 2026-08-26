/**
 * Mandat — die Abrechnungsbeziehung eines Patienten.
 *
 * Wer zahlt, nach welchem Gesetz, aus welchem Grund, in welchem Zeitraum. Ein
 * Patient kann mehrere Mandate tragen, gleichzeitig oder nacheinander: gilt ein
 * Sturz als Unfall, läuft neben dem bestehenden KVG-Mandat ein zweites nach
 * UVG, mit anderem Zahler und anderem Tarif.
 *
 * Nicht zu verwechseln mit dem Onboarding-Fall (lib/onboarding/faelle.ts). Der
 * Fall beschreibt die Erfassung, das Mandat die Abrechnung.
 *
 * Der Zustand wird ABGELEITET, nicht erhoben: aktiv zwischen Beginn und Ende,
 * beendet nach dem Ende. Es gibt kein gespeichertes Statusfeld — ein zweiter
 * Wert könnte vom Datum abweichen.
 */
import type { MandatsartCode, GesetzesgrundlageCode, MandatsgrundCode } from "../stammdaten/mandat";

export interface Mandat {
  id: string;
  /** Verweis auf den Patienten (Kennung P-…). */
  patientId: string;
  mandatsart: MandatsartCode;
  gesetzesgrundlage: GesetzesgrundlageCode;
  grund: MandatsgrundCode;
  /** Schlüssel aus der Krankenkassenliste; leer ausserhalb der Versichertenleistung. */
  versicherer: string;
  policennummer: string;
  /** Fallnummer der Kasse — freiwillig. */
  fallnummerKasse: string;
  /** TT.MM.JJJJ. */
  beginn: string;
  /** TT.MM.JJJJ; leer = laufend. */
  ende: string;
  /** Zuständige Pflegefachkraft (Name wie am Patienten). */
  zustaendigePerson: string;
  /** Verweis auf die abgerechnete angehörige Person (Kennung A-…); leer erlaubt. */
  abgerechneteAngehoerige: string;
}

/* ── Zustand: abgeleitet ───────────────────────────────────────────────────── */

export type MandatZustand = "aktiv" | "beendet";

function ausAnzeigedatum(wert: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(wert.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Beendet, sobald das Ende vor dem Stichtag liegt. Ohne Ende läuft das Mandat;
 * ein unlesbares Ende gilt nicht als Ende, sondern als kein Ende — geraten wird
 * nichts.
 */
export function mandatZustand(m: Mandat, stichtag: Date): MandatZustand {
  const ende = ausAnzeigedatum(m.ende);
  if (!ende) return "aktiv";
  return stichtag > ende ? "beendet" : "aktiv";
}

export function istAktiv(m: Mandat, stichtag: Date): boolean {
  return mandatZustand(m, stichtag) === "aktiv";
}

/* ── Regeln ────────────────────────────────────────────────────────────────── */

/** M1 — Versichertenleistung verlangt Versicherer und Policennummer. */
export function m1FehlendeVersicherung(m: Mandat): ("versicherer" | "policennummer")[] {
  if (m.mandatsart !== "versichert") return [];
  const fehlt: ("versicherer" | "policennummer")[] = [];
  if (!m.versicherer.trim()) fehlt.push("versicherer");
  if (!m.policennummer.trim()) fehlt.push("policennummer");
  return fehlt;
}

/**
 * M2 — zwei aktive Mandate derselben Gesetzesgrundlage, deren Zeiträume sich
 * überschneiden. Hinweis an beiden, keine Sperre: fachlich kann es Gründe
 * geben, und das Cockpit entscheidet das nicht.
 */
export function m2Ueberschneidungen(alle: Mandat[], stichtag: Date): Set<string> {
  const betroffen = new Set<string>();
  const aktive = alle.filter(m => istAktiv(m, stichtag));
  for (let i = 0; i < aktive.length; i++) {
    for (let j = i + 1; j < aktive.length; j++) {
      const a = aktive[i], b = aktive[j];
      if (a.patientId !== b.patientId) continue;
      if (a.gesetzesgrundlage !== b.gesetzesgrundlage) continue;
      if (ueberschneidetSich(a, b)) { betroffen.add(a.id); betroffen.add(b.id); }
    }
  }
  return betroffen;
}

function ueberschneidetSich(a: Mandat, b: Mandat): boolean {
  const aB = ausAnzeigedatum(a.beginn), bB = ausAnzeigedatum(b.beginn);
  if (!aB || !bB) return false;
  const aE = ausAnzeigedatum(a.ende);
  const bE = ausAnzeigedatum(b.ende);
  // Ohne Ende reicht der Zeitraum unbegrenzt weiter.
  return (!aE || aE >= bB) && (!bE || bE >= aB);
}

/**
 * M3 — die abgerechnete angehörige Person muss mit diesem Patienten verknüpft
 * sein. Prüft gegen die bestehende Verknüpfung, legt keine an.
 */
export function m3VerknuepfungFehlt(
  m: Mandat,
  verknuepftePatienten: (angehoerigerId: string) => string[],
): boolean {
  if (!m.abgerechneteAngehoerige.trim()) return false;
  return !verknuepftePatienten(m.abgerechneteAngehoerige).includes(m.patientId);
}
