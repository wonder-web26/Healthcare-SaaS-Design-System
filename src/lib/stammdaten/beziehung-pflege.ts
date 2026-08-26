/**
 * Beziehung der pflegenden angehörigen Person zur betreuten Person (Patient).
 *
 * Kernangabe der Angehörigenpflege: wie steht die pflegende Person zum Patienten.
 * Werte als Code gespeichert, nicht das Label. Schweizer Hochdeutsch.
 */

export interface BeziehungDefinition {
  value: string;
  label: string;
}

export const BEZIEHUNGEN: BeziehungDefinition[] = [
  { value: "ehepartner", label: "Ehepartner/in" },
  { value: "partner", label: "Partner/in (Lebensgemeinschaft)" },
  { value: "elternteil", label: "Elternteil (Mutter/Vater)" },
  { value: "kind", label: "Kind (Sohn/Tochter)" },
  { value: "geschwister", label: "Geschwister" },
  { value: "grosselternteil", label: "Grosselternteil" },
  { value: "enkelkind", label: "Enkelkind" },
  { value: "schwiegerkind", label: "Schwiegerkind" },
  { value: "verwandte", label: "Andere/r Verwandte/r" },
  { value: "nachbar", label: "Nachbar/in" },
  { value: "bekannte", label: "Freund/in / Bekannte/r" },
  { value: "andere", label: "Andere" },
];

export const BEZIEHUNG_OPTIONS = BEZIEHUNGEN.map(b => ({ value: b.value, label: b.label }));

export const beziehungLabel = (value: string) =>
  BEZIEHUNGEN.find(b => b.value === value)?.label ?? value;
