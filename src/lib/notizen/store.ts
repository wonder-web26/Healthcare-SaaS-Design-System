/**
 * Notiz-Speicher — Prototyp: lebt im Modul-State (kein Backend, keine Persistenz,
 * kein Neuladen-Überleben; das ist Absicht). Der Zustand wird über EINEN externen
 * Store gehalten, damit Onboarding-Liste und Onboarding-Assistent dieselben Notizen
 * sehen. Alle Mutationen laufen über die reinen Funktionen aus notizen.ts.
 */
import { useSyncExternalStore } from "react";
import {
  type Notiz, type NotizReferenz,
  mitNeuerNotiz, mitBearbeitung, mitAnheftung, mitGeloesterAnheftung,
  mitGeloescht, mitWiederhergestellt,
} from "./notizen";

/* ── Seed-Mock ──────────────────────────────────────────────────────────────
   Vera Steiner (Angehörige, A-2026-0101): 12 Notizen — eine angeheftet, eine
   bearbeitet, eine über drei Zeilen lang, über drei Monate verteilt.
   Hans-Rudolf Steiner (Patient, P-2026-0101): 2 Notizen, keine angeheftet.
   Anna Bösiger (Patient, P-2026-0107): eine angeheftete Notiz.
   Erika Huber (Angehörige, A-2026-0105): keine.
   Autorennamen aus den bestehenden Mock-Benutzern (M. Keller, S. Weber, R. Ott). */
const VERA: NotizReferenz = { art: "angehoeriger", kennung: "A-2026-0101" };
const HANSRUDOLF: NotizReferenz = { art: "patient", kennung: "P-2026-0101" };
const BOESIGER: NotizReferenz = { art: "patient", kennung: "P-2026-0107" };

const SEED: Notiz[] = [
  // ── Vera Steiner ──
  { id: "N-A0101-01", ref: VERA, autor: "M. Keller", erstelltAm: "2026-02-27T09:15:00", geaendertAm: null, angeheftet: true, geloeschtAm: null,
    text: "Bevorzugt Anrufe vormittags, nachmittags ist sie beim Patienten. Nie vor 08:00 anrufen." },
  { id: "N-A0101-02", ref: VERA, autor: "S. Weber", erstelltAm: "2026-02-26T16:40:00", geaendertAm: "2026-02-27T08:05:00", angeheftet: false, geloeschtAm: null,
    text: "Neue Bankverbindung telefonisch durchgegeben, unterschriebenes Formular folgt per Post." },
  { id: "N-A0101-03", ref: VERA, autor: "M. Keller", erstelltAm: "2026-02-20T11:00:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Längeres Telefonat zur Übergabe: Die Angehörige übernimmt ab kommender Woche die Morgenpflege selbstständig, benötigt aber weiterhin Unterstützung beim Duschen an drei Tagen. Sie fühlt sich mit dem Lifter unsicher und möchte eine erneute Einweisung. Ausserdem wünscht sie eine feste Ansprechperson für Rückfragen, damit sie nicht jedes Mal jemand anderem die Situation neu erklären muss." },
  { id: "N-A0101-04", ref: VERA, autor: "R. Ott", erstelltAm: "2026-02-14T14:30:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Rückruf von Dr. Lüthi: Rezept verlängert, Abholung ab Montag in der Apotheke Kaufmann." },
  { id: "N-A0101-05", ref: VERA, autor: "M. Keller", erstelltAm: "2026-02-05T10:10:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Kurzfristige Absage des Termins wegen Erkältung, neuer Vorschlag für nächste Woche." },
  { id: "N-A0101-06", ref: VERA, autor: "S. Weber", erstelltAm: "2026-01-28T13:20:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Übergabe an den Spätdienst: Medikamentenschrank aufgefüllt, Verbandmaterial nachbestellt." },
  { id: "N-A0101-07", ref: VERA, autor: "M. Keller", erstelltAm: "2026-01-22T09:45:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Tochter meldet: Patient schläft tagsüber mehr, nachts unruhig. Beobachten." },
  { id: "N-A0101-08", ref: VERA, autor: "R. Ott", erstelltAm: "2026-01-15T15:05:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Anruf bei der Hausarzt-Praxis, Termin für die Blutentnahme koordiniert." },
  { id: "N-A0101-09", ref: VERA, autor: "M. Keller", erstelltAm: "2026-01-08T08:50:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Schlüsselübergabe geklärt, Ersatzschlüssel liegt bei der Nachbarin Frau Reber." },
  { id: "N-A0101-10", ref: VERA, autor: "S. Weber", erstelltAm: "2025-12-30T11:30:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Jahreswechsel: Vertretung durch S. Weber, Angehörige wurde vorab informiert." },
  { id: "N-A0101-11", ref: VERA, autor: "M. Keller", erstelltAm: "2025-12-18T16:15:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Weihnachtsbesuch der Familie angekündigt, Pflegezeiten für die Feiertage angepasst." },
  { id: "N-A0101-12", ref: VERA, autor: "R. Ott", erstelltAm: "2025-12-05T10:00:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Erstgespräch geführt, Erwartungen und Ablauf der Betreuung gemeinsam besprochen." },

  // ── Hans-Rudolf Steiner ──
  { id: "N-P0101-01", ref: HANSRUDOLF, autor: "M. Keller", erstelltAm: "2026-02-25T10:00:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Mag klassische Musik im Hintergrund, beruhigt ihn bei Unruhe." },
  { id: "N-P0101-02", ref: HANSRUDOLF, autor: "S. Weber", erstelltAm: "2026-02-10T14:00:00", geaendertAm: null, angeheftet: false, geloeschtAm: null,
    text: "Allergie gegen Penicillin im Stammblatt ergänzt." },

  // ── Anna Bösiger ──
  { id: "N-P0107-01", ref: BOESIGER, autor: "M. Keller", erstelltAm: "2026-02-27T09:00:00", geaendertAm: null, angeheftet: true, geloeschtAm: null,
    text: "Wohnungstür klemmt, kräftig ziehen. Der Hund bellt, ist aber harmlos." },
];

/* ── Externer Store ─────────────────────────────────────────────────────────── */
let notizen: Notiz[] = SEED;
let seq = 0;
const listeners = new Set<() => void>();

function emit(): void { for (const l of listeners) l(); }
function subscribe(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
function getSnapshot(): Notiz[] { return notizen; }

function jetztIso(): string { return new Date().toISOString(); }
function neueId(): string { seq += 1; return `N-neu-${seq}`; }

/** Reaktiver Zugriff auf alle Notizen (inkl. gelöschte — Filterung via reine Funktionen). */
export function useAlleNotizen(): Notiz[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function notizErstellen(ref: NotizReferenz, text: string, autor: string, angeheftet: boolean): void {
  notizen = mitNeuerNotiz(notizen, { id: neueId(), ref, text, autor, angeheftet, jetzt: jetztIso() });
  emit();
}
export function notizBearbeiten(id: string, text: string): void {
  notizen = mitBearbeitung(notizen, id, text, jetztIso());
  emit();
}
export function notizAnheften(id: string): void {
  notizen = mitAnheftung(notizen, id);
  emit();
}
export function notizAnheftungLoesen(id: string): void {
  notizen = mitGeloesterAnheftung(notizen, id);
  emit();
}
export function notizLoeschen(id: string): void {
  notizen = mitGeloescht(notizen, id, jetztIso());
  emit();
}
export function notizWiederherstellen(id: string): void {
  notizen = mitWiederhergestellt(notizen, id);
  emit();
}
