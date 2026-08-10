/**
 * Bestand der Dokumente — Sitzungsdauer.
 *
 * Gebaut nach dem Vorbild von lib/notizen/store.ts: Modulzustand hinter
 * useSyncExternalStore, benannte Lesewege.
 *
 * DER STARTBESTAND TRÄGT NUR, WAS BESTAND. Die 41 Einträge stammen aus den
 * Angehörigendaten, deren freie Namen den Typcodes zugeordnet wurden. Acht
 * Einträge mit dem alten Status „fehlend" sind nicht übernommen: die
 * Abwesenheit eines Dokuments ist kein Dokument, sie ergibt sich aus der
 * Pflichtprüfung gegen den Katalog.
 *
 * FÜR PATIENTEN GIBT ES KEINE. Kein Onboarding-Fall trägt Dokumentstände —
 * `scans` beginnt leer und füllt sich erst durch Hochladen in der laufenden
 * Sitzung. Die Patientenansichten bleiben deshalb leer und sagen das; ein
 * erfundenes Dokument wäre schlimmer als keines.
 */
import { useSyncExternalStore } from "react";
import type { Dokument } from "./dokumente";

const SEED: Dokument[] = [
  { id: "DOK-001", ref: { art: "angehoeriger", kennung: "A-2026-0101" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.02.2026", bezugId: null },
  { id: "DOK-002", ref: { art: "angehoeriger", kennung: "A-2026-0101" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.02.2026", bezugId: null },
  { id: "DOK-003", ref: { art: "angehoeriger", kennung: "A-2026-0101" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "04.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "04.02.2026", bezugId: null },
  { id: "DOK-004", ref: { art: "angehoeriger", kennung: "A-2026-0101" }, typCode: "srk_zertifikat",
    bezeichnung: "SRK-Pflegehelfer-Zertifikat", ausgestelltAm: "11.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "11.02.2026", bezugId: null },
  { id: "DOK-005", ref: { art: "angehoeriger", kennung: "A-2026-0102" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "05.04.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.04.2026", bezugId: null },
  { id: "DOK-006", ref: { art: "angehoeriger", kennung: "A-2026-0103" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.08.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.08.2025", bezugId: null },
  { id: "DOK-007", ref: { art: "angehoeriger", kennung: "A-2026-0103" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.08.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.08.2025", bezugId: null },
  { id: "DOK-008", ref: { art: "angehoeriger", kennung: "A-2026-0103" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "05.08.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.08.2025", bezugId: null },
  { id: "DOK-009", ref: { art: "angehoeriger", kennung: "A-2026-0103" }, typCode: "partner_ausweis",
    bezeichnung: "Ausweis Partner", ausgestelltAm: "07.08.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "07.08.2025", bezugId: null },
  { id: "DOK-010", ref: { art: "angehoeriger", kennung: "A-2026-0103" }, typCode: "familienbuechlein",
    bezeichnung: "Familienbüchlein", ausgestelltAm: "07.08.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "07.08.2025", bezugId: null },
  { id: "DOK-011", ref: { art: "angehoeriger", kennung: "A-2026-0103" }, typCode: "sprachzertifikat_deutsch",
    bezeichnung: "Sprachzertifikat Deutsch", ausgestelltAm: "09.08.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "09.08.2025", bezugId: null },
  { id: "DOK-012", ref: { art: "angehoeriger", kennung: "A-2026-0104" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.11.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.11.2024", bezugId: null },
  { id: "DOK-013", ref: { art: "angehoeriger", kennung: "A-2026-0104" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.11.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.11.2024", bezugId: null },
  { id: "DOK-014", ref: { art: "angehoeriger", kennung: "A-2026-0104" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "04.11.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "04.11.2024", bezugId: null },
  { id: "DOK-015", ref: { art: "angehoeriger", kennung: "A-2026-0104" }, typCode: "srk_zertifikat",
    bezeichnung: "SRK-Pflegehelfer-Zertifikat", ausgestelltAm: "21.11.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "21.11.2024", bezugId: null },
  { id: "DOK-016", ref: { art: "angehoeriger", kennung: "A-2026-0104" }, typCode: "familienbuechlein",
    bezeichnung: "Familienbüchlein", ausgestelltAm: "06.11.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "06.11.2024", bezugId: null },
  { id: "DOK-017", ref: { art: "angehoeriger", kennung: "A-2026-0105" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "19.06.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "19.06.2025", bezugId: null },
  { id: "DOK-018", ref: { art: "angehoeriger", kennung: "A-2026-0105" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "19.06.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "19.06.2025", bezugId: null },
  { id: "DOK-019", ref: { art: "angehoeriger", kennung: "A-2026-0105" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "20.06.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "20.06.2025", bezugId: null },
  { id: "DOK-020", ref: { art: "angehoeriger", kennung: "A-2026-0106" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "06.07.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "06.07.2026", bezugId: null },
  { id: "DOK-021", ref: { art: "angehoeriger", kennung: "A-2026-0106" }, typCode: "srk_zertifikat",
    bezeichnung: "SRK-Pflegehelfer-Zertifikat", ausgestelltAm: "09.07.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "09.07.2026", bezugId: null },
  { id: "DOK-022", ref: { art: "angehoeriger", kennung: "A-2026-0107" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.02.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.02.2025", bezugId: null },
  { id: "DOK-023", ref: { art: "angehoeriger", kennung: "A-2026-0107" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.02.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.02.2025", bezugId: null },
  { id: "DOK-024", ref: { art: "angehoeriger", kennung: "A-2026-0107" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "04.02.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "04.02.2025", bezugId: null },
  { id: "DOK-025", ref: { art: "angehoeriger", kennung: "A-2026-0107" }, typCode: "familienbuechlein",
    bezeichnung: "Familienbüchlein", ausgestelltAm: "07.02.2025", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "07.02.2025", bezugId: null },
  { id: "DOK-026", ref: { art: "angehoeriger", kennung: "A-2026-0108" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "05.05.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.05.2026", bezugId: null },
  { id: "DOK-027", ref: { art: "angehoeriger", kennung: "A-2026-0109" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.09.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.09.2024", bezugId: null },
  { id: "DOK-028", ref: { art: "angehoeriger", kennung: "A-2026-0109" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.09.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.09.2024", bezugId: null },
  { id: "DOK-029", ref: { art: "angehoeriger", kennung: "A-2026-0109" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "04.09.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "04.09.2024", bezugId: null },
  { id: "DOK-030", ref: { art: "angehoeriger", kennung: "A-2026-0109" }, typCode: "srk_zertifikat",
    bezeichnung: "SRK-Pflegehelfer-Zertifikat", ausgestelltAm: "29.09.2024", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "29.09.2024", bezugId: null },
  { id: "DOK-031", ref: { art: "angehoeriger", kennung: "A-2026-0110" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.12.2023", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.12.2023", bezugId: null },
  { id: "DOK-032", ref: { art: "angehoeriger", kennung: "A-2026-0110" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.12.2023", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.12.2023", bezugId: null },
  { id: "DOK-033", ref: { art: "angehoeriger", kennung: "A-2026-0110" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "05.12.2023", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.12.2023", bezugId: null },
  { id: "DOK-034", ref: { art: "angehoeriger", kennung: "A-2026-0110" }, typCode: "partner_ausweis",
    bezeichnung: "Ausweis Partner", ausgestelltAm: "07.12.2023", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "07.12.2023", bezugId: null },
  { id: "DOK-035", ref: { art: "angehoeriger", kennung: "A-2026-0110" }, typCode: "familienbuechlein",
    bezeichnung: "Familienbüchlein", ausgestelltAm: "07.12.2023", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "07.12.2023", bezugId: null },
  { id: "DOK-036", ref: { art: "angehoeriger", kennung: "A-2026-0111" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "05.03.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.03.2026", bezugId: null },
  { id: "DOK-037", ref: { art: "angehoeriger", kennung: "A-2026-0112" }, typCode: "ausweis_id",
    bezeichnung: "ID / Pass", ausgestelltAm: "03.01.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.01.2026", bezugId: null },
  { id: "DOK-038", ref: { art: "angehoeriger", kennung: "A-2026-0112" }, typCode: "krankenkassenkarte",
    bezeichnung: "Krankenkassenkarte", ausgestelltAm: "03.01.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "03.01.2026", bezugId: null },
  { id: "DOK-039", ref: { art: "angehoeriger", kennung: "A-2026-0112" }, typCode: "bankkarte",
    bezeichnung: "Bankkarte / IBAN-Nachweis", ausgestelltAm: "05.01.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.01.2026", bezugId: null },
  { id: "DOK-040", ref: { art: "angehoeriger", kennung: "A-2026-0112" }, typCode: "partner_ausweis",
    bezeichnung: "Ausweis Partner", ausgestelltAm: "07.01.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "07.01.2026", bezugId: null },
  { id: "DOK-041", ref: { art: "angehoeriger", kennung: "A-2026-0112" }, typCode: "familienbuechlein",
    bezeichnung: "Familienbüchlein", ausgestelltAm: "08.01.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "08.01.2026", bezugId: null },
];

let bestand: Dokument[] = SEED;
const hoerer = new Set<() => void>();

function subscribe(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

const schnappschuss = () => bestand;

export function useDokumente(): Dokument[] {
  return useSyncExternalStore(subscribe, schnappschuss, schnappschuss);
}

export function getDokumente(): Dokument[] {
  return bestand;
}
