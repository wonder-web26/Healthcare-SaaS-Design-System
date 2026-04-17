import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  Activity,
  Clock,
  User,
  Edit3,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Shield,
  GraduationCap,
  CalendarDays,
  Headphones,
  Stamp,
  FileClock,
  Award,
  ListChecks,
  Table2,
  LayoutDashboard,
  History,
  Receipt,
  Heart,
  Baby,
  Briefcase,
  CreditCard,
  Building2,
  Landmark,
  RefreshCw,
  Users,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  Info,
  DollarSign,
  Globe,
  Upload,
  Calendar,
  ArrowRight,
  CalendarOff,
  MessageSquare,
} from "lucide-react";
import {
  angehoerige,
  qualifikationConfig,
  billingReadinessConfig,
  type Angehoeriger,
} from "./angehoerigeData";
import { TabDokumenteGeneric, type DocFolder } from "./TabDokumente";

/* ══════════════════════════════════════════
   EXTENDED MOCK DATA — HR detail fields
   (simulates onboarding-captured data)
   ══════════════════════════════════════════ */
interface AngehoerigerDetail {
  /* Personalien */
  geschlecht: string;
  geburtsdatum: string;
  ahvNummer: string;
  nationalitaet: string;
  heimatort: string;
  aufenthaltsstatus: string;
  zivilstand: string;
  zivilstandSeit: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  krankenkasseName: string;
  versicherungsnummer: string;
  /* Steuer & Sozialversicherung */
  quellensteuer: string;
  konfession: string;
  quellensteuerTarif: string;
  steuergemeinde: string;
  sozialamtInvolviert: string;
  sozialamtKontakt: string;
  lohnabtretung: string;
  /* Partner */
  partnerName: string;
  partnerGeburtsdatum: string;
  partnerAhvNummer: string;
  partnerZemisNummer: string;
  partnerAufenthaltsstatus: string;
  /* Kinder */
  kinder: { nachname: string; vorname: string; geburtsdatum: string; ahvNummer: string; geschlecht: string; zulagenart: string; ausbildungsbeginn: string }[];
  kinderzulagenAktiv: string;
  kinderzulagenUeberSpitex: string;
  familienausgleichskasse: string;
  /* Lohn & Aufenthalt */
  lohnsumme: string;
  fluechtlingsstatus: string;
  grenzgaenger: string;
  /* Anstellung & Auszahlung */
  funktion: string;
  eintrittsdatum: string;
  stundenlohn: string;
  bankname: string;
  iban: string;
  /* SRK Kurs */
  srkStatus: "abgeschlossen" | "offen" | "ueberfaellig";
  srkAngemeldet: boolean;
  srkDeadline: string;
  srkAbgeschlossenAm: string;
  /* Dokumente */
  dokumente: { name: string; status: "hochgeladen" | "fehlend" | "abgelaufen"; datum: string }[];
}

const detailLookup: Record<string, AngehoerigerDetail> = {
  "A-2026-0101": {
    geschlecht: "Männlich", geburtsdatum: "14.03.1978", ahvNummer: "756.1234.5678.97",
    nationalitaet: "Schweiz", heimatort: "Luzern", aufenthaltsstatus: "—",
    zivilstand: "Verheiratet", zivilstandSeit: "12.06.2005",
    strasse: "Bahnhofstrasse 42", plz: "8001", ort: "Zürich",
    email: "peter.mueller@bluewin.ch", telefon: "+41 44 321 65 87",
    krankenkasseName: "CSS", versicherungsnummer: "KK-834291",
    quellensteuer: "Nein", konfession: "Evangelisch-reformiert",
    quellensteuerTarif: "—", steuergemeinde: "Zürich",
    sozialamtInvolviert: "Nein", sozialamtKontakt: "—", lohnabtretung: "Nein",
    partnerName: "Anna Müller", partnerGeburtsdatum: "22.08.1980",
    partnerAhvNummer: "756.9876.5432.10", partnerZemisNummer: "—", partnerAufenthaltsstatus: "Schweizer/in",
    kinder: [
      { nachname: "Müller", vorname: "Luca", geburtsdatum: "15.04.2010", ahvNummer: "756.1111.2222.33", geschlecht: "Männlich", zulagenart: "K", ausbildungsbeginn: "—" },
      { nachname: "Müller", vorname: "Sophie", geburtsdatum: "03.09.2012", ahvNummer: "756.4444.5555.66", geschlecht: "Weiblich", zulagenart: "K", ausbildungsbeginn: "—" },
    ],
    kinderzulagenAktiv: "Ja", kinderzulagenUeberSpitex: "Ja", familienausgleichskasse: "SVA Zürich",
    lohnsumme: "3'540.00", fluechtlingsstatus: "Nein", grenzgaenger: "Nein",
    funktion: "Pflegende/r Angehörige/r", eintrittsdatum: "01.01.2026", stundenlohn: "29.50",
    bankname: "UBS", iban: "CH93 0076 2011 6238 5295 7",
    srkStatus: "abgeschlossen", srkAngemeldet: true, srkDeadline: "31.12.2026", srkAbgeschlossenAm: "15.01.2026",
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "02.01.2026" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "02.01.2026" },
      { name: "Bankkarte", status: "hochgeladen", datum: "03.01.2026" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "05.01.2026" },
      { name: "Partner Krankenkassenkarte", status: "hochgeladen", datum: "05.01.2026" },
    ],
  },
  "A-2026-0102": {
    geschlecht: "Weiblich", geburtsdatum: "28.11.1985", ahvNummer: "756.2345.6789.08",
    nationalitaet: "Deutschland", heimatort: "—", aufenthaltsstatus: "Bewilligung B",
    zivilstand: "Ledig", zivilstandSeit: "—",
    strasse: "Seestrasse 15", plz: "8002", ort: "Zürich",
    email: "lisa.schmid@gmail.com", telefon: "+41 76 555 12 34",
    krankenkasseName: "Helsana", versicherungsnummer: "—",
    quellensteuer: "Ja", konfession: "Konfessionslos",
    quellensteuerTarif: "A", steuergemeinde: "Zürich",
    sozialamtInvolviert: "Nein", sozialamtKontakt: "—", lohnabtretung: "Nein",
    partnerName: "—", partnerGeburtsdatum: "—",
    partnerAhvNummer: "—", partnerZemisNummer: "—", partnerAufenthaltsstatus: "—",
    kinder: [],
    kinderzulagenAktiv: "Nein", kinderzulagenUeberSpitex: "Nein", familienausgleichskasse: "—",
    lohnsumme: "2'800.00", fluechtlingsstatus: "Nein", grenzgaenger: "Ja",
    funktion: "Pflegende/r Angehörige/r", eintrittsdatum: "15.02.2026", stundenlohn: "28.00",
    bankname: "—", iban: "—",
    srkStatus: "offen", srkAngemeldet: true, srkDeadline: "15.03.2026", srkAbgeschlossenAm: "—",
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "16.02.2026" },
      { name: "Krankenkassenkarte", status: "fehlend", datum: "—" },
      { name: "Bankkarte", status: "fehlend", datum: "—" },
      { name: "Familienbüchlein", status: "fehlend", datum: "—" },
      { name: "Partner Krankenkassenkarte", status: "fehlend", datum: "—" },
    ],
  },
  "A-2026-0103": {
    geschlecht: "Männlich", geburtsdatum: "05.07.1972", ahvNummer: "756.3456.7890.19",
    nationalitaet: "Schweiz", heimatort: "Bern", aufenthaltsstatus: "—",
    zivilstand: "Geschieden", zivilstandSeit: "01.03.2018",
    strasse: "Musterweg 7", plz: "3012", ort: "Bern",
    email: "j.weber@gmx.ch", telefon: "+41 31 777 88 99",
    krankenkasseName: "Swica", versicherungsnummer: "KK-556783",
    quellensteuer: "Nein", konfession: "Römisch-katholisch",
    quellensteuerTarif: "—", steuergemeinde: "Bern",
    sozialamtInvolviert: "Nein", sozialamtKontakt: "—", lohnabtretung: "Nein",
    partnerName: "—", partnerGeburtsdatum: "—",
    partnerAhvNummer: "—", partnerZemisNummer: "—", partnerAufenthaltsstatus: "—",
    kinder: [
      { nachname: "Weber", vorname: "Tim", geburtsdatum: "20.01.2008", ahvNummer: "756.7777.8888.99", geschlecht: "Männlich", zulagenart: "W", ausbildungsbeginn: "01.08.2024" },
    ],
    kinderzulagenAktiv: "Ja", kinderzulagenUeberSpitex: "Ja", familienausgleichskasse: "SVA Bern",
    lohnsumme: "4'160.00", fluechtlingsstatus: "Nein", grenzgaenger: "Nein",
    funktion: "Pflegende/r Angehörige/r", eintrittsdatum: "01.11.2025", stundenlohn: "32.00",
    bankname: "PostFinance", iban: "CH55 0900 0000 1234 5678 9",
    srkStatus: "ueberfaellig", srkAngemeldet: false, srkDeadline: "15.02.2026", srkAbgeschlossenAm: "—",
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "01.11.2025" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "01.11.2025" },
      { name: "Bankkarte", status: "hochgeladen", datum: "02.11.2025" },
      { name: "Familienbüchlein", status: "hochgeladen", datum: "05.11.2025" },
      { name: "Partner Krankenkassenkarte", status: "fehlend", datum: "—" },
    ],
  },
};

/* Fallback detail for any angehoeriger not in the lookup */
function getDetail(id: string): AngehoerigerDetail {
  if (detailLookup[id]) return detailLookup[id];
  return {
    geschlecht: "Weiblich", geburtsdatum: "10.05.1975", ahvNummer: "756.5555.6666.77",
    nationalitaet: "Schweiz", heimatort: "Basel", aufenthaltsstatus: "—",
    zivilstand: "Verheiratet", zivilstandSeit: "20.09.2002",
    strasse: "Hauptstrasse 10", plz: "4051", ort: "Basel",
    email: "kontakt@example.ch", telefon: "+41 61 222 33 44",
    krankenkasseName: "Concordia", versicherungsnummer: "KK-112233",
    quellensteuer: "Nein", konfession: "Evangelisch-reformiert",
    quellensteuerTarif: "—", steuergemeinde: "Basel-Stadt",
    sozialamtInvolviert: "Nein", sozialamtKontakt: "—", lohnabtretung: "Nein",
    partnerName: "Max Muster", partnerGeburtsdatum: "01.01.1974",
    partnerAhvNummer: "756.8888.9999.00", partnerZemisNummer: "—", partnerAufenthaltsstatus: "Schweizer/in",
    kinder: [],
    kinderzulagenAktiv: "Nein", kinderzulagenUeberSpitex: "Nein", familienausgleichskasse: "—",
    lohnsumme: "3'100.00", fluechtlingsstatus: "Nein", grenzgaenger: "Nein",
    funktion: "Pflegende/r Angehörige/r", eintrittsdatum: "01.01.2026", stundenlohn: "29.50",
    bankname: "ZKB", iban: "CH12 0070 0110 0061 5200 0",
    srkStatus: "offen", srkAngemeldet: false, srkDeadline: "30.06.2026", srkAbgeschlossenAm: "—",
    dokumente: [
      { name: "ID / Pass", status: "hochgeladen", datum: "01.01.2026" },
      { name: "Krankenkassenkarte", status: "hochgeladen", datum: "01.01.2026" },
      { name: "Bankkarte", status: "hochgeladen", datum: "02.01.2026" },
      { name: "Familienbüchlein", status: "fehlend", datum: "—" },
      { name: "Partner Krankenkassenkarte", status: "fehlend", datum: "—" },
    ],
  };
}

/* ── Status config (same pattern as Patient) �� */
const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  aktiv: { label: "Aktiv", bg: "bg-success-light", text: "text-success-foreground", dot: "bg-success" },
  in_onboarding: { label: "In Onboarding", bg: "bg-warning-light", text: "text-warning-foreground", dot: "bg-warning" },
  fehlende_dokumente: { label: "Fehlende Dokumente", bg: "bg-error-light", text: "text-error-foreground", dot: "bg-error" },
};

/* ── Tab definitions ─────────────────────── */
const profileTabs = [
  { id: "ueberblick", label: "Überblick", icon: LayoutDashboard },
  { id: "workflow", label: "Workflow / Action Plan", icon: ListChecks },
  { id: "dokumente", label: "Dokumente", icon: FileText },
  { id: "related", label: "Related Lists", icon: Table2 },
  { id: "tickets", label: "Tickets", icon: Headphones },
  { id: "historie", label: "Historie", icon: History },
];

/* ── Workflow / Action Plan ──────────────── */
interface ProcessStep {
  nr: number;
  label: string;
  status: "done" | "active" | "pending";
  date?: string;
  note?: string;
  responsible?: string;
  dueDate?: string;
  overdue?: boolean;
}

