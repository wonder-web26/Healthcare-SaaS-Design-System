/**
 * Arzneimittel-Stammdaten — PLATZHALTER FUER DEN PROTOTYP.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DIESE TABELLE IST KEINE ARZNEIMITTELDATENBANK UND TAUGT NICHT FUER EINE
 * BEHANDLUNGSENTSCHEIDUNG.
 *
 * Die Eintraege stammen NICHT aus einer lizenzierten Quelle. Es sind in der
 * Schweiz gebraeuchliche Praeparate mit plausiblen Staerken, von Hand
 * eingetragen, damit die Auswahl im Prototyp etwas zu waehlen hat. Staerken,
 * Formen und Applikationsarten sind nicht gegen eine Fachinformation geprueft.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * TAUSCHGRENZE. Die Stammdaten kommen spaeter ueber die Documedis-API von
 * HCI Solutions (Produktsuche, Stammdaten, Identifikator-Konversion). Genau
 * diese Datei wird dann ersetzt — und nur sie.
 *
 * DARUM WIRD DIE TABELLE NICHT EXPORTIERT. Ausserhalb dieser Datei ist der
 * Katalog ausschliesslich ueber `arzneimittelSuchen` und `arzneimittelNachId`
 * erreichbar. Wer die Tabelle direkt laese, muesste beim Tausch mitgeaendert
 * werden; wer die beiden Funktionen ruft, merkt ihn nicht. Aus demselben Grund
 * gibt es keine Schreibfunktion: eine Position kann nie auf einen Eintrag
 * zeigen, den jemand entfernt hat.
 *
 * `route` und `baseUnit` tragen die Werte aus den Schema-Notizen von
 * `Medication` (docs/Spit Full.dbml) — keine eigenen Wertemengen.
 */

export interface Arzneimittel {
  /** Platzhalter-Kennung. Spaeter der Compendium-/GTIN-Code (`productCode`). */
  id: string;
  /** Handelsname ohne Form und Staerke (`productName`). */
  name: string;
  /** z. B. "500 mg" oder "80/12.5 mg" bei Kombinationen. */
  staerke: string;
  darreichungsform: string;
  /** `route` — Applikationsart, Produkteigenschaft, keine Eingabe der Nutzerin. */
  route: string;
  /** `baseUnit` — Einheit einer Gabe. */
  baseUnit: string;
  /** Wirkstoff; wird mitgesucht, steht aber nicht in der Trefferzeile. */
  wirkstoff: string;
}

const KATALOG: Arzneimittel[] = [
  { id: "AM-0001", name: "DAFALGAN", staerke: "500 mg", darreichungsform: "Filmtabl", route: "p.o.", baseUnit: "Tabl", wirkstoff: "Paracetamol" },
  { id: "AM-0002", name: "CO-DIOVAN", staerke: "80/12.5 mg", darreichungsform: "Filmtabl", route: "p.o.", baseUnit: "Tabl", wirkstoff: "Valsartan, Hydrochlorothiazid" },
  { id: "AM-0003", name: "BELOC ZOK", staerke: "25 mg", darreichungsform: "Ret Tabl", route: "p.o.", baseUnit: "Tabl", wirkstoff: "Metoprolol" },
  { id: "AM-0004", name: "TORASEMID Helvepharm", staerke: "10 mg", darreichungsform: "Tabl", route: "p.o.", baseUnit: "Tabl", wirkstoff: "Torasemid" },
  { id: "AM-0005", name: "MOVICOL", staerke: "13.8 g", darreichungsform: "Plv Btl", route: "p.o.", baseUnit: "Btl", wirkstoff: "Macrogol" },
  { id: "AM-0006", name: "FENTANYL Sandoz", staerke: "25 mcg/h", darreichungsform: "Matrixpfl", route: "topical", baseUnit: "Pfl", wirkstoff: "Fentanyl" },
  { id: "AM-0007", name: "CALCIMAGON D3", staerke: "500 mg/800 IE", darreichungsform: "Brausetabl", route: "p.o.", baseUnit: "Tabl", wirkstoff: "Calcium, Colecalciferol" },
  { id: "AM-0008", name: "NOVALGIN", staerke: "500 mg/ml", darreichungsform: "Tropfen", route: "p.o.", baseUnit: "Tr", wirkstoff: "Metamizol" },
  { id: "AM-0009", name: "VENTOLIN", staerke: "100 mcg", darreichungsform: "Dosieraerosol", route: "inhalation", baseUnit: "Hub", wirkstoff: "Salbutamol" },
  { id: "AM-0010", name: "PANTOZOL", staerke: "40 mg", darreichungsform: "Filmtabl", route: "p.o.", baseUnit: "Tabl", wirkstoff: "Pantoprazol" },
];

/** Anzeigename einer Position: Handelsname, Form, Staerke — eMediplan-Konvention. */
export function arzneimittelBezeichnung(a: Arzneimittel): string {
  return `${a.name} ${a.darreichungsform} ${a.staerke}`.trim();
}

/**
 * Suche ueber Handelsname, Wirkstoff, Form und Staerke. Leere Anfrage liefert
 * den ganzen Bestand — die Auswahl im Editor zeigt dann alles Waehlbare.
 */
export function arzneimittelSuchen(anfrage: string): Arzneimittel[] {
  const q = anfrage.trim().toLowerCase();
  if (!q) return [...KATALOG];
  return KATALOG.filter(a =>
    [a.name, a.wirkstoff, a.darreichungsform, a.staerke].some(f => f.toLowerCase().includes(q)));
}

/** Einzelabfrage. `undefined`, wenn die Kennung nicht (mehr) im Bestand ist. */
export function arzneimittelNachId(id: string): Arzneimittel | undefined {
  return KATALOG.find(a => a.id === id);
}
