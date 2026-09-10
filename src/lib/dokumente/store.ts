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
 * FÜR PATIENTEN GIBT ES SIE SEIT DER ABLAGE. Früher stand hier, es gebe keine:
 * Dokumente entstünden allein durch Hochladen in der laufenden Sitzung, und ein
 * erfundenes Dokument wäre schlimmer als keines. Das galt, solange die Erfassung
 * der einzige Weg war.
 *
 * Mit der Ablage gilt das Gegenteil. Beim Abschluss eines Onboardings entsteht
 * je Person ein Ordner mit den Unterordnern der Vorgabe, und die im Onboarding
 * erfassten Unterlagen liegen darin. Wer danach das Dossier öffnet, findet sie
 * vor — eine leere Ablage wäre dort die falsche Aussage.
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

  /* ── Patienten ──────────────────────────────────────────────────────────────
     Diese Einträge sind neu. Der Kopf dieser Datei sagte bisher «FÜR PATIENTEN
     GIBT ES KEINE», mit der Begründung, Dokumente entstünden erst durch
     Hochladen in der laufenden Sitzung. Das galt, solange die Erfassung der
     einzige Weg war.

     Inzwischen gilt die Ablage: beim Abschluss eines Onboardings entsteht je
     Person ein Ordner mit den Unterordnern der Vorgabe, und die im Onboarding
     erfassten Unterlagen liegen darin. Wer danach das Dossier öffnet, findet
     sie vor — ein leerer Ordner wäre an dieser Stelle die falsche Aussage.

     `herkunft: "onboarding"` ist wörtlich zu nehmen: die Unterlagen stammen aus
     dem Onboarding der jeweiligen Person. Die Erfassungsdaten liegen nach dem
     Aufnahmedatum des Patienten und vor der Gegenwart.

     Bewusst NICHT vollständig: Ferrari (P-2026-0048) fehlt die Einwilligung und
     Da Silva (P-2026-0046) die Krankenkassenkarte. Die Pflichtprüfung soll auch
     etwas zu melden haben — eine lückenlose Ablage prüft sich selbst nie. ── */
  { id: "DOK-101", ref: { art: "patient", kennung: "P-2026-0041" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "18.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "20.02.2026", bezugId: null },
  { id: "DOK-102", ref: { art: "patient", kennung: "P-2026-0041" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "18.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "20.02.2026", bezugId: null },
  { id: "DOK-103", ref: { art: "patient", kennung: "P-2026-0041" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "22.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "22.02.2026", bezugId: null },
  { id: "DOK-104", ref: { art: "patient", kennung: "P-2026-0041" }, typCode: "patient_sonstige",
    bezeichnung: "Medikationsplan_Hausarzt.pdf", ausgestelltAm: "25.02.2026", herkunft: "hochgeladen", erfasstVon: "S. Weber", erfasstAm: "25.02.2026", bezugId: null },

  { id: "DOK-111", ref: { art: "patient", kennung: "P-2026-0042" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "20.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "21.02.2026", bezugId: null },
  { id: "DOK-112", ref: { art: "patient", kennung: "P-2026-0042" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "20.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "21.02.2026", bezugId: null },
  { id: "DOK-113", ref: { art: "patient", kennung: "P-2026-0042" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "24.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "24.02.2026", bezugId: null },

  { id: "DOK-121", ref: { art: "patient", kennung: "P-2026-0043" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "10.02.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "12.02.2026", bezugId: null },
  { id: "DOK-122", ref: { art: "patient", kennung: "P-2026-0043" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "10.02.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "12.02.2026", bezugId: null },
  { id: "DOK-123", ref: { art: "patient", kennung: "P-2026-0043" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "14.02.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "14.02.2026", bezugId: null },
  { id: "DOK-124", ref: { art: "patient", kennung: "P-2026-0043" }, typCode: "patient_sonstige",
    bezeichnung: "Vorsorgeauftrag_KESB.pdf", ausgestelltAm: "16.02.2026", herkunft: "hochgeladen", erfasstVon: "S. Weber", erfasstAm: "16.02.2026", bezugId: null },

  { id: "DOK-131", ref: { art: "patient", kennung: "P-2026-0044" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "05.02.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "06.02.2026", bezugId: null },
  { id: "DOK-132", ref: { art: "patient", kennung: "P-2026-0044" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "05.02.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "06.02.2026", bezugId: null },
  { id: "DOK-133", ref: { art: "patient", kennung: "P-2026-0044" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "08.02.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "08.02.2026", bezugId: null },

  { id: "DOK-141", ref: { art: "patient", kennung: "P-2026-0045" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "24.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "25.02.2026", bezugId: null },
  { id: "DOK-142", ref: { art: "patient", kennung: "P-2026-0045" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "24.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "25.02.2026", bezugId: null },
  { id: "DOK-143", ref: { art: "patient", kennung: "P-2026-0045" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "26.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "26.02.2026", bezugId: null },
  { id: "DOK-144", ref: { art: "patient", kennung: "P-2026-0045" }, typCode: "patient_sonstige",
    bezeichnung: "Patientenverfuegung.pdf", ausgestelltAm: "20.01.2025", herkunft: "hochgeladen", erfasstVon: "M. Keller", erfasstAm: "26.02.2026", bezugId: null },

  /* Da Silva: Krankenkassenkarte fehlt — die Pflichtprüfung meldet sie. */
  { id: "DOK-151", ref: { art: "patient", kennung: "P-2026-0046" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "15.02.2026", herkunft: "onboarding", erfasstVon: "R. Ott", erfasstAm: "16.02.2026", bezugId: null },
  { id: "DOK-152", ref: { art: "patient", kennung: "P-2026-0046" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "17.02.2026", herkunft: "onboarding", erfasstVon: "R. Ott", erfasstAm: "17.02.2026", bezugId: null },

  { id: "DOK-161", ref: { art: "patient", kennung: "P-2026-0047" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "26.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "27.02.2026", bezugId: null },
  { id: "DOK-162", ref: { art: "patient", kennung: "P-2026-0047" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "26.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "27.02.2026", bezugId: null },
  { id: "DOK-163", ref: { art: "patient", kennung: "P-2026-0047" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "28.02.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "28.02.2026", bezugId: null },

  /* Ferrari: Einwilligung fehlt — palliative Aufnahme, Unterschrift ausstehend. */
  { id: "DOK-171", ref: { art: "patient", kennung: "P-2026-0048" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "12.02.2026", herkunft: "onboarding", erfasstVon: "R. Ott", erfasstAm: "13.02.2026", bezugId: null },
  { id: "DOK-172", ref: { art: "patient", kennung: "P-2026-0048" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "12.02.2026", herkunft: "onboarding", erfasstVon: "R. Ott", erfasstAm: "13.02.2026", bezugId: null },
  { id: "DOK-173", ref: { art: "patient", kennung: "P-2026-0048" }, typCode: "patient_sonstige",
    bezeichnung: "Verordnung_Palliative_Care.pdf", ausgestelltAm: "14.02.2026", herkunft: "hochgeladen", erfasstVon: "R. Ott", erfasstAm: "14.02.2026", bezugId: null },

  { id: "DOK-181", ref: { art: "patient", kennung: "P-2026-0049" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "03.03.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "04.03.2026", bezugId: null },
  { id: "DOK-182", ref: { art: "patient", kennung: "P-2026-0049" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "03.03.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "04.03.2026", bezugId: null },
  { id: "DOK-183", ref: { art: "patient", kennung: "P-2026-0049" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "05.03.2026", herkunft: "onboarding", erfasstVon: "M. Keller", erfasstAm: "05.03.2026", bezugId: null },

  { id: "DOK-191", ref: { art: "patient", kennung: "P-2026-0050" }, typCode: "patient_ausweis_id",
    bezeichnung: "Ausweis_ID.pdf", ausgestelltAm: "08.03.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "09.03.2026", bezugId: null },
  { id: "DOK-192", ref: { art: "patient", kennung: "P-2026-0050" }, typCode: "patient_kk_karte",
    bezeichnung: "Krankenkassenkarte.pdf", ausgestelltAm: "08.03.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "09.03.2026", bezugId: null },
  { id: "DOK-193", ref: { art: "patient", kennung: "P-2026-0050" }, typCode: "patient_einwilligung",
    bezeichnung: "Einwilligungserklaerung_unterzeichnet.pdf", ausgestelltAm: "10.03.2026", herkunft: "onboarding", erfasstVon: "S. Weber", erfasstAm: "10.03.2026", bezugId: null },
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