function getOnboardingProzess(a: Angehoeriger): ProcessStep[] {
  const steps = [
    "Vertrag & Personalien erfasst",
    "Steuer & Sozialversicherung geprüft",
    "Partnerdaten erfasst",
    "Kinderzulagen geklärt",
    "Anstellungskonditionen definiert",
    "ID / Ausweis hochgeladen",
    "Krankenkassenkarte hochgeladen",
    "Bankdaten verifiziert",
    "Quellensteuer-Tarif geprüft",
    "BVG / UVG Anmeldung",
    "Arbeitsvertrag unterschrieben",
    "MedLink-Zugang erstellt",
    "Ersteinsatz-Briefing durchgeführt",
  ];
  const responsibles = [
    "K. Meier", "K. Meier", "K. Meier", "K. Meier", "S. Weber",
    "K. Meier", "K. Meier", "K. Meier", "M. Keller", "HR-System",
    "S. Weber", "IT-System", "S. Weber",
  ];
  const dueDates = [
    "05.01.2026", "07.01.2026", "08.01.2026", "10.01.2026", "12.01.2026",
    "14.01.2026", "14.01.2026", "15.01.2026", "18.01.2026", "20.01.2026",
    "22.01.2026", "25.01.2026", "28.01.2026",
  ];
  const doneCount = a.status === "aktiv" ? 13 : a.status === "fehlende_dokumente" ? 5 : 4;
  const dates = [
    "02.01.2026", "03.01.2026", "04.01.2026", "05.01.2026", "06.01.2026",
    "07.01.2026", "08.01.2026", "10.01.2026", "12.01.2026", "15.01.2026",
    "18.01.2026", "20.01.2026", "25.01.2026",
  ];
  return steps.map((label, i) => ({
    nr: i + 1,
    label,
    status: i < doneCount ? "done" : i === doneCount ? "active" : "pending",
    date: i < doneCount ? dates[i] : undefined,
    note: i === doneCount ? "In Bearbeitung" : undefined,
    responsible: responsibles[i],
    dueDate: dueDates[i],
    overdue: i === doneCount && a.status === "fehlende_dokumente",
  }));
}

function getMonatsschritte(): ProcessStep[] {
  const steps = [
    "Regelkontrolle", "Mikroschulung", "Fallbesprechung",
    "Arbeitskontrolle", "Mikroschulung", "Kundenfeedback",
    "SRK-Prüfung Anmeldung",
  ];
  const responsibles = [
    "Sandra Weber", "Sandra Weber", "Team", "Sandra Weber",
    "Sandra Weber", "Patient/Angehörige", "HR-Abteilung",
  ];
  const dueDates = [
    "05.02.2026", "10.02.2026", "15.02.2026", "20.02.2026",
    "25.02.2026", "28.02.2026", "05.03.2026",
  ];
  const dates = ["01.02.2026", "05.02.2026", "10.02.2026"];
  return steps.map((label, i) => ({
    nr: i + 1,
    label,
    status: i < 3 ? "done" : i === 3 ? "active" : "pending",
    date: i < 3 ? dates[i] : undefined,
    note: i === 3 ? "Fällig am 20.02.2026" : undefined,
    responsible: responsibles[i],
    dueDate: dueDates[i],
    overdue: false,
  }));
}

/* ── Tickets mock ────────────────────────── */
interface Ticket {
  id: string;
  subject: string;
  status: "offen" | "in_bearbeitung" | "erledigt";
  priority: "hoch" | "mittel" | "niedrig";
  created: string;
  assignedTo: string;
  category: string;
}

function getTickets(): Ticket[] {
  return [
    { id: "SD-2026-0401", subject: "Bankdaten fehlen — Lohnauszahlung blockiert", status: "offen", priority: "hoch", created: "26.02.2026", assignedTo: "K. Meier", category: "HR" },
    { id: "SD-2026-0395", subject: "SRK-Anmeldung ausstehend", status: "in_bearbeitung", priority: "mittel", created: "22.02.2026", assignedTo: "S. Weber", category: "Ausbildung" },
    { id: "SD-2026-0380", subject: "Krankenkassenkarte nachreichen", status: "erledigt", priority: "niedrig", created: "18.02.2026", assignedTo: "K. Meier", category: "Dokumente" },
  ];
}

/* ── Related Lists mock data ─────────────── */
interface StempelEntry { datum: string; eingang: string; ausgang: string; pause: string; total: string; status: "ok" | "warnung" | "fehlt"; }
const stempelDaten: StempelEntry[] = [
  { datum: "Mo, 24.02.", eingang: "07:30", ausgang: "16:00", pause: "0:30", total: "8:00", status: "ok" },
  { datum: "Di, 25.02.", eingang: "07:45", ausgang: "16:15", pause: "0:30", total: "8:00", status: "ok" },
  { datum: "Mi, 26.02.", eingang: "08:00", ausgang: "—", pause: "—", total: "—", status: "warnung" },
  { datum: "Do, 20.02.", eingang: "—", ausgang: "—", pause: "—", total: "—", status: "fehlt" },
  { datum: "Fr, 21.02.", eingang: "07:30", ausgang: "12:00", pause: "0:00", total: "4:30", status: "ok" },
];

interface SozialversicherungEntry { kategorie: string; status: "aktiv" | "ausstehend" | "abgelaufen"; gueltigBis: string; details: string; }
const sozialversicherungDaten: SozialversicherungEntry[] = [
  { kategorie: "AHV / IV", status: "aktiv", gueltigBis: "—", details: "Beiträge aktuell" },
  { kategorie: "BVG (Pensionskasse)", status: "aktiv", gueltigBis: "31.12.2026", details: "Angemeldet seit 01.01.2026" },
  { kategorie: "UVG (Unfallversicherung)", status: "aktiv", gueltigBis: "31.12.2026", details: "Suva — Police aktiv" },
  { kategorie: "KTG (Krankentaggeld)", status: "ausstehend", gueltigBis: "—", details: "Antrag in Bearbeitung" },
  { kategorie: "Quellensteuer", status: "aktiv", gueltigBis: "—", details: "Tarif gemäss HR-Daten" },
];

/* (SRK Kurs data is now per-angehöriger in AngehoerigerDetail) */

/* ── Historie mock ───────────────────────── */
interface HistoryEntry {
  id: string; date: string; time: string; user: string;
  action: string; detail: string;
  type: "status" | "dokument" | "workflow" | "ticket" | "system" | "hr";
}

function getHistorie(): HistoryEntry[] {
  return [
    { id: "h1", date: "01.03.2026", time: "09:15", user: "K. Meier", action: "Stempelkontrolle durchgeführt", detail: "Februar — 18/22 Tage erfasst", type: "workflow" },
    { id: "h2", date: "28.02.2026", time: "14:30", user: "System", action: "Lohnlauf ausgelöst", detail: "Monatslohn Februar 2026 berechnet", type: "system" },
    { id: "h3", date: "26.02.2026", time: "16:20", user: "K. Meier", action: "Dokument hochgeladen", detail: "Krankenkassenkarte — Scan verifiziert", type: "dokument" },
    { id: "h4", date: "24.02.2026", time: "11:00", user: "S. Weber", action: "Mikroschulung abgeschlossen", detail: "Modul: Grundpflege — bestanden", type: "workflow" },
    { id: "h5", date: "22.02.2026", time: "10:45", user: "K. Meier", action: "Ticket erstellt", detail: "SD-2026-0395: SRK-Anmeldung ausstehend", type: "ticket" },
    { id: "h6", date: "20.02.2026", time: "09:30", user: "S. Weber", action: "Regelkontrolle durchgeführt", detail: "Arbeitszeiterfassung geprüft — OK", type: "workflow" },
    { id: "h7", date: "18.02.2026", time: "14:10", user: "K. Meier", action: "Bankdaten aktualisiert", detail: "IBAN geändert auf neues Konto", type: "hr" },
    { id: "h8", date: "15.02.2026", time: "08:45", user: "System", action: "BVG-Anmeldung bestätigt", detail: "Pensionskasse aktiv ab 01.01.2026", type: "system" },
    { id: "h9", date: "10.02.2026", time: "16:00", user: "S. Weber", action: "Status geändert", detail: "Status → Aktiv", type: "status" },
    { id: "h10", date: "05.02.2026", time: "11:30", user: "K. Meier", action: "Onboarding Schritt abgeschlossen", detail: "Schritt 8: Bankdaten verifiziert", type: "workflow" },
  ];
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function Angehoerige360Page() {
  const { angehoerigerIdOrNew } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ueberblick");

  const a = angehoerige.find((x) => x.id === angehoerigerIdOrNew);

  if (!a) {
    return (
      <div className="px-8 py-16 text-center">
        <h3 className="text-foreground">Angehörige/r nicht gefunden</h3>
        <p className="text-[13px] text-muted-foreground mt-1">
          Die ID «{angehoerigerIdOrNew}» konnte nicht zugeordnet werden.
        </p>
        <button
          onClick={() => navigate("/angehoerige")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-[13px] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Angehörigen-Übersicht
        </button>
      </div>
    );
  }

  const detail = getDetail(a.id);
  const st = statusConfig[a.status];
  const br = billingReadinessConfig[a.billingReadiness];
  const qual = qualifikationConfig[a.qualifikation];
  const tickets = getTickets();

  return (
    <>
      {/* ── Back Navigation ────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-0">
        <button
          onClick={() => navigate("/angehoerige")}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors -ml-1"
          style={{ fontWeight: 450 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Angehörige
        </button>
      </div>

      {/* ── Header ─────────────────────────── */}
      <div className="px-4 md:px-8 pt-4 pb-5">
        <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
            {/* Avatar */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
              <span className="text-[18px] md:text-[20px] text-primary" style={{ fontWeight: 600 }}>
                {a.vorname[0]}{a.nachname[0]}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-foreground">
                  {a.nachname}, {a.vorname}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] ${st.bg} ${st.text}`}
                  style={{ fontWeight: 500 }}
                >
                  <span className={`w-[5px] h-[5px] rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] ${br.bg} ${br.text}`}
                  style={{ fontWeight: 500 }}
                >
                  <span className={`w-[5px] h-[5px] rounded-full ${br.dot}`} />
                  {br.label}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${qual.bg} ${qual.text}`}
                  style={{ fontWeight: 500 }}
                >
                  {qual.label}
                </span>
              </div>

              

              {/* Zugeordnete Patienten */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {a.zugeordnetePatientenList.length > 0 ? (
                  a.zugeordnetePatientenList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/patienten/${p.id}`)}
                      className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      <Users className="w-3 h-3" />
                      {p.name}
                      
                    </button>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] text-warning" style={{ fontWeight: 500 }}>
                    <AlertTriangle className="w-3 h-3" />
                    Kein Patient zugeordnet
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate("/servicedesk")}
                className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Plus className="w-3.5 h-3.5" />
                Ticket erstellen
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors" style={{ fontWeight: 500 }}>
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                Bearbeiten
              </button>
              <button className="p-2 rounded-xl border border-border hover:bg-secondary/60 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────── */}
      <div className="px-4 md:px-8">
        <div className="border-b border-border">
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {profileTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              const ticketCount = t.id === "tickets" ? tickets.filter((tk) => tk.status !== "erledigt").length : 0;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                  style={{ fontWeight: isActive ? 500 : 400 }}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                  {t.label}
                  {t.id === "tickets" && ticketCount > 0 && (
                    <span className="ml-1 text-[10px] px-[5px] py-[1px] rounded-md bg-error-light text-error-foreground" style={{ fontWeight: 600 }}>
                      {ticketCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ────────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-10">
        {activeTab === "ueberblick" && <TabUeberblick a={a} detail={detail} />}
        {activeTab === "workflow" && <TabWorkflow a={a} />}
        {activeTab === "dokumente" && <TabDokumenteAngehoerige a={a} />}
        {activeTab === "related" && <TabRelatedLists a={a} detail={detail} />}
        {activeTab === "tickets" && <TabTickets tickets={tickets} navigate={navigate} />}
        {activeTab === "historie" && <TabHistorie />}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   SECTION COMPONENT (reused)
   ══════════════════════════════════════════ */
function DataField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>
        {label}
      </div>
      <div className={`text-[13px] text-foreground ${mono ? "font-mono" : ""}`} style={{ fontWeight: 400 }}>
        {value || "—"}
      </div>
    </div>
  );
}

/** Editable data field — shows input when editing, plain text otherwise */
function EditableField({
  label, value, editing, onChange, mono, type = "text",
}: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; mono?: boolean; type?: "text" | "date" | "tel" | "email";
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all ${mono ? "font-mono" : ""}`}
          style={{ fontWeight: 400 }}
        />
      ) : (
        <div className={`text-[13px] text-foreground ${mono ? "font-mono" : ""}`} style={{ fontWeight: 400 }}>{value || "—"}</div>
      )}
    </div>
  );
}

