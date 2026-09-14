/**
 * Planungslogik des Massnahmen-Editors (Lauf 3) — reine Funktionen, damit
 * Satzzeile, Wochensumme und Mandats-Sichtbarkeit testbar sind, ohne den
 * Browser zu bemühen. UI-Anbindung des Vertrags, keine Vertragslogik.
 */
import type { MassnahmenPlanung, ErbringerCode } from "./plan-store";

/* ── Tageszeitfenster ──────────────────────────────────────────────────── */
export const TAGESZEIT_FENSTER: { id: string; label: string; satz: string }[] = [
  { id: "jederzeit", label: "Jederzeit", satz: "jederzeit" },
  { id: "aufstehzeit", label: "Aufstehzeit (7–9)", satz: "zur Aufstehzeit" },
  { id: "morgens", label: "Morgens (8–12)", satz: "morgens" },
  { id: "mittags", label: "Mittags/Essen (12–14)", satz: "mittags" },
  { id: "nachmittags", label: "Nachmittags (13–18)", satz: "nachmittags" },
  { id: "abends", label: "Abends/Essen (18–20)", satz: "abends" },
  { id: "schlafenszeit", label: "Zur Schlafenszeit (21–23)", satz: "zur Schlafenszeit" },
  { id: "nachts", label: "Nachts (22–7)", satz: "nachts" },
];

export const WOCHENTAG_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export const ERBRINGER: { code: ErbringerCode; label: string; folge: string }[] = [
  { code: "S", label: "S – Spitex", folge: "wird verrechnet, zählt zur Wochensumme" },
  { code: "I", label: "I – Informelles Netzwerk", folge: "Bedarf gedeckt, keine Verrechnung" },
  { code: "A", label: "A – Andere Anbieter", folge: "anderer Leistungserbringer" },
  { code: "V", label: "V – Verweigerung", folge: "Bedarf festgestellt, Klientin lehnt ab" },
];

/* ── Wochenzeit ────────────────────────────────────────────────────────── */
/**
 * Geplante Ausführungen je Woche einer Massnahme — die Vergleichsbasis der
 * Häufigkeitsprüfung (Lauf 6). Der Vergleich läuft auf Wochenbasis, nicht
 * auf Einheitenbasis: «3× an Werktagen» sind 15 je Woche; ein
 * Einheitenvergleich versagt bei «An Werktagen» und bei benutzerdefinierten
 * Intervallen.
 *
 * Umrechnung: einmalig zählt null, täglich ×7, an Werktagen ×5, wöchentlich
 * × Anzahl gewählter Tage, monatlich ÷ 4.33, benutzerdefiniert entsprechend
 * («alle N Tage» → 7/N Vorkommen, «alle N Wochen» → gewählte Tage ÷ N).
 */
export function wochenVorkommen(p: MassnahmenPlanung): number {
  if (p.wiederholung === null) return 0;
  switch (p.wiederholung) {
    case "einmalig": return 0;
    case "taeglich": return p.anzahl * 7;
    case "werktage": return p.anzahl * 5;
    case "woechentlich": return p.anzahl * Math.max(1, p.wochentage.length);
    case "monatlich": return p.anzahl / 4.33;
    case "benutzerdefiniert":
      return p.intervallEinheit === "tage"
        ? p.anzahl * (7 / Math.max(1, p.intervallN))
        : (p.anzahl * Math.max(1, p.wochentage.length)) / Math.max(1, p.intervallN);
  }
}

/**
 * Geplante Minuten je Woche einer Massnahme: Vorkommen × Dauer.
 *
 * PLANUNGSNÄHERUNG, keine Abrechnungsgrösse: Fünf-Minuten-Takt,
 * Mindesteinsatzdauer und Einsatzbündelung sind nicht berücksichtigt.
 * Wer diese Zahl später für eine Abrechnung hält, irrt.
 */
export function wochenMinuten(p: MassnahmenPlanung, dauerMin: number | null): number {
  if (dauerMin === null) return 0;
  return wochenVorkommen(p) * dauerMin;
}

/* ── Mandat: Sichtbarkeit und Satz-Regel ───────────────────────────────── */
export interface MandatKurz { id: string; label: string }

