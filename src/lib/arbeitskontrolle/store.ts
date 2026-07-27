/**
 * Arbeitskontrolle — Datenhaltung, Bewertungen, Unterschriften, Integrität.
 *
 * Kein eigenes Domänenobjekt. Bestehendes Dokumentenkonzept und Pendenzen.
 * Personaldokument: nur beim Angehörigen abgelegt, NICHT im Patientendossier.
 *
 * Beliebig viele Kontrollen pro Angehörigem. Abgeschlossene bleiben unveränderbar.
 */

import { BEURTEILUNGSBLOECKE } from "./kriterien";
import { getOrgEinstellungen } from "../stammdaten/org-einstellungen";

/* ══════════════════════════════════════════
   TYPEN
   ══════════════════════════════════════════ */

/** 1–6 oder null (= "Kann ich nicht beurteilen") */
export type Bewertung = 1 | 2 | 3 | 4 | 5 | 6 | null;

export interface KriteriumBewertung {
  code: string;
  wert: Bewertung;
}

export interface BlockBewertung {
  blockId: string;
  bewertungen: KriteriumBewertung[];
  anmerkung: string;
}

export interface Unterschrift {
  rolle: "fallfuehrende" | "mitarbeiterin";
  signaturDataUrl: string;
  datum: string; // ISO datetime
  name: string;
}

export type KontrolleStatus = "in_bearbeitung" | "abgeschlossen";
export type KontrolleArt = "regulaer" | "ausserordentlich";

export interface Arbeitskontrolle {
  id: string;
  angehoerigerId: string;
  angehoerigerName: string;
  fallfuehrendeName: string;
  /** Optional: besuchter Patient */
  patientId: string | null;
  patientName: string | null;
  /** Kontrolldatum */
  kontrollDatum: string; // ISO date
  /** Regulär (turnusmässig) oder ausserordentlich */
  art: KontrolleArt;
  /** Bewertungen */
  bloecke: BlockBewertung[];
  /** Freitext: Verbesserungen, Vorschläge */
  verbesserungen: string;
  /** Meldung an Geschäftsleitung */
  meldungGL: { erfolgt: boolean; datum: string; uhrzeit: string };
  /** Meldung an Leitung Pflege */
  meldungLP: { erfolgt: boolean; datum: string; uhrzeit: string };
  /** Unterschriften */
  unterschriften: Unterschrift[];
  status: KontrolleStatus;
  erstelltAm: string;
  abgeschlossenAm: string | null;
  integritaetsHash: string | null;
}

/* ══════════════════════════════════════════
   IN-MEMORY STORE
   ══════════════════════════════════════════ */

const KONTROLLEN: Arbeitskontrolle[] = [];

/* ══════════════════════════════════════════
   ERSTELLEN
   ══════════════════════════════════════════ */

function leereBlockBewertungen(): BlockBewertung[] {
  return BEURTEILUNGSBLOECKE.map(block => ({
    blockId: block.id,
    bewertungen: block.kriterien.map(k => ({ code: k.code, wert: null })),
    anmerkung: "",
  }));
}

