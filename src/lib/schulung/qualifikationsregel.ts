/**
 * Qualifikationsregel — Zuordnung Qualifikationsstufe → erlaubte KLV-Kategorien.
 *
 * ACHTUNG: Diese Regel ist fachlich NICHT VALIDIERT. Sie dient als
 * austauschbarer Platzhalter bis zur formalen Freigabe durch die Fachleitung.
 *
 * Definiert an EINER Stelle. Nicht über mehrere Dateien verstreuen.
 */

import type { Qualifikation } from "../../app/components/angehoerigeData";
import type { KLVKategorie } from "../klv/spitex-leistungskatalog-2025";

/**
 * VORLÄUFIGE Regel (unvalidiert):
 * - ohne_srk / srk: nur Kategorie c (Grundpflege)
 * - fage_dipl: Kategorien a, b und c
 */
const ERLAUBTE_KATEGORIEN: Record<Qualifikation, KLVKategorie[]> = {
  ohne_srk: ["c"],
  srk: ["c"],
  fage_dipl: ["a", "b", "c"],
};

export interface QualifikationsPruefung {
  erlaubt: boolean;
  /** null = erlaubt oder keine Kategorie; string = Begründung warum nicht erlaubt */
  grund: string | null;
}

/**
 * Prüft ob eine KLV-Kategorie für eine Qualifikationsstufe zulässig ist.
 *
 * - kategorie null → "Kategorie nicht erfasst", bleibt unterschreibbar
 * - qualifikation leer/unbekannt → alle erlaubt (Hinweis im UI)
 */
export function pruefeQualifikation(
  qualifikation: string | null | undefined,
  kategorie: KLVKategorie | null,
): QualifikationsPruefung {
  // Keine Kategorie → erlaubt (mit Hinweis im UI)
  if (kategorie === null) {
    return { erlaubt: true, grund: null };
  }

  // Keine Qualifikation erfasst → alles erlaubt (Hinweis im UI)
  if (!qualifikation || !(qualifikation in ERLAUBTE_KATEGORIEN)) {
    return { erlaubt: true, grund: null };
  }

  const erlaubt = ERLAUBTE_KATEGORIEN[qualifikation as Qualifikation];
  if (erlaubt.includes(kategorie)) {
    return { erlaubt: true, grund: null };
  }

  const kategorieLabel = kategorie === "a" ? "Abklärung (a)" : kategorie === "b" ? "Behandlung (b)" : "Grundpflege (c)";
  const qualLabel = qualifikation === "ohne_srk" ? "ohne SRK" : qualifikation === "srk" ? "SRK" : "FaGe / Dipl";
  return {
    erlaubt: false,
    grund: `Kategorie ${kategorieLabel} ist gemäss Qualifikation «${qualLabel}» nicht zulässig`,
  };
}
