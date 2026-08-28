/**
 * BB16 Einschätzung der Situation — Triage/Route.
 *
 * Die Antwortoptionen von BB16 stehen ausschliesslich im SDA-Katalog
 * (`sda-katalog.ts`, i-Code CHBB16) — hier bleibt nur die Route-Zuordnung, die
 * EINE Quelle für das Mapping BB16-Code → Fall.route. Das Onboarding-Feld ist
 * herausgelöst; die Optionen sind hier ersatzlos entfallen (§8).
 */

/**
 * Route (Fall.route) im produktiven Schema: die Zuordnung des BB16-Codes zum
 * Abklärungsweg, eins zu eins, ohne Zusammenfassung. Dies ist die EINZIGE
 * Mapping-Quelle (kein zweites Mapping anlegen).
 *
 * 1 somatisch · 2 psychiatrisch · 3 palliativ · 4 pädiatrisch ·
 * 5 isoliert-therapeutisch · 6 vorübergehend hauswirtschaftlich ·
 * 7 Klientin lehnt eine umfassende Bedarfsabklärung ab.
 */
export type FallRoute =
  | "somatic"
  | "mental_health"
  | "palliative"
  | "paediatric"
  | "isolated_therapeutic"
  | "housekeeping"
  | "declined"
  | null;

const BB16_ROUTE: Record<string, Exclude<FallRoute, null>> = {
  "1": "somatic",
  "2": "mental_health",
  "3": "palliative",
  "4": "paediatric",
  "5": "isolated_therapeutic",
  "6": "housekeeping",
  "7": "declined",
};

/** BB16-Code → Route. Leerer/unbekannter Code → null (Triage steht aus). */
export function sdaRoute(code: string): FallRoute {
  return BB16_ROUTE[code] ?? null;
}

/**
 * Verlangt dieser BB16-Wert im Onboarding eine interRAI-Abklärung? Dünne
 * Ableitung aus `sdaRoute` (KEIN zweites Mapping) — erhält das bestehende
 * Onboarding-Verhalten: nur die Codes 5/6/7 (isoliert-therapeutisch,
 * hauswirtschaftlich, abgelehnt) verlangen keine; leer/unbekannt verlangt.
 */
export function sdaVerlangtInterrai(code: string): boolean {
  const r = sdaRoute(code);
  return r === null || (r !== "isolated_therapeutic" && r !== "housekeeping" && r !== "declined");
}
