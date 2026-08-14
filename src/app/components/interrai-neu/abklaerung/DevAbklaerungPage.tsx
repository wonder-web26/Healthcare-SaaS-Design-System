/**
 * ENTWICKLUNGS-ROUTE für die Abklärungszusammenfassung (Route: /dev/abklaerung).
 * Einziger Ort, an dem die Fixture importiert wird — kein Produktionspfad.
 * Dient dazu, alle Zustände des Panels ohne die (noch nicht lizenzierte) CAP-Engine
 * sichtbar und prüfbar zu machen.
 */
import { useState } from 'react'
import { AbklaerungszusammenfassungPanel } from './AbklaerungszusammenfassungPanel'
import { fixtureRe, fixtureErst, fixtureLeer } from '../../../../lib/interrai/abklaerung/abklaerung-fixture'

const VARIANTEN = [
  { key: 're', label: 'Reassessment (gemischt)', props: fixtureRe },
  { key: 'erst', label: 'Erstassessment', props: fixtureErst },
  { key: 'leer', label: 'Kein CAP berechenbar', props: fixtureLeer },
] as const

export function DevAbklaerungPage() {
  const [variante, setVariante] = useState<(typeof VARIANTEN)[number]['key']>('re')
  const aktiv = VARIANTEN.find((v) => v.key === variante)!

  return (
    <div style={{ padding: '16px 20px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-tertiary)' }}>Dev · Abklärungszusammenfassung</span>
        <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-pill)', padding: 3 }}>
          {VARIANTEN.map((v) => {
            const on = v.key === variante
            return (
              <button key={v.key} type="button" onClick={() => setVariante(v.key)} className="ui-fokusring"
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--text-small)', fontWeight: on ? 'var(--weight-medium)' : 'var(--weight-regular)', background: on ? 'var(--bg-elevated)' : 'transparent', color: 'var(--text-primary)' }}>
                {v.label}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-card)' }}>
        <AbklaerungszusammenfassungPanel
          {...aktiv.props}
          onBereichNavigieren={(b) => console.log('[dev] Zu Bereich', b)}
          onOffeneBereiche={() => console.log('[dev] Offene Bereiche')}
        />
      </div>
    </div>
  )
}