export function erstelleKontrolle(
  angehoerigerId: string,
  angehoerigerName: string,
  fallfuehrendeName: string,
  patientId?: string | null,
  patientName?: string | null,
  art: KontrolleArt = "regulaer",
): Arbeitskontrolle {
  const kontrolle: Arbeitskontrolle = {
    id: `AK-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    angehoerigerId,
    angehoerigerName,
    fallfuehrendeName,
    patientId: patientId ?? null,
    patientName: patientName ?? null,
    kontrollDatum: new Date().toISOString().slice(0, 10),
    art,
    bloecke: leereBlockBewertungen(),
    verbesserungen: "",
    meldungGL: { erfolgt: false, datum: "", uhrzeit: "" },
    meldungLP: { erfolgt: false, datum: "", uhrzeit: "" },
    unterschriften: [],
    status: "in_bearbeitung",
    erstelltAm: new Date().toISOString(),
    abgeschlossenAm: null,
    integritaetsHash: null,
  };

  KONTROLLEN.push(kontrolle);
  return kontrolle;
}

/* ══════════════════════════════════════════
   BEWERTUNG AKTUALISIEREN
   ══════════════════════════════════════════ */

export function aktualisiereKontrolle(
  kontrolleId: string,
  update: Partial<Pick<Arbeitskontrolle, "bloecke" | "verbesserungen" | "meldungGL" | "meldungLP">>,
): boolean {
  const k = KONTROLLEN.find(x => x.id === kontrolleId);
  if (!k || k.status === "abgeschlossen") return false;
  if (update.bloecke) k.bloecke = update.bloecke;
  if (update.verbesserungen !== undefined) k.verbesserungen = update.verbesserungen;
  if (update.meldungGL) k.meldungGL = update.meldungGL;
  if (update.meldungLP) k.meldungLP = update.meldungLP;
  return true;
}

/* ══════════════════════════════════════════
   UNTERSCHREIBEN
   ══════════════════════════════════════════ */

export function kontrolleUnterschreiben(
  kontrolleId: string,
  rolle: "fallfuehrende" | "mitarbeiterin",
  signaturDataUrl: string,
  name: string,
): { ok: boolean; fehler?: string } {
  const k = KONTROLLEN.find(x => x.id === kontrolleId);
  if (!k) return { ok: false, fehler: "Kontrolle nicht gefunden" };
  if (k.status === "abgeschlossen") return { ok: false, fehler: "Kontrolle ist abgeschlossen" };
  if (k.unterschriften.some(u => u.rolle === rolle)) return { ok: false, fehler: `${rolle === "fallfuehrende" ? "Fallführende" : "Mitarbeiter:in"} hat bereits unterschrieben` };

  k.unterschriften.push({
    rolle,
    signaturDataUrl,
    datum: new Date().toISOString(),
    name,
  });

  // Automatisch abschliessen wenn beide unterschrieben haben
  if (k.unterschriften.length === 2) {
    kontrolleAbschliessen(k);
  }

  return { ok: true };
}

/* ══════════════════════════════════════════
   ABSCHLIESSEN
   ══════════════════════════════════════════ */

async function berechneHash(k: Arbeitskontrolle): Promise<string> {
  const inhalt = JSON.stringify({
    id: k.id, bloecke: k.bloecke, verbesserungen: k.verbesserungen,
    unterschriften: k.unterschriften.map(u => ({ rolle: u.rolle, datum: u.datum, name: u.name })),
  });
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buffer = new TextEncoder().encode(inhalt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0;
  for (let i = 0; i < inhalt.length; i++) hash = ((hash << 5) - hash + inhalt.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(16).padStart(8, "0");
}

async function kontrolleAbschliessen(k: Arbeitskontrolle): Promise<void> {
  k.integritaetsHash = await berechneHash(k);
  k.abgeschlossenAm = new Date().toISOString();
  k.status = "abgeschlossen";

  // Nächste reguläre Kontrolle planen (nur bei regulären)
  if (k.art === "regulaer") {
    const turnus = getOrgEinstellungen().arbeitskontrolleTurnusMonate;
    const naechstesFaellig = new Date(k.kontrollDatum);
    naechstesFaellig.setMonth(naechstesFaellig.getMonth() + turnus);
    console.info(`[Audit] Arbeitskontrolle ${k.id} (regulär) abgeschlossen. Nächste fällig: ${naechstesFaellig.toISOString().slice(0, 10)}`);
  } else {
    console.info(`[Audit] Arbeitskontrolle ${k.id} (ausserordentlich) abgeschlossen. Reguläre Fälligkeit bleibt unverändert.`);
  }
}

/* ══════════════════════════════════════════
   FÄLLIGKEIT
   ══════════════════════════════════════════ */

/**
 * Berechnet die nächste reguläre Fälligkeit für einen Angehörigen.
 * - Basis: Datum der letzten abgeschlossenen regulären Kontrolle + Turnus
 * - Ohne bisherige Kontrolle: eintrittsdatum + Turnus
 */
export function getNaechsteFaelligkeit(angehoerigerId: string, eintrittsdatum?: string): string | null {
  const turnus = getOrgEinstellungen().arbeitskontrolleTurnusMonate;
  const regulaereAbgeschlossene = KONTROLLEN
    .filter(k => k.angehoerigerId === angehoerigerId && k.art === "regulaer" && k.status === "abgeschlossen")
    .sort((a, b) => (b.kontrollDatum).localeCompare(a.kontrollDatum));

  let basis: string;
  if (regulaereAbgeschlossene.length > 0) {
    basis = regulaereAbgeschlossene[0].kontrollDatum;
  } else if (eintrittsdatum) {
    basis = eintrittsdatum;
  } else {
    return null;
  }

  const d = new Date(basis);
  d.setMonth(d.getMonth() + turnus);
  return d.toISOString().slice(0, 10);
}

/**
 * Gibt Patienten-IDs zurück, bei denen noch nie eine Kontrolle stattfand.
 */
export function getUnkontrolliertePatientenIds(angehoerigerId: string, patientenIds: string[]): string[] {
  const kontrolliertePatientenIds = new Set(
    KONTROLLEN
      .filter(k => k.angehoerigerId === angehoerigerId && k.patientId)
      .map(k => k.patientId!)
  );
  return patientenIds.filter(id => !kontrolliertePatientenIds.has(id));
}

/* ══════════════════════════════════════════
   ABFRAGEN
   ══════════════════════════════════════════ */

/** Alle Kontrollen für einen Angehörigen, absteigend nach Datum. */
export function getKontrollenFuerAngehoeriger(angehoerigerId: string): Arbeitskontrolle[] {
  return KONTROLLEN
    .filter(k => k.angehoerigerId === angehoerigerId)
    .sort((a, b) => b.kontrollDatum.localeCompare(a.kontrollDatum));
}

export function getKontrolleById(id: string): Arbeitskontrolle | null {
  return KONTROLLEN.find(k => k.id === id) ?? null;
}

export function getAlleKontrollen(): Arbeitskontrolle[] {
  return [...KONTROLLEN];
}
