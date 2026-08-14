import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'
import { capDefinition, capErgebnis } from '../../../../lib/interrai/katalog/cap-katalog'
import { leiteVeraenderungAb } from '../../../../lib/interrai/abklaerung/veraenderung'
import type { AbklaerungProps, CapErgebnis } from '../../../../lib/interrai/abklaerung/typen'
import { CapZeile, type CapZeileModell } from './CapZeile'

const COPYRIGHT = '© interRAI 1994–2022 · interRAI HC Schweiz'

/** Reine Klassifikation eines CAP über den Katalog. null = im Katalog unbekannt. */
function klassifiziere(cap: CapErgebnis): CapZeileModell | null {
  const def = capDefinition(cap.capNummer)
  if (!def) {
    console.warn(`[Abklärungszusammenfassung] Unbekannte capNummer ${cap.capNummer} — Zeile nicht gerendert.`)
    return null
  }
  if (cap.wert === null) {
    return { cap, titel: def.titel, ergebnisText: null, ampel: null, veraenderung: 'kein_vergleich', istRessource: false, istNichtBerechenbar: true }
  }
  const erg = capErgebnis(cap.capNummer, cap.wert)
  if (!erg) {
    console.warn(`[Abklärungszusammenfassung] Unbekannter Wert ${cap.wert} für CAP ${cap.capNummer} — Zeile nicht gerendert.`)
    return null
  }
  return {
    cap, titel: def.titel, ergebnisText: erg.text, ampel: erg.ampel,
    veraenderung: leiteVeraenderungAb(cap.capNummer, cap.wert, cap.vorwert),
    istRessource: erg.ampel === 'gruen', istNichtBerechenbar: false,
  }
}

const nachNummer = (a: CapZeileModell, b: CapZeileModell) => a.cap.capNummer - b.cap.capNummer

function Abschnittstitel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)', padding: '18px 16px 6px' }}>
      {children}
    </div>
  )
}

function Hinweis({ children, ton = 'info', aktion }: { children: React.ReactNode; ton?: 'info' | 'warnung'; aktion?: React.ReactNode }) {
  const stil = ton === 'warnung'
    ? { bg: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
    : { bg: 'var(--status-info-bg)', color: 'var(--status-info)' }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '0 16px 12px', padding: '10px 14px', borderRadius: 'var(--radius-card)', background: stil.bg }}>
      <Info style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, color: stil.color }} />
      <div style={{ flex: 1, fontSize: 'var(--text-small)', color: stil.color, lineHeight: 1.5 }}>
        {children}
        {aktion && <div style={{ marginTop: 4 }}>{aktion}</div>}
      </div>
    </div>
  )
}