/** Ein Feld erscheint erst, wenn es abweichen kann — bei einem Mandat ist
 *  die Auswahl unsichtbar. */
export function mandatAuswahlSichtbar(mandate: MandatKurz[]): boolean {
  return mandate.length > 1;
}

/** Der Satz nennt das Mandat nur, wenn der Klient mehrere hat und nicht das
 *  erste gewählt ist. */
export function mandatImSatz(mandate: MandatKurz[], mandatId: string | null): string | null {
  if (mandate.length <= 1 || !mandatId) return null;
  if (mandatId === mandate[0].id) return null;
  return mandate.find(m => m.id === mandatId)?.label ?? null;
}

/* ── Die Satzzeile ─────────────────────────────────────────────────────── */
/** Ein Teil des Massnahmen-Satzes. Fett ist, was gesetzt wurde; der Rest
 *  kommt aus dem Katalog. Warnfarbe für «nicht verrechnet». */
export interface SatzTeil {
  text: string;
  fett?: boolean;
  warn?: boolean;
}

export function haeufigkeitsText(p: MassnahmenPlanung): string | null {
  if (p.wiederholung === null) return null;
  const tage = p.wochentage.map(t => WOCHENTAG_KURZ[t]).join(" ");
  switch (p.wiederholung) {
    case "einmalig": {
      const [j, m, t] = p.einmalDatum.split("-");
      return p.einmalDatum ? `einmalig am ${t}.${m}.${j}` : "einmalig";
    }
    case "taeglich": return `${p.anzahl}× täglich`;
    case "werktage": return `${p.anzahl}× an Werktagen (Mo–Fr)`;
    case "woechentlich": return `${p.anzahl}× wöchentlich${tage ? `, ${tage}` : ""}`;
    case "monatlich": return `${p.anzahl}× monatlich`;
    case "benutzerdefiniert":
      return `${p.anzahl}× alle ${p.intervallN} ${p.intervallEinheit === "tage" ? "Tage" : "Wochen"}${tage ? `, ${tage}` : ""}`;
  }
}

export function tageszeitenText(p: MassnahmenPlanung): string | null {
  const fenster = p.tageszeiten
    .map(id => TAGESZEIT_FENSTER.find(f => f.id === id)?.satz ?? id);
  const alle = [...fenster, ...p.eigeneZeiten];
  return alle.length > 0 ? alle.join(", ") : null;
}

/**
 * Der Massnahmen-Satz für den Baum. Zwei Angaben erscheinen nur bei
 * Abweichung vom Normalfall: der Erbringer, wenn nicht S (Warnfarbe,
 * «nicht verrechnet»), und das Mandat, wenn mehrere bestehen und nicht das
 * erste gewählt ist.
 */
export function massnahmenSatz(
  p: MassnahmenPlanung,
  katalog: { positionsText: string; vorgabeMinuten: number | null; qualifikation: string | null },
  mandate: MandatKurz[],
): SatzTeil[] {
  const teile: SatzTeil[] = [];

  const haeufigkeit = haeufigkeitsText(p);
  const zeiten = tageszeitenText(p);
  if (haeufigkeit || zeiten) {
    teile.push({ text: [haeufigkeit, zeiten].filter(Boolean).join(" · "), fett: true });
  }

  const dauer = p.dauerMin ?? katalog.vorgabeMinuten;
  if (dauer !== null) teile.push({ text: `${dauer} min`, fett: p.dauerMin !== null });

  const quali = p.qualifikation ?? katalog.qualifikation;
  if (quali) teile.push({ text: quali, fett: p.qualifikation !== null });

  if (p.erbringer !== "S") {
    const label = ERBRINGER.find(e => e.code === p.erbringer)?.label ?? p.erbringer;
    teile.push({ text: `${label} · nicht verrechnet`, fett: true, warn: true });
  }

  const mandat = mandatImSatz(mandate, p.mandatId);
  if (mandat) teile.push({ text: mandat, fett: true });

  if (teile.length === 0) teile.push({ text: katalog.positionsText });
  else teile.unshift({ text: katalog.positionsText });

  return teile;
}
