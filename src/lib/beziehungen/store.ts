/**
 * Bestand der Beziehungen — Sitzungsdauer.
 *
 * Der Startbestand ist ÜBERNOMMEN, nicht erfunden: aus der Zeichenkette am
 * Patienten („Vera Steiner (Ehefrau)"), aus der typisierten Verknüpfung am
 * Angehörigen (`zugeordnetePatientenList`), aus der Bezugsperson und aus dem
 * Notfallkontakt. Wo die Zeichenkette eine Verwandtschaft nannte, wurde sie
 * dem Katalog zugeordnet — Ehefrau und Ehemann zu `ehepartner`, Tochter und
 * Sohn zu `kind`, Schwester zu `geschwister`. Wo sie nichts nannte, bleibt
 * die Art leer statt geraten.
 *
 * Weitere Verknüpfungen ohne Nennung in der Zeichenkette werden zu
 * `angehoerige` ohne Verwandtschaftsangabe: dass jemand verknüpft ist, sagt
 * nichts darüber, wie er verwandt ist.
 *
 * Hausärzte erscheinen nur, wo ein Name erfasst ist — bei keinem Patienten
 * des Bestands ist das der Fall.
 */
import { useSyncExternalStore } from "react";
import type { Beziehung } from "./beziehungen";

const SEED: Beziehung[] = [
  { id: "BEZ-001", patientId: "P-2026-0041", person: { art: "angehoeriger", kennung: "A-2026-0101" }, rolle: "pflegende_angehoerige", art: "ehepartner", beginn: "12.01.2026", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 312 55 01", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-002", patientId: "P-2026-0041", person: { art: "angehoeriger", kennung: "A-2026-0110" }, rolle: "angehoerige", art: "", beginn: "12.01.2026", ende: "", notfallkontakt: false, auskunftsberechtigt: false, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-003", patientId: "P-2026-0041", person: { art: "mitarbeitende", name: "Sandra Weber" }, rolle: "bezugsperson", art: "", beginn: "12.01.2026", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-004", patientId: "P-2026-0042", person: { art: "angehoeriger", kennung: "A-2026-0102" }, rolle: "pflegende_angehoerige", art: "kind", beginn: "20.02.2026", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 320 18 44", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-005", patientId: "P-2026-0042", person: { art: "mitarbeitende", name: "Kathrin Meier" }, rolle: "bezugsperson", art: "", beginn: "20.02.2026", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-006", patientId: "P-2026-0043", person: { art: "angehoeriger", kennung: "A-2026-0103" }, rolle: "pflegende_angehoerige", art: "kind", beginn: "03.09.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 555 22 10", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-007", patientId: "P-2026-0043", person: { art: "angehoeriger", kennung: "A-2026-0111" }, rolle: "angehoerige", art: "", beginn: "03.09.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: false, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-008", patientId: "P-2026-0043", person: { art: "mitarbeitende", name: "Laura Brunner" }, rolle: "bezugsperson", art: "", beginn: "03.09.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-009", patientId: "P-2026-0044", person: { art: "angehoeriger", kennung: "A-2026-0104" }, rolle: "pflegende_angehoerige", art: "ehepartner", beginn: "15.06.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 310 77 33", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-010", patientId: "P-2026-0044", person: { art: "mitarbeitende", name: "Maria Keller" }, rolle: "bezugsperson", art: "", beginn: "15.06.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-011", patientId: "P-2026-0045", person: { art: "angehoeriger", kennung: "A-2026-0105" }, rolle: "pflegende_angehoerige", art: "geschwister", beginn: "28.07.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 299 33 15", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-012", patientId: "P-2026-0045", person: { art: "mitarbeitende", name: "Sandra Weber" }, rolle: "bezugsperson", art: "", beginn: "28.07.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-013", patientId: "P-2026-0046", person: { art: "angehoeriger", kennung: "A-2026-0106" }, rolle: "pflegende_angehoerige", art: "kind", beginn: "22.02.2026", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 401 12 88", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-014", patientId: "P-2026-0047", person: { art: "angehoeriger", kennung: "A-2026-0107" }, rolle: "pflegende_angehoerige", art: "kind", beginn: "01.11.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 488 91 02", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-015", patientId: "P-2026-0047", person: { art: "angehoeriger", kennung: "A-2026-0103" }, rolle: "angehoerige", art: "", beginn: "01.11.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: false, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-016", patientId: "P-2026-0047", person: { art: "mitarbeitende", name: "Kathrin Meier" }, rolle: "bezugsperson", art: "", beginn: "01.11.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-017", patientId: "P-2026-0048", person: { art: "angehoeriger", kennung: "A-2026-0108" }, rolle: "pflegende_angehoerige", art: "ehepartner", beginn: "05.04.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 677 45 20", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-018", patientId: "P-2026-0048", person: { art: "mitarbeitende", name: "Laura Brunner" }, rolle: "bezugsperson", art: "", beginn: "05.04.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-019", patientId: "P-2026-0049", person: { art: "angehoeriger", kennung: "A-2026-0109" }, rolle: "pflegende_angehoerige", art: "ehepartner", beginn: "18.12.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 555 88 43", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-020", patientId: "P-2026-0049", person: { art: "angehoeriger", kennung: "A-2026-0103" }, rolle: "angehoerige", art: "", beginn: "18.12.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: false, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-021", patientId: "P-2026-0049", person: { art: "mitarbeitende", name: "Sandra Weber" }, rolle: "bezugsperson", art: "", beginn: "18.12.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-022", patientId: "P-2026-0050", person: { art: "angehoeriger", kennung: "A-2026-0110" }, rolle: "pflegende_angehoerige", art: "ehepartner", beginn: "10.10.2025", ende: "", notfallkontakt: true, auskunftsberechtigt: true, telefon: "+41 44 210 63 77", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-023", patientId: "P-2026-0050", person: { art: "angehoeriger", kennung: "A-2026-0107" }, rolle: "angehoerige", art: "", beginn: "10.10.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: false, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
  { id: "BEZ-024", patientId: "P-2026-0050", person: { art: "mitarbeitende", name: "Maria Keller" }, rolle: "bezugsperson", art: "", beginn: "10.10.2025", ende: "", notfallkontakt: false, auskunftsberechtigt: true, telefon: "", zugehoerigkeit: "", vertretungsart: "", bemerkung: "" },
];

let bestand: Beziehung[] = SEED;
const hoerer = new Set<() => void>();

function setzeBestand(neu: Beziehung[]): void {
  bestand = neu;
  hoerer.forEach(l => l());
}

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

const schnappschuss = () => bestand;

export function useBeziehungen(): Beziehung[] {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

export function getBeziehungen(patientId: string): Beziehung[] {
  return bestand.filter(b => b.patientId === patientId);
}

/**
 * Beziehung beenden — nicht löschen.
 *
 * Bei einer Kassenkontrolle ist „wer hat damals gepflegt" die Frage; ein
 * gelöschter Eintrag gibt darauf keine Antwort. Eine bereits beendete
 * Beziehung wird nicht erneut beendet.
 */
/**
 * Beziehung anlegen oder ändern.
 *
 * Eine leere Kennung legt an, eine bestehende ändert. Gelöscht wird nie —
 * eine beendete Beziehung bleibt mit Enddatum sichtbar, weil bei einer
 * Kassenkontrolle „wer hat damals gepflegt" die Frage ist.
 *
 * Die abgeleitete Hausarzt-Beziehung kommt hier nie an: sie liegt nicht im
 * Bestand, und die Ansicht bietet für sie keinen Bearbeiten-Weg.
 */
export function beziehungSichern(eingabe: Omit<Beziehung, "id"> & { id: string }): Beziehung {
  if (eingabe.id) {
    const aktualisiert = { ...eingabe } as Beziehung;
    setzeBestand(bestand.map(b => (b.id === eingabe.id ? aktualisiert : b)));
    return aktualisiert;
  }
  const neu: Beziehung = { ...eingabe, id: naechsteKennung() } as Beziehung;
  setzeBestand([...bestand, neu]);
  return neu;
}

/** Fortlaufend, ohne Lücke zum Startbestand — BEZ-025, BEZ-026, … */
function naechsteKennung(): string {
  const hoechste = bestand.reduce((max, b) => {
    const m = /^BEZ-(\d+)$/.exec(b.id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `BEZ-${String(hoechste + 1).padStart(3, "0")}`;
}

export function beziehungBeenden(id: string, datum: string): void {
  const b = bestand.find(x => x.id === id);
  if (!b || b.ende.trim() !== "") return;
  setzeBestand(bestand.map(x => (x.id === id ? { ...x, ende: datum } : x)));
}
