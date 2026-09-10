/**
 * Katalog der Pendenzen — Kategorien und Arten.
 *
 * ZWEI EBENEN, EINE QUELLE. Vorher gab es nur eine flache Liste von 17 Arten,
 * deren Beschriftung in der Liste unter der Spalte «Kategorie» stand — Art und
 * Kategorie waren dasselbe Wort für zwei verschiedene Dinge. Jetzt führen die
 * Kategorien, die Arten hängen darunter.
 *
 * Führend sind `PENDENZ_KATEGORIEN`. Was in der Vorlage als `categoryLabel` und
 * `responsibleRole` an jeder Art wiederholt stand, wird hier abgeleitet statt
 * gespiegelt: eine Art nennt ihre Kategorie, alles Weitere folgt daraus. Zwei
 * gepflegte Kopien derselben Angabe liefen sonst beim ersten Zusatz auseinander.
 *
 * STAND: Entwurf. Fristangaben und Zuständigkeiten sind fachlich nicht
 * freigegeben — sie stehen hier als Hinweis, nicht als Regel. `faelligkeitTage`
 * wird von nichts ausgewertet; wer eine Frist rechnet, tut das ausdrücklich.
 *
 * ZUSTÄNDIGKEIT: Die Vorlage unterscheidet «verwaltung» und «treuhaender». Das
 * Produkt kennt diese Rollen nicht, sondern `diplomiert`, `backoffice` und
 * `management` (types/user). Auf Entscheid des Eigners fallen beide auf
 * `backoffice` — der Unterschied der Vorlage geht dabei verloren. Er steht
 * jeweils im Kommentar der Kategorie, damit die Angabe nicht verschwindet.
 */
import type { UserRole } from "../../types/user";

/* ══════════════════════════════════════════
   KATEGORIEN
   ══════════════════════════════════════════ */

export type PendenzKategorieId =
  | "auslaenderrecht" | "steuern" | "sozialversicherung" | "ausbildung"
  | "lohn" | "absenzen" | "anstellung" | "dokumente" | "betreuung" | "sonstiges";

export interface PendenzKategorie {
  id: PendenzKategorieId;
  label: string;
  /** Fachlich zuständige Rolle; `null`, wo sie vom Einzelfall abhängt. */
  verantwortlich: UserRole | null;
}

/**
 * Die Kategorien in Anzeigereihenfolge. Die Reihenfolge IST die Ordnung der
 * Vorlage (`order`) — sie steht in der Anordnung, nicht als zweites Feld
 * daneben, das man vergessen kann.
 *
 * «Betreuung» ist eine Ergänzung zur Vorlage. Die neun gelieferten Kategorien
 * decken die Administration der angehörigen Person ab; die patientenseitigen
 * Pendenzen (Re-Assessment und Verwandtes) hätten dort nur «Sonstiges» gefunden
 * und ihre Bedeutung verloren. Auf Entscheid des Eigners ergänzt.
 */
export const PENDENZ_KATEGORIEN: PendenzKategorie[] = [
  { id: "auslaenderrecht",   label: "Ausländerrecht",           verantwortlich: "backoffice" }, // Vorlage: verwaltung
  { id: "steuern",           label: "Steuern",                  verantwortlich: "backoffice" }, // Vorlage: treuhaender
  { id: "sozialversicherung", label: "Sozialversicherung",      verantwortlich: "backoffice" }, // Vorlage: treuhaender
  { id: "ausbildung",        label: "Ausbildung",               verantwortlich: "backoffice" }, // Vorlage: verwaltung
  { id: "lohn",              label: "Lohn und Vergütung",       verantwortlich: "backoffice" }, // Vorlage: treuhaender
  { id: "absenzen",          label: "Absenzen und Arbeitszeit", verantwortlich: "backoffice" }, // Vorlage: verwaltung
  { id: "anstellung",        label: "Anstellung und Vertrag",   verantwortlich: "backoffice" }, // Vorlage: verwaltung
  { id: "dokumente",         label: "Dokumente",                verantwortlich: "backoffice" }, // Vorlage: verwaltung
  /* Ergänzung, nicht aus der Vorlage — patientenseitige Begleitung. */
  { id: "betreuung",         label: "Betreuung",                verantwortlich: "diplomiert" },
  { id: "sonstiges",         label: "Sonstiges",                verantwortlich: null },
];

