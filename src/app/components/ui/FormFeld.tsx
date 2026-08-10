/**
 * Ein beschriftetes Eingabefeld — die kleinste gemeinsame Form.
 *
 * Lag als lokale Funktion im Patientendossier, solange nur dieses sie
 * brauchte. Seit die Kontaktwahl auch im Abklärungsgespräch steht, brauchen
 * sie zwei Ansichten; ein zweites Feld daneben zu bauen hiesse, dieselbe
 * Gestaltung zweimal zu pflegen.
 */
export function FormFeld({ label, wert, platzhalter, onAendern }: {
  label: string; wert: string; platzhalter?: string; onAendern: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <input value={wert} onChange={e => onAendern(e.target.value)} placeholder={platzhalter} aria-label={label} className="ui-fokusring"
        style={{ width: "100%", padding: "6px 9px", borderRadius: 8, fontFamily: "inherit", fontSize: "var(--text-small)",
          color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }} />
    </div>
  );
}
