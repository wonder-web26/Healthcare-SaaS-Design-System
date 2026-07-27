/**
 * Schulungsnachweis — Datenhaltung, Signatur, Integrität.
 *
 * Kein eigenes Domänenobjekt. Der Nachweis ist ein Dokument im bestehenden
 * Dokumentenkonzept mit zwei Referenzen (Angehörige/r + Patient/in).
 *
 * Unveränderbarkeit: Nach Abschluss darf der Nachweis weder über UI noch
 * über bestehende Schreibpfade verändert werden. Korrekturen = neuer Nachweis.
 */

import { LEISTUNGSKATALOG_VERSION } from "../klv/spitex-leistungskatalog-2025";
import { KLV_AUSFUEHRUNGSSCHRITTE_VORLAGE_VERSION } from "../klv/klv-ausfuehrungsschritte";

/* ══════════════════════════════════════════
   TYPEN
   ══════════════════════════════════════════ */

export interface PositionsUnterschrift {
  /** KLV-Nummer */
  nr: string;
  /** Unterschriftsbild als komprimierter Data-URL (PNG, max 300×100px) */
  signaturDataUrl: string;
  /** ISO datetime — systemseitig */
  unterschriebenAm: string;
  /** Wer war eingeloggt */
  unterschriebenVon: string;
}

export type NachweisStatus = "in_bearbeitung" | "abgeschlossen";

export interface Schulungsnachweis {
  id: string;
  /** Angehörige/r */
  angehoerigerId: string;
  angehoerigerName: string;
  angehoerigerQualifikation: string;
  /** Patient/in */
  patientId: string;
  patientName: string;
  /** Fallführende / Ausbildende */
  ausbildendeName: string;
  /** KLV-Nummern die im Nachweis enthalten sind */
  positionen: string[];
  /** Unterschriften pro Position */
  unterschriften: PositionsUnterschrift[];
  /** Status */
  status: NachweisStatus;
  erstelltAm: string; // ISO datetime
  abgeschlossenAm: string | null;
  /** Integritäts-Hash (SHA-256 über den vollständigen Nachweis) */
  integritaetsHash: string | null;
  /** Versionen zum Zeitpunkt der Erstellung */
  katalogVersion: string;
  vorlagenVersion: string;
  /** Audit-Trail */
  auditLog: AuditEintrag[];
}

export interface AuditEintrag {
  zeitpunkt: string; // ISO datetime
  benutzer: string;
  aktion: string;
  details?: string;
}

/* ══════════════════════════════════════════
   IN-MEMORY STORE (Produktion: Datenbank)
   ══════════════════════════════════════════ */

const NACHWEISE: Schulungsnachweis[] = [];

/* ══════════════════════════════════════════
   ERSTELLEN
   ══════════════════════════════════════════ */