/* ══════════════════════════════════════════
   ARTEN
   ══════════════════════════════════════════ */

export interface FaelligkeitHinweis {
  /** Klartext, wie er im Formular steht — z. B. «üblich 30 Tage». */
  label: string;
  /** Tage ab Auslöser, oder `null`, wenn sich die Frist nicht so ausdrücken lässt. */
  tage: number | null;
}

export interface PendenzArt {
  id: string;
  label: string;
  kategorieId: PendenzKategorieId;
  /** Ein Satz, was gemeint ist; erscheint als Hilfstext. */
  hinweis: string | null;
  faelligkeit: FaelligkeitHinweis | null;
  /** Diese Art sperrt den Vertragsschritt im Onboarding. */
  sperrtVertragsschritt: boolean;
  /** Wird vom System erzeugt, nicht von Hand angelegt. */
  systemErzeugt: boolean;
  /** Verlangt beim Anlegen eine zuständige Person. */
  verlangtZustaendige?: boolean;
}

/** Alle Arten, gruppiert nach Kategorie und in deren Reihenfolge. */
export const PENDENZ_ARTEN = [
  /* ── Ausländerrecht ── */
  { id: "auslaenderrecht_bewilligung_beantragen", label: "Bewilligung beantragen", kategorieId: "auslaenderrecht",
    hinweis: "Gesuch beim kantonalen Migrationsamt", faelligkeit: { label: "üblich 30 Tage", tage: 30 },
    sperrtVertragsschritt: true, systemErzeugt: true },
  { id: "auslaenderrecht_stellenantritt_melden", label: "Stellenantritt melden", kategorieId: "auslaenderrecht",
    hinweis: "Meldeverfahren über EasyGov", faelligkeit: { label: "vor Stellenantritt", tage: null },
    sperrtVertragsschritt: true, systemErzeugt: true },
  { id: "auslaenderrecht_verfahren_abklaeren", label: "Verfahren abklären", kategorieId: "auslaenderrecht",
    hinweis: "Wenn unklar ist, welches Verfahren gilt", faelligkeit: { label: "üblich 7 Tage", tage: 7 },
    sperrtVertragsschritt: false, systemErzeugt: true },
  { id: "auslaenderrecht_allgemein", label: "Allgemein", kategorieId: "auslaenderrecht",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Steuern ── */
  { id: "steuern_quellensteuer_anmelden", label: "Quellensteuer anmelden", kategorieId: "steuern",
    hinweis: "Anmeldung beim kantonalen Steueramt", faelligkeit: { label: "bis Monatsende", tage: null },
    sperrtVertragsschritt: false, systemErzeugt: true },
  { id: "steuern_allgemein", label: "Allgemein", kategorieId: "steuern",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Sozialversicherung ── */
  { id: "sozialversicherung_familienzulagen_beantragen", label: "Familienzulagen beantragen", kategorieId: "sozialversicherung",
    hinweis: "Antrag bei der Familienausgleichskasse", faelligkeit: { label: "üblich 30 Tage", tage: 30 },
    sperrtVertragsschritt: false, systemErzeugt: true },
  { id: "sozialversicherung_ausbildungsbestaetigung_einholen", label: "Ausbildungsbestätigung einholen", kategorieId: "sozialversicherung",
    hinweis: "Je Kind, in der Regel jährlich", faelligkeit: { label: "jährlich", tage: null },
    sperrtVertragsschritt: false, systemErzeugt: true },
  { id: "sozialversicherung_bvg_meldung", label: "BVG-Meldung", kategorieId: "sozialversicherung",
    hinweis: "Meldung an die Pensionskasse", faelligkeit: { label: "üblich 14 Tage", tage: 14 },
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "sozialversicherung_allgemein", label: "Allgemein", kategorieId: "sozialversicherung",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Ausbildung ── */
  { id: "ausbildung_srk_anmeldung", label: "SRK-Anmeldung", kategorieId: "ausbildung",
    hinweis: "Anmeldung zum Pflegehelferkurs", faelligkeit: { label: "üblich 30 Tage", tage: 30 },
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "ausbildung_srk_frist", label: "SRK-Frist", kategorieId: "ausbildung",
    hinweis: "12 Monate ab Vertragsunterzeichnung", faelligkeit: { label: "aus Vertragsdatum abgeleitet", tage: null },
    sperrtVertragsschritt: false, systemErzeugt: true },
  { id: "ausbildung_weiterbildung", label: "Weiterbildung", kategorieId: "ausbildung",
    hinweis: "Anmeldung, Kostenübernahme", faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "ausbildung_allgemein", label: "Allgemein", kategorieId: "ausbildung",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Lohn und Vergütung ── */
  { id: "lohn_lohnaenderung", label: "Lohnänderung", kategorieId: "lohn",
    hinweis: "Erhöhung, Reduktion, Tarifwechsel", faelligkeit: { label: "bis Monatsende", tage: null },
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "lohn_lohnstopp", label: "Lohnstopp", kategorieId: "lohn",
    hinweis: "Zurückhalten bei fehlenden Dokumenten", faelligkeit: null,
    sperrtVertragsschritt: true, systemErzeugt: false },
  { id: "lohn_lohnkorrektur", label: "Lohnkorrektur", kategorieId: "lohn",
    hinweis: "Nachzahlung, Differenz, Rückforderung", faelligkeit: null,
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "lohn_spesen_und_zulagen", label: "Spesen und Zulagen", kategorieId: "lohn",
    hinweis: "Rückvergütung, Zuschläge", faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "lohn_allgemein", label: "Allgemein", kategorieId: "lohn",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Absenzen und Arbeitszeit ── */
  { id: "absenzen_unfall_oder_krankheit", label: "Unfall oder Krankheit", kategorieId: "absenzen",
    hinweis: "Lohnfortzahlung, Versicherungsmeldung", faelligkeit: { label: "üblich 3 Tage", tage: 3 },
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "absenzen_absenz", label: "Absenz", kategorieId: "absenzen",
    hinweis: "Ferien, Abwesenheit", faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "absenzen_allgemein", label: "Allgemein", kategorieId: "absenzen",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Anstellung und Vertrag ── */
  { id: "anstellung_eintritt", label: "Eintritt", kategorieId: "anstellung",
    hinweis: "Neuaufnahme pflegende Angehörige", faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "anstellung_austritt", label: "Austritt", kategorieId: "anstellung",
    hinweis: "Kündigung, Austrittsdokumente", faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "anstellung_vertragsanpassung", label: "Vertragsanpassung", kategorieId: "anstellung",
    hinweis: "Pensum, Probezeit, Befristung", faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "anstellung_allgemein", label: "Allgemein", kategorieId: "anstellung",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Dokumente ── */
  { id: "dokumente_dokument_fehlt", label: "Dokument fehlt", kategorieId: "dokumente",
    hinweis: "Ausweis, AHV-Nummer, Bankverbindung", faelligkeit: null,
    sperrtVertragsschritt: true, systemErzeugt: false },
  { id: "dokumente_allgemein", label: "Allgemein", kategorieId: "dokumente",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Betreuung (Ergänzung zur Vorlage) ──
     Die patientenseitige Begleitung. Sie steht nicht in der gelieferten
     Vorlage; ohne sie fielen Re-Assessment und Verwandtes unter «Sonstiges». */
  { id: "betreuung_re_assessment", label: "Re-Assessment", kategorieId: "betreuung",
    hinweis: "Regelmässige Neubeurteilung des Pflegebedarfs", faelligkeit: { label: "aus Betreuungsrhythmus abgeleitet", tage: null },
    sperrtVertragsschritt: false, systemErzeugt: true },
  { id: "betreuung_pflegeplan", label: "Pflegeplan", kategorieId: "betreuung",
    hinweis: "Erstellung oder Anpassung der Pflegeplanung", faelligkeit: null,
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "betreuung_klv_verordnung", label: "KLV-Verordnung", kategorieId: "betreuung",
    hinweis: "Verordnung erstellen, verlängern oder anpassen", faelligkeit: null,
    sperrtVertragsschritt: false, systemErzeugt: false },
  { id: "betreuung_allgemein", label: "Allgemein", kategorieId: "betreuung",
    hinweis: null, faelligkeit: null, sperrtVertragsschritt: false, systemErzeugt: false },

  /* ── Sonstiges ── */
  { id: "sonstiges_sonstige_pendenz", label: "Sonstige Pendenz", kategorieId: "sonstiges",
    hinweis: "Alles, was in keine der übrigen Kategorien gehört", faelligkeit: null,
    sperrtVertragsschritt: false, systemErzeugt: false, verlangtZustaendige: true },
] as const satisfies readonly PendenzArt[];

/**
 * Die Kennung einer Art — aus dem Katalog abgeleitet, nicht daneben gepflegt.
 * Eine neue Art einzutragen genügt; der Typ wächst mit, und jede Zuordnung, die
 * eine unbekannte Kennung nennt, fällt beim Übersetzen auf.
 */
export type PendenzArtId = typeof PENDENZ_ARTEN[number]["id"];

/* ══════════════════════════════════════════
   ABLEITUNGEN — nichts hiervon wird gepflegt
   ══════════════════════════════════════════ */

const ARTEN_NACH_ID: Map<string, PendenzArt> = new Map(PENDENZ_ARTEN.map(a => [a.id, a]));
const KATEGORIEN_NACH_ID: Map<string, PendenzKategorie> = new Map(PENDENZ_KATEGORIEN.map(k => [k.id, k]));

/** Eine Art, oder `undefined` bei unbekannter Kennung. */
export function pendenzArt(id: string): PendenzArt | undefined {
  return ARTEN_NACH_ID.get(id);
}

/** Die Kategorie einer Art. */
export function kategorieVonArt(artId: string): PendenzKategorie | undefined {
  const art = ARTEN_NACH_ID.get(artId);
  return art ? KATEGORIEN_NACH_ID.get(art.kategorieId) : undefined;
}

/** Beschriftung einer Art; die Kennung selbst, wenn sie unbekannt ist. */
export function artLabel(artId: string): string {
  return ARTEN_NACH_ID.get(artId)?.label ?? artId;
}

/** Beschriftung der Kategorie einer Art. */
export function kategorieLabel(artId: string): string {
  return kategorieVonArt(artId)?.label ?? "Sonstiges";
}

/** «Kategorie · Art» — die vollständige Einordnung in einer Zeile. */
export function artVollLabel(artId: string): string {
  const art = ARTEN_NACH_ID.get(artId);
  if (!art) return artId;
  const k = KATEGORIEN_NACH_ID.get(art.kategorieId);
  return k ? `${k.label} · ${art.label}` : art.label;
}

/** Die Arten einer Kategorie, in Katalogreihenfolge. */
export function artenDerKategorie(kategorieId: PendenzKategorieId): PendenzArt[] {
  return PENDENZ_ARTEN.filter(a => a.kategorieId === kategorieId);
}

/** Zuständige Rolle einer Art — aus ihrer Kategorie, nicht je Art gepflegt. */
export function verantwortlichFuerArt(artId: string): UserRole | null {
  return kategorieVonArt(artId)?.verantwortlich ?? null;
}
