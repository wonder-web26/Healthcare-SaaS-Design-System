import { useState } from 'react'
import { ChevronDown, ExternalLink, BookOpen, CornerDownRight } from 'lucide-react'
import type { Ampel, Veraenderung, CapErgebnis } from '../../../../lib/interrai/abklaerung/typen'

/* Ampelfarbe kommt aus dem Styleguide (Token), nie aus dem Katalog-Modul. */
const AMPEL_FARBE: Record<Ampel, string> = {
  gruen: 'var(--status-success)',
  orange: 'var(--status-warning)',
  rot: 'var(--status-danger)',
}

/* Chip: Text trägt die Bedeutung, Farbe ist redundant (nie das einzige Merkmal). */
type ChipTon = 'warning' | 'danger' | 'success'
const CHIP_STIL: Record<ChipTon, { bg: string; color: string }> = {
  warning: { bg: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' },
  danger: { bg: 'var(--status-danger-bg)', color: 'var(--status-danger)' },
  success: { bg: 'var(--status-success-bg)', color: 'var(--status-success-text)' },
}

function chipFuer(veraenderung: Veraenderung, istRessource: boolean): { text: string; ton: ChipTon } | null {
  if (istRessource) return veraenderung === 'verbessert' ? { text: 'neu Ressource', ton: 'success' } : null
  switch (veraenderung) {
    case 'neu': return { text: 'neu ausgelöst', ton: 'warning' }
    case 'verschlechtert': return { text: 'verschlechtert', ton: 'danger' }
    case 'verbessert': return { text: 'verbessert', ton: 'success' }
    default: return null // unveraendert / kein_vergleich → kein Chip
  }
}

export type CapZeileModell = {
  cap: CapErgebnis
  titel: string
  ergebnisText: string | null
  ampel: Ampel | null
  veraenderung: Veraenderung
  istRessource: boolean
  istNichtBerechenbar: boolean
}

export function CapZeile({
  modell,
  onBereichNavigieren,
}: {
  modell: CapZeileModell
  onBereichNavigieren?: (bereichCode: string) => void
}) {
  const [offen, setOffen] = useState(false)
  const { cap, titel, ergebnisText, ampel, veraenderung, istRessource, istNichtBerechenbar } = modell
  const chip = istNichtBerechenbar ? null : chipFuer(veraenderung, istRessource)
  const xItems = cap.nichtBerechenbarWegen
  // Torbedingungs-CAPs (offener fachlicher Punkt 1) vs. Code X (offener Punkt 2):
  const torbedingung = [2, 3, 7, 15].includes(cap.capNummer)

  return (
    <div style={{ borderBottom: '0.5px solid var(--border-default)' }}>
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="ui-fokusring"
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
          padding: '12px 16px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        {/* Ampelpunkt — steht immer zusammen mit dem Ergebnistext (Farbe nie allein) */}
        <span
          aria-hidden="true"
          style={{
            width: 9, height: 9, borderRadius: '50%', marginTop: 4, flexShrink: 0,
            background: istNichtBerechenbar ? 'transparent' : ampel ? AMPEL_FARBE[ampel] : 'var(--text-tertiary)',
            border: istNichtBerechenbar ? '1.5px dashed var(--text-tertiary)' : 'none',
          }}
        />
        {/* Titel (Zeile 1) + Ergebnistext (Zeile 2) — zweizeilig, damit lange Titel
            nie in den Ergebnistext umbrechen. Kein Kürzen, Umbruch statt Ellipsis. */}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
              {titel}
            </span>
            {cap.bereicheUnquittiert && (
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--status-warning-text)', fontWeight: 'var(--weight-medium)' }}>
                nicht quittiert
              </span>
            )}
          </span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 'var(--text-small)', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>
            {istNichtBerechenbar
              ? (xItems.length === 1 ? `${xItems[0]} mit X` : `${xItems.length} Items mit X`)
              : ergebnisText}
          </span>
        </span>
        {/* Rechte Spalte: Veränderungs-Chip (Text + Farbe) plus „war {vorwert}" */}
        {chip && (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
            <span style={{
              padding: '2px 10px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-meta)',
              fontWeight: 'var(--weight-medium)', whiteSpace: 'nowrap',
              background: CHIP_STIL[chip.ton].bg, color: CHIP_STIL[chip.ton].color,
            }}>
              {chip.text}
            </span>
            {cap.vorwert !== null && (
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-tertiary)' }}>war {cap.vorwert}</span>
            )}
          </span>
        )}
        <ChevronDown
          style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: 'var(--text-tertiary)', transform: offen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {offen && (
        <div style={{ padding: '0 16px 14px 35px' }}>
          {istNichtBerechenbar ? (
            <>
              {/* X-Items hervorgehoben */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {xItems.map((it) => (
                  <span key={it} style={{
                    padding: '2px 10px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-meta)',
                    fontWeight: 'var(--weight-medium)', background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)',
                  }}>
                    {it} · X
                  </span>
                ))}
              </div>
              {/* Erläuterungstext — offener fachlicher Punkt, als Platzhalter markiert */}
              <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                {torbedingung
                  ? '[Platzhalter — Erläuterungstext für nicht anwendbare CAPs mit Torbedingung; Wortlaut aus dem Pflichtenheft, fachlich zu bestätigen]'
                  : '[Platzhalter — Hinweistext bei Code X; Vorlage Pflichtenheft Kap. 4.5, Wortlaut fachlich zu bestätigen]'}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                Zugrundeliegende Codierungen
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: cap.handbuchAnker || cap.bereichAnker ? 12 : 0 }}>
                {cap.codierungen.length === 0 && (
                  <span style={{ fontSize: 'var(--text-small)', color: 'var(--text-tertiary)' }}>Keine Codierungen hinterlegt.</span>
                )}
                {cap.codierungen.map((c) => (
                  <div key={c.bezeichnung} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 'var(--text-small)' }}>
                    <span style={{ color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{c.bezeichnung}</span>
                    <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{c.wert}</span>
                  </div>
                ))}
              </div>
              {(cap.handbuchAnker || cap.bereichAnker) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {cap.handbuchAnker && (
                    <a
                      href={cap.handbuchAnker} target="_blank" rel="noopener noreferrer"
                      className="ui-fokusring"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-small)', color: 'var(--brand-accent)', textDecoration: 'none' }}
                    >
                      <BookOpen style={{ width: 14, height: 14 }} /> Handbuch öffnen
                      <ExternalLink style={{ width: 11, height: 11, opacity: 0.6 }} />
                    </a>
                  )}
                  {cap.bereichAnker && (
                    <button
                      type="button"
                      onClick={() => onBereichNavigieren?.(cap.bereichAnker!)}
                      className="ui-fokusring"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-small)', color: 'var(--brand-accent)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    >
                      <CornerDownRight style={{ width: 14, height: 14 }} /> Zu Bereich {cap.bereichAnker}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
