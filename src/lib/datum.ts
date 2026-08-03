/**
 * Zentrales Datums-Util für das Produkt.
 *
 * Einzige Quelle für Formatierung, Parsing und Gültigkeitsprüfung von Daten.
 * Alle Operationen laufen über date-fns mit deutscher Locale — keine
 * handgeschriebenen Zeichenketten-Operationen. Geparst wird STRIKT: eine
 * unmögliche Eingabe wie 31.02.2026 wird als ungültig erkannt und nicht still
 * auf den 3. März gedreht.
 *
 * Speicherformate bleiben aufrufstellenspezifisch (ISO / Anzeigestring /
 * Date-Objekt) — dieses Util vereinheitlicht nur die Operationen, nicht die
 * Formate.
 */
import {
  format,
  parse,
  isValid,
  differenceInCalendarDays,
} from "date-fns";
import { de } from "date-fns/locale";

const ANZEIGE = "dd.MM.yyyy";
const ISO = "yyyy-MM-dd";

// ── Formatierung zur Anzeige ─────────────────────────────────────────────────

/** dd.MM.yyyy */
export function formatAnzeige(d: Date): string {
  return format(d, ANZEIGE);
}

/** Mit ausgeschriebenem Wochentag, z. B. "Sonntag, 15. Februar 2026". */
export function formatMitWochentag(d: Date): string {
  return format(d, "EEEE, d. MMMM yyyy", { locale: de });
}

/**
 * Datum und Zeit als dd.MM.yyyy HH:mm — mit LEERZEICHEN als Trenner.
 * Dies ist die einzige gültige Variante; die Komma-Variante gilt als überholt.
 */
export function formatDatumZeit(d: Date): string {
  return format(d, "dd.MM.yyyy HH:mm");
}

/** Monat und Jahr ausgeschrieben, z. B. "Februar 2026" (Monatsgruppen-Kopf). */
export function formatMonatJahr(d: Date): string {
  return format(d, "MMMM yyyy", { locale: de });
}

/** Tag und Monat ohne Jahr, z. B. "14.02." (innerhalb einer Monatsgruppe). */
export function formatTagMonat(d: Date): string {
  return format(d, "dd.MM.");
}

/**
 * Relative Fälligkeitsbezeichnung. Wird in diesem Lauf nur bereitgestellt,
 * nicht angewendet.
 *
 * Heute / Morgen / Gestern; innerhalb ±14 Tagen "in X Tagen" bzw.
 * "X Tage überfällig"; ansonsten das absolute Datum dd.MM.yyyy.
 */
export function formatFaelligkeit(d: Date, referenz: Date = new Date()): string {
  const diff = differenceInCalendarDays(d, referenz);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Morgen";
  if (diff === -1) return "Gestern";
  if (diff > 1 && diff <= 14) return `in ${diff} Tagen`;
  if (diff < -1 && diff >= -14) return `${Math.abs(diff)} Tage überfällig`;
  return formatAnzeige(d);
}

// ── Gültigkeit ───────────────────────────────────────────────────────────────

export function istGueltig(d: Date | null | undefined): d is Date {
  return d instanceof Date && isValid(d);
}

// ── Strikte Interpretation einer Benutzereingabe ─────────────────────────────

export type ParseStatus = "ok" | "leer" | "unvollstaendig" | "ungueltig";

export interface ParseErgebnis {
  date: Date | null;
  status: ParseStatus;
}

/**
 * Interpretiert eine Benutzereingabe strikt und tolerant zugleich:
 * - tolerant gegenüber Schreibweisen: "1522026", "15.2.2026" und "15 2 2026"
 *   ergeben alle den 15.02.2026.
 * - zweistellige Jahreszahlen werden NICHT ergänzt: "15.02.26" gilt als
 *   unvollständig (Jahr vierstellig eingeben). Begründung: 1926 vs. 2026 ist
 *   bei Geburtsdaten nicht erratbar.
 * - unmögliche Daten (31.02.2026) sind ungültig, keine stille Korrektur.
 */
export function parseEingabe(input: string): ParseErgebnis {
  const trimmed = input.trim();
  if (trimmed === "") return { date: null, status: "leer" };

  let d: string | undefined;
  let m: string | undefined;
  let y: string | undefined;

  const hatTrenner = /\D/.test(trimmed);
  if (hatTrenner) {
    const teile = trimmed.split(/\D+/).filter(Boolean);
    if (teile.length !== 3) return { date: null, status: "ungueltig" };
    [d, m, y] = teile;
  } else {
    // Reine Ziffernfolge
    const digits = trimmed;
    if (digits.length === 8) {
      d = digits.slice(0, 2); m = digits.slice(2, 4); y = digits.slice(4, 8);
    } else if (digits.length === 7) {
      // Tag + einstelliger Monat + vierstelliges Jahr, z. B. 1522026
      y = digits.slice(3); const rest = digits.slice(0, 3);
      d = rest.slice(0, 2); m = rest.slice(2);
    } else if (digits.length === 6) {
      // DDMMYY → zweistelliges Jahr → unvollständig
      y = digits.slice(4, 6);
      d = digits.slice(0, 2); m = digits.slice(2, 4);
    } else {
      return { date: null, status: "unvollstaendig" };
    }
  }

  if (y.length === 2) return { date: null, status: "unvollstaendig" };
  if (y.length !== 4) return { date: null, status: "unvollstaendig" };

  const norm = `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
  const parsed = parse(norm, ANZEIGE, new Date());
  // Reformat-Vergleich: fängt Rollover (31.02 → 03.03) als ungültig ab.
  if (!isValid(parsed) || format(parsed, ANZEIGE) !== norm) {
    return { date: null, status: "ungueltig" };
  }
  return { date: parsed, status: "ok" };
}

// ── Umwandlung zwischen ISO und Anzeigeformat ────────────────────────────────

/** ISO yyyy-MM-dd → dd.MM.yyyy. Leerer String bei ungültiger Eingabe. */
export function isoZuAnzeige(iso: string): string {
  if (!iso) return "";
  const d = parse(iso, ISO, new Date());
  return istGueltig(d) ? formatAnzeige(d) : "";
}

/** dd.MM.yyyy → ISO yyyy-MM-dd. Leerer String bei ungültiger Eingabe. */
export function anzeigeZuIso(anzeige: string): string {
  const { date, status } = parseEingabe(anzeige);
  return status === "ok" && date ? format(date, ISO) : "";
}

/** ISO yyyy-MM-dd → Date | null. */
export function isoZuDate(iso: string): Date | null {
  if (!iso) return null;
  const d = parse(iso, ISO, new Date());
  return istGueltig(d) ? d : null;
}

/** Date → ISO yyyy-MM-dd ("" bei ungültigem Datum). */
export function dateZuIso(d: Date | null | undefined): string {
  return istGueltig(d) ? format(d, ISO) : "";
}
