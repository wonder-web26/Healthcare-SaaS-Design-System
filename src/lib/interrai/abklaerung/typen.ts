/**
 * Props-Vertrag der Abklärungszusammenfassung (Teil 1: CAPs).
 *
 * Titel, Ergebnistext und Ampelstufe werden NICHT als Props übergeben — sie
 * stammen ausschliesslich aus cap-katalog.ts, nachgeschlagen über capNummer und
 * wert. Duplikate im Vertrag würden auseinanderlaufen.
 */
import type { Ampel } from '../katalog/cap-katalog'
import type { Veraenderung } from './veraenderung'

export type { Ampel, Veraenderung }

export type CapErgebnis = {
  capNummer: number
  /** null = nicht berechenbar */
  wert: number | null
  /** Wert im vorangehenden Assessment; null = kein Vergleich */
  vorwert: number | null
  /** sichtbare Item-Nummern mit Code X (nicht erhoben) */
  nichtBerechenbarWegen: string[]
  codierungen: { bezeichnung: string; wert: string }[]
  bereicheUnquittiert: boolean
  handbuchAnker: string | null
  /** Sprungziel (Bereichscode A..S) innerhalb des Assessments */
  bereichAnker: string | null
}

export type AbklaerungProps = {
  assessmentTyp: 'erst' | 're'
  vergleichsDatum: string | null
  uebernommeneDaten: boolean
  bereicheQuittiert: number
  bereicheGesamt: number
  caps: CapErgebnis[]
  gesperrt: boolean
  /** Sprung in einen Bereich des Assessments (optional; im Assessment-Kontext gesetzt). */
  onBereichNavigieren?: (bereichCode: string) => void
  /** Sprung zu den offenen Bereichen (Link im Übernahme-Hinweis). */
  onOffeneBereiche?: () => void
}