export function AbklaerungszusammenfassungPanel(props: AbklaerungProps) {
  const { assessmentTyp, vergleichsDatum, uebernommeneDaten, bereicheQuittiert, bereicheGesamt, caps, onBereichNavigieren, onOffeneBereiche } = props
  const istErst = assessmentTyp === 'erst'

  const modelle = caps.map(klassifiziere).filter((m): m is CapZeileModell => m !== null)
  const nichtBerechenbar = modelle.filter((m) => m.istNichtBerechenbar).sort(nachNummer)
  const berechenbar = modelle.filter((m) => !m.istNichtBerechenbar)
  const ressourcen = berechenbar.filter((m) => m.istRessource).sort(nachNummer)
  const ausgeloest = berechenbar.filter((m) => !m.istRessource).sort(nachNummer)

  const neuOderVerschlechtert = ausgeloest.filter((m) => m.veraenderung === 'neu' || m.veraenderung === 'verschlechtert')
  const verbessert = ausgeloest.filter((m) => m.veraenderung === 'verbessert')
  const unveraendert = ausgeloest.filter((m) => m.veraenderung === 'unveraendert' || m.veraenderung === 'kein_vergleich')

  // Ressourcen sind standardmässig eingeklappt; sind gar keine CAPs ausgelöst,
  // werden sie aufgeklappt gerendert (Zustand aus Prompt §7).
  const [ressourcenOffen, setRessourcenOffen] = useState(ausgeloest.length === 0)

  const renderZeilen = (liste: CapZeileModell[]) =>
    liste.map((m) => <CapZeile key={m.cap.capNummer} modell={m} onBereichNavigieren={onBereichNavigieren} />)

  const keinBerechenbar = berechenbar.length === 0

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 12px 32px' }}>
      {/* 5.1 Übernahme-Hinweis */}
      {uebernommeneDaten && (
        <Hinweis
          ton="info"
          aktion={
            <button type="button" onClick={onOffeneBereiche} className="ui-fokusring"
              style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'var(--text-small)', fontWeight: 'var(--weight-medium)', color: 'var(--brand-accent)', cursor: 'pointer' }}>
              Offene Bereiche
            </button>
          }
        >
          Beruht teilweise auf übernommenen Daten vom {vergleichsDatum}. {bereicheQuittiert} von {bereicheGesamt} Bereichen quittiert.
        </Hinweis>
      )}

      {/* 5.2 Erstassessment-Hinweis */}
      {istErst && (
        <Hinweis ton="info">
          Erstassessment: kein Vergleich mit einer früheren Beurteilung möglich. Ab dem nächsten Reassessment wird hier die Veränderung ausgewiesen.
        </Hinweis>
      )}

      {keinBerechenbar ? (
        <p style={{ margin: '8px 16px', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
          Noch keine Abklärungshilfe berechenbar.
        </p>
      ) : (
        <>
          {/* 5.3 + 5.4 Ausgelöste CAPs */}
          {ausgeloest.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '18px 16px 6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>
                  Ausgelöst · {ausgeloest.length} von {berechenbar.length} berechneten
                </span>
                {!istErst && neuOderVerschlechtert.length > 0 && (
                  <span style={{ fontSize: 'var(--text-meta)', fontWeight: 'var(--weight-medium)', color: 'var(--status-warning-text)' }}>
                    {neuOderVerschlechtert.length} neu oder verschlechtert
                  </span>
                )}
              </div>

              {istErst ? (
                // Erstassessment: keine Gruppenüberschriften, flache Liste nach capNummer
                <div>{renderZeilen(ausgeloest)}</div>
              ) : (
                <>
                  {neuOderVerschlechtert.length > 0 && (
                    <div>
                      <div style={{ fontSize: 'var(--text-small)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', padding: '10px 16px 4px' }}>Neu oder verschlechtert</div>
                      {renderZeilen(neuOderVerschlechtert)}
                    </div>
                  )}
                  {verbessert.length > 0 && (
                    <div>
                      <div style={{ fontSize: 'var(--text-small)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', padding: '10px 16px 4px' }}>Verbessert</div>
                      {renderZeilen(verbessert)}
                    </div>
                  )}
                  {unveraendert.length > 0 && (
                    <div>
                      <div style={{ fontSize: 'var(--text-small)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', padding: '10px 16px 4px' }}>Unverändert</div>
                      {renderZeilen(unveraendert)}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* 5.5 Nicht berechenbare CAPs */}
          {nichtBerechenbar.length > 0 && (
            <>
              <Abschnittstitel>Nicht berechenbar · beim nächsten Besuch nachfragen</Abschnittstitel>
              {renderZeilen(nichtBerechenbar)}
            </>
          )}

          {/* 5.6 Ressourcen (nicht ausgelöst) */}
          {ressourcen.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setRessourcenOffen((o) => !o)}
                aria-expanded={ressourcenOffen}
                className="ui-fokusring"
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '14px 16px 6px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                <span style={{ flex: 1, fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>
                  {ressourcen.length} nicht ausgelöst · Ressourcen
                </span>
                <span style={{ fontSize: 'var(--text-small)', color: 'var(--brand-accent)' }}>{ressourcenOffen ? 'ausblenden' : 'anzeigen'}</span>
                <ChevronDown style={{ width: 15, height: 15, color: 'var(--text-tertiary)', transform: ressourcenOffen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {ressourcenOffen && <div>{renderZeilen(ressourcen)}</div>}
            </div>
          )}
        </>
      )}

      {/* 5.7 Copyright — Pflichtangabe, immer sichtbar */}
      <div style={{ marginTop: 24, padding: '12px 16px 0', borderTop: '0.5px solid var(--border-default)', fontSize: 'var(--text-micro)', color: 'var(--text-tertiary)' }}>
        {COPYRIGHT}
      </div>
    </div>
  )
}
