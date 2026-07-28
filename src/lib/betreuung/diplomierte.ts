/**
 * Demo roster of registered nurses (Diplomierte).
 *
 * Stands in for a real user directory until one exists. Every entry carries a
 * stable user id (Kennung) — the value the Bezugsperson references — plus the
 * parts its display name is derived from. u-001 is the same user as
 * MOCK_USERS.diplomiert in types/user.ts.
 */
export interface DiplomierterUser {
  /** User id (Kennung) — this is what the care relationship stores. */
  id: string;
  /** Kürzel. */
  initialen: string;
  vorname: string;
  name: string;
  funktion: string;
}

export const DIPLOMIERTE: DiplomierterUser[] = [
  { id: "u-001", initialen: "MK", vorname: "Maria", name: "Keller", funktion: "Dipl. Pflegefachperson HF" },
  { id: "u-101", initialen: "AR", vorname: "Anna", name: "Rüegg", funktion: "Dipl. Pflegefachfrau HF" },
  { id: "u-102", initialen: "LB", vorname: "Luca", name: "Bianchi", funktion: "Dipl. Pflegefachmann HF" },
  { id: "u-103", initialen: "SM", vorname: "Sophie", name: "Marti", funktion: "Dipl. Pflegefachfrau FH" },
  { id: "u-104", initialen: "TF", vorname: "Thomas", name: "Furrer", funktion: "Dipl. Pflegefachmann HF" },
  { id: "u-105", initialen: "NK", vorname: "Nadia", name: "Kern", funktion: "Dipl. Expertin Intensivpflege NDS HF" },
];

export function getDiplomierte(): DiplomierterUser[] {
  return DIPLOMIERTE;
}

export function getDiplomierterById(id: string | null | undefined): DiplomierterUser | undefined {
  return id ? DIPLOMIERTE.find(d => d.id === id) : undefined;
}

export function diplomierterAnzeigename(u: DiplomierterUser): string {
  return `${u.vorname} ${u.name}`;
}
