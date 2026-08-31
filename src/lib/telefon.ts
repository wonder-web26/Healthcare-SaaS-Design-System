/**
 * Telefonnummern — Anzeige im Schweizer Format, ausländische Nummern bleiben.
 *
 * Kein Freitext: eine Nummer wird beim Verlassen des Felds in die
 * internationale Form überführt (`+41 44 000 00 00`). Beginnt sie mit einer
 * anderen Ländervorwahl, bleibt sie unverändert — eine deutsche oder
 * französische Nummer soll nicht zu einer falschen Schweizer werden.
 *
 * Reine Formatierung und Formatprüfung, keine Prüfung gegen ein Verzeichnis.
 */

/** Schweizer Teilnehmernummer (9 Stellen nach +41) aus einer Rohnummer, sonst "". */
function schweizerTeilnehmer(roh: string): string {
  const kompakt = roh.replace(/[^\d+]/g, "");
  let sub = "";
  if (kompakt.startsWith("+41")) sub = kompakt.slice(3);
  else if (kompakt.startsWith("0041")) sub = kompakt.slice(4);
  else if (kompakt.startsWith("0")) sub = kompakt.slice(1);
  else return "";
  sub = sub.replace(/\D/g, "");
  return sub.length === 9 ? sub : "";
}

/** Beginnt mit einer ausländischen Vorwahl (`+`, aber nicht `+41`/`0041`). */
function istAuslaendisch(roh: string): boolean {
  const t = roh.trim();
  if (!t.startsWith("+")) return false;
  const kompakt = t.replace(/\s/g, "");
  return !kompakt.startsWith("+41");
}

/**
 * Formatiert eine Rohnummer.
 * - Schweizer Nummer → `+41 44 123 45 67`
 * - Ausländische Nummer (andere Vorwahl) → unverändert (nur Mehrfach-Leerzeichen
 *   zusammengezogen)
 * - Nicht deutbar → wie getippt (das Blockieren übernimmt niemand)
 */
export function formatTelefon(roh: string): string {
  const t = (roh ?? "").trim();
  if (!t) return "";
  if (istAuslaendisch(t)) return t.replace(/\s+/g, " ");
  const sub = schweizerTeilnehmer(t);
  if (sub) return `+41 ${sub.slice(0, 2)} ${sub.slice(2, 5)} ${sub.slice(5, 7)} ${sub.slice(7, 9)}`;
  return t.replace(/\s+/g, " ");
}

/** Prüft das Format. Leerwert gilt als gültig (das Feld ist optional). */
export function pruefeTelefon(roh: string): { gueltig: boolean; hinweis?: string } {
  const t = (roh ?? "").trim();
  if (!t) return { gueltig: true };
  if (istAuslaendisch(t)) {
    const stellen = t.replace(/\D/g, "").length;
    return stellen >= 8 ? { gueltig: true } : { gueltig: false, hinweis: "Ausländische Nummer: Ländervorwahl und genügend Stellen angeben." };
  }
  return schweizerTeilnehmer(t) ? { gueltig: true } : { gueltig: false, hinweis: "Format z. B. +41 44 000 00 00." };
}