export function erstelleNachweis(
  angehoerigerId: string,
  angehoerigerName: string,
  angehoerigerQualifikation: string,
  patientId: string,
  patientName: string,
  ausbildendeName: string,
  positionen: string[], // KLV-Nummern
): Schulungsnachweis {
  // Idempotenz: pro Angehöriger/Patient nur ein offener Nachweis
  const bestehend = NACHWEISE.find(
    n => n.angehoerigerId === angehoerigerId && n.patientId === patientId && n.status === "in_bearbeitung"
  );
  if (bestehend) return bestehend;

  const nachweis: Schulungsnachweis = {
    id: `SN-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    angehoerigerId,
    angehoerigerName,
    angehoerigerQualifikation,
    patientId,
    patientName,
    ausbildendeName,
    positionen,
    unterschriften: [],
    status: "in_bearbeitung",
    erstelltAm: new Date().toISOString(),
    abgeschlossenAm: null,
    integritaetsHash: null,
    katalogVersion: `${LEISTUNGSKATALOG_VERSION.quelle}, Stand: ${LEISTUNGSKATALOG_VERSION.stand}`,
    vorlagenVersion: KLV_AUSFUEHRUNGSSCHRITTE_VORLAGE_VERSION,
    auditLog: [{
      zeitpunkt: new Date().toISOString(),
      benutzer: ausbildendeName,
      aktion: "Nachweis erstellt",
      details: `${positionen.length} Positionen, Katalog ${LEISTUNGSKATALOG_VERSION.stand}`,
    }],
  };

  NACHWEISE.push(nachweis);
  return nachweis;
}

/* ══════════════════════════════════════════
   UNTERSCHREIBEN
   ══════════════════════════════════════════ */

export interface UnterschriftErgebnis {
  ok: boolean;
  fehler?: string;
}

export function positionUnterschreiben(
  nachweisId: string,
  nr: string,
  signaturDataUrl: string,
  benutzer: string,
): UnterschriftErgebnis {
  const n = NACHWEISE.find(x => x.id === nachweisId);
  if (!n) return { ok: false, fehler: "Nachweis nicht gefunden" };
  if (n.status === "abgeschlossen") return { ok: false, fehler: "Nachweis ist abgeschlossen und unveränderbar" };
  if (!n.positionen.includes(nr)) return { ok: false, fehler: "Position nicht im Nachweis enthalten" };
  if (n.unterschriften.some(u => u.nr === nr)) return { ok: false, fehler: "Position bereits unterschrieben" };

  n.unterschriften.push({
    nr,
    signaturDataUrl,
    unterschriebenAm: new Date().toISOString(),
    unterschriebenVon: benutzer,
  });

  n.auditLog.push({
    zeitpunkt: new Date().toISOString(),
    benutzer,
    aktion: "Position unterschrieben",
    details: `KLV ${nr}`,
  });

  return { ok: true };
}

/* ══════════════════════════════════════════
   ABSCHLIESSEN
   ══════════════════════════════════════════ */

/**
 * Berechnet einen einfachen Hash über den Nachweis-Inhalt.
 * In Produktion: SHA-256 über serialisierten Inhalt.
 */
async function berechneHash(nachweis: Schulungsnachweis): Promise<string> {
  const inhalt = JSON.stringify({
    id: nachweis.id,
    positionen: nachweis.positionen,
    unterschriften: nachweis.unterschriften.map(u => ({ nr: u.nr, am: u.unterschriebenAm, von: u.unterschriebenVon })),
    katalogVersion: nachweis.katalogVersion,
    vorlagenVersion: nachweis.vorlagenVersion,
  });

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buffer = new TextEncoder().encode(inhalt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback: einfacher Hash
  let hash = 0;
  for (let i = 0; i < inhalt.length; i++) {
    hash = ((hash << 5) - hash + inhalt.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export async function nachweisAbschliessen(
  nachweisId: string,
  unterschreibbarePositionen: string[],
  benutzer: string,
): Promise<UnterschriftErgebnis> {
  const n = NACHWEISE.find(x => x.id === nachweisId);
  if (!n) return { ok: false, fehler: "Nachweis nicht gefunden" };
  if (n.status === "abgeschlossen") return { ok: false, fehler: "Bereits abgeschlossen" };

  // Prüfen ob alle unterschreibbaren Positionen unterschrieben sind
  const fehlend = unterschreibbarePositionen.filter(nr => !n.unterschriften.some(u => u.nr === nr));
  if (fehlend.length > 0) {
    return { ok: false, fehler: `${fehlend.length} Position(en) noch nicht unterschrieben` };
  }

  n.integritaetsHash = await berechneHash(n);
  n.abgeschlossenAm = new Date().toISOString();
  n.status = "abgeschlossen";

  n.auditLog.push({
    zeitpunkt: new Date().toISOString(),
    benutzer,
    aktion: "Nachweis abgeschlossen",
    details: `Hash: ${n.integritaetsHash}, ${n.unterschriften.length} Unterschriften`,
  });

  return { ok: true };
}

/* ══════════════════════════════════════════
   ABFRAGEN
   ══════════════════════════════════════════ */

export function getNachweiseFuerAngehoeriger(angehoerigerId: string): Schulungsnachweis[] {
  return NACHWEISE.filter(n => n.angehoerigerId === angehoerigerId);
}

export function getNachweiseFuerPatient(patientId: string): Schulungsnachweis[] {
  return NACHWEISE.filter(n => n.patientId === patientId);
}

export function getNachweisById(id: string): Schulungsnachweis | null {
  return NACHWEISE.find(n => n.id === id) ?? null;
}

export function getAlleNachweise(): Schulungsnachweis[] {
  return [...NACHWEISE];
}