function SectionCard({
  title, icon: Icon, editable = false, editing = false, onEdit, onSave, onCancel, children,
}: {
  title: string; icon: React.ElementType; editable?: boolean; editing?: boolean; onEdit?: () => void; onSave?: () => void; onCancel?: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`bg-card rounded-2xl border transition-colors ${editing ? "border-primary/25 shadow-sm" : "border-border"}`}>
      <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h5 className="text-foreground flex-1">{title}</h5>
        {editable && !editing && (
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer" style={{ fontWeight: 450 }}>
            <Pencil className="w-3 h-3" /> Bearbeiten
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <button onClick={onCancel} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer" style={{ fontWeight: 450 }}>
              <X className="w-3 h-3" /> Abbrechen
            </button>
            <button onClick={onSave} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
              <Check className="w-3 h-3" /> Speichern
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ÜBERBLICK
   ══════════════════════════════════════════ */
function TabUeberblick({ a, detail }: { a: Angehoeriger; detail: AngehoerigerDetail }) {
  const st = statusConfig[a.status];
  const br = billingReadinessConfig[a.billingReadiness];
  const uploadedDocs = detail.dokumente.filter((d) => d.status === "hochgeladen").length;
  const totalDocs = detail.dokumente.length;

  /* ── Editing state ── */
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});

  /* ── Personalien fields ── */
  const [vorname, setVorname] = useState(a.vorname);
  const [nachname, setNachname] = useState(a.nachname);
  const [geschlecht, setGeschlecht] = useState(detail.geschlecht);
  const [geburtsdatum, setGeburtsdatum] = useState(detail.geburtsdatum);
  const [ahvNummer, setAhvNummer] = useState(detail.ahvNummer);
  const [nationalitaet, setNationalitaet] = useState(detail.nationalitaet);
  const [heimatort, setHeimatort] = useState(detail.heimatort);
  const [aufenthaltsstatus, setAufenthaltsstatus] = useState(detail.aufenthaltsstatus);
  const [zivilstand, setZivilstand] = useState(detail.zivilstand);
  const [zivilstandSeit, setZivilstandSeit] = useState(detail.zivilstandSeit);
  const [strasse, setStrasse] = useState(detail.strasse);
  const [plz, setPlz] = useState(detail.plz);
  const [ort, setOrt] = useState(detail.ort);
  const [email, setEmail] = useState(detail.email);
  const [telefon, setTelefon] = useState(detail.telefon);
  const [kkName, setKkName] = useState(detail.krankenkasseName);
  const [kkNummer, setKkNummer] = useState(detail.versicherungsnummer);

  /* ── Steuer fields ── */
  const [quellensteuer, setQuellensteuer] = useState(detail.quellensteuer);
  const [konfession, setKonfession] = useState(detail.konfession);
  const [qsTarif, setQsTarif] = useState(detail.quellensteuerTarif);
  const [steuergemeinde, setSteuergemeinde] = useState(detail.steuergemeinde);
  const [sozialamtInvolviert, setSozialamtInvolviert] = useState(detail.sozialamtInvolviert);
  const [sozialamtKontakt, setSozialamtKontakt] = useState(detail.sozialamtKontakt);
  const [lohnabtretung, setLohnabtretung] = useState(detail.lohnabtretung);

  /* ── Partner fields ── */
  const [partnerName, setPartnerName] = useState(detail.partnerName);
  const [partnerGeb, setPartnerGeb] = useState(detail.partnerGeburtsdatum);
  const [partnerAhv, setPartnerAhv] = useState(detail.partnerAhvNummer);
  const [partnerZemis, setPartnerZemis] = useState(detail.partnerZemisNummer);
  const [partnerAufenthalt, setPartnerAufenthalt] = useState(detail.partnerAufenthaltsstatus);

  /* ── Kinder fields ── */
  const [kinderList, setKinderList] = useState(detail.kinder.map((k, i) => ({ ...k, id: i })));
  const [kinderZulagenSpitex, setKinderZulagenSpitex] = useState(detail.kinderzulagenUeberSpitex);
  const [familienAk, setFamilienAk] = useState(detail.familienausgleichskasse);

  /* ── Anstellung fields ── */
  const [funktion, setFunktion] = useState(detail.funktion);
  const [eintrittsdatum, setEintrittsdatum] = useState(detail.eintrittsdatum);
  const [stundenlohn, setStundenlohn] = useState(detail.stundenlohn);
  const [bankname, setBankname] = useState(detail.bankname);
  const [iban, setIban] = useState(detail.iban);

  /* ── AHV masking ── */
  const [revealedAhv, setRevealedAhv] = useState(false);
  const [revealedPartnerAhv, setRevealedPartnerAhv] = useState(false);
  const [revealedKinderAhv, setRevealedKinderAhv] = useState<Record<number, boolean>>({});
  const maskAhv = (v: string) => {
    if (!v || v === "—") return "—";
    const parts = v.split(".");
    if (parts.length < 4) return v;
    return `${parts[0]}.●●●●.●●●●.${parts[parts.length - 1]}`;
  };

  const startEdit = (section: string) => {
    if (section === "personalien") {
      setSnapshot({ vorname, nachname, geschlecht, geburtsdatum, ahvNummer, nationalitaet, heimatort, aufenthaltsstatus, zivilstand, zivilstandSeit, strasse, plz, ort, email, telefon, kkName, kkNummer });
    } else if (section === "steuer") {
      setSnapshot({ quellensteuer, konfession, qsTarif, steuergemeinde, sozialamtInvolviert, sozialamtKontakt, lohnabtretung });
    } else if (section === "partner") {
      setSnapshot({ partnerName, partnerGeb, partnerAhv, partnerZemis, partnerAufenthalt });
    } else if (section === "kinder") {
      setSnapshot({ kinderZulagenSpitex, familienAk, _kinder: JSON.stringify(kinderList) });
    } else if (section === "anstellung") {
      setSnapshot({ funktion, eintrittsdatum, stundenlohn, bankname, iban });
    }
    setEditingSection(section);
  };

  const cancelEdit = (section: string) => {
    if (section === "personalien") {
      setVorname(snapshot.vorname ?? vorname); setNachname(snapshot.nachname ?? nachname);
      setGeschlecht(snapshot.geschlecht ?? geschlecht); setGeburtsdatum(snapshot.geburtsdatum ?? geburtsdatum);
      setAhvNummer(snapshot.ahvNummer ?? ahvNummer); setNationalitaet(snapshot.nationalitaet ?? nationalitaet);
      setHeimatort(snapshot.heimatort ?? heimatort); setAufenthaltsstatus(snapshot.aufenthaltsstatus ?? aufenthaltsstatus);
      setZivilstand(snapshot.zivilstand ?? zivilstand); setZivilstandSeit(snapshot.zivilstandSeit ?? zivilstandSeit);
      setStrasse(snapshot.strasse ?? strasse); setPlz(snapshot.plz ?? plz); setOrt(snapshot.ort ?? ort);
      setEmail(snapshot.email ?? email); setTelefon(snapshot.telefon ?? telefon);
      setKkName(snapshot.kkName ?? kkName); setKkNummer(snapshot.kkNummer ?? kkNummer);
    } else if (section === "steuer") {
      setQuellensteuer(snapshot.quellensteuer ?? quellensteuer); setKonfession(snapshot.konfession ?? konfession);
      setQsTarif(snapshot.qsTarif ?? qsTarif); setSteuergemeinde(snapshot.steuergemeinde ?? steuergemeinde);
      setSozialamtInvolviert(snapshot.sozialamtInvolviert ?? sozialamtInvolviert);
      setSozialamtKontakt(snapshot.sozialamtKontakt ?? sozialamtKontakt); setLohnabtretung(snapshot.lohnabtretung ?? lohnabtretung);
    } else if (section === "partner") {
      setPartnerName(snapshot.partnerName ?? partnerName); setPartnerGeb(snapshot.partnerGeb ?? partnerGeb);
      setPartnerAhv(snapshot.partnerAhv ?? partnerAhv); setPartnerZemis(snapshot.partnerZemis ?? partnerZemis);
      setPartnerAufenthalt(snapshot.partnerAufenthalt ?? partnerAufenthalt);
    } else if (section === "kinder") {
      setKinderZulagenSpitex(snapshot.kinderZulagenSpitex ?? kinderZulagenSpitex);
      setFamilienAk(snapshot.familienAk ?? familienAk);
      if (snapshot._kinder) setKinderList(JSON.parse(snapshot._kinder));
    } else if (section === "anstellung") {
      setFunktion(snapshot.funktion ?? funktion); setEintrittsdatum(snapshot.eintrittsdatum ?? eintrittsdatum);
      setStundenlohn(snapshot.stundenlohn ?? stundenlohn); setBankname(snapshot.bankname ?? bankname);
      setIban(snapshot.iban ?? iban);
    }
    setEditingSection(null);
  };

  const saveEdit = () => { setEditingSection(null); };
  const isEd = (s: string) => editingSection === s;
  const inputClass = "w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all";

  /* Kinder helpers */
  const addKind = () => {
    const newId = kinderList.length > 0 ? Math.max(...kinderList.map(k => k.id)) + 1 : 0;
    setKinderList([...kinderList, { id: newId, nachname: "", vorname: "", geburtsdatum: "", ahvNummer: "", geschlecht: "", zulagenart: "K", ausbildungsbeginn: "" }]);
  };
  const removeKind = (id: number) => setKinderList(kinderList.filter(k => k.id !== id));
  const updateKind = (id: number, field: string, value: string) => setKinderList(kinderList.map(k => k.id === id ? { ...k, [field]: value } : k));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        {/* Quick status cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <Activity className="w-3 h-3" /> Status
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${st.bg} ${st.text}`} style={{ fontWeight: 500 }}>
              <span className={`w-[5px] h-[5px] rounded-full ${st.dot}`} />
              {st.label}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <CheckCircle2 className="w-3 h-3" /> Abrechenbarkeit
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${br.bg} ${br.text}`} style={{ fontWeight: 500 }}>
              <span className={`w-[5px] h-[5px] rounded-full ${br.dot}`} />
              {br.label}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <Stamp className="w-3 h-3" /> Stempeltage
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[14px] ${a.stempelTage / a.stempelSoll < 0.5 ? "text-error" : a.stempelTage / a.stempelSoll < 0.8 ? "text-warning" : "text-foreground"}`} style={{ fontWeight: 600 }}>
                {a.stempelTage}/{a.stempelSoll}
              </span>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <FileText className="w-3 h-3" /> Dokumente
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[14px] ${uploadedDocs < totalDocs ? "text-warning" : "text-foreground"}`} style={{ fontWeight: 600 }}>
                {uploadedDocs}/{totalDocs}
              </span>
              <span className="text-[11px] text-muted-foreground">hochgeladen</span>
            </div>
          </div>
        </div>

        {/* HR Problems Banner */}
        {(a.status === "fehlende_dokumente" || !a.hrCheck.bankdaten || !a.hrCheck.kinderzulagen || !a.hrCheck.quellensteuerTarif) && (
          <div className="rounded-2xl border border-error/20 bg-error-light/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <h5 className="text-foreground">Offene HR-Punkte</h5>
            </div>
            <ul className="space-y-1 text-[12px] text-error-foreground">
              {!a.hrCheck.bankdaten && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-error" /> Bankdaten nicht hinterlegt</li>}
              {!a.hrCheck.kinderzulagen && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-error" /> Kinderzulagen nicht geklärt</li>}
              {!a.hrCheck.quellensteuerTarif && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-error" /> Quellensteuer-Tarif fehlt</li>}
              {a.status === "fehlende_dokumente" && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-error" /> Pflichtdokumente unvollständig</li>}
            </ul>
          </div>
        )}

        {/* 1. Personalien */}
        <SectionCard title="Personalien" icon={User} editable editing={isEd("personalien")} onEdit={() => startEdit("personalien")} onSave={saveEdit} onCancel={() => cancelEdit("personalien")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <EditableField label="Vorname" value={vorname} editing={isEd("personalien")} onChange={setVorname} />
            <EditableField label="Nachname" value={nachname} editing={isEd("personalien")} onChange={setNachname} />
            <EditableField label="Geschlecht" value={geschlecht} editing={isEd("personalien")} onChange={setGeschlecht} />
            <EditableField label="Geburtsdatum" value={geburtsdatum} editing={isEd("personalien")} onChange={setGeburtsdatum} />
            {isEd("personalien") ? (
              <EditableField label="AHV-Nummer" value={ahvNummer} editing mono onChange={setAhvNummer} />
            ) : (
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>AHV-Nummer</div>
                <div className="flex items-center gap-1">
                  <span className="text-[13px] text-foreground font-mono">{revealedAhv ? ahvNummer : maskAhv(ahvNummer)}</span>
                  {ahvNummer && ahvNummer !== "—" && (
                    <button type="button" onClick={() => setRevealedAhv(!revealedAhv)} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {revealedAhv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            )}
            <EditableField label="Nationalität" value={nationalitaet} editing={isEd("personalien")} onChange={setNationalitaet} />
            <EditableField label="Heimatort" value={heimatort} editing={isEd("personalien")} onChange={setHeimatort} />
            <EditableField label="Aufenthaltsstatus" value={aufenthaltsstatus} editing={isEd("personalien")} onChange={setAufenthaltsstatus} />
            <EditableField label="Zivilstand" value={zivilstand} editing={isEd("personalien")} onChange={setZivilstand} />
            <EditableField label="Zivilstand seit" value={zivilstandSeit} editing={isEd("personalien")} onChange={setZivilstandSeit} />
          </div>
          <div className="mt-5 pt-4 border-t border-border-light">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Kontaktdaten</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isEd("personalien") ? (
                <>
                  <EditableField label="Strasse" value={strasse} editing onChange={setStrasse} />
                  <EditableField label="PLZ" value={plz} editing onChange={setPlz} />
                  <EditableField label="Ort" value={ort} editing onChange={setOrt} />
                  <EditableField label="E-Mail" value={email} editing type="email" onChange={setEmail} />
                  <EditableField label="Telefon" value={telefon} editing type="tel" onChange={setTelefon} />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Adresse</div>
                      <div className="text-[13px] text-foreground">{strasse}, {plz} {ort}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>E-Mail</div>
                      <div className="text-[13px] text-primary">{email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Telefon</div>
                      <div className="text-[13px] text-primary">{telefon}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-border-light">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Krankenkasse</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditableField label="Krankenkasse" value={kkName} editing={isEd("personalien")} onChange={setKkName} />
              <EditableField label="Versicherungsnummer" value={kkNummer} editing={isEd("personalien")} onChange={setKkNummer} mono />
            </div>
          </div>
        </SectionCard>

        {/* 2. Steuer & Sozialversicherung */}
        <SectionCard title="Steuer & Sozialversicherung" icon={Receipt} editable editing={isEd("steuer")} onEdit={() => startEdit("steuer")} onSave={saveEdit} onCancel={() => cancelEdit("steuer")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <EditableField label="Quellensteuer-pflichtig" value={quellensteuer} editing={isEd("steuer")} onChange={setQuellensteuer} />
            <EditableField label="Konfession" value={konfession} editing={isEd("steuer")} onChange={setKonfession} />
            <EditableField label="Quellensteuer-Tarif" value={qsTarif} editing={isEd("steuer")} onChange={setQsTarif} />
            <EditableField label="Steuergemeinde" value={steuergemeinde} editing={isEd("steuer")} onChange={setSteuergemeinde} />
            <EditableField label="Sozialamt involviert" value={sozialamtInvolviert} editing={isEd("steuer")} onChange={setSozialamtInvolviert} />
            {sozialamtInvolviert === "Ja" && (
              <EditableField label="Kontakt Sozialamt" value={sozialamtKontakt} editing={isEd("steuer")} onChange={setSozialamtKontakt} />
            )}
            <EditableField label="Lohnabtretung" value={lohnabtretung} editing={isEd("steuer")} onChange={setLohnabtretung} />
          </div>
        </SectionCard>

        {/* 3. Partner */}
        {zivilstand === "Verheiratet" && (
          <SectionCard title="Partner" icon={Heart} editable editing={isEd("partner")} onEdit={() => startEdit("partner")} onSave={saveEdit} onCancel={() => cancelEdit("partner")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField label="Name" value={partnerName} editing={isEd("partner")} onChange={setPartnerName} />
              <EditableField label="Geburtsdatum" value={partnerGeb} editing={isEd("partner")} onChange={setPartnerGeb} />
              {isEd("partner") ? (
                <EditableField label="AHV-Nummer" value={partnerAhv} editing mono onChange={setPartnerAhv} />
              ) : (
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>AHV-Nummer</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-foreground font-mono">{revealedPartnerAhv ? partnerAhv : maskAhv(partnerAhv)}</span>
                    {partnerAhv && partnerAhv !== "—" && (
                      <button type="button" onClick={() => setRevealedPartnerAhv(!revealedPartnerAhv)} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        {revealedPartnerAhv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <EditableField label="ZEMIS-Nummer" value={partnerZemis} editing={isEd("partner")} onChange={setPartnerZemis} mono />
              <EditableField label="Aufenthaltsstatus" value={partnerAufenthalt} editing={isEd("partner")} onChange={setPartnerAufenthalt} />
            </div>
          </SectionCard>
        )}

        {/* 4. Kinder & Zulagen */}
        <SectionCard title="Kinder & Zulagen" icon={Baby} editable editing={isEd("kinder")} onEdit={() => startEdit("kinder")} onSave={saveEdit} onCancel={() => cancelEdit("kinder")}>
          {kinderList.length > 0 || isEd("kinder") ? (
            <>
              {kinderList.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30">
                        {["Name", "Geburtsdatum", "AHV-Nummer", "Zulagenart", "Ausbildungsbeginn", ...(isEd("kinder") ? [""] : [])].map((col, ci) => (
                          <th key={ci} className="px-3 py-2 text-left">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kinderList.map((k, idx) => (
                        <tr key={k.id} className="border-t border-border-light">
                          <td className="px-3 py-2.5">
                            {isEd("kinder") ? (
                              <div className="flex gap-1">
                                <input type="text" value={k.vorname} onChange={e => updateKind(k.id, "vorname", e.target.value)} placeholder="Vorname" className={inputClass + " !py-1.5 !text-[12px]"} style={{ maxWidth: 90 }} />
                                <input type="text" value={k.nachname} onChange={e => updateKind(k.id, "nachname", e.target.value)} placeholder="Nachname" className={inputClass + " !py-1.5 !text-[12px]"} style={{ maxWidth: 90 }} />
                              </div>
                            ) : (
                              <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{k.vorname} {k.nachname}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isEd("kinder") ? (
                              <input type="text" value={k.geburtsdatum} onChange={e => updateKind(k.id, "geburtsdatum", e.target.value)} placeholder="TT.MM.JJJJ" className={inputClass + " !py-1.5 !text-[12px]"} />
                            ) : (
                              <span className="text-[13px] text-foreground">{k.geburtsdatum}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isEd("kinder") ? (
                              <input type="text" value={k.ahvNummer} onChange={e => updateKind(k.id, "ahvNummer", e.target.value)} placeholder="756.XXXX.XXXX.XX" className={inputClass + " !py-1.5 !text-[12px]"} />
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-[13px] text-foreground font-mono">{revealedKinderAhv[idx] ? k.ahvNummer : maskAhv(k.ahvNummer)}</span>
                                {k.ahvNummer && k.ahvNummer !== "—" && (
                                  <button type="button" onClick={() => setRevealedKinderAhv(prev => ({ ...prev, [idx]: !prev[idx] }))} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                    {revealedKinderAhv[idx] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isEd("kinder") ? (
                              <select value={k.zulagenart} onChange={e => updateKind(k.id, "zulagenart", e.target.value)} className={inputClass + " !py-1.5 !text-[12px]"}>
                                <option value="K">Kinderzulage</option>
                                <option value="W">Ausbildungszulage</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${k.zulagenart === "K" ? "bg-info-light text-info-foreground" : "bg-warning-light text-warning-foreground"}`} style={{ fontWeight: 500 }}>
                                {k.zulagenart === "K" ? "Kinderzulage" : "Ausbildungszulage"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isEd("kinder") ? (
                              <input type="text" value={k.ausbildungsbeginn} onChange={e => updateKind(k.id, "ausbildungsbeginn", e.target.value)} placeholder="TT.MM.JJJJ" className={inputClass + " !py-1.5 !text-[12px]"} />
                            ) : (
                              <span className="text-[13px] text-muted-foreground">{k.ausbildungsbeginn || "—"}</span>
                            )}
                          </td>
                          {isEd("kinder") && (
                            <td className="px-3 py-2.5">
                              <button onClick={() => removeKind(k.id)} className="p-1 rounded text-muted-foreground hover:text-error hover:bg-error-light transition-colors cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isEd("kinder") && (
                <button onClick={addKind} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-primary hover:bg-primary-light transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                  <Plus className="w-3.5 h-3.5" /> Kind hinzufügen
                </button>
              )}
              <div className="mt-4 pt-3 border-t border-border-light grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditableField label="Kinderzulagen über Spitex" value={kinderZulagenSpitex} editing={isEd("kinder")} onChange={setKinderZulagenSpitex} />
                <EditableField label="Familienausgleichskasse" value={familienAk} editing={isEd("kinder")} onChange={setFamilienAk} />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">Keine Kinder erfasst.</p>
          )}
        </SectionCard>

        {/* 5. Anstellung & Auszahlung */}
        <SectionCard title="Anstellung & Auszahlung" icon={Briefcase} editable editing={isEd("anstellung")} onEdit={() => startEdit("anstellung")} onSave={saveEdit} onCancel={() => cancelEdit("anstellung")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <EditableField label="Funktion" value={funktion} editing={isEd("anstellung")} onChange={setFunktion} />
            <EditableField label="Eintrittsdatum" value={eintrittsdatum} editing={isEd("anstellung")} onChange={setEintrittsdatum} />
            <EditableField label="Stundenlohn" value={isEd("anstellung") ? stundenlohn : (stundenlohn ? `CHF ${stundenlohn}` : "—")} editing={isEd("anstellung")} onChange={setStundenlohn} />
          </div>
          <div className="mt-5 pt-4 border-t border-border-light">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Bankverbindung</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEd("anstellung") ? (
                <>
                  <EditableField label="Bankname" value={bankname} editing onChange={setBankname} />
                  <EditableField label="IBAN" value={iban} editing mono onChange={setIban} />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Bankname</div>
                      <div className="text-[13px] text-foreground">{bankname || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>IBAN</div>
                      <div className="text-[13px] text-foreground font-mono">{iban || "—"}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Stempel-Fortschritt */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stamp className="w-4 h-4 text-primary" />
            <h5 className="text-foreground">Stempelkontrolle</h5>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${a.stempelTage / a.stempelSoll >= 0.8 ? "bg-success" : a.stempelTage / a.stempelSoll >= 0.5 ? "bg-warning" : "bg-error"}`}
                style={{ width: `${Math.min(100, (a.stempelTage / a.stempelSoll) * 100)}%` }}
              />
            </div>
            <span className="text-[12px] text-foreground tabular-nums" style={{ fontWeight: 600 }}>
              {a.stempelTage}/{a.stempelSoll}
            </span>
          </div>
          {a.stempelWarnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {a.stempelWarnings.map((w, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-warning" style={{ fontWeight: 500 }}>
                  <AlertTriangle className="w-3 h-3" /> {w.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HR-Check */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h5 className="text-foreground mb-3">HR-Check</h5>
          <div className="space-y-2">
            {[
              { label: "Bankdaten", ok: a.hrCheck.bankdaten },
              { label: "Kinderzulagen", ok: a.hrCheck.kinderzulagen },
              { label: "Quellensteuer-Tarif", ok: !!a.hrCheck.quellensteuerTarif },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">{item.label}</span>
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-error" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zugeordnete Patienten */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h5 className="text-foreground mb-3">Zugeordnete Patienten</h5>
          {a.zugeordnetePatientenList.length > 0 ? (
            <div className="space-y-2">
              {a.zugeordnetePatientenList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => window.location.href = `/patienten/${p.id}`}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-primary" style={{ fontWeight: 600 }}>
                      {p.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-foreground group-hover:text-primary transition-colors" style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{p.id}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">Keine Patienten zugeordnet.</p>
          )}
        </div>

        {/* Quick Links */}
        

        {/* Letzte Mutation */}
        
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: WORKFLOW / ACTION PLAN
   ══════════════════════════════════════════ */
function TabWorkflow({ a }: { a: Angehoeriger }) {
  const onboardingProzess = getOnboardingProzess(a);
  const monatsschritte = getMonatsschritte();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const toggleTask = (key: string) => {
    setExpandedTask(expandedTask === key ? null : key);
  };

  const doneCountO = onboardingProzess.filter((s) => s.status === "done").length;
  const doneCountM = monatsschritte.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Onboarding Prozess */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <ListChecks className="w-[18px] h-[18px] text-primary" />
              </div>
              <div>
                <h5 className="text-foreground">Onboarding Prozess</h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {doneCountO} von {onboardingProzess.length} Schritten abgeschlossen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(doneCountO / onboardingProzess.length) * 100}%` }} />
              </div>
              <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>
                {Math.round((doneCountO / onboardingProzess.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="space-y-1">
            {onboardingProzess.map((step) => {
              const key = `o-${step.nr}`;
              const isExpanded = expandedTask === key;
              return (
                <button
                  key={key}
                  onClick={() => toggleTask(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isExpanded ? "bg-primary-light" : step.overdue ? "bg-error-light/40" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="shrink-0">
                    {step.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : step.status === "active" ? (
                      <div className={`w-5 h-5 rounded-full border-2 ${step.overdue ? "border-error bg-error-light" : "border-primary bg-primary-light"} flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-full ${step.overdue ? "bg-error" : "bg-primary"}`} />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>{step.nr}.</span>
                      <span
                        className={`text-[13px] ${
                          step.status === "done" ? "text-muted-foreground line-through" :
                          step.status === "active" ? (step.overdue ? "text-error-foreground" : "text-primary") : "text-foreground"
                        }`}
                        style={{ fontWeight: step.status === "active" ? 500 : 400 }}
                      >
                        {step.label}
                      </span>
                      {step.status === "active" && step.overdue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-error/10 text-error-foreground" style={{ fontWeight: 500 }}>Überfällig</span>
                      )}
                      {step.status === "active" && !step.overdue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontWeight: 500 }}>Aktuell</span>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5 pl-5">
                        {step.date && <p>Abgeschlossen: {step.date}</p>}
                        {step.note && <p>{step.note}</p>}
                        {step.responsible && <p>Verantwortlich: {step.responsible}</p>}
                        {step.dueDate && <p>Fällig: {step.dueDate}</p>}
                        {step.status === "pending" && <p>Noch nicht gestartet</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {step.responsible && <span className="text-[10px] text-muted-foreground hidden lg:inline">{step.responsible}</span>}
                    {step.date && <span className="text-[11px] text-muted-foreground hidden sm:inline">{step.date}</span>}
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monatliche Schritte */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning-light flex items-center justify-center shrink-0">
                <CalendarDays className="w-[18px] h-[18px] text-warning" />
              </div>
              <div>
                <h5 className="text-foreground">Monatliche Schritte</h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">{doneCountM} von {monatsschritte.length} Schritten abgeschlossen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${(doneCountM / monatsschritte.length) * 100}%` }} />
              </div>
              <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>{Math.round((doneCountM / monatsschritte.length) * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="space-y-1">
            {monatsschritte.map((step) => {
              const key = `m-${step.nr}`;
              const isExpanded = expandedTask === key;
              return (
                <button
                  key={key}
                  onClick={() => toggleTask(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isExpanded ? "bg-warning-light" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="shrink-0">
                    {step.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : step.status === "active" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-warning bg-warning-light flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>{step.nr}.</span>
                      <span
                        className={`text-[13px] ${
                          step.status === "done" ? "text-muted-foreground line-through" :
                          step.status === "active" ? "text-warning-foreground" : "text-foreground"
                        }`}
                        style={{ fontWeight: step.status === "active" ? 500 : 400 }}
                      >
                        {step.label}
                      </span>
                      {step.status === "active" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-warning/10 text-warning-foreground" style={{ fontWeight: 500 }}>Aktuell</span>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5 pl-5">
                        {step.date && <p>Abgeschlossen: {step.date}</p>}
                        {step.note && <p>{step.note}</p>}
                        {step.responsible && <p>Verantwortlich: {step.responsible}</p>}
                        {step.dueDate && <p>Fällig: {step.dueDate}</p>}
                        {step.status === "pending" && <p>Noch nicht gestartet</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {step.date && <span className="text-[11px] text-muted-foreground hidden sm:inline">{step.date}</span>}
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANGEHÖRIGE FOLDER STRUCTURE
   ══════════════════════════════════════════ */
function getAngehoerigeFolders(): DocFolder[] {
  return [
    {
      id: "personalien",
      label: "Personalien",
      files: [
        { id: "ap01", name: "ID_Kopie.pdf", type: "PDF", version: "1.0", uploadedAt: "02.01.2026", uploadedBy: "System" },
        { id: "ap02", name: "AHV_Bestaetigung.pdf", type: "PDF", version: "1.0", uploadedAt: "02.01.2026", uploadedBy: "K. Meier" },
        { id: "ap03", name: "Foto_Angehoeriger.jpg", type: "JPG", version: "1.0", uploadedAt: "03.01.2026", uploadedBy: "K. Meier" },
        { id: "ap04", name: "Aufenthaltsbewilligung.pdf", type: "PDF", version: "1.0", uploadedAt: "05.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "sozialversicherungen",
      label: "Sozialversicherungen",
      files: [
        { id: "as01", name: "BVG_Anmeldung.pdf", type: "PDF", version: "1.0", uploadedAt: "10.01.2026", uploadedBy: "HR-Abteilung" },
        { id: "as02", name: "UVG_Police.pdf", type: "PDF", version: "1.0", uploadedAt: "10.01.2026", uploadedBy: "HR-Abteilung" },
        { id: "as03", name: "Quellensteuer_Verfuegung.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "vertraege",
      label: "Verträge",
      children: [
        {
          id: "vertraege_aktuell",
          label: "Aktuell",
          files: [
            { id: "av01", name: "Arbeitsvertrag_2026.pdf", type: "PDF", version: "1.0", uploadedAt: "01.01.2026", uploadedBy: "S. Weber" },
            { id: "av02", name: "Datenschutzerklaerung.pdf", type: "PDF", version: "1.0", uploadedAt: "01.01.2026", uploadedBy: "System" },
            { id: "av03", name: "Geheimhaltungsvereinbarung.pdf", type: "PDF", version: "1.0", uploadedAt: "01.01.2026", uploadedBy: "System" },
          ],
        },
        {
          id: "vertraege_archiv",
          label: "Archiv",
          files: [],
        },
      ],
      files: [],
    },
    {
      id: "kinderzulagen",
      label: "Kinderzulagen",
      files: [
        { id: "ak01", name: "Familienbuchlein.pdf", type: "PDF", version: "1.0", uploadedAt: "05.01.2026", uploadedBy: "K. Meier" },
        { id: "ak02", name: "Kinderzulage_Antrag.pdf", type: "PDF", version: "1.0", uploadedAt: "08.01.2026", uploadedBy: "K. Meier" },
        { id: "ak03", name: "FAK_Bestätigung.pdf", type: "PDF", version: "1.0", uploadedAt: "15.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "bankdaten",
      label: "Bankdaten",
      files: [
        { id: "ab01", name: "Bankkarte_Scan.jpg", type: "JPG", version: "1.0", uploadedAt: "03.01.2026", uploadedBy: "K. Meier" },
        { id: "ab02", name: "IBAN_Bestaetigung.pdf", type: "PDF", version: "1.0", uploadedAt: "10.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "partner",
      label: "Partner",
      files: [
        { id: "apt01", name: "Partner_Krankenkassenkarte.jpg", type: "JPG", version: "1.0", uploadedAt: "05.01.2026", uploadedBy: "K. Meier" },
        { id: "apt02", name: "Partner_Ausweis.pdf", type: "PDF", version: "1.0", uploadedAt: "05.01.2026", uploadedBy: "K. Meier" },
      ],
    },
    {
      id: "schulungen",
      label: "Schulungen & SRK",
      children: [
        {
          id: "schulungen_zertifikate",
          label: "Zertifikate",
          files: [
            { id: "az01", name: "SRK_Basismodul_Zertifikat.pdf", type: "PDF", version: "1.0", uploadedAt: "15.01.2026", uploadedBy: "S. Weber" },
            { id: "az02", name: "Medlink_Schulung_Nachweis.pdf", type: "PDF", version: "1.0", uploadedAt: "20.01.2026", uploadedBy: "System" },
          ],
        },
        {
          id: "schulungen_anmeldungen",
          label: "Anmeldungen",
          files: [
            { id: "az03", name: "SRK_Aufbaumodul_Anmeldung.pdf", type: "PDF", version: "1.0", uploadedAt: "28.02.2026", uploadedBy: "K. Meier" },
          ],
        },
      ],
      files: [],
    },
    {
      id: "lohnabrechnungen",
      label: "Lohnabrechnungen",
      files: [
        { id: "al01", name: "Lohnabrechnung_Jan_2026.pdf", type: "PDF", version: "1.0", uploadedAt: "31.01.2026", uploadedBy: "System" },
        { id: "al02", name: "Lohnabrechnung_Feb_2026.pdf", type: "PDF", version: "1.0", uploadedAt: "28.02.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "sonstige",
      label: "Sonstige Dokumente",
      files: [
        { id: "asd01", name: "Krankenkassenkarte.jpg", type: "JPG", version: "1.0", uploadedAt: "02.01.2026", uploadedBy: "K. Meier" },
        { id: "asd02", name: "Notfallkontakt_Info.docx", type: "DOCX", version: "1.0", uploadedAt: "15.02.2026", uploadedBy: "K. Meier" },
      ],
    },
  ];
}

/* ══════════════════════════════════════════
   TAB: DOKUMENTE (uses shared component)
   ══════════════════════════════════════════ */
function TabDokumenteAngehoerige({ a }: { a: Angehoeriger }) {
  const folders = getAngehoerigeFolders();
  return (
    <TabDokumenteGeneric
      rootLabel={`${a.nachname}_${a.vorname}`}
      folders={folders}
    />
  );
}

/* ══════════════════════════════════════════
   TAB: RELATED LISTS
   ══════════════════════════════════════════ */
function TabRelatedLists({ a, detail }: { a: Angehoeriger; detail: AngehoerigerDetail }) {
  const [activeList, setActiveList] = useState("stempel");
  const lists = [
    { id: "stempel", label: "Stempelkontrolle & Absenzen", icon: Stamp },
    { id: "sozial", label: "Sozialversicherung & HR", icon: Shield },
    { id: "qualifikation", label: "SRK Kurs", icon: Award },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {lists.map((l) => {
          const Icon = l.icon;
          const isActive = activeList === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setActiveList(l.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] border whitespace-nowrap transition-all ${
                isActive ? "border-primary/20 bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
              }`}
              style={{ fontWeight: isActive ? 500 : 400 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {l.label}
            </button>
          );
        })}
      </div>

      {activeList === "stempel" && <TableStempel />}
      {activeList === "sozial" && <TableSozial detail={detail} />}
      {activeList === "qualifikation" && <TableQualifikation detail={detail} />}
    </div>
  );
}

function TableStempel() {
  const [hatAbsenzen, setHatAbsenzen] = useState(false);
  const [absenzForm, setAbsenzForm] = useState({ zeitraum: "", tage: "", typ: "Krankheit", bemerkung: "" });

  interface Absenz { id: number; zeitraum: string; tage: string; typ: string; bemerkung: string; }
  const [absenzen, setAbsenzen] = useState<Absenz[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);

  const canSave = absenzForm.zeitraum.trim() !== "" && absenzForm.tage.trim() !== "";
  const isEditing = editingId !== null;

  const handleAddAbsenz = () => {
    if (!canSave) return;
    if (isEditing) {
      setAbsenzen((prev) => prev.map((a) => a.id === editingId ? { ...absenzForm, id: editingId } : a));
      setEditingId(null);
    } else {
      setAbsenzen((prev) => [...prev, { ...absenzForm, id: nextId }]);
      setNextId((n) => n + 1);
    }
    setAbsenzForm({ zeitraum: "", tage: "", typ: "Krankheit", bemerkung: "" });
  };

  const handleEditAbsenz = (a: Absenz) => {
    setEditingId(a.id);
    setAbsenzForm({ zeitraum: a.zeitraum, tage: a.tage, typ: a.typ, bemerkung: a.bemerkung });
    setHatAbsenzen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAbsenzForm({ zeitraum: "", tage: "", typ: "Krankheit", bemerkung: "" });
  };

  const handleDeleteAbsenz = (id: number) => {
    setAbsenzen((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length === 0) setHatAbsenzen(false);
      return next;
    });
    if (editingId === id) handleCancelEdit();
  };

  /* ── Bewilligte Leistungen with versioning ── */
  interface Bewilligung {
    id: number;
    taeglicheMin: number;
    tageProWoche: number;
    minutenA: number;
    minutenB: number;
    gueltigAb: string;
    gueltigBis: string;
    status: "aktiv" | "abgelaufen";
  }

  const [bewilligungen, setBewilligungen] = useState<Bewilligung[]>([
    {
      id: 3,
      taeglicheMin: 120,
      tageProWoche: 5,
      minutenA: 90,
      minutenB: 30,
      gueltigAb: "01.01.2026",
      gueltigBis: "–",
      status: "aktiv",
    },
    {
      id: 2,
      taeglicheMin: 90,
      tageProWoche: 5,
      minutenA: 60,
      minutenB: 30,
      gueltigAb: "01.07.2025",
      gueltigBis: "31.12.2025",
      status: "abgelaufen",
    },
    {
      id: 1,
      taeglicheMin: 60,
      tageProWoche: 3,
      minutenA: 40,
      minutenB: 20,
      gueltigAb: "15.01.2025",
      gueltigBis: "30.06.2025",
      status: "abgelaufen",
    },
  ]);

  const [showNewBewForm, setShowNewBewForm] = useState(false);
  const [bewNextId, setBewNextId] = useState(4);
  const emptyBewForm = { taeglicheMin: "", tageProWoche: "", minutenA: "", minutenB: "", gueltigAb: "", gueltigBis: "" };
  const [bewForm, setBewForm] = useState(emptyBewForm);

  const aktive = bewilligungen.find((b) => b.status === "aktiv");
  const historie = bewilligungen.filter((b) => b.status === "abgelaufen").sort((a, b) => b.id - a.id);

  const canSaveBew = bewForm.taeglicheMin !== "" && bewForm.tageProWoche !== "" && bewForm.minutenA !== "" && bewForm.minutenB !== "" && bewForm.gueltigAb.trim() !== "";

  const handleSaveBew = () => {
    if (!canSaveBew) return;
    const closedDate = bewForm.gueltigAb.trim();
    setBewilligungen((prev) =>
      [
        {
          id: bewNextId,
          taeglicheMin: Number(bewForm.taeglicheMin),
          tageProWoche: Number(bewForm.tageProWoche),
          minutenA: Number(bewForm.minutenA),
          minutenB: Number(bewForm.minutenB),
          gueltigAb: closedDate,
          gueltigBis: bewForm.gueltigBis.trim() || "–",
          status: "aktiv" as const,
        },
        ...prev.map((b) =>
          b.status === "aktiv"
            ? { ...b, status: "abgelaufen" as const, gueltigBis: `bis ${closedDate}` }
            : b
        ),
      ]
    );
    setBewNextId((n) => n + 1);
    setBewForm(emptyBewForm);
    setShowNewBewForm(false);
  };

  const handleCancelBew = () => {
    setBewForm(emptyBewForm);
    setShowNewBewForm(false);
  };

  const inputCls = "w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50";

  return (
    <div className="space-y-4">

      {/* ═══ SECTION 1: Aktive Bewilligung ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-primary" />
            <h5 className="text-foreground">Aktive Bewilligung</h5>
          </div>
          {aktive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-success/10 text-success border border-success/15" style={{ fontWeight: 600 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Aktiv
            </span>
          )}
        </div>

        {aktive ? (
          <div className="p-5 space-y-5">
            {/* Validity row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 450 }}>Gültig ab:</span>
                <span className="text-foreground" style={{ fontWeight: 500 }}>{aktive.gueltigAb}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <ArrowRight className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 450 }}>Gültig bis:</span>
                <span className="text-foreground" style={{ fontWeight: 500 }}>{aktive.gueltigBis}</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60">Version {aktive.id}</span>
            </div>

            {/* 2×2 Metric Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>Tägliche Minuten</div>
                <div className="text-[28px] text-foreground tracking-tight" style={{ fontWeight: 600, lineHeight: 1.1 }}>{aktive.taeglicheMin}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Minuten / Tag</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>Einsatztage</div>
                <div className="text-[28px] text-foreground tracking-tight" style={{ fontWeight: 600, lineHeight: 1.1 }}>{aktive.tageProWoche}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Tage / Woche</div>
              </div>
              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
                <div className="text-[11px] text-primary/70 uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>A-Leistungen</div>
                <div className="text-[28px] text-primary tracking-tight" style={{ fontWeight: 600, lineHeight: 1.1 }}>{aktive.minutenA}</div>
                <div className="text-[11px] text-primary/60 mt-1">Minuten / Tag</div>
              </div>
              <div className="rounded-xl border border-success/15 bg-success/[0.04] p-4">
                <div className="text-[11px] text-success/70 uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>B-Leistungen</div>
                <div className="text-[28px] text-success tracking-tight" style={{ fontWeight: 600, lineHeight: 1.1 }}>{aktive.minutenB}</div>
                <div className="text-[11px] text-success/60 mt-1">Minuten / Tag</div>
              </div>
            </div>

            {/* Weekly total row */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-primary/70 uppercase tracking-wider" style={{ fontWeight: 500 }}>Wöchentliche Gesamtminuten</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{aktive.taeglicheMin} Min × {aktive.tageProWoche} Tage</div>
              </div>
              <div className="text-[32px] text-primary tracking-tight" style={{ fontWeight: 700, lineHeight: 1 }}>{aktive.taeglicheMin * aktive.tageProWoche}</div>
            </div>

            {/* Note + Button row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Basierend auf ärztlicher Verordnung
              </div>
              {!showNewBewForm && (
                <button
                  onClick={() => setShowNewBewForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Neue Bewilligung erfassen
                </button>
              )}
            </div>

            {/* ── New version form ── */}
            {showNewBewForm && (
              <div className="border-t border-border-light pt-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileClock className="w-4 h-4 text-primary" />
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Neue Version erstellen</p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-warning/[0.06] border border-warning/15">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <span className="text-[12px] text-warning/90" style={{ fontWeight: 450 }}>
                    Die aktuelle Bewilligung (Version {aktive.id}) wird automatisch geschlossen. Bestehende Versionen bleiben in der Historie erhalten.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Gültig ab *</label>
                    <input type="text" placeholder="z.B. 01.04.2026" value={bewForm.gueltigAb} onChange={(e) => setBewForm((p) => ({ ...p, gueltigAb: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Gültig bis</label>
                    <input type="text" placeholder="Offen lassen = unbefristet" value={bewForm.gueltigBis} onChange={(e) => setBewForm((p) => ({ ...p, gueltigBis: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Tägliche Minuten *</label>
                    <input type="number" min={1} placeholder="z.B. 120" value={bewForm.taeglicheMin} onChange={(e) => setBewForm((p) => ({ ...p, taeglicheMin: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Einsatztage / Woche *</label>
                    <input type="number" min={1} max={7} placeholder="z.B. 5" value={bewForm.tageProWoche} onChange={(e) => setBewForm((p) => ({ ...p, tageProWoche: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-primary/70 uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>A-Leistungen (Min/Tag) *</label>
                    <input type="number" min={0} placeholder="z.B. 90" value={bewForm.minutenA} onChange={(e) => setBewForm((p) => ({ ...p, minutenA: e.target.value }))} className="w-full text-[13px] text-foreground bg-primary/[0.03] border border-primary/20 rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-success/70 uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>B-Leistungen (Min/Tag) *</label>
                    <input type="number" min={0} placeholder="z.B. 30" value={bewForm.minutenB} onChange={(e) => setBewForm((p) => ({ ...p, minutenB: e.target.value }))} className="w-full text-[13px] text-foreground bg-success/[0.03] border border-success/20 rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={handleCancelBew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] border border-border bg-card hover:bg-secondary/60 text-foreground transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveBew}
                    disabled={!canSaveBew}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] transition-colors ${
                      canSaveBew
                        ? "text-primary-foreground bg-primary hover:bg-primary-hover cursor-pointer"
                        : "text-muted-foreground bg-muted cursor-not-allowed"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Version erstellen
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="text-center py-8">
              <Stamp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground" style={{ fontWeight: 450 }}>Noch keine Bewilligung erfasst</p>
              <button
                onClick={() => setShowNewBewForm(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Plus className="w-3.5 h-3.5" />
                Erste Bewilligung erfassen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SECTION 2: Bewilligungs-Historie ═══ */}
      {historie.length > 0 && (
        <div className="bg-card rounded-2xl border border-border">
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h5 className="text-foreground">Bewilligungs-Historie</h5>
            </div>
            <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
              {historie.length} {historie.length === 1 ? "Version" : "Versionen"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  {["Version", "Gültig ab", "Gültig bis", "Min / Tag", "A-Leist.", "B-Leist.", "Gesamt / Wo.", "Status"].map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historie.map((b) => (
                  <tr key={b.id} className="border-t border-border-light">
                    <td className="px-4 py-3"><span className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>V{b.id}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] text-foreground">{b.gueltigAb}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] text-foreground">{b.gueltigBis}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{b.taeglicheMin}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] text-primary">{b.minutenA}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] text-success">{b.minutenB}</span></td>
                    <td className="px-4 py-3"><span className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{b.taeglicheMin * b.tageProWoche}</span></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-1.5 py-[1px] rounded text-[10px] bg-muted text-muted-foreground border border-border" style={{ fontWeight: 500 }}>
                        Abgelaufen
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border-light">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Vergangene Bewilligungen sind schreibgeschützt und können nicht gelöscht oder überschrieben werden.
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION 3: Absenzen ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-primary" />
          <h5 className="text-foreground flex-1">Absenzen</h5>
          {absenzen.length > 0 && (
            <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
              {absenzen.length} {absenzen.length === 1 ? "Eintrag" : "Einträge"}
            </span>
          )}
        </div>
        <div className="p-5 space-y-4">

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>
              Gab es Absenzen in diesem Monat?
            </span>
            <button
              type="button"
              onClick={() => setHatAbsenzen((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hatAbsenzen ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  hatAbsenzen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* NO → green badge */}
          {!hatAbsenzen && absenzen.length === 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-success/[0.06] border border-success/15">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-[13px] text-success" style={{ fontWeight: 500 }}>
                Keine Absenzen in diesem Monat
              </span>
            </div>
          )}

          {/* Saved absences list */}
          {absenzen.length > 0 && (
            <div className="space-y-2">
              {absenzen.map((a) => (
                <div
                  key={a.id}
                  className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    editingId === a.id
                      ? "border-primary/30 bg-primary/[0.04] ring-1 ring-primary/10"
                      : "border-border bg-secondary/20 hover:bg-secondary/40"
                  }`}
                >
                  <CalendarOff className={`w-4 h-4 mt-0.5 shrink-0 ${editingId === a.id ? "text-primary" : "text-warning"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{a.zeitraum}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[12px] text-muted-foreground">{a.tage} {Number(a.tage) === 1 ? "Tag" : "Tage"}</span>
                      <span className="inline-flex items-center px-1.5 py-[1px] rounded text-[10px] bg-warning/10 text-warning border border-warning/15" style={{ fontWeight: 500 }}>
                        {a.typ}
                      </span>
                      {editingId === a.id && (
                        <span className="inline-flex items-center px-1.5 py-[1px] rounded text-[10px] bg-primary/10 text-primary border border-primary/15" style={{ fontWeight: 500 }}>
                          Wird bearbeitet
                        </span>
                      )}
                    </div>
                    {a.bemerkung && (
                      <p className="text-[12px] text-muted-foreground mt-1 truncate">{a.bemerkung}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditAbsenz(a)}
                      className={`p-1 rounded-md transition-all ${
                        editingId === a.id
                          ? "text-primary bg-primary/10"
                          : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }`}
                      title="Absenz bearbeiten"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAbsenz(a.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-error hover:bg-error/10 transition-all"
                      title="Absenz löschen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* YES → structured form */}
          {hatAbsenzen && (
            <div className="space-y-4">
              {absenzen.length > 0 && (
                <div className="border-t border-border-light pt-4">
                  <p className="text-[12px] text-muted-foreground mb-3" style={{ fontWeight: 450 }}>
                    {isEditing ? "Absenz bearbeiten" : "Weitere Absenz erfassen"}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Zeitraum */}
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Zeitraum</label>
                  <input type="text" placeholder="z.B. 10.03. – 14.03.2026" value={absenzForm.zeitraum} onChange={(e) => setAbsenzForm((p) => ({ ...p, zeitraum: e.target.value }))} className={inputCls} />
                </div>
                {/* Anzahl Tage */}
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Anzahl Tage</label>
                  <input type="number" min={1} placeholder="z.B. 5" value={absenzForm.tage} onChange={(e) => setAbsenzForm((p) => ({ ...p, tage: e.target.value }))} className={inputCls} />
                </div>
                {/* Absenztyp */}
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>Absenztyp</label>
                  <select value={absenzForm.typ} onChange={(e) => setAbsenzForm((p) => ({ ...p, typ: e.target.value }))} className={inputCls + " appearance-none"}>
                    <option>Krankheit</option>
                    <option>Spitalaufenthalt</option>
                    <option>Ferien / Abwesenheit</option>
                    <option>Rehabilitation</option>
                    <option>Sonstiges</option>
                  </select>
                </div>
              </div>

              {/* Bemerkung */}
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>
                  <MessageSquare className="w-3 h-3 inline -mt-0.5 mr-1" />
                  Bemerkung
                </label>
                <textarea
                  rows={2}
                  placeholder="Optionale Bemerkung…"
                  value={absenzForm.bemerkung}
                  onChange={(e) => setAbsenzForm((p) => ({ ...p, bemerkung: e.target.value }))}
                  className={inputCls + " resize-none"}
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2">
                {isEditing && (
                  <button onClick={handleCancelEdit} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] border border-border bg-card hover:bg-secondary/60 text-foreground transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                    Abbrechen
                  </button>
                )}
                <button
                  onClick={handleAddAbsenz}
                  disabled={!canSave}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] transition-colors ${
                    canSave
                      ? "text-primary-foreground bg-primary hover:bg-primary-hover cursor-pointer"
                      : "text-muted-foreground bg-muted cursor-not-allowed"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {isEditing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {isEditing ? "Änderungen speichern" : "Absenz erfassen"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TableSozial({ detail }: { detail: AngehoerigerDetail }) {
  const [isEditing, setIsEditing] = useState(false);
  const [revealedAhv, setRevealedAhv] = useState<Record<number, boolean>>({});

  /* ── Editable local state (initialized from detail) ── */
  const [kinderzulagenAktiv, setKinderzulagenAktiv] = useState(detail.kinderzulagenAktiv);
  const [kinderzulagenUeberSpitex, setKinderzulagenUeberSpitex] = useState(detail.kinderzulagenUeberSpitex);
  const [kinder, setKinder] = useState(detail.kinder.map((k, i) => ({ ...k, id: i })));
  const [kinderNextId, setKinderNextId] = useState(detail.kinder.length);

  const [quellensteuer, setQuellensteuer] = useState(detail.quellensteuer);
  const [quellensteuerTarif, setQuellensteuerTarif] = useState(detail.quellensteuerTarif);
  const [konfession, setKonfession] = useState(detail.konfession);

  const [lohnsumme, setLohnsumme] = useState(detail.lohnsumme);

  const [fluechtlingsstatus, setFluechtlingsstatus] = useState(detail.fluechtlingsstatus);
  const [grenzgaenger, setGrenzgaenger] = useState(detail.grenzgaenger);
  const [aufenthaltsstatus, setAufenthaltsstatus] = useState(detail.aufenthaltsstatus);

  const toggleAhv = (idx: number) => setRevealedAhv((p) => ({ ...p, [idx]: !p[idx] }));

  const maskAhv = (ahv: string) => {
    if (!ahv || ahv === "—") return "—";
    const parts = ahv.split(".");
    if (parts.length < 4) return ahv;
    return `${parts[0]}.●●●●.●●●●.${parts[3]}`;
  };

  const handleAddKind = () => {
    setKinder((prev) => [...prev, { id: kinderNextId, nachname: "", vorname: "", geburtsdatum: "", ahvNummer: "", geschlecht: "Männlich", zulagenart: "K", ausbildungsbeginn: "—" }]);
    setKinderNextId((n) => n + 1);
  };

  const updateKind = (id: number, field: string, value: string) => {
    setKinder((prev) => prev.map((k) => k.id === id ? { ...k, [field]: value } : k));
  };

  const handleCancel = () => {
    setKinderzulagenAktiv(detail.kinderzulagenAktiv);
    setKinderzulagenUeberSpitex(detail.kinderzulagenUeberSpitex);
    setKinder(detail.kinder.map((k, i) => ({ ...k, id: i })));
    setQuellensteuer(detail.quellensteuer);
    setQuellensteuerTarif(detail.quellensteuerTarif);
    setKonfession(detail.konfession);
    setLohnsumme(detail.lohnsumme);
    setFluechtlingsstatus(detail.fluechtlingsstatus);
    setGrenzgaenger(detail.grenzgaenger);
    setAufenthaltsstatus(detail.aufenthaltsstatus);
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  /* ── Reusable field display ── */
  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>{value || "—"}</div>
    </div>
  );

  const YesNoBadge = ({ value }: { value: string }) => {
    const yes = value === "Ja";
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${
        yes ? "bg-success/10 text-success border border-success/15" : "bg-muted text-muted-foreground border border-border"
      }`} style={{ fontWeight: 500 }}>
        <span className={`w-1.5 h-1.5 rounded-full ${yes ? "bg-success" : "bg-muted-foreground/40"}`} />
        {value}
      </span>
    );
  };

  const YesNoToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-2">
      {["Ja", "Nein"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors cursor-pointer ${
            value === opt
              ? opt === "Ja" ? "bg-success/10 text-success border-success/20" : "bg-muted text-foreground border-border"
              : "bg-card text-muted-foreground border-border hover:bg-secondary/60"
          }`}
          style={{ fontWeight: value === opt ? 500 : 400 }}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const inputClass = "w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50";
  const selectClass = "w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all appearance-none";

  return (
    <div className="space-y-4">

      {/* ── Global Edit Toggle ── */}
      <div className="flex justify-end">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            Bearbeiten
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer text-foreground"
              style={{ fontWeight: 500 }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <Check className="w-3.5 h-3.5" />
              Speichern
            </button>
          </div>
        )}
      </div>

      {/* ═══ BLOCK 1: Kinder & Zulagen ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
          <Baby className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">Kinder & Zulagen</h5>
        </div>
        <div className="p-5 space-y-5">
          {kinder.length > 0 || isEditing ? (
            <>
              {/* Kinder table — matches Überblick tab style */}
              {kinder.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30">
                        {["Name", "Geburtsdatum", "AHV-Nummer", "Zulagenart", "Ausbildungsbeginn", ...(isEditing ? [""] : [])].map((col) => (
                          <th key={col || "actions"} className="px-3 py-2 text-left">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kinder.map((k, idx) => (
                        <tr key={k.id} className="border-t border-border-light">
                          {/* Name (combined) */}
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input type="text" value={k.vorname} onChange={(e) => updateKind(k.id, "vorname", e.target.value)} placeholder="Vorname" className={inputClass + " !py-1.5 !text-[12px]"} />
                                <input type="text" value={k.nachname} onChange={(e) => updateKind(k.id, "nachname", e.target.value)} placeholder="Name" className={inputClass + " !py-1.5 !text-[12px]"} />
                              </div>
                            ) : (
                              <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{k.vorname} {k.nachname}</span>
                            )}
                          </td>
                          {/* Geburtsdatum */}
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <input type="text" value={k.geburtsdatum} onChange={(e) => updateKind(k.id, "geburtsdatum", e.target.value)} placeholder="TT.MM.JJJJ" className={inputClass + " !py-1.5 !text-[12px]"} />
                            ) : (
                              <span className="text-[13px] text-foreground">{k.geburtsdatum}</span>
                            )}
                          </td>
                          {/* AHV-Nummer */}
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <input type="text" value={k.ahvNummer} onChange={(e) => updateKind(k.id, "ahvNummer", e.target.value)} placeholder="756.XXXX.XXXX.XX" className={inputClass + " !py-1.5 !text-[12px]"} />
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-[13px] text-foreground font-mono">{revealedAhv[idx] ? k.ahvNummer : maskAhv(k.ahvNummer)}</span>
                                {k.ahvNummer && k.ahvNummer !== "—" && (
                                  <button type="button" onClick={() => toggleAhv(idx)} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                    {revealedAhv[idx] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          {/* Zulagenart */}
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <select value={k.zulagenart} onChange={(e) => updateKind(k.id, "zulagenart", e.target.value)} className={selectClass + " !py-1.5 !text-[12px]"}>
                                <option value="K">Kinderzulage</option>
                                <option value="W">Ausbildungszulage</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${k.zulagenart === "K" ? "bg-info-light text-info-foreground" : "bg-warning-light text-warning-foreground"}`} style={{ fontWeight: 500 }}>
                                {k.zulagenart === "K" ? "Kinderzulage" : "Ausbildungszulage"}
                              </span>
                            )}
                          </td>
                          {/* Ausbildungsbeginn */}
                          <td className="px-3 py-2.5">
                            {isEditing && k.zulagenart === "W" ? (
                              <input type="text" value={k.ausbildungsbeginn} onChange={(e) => updateKind(k.id, "ausbildungsbeginn", e.target.value)} placeholder="TT.MM.JJJJ" className={inputClass + " !py-1.5 !text-[12px]"} />
                            ) : (
                              <span className="text-[13px] text-muted-foreground">{k.ausbildungsbeginn}</span>
                            )}
                          </td>
                          {/* Remove action */}
                          {isEditing && (
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => setKinder((prev) => prev.filter((x) => x.id !== k.id))}
                                className="p-1 rounded-md text-muted-foreground hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                                title="Kind entfernen"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add button in edit mode */}
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddKind}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/[0.03] transition-colors cursor-pointer"
                  style={{ fontWeight: 450 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Kind hinzufügen
                </button>
              )}

              {/* Footer fields — matches Überblick tab */}
              <div className="mt-4 pt-3 border-t border-border-light grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Kinderzulagen aktiv</div>
                  {isEditing ? (
                    <YesNoToggle value={kinderzulagenAktiv} onChange={setKinderzulagenAktiv} />
                  ) : (
                    <YesNoBadge value={kinderzulagenAktiv} />
                  )}
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Kinderzulagen über Spitex</div>
                  {isEditing ? (
                    <YesNoToggle value={kinderzulagenUeberSpitex} onChange={setKinderzulagenUeberSpitex} />
                  ) : (
                    <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>{kinderzulagenUeberSpitex || "—"}</div>
                  )}
                </div>
                <Field label="Familienausgleichskasse" value={detail.familienausgleichskasse} />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">Keine Kinder erfasst.</p>
          )}
        </div>
      </div>

      {/* ═══ BLOCK 2: Quellensteuer ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">Quellensteuer</h5>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Quellensteuerpflicht</div>
              {isEditing ? (
                <YesNoToggle value={quellensteuer} onChange={setQuellensteuer} />
              ) : (
                <YesNoBadge value={quellensteuer} />
              )}
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Quellensteuer-Tarif</div>
              {isEditing ? (
                <select value={quellensteuerTarif} onChange={(e) => setQuellensteuerTarif(e.target.value)} className={selectClass}>
                  <option value="—">—</option>
                  <option value="A">A</option>
                  <option value="H">H</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              ) : (
                <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>
                  {quellensteuerTarif !== "—" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] bg-secondary text-foreground border border-border" style={{ fontWeight: 500 }}>
                      Tarif {quellensteuerTarif}
                    </span>
                  ) : "—"}
                </div>
              )}
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Konfession (Kirchensteuer)</div>
              {isEditing ? (
                <select value={konfession} onChange={(e) => setKonfession(e.target.value)} className={selectClass}>
                  <option>Evangelisch-reformiert</option>
                  <option>Römisch-katholisch</option>
                  <option>Christkatholisch</option>
                  <option>Konfessionslos</option>
                  <option>Andere</option>
                </select>
              ) : (
                <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>{konfession}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BLOCK 3: Lohnsumme ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">Lohnsumme</h5>
        </div>
        <div className="p-5">
          <div className="max-w-xs">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Lohnsumme (CHF)</div>
            {isEditing ? (
              <input
                type="text"
                value={lohnsumme}
                onChange={(e) => setLohnsumme(e.target.value)}
                placeholder="z.B. 3'540.00"
                className={inputClass}
              />
            ) : (
              <div className="text-[22px] text-foreground tracking-tight" style={{ fontWeight: 600, lineHeight: 1.2 }}>
                CHF {lohnsumme || "—"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BLOCK 4: Arbeits-/Aufenthaltsstatus ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">Arbeits- & Aufenthaltsstatus</h5>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Flüchtlingsstatus</div>
              {isEditing ? (
                <YesNoToggle value={fluechtlingsstatus} onChange={setFluechtlingsstatus} />
              ) : (
                <YesNoBadge value={fluechtlingsstatus} />
              )}
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Grenzgänger</div>
              {isEditing ? (
                <YesNoToggle value={grenzgaenger} onChange={setGrenzgaenger} />
              ) : (
                <YesNoBadge value={grenzgaenger} />
              )}
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Aufenthaltsstatus</div>
              {isEditing ? (
                <select value={aufenthaltsstatus} onChange={(e) => setAufenthaltsstatus(e.target.value)} className={selectClass}>
                  <option value="—">—</option>
                  <option value="Schweizer/in">Schweizer/in</option>
                  <option value="Bewilligung B">Bewilligung B</option>
                  <option value="Bewilligung C">Bewilligung C</option>
                  <option value="Bewilligung L">Bewilligung L</option>
                  <option value="Bewilligung G">Bewilligung G</option>
                  <option value="Bewilligung F">Bewilligung F</option>
                </select>
              ) : (
                <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>
                  {aufenthaltsstatus !== "—" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] bg-secondary text-foreground border border-border" style={{ fontWeight: 500 }}>
                      {aufenthaltsstatus}
                    </span>
                  ) : "—"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 px-1">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Daten aus dem Onboarding übernommen. Änderungen werden dokumentiert.
      </div>
    </div>
  );
}

function TableQualifikation({ detail }: { detail: AngehoerigerDetail }) {
  const TODAY = new Date(2026, 2, 3); // March 3, 2026

  /* ── Date helpers ── */
  const parseDe = (d: string): Date | null => {
    const p = d.split(".");
    if (p.length !== 3) return null;
    return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  };

  const formatDe = (d: Date): string => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  };

  const daysUntil = (dateStr: string): number | null => {
    const d = parseDe(dateStr);
    if (!d) return null;
    return Math.ceil((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  };

  /* ── Editable state ── */
  const [isEditing, setIsEditing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [status, setStatus] = useState<"abgeschlossen" | "offen" | "ueberfaellig">(detail.srkStatus);
  const [angemeldet, setAngemeldet] = useState(detail.srkAngemeldet);
  const [deadline, setDeadline] = useState(detail.srkDeadline);
  const [abgeschlossenAm, setAbgeschlossenAm] = useState(detail.srkAbgeschlossenAm);

  const handleCancel = () => {
    setStatus(detail.srkStatus);
    setAngemeldet(detail.srkAngemeldet);
    setDeadline(detail.srkDeadline);
    setAbgeschlossenAm(detail.srkAbgeschlossenAm);
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2500);
  };

  /* ── Compliance calculations ── */
  const vertragsDate = parseDe(detail.eintrittsdatum);
  const grenze12 = vertragsDate ? new Date(vertragsDate.getFullYear() + 1, vertragsDate.getMonth(), vertragsDate.getDate()) : null;
  const grenze12Str = grenze12 ? formatDe(grenze12) : "—";
  const daysToGrenze = grenze12 ? Math.ceil((grenze12.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const deadlineDays = daysUntil(deadline);
  const isOverdue = status === "ueberfaellig";
  const isSoonDeadline = status === "offen" && deadlineDays !== null && deadlineDays <= 30;

  // Gate status
  let gateStatus: "erlaubt" | "risiko" | "pausiert" = "erlaubt";
  if (status === "abgeschlossen") {
    gateStatus = "erlaubt";
  } else if (grenze12 && TODAY >= grenze12) {
    gateStatus = "pausiert";
  } else if (daysToGrenze !== null && daysToGrenze <= 30) {
    gateStatus = "risiko";
  } else if (isOverdue || isSoonDeadline) {
    gateStatus = "risiko";
  }

  const gateConfig = {
    erlaubt:  { label: "Leistungen erlaubt",   bg: "bg-success/10", text: "text-success", border: "border-success/15", dot: "bg-success" },
    risiko:   { label: "Leistungen in Risiko",  bg: "bg-warning/10", text: "text-warning", border: "border-warning/15", dot: "bg-warning" },
    pausiert: { label: "Leistungen pausiert",   bg: "bg-error/10",   text: "text-error",   border: "border-error/15",   dot: "bg-error" },
  };

  const statusBadgeConfig = {
    abgeschlossen: { label: "SRK erfüllt",     bg: "bg-success/10", text: "text-success", border: "border-success/20", dot: "bg-success" },
    offen:         { label: "SRK offen",        bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", dot: "bg-warning" },
    ueberfaellig:  { label: "SRK überfällig",   bg: "bg-error/10",   text: "text-error",   border: "border-error/20",   dot: "bg-error" },
  };

  const statusDropdownConfig = {
    abgeschlossen: "Abgeschlossen",
    offen: "Offen",
    ueberfaellig: "Überfällig",
  };

  const sb = statusBadgeConfig[status];
  const gc = gateConfig[gateStatus];

  const inputClass = "w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all";
  const selectClass = inputClass + " appearance-none";

  return (
    <div className="space-y-4">

      {/* ═══ TAB HEADER ═══ */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-5 py-4 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <h5 className="text-foreground">SRK Kurs</h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pflichtkurs für Angehörigenpflege</p>
              </div>
            </div>
            {/* Compliance status badge — large */}
            <div className="mt-3">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] ${sb.bg} ${sb.text} border ${sb.border}`} style={{ fontWeight: 600 }}>
                <span className={`w-2 h-2 rounded-full ${sb.dot}`} />
                {sb.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {showSaved && (
              <span className="text-[11px] text-success flex items-center gap-1" style={{ fontWeight: 500 }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Änderungen gespeichert
              </span>
            )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                Bearbeiten
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer text-foreground"
                  style={{ fontWeight: 500 }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Speichern
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rule text */}
        <div className="px-5 pb-4">
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-muted/30 border border-border-light">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground" style={{ lineHeight: 1.5 }}>
              Wenn SRK nicht abgeschlossen ist, werden 12 Monate nach Vertragsunterzeichnung Leistungen pausiert (keine Auszahlung).
            </p>
          </div>
        </div>

        {/* Warning banner */}
        {(isOverdue || isSoonDeadline) && (
          <div className="px-5 pb-4">
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border ${
              isOverdue ? "bg-error/[0.04] border-error/15" : "bg-warning/[0.04] border-warning/15"
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isOverdue ? "text-error" : "text-warning"}`} />
              <div>
                <div className={`text-[12px] ${isOverdue ? "text-error" : "text-warning"}`} style={{ fontWeight: 500 }}>
                  {isOverdue ? "SRK Kurs überfällig – Risiko Leistungs-Pause" : "SRK Kurs bald fällig"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Deadline: {deadline}
                  {deadlineDays !== null && (
                    <span> ({isOverdue ? `${Math.abs(deadlineDays)} Tage überfällig` : `Fällig in ${deadlineDays} Tagen`})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MAIN CONTENT — 2 Columns ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── LEFT: Kursstatus ── */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h6 className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Kursstatus</h6>
          </div>
          <div className="p-5 space-y-4">
            {/* Status */}
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Status</div>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "abgeschlossen" | "offen" | "ueberfaellig")}
                  className={selectClass}
                >
                  {Object.entries(statusDropdownConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${statusBadgeConfig[status].bg} ${statusBadgeConfig[status].text} border ${statusBadgeConfig[status].border}`} style={{ fontWeight: 600 }}>
                  <span className={`w-[5px] h-[5px] rounded-full ${statusBadgeConfig[status].dot}`} />
                  {statusDropdownConfig[status]}
                </span>
              )}
            </div>

            {/* Angemeldet */}
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Angemeldet</div>
              {isEditing ? (
                <div className="flex gap-2">
                  {[true, false].map((opt) => (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() => setAngemeldet(opt)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors cursor-pointer ${
                        angemeldet === opt
                          ? opt ? "bg-success/10 text-success border-success/20" : "bg-muted text-foreground border-border"
                          : "bg-card text-muted-foreground border-border hover:bg-secondary/60"
                      }`}
                      style={{ fontWeight: angemeldet === opt ? 500 : 400 }}
                    >
                      {opt ? "Ja" : "Nein"}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${
                  angemeldet ? "bg-primary/[0.06] text-primary border-primary/15" : "bg-muted text-muted-foreground border-border"
                }`} style={{ fontWeight: 500 }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${angemeldet ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  {angemeldet ? "Ja" : "Nein"}
                </span>
              )}
            </div>

            {/* Deadline */}
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Deadline</div>
              {isEditing ? (
                <input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="TT.MM.JJJJ" className={inputClass} />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-[13px] text-foreground" style={{ fontWeight: 450 }}>
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    {deadline}
                  </div>
                  {status !== "abgeschlossen" && deadlineDays !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isOverdue
                        ? "bg-error/10 text-error border border-error/15"
                        : isSoonDeadline
                          ? "bg-warning/10 text-warning border border-warning/15"
                          : "bg-muted text-muted-foreground border border-border"
                    }`} style={{ fontWeight: 500 }}>
                      {isOverdue ? `${Math.abs(deadlineDays)} Tage überfällig` : `Fällig in ${deadlineDays} Tagen`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Abgeschlossen am */}
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Abgeschlossen am</div>
              {isEditing ? (
                <input
                  type="text"
                  value={abgeschlossenAm}
                  onChange={(e) => setAbgeschlossenAm(e.target.value)}
                  placeholder="TT.MM.JJJJ"
                  disabled={status !== "abgeschlossen"}
                  className={`${inputClass} ${status !== "abgeschlossen" ? "opacity-40 cursor-not-allowed" : ""}`}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-[13px]" style={{ fontWeight: 450 }}>
                  {abgeschlossenAm && abgeschlossenAm !== "—" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span className="text-foreground">{abgeschlossenAm}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </div>
              )}
            </div>

            {/* Nachweis hochladen */}
            <div className="pt-1">
              <button className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary-hover transition-colors cursor-pointer" style={{ fontWeight: 450 }}>
                <Upload className="w-3.5 h-3.5" />
                Nachweis hochladen
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Compliance & Konsequenz ── */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h6 className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Compliance & Konsequenz</h6>
          </div>
          <div className="p-5 space-y-5">

            {/* Timeline / Gate */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />

              {/* Step 1: Vertragsunterzeichnung */}
              <div className="relative flex items-start gap-3.5 pb-5">
                <div className="relative z-10 w-[18px] h-[18px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                  <span className="w-[6px] h-[6px] rounded-full bg-primary" />
                </div>
                <div className="pt-0.5">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Vertragsunterzeichnung</div>
                  <div className="text-[13px] text-foreground mt-0.5" style={{ fontWeight: 500 }}>{detail.eintrittsdatum}</div>
                </div>
              </div>

              {/* Step 2: 12-Monats-Grenze */}
              <div className="relative flex items-start gap-3.5 pb-5">
                <div className={`relative z-10 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                  gateStatus === "pausiert"
                    ? "bg-error/10 border-error"
                    : gateStatus === "risiko"
                      ? "bg-warning/10 border-warning"
                      : "bg-muted border-border"
                }`}>
                  <span className={`w-[6px] h-[6px] rounded-full ${
                    gateStatus === "pausiert" ? "bg-error" : gateStatus === "risiko" ? "bg-warning" : "bg-border"
                  }`} />
                </div>
                <div className="pt-0.5">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>12-Monats-Grenze</div>
                  <div className="text-[13px] text-foreground mt-0.5" style={{ fontWeight: 500 }}>{grenze12Str}</div>
                  {daysToGrenze !== null && status !== "abgeschlossen" && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {daysToGrenze > 0 ? `Noch ${daysToGrenze} Tage` : `${Math.abs(daysToGrenze)} Tage überschritten`}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Gate Status */}
              <div className="relative flex items-start gap-3.5">
                <div className={`relative z-10 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${gc.bg} ${gc.border}`}>
                  {gateStatus === "erlaubt" ? (
                    <Check className="w-2.5 h-2.5 text-success" />
                  ) : gateStatus === "pausiert" ? (
                    <X className="w-2.5 h-2.5 text-error" />
                  ) : (
                    <AlertTriangle className="w-2.5 h-2.5 text-warning" />
                  )}
                </div>
                <div className="pt-0.5">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Gate Status</div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] mt-1 ${gc.bg} ${gc.text} border ${gc.border}`} style={{ fontWeight: 600 }}>
                    <span className={`w-[6px] h-[6px] rounded-full ${gc.dot}`} />
                    {gc.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Contextual explanation */}
            <div className={`rounded-lg px-3.5 py-2.5 border text-[11px] ${
              gateStatus === "erlaubt"
                ? "bg-success/[0.04] border-success/15 text-success"
                : gateStatus === "risiko"
                  ? "bg-warning/[0.04] border-warning/15 text-warning"
                  : "bg-error/[0.04] border-error/15 text-error"
            }`} style={{ fontWeight: 450, lineHeight: 1.5 }}>
              {gateStatus === "erlaubt" && "SRK Kurs ist abgeschlossen. Leistungserbringung ist freigegeben."}
              {gateStatus === "risiko" && "SRK Kurs ist noch nicht abgeschlossen. Leistungs-Pause droht, wenn der Kurs nicht rechtzeitig abgeschlossen wird."}
              {gateStatus === "pausiert" && "12-Monats-Grenze überschritten ohne SRK-Abschluss. Leistungen sind pausiert — keine Auszahlung bis SRK abgeschlossen."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: TICKETS
   ══════════════════════════════════════════ */
function TabTickets({ tickets, navigate }: { tickets: Ticket[]; navigate: (path: string) => void }) {
  const ticketStatusConfig = {
    offen: { label: "Offen", bg: "bg-error-light", text: "text-error-foreground", dot: "bg-error" },
    in_bearbeitung: { label: "In Bearbeitung", bg: "bg-warning-light", text: "text-warning-foreground", dot: "bg-warning" },
    erledigt: { label: "Erledigt", bg: "bg-success-light", text: "text-success-foreground", dot: "bg-success" },
  };
  const priorityConfig = {
    hoch: { label: "Hoch", bg: "bg-error-light", text: "text-error-foreground" },
    mittel: { label: "Mittel", bg: "bg-warning-light", text: "text-warning-foreground" },
    niedrig: { label: "Niedrig", bg: "bg-muted", text: "text-muted-foreground" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">Tickets für diesen Angehörigen</h5>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground" style={{ fontWeight: 500 }}>{tickets.length}</span>
        </div>
        <button
          onClick={() => navigate("/servicedesk")}
          className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          Service Desk öffnen
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {["Ticket-ID", "Betreff", "Kategorie", "Priorität", "Status", "Erstellt", "Zugewiesen"].map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left"><span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const tst = ticketStatusConfig[ticket.status];
                const tpr = priorityConfig[ticket.priority];
                return (
                  <tr key={ticket.id} onClick={() => navigate("/servicedesk")} className="border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer group">
                    <td className="px-4 py-3"><span className="text-[12px] text-primary font-mono group-hover:underline" style={{ fontWeight: 500 }}>{ticket.id}</span></td>
                    <td className="px-4 py-3"><span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{ticket.subject}</span></td>
                    <td className="px-4 py-3"><span className="text-[11px] px-2 py-[2px] rounded-md bg-muted text-foreground" style={{ fontWeight: 500 }}>{ticket.category}</span></td>
                    <td className="px-4 py-3"><span className={`text-[11px] px-2 py-[2px] rounded-md ${tpr.bg} ${tpr.text}`} style={{ fontWeight: 500 }}>{tpr.label}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${tst.bg} ${tst.text}`} style={{ fontWeight: 500 }}>
                        <span className={`w-[5px] h-[5px] rounded-full ${tst.dot}`} />
                        {tst.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{ticket.created}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{ticket.assignedTo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-dashed border-primary/30 p-5 text-center">
        <Plus className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Neues Ticket erstellen</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">Erstellen Sie ein neues Service-Desk-Ticket für diesen Angehörigen</p>
        <button
          onClick={() => navigate("/servicedesk")}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors text-[13px]"
          style={{ fontWeight: 500 }}
        >
          <Headphones className="w-4 h-4" />
          Zum Service Desk
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: HISTORIE
   ══════════════════════════════════════════ */
function TabHistorie() {
  const historie = getHistorie();

  const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string }> = {
    status: { icon: Activity, bg: "bg-primary-light", color: "text-primary" },
    dokument: { icon: FileText, bg: "bg-info-light", color: "text-info" },
    workflow: { icon: ListChecks, bg: "bg-success-light", color: "text-success" },
    ticket: { icon: Headphones, bg: "bg-warning-light", color: "text-warning" },
    system: { icon: RefreshCw, bg: "bg-muted", color: "text-muted-foreground" },
    hr: { icon: Briefcase, bg: "bg-primary-light", color: "text-primary" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <h5 className="text-foreground">Aktivitätsverlauf</h5>
        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground" style={{ fontWeight: 500 }}>
          {historie.length} Einträge
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border-light" />

            <div className="space-y-0">
              {historie.map((entry, idx) => {
                const tc = typeConfig[entry.type] || typeConfig.system;
                const Icon = tc.icon;
                const showDate = idx === 0 || historie[idx - 1].date !== entry.date;

                return (
                  <div key={entry.id}>
                    {showDate && (
                      <div className="relative flex items-center gap-3 py-2">
                        <div className="w-[32px] shrink-0" />
                        <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 600 }}>
                          {entry.date}
                        </span>
                      </div>
                    )}
                    <div className="relative flex items-start gap-3 py-2.5 pl-0 group hover:bg-muted/20 rounded-xl px-2 transition-colors">
                      <div className={`w-[32px] h-[32px] rounded-lg ${tc.bg} flex items-center justify-center shrink-0 relative z-10`}>
                        <Icon className={`w-4 h-4 ${tc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                            {entry.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {entry.time}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {entry.detail}
                        </p>
                        <span className="text-[11px] text-muted-foreground/70 mt-0.5 block">
                          von {entry.user}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
