/**
 * Unit-Tests für leiteVeraenderungAb — ohne Test-Framework (keine neue
 * Abhängigkeit): reines node:assert, ausführbar mit
 *   npx tsx src/lib/interrai/abklaerung/veraenderung.test.ts
 * Bei einem Fehlschlag wirft assert und der Prozess endet mit Code 1.
 */
import assert from 'node:assert/strict'
import { leiteVeraenderungAb } from './veraenderung'

const faelle: { name: string; args: [number, number | null, number | null]; erwartet: string }[] = [
  // Regel 1 — kein Vergleich
  { name: 'vorwert null → kein_vergleich', args: [3, 2, null], erwartet: 'kein_vergleich' },
  { name: 'wert null → kein_vergleich', args: [3, null, 1], erwartet: 'kein_vergleich' },
  // Regel 2 — neu (von 0 auf einen anderen Wert)
  { name: 'CAP 3: 0 → 2 → neu', args: [3, 2, 0], erwartet: 'neu' },
  // Regel 3 — Richtung über die Ampel
  { name: 'CAP 3: 1(orange) → 2(rot) → verschlechtert', args: [3, 2, 1], erwartet: 'verschlechtert' },
  { name: 'CAP 3: 2(rot) → 1(orange) → verbessert', args: [3, 1, 2], erwartet: 'verbessert' },
  { name: 'CAP 18: 1(rot) → 2(rot) → unveraendert (gleiche Ampel, andere Zahl)', args: [18, 2, 1], erwartet: 'unveraendert' },
  // Dekubitus — der Beweisfall: Zahl steigt (1→3), Zustand verbessert sich
  { name: 'CAP 18 Dekubitus: 1(rot) → 3(orange) → verbessert', args: [18, 3, 1], erwartet: 'verbessert' },
  // Urininkontinenz — Werte 0 und 1 sind beide grün
  { name: 'CAP 26 Urininkontinenz: 0 → 1 → neu (Regel 2, obwohl grün)', args: [26, 1, 0], erwartet: 'neu' },
  { name: 'CAP 26 Urininkontinenz: 2(orange) → 1(gruen) → verbessert', args: [26, 1, 2], erwartet: 'verbessert' },
  // Unbekannter Wert im Katalog → kein Richtungsurteil
  { name: 'CAP 3: unbekannter Wert 9 → kein_vergleich', args: [3, 9, 1], erwartet: 'kein_vergleich' },
]

let ok = 0
for (const f of faelle) {
  const got = leiteVeraenderungAb(...f.args)
  assert.equal(got, f.erwartet, `${f.name} — erwartet ${f.erwartet}, erhalten ${got}`)
  ok++
}
console.log(`✓ leiteVeraenderungAb: ${ok}/${faelle.length} Fälle bestanden`)
