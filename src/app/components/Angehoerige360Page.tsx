import React, { useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  Activity,
  Clock,
  User,
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
  angehoerigeSeed as angehoerige,
  qualifikationConfig,
  type Angehoeriger,
  type AngehoerigerStatus,
} from "./angehoerigeData";
import { patientenSeed as patients, adresseAnzeige } from "./patientData";
import { AdressBlock } from "./ui/AdressBlock";
import { FORMULAR_MAX } from "./form/feldbreiten";
import { NotizSpur } from "./notizen/NotizSpur";
import { type NotizReferenz } from "../../lib/notizen/notizen";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { PersonenAuswahl, type PersonOption } from "./ui/PersonenAuswahl";
import { BezugspersonFeld } from "./BezugspersonFeld";
import { getDiplomierte, getDiplomierterById, diplomierterAnzeigename } from "../../lib/betreuung/diplomierte";
import { UserMinus } from "lucide-react";
import { TabDokumenteGeneric, type DocFolder } from "./TabDokumente";
import { DetailNavigation } from "./DetailNavigation";
import { AnnaAngehoerigeSummary } from "../anna/AnnaAngehoerigeSummary";
import { RhythmusTimeline } from "./rhythmus/RhythmusTimeline";
import { DateField } from "./form/DateField";
import { generiereRhythmusTickets } from "../../lib/rhythmus/engine";
import { getNachweiseFuerAngehoeriger } from "../../lib/schulung/nachweis-store";
import { getKontrollenFuerAngehoeriger, erstelleKontrolle, getNaechsteFaelligkeit, type KontrolleArt } from "../../lib/arbeitskontrolle/store";
import { exportiereArbeitskontrollePDF } from "../../lib/arbeitskontrolle/pdf-export";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { type KindEntry, createEmptyKind, ZULAGENART_LABEL, zulagenartLabel } from "./StepAngehoeriger";
import { isoZuAnzeige, anzeigeZuIso } from "../../lib/datum";
import "../../lib/schulung/demo-seed";
import "../../lib/arbeitskontrolle/demo-seed";

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
  mobil: string;
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
  /* Kinder — einheitliches Modell (KindEntry aus dem Onboarding) */
  kinder: KindEntry[];
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
    email: "peter.mueller@bluewin.ch", telefon: "+41 44 321 65 87", mobil: "",
    krankenkasseName: "CSS", versicherungsnummer: "KK-834291",
    quellensteuer: "Nein", konfession: "Evangelisch-reformiert",
    quellensteuerTarif: "—", steuergemeinde: "Zürich",
    sozialamtInvolviert: "Nein", sozialamtKontakt: "—", lohnabtretung: "Nein",
    partnerName: "Anna Müller", partnerGeburtsdatum: "22.08.1980",
    partnerAhvNummer: "756.9876.5432.10", partnerZemisNummer: "—", partnerAufenthaltsstatus: "Schweizer/in",
    kinder: [
      { id: "K-0101-1", nachname: "Müller", vorname: "Luca", geburtsdatum: "15.04.2010", ahvNummer: "756.1111.2222.33", geschlecht: "Männlich", zulagenart: "K", ausbildungsbeginn: "—", inAusbildung: "nein", ausbildungsstatus: "", typQuelle: "abgeleitet", overrideBegruendung: "", doppelbezug: "nein" },
      { id: "K-0101-2", nachname: "Müller", vorname: "Sophie", geburtsdatum: "03.09.2012", ahvNummer: "756.4444.5555.66", geschlecht: "Weiblich", zulagenart: "K", ausbildungsbeginn: "—", inAusbildung: "nein", ausbildungsstatus: "", typQuelle: "abgeleitet", overrideBegruendung: "", doppelbezug: "nein" },
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
    email: "lisa.schmid@gmail.com", telefon: "+41 76 555 12 34", mobil: "",
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
    email: "j.weber@gmx.ch", telefon: "+41 31 777 88 99", mobil: "",
    krankenkasseName: "Swica", versicherungsnummer: "KK-556783",
    quellensteuer: "Nein", konfession: "Römisch-katholisch",
    quellensteuerTarif: "—", steuergemeinde: "Bern",
    sozialamtInvolviert: "Nein", sozialamtKontakt: "—", lohnabtretung: "Nein",
    partnerName: "—", partnerGeburtsdatum: "—",
    partnerAhvNummer: "—", partnerZemisNummer: "—", partnerAufenthaltsstatus: "—",
    kinder: [
      { id: "K-0103-1", nachname: "Weber", vorname: "Tim", geburtsdatum: "20.01.2008", ahvNummer: "756.7777.8888.99", geschlecht: "Männlich", zulagenart: "W", ausbildungsbeginn: "01.08.2024", inAusbildung: "ja", ausbildungsstatus: "laufend", typQuelle: "abgeleitet", overrideBegruendung: "", doppelbezug: "nein" },
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
    email: "kontakt@example.ch", telefon: "+41 61 222 33 44", mobil: "",
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
  { id: "stammdaten", label: "Stammdaten", icon: User },
  { id: "anstellung", label: "Anstellung", icon: Briefcase },
  { id: "qualifikation", label: "Qualifikation", icon: Award },
  { id: "einsatz", label: "Kontrollen", icon: Stamp },
  { id: "rhythmus", label: "Betreuung", icon: Activity },
  { id: "dokumente", label: "Dokumente", icon: FileText },
  { id: "pendenzen", label: "Pendenzen", icon: Headphones },
  { id: "historie", label: "Historie", icon: History },
];

/* ── Kennzeichen: identische Ableitung wie in der Angehörigenliste
   (AngehoerigePage.tsx: ableitenKennzeichen). Die Liste bleibt in diesem Lauf
   unverändert, daher hier als eigenständige, wortgleiche Kopie. Form + Farbe. ── */
function detailNichtZugewiesen(a: Angehoeriger): boolean {
  return !a.pflegefachkraft || a.pflegefachkraft.trim() === "" || a.pflegefachkraft === "—";
}
function ableitenKennzeichen(a: Angehoeriger): { typ: "rot" | "gelb" | null; grund: string } {
  if (a.monatsSchritt.ueberfaellig === true) return { typ: "rot", grund: "Monatsschritt überfällig" };
  if (a.qualifikation === "ohne_srk") return { typ: "gelb", grund: "SRK-Kurs offen" };
  if (detailNichtZugewiesen(a)) return { typ: "gelb", grund: "Keine Pflegefachkraft zugewiesen" };
  return { typ: null, grund: "" };
}

/* ── Linke Zustandsspalte: Zuständigkeit + geteilte Notizspur (wie im Assistenten) ── */
/** Benutzerquelle für die Zuweisung: zentrale Diplomierten-Liste (lib/betreuung). */
const DIPL_PERSONEN: PersonOption[] = getDiplomierte().map(d => ({
  id: d.id, initialen: d.initialen, nachname: d.name, vorname: d.vorname, rolle: d.funktion,
}));

/** Zuständigkeit — dieselbe Darstellung wie der Bezugsperson-Block des Assistenten
 *  (geteiltes BezugspersonFeld + PersonenAuswahl), aber mit lokalem Zustand statt
 *  des fallgebundenen betreuung/store. */
function ZustaendigkeitBlock({ a }: { a: Angehoeriger }) {
  const [open, setOpen] = useState(false);
  const surfaceRef = useRef<HTMLButtonElement>(null);
  const initialId = getDiplomierte().find(d => `${d.vorname} ${d.name}` === a.pflegefachkraft)?.id ?? null;
  const [userId, setUserId] = useState<string | null>(initialId);
  const selected = getDiplomierterById(userId);
  const zuweisen = (id: string | null) => { setUserId(id); setOpen(false); };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span className="flex" style={{ width: "100%" }}>
          <BezugspersonFeld
            surfaceRef={surfaceRef}
            label={null}
            voll
            person={selected ? { initialen: selected.initialen, name: diplomierterAnzeigename(selected) } : null}
            onAktivieren={() => setOpen(o => !o)}
            offen={open}
          />
        </span>
      </PopoverAnchor>
      <PopoverContent align="start" side="bottom" sideOffset={6} style={{ width: 300, padding: 6 }}
        onEscapeKeyDown={() => setOpen(false)}
        onCloseAutoFocus={e => { e.preventDefault(); surfaceRef.current?.focus(); }}>
        <PersonenAuswahl personen={DIPL_PERSONEN} selectedId={userId} onSelect={zuweisen} suchePlaceholder="Person suchen" leerText="Keine Person gefunden." />
        {selected && (
          <>
            <div style={{ height: "var(--border-thin)", background: "var(--border-default)", margin: "6px 4px" }} />
            <button type="button" onClick={() => zuweisen(null)} className="ui-fokusring w-full inline-flex items-center cursor-pointer"
              style={{ gap: 8, padding: "8px 10px", borderRadius: "var(--radius-input)", background: "transparent", border: "none", fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--status-danger)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <UserMinus style={{ width: 15, height: 15 }} /> Zuweisung aufheben
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function LinkeSpalte({ a }: { a: Angehoeriger }) {
  const referenz: NotizReferenz = { art: "angehoeriger", kennung: a.id };
  return (
    <div className="space-y-5">
      {/* Zuständigkeit */}
      <div>
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>Zuständigkeit</div>
        <ZustaendigkeitBlock a={a} />
      </div>

      {/* Notizen — dieselbe Spur (geteilter Store) wie im Onboarding-Assistenten */}
      <NotizSpur referenz={referenz} personName={`${a.vorname} ${a.nachname}`} />
    </div>
  );
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "ueberblick";
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "ueberblick") next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const allAngehoerigeIds = angehoerige.map(x => x.id);
  const a = angehoerige.find((x) => x.id === angehoerigerIdOrNew);

  if (!a) {
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)" }}>Angehörige/r nicht gefunden</h3>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 4 }}>
          Die ID «{angehoerigerIdOrNew}» konnte nicht zugeordnet werden.
        </p>
        <button
          onClick={() => navigate("/angehoerige")}
          className="inline-flex items-center cursor-pointer transition-colors"
          style={{ marginTop: 16, gap: 8, padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Zurück zur Angehörigen-Übersicht
        </button>
      </div>
    );
  }

  const detail = getDetail(a.id);

  // WF-01: Rhythmus-Tickets generieren (idempotent) wenn aktiv + eintrittsdatum gesetzt
  if (a.status === "aktiv" && detail.eintrittsdatum) {
    // eintrittsdatum ist im Format "DD.MM.YYYY" → ISO konvertieren
    const parts = detail.eintrittsdatum.split(".");
    const isoAnker = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : detail.eintrittsdatum;
    generiereRhythmusTickets("angehoeriger", a.id, `${a.vorname} ${a.nachname}`, isoAnker, a.pflegefachkraft);
  }

  // Status als bearbeitbares Feld (Prototyp: lokaler Zustand, persistiert nicht).
  // Ein Wechsel, der die Person aus dem aktiven Betrieb nimmt (Leistungen pausiert),
  // verlangt eine Rückfrage. Hinweis: das Angehörigen-Modell kennt keinen terminalen
  // "gekündigt"-Status; "fehlende_dokumente" ist der deaktivierende Zustand.
  const STATUS_DEAKTIVIEREND = new Set<AngehoerigerStatus>(["fehlende_dokumente"]);
  const [status, setStatus] = useState<AngehoerigerStatus>(a.status);
  const statusAendern = (neu: AngehoerigerStatus) => {
    if (neu === status) return;
    if (STATUS_DEAKTIVIEREND.has(neu) && !window.confirm(`Status auf «${statusConfig[neu].label}» ändern? Das nimmt die Person aus dem aktiven Betrieb — laufende Leistungen werden pausiert.`)) return;
    setStatus(neu);
  };
  const qual = qualifikationConfig[a.qualifikation];
  const kennzeichen = ableitenKennzeichen(a);
  const tickets = getTickets();

  return (
    <>
      {/* ── Back + Prev/Next Navigation ──────── */}
      <div style={{ padding: "var(--space-4) var(--space-6) 0" }}>
        <DetailNavigation
          backLabel="Angehörige"
          backPath="/angehoerige"
          currentId={angehoerigerIdOrNew!}
          allIds={allAngehoerigeIds}
          buildPath={(id) => `/angehoerige/${id}`}
          tabParam={activeTab !== "ueberblick" ? activeTab : undefined}
        />
      </div>

      {/* ── Kopf (schlank: ohne Rahmen, Kartenfläche, Avatar) ── */}
      <div style={{ padding: "6px var(--space-6) 0" }}>
        <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
          {kennzeichen.typ && (
            <AlertTriangle role="img" aria-label={kennzeichen.grund}
              style={{ width: 15, height: 15, flexShrink: 0, color: kennzeichen.typ === "rot" ? "var(--status-danger)" : "var(--status-warning)", fill: kennzeichen.typ === "rot" ? "var(--status-danger)" : "none" }} />
          )}
          <h2 style={{ fontSize: 21, fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            {a.nachname}, {a.vorname}
          </h2>
          <select value={status} onChange={e => statusAendern(e.target.value as AngehoerigerStatus)} aria-label="Status"
            style={{ fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "3px 10px", cursor: "pointer" }}>
            {(Object.keys(statusConfig) as AngehoerigerStatus[]).map(s => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
          <span className={`inline-flex items-center ${qual.bg} ${qual.text}`} style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>
            {qual.label}
          </span>

          {/* rechts: nur Abweichung (falls vorhanden) + Primäraktion */}
          <div className="flex items-center" style={{ gap: "var(--space-2)", marginLeft: "auto" }}>
            {kennzeichen.typ && (
              <span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: kennzeichen.typ === "rot" ? "var(--status-danger-bg)" : "var(--status-warning-bg)", color: kennzeichen.typ === "rot" ? "var(--status-danger)" : "var(--status-warning-text)" }}>
                <AlertTriangle style={{ width: 11, height: 11 }} /> {kennzeichen.grund}
              </span>
            )}
            <button onClick={() => navigate("/servicedesk")} className="inline-flex items-center cursor-pointer transition-colors"
              style={{ gap: 6, padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
              <Plus style={{ width: 14, height: 14 }} /> Neue Pendenz
            </button>
          </div>
        </div>

      </div>

      {/* ── Körperkarte um den gesamten Körper (Rahmen/Rundung/Hintergrund aus dem Assistenten) ── */}
      <div style={{ padding: "16px var(--space-6) 40px" }}>
        <div className="flex" style={{ border: "var(--border-thin) solid var(--border-default)", borderRadius: 10, background: "var(--bg-elevated)", alignItems: "flex-start" }}>
          {/* Linke Zustandsspalte — Zuständigkeit + Notizen; scrollt eigenständig; Trennlinie rechts */}
          <aside className="hidden lg:block shrink-0" style={{ width: 260, borderRight: "var(--border-thin) solid var(--border-default)", padding: "var(--space-4)", position: "sticky", top: 16, maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
            <LinkeSpalte a={a} />
          </aside>

          {/* Rechter Bereich: Reiterzeile + Inhalt */}
          <div className="flex-1 min-w-0" style={{ padding: "var(--space-4)" }}>
          <div style={{ borderBottom: "var(--border-thin) solid var(--border-default)" }}>
            <div className="flex overflow-x-auto flex-wrap" style={{ gap: 0, marginBottom: -1 }}>
              {profileTabs.map((t) => {
                const isActive = activeTab === t.id;
                const ticketCount = t.id === "pendenzen" ? tickets.filter((tk) => tk.status !== "erledigt").length : 0;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className="relative flex items-center whitespace-nowrap cursor-pointer transition-colors"
                    style={{ gap: "var(--space-2)", padding: "12px 14px", fontSize: "var(--text-body)", fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)", color: isActive ? "var(--brand-primary)" : "var(--text-secondary)", background: "transparent", border: "none" }}>
                    {t.label}
                    {t.id === "pendenzen" && ticketCount > 0 && (
                      <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-semibold)", background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>
                        {ticketCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute" style={{ bottom: -1, left: 8, right: 8, height: 2, background: "var(--brand-primary)", borderTopLeftRadius: "var(--radius-pill)", borderTopRightRadius: "var(--radius-pill)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reiter-Inhalt — Formularbereich auf FORMULAR_MAX begrenzt */}
          <div style={{ padding: "20px 0 0", maxWidth: FORMULAR_MAX }}>
            {activeTab === "ueberblick" && <TabUeberblick a={a} detail={detail} tickets={tickets} navigate={navigate} />}
            {activeTab === "stammdaten" && <TabStammdaten a={a} detail={detail} />}
            {activeTab === "anstellung" && <TabAnstellungLohn detail={detail} />}
            {activeTab === "qualifikation" && <TabQualifikation a={a} detail={detail} />}
            {activeTab === "einsatz" && <TabEinsatzKontrollen a={a} detail={detail} />}
            {activeTab === "rhythmus" && (
              <div style={{ padding: "var(--space-4) 0" }}>
                <RhythmusTimeline subjektTyp="angehoeriger" subjektId={a.id} aktuellerBenutzer={a.pflegefachkraft} />
              </div>
            )}
            {activeTab === "dokumente" && <TabDokumenteAngehoerige a={a} />}
            {activeTab === "pendenzen" && <TabTickets tickets={tickets} navigate={navigate} />}
            {activeTab === "historie" && <TabHistorie />}
          </div>
        </div>
        </div>
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
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 4, fontWeight: "var(--weight-medium)" }}>
        {label}
      </div>
      <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", fontFamily: mono ? "monospace" : "inherit" }}>
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
  // Lesezustand: rahmenlos wie im Assistenten — Überschrift, Felder, Trennlinie
  // zwischen den Abschnitten (letzter Abschnitt ohne Linie).
  if (!editing) {
    return (
      <div className="border-b border-border-light pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-primary" />
          <h5 className="text-foreground flex-1">{title}</h5>
          {editable && (
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer" style={{ fontWeight: 450 }}>
              <Pencil className="w-3 h-3" /> Bearbeiten
            </button>
          )}
        </div>
        {children}
      </div>
    );
  }
  // Bearbeitungszustand: Rahmen + getönte Kopfzeile; Aktionen am Fuss.
  return (
    <div className="rounded-2xl border border-primary/30 shadow-sm mb-5 last:mb-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light flex items-center gap-2" style={{ background: "var(--brand-primary-light)" }}>
        <Icon className="w-4 h-4 text-primary" />
        <h5 className="text-foreground flex-1">{title}</h5>
      </div>
      <div className="p-5">{children}</div>
      <div className="px-5 py-3 border-t border-border-light flex items-center justify-end gap-2">
        <button onClick={onCancel} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer" style={{ fontWeight: 450 }}>
          <X className="w-3 h-3" /> Abbrechen
        </button>
        <button onClick={onSave} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
          <Check className="w-3 h-3" /> Sichern
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ÜBERBLICK
   ══════════════════════════════════════════ */
function TabStammdaten({ a, detail }: { a: Angehoeriger; detail: AngehoerigerDetail }) {
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
  const [mobil, setMobil] = useState(detail.mobil);
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
  const [kinderList, setKinderList] = useState<KindEntry[]>(detail.kinder.map(k => ({ ...k })));
  const [kinderZulagenSpitex, setKinderZulagenSpitex] = useState(detail.kinderzulagenUeberSpitex);
  const [familienAk, setFamilienAk] = useState(detail.familienausgleichskasse);

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
      setSnapshot({ vorname, nachname, geschlecht, geburtsdatum, ahvNummer, nationalitaet, heimatort, aufenthaltsstatus, zivilstand, zivilstandSeit, strasse, plz, ort, email, telefon, mobil, kkName, kkNummer });
    } else if (section === "steuer") {
      setSnapshot({ quellensteuer, konfession, qsTarif, steuergemeinde, sozialamtInvolviert, sozialamtKontakt, lohnabtretung });
    } else if (section === "partner") {
      setSnapshot({ partnerName, partnerGeb, partnerAhv, partnerZemis, partnerAufenthalt });
    } else if (section === "kinder") {
      setSnapshot({ kinderZulagenSpitex, familienAk, _kinder: JSON.stringify(kinderList) });
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
      setEmail(snapshot.email ?? email); setTelefon(snapshot.telefon ?? telefon); setMobil(snapshot.mobil ?? mobil);
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
    }
    setEditingSection(null);
  };

  const saveEdit = () => { setEditingSection(null); };
  const isEd = (s: string) => editingSection === s;
  const inputClass = "w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all";

  /* Kinder helpers — genau ein Weg, ein leeres Kind zu erzeugen: createEmptyKind() */
  const addKind = () => setKinderList([...kinderList, { ...createEmptyKind(), zulagenart: "K" }]);
  const removeKind = (id: string) => setKinderList(kinderList.filter(k => k.id !== id));
  const updateKind = (id: string, field: keyof KindEntry, value: string) => setKinderList(kinderList.map(k => k.id === id ? ({ ...k, [field]: value } as KindEntry) : k));

  return (
    <div>
        {/* 1. Personalien */}
        <SectionCard title="Personalien" icon={User} editable editing={isEd("personalien")} onEdit={() => startEdit("personalien")} onSave={saveEdit} onCancel={() => cancelEdit("personalien")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Adresse</div>
            {isEd("personalien") ? (
              <AdressBlock
                wert={{ strasse, plz, ort }}
                onChange={patch => {
                  if (patch.strasse !== undefined) setStrasse(patch.strasse);
                  if (patch.plz !== undefined) setPlz(patch.plz);
                  if (patch.ort !== undefined) setOrt(patch.ort);
                }} />
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="text-[13px] text-foreground">{adresseAnzeige(strasse, plz, ort) || "—"}</div>
              </div>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-border-light">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Erreichbarkeit</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEd("personalien") ? (
                <>
                  <EditableField label="E-Mail" value={email} editing type="email" onChange={setEmail} />
                  <EditableField label="Telefon (Festnetz)" value={telefon} editing type="tel" onChange={setTelefon} />
                  <EditableField label="Mobil" value={mobil} editing type="tel" onChange={setMobil} />
                </>
              ) : (
                <>
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
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Telefon (Festnetz)</div>
                      <div className="text-[13px] text-primary">{telefon || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Mobil</div>
                      <div className="text-[13px] text-primary">{mobil || "—"}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              <DateField wertFormat="display" bereich="past" value={k.geburtsdatum || null} onChange={v => updateKind(k.id, "geburtsdatum", (v as string) ?? "")} />
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
                                <option value="K">{ZULAGENART_LABEL.K}</option>
                                <option value="W">{ZULAGENART_LABEL.W}</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${k.zulagenart === "K" ? "bg-info-light text-info-foreground" : "bg-warning-light text-warning-foreground"}`} style={{ fontWeight: 500 }}>
                                {zulagenartLabel(k.zulagenart)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isEd("kinder") ? (
                              <DateField wertFormat="display" bereich="any" value={k.ausbildungsbeginn || null} onChange={v => updateKind(k.id, "ausbildungsbeginn", (v as string) ?? "")} />
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

      </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ÜBERBLICK — Zustandsansicht (read-only)
   ══════════════════════════════════════════ */
/** Aktive Bewilligung — statischer Mock (wie TableStempel, nicht personenspezifisch). */
const UEBERBLICK_AKTIVE_BEWILLIGUNG = { version: 3, taeglicheMin: 120, tageProWoche: 5, gueltigAb: "01.01.2026", gueltigBis: "–" };

/** Zustandskachel; getönte Fläche + farbiger Wert nur bei Abweichung (Farbe nie allein). */
function KachelKarte({ icon: Icon, titel, abweichung, children }: { icon: React.ElementType; titel: string; abweichung?: "rot" | "gelb" | null; children: React.ReactNode }) {
  const ton = abweichung ?? null;
  const rand = ton === "rot" ? "var(--status-danger)" : ton === "gelb" ? "var(--status-warning)" : "var(--border-default)";
  const flaeche = ton === "rot" ? "var(--status-danger-bg)" : ton === "gelb" ? "var(--status-warning-bg)" : "var(--bg-elevated)";
  return (
    <div style={{ background: flaeche, border: `var(--border-thin) solid ${rand}`, borderRadius: "var(--radius-card)", padding: 12 }}>
      <div className="flex items-center" style={{ gap: 6, marginBottom: 8, fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
        <Icon style={{ width: 13, height: 13 }} /> {titel}
      </div>
      {children}
    </div>
  );
}

function TabUeberblick({ a, detail, tickets, navigate }: { a: Angehoeriger; detail: AngehoerigerDetail; tickets: Ticket[]; navigate: (path: string) => void }) {
  const ms = a.monatsSchritt;
  const offenePendenzen = tickets.filter(t => t.status !== "erledigt");
  const srkTon: "rot" | "gelb" | null = detail.srkStatus === "ueberfaellig" ? "rot" : detail.srkStatus === "offen" ? "gelb" : null;
  const srkLabel = detail.srkStatus === "abgeschlossen" ? "Abgeschlossen" : detail.srkStatus === "ueberfaellig" ? "Überfällig" : "Offen";
  const leer = (v: string | undefined | null) => (v && v !== "—" ? v : "—");

  const patientenZeilen = a.zugeordnetePatientenList.map(zp => {
    const p = patients.find(pt => pt.id === zp.id);
    return { id: zp.id, name: zp.name, schweregrad: p?.schweregrad ?? null, status: p?.status ?? null, beginn: p?.aufnahmeDatum ?? null };
  });
  type PatientZeile = typeof patientenZeilen[number];
  const patientenSpalten: SpalteDef<PatientZeile>[] = [
    { id: "name", label: "Patient", minCh: 18, maxSpur: "28ch", align: "left", sortierbar: true, ausKarte: true,
      render: p => <button onClick={e => { e.stopPropagation(); navigate(`/patienten/${p.id}`); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", color: "var(--brand-primary)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}><ExternalLink style={{ width: 11, height: 11, opacity: 0.6 }} />{p.name}</button> },
    { id: "schweregrad", label: "Schweregrad", minCh: 12, maxSpur: "14ch", align: "left", sortierbar: true,
      render: p => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{p.schweregrad ?? "—"}</span> },
    { id: "status", label: "Status", minCh: 10, maxSpur: "18ch", align: "left", sortierbar: true, abwerfRang: 1,
      render: p => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{p.status ?? "—"}</span> },
    { id: "beginn", label: "Betreuungsbeginn", minCh: 15, maxSpur: "15ch", align: "left", sortierbar: true, abwerfRang: 2,
      render: p => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{p.beginn ?? "—"}</span> },
  ];

  const pendenzSpalten: SpalteDef<Ticket>[] = [
    { id: "prio", label: "", festBreitePx: 26, align: "center", sortierbar: true, ausKarte: true,
      render: t => t.priority === "hoch" ? <AlertTriangle role="img" aria-label="Hohe Priorität" style={{ width: 14, height: 14, color: "var(--status-danger)" }} /> : <span style={{ color: "var(--text-tertiary)" }}>·</span> },
    { id: "subject", label: "Betreff", minCh: 20, maxSpur: "44ch", align: "left", sortierbar: true, ausKarte: true,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{t.subject}</span> },
    { id: "category", label: "Art", minCh: 10, maxSpur: "13ch", align: "left", sortierbar: true, abwerfRang: 1,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{t.category}</span> },
    { id: "created", label: "Fälligkeit", minCh: 12, maxSpur: "12ch", align: "left", sortierbar: true, abwerfRang: 2,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{isoZuAnzeige(anzeigeZuIso(t.created))}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KachelKarte icon={ListChecks} titel="Monatsschritt" abweichung={ms.ueberfaellig ? "rot" : null}>
          <div style={{ fontSize: 16, fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{leer(ms.label)}</div>
          <div style={{ fontSize: "var(--text-meta)", color: ms.ueberfaellig ? "var(--status-danger)" : "var(--text-secondary)", marginTop: 2 }}>Schritt {ms.aktuell} von {ms.total}{ms.faellig ? ` · fällig ${ms.faellig}` : ""}{ms.ueberfaellig ? " · überfällig" : ""}</div>
          <div className="mt-2 rounded-full overflow-hidden" style={{ height: 3, background: "var(--bg-secondary)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ms.total ? ((ms.abgeschlossen ? ms.total : Math.max(0, ms.aktuell - 1)) / ms.total) * 100 : 0)}%`, background: ms.ueberfaellig ? "var(--status-danger)" : "var(--brand-primary)" }} />
          </div>
        </KachelKarte>

        <KachelKarte icon={Award} titel="SRK-Kurs" abweichung={srkTon}>
          <div style={{ fontSize: 16, fontWeight: "var(--weight-medium)", color: srkTon === "rot" ? "var(--status-danger)" : srkTon === "gelb" ? "var(--status-warning-text)" : "var(--text-primary)" }}>{srkLabel}</div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>{detail.srkStatus === "abgeschlossen" ? `Abgeschlossen ${leer(detail.srkAbgeschlossenAm)}` : `Frist ${leer(detail.srkDeadline)}`} · {qualifikationConfig[a.qualifikation].label}</div>
        </KachelKarte>

        <KachelKarte icon={Headphones} titel="Offene Pendenzen" abweichung={offenePendenzen.some(t => t.priority === "hoch") ? "gelb" : null}>
          <div style={{ fontSize: 16, fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{offenePendenzen.length}</div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>{offenePendenzen.filter(t => t.priority === "hoch").length} mit hoher Priorität</div>
        </KachelKarte>
      </div>

      <div>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
          <Users style={{ width: 15, height: 15, color: "var(--brand-primary)" }} />
          <h5 className="text-foreground">Betreute Patienten</h5>
        </div>
        <DataTable<PatientZeile>
          spalten={patientenSpalten}
          zeilen={patientenZeilen}
          zeilenKey={p => p.id}
          onZeileKlick={p => navigate(`/patienten/${p.id}`)}
          karteTitel={p => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{p.name}</span>}
          containerHaltepunkte
          karteAbPx={560}
          leerText="Keine Patienten zugeordnet."
        />
      </div>

      <div>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
          <Headphones style={{ width: 15, height: 15, color: "var(--brand-primary)" }} />
          <h5 className="text-foreground">Offene Pendenzen</h5>
        </div>
        <DataTable<Ticket>
          spalten={pendenzSpalten}
          zeilen={offenePendenzen}
          zeilenKey={t => t.id}
          onZeileKlick={() => navigate("/servicedesk")}
          karteTitel={t => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{t.subject}</span>}
          containerHaltepunkte
          karteAbPx={560}
          fusszeile={<button onClick={() => navigate("/servicedesk")} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", color: "var(--brand-primary)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}><ExternalLink style={{ width: 12, height: 12 }} /> Alle Pendenzen anzeigen</button>}
          leerText="Keine offenen Pendenzen."
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ANSTELLUNG & LOHN
   ══════════════════════════════════════════ */
function TabAnstellungLohn({ detail }: { detail: AngehoerigerDetail }) {
  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});
  const [funktion, setFunktion] = useState(detail.funktion);
  const [eintrittsdatum, setEintrittsdatum] = useState(detail.eintrittsdatum);
  const [stundenlohn, setStundenlohn] = useState(detail.stundenlohn);
  const [bankname, setBankname] = useState(detail.bankname);
  const [iban, setIban] = useState(detail.iban);

  const start = () => { setSnapshot({ funktion, eintrittsdatum, stundenlohn, bankname, iban }); setEditing(true); };
  const cancel = () => {
    setFunktion(snapshot.funktion ?? funktion); setEintrittsdatum(snapshot.eintrittsdatum ?? eintrittsdatum);
    setStundenlohn(snapshot.stundenlohn ?? stundenlohn); setBankname(snapshot.bankname ?? bankname);
    setIban(snapshot.iban ?? iban); setEditing(false);
  };

  return (
    <div>
      <SectionCard title="Anstellung & Auszahlung" icon={Briefcase} editable editing={editing} onEdit={start} onSave={() => setEditing(false)} onCancel={cancel}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableField label="Funktion" value={funktion} editing={editing} onChange={setFunktion} />
          <EditableField label="Eintrittsdatum" value={eintrittsdatum} editing={editing} onChange={setEintrittsdatum} />
          <EditableField label="Stundenlohn" value={editing ? stundenlohn : (stundenlohn ? `CHF ${stundenlohn}` : "—")} editing={editing} onChange={setStundenlohn} />
        </div>
        <div className="mt-5 pt-4 border-t border-border-light">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Bankverbindung</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
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

      {/* Bereich aus den bisherigen Related Lists (Lohnsumme, Quellensteuer-Tarif u.a.)
          — vorläufig unverändert; Zusammenführung folgt in Lauf 2/3. */}
      <TableSozial detail={detail} />
    </div>
  );
}

/* Schulungsnachweise — geteilter Block (Reiter Qualifikation). */
function SchulungsnachweiseListe({ a }: { a: Angehoeriger }) {
  const navigate = useNavigate();
  const nachweise = getNachweiseFuerAngehoeriger(a.id);
  if (nachweise.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>Schulungsnachweise</div>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {nachweise.map(n => (
          <div key={n.id} className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/schulungsnachweis/${n.id}`)} style={{ padding: "12px 16px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>Initialschulung — Patient {n.patientName}</div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2 }}>{n.unterschriften.length} von {n.positionen.length} Positionen unterschrieben</div>
            </div>
            <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: n.status === "abgeschlossen" ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: n.status === "abgeschlossen" ? "var(--status-success)" : "var(--status-warning-text)" }}>
              {n.status === "abgeschlossen" ? "Abgeschlossen" : "In Bearbeitung"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: QUALIFIKATION
   ══════════════════════════════════════════ */
function TabQualifikation({ a, detail }: { a: Angehoeriger; detail: AngehoerigerDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <TableQualifikation detail={detail} />
      <SchulungsnachweiseListe a={a} />
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: EINSATZ & KONTROLLEN
   ══════════════════════════════════════════ */
function TabEinsatzKontrollen({ a, detail }: { a: Angehoeriger; detail: AngehoerigerDetail }) {
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const kontrollen = getKontrollenFuerAngehoeriger(a.id);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <TableStempel />
      <ArbeitskontrolleHistorie a={a} detail={detail} kontrollen={kontrollen} navigate={navigate} onRefresh={() => forceUpdate(n => n + 1)} />
    </div>
  );
}

/* ══════════════════════════════════════════
   ARBEITSKONTROLLE HISTORIE
   ══════════════════════════════════════════ */

function ArbeitskontrolleHistorie({ a, detail, kontrollen, navigate, onRefresh }: {
  a: Angehoeriger;
  detail: AngehoerigerDetail;
  kontrollen: ReturnType<typeof getKontrollenFuerAngehoeriger>;
  navigate: ReturnType<typeof useNavigate>;
  onRefresh: () => void;
}) {
  // Eintrittsdatum in ISO konvertieren
  const parts = detail.eintrittsdatum?.split(".") ?? [];
  const isoEintritt = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : undefined;
  const naechsteFaellig = getNaechsteFaelligkeit(a.id, isoEintritt);
  const heute = new Date().toISOString().slice(0, 10);
  const istUeberfaellig = naechsteFaellig ? naechsteFaellig < heute : false;
  const hatOffene = kontrollen.some(k => k.status === "in_bearbeitung");

  const neueKontrolleErstellen = (art: KontrolleArt) => {
    const patienten = a.zugeordnetePatientenList;
    const patientId = patienten.length > 0 ? patienten[0].id : null;
    const patientName = patienten.length > 0 ? patienten[0].name : null;
    const k = erstelleKontrolle(a.id, `${a.vorname} ${a.nachname}`, a.pflegefachkraft, patientId, patientName, art);
    onRefresh();
    navigate(`/arbeitskontrolle/${k.id}`);
  };

  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
      {/* Kopf: Titel + Zähler + Fälligkeit, Aktionen */}
      <div className="px-5 py-4 border-b border-border-light flex items-start justify-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Stamp className="w-4 h-4 text-primary" />
            <h5 className="text-foreground">Arbeitskontrollen</h5>
            {kontrollen.length > 0 && (
              <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>{kontrollen.length}</span>
            )}
          </div>
          {naechsteFaellig && (
            <div className="inline-flex items-center" style={{ gap: 5, marginTop: 5, fontSize: "var(--text-meta)", fontWeight: istUeberfaellig ? 500 : 400, color: istUeberfaellig ? "var(--status-danger)" : "var(--text-tertiary)" }}>
              {istUeberfaellig ? <AlertTriangle style={{ width: 13, height: 13 }} /> : <Calendar style={{ width: 13, height: 13 }} />}
              Nächste fällig {isoZuAnzeige(naechsteFaellig)}{istUeberfaellig && " · überfällig"}
            </div>
          )}
        </div>
        <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
          <button onClick={() => neueKontrolleErstellen("regulaer")} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors" style={{ gap: 5, padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}>
            <Plus style={{ width: 14, height: 14 }} /> Reguläre Kontrolle
          </button>
          <button onClick={() => neueKontrolleErstellen("ausserordentlich")} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors" style={{ gap: 5, padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "var(--border-thin) solid var(--border-default)" }}>
            <Plus style={{ width: 14, height: 14 }} /> Ausserordentlich
          </button>
        </div>
      </div>

      {/* Liste */}
      {kontrollen.length === 0 ? (
        <div className="text-center" style={{ padding: "var(--space-8) var(--space-6)" }}>
          <Stamp className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-tertiary)", opacity: 0.4 }} />
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Noch keine Arbeitskontrollen durchgeführt.</p>
        </div>
      ) : (
        <div>
          {kontrollen.map(k => {
            const fertig = k.status === "abgeschlossen";
            const sigVoll = k.unterschriften.length >= 2;
            return (
              <div key={k.id} className="flex items-stretch border-b border-border-light last:border-b-0 transition-colors hover:bg-secondary/40" style={{ cursor: "pointer" }} onClick={() => navigate(`/arbeitskontrolle/${k.id}`)}>
                {/* Status-Akzent links (Form + Farbe) */}
                <span aria-hidden="true" style={{ width: 3, flexShrink: 0, background: fertig ? "var(--status-success)" : "var(--status-warning)" }} />
                <div className="flex items-center justify-between flex-1" style={{ gap: 12, padding: "12px 16px", minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{isoZuAnzeige(k.kontrollDatum)}</span>
                      {k.art === "ausserordentlich" && (
                        <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", background: "var(--status-info-bg)", color: "var(--status-info)", fontWeight: "var(--weight-medium)" }}>Ausserordentlich</span>
                      )}
                    </div>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 3, overflowWrap: "anywhere" }}>
                      {k.fallfuehrendeName}{k.patientName ? ` · ${k.patientName}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center shrink-0" style={{ gap: 10 }}>
                    {/* Unterschriften-Indikator */}
                    <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: sigVoll ? "var(--status-success-text)" : "var(--text-tertiary)" }} title={`${k.unterschriften.length} von 2 Unterschriften`}>
                      {sigVoll ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", border: "1.5px solid var(--text-tertiary)" }} />}
                      {k.unterschriften.length}/2
                    </span>
                    {/* PDF-Export */}
                    {fertig && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const blob = await exportiereArbeitskontrollePDF(k);
                          const url = URL.createObjectURL(blob);
                          const anchor = document.createElement("a"); anchor.href = url; anchor.download = `Arbeitskontrolle_${k.kontrollDatum}.pdf`;
                          document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor); URL.revokeObjectURL(url);
                        }}
                        className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
                        style={{ gap: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", border: "var(--border-thin) solid var(--border-default)" }}
                      >
                        <FileText style={{ width: 12, height: 12 }} /> PDF
                      </button>
                    )}
                    {/* Status-Pille (Icon + Text, nie Farbe allein) */}
                    <span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap", background: fertig ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: fertig ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                      {fertig ? <Check style={{ width: 12, height: 12 }} /> : <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-warning)" }} />}
                      {fertig ? "Abgeschlossen" : "In Bearbeitung"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  // Bewilligungs-Historie als geteilte DataTable (Datum über die Datumsschicht; Leerwerte ans Ende).
  const bewLeer = (s: string) => !s || s === "–" || !s.includes(".");
  const bewDatum = (s: string) => bewLeer(s) ? "–" : isoZuAnzeige(anzeigeZuIso(s));
  const bewDatumSort = (a: string, b: string, f: number) => {
    const la = bewLeer(a), lb = bewLeer(b);
    if (la && lb) return 0; if (la) return 1; if (lb) return -1;
    return f * anzeigeZuIso(a).localeCompare(anzeigeZuIso(b));
  };
  const sortBewilligung = (list: Bewilligung[], key: string, dir: "asc" | "desc") => {
    const f = dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (key) {
        case "version": return f * (a.id - b.id);
        case "gueltigab": return bewDatumSort(a.gueltigAb, b.gueltigAb, f);
        case "gueltigbis": return bewDatumSort(a.gueltigBis, b.gueltigBis, f);
        case "mintag": return f * (a.taeglicheMin - b.taeglicheMin);
        case "aleist": return f * (a.minutenA - b.minutenA);
        case "bleist": return f * (a.minutenB - b.minutenB);
        case "gesamt": return f * (a.taeglicheMin * a.tageProWoche - b.taeglicheMin * b.tageProWoche);
        default: return 0;
      }
    });
  };
  const [histSort, setHistSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const histToggle = (key: string) => setHistSort(s => s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const histSortiert = histSort ? sortBewilligung(historie, histSort.key, histSort.dir) : historie;
  const bewSpalten: SpalteDef<Bewilligung>[] = [
    { id: "version", label: "Version", minCh: 7, maxSpur: "8ch", align: "left", sortierbar: true, ausKarte: true,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>V{b.id}</span> },
    { id: "gueltigab", label: "Gültig ab", minCh: 10, maxSpur: "12ch", align: "left", sortierbar: true, ausKarte: true,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{bewDatum(b.gueltigAb)}</span> },
    { id: "gueltigbis", label: "Gültig bis", minCh: 10, maxSpur: "12ch", align: "left", sortierbar: true,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{bewDatum(b.gueltigBis)}</span> },
    { id: "mintag", label: "Min / Tag", minCh: 9, maxSpur: "9ch", align: "right", sortierbar: true, abwerfRang: 4,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>{b.taeglicheMin}</span> },
    { id: "aleist", label: "A-Leist.", minCh: 8, maxSpur: "8ch", align: "right", sortierbar: true, abwerfRang: 1,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--brand-primary)", fontVariantNumeric: "tabular-nums" }}>{b.minutenA}</span> },
    { id: "bleist", label: "B-Leist.", minCh: 8, maxSpur: "8ch", align: "right", sortierbar: true, abwerfRang: 2,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--status-success)", fontVariantNumeric: "tabular-nums" }}>{b.minutenB}</span> },
    { id: "gesamt", label: "Gesamt / Wo.", minCh: 12, maxSpur: "12ch", align: "right", sortierbar: true, abwerfRang: 3,
      render: b => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>{b.taeglicheMin * b.tageProWoche}</span> },
    { id: "status", label: "Status", minCh: 10, maxSpur: "13ch", align: "left", sortierbar: true,
      render: () => <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--bg-secondary)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Abgelaufen</span> },
  ];
  const bewKarteTitel = (b: Bewilligung) => (
    <div className="flex items-center justify-between" style={{ gap: 8, width: "100%", minWidth: 0 }}>
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>V{b.id}</span>
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{bewDatum(b.gueltigAb)} – {bewDatum(b.gueltigBis)}</span>
    </div>
  );

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

      {/* ═══ Absenzen ═══ */}
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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
  const [kinder, setKinder] = useState<KindEntry[]>(detail.kinder.map(k => ({ ...k })));

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
    setKinder((prev) => [...prev, { ...createEmptyKind(), zulagenart: "K" }]);
  };

  const updateKind = (id: string, field: keyof KindEntry, value: string) => {
    setKinder((prev) => prev.map((k) => k.id === id ? ({ ...k, [field]: value } as KindEntry) : k));
  };

  const handleCancel = () => {
    setKinderzulagenAktiv(detail.kinderzulagenAktiv);
    setKinderzulagenUeberSpitex(detail.kinderzulagenUeberSpitex);
    setKinder(detail.kinder.map(k => ({ ...k })));
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
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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
                              <DateField wertFormat="display" bereich="past" value={k.geburtsdatum || null} onChange={v => updateKind(k.id, "geburtsdatum", (v as string) ?? "")} />
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
                                <option value="K">{ZULAGENART_LABEL.K}</option>
                                <option value="W">{ZULAGENART_LABEL.W}</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${k.zulagenart === "K" ? "bg-info-light text-info-foreground" : "bg-warning-light text-warning-foreground"}`} style={{ fontWeight: 500 }}>
                                {zulagenartLabel(k.zulagenart)}
                              </span>
                            )}
                          </td>
                          {/* Ausbildungsbeginn */}
                          <td className="px-3 py-2.5">
                            {isEditing && k.zulagenart === "W" ? (
                              <DateField wertFormat="display" bereich="any" value={k.ausbildungsbeginn || null} onChange={v => updateKind(k.id, "ausbildungsbeginn", (v as string) ?? "")} />
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
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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

      {/* ═══ BLOCK 3: Arbeits-/Aufenthaltsstatus ═══ */}
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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
                <DateField wertFormat="display" bereich="any" value={deadline || null} onChange={v => setDeadline((v as string) ?? "")} />
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
                <DateField
                  wertFormat="display"
                  bereich="past"
                  value={abgeschlossenAm && abgeschlossenAm !== "—" ? abgeschlossenAm : null}
                  onChange={v => setAbgeschlossenAm((v as string) ?? "")}
                  disabled={status !== "abgeschlossen"}
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
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
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
// Zugewiesen: Kürzel aus dem Namen (wie die Initialen-Spalten der vier Listen), voller Name im title.
function ticketKuerzel(name: string): string {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return "–";
  if (teile.length === 1) return teile[0].slice(0, 2).toUpperCase();
  return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase();
}
const TICKET_STATUS_RANK: Record<string, number> = { offen: 0, in_bearbeitung: 1, erledigt: 2 };
const TICKET_PRIO_RANK: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
function sortTickets(list: Ticket[], key: string, dir: "asc" | "desc"): Ticket[] {
  const f = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "id": return f * a.id.localeCompare(b.id, "de");
      case "subject": return f * a.subject.localeCompare(b.subject, "de");
      case "category": return f * a.category.localeCompare(b.category, "de");
      case "priority": return f * ((TICKET_PRIO_RANK[a.priority] ?? 0) - (TICKET_PRIO_RANK[b.priority] ?? 0));
      case "status": return f * ((TICKET_STATUS_RANK[a.status] ?? 0) - (TICKET_STATUS_RANK[b.status] ?? 0));
      case "created": return f * anzeigeZuIso(a.created).localeCompare(anzeigeZuIso(b.created));
      case "assignedTo": return f * a.assignedTo.localeCompare(b.assignedTo, "de");
      default: return 0;
    }
  });
}

function TabTickets({ tickets, navigate }: { tickets: Ticket[]; navigate: (path: string) => void }) {
  // Nur die Abweichung trägt Farbe/Fläche; Regelzustände sind stiller Text (wie in den vier Listen).
  const STATUS_CFG: Record<Ticket["status"], { label: string; dot: string; color: string; weight: string }> = {
    offen: { label: "Offen", dot: "var(--text-tertiary)", color: "var(--text-secondary)", weight: "var(--weight-regular)" },
    in_bearbeitung: { label: "In Bearbeitung", dot: "var(--status-warning)", color: "var(--status-warning-text)", weight: "var(--weight-medium)" },
    erledigt: { label: "Erledigt", dot: "var(--status-success)", color: "var(--text-tertiary)", weight: "var(--weight-regular)" },
  };
  const PRIO_CFG: Record<Ticket["priority"], { label: string; color: string; weight: string }> = {
    hoch: { label: "Hoch", color: "var(--status-danger)", weight: "var(--weight-medium)" },
    mittel: { label: "Mittel", color: "var(--text-secondary)", weight: "var(--weight-regular)" },
    niedrig: { label: "Niedrig", color: "var(--text-secondary)", weight: "var(--weight-regular)" },
  };
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const toggleSort = (key: string) => setSort(s => s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const sorted = sort ? sortTickets(tickets, sort.key, sort.dir) : tickets;

  // Spalten am längsten realen Wert bemessen (kein Detailbereich → kein Ellipsis, §148).
  const spalten: SpalteDef<Ticket>[] = [
    { id: "id", label: "Ticket-ID", minCh: 13, maxSpur: "14ch", align: "left", sortierbar: true, ausKarte: true,
      render: t => <span className="font-mono" style={{ fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>{t.id}</span> },
    { id: "subject", label: "Betreff", minCh: 24, maxSpur: "48ch", align: "left", sortierbar: true, ausKarte: true,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{t.subject}</span> },
    { id: "category", label: "Kategorie", minCh: 10, maxSpur: "13ch", align: "left", sortierbar: true, abwerfRang: 1,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{t.category}</span> },
    { id: "priority", label: "Priorität", minCh: 11, maxSpur: "11ch", align: "left", sortierbar: true,
      render: t => { const p = PRIO_CFG[t.priority]; return <span style={{ fontSize: "var(--text-small)", color: p.color, fontWeight: p.weight, whiteSpace: "nowrap" }}>{p.label}</span>; } },
    { id: "status", label: "Status", minCh: 15, maxSpur: "18ch", align: "left", sortierbar: true,
      render: t => { const s = STATUS_CFG[t.status]; return <span className="inline-flex items-center" style={{ gap: 6, minWidth: 0 }}><span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: s.dot, flexShrink: 0 }} /><span style={{ fontSize: "var(--text-small)", color: s.color, fontWeight: s.weight, whiteSpace: "nowrap" }}>{s.label}</span></span>; } },
    { id: "created", label: "Erstellt", minCh: 12, maxSpur: "12ch", align: "left", sortierbar: true, abwerfRang: 3,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{isoZuAnzeige(anzeigeZuIso(t.created))}</span> },
    { id: "assignedTo", label: "Zugewiesen", minCh: 10, maxSpur: "10ch", align: "left", sortierbar: true, abwerfRang: 2,
      render: t => <span title={t.assignedTo} style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>{ticketKuerzel(t.assignedTo)}</span> },
  ];
  const karteTitel = (t: Ticket) => (
    <div className="flex items-center" style={{ gap: 8, width: "100%", minWidth: 0 }}>
      <span className="font-mono" style={{ fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)", flexShrink: 0 }}>{t.id}</span>
      <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{t.subject}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">Tickets für diesen Angehörigen</h5>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground" style={{ fontWeight: 500 }}>{tickets.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/servicedesk")}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Neue Pendenz
          </button>
          <button
            onClick={() => navigate("/servicedesk")}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            Pendenzenliste öffnen
          </button>
        </div>
      </div>

      <DataTable<Ticket>
        spalten={spalten}
        zeilen={sorted}
        zeilenKey={t => t.id}
        onZeileKlick={() => navigate("/servicedesk")}
        sort={sort ?? undefined}
        onSort={toggleSort}
        karteTitel={karteTitel}
        containerHaltepunkte
        karteAbPx={640}
        fusszeile={tickets.length > 0 ? <span>{tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}</span> : undefined}
        leerText="Für diesen Angehörigen sind keine Pendenzen erfasst."
      />
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

      <div className="rounded-2xl overflow-hidden">
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
