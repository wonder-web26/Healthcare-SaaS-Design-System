export type UserRole = "diplomiert" | "backoffice" | "management";

export interface UserProfile {
  id: string;
  name: string;
  vorname: string;
  initialen: string;
  color: string;
  role: UserRole;
  funktion: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  diplomiert: "Diplomierte",
  backoffice: "Backoffice",
  management: "Management",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  diplomiert: "Pflegefachperson",
  backoffice: "Administration",
  management: "Geschäftsführung",
};

export const MOCK_USERS: Record<UserRole, UserProfile> = {
  diplomiert: {
    id: "u-001",
    name: "Keller",
    vorname: "Maria",
    initialen: "MK",
    color: "#4F46E5",
    role: "diplomiert",
    funktion: "Dipl. Pflegefachperson HF",
  },
  backoffice: {
    id: "u-002",
    name: "Weber",
    vorname: "Sandra",
    initialen: "SW",
    color: "#D97706",
    role: "backoffice",
    funktion: "Sachbearbeiterin HR & Admin",
  },
  management: {
    id: "u-003",
    name: "Kaufmann",
    vorname: "Peter",
    initialen: "PK",
    color: "#1F5C4D",
    role: "management",
    funktion: "Geschäftsführer",
  },
};
