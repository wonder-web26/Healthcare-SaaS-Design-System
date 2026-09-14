/**
 * Leistungspositionen — Anreicherung der beiden Bestandsquellen auf den
 * Vertragstyp. Die Quellen selbst bleiben unverändert:
 *
 * - SPITEX_LEISTUNGSKATALOG_2025: nummer, bezeichnung, kategorie (bereich),
 *   klv, vorgabeMinuten — Herkunft "katalog".
 * - KLV_AUSFUEHRUNGSSCHRITTE (Initialschulungs-Vorlage, 85 Positionen):
 *   füllt `teilhandlungen` — Herkunft "kuratiert", denn diese Schritte sind
 *   NICHT identisch mit den Teilhandlungen des offiziellen Leistungskatalogs,
 *   dessen Vollfassung uns nicht vorliegt. Einzige Ausnahme: Position 10102,
 *   deren zehn Teilhandlungen belegt sind — Herkunft "katalog".
 * - mindestqualifikation, maxAnzahl, maxEinheit: für den Prototyp frei
 *   gewählt — Herkunft "mock". Positionen ohne Anreicherung tragen null
 *   und fallen nicht aus dem Vertrag.
 */
import { SPITEX_LEISTUNGSKATALOG_2025 } from "../klv/spitex-leistungskatalog-2025";
import { KLV_AUSFUEHRUNGSSCHRITTE } from "../klv/klv-ausfuehrungsschritte";
import type { FeldHerkunft, Leistungsposition, MitHerkunft, PositionsNummer } from "./vertrag";

/** Die eine Position, deren Teilhandlungen amtlich belegt sind. */
const BELEGTE_TEILHANDLUNGEN: PositionsNummer = "10102";

/** Frei gewählte Prototyp-Anreicherung (Herkunft "mock") für ausgewählte
 *  Positionen; alle übrigen tragen null. */
const MOCK_ANREICHERUNG: Record<PositionsNummer, {
  mindestqualifikation?: string;
  maxAnzahl?: number;
  maxEinheit?: "tag" | "woche";
}> = {
  "10101": { mindestqualifikation: "Pflegehelfer/in SRK", maxAnzahl: 1, maxEinheit: "tag" },
  "10102": { mindestqualifikation: "Pflegehelfer/in SRK", maxAnzahl: 1, maxEinheit: "tag" },
  "10103": { mindestqualifikation: "Pflegehelfer/in SRK", maxAnzahl: 2, maxEinheit: "tag" },
  "10505": { mindestqualifikation: "Pflegehelfer/in SRK", maxAnzahl: 3, maxEinheit: "tag" },
  // Lauf 6b: Mindestqualifikation für die doppelt belegte Position, damit
  // das Blatt Zuweisung gegen Katalogminimum zeigen kann (V18).
  "10506": { mindestqualifikation: "Pflegehelfer/in SRK" },
  "10602": { mindestqualifikation: "FaGe", maxAnzahl: 7, maxEinheit: "woche" },
  "10802": { mindestqualifikation: "FaGe", maxAnzahl: 1, maxEinheit: "tag" },
};

const schritteJeNummer = new Map(KLV_AUSFUEHRUNGSSCHRITTE.map(a => [a.nr, a.schritte]));

function baueposition(nr: PositionsNummer): MitHerkunft<Leistungsposition> | null {
  const kat = SPITEX_LEISTUNGSKATALOG_2025.find(p => p.nr === nr);
  if (!kat) return null;
  const schritte = schritteJeNummer.get(nr) ?? null;
  const zusatz = MOCK_ANREICHERUNG[nr] ?? {};

  const wert: Leistungsposition = {
    nummer: kat.nr,
    bezeichnung: kat.bezeichnung,
    kategorie: kat.bereich,
    klv: kat.klvKategorie ?? "nein",
    vorgabeMinuten: kat.zeitMin,
    mindestqualifikation: zusatz.mindestqualifikation ?? null,
    maxAnzahl: zusatz.maxAnzahl ?? null,
    maxEinheit: zusatz.maxEinheit ?? null,
    teilhandlungen: schritte ? [...schritte] : null,
  };

  const herkunft: FeldHerkunft<Leistungsposition> = {
    nummer: "katalog",
    bezeichnung: "katalog",
    kategorie: "katalog",
    klv: "katalog",
    vorgabeMinuten: "katalog",
    // Auch die Aussage «nicht angereichert» (null) ist eine Prototyp-Setzung.
    mindestqualifikation: "mock",
    maxAnzahl: "mock",
    maxEinheit: "mock",
    teilhandlungen: schritte === null ? "mock" : nr === BELEGTE_TEILHANDLUNGEN ? "katalog" : "kuratiert",
  };

  return { ...wert, herkunft };
}

/** Einzelauflösung einer Position — die einzige Leseschnittstelle nach aussen.
 *  Die Quelltabellen bleiben gekapselt (Tauschgrenze). */
export function leistungsposition(nr: PositionsNummer): MitHerkunft<Leistungsposition> | null {
  return baueposition(nr);
}
