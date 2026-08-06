/**
 * Notizen — Modell und reine Funktionen an EINEM Ort (nicht in der Komponente).
 *
 * Eine Notiz hält fest, was war. Eine Pendenz hält fest, was zu tun ist. Notizen
 * haben deshalb bewusst KEINEN Status, kein Fälligkeitsdatum, keinen Zuständigen,
 * keinen Erledigt-Zustand, keine Art und keine Kategorie. Es gibt keine Verknüpfung
 * und keine Umwandlung zwischen Notiz und Pendenz.
 *
 * Die Notiz referenziert die Person über eine TYPISIERTE REFERENZ (Objektart +
 * Kennung), niemals über den Namen. Der Name wird beim Anzeigen aus der Quelle
 * aufgelöst (siehe lib/onboarding/faelle.ts); eine gespeicherte Namenskopie würde
 * nach einer Namensänderung veralten.
 *
 * ── Kennungsformat (einzige dokumentierte Stelle) ──────────────────────────────
 * Es gibt je Objektart GENAU EINEN Kennungsraum. Ein zweiter, paralleler Raum
 * lief hier bereits auseinander: Onboarding-Fälle verwiesen auf P-2026-01NN,
 * während der Bestand P-2026-004x führte — die Verweise zeigten ins Leere.
 *
 *   • Patient:    patientId       = "P-2026-00NN"   (art "patient")
 *                 führend ist der Bestand in app/components/patientData.ts
 *   • Angehörige: angehoerigerId  = "A-2026-01NN"   (art "angehoeriger")
 *                 führend ist der Bestand in app/components/angehoerigeData.ts
 *
 * Der Onboarding-Fall verweist auf die Kennung des Bestands; der Bestandspatient
 * trägt umgekehrt die `onboardingId` seines Falls. Beide Richtungen treffen.
 * Kennungen werden fest im Mock vergeben, nie aus dem Namen abgeleitet.
 */

export type PersonArt = "patient" | "angehoeriger";

/** Typisierte Referenz auf die Person — Art + Kennung, kein Name. */
export interface NotizReferenz {
  art: PersonArt;
  kennung: string;
}

export interface Notiz {
  id: string;
  ref: NotizReferenz;
  text: string;
  autor: string;              // Kurzname aus den Mock-Benutzern (z. B. "M. Keller")
  erstelltAm: string;         // ISO-Zeitstempel
  geaendertAm: string | null; // leer, solange unverändert
  angeheftet: boolean;        // "Anheften" — wirkt nur in der Notizspur der Person
  geloeschtAm: string | null; // gesetzt = gelöscht; Eintrag bleibt bestehen
}

/** Ab dieser Länge erscheint der Zähler; bei NOTIZ_MAX_ANGEHEFTET endet die Eingabe. */
export const NOTIZ_ZAEHLER_AB = 100;
export const NOTIZ_MAX_ANGEHEFTET = 120;

/* ── Reine Funktionen ─────────────────────────────────────────────────────── */

export function refGleich(a: NotizReferenz, b: NotizReferenz): boolean {
  return a.art === b.art && a.kennung === b.kennung;
}

/**
 * Sichtbare Notizen einer Person: nicht gelöscht, Referenz passt; sortiert
 * angeheftet zuoberst, danach chronologisch absteigend (neueste zuerst).
 */
export function sichtbareNotizen(alle: Notiz[], ref: NotizReferenz): Notiz[] {
  return alle
    .filter(n => n.geloeschtAm === null && refGleich(n.ref, ref))
    .sort((a, b) => {
      if (a.angeheftet !== b.angeheftet) return a.angeheftet ? -1 : 1;
      return b.erstelltAm.localeCompare(a.erstelltAm);
    });
}

/* `angehefteteNotiz(alle, ref)` ist entfallen: die einzige Aufrufstelle war das
   Kennzeichen in der Onboarding-Liste. Innerhalb der Notizspur wird die
   angeheftete Notiz direkt aus der bereits gefilterten Sicht gelesen. */

/** Neue Notiz voranstellen (unveränderte Eingabeliste). */
export function mitNeuerNotiz(
  alle: Notiz[],
  n: { id: string; ref: NotizReferenz; text: string; autor: string; angeheftet: boolean; jetzt: string },
): Notiz[] {
  let next = alle;
  // Höchstens eine angeheftete je Person: eine neue angeheftete löst die bisherige.
  if (n.angeheftet) next = loeseAnheftung(next, n.ref);
  const neu: Notiz = {
    id: n.id, ref: n.ref, text: n.text, autor: n.autor,
    erstelltAm: n.jetzt, geaendertAm: null, angeheftet: n.angeheftet, geloeschtAm: null,
  };
  return [neu, ...next];
}

/** Text ändern und Änderungszeitpunkt setzen. */
export function mitBearbeitung(alle: Notiz[], id: string, text: string, jetzt: string): Notiz[] {
  return alle.map(n => n.id === id ? { ...n, text, geaendertAm: jetzt } : n);
}

/** Anheften: diese Notiz anheften, jede andere angeheftete derselben Person lösen. */
export function mitAnheftung(alle: Notiz[], id: string): Notiz[] {
  const ziel = alle.find(n => n.id === id);
  if (!ziel) return alle;
  return alle.map(n => {
    if (n.id === id) return { ...n, angeheftet: true };
    if (refGleich(n.ref, ziel.ref) && n.angeheftet) return { ...n, angeheftet: false };
    return n;
  });
}

/** Anheftung dieser Notiz lösen. */
export function mitGeloesterAnheftung(alle: Notiz[], id: string): Notiz[] {
  return alle.map(n => n.id === id ? { ...n, angeheftet: false } : n);
}

/** Löschen: Löschzeitpunkt setzen (Eintrag bleibt bestehen, verschwindet aus der Oberfläche). */
export function mitGeloescht(alle: Notiz[], id: string, jetzt: string): Notiz[] {
  return alle.map(n => n.id === id ? { ...n, geloeschtAm: jetzt } : n);
}

/** Wiederherstellen: Löschzeitpunkt entfernen, Erstellzeitpunkt bleibt unverändert. */
export function mitWiederhergestellt(alle: Notiz[], id: string): Notiz[] {
  return alle.map(n => n.id === id ? { ...n, geloeschtAm: null } : n);
}

function loeseAnheftung(alle: Notiz[], ref: NotizReferenz): Notiz[] {
  return alle.map(n => refGleich(n.ref, ref) && n.angeheftet ? { ...n, angeheftet: false } : n);
}
