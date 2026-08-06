import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { AnnaPatientSummary } from "../anna/AnnaPatientSummary";
import { InlineSelect } from "./ui/InlineSelect";
import { KRANKENKASSEN_OPTIONS, getKrankenkasseLabel } from "../../lib/stammdaten/krankenkassen";
import {
  MANDATSART_OPTIONS, GESETZESGRUNDLAGE_OPTIONS, MANDATSGRUND_OPTIONS,
  mandatsartLabel, gesetzesgrundlageLabel, mandatsgrundLabel,
} from "../../lib/stammdaten/mandat";
import {
  TARIF_KATEGORIEN, tarifgrundlage, normkosten, chf,
} from "../../lib/stammdaten/pflegetarife";
import {
  istAktiv, m1FehlendeVersicherung, m2Ueberschneidungen, m3VerknuepfungFehlt, type Mandat,
} from "../../lib/mandate/mandate";
import {
  useMandate, aktualisiereMandat, verknuepftePatienten, MANDAT_STICHTAG,
} from "../../lib/mandate/store";
import { getAngehoerige } from "../../lib/angehoerige/store";
import { entscheidLabel } from "../../lib/stammdaten/entscheid";
import {
  verordnungZustand, verordnungsartLabel, entscheidAnzeige, tageSeitEinreichung,
  tageBisAblauf, kgsDecktAm, v3GrundFehlt, lueckenBerechnen, offeneLuecke,
  ausAnzeigedatum, alsAnzeigedatum,
  type Verordnung, type Kostengutsprache, type Luecke,
} from "../../lib/mandate/verordnungen";
import {
  useVerordnungen, useKostengutsprachen, aktualisiereVerordnung, aktualisiereKostengutsprache,
} from "../../lib/mandate/verordnungen-store";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { isoZuAnzeige, anzeigeZuIso, formatAnzeige, formatDatumZeit } from "../../lib/datum";
import {
  ArrowLeft,
  Phone,
  FileText,
  Activity,
  Clock,
  User,
  Edit3,
  MoreHorizontal,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Timer,
  Shield,

  ClipboardList,
  CalendarDays,
  Headphones,
  Stamp,
  FileClock,

  ListChecks,
  Table2,
  LayoutDashboard,
  History,
  Wifi,
  WifiOff,
  Save,
  RefreshCw,
  Calendar,
  ChevronUp,
  UserCircle,
  Check,
  Mail,
  ArrowRight,
  Heart,
  Stethoscope,
  MapPin,
  Users,
  X,
  Pencil,
  Eye,
  EyeOff,
  Info,
  CalendarOff,
  MessageSquare,
  Mic,
  Trash2,
  HeartPulse,
} from "lucide-react";
import { VitaldatenTab } from "./vitaldaten/VitaldatenTab";
import {
  statusConfig,
  schweregradConfig,
  abrechnungsStatusConfig,
  type Patient,
} from "./patientData";
import { usePatienten, getPatient, aktualisierePatient, tageBisReAssessment } from "../../lib/patienten/store";
import { StatusModal } from "./StatusModal";
import { TabDokumente } from "./TabDokumente";
import { DetailNavigation } from "./DetailNavigation";
import { MOCK_ASSESSMENTS, MOCK_PFLEGEPLANUNGEN, MOCK_KLV_VERORDNUNGEN, ANNA_DIAGNOSEN, ANNA_MASSNAHMEN, ANNA_ZIELE } from "../../lib/mocks/klinische-artefakte-mock";
import { KLV_STATUS_PIPELINE, getArtefaktContainer, type KLVVerordnung } from "../../types/klinische-artefakte";
import { hProWoche, berechneSummen, einheitLabel } from "../../lib/klv/berechnung";
import { toast } from "sonner";
import { useRecording } from "../recording/RecordingContext";
import { getPersonByPatientId } from "../../lib/interrai/store";
import { AssessmentStatusView } from "./interrai-neu/AssessmentStatusView";
import { DateField } from "./form/DateField";
import { TabHeader, HeaderMeta } from "./ui/TabHeader";
import { ItemRow } from "./ui/ItemRow";
import { RhythmusTimeline } from "./rhythmus/RhythmusTimeline";
import { generiereRhythmusTickets } from "../../lib/rhythmus/engine";
import { getNachweiseFuerPatient } from "../../lib/schulung/nachweis-store";
import "../../lib/schulung/demo-seed";
import { BezugspersonFeld } from "./BezugspersonFeld";
import { AppButton } from "./ui/AppButton";
import { StatusMarke, type StatusMarkeVariante } from "./ui/StatusMarke";

/** Map the existing Tailwind bg class of a status config to a semantic StatusMarke variant. */
function bgZuVariante(bg: string): StatusMarkeVariante {
  if (bg.includes("success")) return "erfolg";
  if (bg.includes("warning")) return "warnung";
  if (bg.includes("error")) return "gefahr";
  if (bg.includes("info")) return "info";
  return "neutral";
}

/* ══════════════════════════════════════════
   ANSICHTSBAUM — die einzige Liste, die das Dossier beschreibt.

   Jede Ansicht trägt einen Schlüssel, der zugleich das letzte Adressglied
   ist. Die Schlüssel sind über alle Gruppen hinweg eindeutig; die aktive
   Ansicht wird ausschliesslich daraus bestimmt, nie über einen Zahlenindex.
   ══════════════════════════════════════════ */

interface AnsichtDef {
  /** Kleinbuchstaben, keine Umlaute — letztes Glied der Adresse. */
  schluessel: string;
  label: string;
}

interface GruppeDef {
  /** null = ohne Gruppe; die Ansicht steht dann direkt unter der Kennung. */
  schluessel: string | null;
  label: string | null;
  /** Trennlinie oberhalb dieser Gruppe. */
  abgesetzt?: boolean;
  ansichten: AnsichtDef[];
}

const PATIENT_NAV: GruppeDef[] = [
  { schluessel: null, label: null, ansichten: [
    { schluessel: "ueberblick", label: "Überblick" },
  ] },
  { schluessel: "patient", label: "Patient", ansichten: [
    { schluessel: "stammdaten", label: "Stammdaten" },
    { schluessel: "beziehungen", label: "Beziehungen" },
    { schluessel: "vorgeschichte", label: "Vorgeschichte" },
    { schluessel: "diagnosen", label: "Diagnosen" },
  ] },
  { schluessel: "abklaerung", label: "Abklärung", ansichten: [
    { schluessel: "sda", label: "SDA" },
    { schluessel: "interrai-hc", label: "interRAI HC" },
    { schluessel: "caps", label: "CAPs" },
    { schluessel: "atl", label: "ATL" },
    { schluessel: "anamnese", label: "Anamnese" },
  ] },
  { schluessel: "pflege", label: "Pflege", ansichten: [
    { schluessel: "pflegeplan", label: "Pflegeplan" },
    { schluessel: "beobachtungen", label: "Beobachtungen" },
    { schluessel: "vitalwerte", label: "Vitalwerte" },
    { schluessel: "wunddokumentation", label: "Wunddokumentation" },
    { schluessel: "betreuungsrhythmus", label: "Betreuungsrhythmus" },
  ] },
  { schluessel: "medikation", label: "Medikation", ansichten: [
    { schluessel: "plan", label: "Plan" },
    { schluessel: "unvertraeglichkeiten", label: "Unverträglichkeiten" },
    { schluessel: "richten-und-bezug", label: "Richten und Bezug" },
  ] },
  { schluessel: "leistungen", label: "Leistungen", ansichten: [
    { schluessel: "mandate", label: "Mandate" },
    { schluessel: "leistungsplanungsblatt", label: "Leistungsplanungsblatt" },
    { schluessel: "verordnung-und-kostengutsprache", label: "Verordnung und Kostengutsprache" },
    { schluessel: "kassenregeln", label: "Kassenregeln" },
  ] },
  { schluessel: "einsaetze", label: "Einsätze", ansichten: [
    { schluessel: "termine", label: "Termine" },
    { schluessel: "stempelkontrolle", label: "Stempelkontrolle" },
  ] },
  { schluessel: "dossier", label: "Dossier", ansichten: [
    { schluessel: "ordnerstruktur", label: "Ordnerstruktur" },
    { schluessel: "dokumente", label: "Dokumente" },
    { schluessel: "pflichtluecken", label: "Pflichtlücken" },
  ] },
  { schluessel: null, label: null, abgesetzt: true, ansichten: [
    { schluessel: "pendenzen", label: "Pendenzen" },
    { schluessel: "verlauf", label: "Verlauf" },
    { schluessel: "controlling", label: "Controlling" },
  ] },
];

/** Alle Ansichten flach, je mit ihrer Gruppe — Grundlage für Adresse und Auflösung. */
const ALLE_ANSICHTEN: { gruppe: GruppeDef; ansicht: AnsichtDef }[] =
  PATIENT_NAV.flatMap(g => g.ansichten.map(a => ({ gruppe: g, ansicht: a })));

/** Startansicht, wenn die Adresse keine nennt oder eine unbekannte nennt. */
const START_ANSICHT = "ueberblick";

/**
 * Adresse einer Ansicht. Der Überblick liegt auf der blossen Patientenadresse,
 * damit ein Verweis auf den Patienten dort landet.
 */
export function ansichtPfad(patientId: string, schluessel: string): string {
  if (schluessel === START_ANSICHT) return `/patienten/${patientId}`;
  const treffer = ALLE_ANSICHTEN.find(e => e.ansicht.schluessel === schluessel);
  if (!treffer) return `/patienten/${patientId}`;
  return treffer.gruppe.schluessel
    ? `/patienten/${patientId}/${treffer.gruppe.schluessel}/${schluessel}`
    : `/patienten/${patientId}/${schluessel}`;
}

/**
 * Adresse → Ansicht. Zwei Formen sind gültig: mit Gruppe (zwei Glieder) und
 * ohne (ein Glied). Was sich nicht auflösen lässt, fällt auf den Überblick
 * zurück statt ins Leere zu greifen.
 */
function ansichtAusAdresse(gruppe: string | undefined, ansicht: string | undefined): string {
  const gesucht = ansicht ?? gruppe;
  if (!gesucht) return START_ANSICHT;
  const treffer = ALLE_ANSICHTEN.find(e => e.ansicht.schluessel === gesucht);
  if (!treffer) return START_ANSICHT;
  // Bei zwei Gliedern muss die Gruppe zur Ansicht passen.
  if (ansicht && treffer.gruppe.schluessel !== gruppe) return START_ANSICHT;
  if (!ansicht && treffer.gruppe.schluessel !== null) return START_ANSICHT;
  return gesucht;
}

/* ══════════════════════════════════════════
   ERKLÄRTER ZUSTAND — kein leerer Bildschirm, kein Strich.

   Zwei Ausprägungen: eine Ansicht, deren Definitionsdokument aussteht, und
   eine, die bereits benannt ist und deren Umfang feststeht.
   ══════════════════════════════════════════ */
function NochNichtDefiniert({ titel }: { titel: string }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)" }}>
      <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</h3>
      <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 6, maxWidth: 560 }}>
        Diese Ansicht ist vorgesehen und wird als Nächstes definiert. Solange das
        Definitionsdokument aussteht, steht hier bewusst nichts — es wird nichts
        angezeigt, was nicht erhoben ist.
      </p>
    </div>
  );
}

function NochNichtVerfuegbar({ titel, umfang }: { titel: string; umfang: string[] }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)" }}>
      <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</h3>
      <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 6, maxWidth: 560 }}>
        Noch nicht verfügbar. Vorgesehen ist:
      </p>
      <ul style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {umfang.map(z => (
          <li key={z} className="flex items-start" style={{ gap: 8, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: "var(--radius-pill)", background: "var(--text-tertiary)", marginTop: 7, flexShrink: 0 }} />
            {z}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════
   SEITENNAVIGATION — gruppiert, zuklappbar, 228 px.
   Die Gruppe der aktiven Ansicht ist offen, die übrigen sind zu. Ein
   Tiefenlink öffnet damit von selbst die richtige Gruppe.
   ══════════════════════════════════════════ */
function AnsichtNavigation({ patientId, aktiv, zustaende, obenPx }: {
  patientId: string;
  aktiv: string;
  /** Zustandsmarke je Ansicht; fehlt sie, trägt die Ansicht keine. */
  zustaende: Record<string, { text: string; dringend?: boolean }>;
  obenPx: number;
}) {
  const navigate = useNavigate();
  const gruppeVonAktiv = ALLE_ANSICHTEN.find(e => e.ansicht.schluessel === aktiv)?.gruppe.schluessel ?? null;
  const [offen, setOffen] = useState<Record<string, boolean>>({});
  const istOffen = (g: GruppeDef) =>
    g.schluessel === null || (offen[g.schluessel] ?? g.schluessel === gruppeVonAktiv);

  return (
    <nav
      aria-label="Ansichten"
      className="shrink-0 hidden lg:block"
      style={{ position: "sticky", top: obenPx, width: 228, alignSelf: "flex-start", maxHeight: `calc(100vh - ${obenPx}px)`, overflowY: "auto", paddingBottom: "var(--space-4)" }}
    >
      {PATIENT_NAV.map((g, i) => (
        <div key={g.schluessel ?? `frei-${i}`} style={{ marginTop: g.abgesetzt ? 10 : 0, paddingTop: g.abgesetzt ? 10 : 0, borderTop: g.abgesetzt ? "var(--border-thin) solid var(--border-default)" : undefined }}>
          {g.label && g.schluessel && (
            <button
              type="button"
              onClick={() => setOffen(o => ({ ...o, [g.schluessel!]: !istOffen(g) }))}
              aria-expanded={istOffen(g)}
              className="ui-fokusring w-full flex items-center cursor-pointer"
              style={{ gap: 6, padding: "7px 8px", background: "transparent", border: "none", fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
              <ChevronRight style={{ width: 12, height: 12, flexShrink: 0, transform: istOffen(g) ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              <span style={{ textAlign: "left" }}>{g.label}</span>
            </button>
          )}
          {istOffen(g) && g.ansichten.map(a => {
            const ist = aktiv === a.schluessel;
            const z = zustaende[a.schluessel];
            return (
              <button
                key={a.schluessel}
                type="button"
                aria-current={ist ? "page" : undefined}
                onClick={() => navigate(ansichtPfad(patientId, a.schluessel))}
                className="ui-fokusring w-full flex items-center cursor-pointer transition-colors"
                style={{
                  gap: 8, padding: "7px 10px", marginLeft: g.schluessel ? 10 : 0,
                  width: g.schluessel ? "calc(100% - 10px)" : "100%",
                  borderRadius: 8, border: "none", fontFamily: "inherit", textAlign: "left",
                  background: ist ? "var(--brand-primary-light)" : "transparent",
                  color: ist ? "var(--brand-primary)" : "var(--text-secondary)",
                  fontSize: "var(--text-small)", fontWeight: ist ? "var(--weight-medium)" : "var(--weight-regular)",
                }}
              >
                <span className="flex-1 min-w-0" style={{ overflowWrap: "anywhere" }}>{a.label}</span>
                {z && (
                  <span style={{
                    flexShrink: 0, padding: "1px 7px", borderRadius: "var(--radius-pill)",
                    fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums",
                    background: z.dringend ? "var(--status-danger-bg)" : "var(--bg-secondary)",
                    color: z.dringend ? "var(--status-danger)" : "var(--text-tertiary)",
                  }}>{z.text}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/* ── Patient Prozess 1–15 ────────────────── */
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

function getPatientProzess(patientStatus: string): ProcessStep[] {
  const allSteps = [
    "Erstassessment",
    "Arzt kontaktiert",
    "Diagnose & Mediliste erhalten",
    "KLV erfasst",
    "KLV an Arzt gesendet",
    "KLV unterschrieben erhalten",
    "KLV an Versicherung gesendet",
    "Pflegeplan erstellt",
    "Angehörigen Mappe erstellt",
    "Pflegediagnose erstellt",
    "InterRai erstellt",
    "Medikamente erfasst",
    "Medlink Schulung",
    "Zeit nachgetragen",
    "SRK Schulung angemeldet",
  ];
  const responsibles = [
    "Sandra Weber", "Sandra Weber", "Dr. M. Huber", "Kathrin Meier",
    "Kathrin Meier", "Dr. M. Huber", "System", "Sandra Weber",
    "Sandra Weber", "KI-Assistent", "Sandra Weber", "Kathrin Meier",
    "System", "Sandra Weber", "HR-Abteilung",
  ];
  const dueDates = [
    "15.01.2026", "17.01.2026", "20.01.2026", "22.01.2026",
    "25.01.2026", "28.01.2026", "30.01.2026", "03.02.2026",
    "05.02.2026", "08.02.2026", "10.02.2026", "12.02.2026",
    "15.02.2026", "20.02.2026", "28.02.2026",
  ];

  const doneCount = patientStatus === "aktiv" ? 12 : patientStatus === "gekuendigt" ? 15 : 7;
  const dates = [
    "12.01.2026", "13.01.2026", "15.01.2026", "18.01.2026",
    "20.01.2026", "22.01.2026", "25.01.2026", "28.01.2026",
    "30.01.2026", "02.02.2026", "05.02.2026", "08.02.2026",
    "10.02.2026", "15.02.2026", "20.02.2026",
  ];

  return allSteps.map((label, i) => ({
    nr: i + 1,
    label,
    status: i < doneCount ? "done" : i === doneCount ? "active" : "pending",
    date: i < doneCount ? dates[i] : undefined,
    note: i === doneCount ? "In Bearbeitung" : undefined,
    responsible: responsibles[i],
    dueDate: dueDates[i],
    overdue: i === doneCount && i > 10,
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

function getTickets(_patientId: string): Ticket[] {
  return [
    { id: "SD-2026-0391", subject: "Kostengutsprache abgelaufen — Erneuerung nötig", status: "offen", priority: "hoch", created: "24.02.2026", assignedTo: "Maria Keller", category: "Abrechnung" },
    { id: "SD-2026-0378", subject: "Medikamentenplan aktualisieren nach Arztbesuch", status: "in_bearbeitung", priority: "mittel", created: "20.02.2026", assignedTo: "Sandra Weber", category: "Pflege" },
    { id: "SD-2026-0355", subject: "Angehörigen-Zugang zu Patientenportal einrichten", status: "erledigt", priority: "niedrig", created: "15.02.2026", assignedTo: "System", category: "IT" },
    { id: "SD-2026-0342", subject: "Schlüsselübergabe dokumentieren", status: "erledigt", priority: "niedrig", created: "10.02.2026", assignedTo: "K. Meier", category: "Administration" },
  ];
}

/* ── Historie mock ───────────────────────── */
interface HistoryEntry {
  id: string;
  date: string;
  time: string;
  user: string;
  action: string;
  detail: string;
  type: "status" | "dokument" | "workflow" | "ticket" | "system" | "abrechnung";
}

function getHistorie(_patientId: string): HistoryEntry[] {
  return [
    { id: "h1", date: "26.02.2026", time: "14:32", user: "Sandra Weber", action: "Dokument hochgeladen", detail: "Pflegevertrag – digital signiert", type: "dokument" },
    { id: "h2", date: "26.02.2026", time: "11:15", user: "System", action: "MedLink Synchronisation", detail: "Daten erfolgreich synchronisiert", type: "system" },
    { id: "h3", date: "25.02.2026", time: "16:40", user: "Sandra Weber", action: "Besuch dokumentiert", detail: "Regelmässiger Pflegebesuch — Vitalzeichen erfasst", type: "workflow" },
    { id: "h4", date: "24.02.2026", time: "09:20", user: "Maria Keller", action: "Ticket erstellt", detail: "SD-2026-0391: Kostengutsprache abgelaufen", type: "ticket" },
    { id: "h5", date: "22.02.2026", time: "13:55", user: "Kathrin Meier", action: "Pflegeplan aktualisiert", detail: "Version 3 erstellt und gespeichert", type: "dokument" },
    { id: "h6", date: "20.02.2026", time: "10:30", user: "Sandra Weber", action: "Workflow-Schritt abgeschlossen", detail: "Schritt 12: Medikamente erfasst", type: "workflow" },
    { id: "h7", date: "18.02.2026", time: "14:10", user: "Laura Brunner", action: "InterRai Assessment", detail: "Assessment durchgeführt und dokumentiert", type: "workflow" },
    { id: "h8", date: "15.02.2026", time: "09:00", user: "System", action: "Status geändert", detail: "Status → Aktiv (Abrechenbar)", type: "status" },
    { id: "h9", date: "12.02.2026", time: "16:20", user: "Sandra Weber", action: "Abrechnungsstatus aktualisiert", detail: "Kostengutsprache bestätigt durch KK", type: "abrechnung" },
    { id: "h10", date: "10.02.2026", time: "11:45", user: "K. Meier", action: "Ticket geschlossen", detail: "SD-2026-0342: Schlüsselübergabe", type: "ticket" },
  ];
}

/* ── Masked AHV number ─────────────────── */
function MaskedAhv({ ahv }: { ahv: string }) {
  const [visible, setVisible] = useState(false);
  const masked = ahv.replace(/^(\d{3}\.)(.+)(.\d{2})$/, (_, p1, _mid, p3) =>
    p1 + _mid.replace(/\d/g, "•") + p3
  );
  return (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="inline-flex items-center cursor-pointer transition-colors"
      style={{ gap: 6, background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}
      title={visible ? "AHV-Nummer ausblenden" : "AHV-Nummer anzeigen"}
    >
      <span>AHV: <span style={visible ? {} : { letterSpacing: "0.05em" }}>{visible ? ahv : masked}</span></span>
      {visible
        ? <EyeOff style={{ width: 12, height: 12, color: "var(--text-tertiary)" }} />
        : <Eye style={{ width: 12, height: 12, color: "var(--text-tertiary)" }} />
      }
    </button>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
/**
 * Beim Wechsel von einem Patienten zum nächsten trifft React dieselbe Route und
 * montiert nicht neu — die Bearbeitungsfelder unten werden aber einmalig aus dem
 * Datensatz vorbelegt. Ohne eigene Kennung behielte das Dossier des zweiten
 * Patienten die Werte des ersten. Der Schlüssel erzwingt den Neuaufbau.
 */
export function Patient360Page() {
  const { patientId } = useParams();
  return <Patient360Inhalt key={patientId ?? "keiner"} />;
}

function Patient360Inhalt() {
  const { patientId, gruppe, ansicht } = useParams();
  const navigate = useNavigate();
  /* Die Adresse ist die einzige Quelle der aktiven Ansicht — kein Zustand,
     kein Suchparameter, kein Zahlenindex. */
  const aktiveAnsicht = ansichtAusAdresse(gruppe, ansicht);
  const [statusModal, setStatusModal] = useState(false);

  /* Der Kopf steht; die Navigation beginnt an seiner Unterkante. Die Höhe wird
     gemessen statt geraten — sie ändert sich mit der Breite (Umbruch). */
  const kopfRef = useRef<HTMLDivElement>(null);
  const [kopfHoehe, setKopfHoehe] = useState(0);
  useLayoutEffect(() => {
    const el = kopfRef.current;
    if (!el) return;
    const messen = () => setKopfHoehe(el.getBoundingClientRect().height);
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Blättern läuft über den sichtbaren Bestand; das Dossier selbst ist auch für
  // einen Patienten im Onboarding erreichbar — er existiert bereits.
  const patienten = usePatienten();
  const allPatientIds = patienten.map(p => p.id);
  const patient = patientId ? getPatient(patientId) : undefined;

  if (!patient) {
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)" }}>Patient nicht gefunden</h3>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 4 }}>
          Der Patient mit der ID «{patientId}» konnte nicht gefunden werden.
        </p>
        <AppButton variant="sekundaer" icon={ArrowLeft} onClick={() => navigate("/patienten")} style={{ marginTop: 16 }}>
          Zurück zur Patientenübersicht
        </AppButton>
      </div>
    );
  }

  // WF-02: Patient-Rhythmus-Tickets generieren (idempotent)
  if (patient.aufnahmeDatum) {
    const parts = patient.aufnahmeDatum.split(".");
    const isoAnker = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : patient.aufnahmeDatum;
    generiereRhythmusTickets("patient", patient.id, `${patient.nachname}, ${patient.vorname}`, isoAnker, patient.pflegefachkraft);
  }

  /* Unbekannte Zustandswerte fallen nicht ins Leere: jede Zuordnung hat einen
     Rückfall, damit ein neuer Wert die Seite nicht abstürzen lässt. */
  const st = statusConfig[patient.status] ?? statusConfig.aktiv;
  const ast = abrechnungsStatusConfig[patient.abrechnungsStatus] ?? abrechnungsStatusConfig.in_vorbereitung;
  const sg = patient.schweregrad ? schweregradConfig[patient.schweregrad] ?? null : null;
  const tickets = getTickets(patient.id);
  const offenePendenzen = tickets.filter(t => t.status !== "erledigt").length;

  /* Zustandsmarken der Navigation: eine Zahl, wo eine bekannt ist, rot bei
     Handlungsbedarf; "bald" bei Ansichten, die noch keinen Inhalt tragen. */
  const zustaende: Record<string, { text: string; dringend?: boolean }> = {
    pendenzen: offenePendenzen > 0 ? { text: String(offenePendenzen), dringend: true } : { text: "0" },
  };
  for (const { ansicht: a } of ALLE_ANSICHTEN) {
    if (!(a.schluessel in ANSICHT_HAT_INHALT)) zustaende[a.schluessel] = { text: "bald" };
  }

  return (
    <>
      {/* ── Kopf: bleibt beim Rollen stehen ── */}
      <div
        ref={kopfRef}
        style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg-elevated)", padding: "var(--space-3) var(--space-6) var(--space-3)", borderBottom: "var(--border-thin) solid var(--border-default)" }}
      >
        <div style={{ marginBottom: 4 }}>
          <DetailNavigation
            backLabel="Patienten"
            backPath="/patienten"
            currentId={patientId!}
            allIds={allPatientIds}
            buildPath={(id) => ansichtPfad(id, aktiveAnsicht)}
          />
        </div>
        <div className="flex items-start justify-between" style={{ gap: 16 }}>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
              <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                {patient.nachname}, {patient.vorname}
              </h2>
              {/* Status/Abrechnung/Schweregrad: Information (nicht bedienbar), je Zustand mit Symbol. */}
              <StatusMarke label={st.label} variante={bgZuVariante(st.bg)} />
              <StatusMarke label={ast.label} variante={bgZuVariante(ast.bg)} />
              {sg && <StatusMarke label={sg.label} variante={bgZuVariante(sg.bg)} />}
            </div>
            <div className="flex items-center flex-wrap" style={{ gap: "var(--space-3)", marginTop: 6, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              <MaskedAhv ahv={patient.ahvNummer} />
              <span className="hidden md:inline">·</span>
              <span>Geb.: {patient.geburtsdatum}</span>
              <span className="hidden md:inline">·</span>
              <span>{patient.adresse || "—"}</span>
              <span className="hidden md:inline">·</span>
              {patient.pflegefachkraft !== "—" ? (
                <BezugspersonFeld person={{ initialen: patient.pflegefachkraftInitialen, name: patient.pflegefachkraft }} />
              ) : (
                <span className="inline-flex items-center" style={{ gap: 4, color: "var(--status-warning-text)", fontWeight: "var(--weight-medium)" }}>
                  <AlertTriangle style={{ width: 12, height: 12 }} /> Nicht zugewiesen
                </span>
              )}
              <span className="hidden md:inline">·</span>
              <span>Aufnahme: {patient.aufnahmeDatum || "—"}</span>
              <span className="hidden md:inline">·</span>
              <span>Letzter Besuch: {patient.letzterBesuch || "—"}</span>
            </div>
          </div>

          {/* Actions — genau ein Primärknopf (Ticket erstellen), Rest Sekundär/Symbol */}
          <div className="flex items-center shrink-0" style={{ gap: "var(--space-2)" }}>
            <AppButton variant="primaer" icon={Plus} onClick={() => navigate("/servicedesk")}>Ticket erstellen</AppButton>
            <AppButton variant="sekundaer" icon={Edit3}>Bearbeiten</AppButton>
            <AppButton variant="symbol" icon={MoreHorizontal} ariaLabel="Weitere Aktionen" />
          </div>
        </div>
      </div>

      {/* ── Navigation links, Arbeitsfläche rechts ── */}
      <div className="flex items-start" style={{ gap: "var(--space-5)", padding: "var(--space-4) var(--space-6) 40px" }}>
        <AnsichtNavigation patientId={patient.id} aktiv={aktiveAnsicht} zustaende={zustaende} obenPx={kopfHoehe} />
        <div data-arbeitsflaeche className="flex-1 min-w-0">
          <AnsichtInhalt
            schluessel={aktiveAnsicht}
            patient={patient}
            tickets={tickets}
            navigate={navigate}
          />
        </div>
      </div>

      {/* ── Status Modal ────────────────────── */}
      <StatusModal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        currentStatus={patient.status}
        patientName={`${patient.nachname}, ${patient.vorname} (${patient.id})`}
      />
    </>
  );
}

/* ══════════════════════════════════════════
   INHALTSZUORDNUNG

   Genau eine Stelle sagt, welche Ansicht welchen Inhalt trägt. Was hier steht,
   hat Inhalt; was fehlt, zeigt einen erklärten Zustand. Die Navigation liest
   dieselbe Liste für ihre Marke "bald".
   ══════════════════════════════════════════ */
const ANSICHT_HAT_INHALT: Record<string, true> = {
  ueberblick: true, beziehungen: true, mandate: true, "interrai-hc": true, atl: true, anamnese: true,
  pflegeplan: true, vitalwerte: true, betreuungsrhythmus: true,
  leistungsplanungsblatt: true, "verordnung-und-kostengutsprache": true,
  stempelkontrolle: true, dokumente: true, pendenzen: true, verlauf: true,
};

/** Ansichten, deren Umfang schon feststeht — sie nennen ihn statt zu schweigen. */
const ANSICHT_UMFANG: Record<string, string[]> = {
  plan: [
    "Wirkstoff, Dosierung und Einnahmezeitpunkt je Position",
    "Verordnende Ärztin oder verordnender Arzt",
    "Gültigkeit und Änderungsverlauf",
  ],
  unvertraeglichkeiten: [
    "Wirkstoff-Unverträglichkeiten mit Schweregrad",
    "Abgleich gegen den Medikationsplan",
    "Quelle und Erfassungsdatum je Eintrag",
  ],
  "richten-und-bezug": [
    "Richtprotokoll je Woche",
    "Bezug aus der Apotheke mit Quittung",
    "Abweichungen und ihre Begründung",
  ],
  termine: [
    "Geplante Einsätze mit Zeitfenster",
    "Zuständige Pflegefachkraft je Einsatz",
    "Verschiebungen und Absagen mit Grund",
  ],
};

function AnsichtInhalt({ schluessel, patient, tickets, navigate }: {
  schluessel: string;
  patient: Patient;
  tickets: Ticket[];
  navigate: (p: string) => void;
}) {
  const label = ALLE_ANSICHTEN.find(e => e.ansicht.schluessel === schluessel)?.ansicht.label ?? "Ansicht";

  switch (schluessel) {
    case "ueberblick":
      return (
        <>
          {/* KI-Zusammenfassung gehört inhaltlich in den Überblick (§H) */}
          <div style={{ marginBottom: 20 }}><AnnaPatientSummary patient={patient} /></div>
          <TabUeberblick patient={patient} />
        </>
      );
    case "beziehungen": return <AnsichtBeziehungen patient={patient} />;
    case "mandate": return <AnsichtMandate patient={patient} />;
    case "interrai-hc": return <TabInterRAI patientId={patient.id} patientName={`${patient.nachname}, ${patient.vorname}`} navigate={navigate} />;
    case "atl": return <TabATL patient={patient} />;
    case "anamnese": return <TabAnamnese patient={patient} />;
    case "pflegeplan": return <TabPflegeplanung patientId={patient.id} navigate={navigate} />;
    case "vitalwerte": return <VitaldatenTab patientId={patient.id} />;
    case "betreuungsrhythmus": return <TabWorkflow patient={patient} />;
    case "leistungsplanungsblatt": return <TabKLV patientId={patient.id} />;
    case "verordnung-und-kostengutsprache": return <AnsichtVerordnung patient={patient} />;
    case "stempelkontrolle": return <AnsichtStempelkontrolle />;
    case "dokumente": return <TabDokumente patient={patient} />;
    case "pendenzen": return <TabTickets tickets={tickets} navigate={navigate} />;
    case "verlauf": return <TabHistorie patient={patient} />;
    default:
      return ANSICHT_UMFANG[schluessel]
        ? <NochNichtVerfuegbar titel={label} umfang={ANSICHT_UMFANG[schluessel]} />
        : <NochNichtDefiniert titel={label} />;
  }
}

/* ══════════════════════════════════════════
   ANSICHT: Patient › Beziehungen

   Übernimmt die Karte "Kontaktpersonen" aus dem früheren Überblick
   unverändert — Angehörige/r und Notfallkontakt mit ihrem eigenen
   Bearbeiten-Zweig, der weiterhin in den gemeinsamen Bestand schreibt.
   ══════════════════════════════════════════ */
function AnsichtBeziehungen({ patient }: { patient: Patient }) {
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const origAngehName = patient.angehoeriger.split(" (")[0];
  const origAngehRelation = patient.angehoeriger.match(/\(([^)]+)\)/)?.[1] || "";
  const [angehName, setAngehName] = useState(origAngehName);
  const [angehRelation, setAngehRelation] = useState(origAngehRelation);
  const [angehTelefon, setAngehTelefon] = useState(patient.angehoerigerTelefon);
  const [notfallName, setNotfallName] = useState(patient.notfallkontaktName);
  const [notfallRelation, setNotfallRelation] = useState(patient.notfallkontaktBeziehung);
  const [notfallTelefon, setNotfallTelefon] = useState(patient.notfallkontaktTelefon);
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});

  const startEdit = () => {
    setSnapshot({ angehName, angehRelation, angehTelefon, notfallName, notfallRelation, notfallTelefon });
    setEditingSection("kontakt");
  };

  const cancelEdit = () => {
    setAngehName(snapshot.angehName ?? angehName);
    setAngehRelation(snapshot.angehRelation ?? angehRelation);
    setAngehTelefon(snapshot.angehTelefon ?? angehTelefon);
    setNotfallName(snapshot.notfallName ?? notfallName);
    setNotfallRelation(snapshot.notfallRelation ?? notfallRelation);
    setNotfallTelefon(snapshot.notfallTelefon ?? notfallTelefon);
    setEditingSection(null);
  };

  /**
   * Der Angehörige wird wieder in die im Bestand übliche Form
   * "Name (Beziehung)" gebracht; der Notfallkontakt bleibt davon getrennt und
   * behält seine eigenen drei Felder.
   */
  const saveEdit = () => {
    const angehoerigerText = angehRelation.trim()
      ? `${angehName.trim()} (${angehRelation.trim()})`
      : angehName.trim();
    aktualisierePatient(patient.id, {
      angehoeriger: angehoerigerText,
      angehoerigerTelefon: angehTelefon,
      notfallkontaktName: notfallName,
      notfallkontaktBeziehung: notfallRelation,
      notfallkontaktTelefon: notfallTelefon,
    });
    setEditingSection(null);
  };

  return (
    <div className="space-y-4">
    {/* Kontaktpersonen */}
    <PSectionCard
      title="Kontaktpersonen"
      icon={Users}
      editable
      editing={editingSection === "kontakt"}
      onEdit={startEdit}
      onCancel={cancelEdit}
      onSave={saveEdit}
    >
      <div className="space-y-3">
        <ContactRow
          icon={Heart}
          iconBg="bg-primary/[0.06]"
          iconColor="text-primary/50"
          name={angehName}
          subtitle={angehRelation}
          telefon={angehTelefon}
          editing={editingSection === "kontakt"}
          onNameChange={setAngehName}
          onSubtitleChange={setAngehRelation}
          onTelefonChange={setAngehTelefon}
        />

        <div className="border-t border-border-light" />

        <ContactRow
          icon={Phone}
          iconBg="bg-error/[0.06]"
          iconColor="text-error/50"
          name={notfallName}
          subtitle={notfallRelation}
          subtitleColor="text-error/60"
          telefon={notfallTelefon}
          editing={editingSection === "kontakt"}
          onNameChange={setNotfallName}
          onSubtitleChange={setNotfallRelation}
          onTelefonChange={setNotfallTelefon}
        />
      </div>
    </PSectionCard>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ÜBERBLICK  — Inline Editable
   ══════════════════════════════════════════ */

/** Read-only data field */
function PDataField({ label, value, mono }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      <div className={`text-[13px] text-foreground ${mono ? "font-mono" : ""}`} style={{ fontWeight: 400 }}>{value || "—"}</div>
    </div>
  );
}

/** Editable data field — shows input when editing, plain text otherwise */
function PEditableField({
  label,
  value,
  editing,
  onChange,
  mono,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  mono?: boolean;
  type?: "text" | "date" | "tel";
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

/** Section card with optional edit button */
function PSectionCard({
  title,
  icon: Icon,
  editable = false,
  editing = false,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  icon: React.ElementType;
  editable?: boolean;
  editing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-card rounded-2xl border transition-colors ${editing ? "border-primary/25 shadow-sm" : "border-border"}`}>
      <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h5 className="text-foreground flex-1">{title}</h5>
        {editable && !editing && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            style={{ fontWeight: 450 }}
          >
            <Pencil className="w-3 h-3" />
            Bearbeiten
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              style={{ fontWeight: 450 }}
            >
              <X className="w-3 h-3" />
              Abbrechen
            </button>
            <button
              onClick={onSave}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Check className="w-3 h-3" />
              Speichern
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Editable contact row */
function ContactRow({
  icon: Icon,
  iconBg,
  iconColor,
  name,
  subtitle,
  subtitleColor,
  telefon,
  editing,
  onNameChange,
  onSubtitleChange,
  onTelefonChange,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  name: string;
  subtitle: string;
  subtitleColor?: string;
  telefon: string;
  editing: boolean;
  onNameChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onTelefonChange: (v: string) => void;
}) {
  if (editing) {
    return (
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-1`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Name</div>
            <input value={name} onChange={(e) => onNameChange(e.target.value)} className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Beziehung</div>
            <input value={subtitle} onChange={(e) => onSubtitleChange(e.target.value)} className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Telefon</div>
            <input type="tel" value={telefon} onChange={(e) => onTelefonChange(e.target.value)} className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 min-h-[32px]">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>{name}</div>
        <div className={`text-[11px] ${subtitleColor || "text-muted-foreground"}`}>{subtitle}</div>
      </div>
      <a href={`tel:${telefon}`} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors shrink-0" style={{ fontWeight: 400 }}>
        <Phone className="w-3 h-3" />
        {telefon}
      </a>
    </div>
  );
}

function TabUeberblick({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const prozess = getPatientProzess(patient.status);
  const nextTask = prozess.find((s) => s.status === "active");

  /* ── Track which section is being edited ── */
  const [editingSection, setEditingSection] = useState<string | null>(null);

  /* ── Editable fields: Adresse & Mandat ── */
  const [adresse, setAdresse] = useState(patient.adresse);
  const [kanton, setKanton] = useState(patient.kanton);
  const [leistungsart, setLeistungsart] = useState(patient.leistungsart);
  const [letzterBesuch, setLetzterBesuch] = useState(patient.letzterBesuch);

  /* ── Editable fields: Versicherung & Arzt — Werte kommen aus dem Patienten ── */
  const [kkName, setKkName] = useState(patient.krankenkasse);
  const [kkNummer, setKkNummer] = useState(patient.kartennummer);
  const [arztName, setArztName] = useState(patient.hausarztName);
  const [arztFach, setArztFach] = useState(patient.hausarztFachgebiet);
  const [arztTel, setArztTel] = useState(patient.hausarztTelefon);

  /* ── Snapshot for cancel/revert ── */
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});

  const startEdit = (section: string) => {
    // Snapshot current values for the section
    if (section === "adresse") {
      setSnapshot({ adresse, kanton, leistungsart, letzterBesuch });
    } else if (section === "versicherung") {
      setSnapshot({ kkName, kkNummer, arztName, arztFach, arztTel });
    }
    setEditingSection(section);
  };

  const cancelEdit = (section: string) => {
    // Revert to snapshot
    if (section === "adresse") {
      setAdresse(snapshot.adresse ?? adresse);
      setKanton(snapshot.kanton ?? kanton);
      setLeistungsart(snapshot.leistungsart ?? leistungsart);
      setLetzterBesuch(snapshot.letzterBesuch ?? letzterBesuch);
    } else if (section === "versicherung") {
      setKkName(snapshot.kkName ?? kkName);
      setKkNummer(snapshot.kkNummer ?? kkNummer);
      setArztName(snapshot.arztName ?? arztName);
      setArztFach(snapshot.arztFach ?? arztFach);
      setArztTel(snapshot.arztTel ?? arztTel);
    }
    setEditingSection(null);
  };

  /**
   * Speichern schreibt in den gemeinsamen Bestand — Liste und Dossier zeigen
   * danach denselben Stand. Der Angehörige wird wieder in die im Bestand
   * übliche Form "Name (Beziehung)" gebracht; der Notfallkontakt bleibt davon
   * getrennt und behält seine eigenen drei Felder.
   */
  const saveEdit = () => {
    if (editingSection === "adresse") {
      aktualisierePatient(patient.id, {
        adresse, kanton, leistungsart, letzterBesuch,
      });
    } else if (editingSection === "versicherung") {
      aktualisierePatient(patient.id, {
        krankenkasse: kkName,
        kartennummer: kkNummer,
        hausarztName: arztName,
        hausarztFachgebiet: arztFach,
        hausarztTelefon: arztTel,
      });
    }
    setEditingSection(null);
  };

  const raTage = tageBisReAssessment(patient);
  const raOverdue = raTage !== null && raTage <= 0;
  const raUrgent = raTage !== null && raTage > 0 && raTage <= 14;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

      {/* ═══ LEFT COLUMN ═══ */}
      <div className="xl:col-span-2 space-y-4">

        {/* Adresse & Mandat */}
        <PSectionCard
          title="Adresse & Mandat"
          icon={MapPin}
          editable
          editing={editingSection === "adresse"}
          onEdit={() => startEdit("adresse")}
          onCancel={() => cancelEdit("adresse")}
          onSave={saveEdit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <PEditableField label="Adresse" value={adresse} editing={editingSection === "adresse"} onChange={setAdresse} />
            <PEditableField label="Kanton" value={kanton} editing={editingSection === "adresse"} onChange={setKanton} />
            {/* Quelle ist BB13 im Reiter Personalien — hier nur Anzeige. */}
            <PEditableField label="Sprache" value={patient.sprache} editing={false} onChange={() => {}} />
            <PEditableField label="Leistungsart" value={leistungsart} editing={editingSection === "adresse"} onChange={setLeistungsart} />
            {/* Quelle ist AA2 im Reiter Anmeldung — hier nur Anzeige, nicht bearbeitbar. */}
            <PEditableField label="Aufnahmedatum" value={patient.aufnahmeDatum} editing={false} onChange={() => {}} />
            <PEditableField label="Letzter Besuch" value={letzterBesuch} editing={editingSection === "adresse"} onChange={setLetzterBesuch} />
          </div>
        </PSectionCard>

        {/* Versicherung & Arzt */}
        <PSectionCard
          title="Versicherung & Arzt"
          icon={Shield}
          editable
          editing={editingSection === "versicherung"}
          onEdit={() => startEdit("versicherung")}
          onCancel={() => cancelEdit("versicherung")}
          onSave={saveEdit}
        >
          {editingSection === "versicherung" ? (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Krankenkasse</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PEditableField label="Name" value={kkName} editing onChange={setKkName} />
                  <PEditableField label="Versicherungsnr." value={kkNummer} editing onChange={setKkNummer} mono />
                </div>
              </div>
              <div className="border-t border-border-light pt-4">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Hausarzt</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <PEditableField label="Name" value={arztName} editing onChange={setArztName} />
                  <PEditableField label="Fachgebiet" value={arztFach} editing onChange={setArztFach} />
                  <PEditableField label="Telefon" value={arztTel} editing onChange={setArztTel} type="tel" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 min-h-[32px]">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Krankenkasse</div>
                  <div className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>
                    {kkName}
                    <span className="text-muted-foreground ml-2 font-mono text-[11px]">{kkNummer}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border-light" />

              <div className="flex items-center gap-3 min-h-[32px]">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Hausarzt</div>
                  <div className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>
                    {arztName}
                    <span className="text-muted-foreground ml-2 text-[11px]">{arztFach}</span>
                  </div>
                </div>
                <a href={`tel:${arztTel}`} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors shrink-0" style={{ fontWeight: 400 }}>
                  <Phone className="w-3 h-3" />
                  {arztTel}
                </a>
              </div>
            </div>
          )}
        </PSectionCard>
      </div>

      {/* ═══ RIGHT COLUMN ═══ */}
      <div className="xl:col-span-1 space-y-4">

        {/* Nächste Aufgabe */}
        <PSectionCard title="Nächste Aufgabe" icon={ListChecks}>
          {nextTask ? (
            <>
              <div className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                {nextTask.label}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                <PDataField label="Fällig" value={
                  <span className={nextTask.overdue ? "text-error" : ""} style={{ fontWeight: nextTask.overdue ? 500 : 400 }}>
                    {nextTask.overdue && <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5 text-error" />}
                    {nextTask.dueDate}
                  </span>
                } />
                <PDataField label="Zugewiesen" value={nextTask.responsible || "—"} />
              </div>
              <button
                onClick={() => navigate(ansichtPfad(patient.id, "betreuungsrhythmus"))}
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary-hover transition-colors"
                style={{ fontWeight: 500 }}
              >
                Zum Betreuungsrhythmus
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Keine offenen Aufgaben
            </div>
          )}
        </PSectionCard>

        {/* Re-Assessment */}
        <div className={`bg-card rounded-2xl border ${
          raOverdue ? "border-error/25" : raUrgent ? "border-error/20" : "border-border"
        }`}>
          <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
            <Timer className={`w-4 h-4 ${raOverdue || raUrgent ? "text-error" : "text-primary"}`} />
            <h5 className="text-foreground">Re-Assessment</h5>
          </div>
          <div className="p-5">
            {raTage !== null && (
              <div className={`text-[13px] flex items-center gap-1.5 ${
                raOverdue ? "text-error" : raUrgent ? "text-error" : "text-foreground"
              }`} style={{ fontWeight: raOverdue || raUrgent ? 500 : 400 }}>
                {(raOverdue || raUrgent) && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                {raOverdue
                  ? "Überfällig — bitte umgehend einplanen"
                  : `Fällig in ${raTage} Tagen`
                }
              </div>
            )}
          </div>
        </div>

        {/* Letzte Aktivität */}
        <PSectionCard title="Letzte Aktivität" icon={Clock}>
          <div className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>
            {patient.letzteAktivitaet}
          </div>
        </PSectionCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: WORKFLOW / ACTION PLAN
   ══════════════════════════════════════════ */

/** Mutable task state used by the workflow tab */
interface WorkflowTask {
  id: string;
  nr: number;
  label: string;
  status: "offen" | "abgeschlossen";
  dueDate: string; // ISO yyyy-MM-dd for <input type="date">
  dueDateDisplay: string; // dd.MM.yyyy for display
  assignee: string;
  completedAt: string | null; // dd.MM.yyyy HH:mm
  overdue: boolean;
}

const TEAM_MEMBERS = [
  "Sandra Weber",
  "Kathrin Meier",
  "Maria Keller",
  "Dr. M. Huber",
  "Laura Brunner",
  "HR-Abteilung",
  "System",
  "KI-Assistent",
];

/** Parse dd.MM.yyyy to ISO yyyy-MM-dd */
function chDateToIso(d: string): string {
  const [day, month, year] = d.split(".");
  return `${year}-${month}-${day}`;
}

/** Format ISO to dd.MM.yyyy */
function isoToChDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Check if ISO date is before today */
function isOverdue(iso: string): boolean {
  return new Date(iso) < new Date(new Date().toDateString());
}

function buildWorkflowTasks(steps: ProcessStep[], prefix: string): WorkflowTask[] {
  return steps.map((s) => {
    const iso = s.dueDate ? chDateToIso(s.dueDate) : "2026-03-31";
    const isDone = s.status === "done";
    return {
      id: `${prefix}-${s.nr}`,
      nr: s.nr,
      label: s.label,
      status: isDone ? "abgeschlossen" : "offen",
      dueDate: iso,
      dueDateDisplay: s.dueDate || "31.03.2026",
      assignee: s.responsible || "",
      completedAt: isDone && s.date ? `${s.date}, 09:00` : null,
      overdue: !isDone && isOverdue(iso),
    };
  });
}

function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter((p) => p.length > 1)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Now formatted for display */
function nowTimestamp(): string {
  const d = new Date();
  return formatDatumZeit(d);
}

/* ── Reusable Workflow Section — uses TabHeader (8.11) + ItemRow (8.13) ──── */
function WorkflowSection({
  title,
  tasks,
  onUpdate,
}: {
  title: string;
  tasks: WorkflowTask[];
  onUpdate: (id: string, patch: Partial<WorkflowTask>) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const openTasks = tasks.filter((t) => t.status === "offen");
  const doneTasks = tasks.filter((t) => t.status === "abgeschlossen");
  const doneCount = doneTasks.length;
  const total = tasks.length;

  const handleToggleComplete = (task: WorkflowTask) => {
    if (task.status === "offen") {
      onUpdate(task.id, { status: "abgeschlossen", completedAt: nowTimestamp(), overdue: false });
    } else {
      onUpdate(task.id, { status: "offen", completedAt: null, overdue: isOverdue(task.dueDate) });
    }
  };

  const handleDateChange = (task: WorkflowTask, iso: string) => {
    onUpdate(task.id, { dueDate: iso, dueDateDisplay: isoToChDate(iso), overdue: task.status === "offen" && isOverdue(iso) });
  };

  const handleAssigneeChange = (task: WorkflowTask, assignee: string) => {
    onUpdate(task.id, { assignee });
    setOpenDropdown(null);
  };

  const renderTask = (task: WorkflowTask, idx: number, arr: WorkflowTask[]) => {
    const isDone = task.status === "abgeschlossen";
    const isDropdownOpen = openDropdown === task.id;

    return (
      <ItemRow
        key={task.id}
        marker={
          <button onClick={() => handleToggleComplete(task)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 0 }} title={isDone ? "Als offen markieren" : "Als erledigt markieren"}>
            {isDone ? (
              <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--status-success)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check style={{ width: 12, height: 12, color: "var(--text-on-dark)" }} /></span>
            ) : (
              <span style={{ width: 20, height: 20, borderRadius: 999, border: "1.5px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center" }} />
            )}
          </button>
        }
        titel={`${task.nr}. ${task.label}`}
        hilfstext={isDone && task.completedAt ? `Erledigt: ${task.completedAt}` : undefined}
        last={idx === arr.length - 1}
      >
        <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: -2 }}>
          {/* Überfällig — only status shown per 8.12 rule */}
          {task.overdue && !isDone && (
            <span className="inline-flex items-center" style={{ gap: 3, padding: "1px 8px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>
              <AlertTriangle style={{ width: 10, height: 10 }} /> Überfällig
            </span>
          )}

          {/* Due date */}
          <div className="hidden sm:flex items-center" style={{ gap: 4 }}>
            <Calendar style={{ width: 12, height: 12, color: task.overdue && !isDone ? "var(--status-danger)" : "var(--text-tertiary)" }} />
            <DateField wertFormat="iso" bereich="future" value={task.dueDate || null} onChange={v => handleDateChange(task, (v as string) ?? "")} disabled={isDone} />
          </div>

          {/* Assignee */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setOpenDropdown(isDropdownOpen ? null : task.id)}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 4, padding: "2px 8px", borderRadius: 999, background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}
            >
              {task.assignee ? (
                <>
                  <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--brand-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "var(--brand-primary)" }}>{getInitials(task.assignee)}</span>
                  <span className="truncate" style={{ maxWidth: 100 }}>{task.assignee}</span>
                </>
              ) : (
                <><UserCircle style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} /> <span style={{ color: "var(--text-tertiary)" }}>Zuweisen</span></>
              )}
            </button>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute right-0 top-full z-50" style={{ marginTop: 4, width: 200, background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "4px 0", maxHeight: 220, overflowY: "auto" }}>
                  {task.assignee && (
                    <button onClick={() => handleAssigneeChange(task, "")} className="w-full text-left cursor-pointer" style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-tertiary)", background: "none", border: "none", fontStyle: "italic" }}>Zuweisung entfernen</button>
                  )}
                  {TEAM_MEMBERS.map(name => (
                    <button key={name} onClick={() => handleAssigneeChange(task, name)} className="w-full flex items-center cursor-pointer" style={{ gap: 8, padding: "8px 12px", fontSize: 12, color: task.assignee === name ? "var(--brand-primary)" : "var(--text-primary)", fontWeight: task.assignee === name ? 500 : 400, background: task.assignee === name ? "var(--brand-primary-light)" : "transparent", border: "none" }} onMouseEnter={e => { if (task.assignee !== name) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => { if (task.assignee !== name) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--brand-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "var(--brand-primary)", flexShrink: 0 }}>{getInitials(name)}</span>
                      <span className="flex-1 truncate">{name}</span>
                      {task.assignee === name && <Check style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </ItemRow>
    );
  };

  return (
    <div>
      <TabHeader
        titel={title}
        meta={<HeaderMeta modus="fortschritt" text={`${doneCount} von ${total} erledigt`} prozent={total > 0 ? (doneCount / total) * 100 : 0} />}
      />

      {/* Open tasks */}
      <div style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
        {openTasks.map((t, i) => renderTask(t, i, openTasks))}
        {openTasks.length === 0 && <div style={{ padding: "16px", fontSize: "var(--text-small)", color: "var(--text-tertiary)", textAlign: "center" }}>Alle Schritte erledigt</div>}
      </div>

      {/* Completed tasks — collapsible */}
      {doneTasks.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowCompleted(!showCompleted)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "10px 18px", borderRadius: 999, background: "transparent", border: "none", fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
            {showCompleted ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            {showCompleted ? "Erledigte ausblenden" : "Erledigte anzeigen"} ({doneTasks.length})
          </button>
          {showCompleted && (
            <div style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
              {doneTasks.map((t, i) => renderTask(t, i, doneTasks))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ANAMNESE
   ══════════════════════════════════════════ */

interface AllergieEntry { id: string; stoff: string; reaktion: string; schwere: "Schwer" | "Mittel" | "Leicht" }
interface HilfsmittelEntry { id: string; label: string; detail: string }
interface SpitalEntry { id: string; einrichtung: string; grund: string; von: string; bis: string; tage: number }
interface OperationEntry { id: string; eingriff: string; datum: string }
interface AnamneseEntry { id: string; text: string; datum: string; autor: string }

function TabAnamnese({ patient }: { patient: Patient }) {
  /* ── Karte 1 — Biometrie (editable) ── */
  const [groesse, setGroesse] = useState(172);
  const [gewicht, setGewicht] = useState(84);
  const [editBio, setEditBio] = useState(false);
  const [bioSnap, setBioSnap] = useState({ g: 172, w: 84 });
  const bmi = groesse > 0 ? +(gewicht / (groesse / 100) ** 2).toFixed(1) : 0;
  const bmiKategorie = bmi < 18.5 ? "Untergewicht" : bmi < 25 ? "Normalgewicht" : bmi < 30 ? "Übergewicht" : "Adipositas";
  const bmiColor = bmi < 18.5 ? "text-warning" : bmi < 25 ? "text-success" : bmi < 30 ? "text-warning" : "text-error";

  /* ── Karte 2 — Allergien & Hilfsmittel ── */
  const [allergien, setAllergien] = useState<AllergieEntry[]>([
    { id: "a1", stoff: "Penicillin", reaktion: "Anaphylaxie", schwere: "Schwer" },
    { id: "a2", stoff: "Latex", reaktion: "Hautausschlag", schwere: "Mittel" },
  ]);
  const [hilfsmittel, setHilfsmittel] = useState<HilfsmittelEntry[]>([
    { id: "h1", label: "Brille", detail: "Lesen & Fernsicht" },
    { id: "h2", label: "Hörgerät rechts", detail: "Seit 2021" },
    { id: "h3", label: "Rollator", detail: "Innenbereich" },
  ]);
  const [editK2, setEditK2] = useState(false);
  const [k2Snap, setK2Snap] = useState<{ a: AllergieEntry[]; h: HilfsmittelEntry[] } | null>(null);

  /* ── Karte 3 — Stationärer Verlauf ── */
  const [spital, setSpital] = useState<SpitalEntry[]>([
    { id: "s1", einrichtung: "Kantonsspital Winterthur", grund: "Sturz — Oberschenkelprellung", von: "12.01.2026", bis: "15.01.2026", tage: 3 },
    { id: "s2", einrichtung: "Universitätsspital Zürich", grund: "Diabetes-Einstellung", von: "28.11.2025", bis: "02.12.2025", tage: 4 },
  ]);
  const [ops, setOps] = useState<OperationEntry[]>([
    { id: "o1", eingriff: "Hüft-TEP links", datum: "14.03.2019" },
    { id: "o2", eingriff: "Appendektomie", datum: "08.06.1985" },
  ]);
  const [editK3, setEditK3] = useState(false);
  const [k3Snap, setK3Snap] = useState<{ s: SpitalEntry[]; o: OperationEntry[] } | null>(null);

  /* ── Bereich B — Anamnese-Einträge ── */
  const initialText = `Herr ${patient.nachname} ist ein ${Math.floor(new Date().getFullYear() - 1958)}-jähriger Patient mit bekannter arterieller Hypertonie (seit 2018), Diabetes mellitus Typ 2 (seit 2020) und mittelgradiger depressiver Episode (seit 2024). Zustand nach Hüft-TEP links 2019 — seitdem eingeschränkte Mobilität mit Rollator im Innenbereich.

Aktuell stabile Blutdruckwerte unter Lisinopril 10 mg. HbA1c zuletzt 7.2% (Dezember 2025), Therapie mit Metformin 500 mg 1-0-1. Die depressive Symptomatik wird mit Sertralin 50 mg behandelt und zeigt eine leichte Besserung der Stimmungslage gemäss Rückmeldung der Angehörigen.

Bekannte Allergie auf Penicillin (anaphylaktische Reaktion 2008, dokumentiert) sowie Kontaktallergie auf Latex. Beide Allergien sind im Medikationsplan und bei allen behandelnden Ärzten hinterlegt.

Stationärer Aufenthalt im Januar 2026 nach häuslichem Sturz (Oberschenkelprellung, keine Fraktur). Mobilisation konnte rasch wieder aufgenommen werden. Zweiter Aufenthalt Ende November 2025 zur stationären Diabetes-Einstellung nach Entgleisung (BZ > 18 mmol/l).

Der Patient lebt mit seiner Ehefrau zusammen, die als pflegende Angehörige registriert ist. Kognitive Fähigkeiten sind weitgehend erhalten, bei leichter Vergesslichkeit im Alltag. Kommunikation in ${patient.sprache} gut möglich. Nächtliche Inkontinenzproblematik besteht intermittierend.

Pflegerelevant: Kompressionsstrümpfe müssen täglich morgens angelegt werden (Vollübernahme). Fusspflege durch Podologe alle 6 Wochen. Wochendosierer wird durch die zuständige Pflegefachkraft vorbereitet. Notrufknopf ist vorhanden und wird selbstständig bedient.`;

  const [anamneseEntries, setAnamneseEntries] = useState<AnamneseEntry[]>([
    { id: "an1", text: initialText, datum: "15.01.2026", autor: "Sandra Weber" },
  ]);
  const [editAnamnese, setEditAnamnese] = useState(false);
  const [anamneseSnap, setAnamneseSnap] = useState("");
  const [anaDraft, setAnaDraft] = useState("");
  const [showNewAnamnese, setShowNewAnamnese] = useState(false);
  const [newAnaDraft, setNewAnaDraft] = useState("");
  const [expandedOld, setExpandedOld] = useState<Set<string>>(new Set());

  const currentAnamnese = anamneseEntries[0];
  const olderAnamnesen = anamneseEntries.slice(1);

  /* ── shared classes ── */
  const _editBtn = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer";
  const _saveBtn = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer";
  const _cancelBtn = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer";
  const _input = "w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors";

  const todayStr = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
  };

  return (
    <div className="space-y-5">
      {/* ══ Bereich A — Medizinische Kennzahlen ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Karte 1: Biometrie ─────────── */}
        <div className={`bg-card rounded-2xl border overflow-hidden transition-colors ${editBio ? "border-primary/25 shadow-sm" : "border-border"}`}>
          <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h5 className="text-foreground flex-1">Biometrie</h5>
            {!editBio ? (
              <button onClick={() => { setBioSnap({ g: groesse, w: gewicht }); setEditBio(true); }} className={_editBtn} style={{ fontWeight: 450 }}>
                <Pencil className="w-3 h-3" /> Bearbeiten
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { setGroesse(bioSnap.g); setGewicht(bioSnap.w); setEditBio(false); }} className={_cancelBtn} style={{ fontWeight: 450 }}>
                  <X className="w-3 h-3" /> Abbrechen
                </button>
                <button onClick={() => setEditBio(false)} className={_saveBtn} style={{ fontWeight: 500 }}>
                  <Check className="w-3 h-3" /> Speichern
                </button>
              </div>
            )}
          </div>
          <div className="p-5">
            {!editBio ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Grösse</div>
                  <div className="text-[22px] text-foreground" style={{ fontWeight: 600, lineHeight: "1.2" }}>{groesse}</div>
                  <div className="text-[11px] text-muted-foreground" style={{ fontWeight: 400 }}>cm</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Gewicht</div>
                  <div className="text-[22px] text-foreground" style={{ fontWeight: 600, lineHeight: "1.2" }}>{gewicht}</div>
                  <div className="text-[11px] text-muted-foreground" style={{ fontWeight: 400 }}>kg</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>BMI</div>
                  <div className={`text-[22px] ${bmiColor}`} style={{ fontWeight: 600, lineHeight: "1.2" }}>{bmi}</div>
                  <div className={`text-[11px] ${bmiColor}`} style={{ fontWeight: 500 }}>{bmiKategorie}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block" style={{ fontWeight: 500 }}>Grösse (cm)</label>
                    <input type="number" value={groesse} onChange={(e) => setGroesse(+e.target.value || 0)} className={_input} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block" style={{ fontWeight: 500 }}>Gewicht (kg)</label>
                    <input type="number" value={gewicht} onChange={(e) => setGewicht(+e.target.value || 0)} className={_input} />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>Berechneter BMI</span>
                  <span className={`text-[15px] ${bmiColor}`} style={{ fontWeight: 600 }}>{bmi} <span className="text-[11px]" style={{ fontWeight: 500 }}>({bmiKategorie})</span></span>
                </div>
              </div>
            )}
            {/* BMI scale */}
            <div className="mt-4 pt-3 border-t border-border-light">
              <div className="flex h-[6px] rounded-full overflow-hidden">
                <div className="flex-1 bg-warning/40" />
                <div className="flex-[2] bg-success/40" />
                <div className="flex-1 bg-warning/40" />
                <div className="flex-1 bg-error/40" />
              </div>
              <div className="relative h-3 mt-0.5">
                <div className="absolute -translate-x-1/2 top-0" style={{ left: `${Math.min(Math.max(((bmi - 15) / 25) * 100, 2), 98)}%` }}>
                  <ChevronUp className={`w-3.5 h-3.5 ${bmiColor}`} />
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5" style={{ fontWeight: 400 }}>
                <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Karte 2: Allergien & Hilfsmittel ── */}
        <div className={`bg-card rounded-2xl border overflow-hidden transition-colors ${editK2 ? "border-primary/25 shadow-sm" : "border-border"}`}>
          <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error" />
            <h5 className="text-foreground flex-1">Allergien & Hilfsmittel</h5>
            {!editK2 ? (
              <button onClick={() => { setK2Snap({ a: allergien.map(x => ({...x})), h: hilfsmittel.map(x => ({...x})) }); setEditK2(true); }} className={_editBtn} style={{ fontWeight: 450 }}>
                <Pencil className="w-3 h-3" /> Bearbeiten
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { if (k2Snap) { setAllergien(k2Snap.a); setHilfsmittel(k2Snap.h); } setEditK2(false); }} className={_cancelBtn} style={{ fontWeight: 450 }}>
                  <X className="w-3 h-3" /> Abbrechen
                </button>
                <button onClick={() => setEditK2(false)} className={_saveBtn} style={{ fontWeight: 500 }}>
                  <Check className="w-3 h-3" /> Speichern
                </button>
              </div>
            )}
          </div>
          <div className="p-5 space-y-3">
            {/* Allergien warning box */}
            <div className="rounded-xl bg-error/[0.06] border border-error/15 p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-error" />
                <span className="text-[11px] text-error uppercase tracking-wider" style={{ fontWeight: 600 }}>Bekannte Allergien</span>
              </div>
              <div className="space-y-2">
                {allergien.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    {editK2 ? (
                      <>
                        <input value={a.stoff} onChange={e => setAllergien(prev => prev.map(x => x.id === a.id ? {...x, stoff: e.target.value} : x))} className={`${_input} flex-1`} placeholder="Allergen" />
                        <input value={a.reaktion} onChange={e => setAllergien(prev => prev.map(x => x.id === a.id ? {...x, reaktion: e.target.value} : x))} className={`${_input} flex-1`} placeholder="Reaktion" />
                        <select value={a.schwere} onChange={e => setAllergien(prev => prev.map(x => x.id === a.id ? {...x, schwere: e.target.value as AllergieEntry["schwere"]} : x))} className={`${_input} w-24 shrink-0`}>
                          <option value="Leicht">Leicht</option><option value="Mittel">Mittel</option><option value="Schwer">Schwer</option>
                        </select>
                        <button onClick={() => setAllergien(prev => prev.filter(x => x.id !== a.id))} className="p-1 rounded-lg text-error/60 hover:text-error hover:bg-error/8 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{a.stoff}</span>
                          <span className="text-[11px] text-muted-foreground ml-1.5" style={{ fontWeight: 400 }}>— {a.reaktion}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-[2px] rounded-md shrink-0 ${a.schwere === "Schwer" ? "bg-error-light text-error-foreground" : a.schwere === "Mittel" ? "bg-warning-light text-warning-foreground" : "bg-muted text-muted-foreground"}`} style={{ fontWeight: 500 }}>{a.schwere}</span>
                      </>
                    )}
                  </div>
                ))}
                {editK2 && (
                  <button onClick={() => setAllergien(prev => [...prev, { id: `a${Date.now()}`, stoff: "", reaktion: "", schwere: "Mittel" }])} className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-hover pt-1 transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                    <Plus className="w-3 h-3" /> Allergie hinzufügen
                  </button>
                )}
              </div>
            </div>
            {/* Hilfsmittel */}
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>Hilfsmittel</div>
              <div className="space-y-1.5">
                {hilfsmittel.map((h) => (
                  <div key={h.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background border border-border-light">
                    {editK2 ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <input value={h.label} onChange={e => setHilfsmittel(prev => prev.map(x => x.id === h.id ? {...x, label: e.target.value} : x))} className={`${_input} flex-1`} placeholder="Bezeichnung" />
                        <input value={h.detail} onChange={e => setHilfsmittel(prev => prev.map(x => x.id === h.id ? {...x, detail: e.target.value} : x))} className={`${_input} w-36 shrink-0`} placeholder="Details" />
                        <button onClick={() => setHilfsmittel(prev => prev.filter(x => x.id !== h.id))} className="p-1 rounded-lg text-error/60 hover:text-error hover:bg-error/8 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="text-[12px] text-foreground flex-1" style={{ fontWeight: 450 }}>{h.label}</span>
                        <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 400 }}>{h.detail}</span>
                      </>
                    )}
                  </div>
                ))}
                {editK2 && (
                  <button onClick={() => setHilfsmittel(prev => [...prev, { id: `h${Date.now()}`, label: "", detail: "" }])} className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-hover pt-1 transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                    <Plus className="w-3 h-3" /> Hilfsmittel hinzufügen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Karte 3: Stationärer Verlauf ── */}
        <div className={`bg-card rounded-2xl border overflow-hidden transition-colors ${editK3 ? "border-primary/25 shadow-sm" : "border-border"}`}>
          <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h5 className="text-foreground flex-1">Stationärer Verlauf</h5>
            {!editK3 ? (
              <button onClick={() => { setK3Snap({ s: spital.map(x => ({...x})), o: ops.map(x => ({...x})) }); setEditK3(true); }} className={_editBtn} style={{ fontWeight: 450 }}>
                <Pencil className="w-3 h-3" /> Bearbeiten
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { if (k3Snap) { setSpital(k3Snap.s); setOps(k3Snap.o); } setEditK3(false); }} className={_cancelBtn} style={{ fontWeight: 450 }}>
                  <X className="w-3 h-3" /> Abbrechen
                </button>
                <button onClick={() => setEditK3(false)} className={_saveBtn} style={{ fontWeight: 500 }}>
                  <Check className="w-3 h-3" /> Speichern
                </button>
              </div>
            )}
          </div>
          <div className="p-5 space-y-3">
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>Spitalaufenthalte</div>
              <div className="space-y-2">
                {spital.map((s) => (
                  <div key={s.id} className="px-3 py-2.5 rounded-xl bg-background border border-border-light">
                    {editK3 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={s.einrichtung} onChange={e => setSpital(prev => prev.map(x => x.id === s.id ? {...x, einrichtung: e.target.value} : x))} className={`${_input} flex-1`} placeholder="Einrichtung" />
                          <button onClick={() => setSpital(prev => prev.filter(x => x.id !== s.id))} className="p-1 rounded-lg text-error/60 hover:text-error hover:bg-error/8 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <input value={s.grund} onChange={e => setSpital(prev => prev.map(x => x.id === s.id ? {...x, grund: e.target.value} : x))} className={_input} placeholder="Grund" />
                        <div className="grid grid-cols-3 gap-2">
                          <input value={s.von} onChange={e => setSpital(prev => prev.map(x => x.id === s.id ? {...x, von: e.target.value} : x))} className={_input} placeholder="Von" />
                          <input value={s.bis} onChange={e => setSpital(prev => prev.map(x => x.id === s.id ? {...x, bis: e.target.value} : x))} className={_input} placeholder="Bis" />
                          <input type="number" value={s.tage} onChange={e => setSpital(prev => prev.map(x => x.id === s.id ? {...x, tage: +e.target.value || 0} : x))} className={_input} placeholder="Tage" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{s.einrichtung}</span>
                          <span className="text-[10px] text-primary bg-primary/8 px-1.5 py-[1px] rounded-md shrink-0" style={{ fontWeight: 500 }}>{s.tage} Tage</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground" style={{ fontWeight: 400 }}>{s.grund}</div>
                        <div className="text-[10.5px] text-muted-foreground/70 mt-0.5" style={{ fontWeight: 400 }}>{s.von} – {s.bis}</div>
                      </>
                    )}
                  </div>
                ))}
                {editK3 && (
                  <button onClick={() => setSpital(prev => [...prev, { id: `s${Date.now()}`, einrichtung: "", grund: "", von: "", bis: "", tage: 0 }])} className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-hover pt-1 transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                    <Plus className="w-3 h-3" /> Aufenthalt hinzufügen
                  </button>
                )}
              </div>
            </div>
            <div className="pt-1 border-t border-border-light">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>Operationen</div>
              <div className="space-y-1.5">
                {ops.map((op) => (
                  <div key={op.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background border border-border-light">
                    {editK3 ? (
                      <>
                        <input value={op.eingriff} onChange={e => setOps(prev => prev.map(x => x.id === op.id ? {...x, eingriff: e.target.value} : x))} className={`${_input} flex-1`} placeholder="Eingriff" />
                        <input value={op.datum} onChange={e => setOps(prev => prev.map(x => x.id === op.id ? {...x, datum: e.target.value} : x))} className={`${_input} w-28 shrink-0`} placeholder="Datum" />
                        <button onClick={() => setOps(prev => prev.filter(x => x.id !== op.id))} className="p-1 rounded-lg text-error/60 hover:text-error hover:bg-error/8 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] text-foreground flex-1" style={{ fontWeight: 450 }}>{op.eingriff}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0" style={{ fontWeight: 400 }}>{op.datum}</span>
                      </>
                    )}
                  </div>
                ))}
                {editK3 && (
                  <button onClick={() => setOps(prev => [...prev, { id: `o${Date.now()}`, eingriff: "", datum: "" }])} className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-hover pt-1 transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
                    <Plus className="w-3 h-3" /> Operation hinzufügen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Bereich B — Anamnese ═══════════════ */}
      {!showNewAnamnese && (
        <button
          onClick={() => { setNewAnaDraft(""); setShowNewAnamnese(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-primary/20 text-primary hover:border-primary/40 hover:bg-primary/[0.03] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[13px]" style={{ fontWeight: 500 }}>Neue Anamnese erfassen</span>
        </button>
      )}

      {showNewAnamnese && (
        <div className="bg-card rounded-2xl border border-primary/25 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h5 className="text-foreground flex-1">Neue Anamnese</h5>
            <span className="text-[10.5px] text-muted-foreground" style={{ fontWeight: 400 }}>{todayStr()} · Sandra Weber</span>
            <div className="flex items-center gap-1.5 ml-3">
              <button onClick={() => setShowNewAnamnese(false)} className={_cancelBtn} style={{ fontWeight: 450 }}>
                <X className="w-3 h-3" /> Verwerfen
              </button>
              <button
                onClick={() => {
                  if (!newAnaDraft.trim()) return;
                  setAnamneseEntries(prev => [{ id: `an${Date.now()}`, text: newAnaDraft.trim(), datum: todayStr(), autor: "Sandra Weber" }, ...prev]);
                  setShowNewAnamnese(false);
                  setNewAnaDraft("");
                }}
                className={`${_saveBtn} ${!newAnaDraft.trim() ? "opacity-50 pointer-events-none" : ""}`}
                style={{ fontWeight: 500 }}
              >
                <Check className="w-3 h-3" /> Speichern
              </button>
            </div>
          </div>
          <div className="px-6 py-5 md:px-8">
            <textarea
              value={newAnaDraft}
              onChange={e => setNewAnaDraft(e.target.value)}
              placeholder="Neue Anamnese eingeben…"
              rows={10}
              className="w-full rounded-xl border border-border bg-background px-5 py-4 text-foreground/90 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-y transition-colors"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.75", letterSpacing: "-0.01em" }}
            />
          </div>
        </div>
      )}

      {/* Current Anamnese */}
      <div className={`bg-card rounded-2xl border overflow-hidden transition-colors ${editAnamnese ? "border-primary/25 shadow-sm" : "border-border"}`}>
        <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h5 className="text-foreground flex-1">Anamnese</h5>
          <span className="text-[10.5px] text-muted-foreground mr-2" style={{ fontWeight: 400 }}>
            {olderAnamnesen.length === 0 ? "Übernommen aus Onboarding · " : ""}{currentAnamnese.datum}, {currentAnamnese.autor}
          </span>
          {!editAnamnese ? (
            <button onClick={() => { setAnamneseSnap(currentAnamnese.text); setAnaDraft(currentAnamnese.text); setEditAnamnese(true); }} className={_editBtn} style={{ fontWeight: 450 }}>
              <Pencil className="w-3 h-3" /> Bearbeiten
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setAnaDraft(anamneseSnap); setEditAnamnese(false); }} className={_cancelBtn} style={{ fontWeight: 450 }}>
                <X className="w-3 h-3" /> Abbrechen
              </button>
              <button onClick={() => { setAnamneseEntries(prev => prev.map((ent, i) => i === 0 ? {...ent, text: anaDraft, datum: todayStr(), autor: "Sandra Weber"} : ent)); setEditAnamnese(false); }} className={_saveBtn} style={{ fontWeight: 500 }}>
                <Check className="w-3 h-3" /> Speichern
              </button>
            </div>
          )}
        </div>
        <div className="px-6 py-6 md:px-8 md:py-7">
          {editAnamnese ? (
            <textarea
              value={anaDraft}
              onChange={e => setAnaDraft(e.target.value)}
              rows={14}
              className="w-full rounded-xl border border-border bg-background px-5 py-4 text-foreground/90 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-y transition-colors"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.75", letterSpacing: "-0.01em" }}
            />
          ) : (
            <div
              className="text-foreground/90 whitespace-pre-line"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.75", letterSpacing: "-0.01em" }}
            >
              {currentAnamnese.text}
            </div>
          )}
        </div>
      </div>

      {/* Older Anamnesen (collapsed by default) */}
      {olderAnamnesen.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider px-1" style={{ fontWeight: 500 }}>
            Frühere Anamnesen ({olderAnamnesen.length})
          </div>
          {olderAnamnesen.map((entry) => {
            const isOpen = expandedOld.has(entry.id);
            return (
              <div key={entry.id} className="rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedOld(prev => { const n = new Set(prev); if (n.has(entry.id)) n.delete(entry.id); else n.add(entry.id); return n; })}
                  className="w-full px-5 py-3 flex items-center gap-2 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[12px] text-foreground flex-1" style={{ fontWeight: 450 }}>Anamnese vom {entry.datum}</span>
                  <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 400 }}>{entry.autor}</span>
                </button>
                {isOpen && (
                  <div className="px-6 py-5 md:px-8 border-t border-border-light">
                    <div
                      className="text-foreground/80 whitespace-pre-line"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.7", letterSpacing: "-0.01em" }}
                    >
                      {entry.text}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: AKTIVITÄTEN (ATL)
   ══════════════════════════════════════════ */
type ATLStufe = "selbststaendig" | "anleitung" | "teiluebernahme" | "volluebernahme";

const atlStufeConfig: Record<ATLStufe, { label: string; bg: string; text: string; dot: string; value: number }> = {
  selbststaendig: { label: "Selbstständig", bg: "bg-success-light", text: "text-success-foreground", dot: "bg-success", value: 4 },
  anleitung: { label: "Anleitung", bg: "bg-info-light", text: "text-info-foreground", dot: "bg-info", value: 3 },
  teiluebernahme: { label: "Teilübernahme", bg: "bg-warning-light", text: "text-warning-foreground", dot: "bg-warning", value: 2 },
  volluebernahme: { label: "Vollübernahme", bg: "bg-error-light", text: "text-error-foreground", dot: "bg-error", value: 1 },
};

/**
 * Auflösung einer ATL-Stufe. Ein unbekannter Wert fällt auf "selbstständig"
 * zurück, statt zur Laufzeit ins Leere zu greifen.
 */
function atlStufe(wert: string) {
  return atlStufeConfig[wert as ATLStufe] ?? atlStufeConfig.selbststaendig;
}

const stufeKeys: ATLStufe[] = ["selbststaendig", "anleitung", "teiluebernahme", "volluebernahme"];

interface ATLAktivitaet { id: string; name: string; stufe: ATLStufe; bemerkung: string }
interface ATLBereich { id: string; bereich: string; icon: React.ElementType; aktivitaeten: ATLAktivitaet[] }

function TabATL({ patient }: { patient: Patient }) {
  const isSchwer = patient.schweregrad === "schwer" || patient.schweregrad === "kritisch";

  const [bereiche, setBereiche] = useState<ATLBereich[]>([
    {
      id: "koerperpflege", bereich: "Körperpflege", icon: User,
      aktivitaeten: [
        { id: "kp1", name: "Waschen / Duschen", stufe: isSchwer ? "teiluebernahme" : "anleitung", bemerkung: isSchwer ? "Unterstützung beim Rücken & Füsse" : "" },
        { id: "kp2", name: "Zahnpflege", stufe: "selbststaendig", bemerkung: "" },
        { id: "kp3", name: "Haarpflege", stufe: "selbststaendig", bemerkung: "" },
        { id: "kp4", name: "Rasieren / Gesichtspflege", stufe: "selbststaendig", bemerkung: "" },
        { id: "kp5", name: "Nagelpflege", stufe: isSchwer ? "volluebernahme" : "anleitung", bemerkung: "Fusspflege durch Podologe" },
      ],
    },
    {
      id: "ankleiden", bereich: "An- und Auskleiden", icon: Users,
      aktivitaeten: [
        { id: "ak1", name: "Oberkörper", stufe: "selbststaendig", bemerkung: "" },
        { id: "ak2", name: "Unterkörper", stufe: isSchwer ? "teiluebernahme" : "anleitung", bemerkung: isSchwer ? "Hilfe bei Strümpfen und Schuhen" : "" },
        { id: "ak3", name: "Kompressionsstrümpfe", stufe: "volluebernahme", bemerkung: "Täglich morgens Unterstützung nötig" },
      ],
    },
    {
      id: "ernaehrung", bereich: "Ernährung", icon: Heart,
      aktivitaeten: [
        { id: "er1", name: "Essen zubereiten", stufe: isSchwer ? "teiluebernahme" : "anleitung", bemerkung: "Kalte Mahlzeiten selbstständig" },
        { id: "er2", name: "Essen & Trinken", stufe: "selbststaendig", bemerkung: "" },
        { id: "er3", name: "Diabetiker-Diät einhalten", stufe: "anleitung", bemerkung: "Regelmässige Erinnerung nötig" },
      ],
    },
    {
      id: "mobilitaet", bereich: "Mobilität", icon: Activity,
      aktivitaeten: [
        { id: "mo1", name: "Gehen / Fortbewegung", stufe: isSchwer ? "teiluebernahme" : "anleitung", bemerkung: "Rollator im Haus, Rollstuhl für längere Strecken" },
        { id: "mo2", name: "Treppensteigen", stufe: isSchwer ? "volluebernahme" : "teiluebernahme", bemerkung: "Treppenlift vorhanden" },
        { id: "mo3", name: "Transfer (Bett/Stuhl)", stufe: isSchwer ? "teiluebernahme" : "selbststaendig", bemerkung: "" },
        { id: "mo4", name: "Lagerung im Bett", stufe: isSchwer ? "teiluebernahme" : "selbststaendig", bemerkung: "" },
      ],
    },
    {
      id: "ausscheidung", bereich: "Ausscheidung", icon: Activity,
      aktivitaeten: [
        { id: "au1", name: "Toilettengang", stufe: isSchwer ? "anleitung" : "selbststaendig", bemerkung: "" },
        { id: "au2", name: "Inkontinenzversorgung", stufe: isSchwer ? "teiluebernahme" : "selbststaendig", bemerkung: isSchwer ? "Nächtlich Inkontinenzmaterial" : "Kein Bedarf" },
      ],
    },
    {
      id: "kommunikation", bereich: "Kommunikation & Orientierung", icon: MessageSquare,
      aktivitaeten: [
        { id: "ko1", name: "Sich verständigen", stufe: "selbststaendig", bemerkung: `Sprache: ${patient.sprache}` },
        { id: "ko2", name: "Orientierung (Ort, Zeit, Person)", stufe: isSchwer ? "anleitung" : "selbststaendig", bemerkung: isSchwer ? "Leichte Desorientiertheit abends" : "" },
        { id: "ko3", name: "Tagesstruktur einhalten", stufe: "anleitung", bemerkung: "" },
      ],
    },
    {
      id: "sicherheit", bereich: "Sicherheit", icon: Shield,
      aktivitaeten: [
        { id: "si1", name: "Medikamenteneinnahme", stufe: "anleitung", bemerkung: "Wochendosierer vorbereitet durch PFK" },
        { id: "si2", name: "Notfallsystem bedienen", stufe: "selbststaendig", bemerkung: "Notrufknopf vorhanden" },
        { id: "si3", name: "Sturzprävention", stufe: isSchwer ? "teiluebernahme" : "anleitung", bemerkung: "Haltegriffe installiert" },
      ],
    },
  ]);

  /* ── Edit state (one section at a time) ── */
  const [editBereichId, setEditBereichId] = useState<string | null>(null);
  const [bereichSnap, setBereichSnap] = useState<ATLBereich | null>(null);

  const startEditBereich = (b: ATLBereich) => {
    setBereichSnap({ ...b, aktivitaeten: b.aktivitaeten.map(a => ({ ...a })) });
    setEditBereichId(b.id);
  };
  const cancelEditBereich = () => {
    if (bereichSnap) setBereiche(prev => prev.map(b => b.id === bereichSnap.id ? bereichSnap : b));
    setEditBereichId(null);
    setBereichSnap(null);
  };
  const saveEditBereich = () => { setEditBereichId(null); setBereichSnap(null); };

  const updateAktStufe = (bereichId: string, aktId: string, stufe: ATLStufe) =>
    setBereiche(prev => prev.map(b => b.id === bereichId ? { ...b, aktivitaeten: b.aktivitaeten.map(a => a.id === aktId ? { ...a, stufe } : a) } : b));
  const updateAktBemerkung = (bereichId: string, aktId: string, bemerkung: string) =>
    setBereiche(prev => prev.map(b => b.id === bereichId ? { ...b, aktivitaeten: b.aktivitaeten.map(a => a.id === aktId ? { ...a, bemerkung } : a) } : b));

  const _atlEdit = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer";
  const _atlSave = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-primary-foreground bg-primary hover:bg-primary-hover transition-colors cursor-pointer";
  const _atlCancel = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer";

  // Summary stats (recomputed from state)
  const allAktivitaeten = bereiche.flatMap((b) => b.aktivitaeten);
  const stufeCounts = {
    selbststaendig: allAktivitaeten.filter((a) => a.stufe === "selbststaendig").length,
    anleitung: allAktivitaeten.filter((a) => a.stufe === "anleitung").length,
    teiluebernahme: allAktivitaeten.filter((a) => a.stufe === "teiluebernahme").length,
    volluebernahme: allAktivitaeten.filter((a) => a.stufe === "volluebernahme").length,
  };
  const total = allAktivitaeten.length;

  return (
    <div className="space-y-5">
      {/* ── Summary bar ──────────────────── */}
      <div className="rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h5 className="text-foreground">ATL-Übersicht</h5>
          <span className="text-[11px] text-muted-foreground ml-auto" style={{ fontWeight: 400 }}>
            {total} Aktivitäten erfasst · Letzte Aktualisierung: 24.02.2026
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(stufeCounts) as [ATLStufe, number][]).map(([stufe, count]) => {
            const cfg = atlStufe(stufe);
            const pct = Math.round((count / total) * 100);
            return (
              <div key={stufe} className={`rounded-xl px-3.5 py-2.5 ${cfg.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] ${cfg.text}`} style={{ fontWeight: 500 }}>{cfg.label}</span>
                  <span className={`text-[18px] ${cfg.text}`} style={{ fontWeight: 600, lineHeight: "1.2" }}>{count}</span>
                </div>
                <div className="w-full h-[3px] bg-black/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5" style={{ fontWeight: 400 }}>{pct}% der Aktivitäten</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ATL Bereiche (editable) ──────── */}
      {bereiche.map((bereich) => {
        const Icon = bereich.icon;
        const isEdit = editBereichId === bereich.id;
        return (
          <div key={bereich.id} className={`bg-card rounded-2xl border overflow-hidden transition-colors ${isEdit ? "border-primary/25 shadow-sm" : "border-border"}`}>
            <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              <h5 className="text-foreground flex-1">{bereich.bereich}</h5>
              {!isEdit ? (
                <button onClick={() => startEditBereich(bereich)} className={_atlEdit} style={{ fontWeight: 450 }}>
                  <Pencil className="w-3 h-3" /> Bearbeiten
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={cancelEditBereich} className={_atlCancel} style={{ fontWeight: 450 }}>
                    <X className="w-3 h-3" /> Abbrechen
                  </button>
                  <button onClick={saveEditBereich} className={_atlSave} style={{ fontWeight: 500 }}>
                    <Check className="w-3 h-3" /> Speichern
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 space-y-2">
              {bereich.aktivitaeten.map((akt) => {
                const cfg = atlStufe(akt.stufe);
                return (
                  <div key={akt.id} className={`rounded-xl bg-background border border-border-light ${isEdit ? "px-3 py-3" : "px-3 py-2.5"}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-foreground" style={{ fontWeight: 450 }}>{akt.name}</div>
                        {!isEdit && akt.bemerkung && (
                          <div className="text-[11px] text-muted-foreground mt-0.5" style={{ fontWeight: 400 }}>{akt.bemerkung}</div>
                        )}
                      </div>
                      {!isEdit ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] shrink-0 ${cfg.bg} ${cfg.text}`} style={{ fontWeight: 500 }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      ) : (
                        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                          {stufeKeys.map((key) => {
                            const c = atlStufe(key);
                            const isActive = akt.stufe === key;
                            return (
                              <button
                                key={key}
                                onClick={() => updateAktStufe(bereich.id, akt.id, key)}
                                className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[10px] border transition-all cursor-pointer ${isActive ? `${c.bg} ${c.text} border-transparent` : "bg-muted/30 border-border-light text-muted-foreground hover:bg-muted/60"}`}
                                style={{ fontWeight: isActive ? 600 : 400 }}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? c.dot : "bg-muted-foreground/30"}`} />
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {isEdit && (
                      <div className="mt-2">
                        <input
                          value={akt.bemerkung}
                          onChange={e => updateAktBemerkung(bereich.id, akt.id, e.target.value)}
                          placeholder="Bemerkung…"
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-muted-foreground/50"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabWorkflow({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const nachweise = getNachweiseFuerPatient(patient.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <RhythmusTimeline subjektTyp="patient" subjektId={patient.id} aktuellerBenutzer={patient.pflegefachkraft} />

      {nachweise.length > 0 && (
        <div style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>Schulungsnachweise</div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {nachweise.map(n => (
              <div
                key={n.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/schulungsnachweis/${n.id}`)}
                style={{ padding: "12px 16px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10 }}
              >
                <div>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
                    Initialschulung — Angehörige {n.angehoerigerName}
                  </div>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2 }}>
                    {n.unterschriften.length} von {n.positionen.length} Positionen unterschrieben
                  </div>
                </div>
                <span style={{
                  padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500,
                  background: n.status === "abgeschlossen" ? "var(--status-success-bg)" : "var(--status-warning-bg)",
                  color: n.status === "abgeschlossen" ? "var(--status-success)" : "var(--status-warning-text)",
                }}>
                  {n.status === "abgeschlossen" ? "Abgeschlossen" : "In Bearbeitung"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ANSICHT: Leistungen › Mandate

   Das Mandat ist die Abrechnungsbeziehung — wer zahlt, nach welchem Gesetz,
   aus welchem Grund, in welchem Zeitraum. Drei Karten: aktives Mandat,
   Finanzierung je Pflegestunde, beendete Mandate.
   ══════════════════════════════════════════ */
function AnsichtMandate({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const alle = useMandate();
  const eigene = alle.filter(m => m.patientId === patient.id);
  const aktive = eigene.filter(m => istAktiv(m, MANDAT_STICHTAG));
  const beendete = eigene.filter(m => !istAktiv(m, MANDAT_STICHTAG));
  const ueberschneidend = m2Ueberschneidungen(alle, MANDAT_STICHTAG);

  if (aktive.length === 0) {
    return (
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Mandate</h3>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 6, maxWidth: 560 }}>
          Noch kein Mandat erfasst. Ohne Abrechnungsbeziehung lässt sich weder
          eine Finanzierung noch eine Verordnung zuordnen.
        </p>
        <div style={{ marginTop: 14 }}>
          <AppButton variant="primaer" icon={Plus}>Mandat erfassen</AppButton>
        </div>
        {beendete.length > 0 && <div style={{ marginTop: 16 }}><MandatBeendete mandate={beendete} /></div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {aktive.map(m => (
        <MandatAktiv
          key={m.id}
          mandat={m}
          patient={patient}
          ueberschneidet={ueberschneidend.has(m.id)}
          navigate={navigate}
        />
      ))}
      <MandatFinanzierung kanton={patient.kanton} />
      {beendete.length > 0 && <MandatBeendete mandate={beendete} />}
    </div>
  );
}

/* ── Karte 1: aktives Mandat, direkt bearbeitbar ───────────────────────────── */
function MandatAktiv({ mandat, patient, ueberschneidet, navigate }: {
  mandat: Mandat;
  patient: Patient;
  ueberschneidet: boolean;
  navigate: (p: string) => void;
}) {
  const [bearbeitet, setBearbeitet] = useState(false);
  const [entwurf, setEntwurf] = useState(mandat);
  useEffect(() => { if (!bearbeitet) setEntwurf(mandat); }, [mandat, bearbeitet]);

  const istVersichert = entwurf.mandatsart === "versichert";
  const fehlend = m1FehlendeVersicherung(entwurf);
  const angehoerigeOhneBezug = m3VerknuepfungFehlt(entwurf, verknuepftePatienten);

  const speichern = () => {
    const { id: _id, patientId: _p, ...felder } = entwurf;
    aktualisiereMandat(mandat.id, felder);
    setBearbeitet(false);
  };
  const verwerfen = () => { setEntwurf(mandat); setBearbeitet(false); };
  const setzeFeld = <K extends keyof Mandat>(k: K, v: Mandat[K]) => setEntwurf(e => ({ ...e, [k]: v }));

  const angehoerigerName = (id: string) => {
    const a = getAngehoerige().find(x => x.id === id);
    return a ? `${a.vorname} ${a.nachname}` : "";
  };

  return (
    <PSectionCard
      title={`Aktives Mandat · ${mandat.id}`}
      icon={FileText}
      editable
      editing={bearbeitet}
      onEdit={() => setBearbeitet(true)}
      onCancel={verwerfen}
      onSave={speichern}
    >
      {ueberschneidet && (
        <div className="flex items-start" style={{ gap: 8, marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)" }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
            Ein weiteres aktives Mandat mit derselben Gesetzesgrundlage überschneidet
            sich zeitlich mit diesem. Bitte prüfen — gesperrt wird nichts.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MandatFeld label="Patient" wert={`${patient.nachname}, ${patient.vorname}`} />
        <MandatAuswahl label="Mandatsart" wert={entwurf.mandatsart} optionen={MANDATSART_OPTIONS}
          anzeige={mandatsartLabel(entwurf.mandatsart)} bearbeitet={bearbeitet}
          onChange={v => setzeFeld("mandatsart", v as Mandat["mandatsart"])} />
        <MandatAuswahl label="Gesetzesgrundlage" wert={entwurf.gesetzesgrundlage} optionen={GESETZESGRUNDLAGE_OPTIONS}
          anzeige={gesetzesgrundlageLabel(entwurf.gesetzesgrundlage)} bearbeitet={bearbeitet}
          onChange={v => setzeFeld("gesetzesgrundlage", v as Mandat["gesetzesgrundlage"])} />
        <MandatAuswahl label="Grund" wert={entwurf.grund} optionen={MANDATSGRUND_OPTIONS}
          anzeige={mandatsgrundLabel(entwurf.grund)} bearbeitet={bearbeitet}
          onChange={v => setzeFeld("grund", v as Mandat["grund"])} />

        {istVersichert && (
          <>
            <MandatAuswahl label="Versicherer *" wert={entwurf.versicherer} optionen={KRANKENKASSEN_OPTIONS}
              anzeige={getKrankenkasseLabel(entwurf.versicherer)} bearbeitet={bearbeitet}
              fehler={fehlend.includes("versicherer") ? "Bei einer Versichertenleistung erforderlich." : undefined}
              onChange={v => setzeFeld("versicherer", v)} />
            <MandatText label="Policennummer *" wert={entwurf.policennummer} bearbeitet={bearbeitet}
              fehler={fehlend.includes("policennummer") ? "Bei einer Versichertenleistung erforderlich." : undefined}
              onChange={v => setzeFeld("policennummer", v)} />
          </>
        )}
        <MandatText label="Fallnummer der Kasse" wert={entwurf.fallnummerKasse} bearbeitet={bearbeitet}
          onChange={v => setzeFeld("fallnummerKasse", v)} />
        <MandatText label="Beginn" wert={entwurf.beginn} bearbeitet={bearbeitet}
          onChange={v => setzeFeld("beginn", v)} />
        <MandatText label="Ende" wert={entwurf.ende} bearbeitet={bearbeitet}
          onChange={v => setzeFeld("ende", v)} />
        <MandatFeld label="Zuständige Person" wert={entwurf.zustaendigePerson} />
        {/* Ohne abgerechnete Angehörige bleibt die Zeile leer — kein Platzhalter. */}
        <MandatFeld label="Abgerechnete Angehörige" wert={angehoerigerName(entwurf.abgerechneteAngehoerige)} />
      </div>

      {angehoerigeOhneBezug && (
        <div className="flex items-start" style={{ gap: 8, marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)" }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
            Zwischen dieser angehörigen Person und dem Patienten besteht keine
            Verknüpfung.{" "}
            <button type="button" onClick={() => navigate(`/angehoerige/${entwurf.abgerechneteAngehoerige}`)}
              className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit", color: "inherit", textDecoration: "underline" }}>
              Angehörigendossier öffnen
            </button>
          </span>
        </div>
      )}
    </PSectionCard>
  );
}

/* ── Feldbausteine der Mandatskarte ────────────────────────────────────────── */
function MandatFeld({ label, wert }: { label: string; wert: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      <div className="text-[13px] text-foreground" style={{ fontWeight: 400, minHeight: 19 }}>{wert}</div>
    </div>
  );
}

function MandatText({ label, wert, bearbeitet, onChange, fehler }: {
  label: string; wert: string; bearbeitet: boolean; onChange: (v: string) => void; fehler?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      {bearbeitet ? (
        <input value={wert} onChange={e => onChange(e.target.value)}
          className="w-full outline-none"
          style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", background: "var(--bg-elevated)", border: `var(--border-thin) solid ${fehler ? "var(--status-danger)" : "var(--border-default)"}`, borderRadius: 8, padding: "6px 9px", fontFamily: "inherit" }} />
      ) : (
        <div className="text-[13px] text-foreground" style={{ fontWeight: 400, minHeight: 19 }}>{wert}</div>
      )}
      {fehler && <div style={{ fontSize: "var(--text-micro)", color: "var(--status-danger)", marginTop: 3 }}>{fehler}</div>}
    </div>
  );
}

function MandatAuswahl({ label, wert, anzeige, optionen, bearbeitet, onChange, fehler }: {
  label: string; wert: string; anzeige: string;
  optionen: { value: string; label: string }[];
  bearbeitet: boolean; onChange: (v: string) => void; fehler?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      {bearbeitet ? (
        <InlineSelect value={wert} onChange={onChange} options={optionen} />
      ) : (
        <div className="text-[13px] text-foreground" style={{ fontWeight: 400, minHeight: 19 }}>{anzeige}</div>
      )}
      {fehler && <div style={{ fontSize: "var(--text-micro)", color: "var(--status-danger)", marginTop: 3 }}>{fehler}</div>}
    </div>
  );
}

/* ── Karte 2: Finanzierung je Pflegestunde ─────────────────────────────────── */
function MandatFinanzierung({ kanton }: { kanton: string }) {
  const grundlage = tarifgrundlage(kanton);

  if (!grundlage) {
    return (
      <PSectionCard title="Finanzierung je Pflegestunde" icon={Shield}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: 560 }}>
          Für den Kanton {kanton || "—"} sind keine Tarife hinterlegt. Die
          Aufteilung wird deshalb nicht gezeigt — sie würde sonst Beträge eines
          fremden Kantons ausweisen.
        </p>
      </PSectionCard>
    );
  }

  const spalten = TARIF_KATEGORIEN.map(k => ({ ...k, b: grundlage.betraege[k.code] }));

  return (
    <PSectionCard title="Finanzierung je Pflegestunde" icon={Shield}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
          <thead>
            <tr>
              <th style={mandatKopf}>Zahler</th>
              <th style={mandatKopf}>Grundlage</th>
              {spalten.map(s => <th key={s.code} style={{ ...mandatKopf, textAlign: "right" }}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={mandatZelle}>Krankenversicherer</td>
              <td style={mandatGrundlage}>Art. 7a KLV</td>
              {spalten.map(s => <td key={s.code} style={mandatZahl}>{chf(s.b.okp)}</td>)}
            </tr>
            <tr>
              <td style={mandatZelle}>Kanton und Gemeinde</td>
              <td style={mandatGrundlage}>Art. 25a Abs. 5 KVG</td>
              {spalten.map(s => <td key={s.code} style={mandatZahl}>{chf(s.b.restfinanzierung)}</td>)}
            </tr>
            {/* Die Patientenbeteiligung ist EIN Tagesbetrag über alle Kategorien,
                nicht drei kategorienabhängige Beträge — deshalb eine Zeile mit
                einer Zahl statt drei Spaltenwerten. */}
            <tr>
              <td style={mandatZelle}>Patientin oder Patient</td>
              <td style={mandatGrundlage}>Art. 25a Abs. 5 KVG</td>
              <td style={{ ...mandatZahl, textAlign: "right" }} colSpan={spalten.length}>
                {chf(grundlage.patientenbeteiligungProTag)} je Tag über alle Kategorien
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...mandatFuss, fontWeight: 500 }}>Normkosten</td>
              <td style={mandatFuss} />
              {spalten.map(s => (
                <td key={s.code} style={{ ...mandatFuss, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                  {chf(normkosten(s.b))}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 10 }}>
        Kanton {grundlage.kanton} · gültig ab {grundlage.gueltigAb} · Beträge in CHF je Pflegestunde
      </div>
    </PSectionCard>
  );
}

const mandatKopf: React.CSSProperties = {
  textAlign: "left", padding: "6px 10px", fontSize: "var(--text-micro)",
  color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em",
  fontWeight: 500, borderBottom: "var(--border-thin) solid var(--border-default)",
};
const mandatZelle: React.CSSProperties = { padding: "8px 10px", fontSize: "var(--text-small)", color: "var(--text-primary)" };
const mandatGrundlage: React.CSSProperties = { padding: "8px 10px", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", whiteSpace: "nowrap" };
const mandatZahl: React.CSSProperties = { padding: "8px 10px", fontSize: "var(--text-small)", color: "var(--text-primary)", textAlign: "right", fontVariantNumeric: "tabular-nums" };
const mandatFuss: React.CSSProperties = { padding: "8px 10px", fontSize: "var(--text-small)", color: "var(--text-primary)", borderTop: "var(--border-thin) solid var(--border-default)" };

/* ── Karte 3: beendete Mandate ─────────────────────────────────────────────── */
function MandatBeendete({ mandate }: { mandate: Mandat[] }) {
  return (
    <PSectionCard title="Beendete Mandate" icon={History}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
          <thead>
            <tr>
              {["Mandat", "Art", "Grundlage", "Grund", "Beginn", "Ende"].map(h => (
                <th key={h} style={mandatKopf}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mandate.map(m => (
              <tr key={m.id}>
                <td style={{ ...mandatZelle, fontVariantNumeric: "tabular-nums" }}>{m.id}</td>
                <td style={mandatZelle}>{mandatsartLabel(m.mandatsart)}</td>
                <td style={mandatZelle}>{gesetzesgrundlageLabel(m.gesetzesgrundlage)}</td>
                <td style={mandatZelle}>{mandatsgrundLabel(m.grund)}</td>
                <td style={mandatZelle}>{m.beginn}</td>
                <td style={mandatZelle}>{m.ende}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PSectionCard>
  );
}

/* ══════════════════════════════════════════
   ANSICHT: Leistungen › Verordnung und Kostengutsprache

   Zwei datierte Ketten am Mandat: ärztliche Verordnungen und Kostengutsprachen
   der Kasse. Eine Zeit ohne gültige Gutsprache steht als eigene rote Zeile an
   ihrer chronologischen Stelle — nicht als Randnotiz, denn sie ist bei einer
   Kontrolle die erste Frage.
   ══════════════════════════════════════════ */
function AnsichtVerordnung({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const mandate = useMandate().filter(m => m.patientId === patient.id);
  const aktivesMandat = mandate.find(m => istAktiv(m, MANDAT_STICHTAG)) ?? null;
  const alleVo = useVerordnungen();
  const alleKgs = useKostengutsprachen();

  if (!aktivesMandat) {
    return (
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Verordnung und Kostengutsprache</h3>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 6, maxWidth: 560 }}>
          Beides hängt am Mandat. Ohne aktive Abrechnungsbeziehung gibt es
          nichts zu verordnen und nichts zuzusichern.
        </p>
        <div style={{ marginTop: 14 }}>
          <AppButton variant="sekundaer" onClick={() => navigate(ansichtPfad(patient.id, "mandate"))}>Zu den Mandaten</AppButton>
        </div>
      </div>
    );
  }

  const vo = alleVo.filter(v => v.mandatId === aktivesMandat.id);
  const kgs = alleKgs.filter(k => k.mandatId === aktivesMandat.id);
  const luecke = offeneLuecke(kgs, MANDAT_STICHTAG);

  return (
    <div className="space-y-4">
      {luecke && <LueckenWarnband luecke={luecke} />}
      <KgsZeitachse kgs={kgs} mandat={aktivesMandat} hatVerordnung={vo.length > 0} />
      <VoZeitachse verordnungen={vo} />
    </div>
  );
}

/* ── Abschnitt 1: Warnband, nur bei offener Lücke ──────────────────────────── */
function LueckenWarnband({ luecke }: { luecke: Luecke }) {
  return (
    <div className="flex items-start" style={{ gap: 10, padding: "12px 14px", borderRadius: "var(--radius-card)", background: "var(--status-danger-bg)", border: "var(--border-thin) solid var(--status-danger)" }}>
      <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-danger)", flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-danger)" }}>
          Seit {luecke.tage} Tagen ohne gültige Kostengutsprache
        </div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 3 }}>
          In dieser Zeit erbrachte Leistungen kann die Kasse bis zu fünf Jahre
          rückwirkend zurückfordern — auch bei gültiger Verordnung.
        </div>
      </div>
      <AppButton variant="sekundaer" icon={Plus}>Kostengutsprache einreichen</AppButton>
    </div>
  );
}

/* ── Abschnitt 2: Kostengutsprachen als Zeitachse ──────────────────────────── */

/** Ein Eintrag der Zeitachse: entweder eine Gutsprache oder eine Lücke. */
type KgsEintrag =
  | { art: "kgs"; k: Kostengutsprache; version: number; sortAb: Date }
  | { art: "luecke"; l: Luecke; sortAb: Date };

function KgsZeitachse({ kgs, mandat, hatVerordnung }: {
  kgs: Kostengutsprache[];
  mandat: Mandat;
  hatVerordnung: boolean;
}) {
  if (kgs.length === 0) {
    return (
      <PSectionCard title="Kostengutsprachen" icon={Shield}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: 560 }}>
          {hatVerordnung
            ? "Für dieses Mandat wurde noch keine Kostengutsprache eingereicht. Ohne Zusicherung der Kasse bleibt jede erbrachte Leistung rückforderbar."
            : "Noch keine Kostengutsprache eingereicht."}
        </p>
        <div style={{ marginTop: 14 }}>
          <AppButton variant="primaer" icon={Plus}>Kostengutsprache einreichen</AppButton>
        </div>
      </PSectionCard>
    );
  }

  /* Version aus der zeitlichen Reihenfolge — kein gespeicherter Zähler. */
  const chronologisch = [...kgs].sort((a, b) => {
    const aa = ausAnzeigedatum(a.gueltigAb), bb = ausAnzeigedatum(b.gueltigAb);
    return (aa?.getTime() ?? 0) - (bb?.getTime() ?? 0);
  });
  const version = new Map(chronologisch.map((k, i) => [k.id, i + 1]));

  const eintraege: KgsEintrag[] = [
    ...chronologisch.map(k => ({
      art: "kgs" as const, k, version: version.get(k.id)!,
      sortAb: ausAnzeigedatum(k.gueltigAb) ?? new Date(0),
    })),
    ...lueckenBerechnen(kgs, MANDAT_STICHTAG).map(l => ({ art: "luecke" as const, l, sortAb: l.von })),
  ].sort((a, b) => b.sortAb.getTime() - a.sortAb.getTime()); // neueste zuerst

  return (
    <PSectionCard title="Kostengutsprachen" icon={Shield}>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {eintraege.map(e => e.art === "luecke"
          ? <LueckenZeile key={`l-${e.l.von.getTime()}`} luecke={e.l} />
          : <KgsZeile key={e.k.id} k={e.k} version={e.version} mandat={mandat} />)}
      </div>
    </PSectionCard>
  );
}

function LueckenZeile({ luecke }: { luecke: Luecke }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--status-danger-bg)", border: "var(--border-thin) solid var(--status-danger)" }}>
      <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
        <AlertTriangle style={{ width: 13, height: 13, color: "var(--status-danger)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-danger)" }}>
          Lücke · {luecke.tage} {luecke.tage === 1 ? "Tag" : "Tage"}
        </span>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", fontVariantNumeric: "tabular-nums" }}>
          {alsAnzeigedatum(luecke.von)} – {luecke.offen ? "offen" : alsAnzeigedatum(luecke.bis)}
        </span>
      </div>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 3, marginLeft: 21 }}>
        Ohne gültige Kostengutsprache sind erbrachte Leistungen rückforderbar.
      </div>
    </div>
  );
}

function KgsZeile({ k, version, mandat }: { k: Kostengutsprache; version: number; mandat: Mandat }) {
  const [bearbeitet, setBearbeitet] = useState(false);
  const [entwurf, setEntwurf] = useState(k);
  useEffect(() => { if (!bearbeitet) setEntwurf(k); }, [k, bearbeitet]);

  const angezeigt = entscheidAnzeige(k, MANDAT_STICHTAG);
  const aktiv = kgsDecktAm(k, MANDAT_STICHTAG, MANDAT_STICHTAG);
  const seitEinreichung = tageSeitEinreichung(k, MANDAT_STICHTAG);
  const bisAblauf = tageBisAblauf(k, MANDAT_STICHTAG);
  const grundFehlt = v3GrundFehlt(entwurf);

  const speichern = () => {
    const { id: _i, mandatId: _m, ...felder } = entwurf;
    aktualisiereKostengutsprache(k.id, felder);
    setBearbeitet(false);
  };
  const setzeFeld = <K extends keyof Kostengutsprache>(f: K, v: Kostengutsprache[K]) =>
    setEntwurf(e => ({ ...e, [f]: v }));

  const marke = ENTSCHEID_MARKE[angezeigt] ?? ENTSCHEID_MARKE.ausstehend;

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10,
      background: aktiv ? "var(--bg-elevated)" : "transparent",
      border: `var(--border-thin) solid ${aktiv ? "var(--brand-primary)" : "var(--border-default)"}`,
    }}>
      <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          Version {version}
        </span>
        <span style={{ padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: marke.bg, color: marke.text }}>
          {entscheidLabel(angezeigt)}
        </span>
        {aktiv && (
          <span style={{ padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)" }}>
            Gültig
          </span>
        )}
        {bisAblauf !== null && (
          <span className="inline-flex items-center" style={{ gap: 4, padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }}>
            <Clock style={{ width: 11, height: 11 }} /> Läuft ab in {bisAblauf} {bisAblauf === 1 ? "Tag" : "Tagen"}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {k.gueltigAb} – {k.gueltigBis || "offen"}
        </span>
        <button type="button" onClick={() => (bearbeitet ? speichern() : setBearbeitet(true))}
          className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
          {bearbeitet ? "Sichern" : "Bearbeiten"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 12 }}>
        <MandatFeld label="Versicherer" wert={getKrankenkasseLabel(mandat.versicherer)} />
        <VoFeld label="Eingereicht am" wert={entwurf.eingereichtAm} bearbeitet={bearbeitet} onChange={v => setzeFeld("eingereichtAm", v)} />
        <VoFeld label="Entscheid am" wert={entwurf.entscheidAm} bearbeitet={bearbeitet} onChange={v => setzeFeld("entscheidAm", v)} />
        <VoFeld label="Gültig ab" wert={entwurf.gueltigAb} bearbeitet={bearbeitet} onChange={v => setzeFeld("gueltigAb", v)} />
        <VoFeld label="Gültig bis" wert={entwurf.gueltigBis} bearbeitet={bearbeitet} onChange={v => setzeFeld("gueltigBis", v)} />
        <VoFeld label="Minuten je Woche" wert={entwurf.bewilligteMinutenProWoche} bearbeitet={bearbeitet} onChange={v => setzeFeld("bewilligteMinutenProWoche", v)} />
        <VoFeld label="Minuten je Tag" wert={entwurf.bewilligteMinutenProTag} bearbeitet={bearbeitet} onChange={v => setzeFeld("bewilligteMinutenProTag", v)} />
        <VoFeld label="Einsatztage" wert={entwurf.bewilligteEinsatztage} bearbeitet={bearbeitet} onChange={v => setzeFeld("bewilligteEinsatztage", v)} />
      </div>

      {angezeigt === "ausstehend" && seitEinreichung !== null && (
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 8 }}>
          Seit {seitEinreichung} {seitEinreichung === 1 ? "Tag" : "Tagen"} eingereicht, noch kein Entscheid.
        </div>
      )}
      {angezeigt === "stillschweigend_angenommen" && seitEinreichung !== null && (
        <div style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 8 }}>
          Seit {seitEinreichung} Tagen eingereicht, ohne Antwort der Kasse. Nach
          vierzehn Tagen gilt das Blatt als angenommen — das Rückforderungsrisiko
          bleibt bestehen, nur eine offizielle Kostengutsprache schliesst es.
        </div>
      )}
      {(entwurf.kuerzungsgrund || grundFehlt) && (
        <div style={{ marginTop: 8 }}>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>
            Kürzungsgrund{grundFehlt ? " *" : ""}
          </div>
          {bearbeitet ? (
            <textarea value={entwurf.kuerzungsgrund} onChange={e => setzeFeld("kuerzungsgrund", e.target.value)} rows={2}
              className="w-full outline-none"
              style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", background: "var(--bg-elevated)", border: `var(--border-thin) solid ${grundFehlt ? "var(--status-danger)" : "var(--border-default)"}`, borderRadius: 8, padding: "6px 9px", fontFamily: "inherit", resize: "vertical" }} />
          ) : (
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", lineHeight: 1.45 }}>{entwurf.kuerzungsgrund}</div>
          )}
          {grundFehlt && (
            <div style={{ fontSize: "var(--text-micro)", color: "var(--status-danger)", marginTop: 3 }}>
              Bei Kürzung und Ablehnung ist der Grund erforderlich.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Farbe der Entscheidmarke. Unbekannte Werte fallen auf „ausstehend". */
const ENTSCHEID_MARKE: Record<string, { bg: string; text: string }> = {
  ausstehend: { bg: "var(--bg-secondary)", text: "var(--text-secondary)" },
  stillschweigend_angenommen: { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)" },
  bewilligt: { bg: "var(--status-success-bg)", text: "var(--status-success-text)" },
  gekuerzt: { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)" },
  abgelehnt: { bg: "var(--status-danger-bg)", text: "var(--status-danger)" },
};

/* ── Abschnitt 3: ärztliche Verordnungen ───────────────────────────────────── */
function VoZeitachse({ verordnungen }: { verordnungen: Verordnung[] }) {
  if (verordnungen.length === 0) {
    return (
      <PSectionCard title="Ärztliche Verordnungen" icon={FileText}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: 560 }}>
          Für dieses Mandat liegt keine ärztliche Verordnung vor. Ohne
          Verordnung darf nicht abgerechnet werden.
        </p>
        <div style={{ marginTop: 14 }}>
          <AppButton variant="primaer" icon={Plus}>Verordnung erfassen</AppButton>
        </div>
      </PSectionCard>
    );
  }

  const neuesteZuerst = [...verordnungen].sort((a, b) =>
    (ausAnzeigedatum(b.gueltigAb)?.getTime() ?? 0) - (ausAnzeigedatum(a.gueltigAb)?.getTime() ?? 0));

  return (
    <PSectionCard title="Ärztliche Verordnungen" icon={FileText}>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {neuesteZuerst.map(v => (
          <VoZeile key={v.id} v={v} alleDesMandats={verordnungen} />
        ))}
      </div>
    </PSectionCard>
  );
}

const VO_MARKE: Record<string, { bg: string; text: string; label: string }> = {
  aktiv: { bg: "var(--status-success-bg)", text: "var(--status-success-text)", label: "Aktiv" },
  ersetzt: { bg: "var(--bg-secondary)", text: "var(--text-secondary)", label: "Ersetzt" },
  abgelaufen: { bg: "var(--bg-secondary)", text: "var(--text-tertiary)", label: "Abgelaufen" },
};

function VoZeile({ v, alleDesMandats }: { v: Verordnung; alleDesMandats: Verordnung[] }) {
  const [bearbeitet, setBearbeitet] = useState(false);
  const [entwurf, setEntwurf] = useState(v);
  useEffect(() => { if (!bearbeitet) setEntwurf(v); }, [v, bearbeitet]);

  const zustand = verordnungZustand(v, alleDesMandats, MANDAT_STICHTAG);
  const marke = VO_MARKE[zustand] ?? VO_MARKE.abgelaufen;
  const aktiv = zustand === "aktiv";

  const speichern = () => {
    const { id: _i, mandatId: _m, ...felder } = entwurf;
    aktualisiereVerordnung(v.id, felder);
    setBearbeitet(false);
  };
  const setzeFeld = <K extends keyof Verordnung>(f: K, w: Verordnung[K]) =>
    setEntwurf(e => ({ ...e, [f]: w }));

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10,
      background: aktiv ? "var(--bg-elevated)" : "transparent",
      border: `var(--border-thin) solid ${aktiv ? "var(--brand-primary)" : "var(--border-default)"}`,
    }}>
      <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {verordnungsartLabel(v.art)}
        </span>
        <span style={{ padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: marke.bg, color: marke.text }}>
          {marke.label}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {v.gueltigAb} – {v.gueltigBis || "unbefristet"}
        </span>
        <button type="button" onClick={() => (bearbeitet ? speichern() : setBearbeitet(true))}
          className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
          {bearbeitet ? "Sichern" : "Bearbeiten"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 12 }}>
        <VoFeld label="Verordnende Ärztin" wert={entwurf.verordnendeAerztin} bearbeitet={bearbeitet} onChange={w => setzeFeld("verordnendeAerztin", w)} />
        <VoFeld label="Ausstellungsdatum" wert={entwurf.ausstellungsdatum} bearbeitet={bearbeitet} onChange={w => setzeFeld("ausstellungsdatum", w)} />
        <VoFeld label="Gültig ab" wert={entwurf.gueltigAb} bearbeitet={bearbeitet} onChange={w => setzeFeld("gueltigAb", w)} />
        <VoFeld label="Gültig bis" wert={entwurf.gueltigBis} bearbeitet={bearbeitet} onChange={w => setzeFeld("gueltigBis", w)} />
        <VoFeld label="Unterzeichnet am" wert={entwurf.unterzeichnetAm} bearbeitet={bearbeitet} onChange={w => setzeFeld("unterzeichnetAm", w)} />
        <VoFeld label="Bemerkung" wert={entwurf.bemerkung} bearbeitet={bearbeitet} onChange={w => setzeFeld("bemerkung", w)} />
      </div>
    </div>
  );
}

/** Kleines Feld der beiden Zeitachsen — lesen oder bearbeiten. */
function VoFeld({ label, wert, bearbeitet, onChange }: {
  label: string; wert: string; bearbeitet: boolean; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{label}</div>
      {bearbeitet ? (
        <input value={wert} onChange={e => onChange(e.target.value)} className="w-full outline-none"
          style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: 8, padding: "5px 8px", fontFamily: "inherit" }} />
      ) : (
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minHeight: 19 }}>{wert}</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ANSICHT: Einsätze › Stempelkontrolle
   Übernimmt Abschnitt 3 der früheren Sammelliste unverändert: die Absenzen.
   ══════════════════════════════════════════ */
function AnsichtStempelkontrolle() {
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

  return (
    <div className="space-y-4">

      {/* ═══ SECTION 3: Absenzen ═══ */}
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
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>
                    Zeitraum
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. 10.03. – 14.03.2026"
                    value={absenzForm.zeitraum}
                    onChange={(e) => setAbsenzForm((p) => ({ ...p, zeitraum: e.target.value }))}
                    className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Anzahl Tage */}
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>
                    Anzahl Tage
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="z.B. 5"
                    value={absenzForm.tage}
                    onChange={(e) => setAbsenzForm((p) => ({ ...p, tage: e.target.value }))}
                    className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Absenztyp */}
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 500 }}>
                    Absenztyp
                  </label>
                  <select
                    value={absenzForm.typ}
                    onChange={(e) => setAbsenzForm((p) => ({ ...p, typ: e.target.value }))}
                    className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                  >
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
                  className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2">
                {isEditing && (
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] border border-border bg-card hover:bg-secondary/60 text-foreground transition-colors cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
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
    { id: "subject", label: "Betreff", minCh: 24, maxSpur: "50ch", align: "left", sortierbar: true, ausKarte: true,
      render: t => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{t.subject}</span> },
    { id: "category", label: "Kategorie", minCh: 14, maxSpur: "17ch", align: "left", sortierbar: true, abwerfRang: 1,
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
          <h5 className="text-foreground">Tickets für diesen Patienten</h5>
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
        leerText="Für diesen Patienten sind keine Pendenzen erfasst."
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: HISTORIE (NEW)
   ══════════════════════════════════════════ */
function TabHistorie({ patient }: { patient: Patient }) {
  const historie = getHistorie(patient.id);

  const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string }> = {
    status: { icon: Activity, bg: "bg-primary-light", color: "text-primary" },
    dokument: { icon: FileText, bg: "bg-info-light", color: "text-info" },
    workflow: { icon: ListChecks, bg: "bg-success-light", color: "text-success" },
    ticket: { icon: Headphones, bg: "bg-warning-light", color: "text-warning" },
    system: { icon: RefreshCw, bg: "bg-muted", color: "text-muted-foreground" },
    abrechnung: { icon: CheckCircle2, bg: "bg-success-light", color: "text-success" },
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
            {/* Timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border-light" />

            <div className="space-y-0">
              {historie.map((entry, idx) => {
                const tc = typeConfig[entry.type] || typeConfig.system;
                const Icon = tc.icon;
                const isFirst = idx === 0;
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
                      {/* Timeline dot */}
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

/* ══════════════════════════════════════════
   TAB: INTERRAI
   ══════════════════════════════════════════ */
function TabInterRAI({ patientId }: { patientId: string; patientName: string; navigate: (p: string) => void }) {
  const person = getPersonByPatientId(patientId);
  if (!person) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)" }}>
        Keine Person für diese Patienten-ID hinterlegt.
      </div>
    );
  }
  return (
    <AssessmentStatusView
      person={person}
      returnTo={ansichtPfad(patientId!, "interrai-hc")}
    />
  );
}

/* ══════════════════════════════════════════
   TAB: PFLEGEPLANUNG
   ══════════════════════════════════════════ */
function TabPflegeplanung({ patientId, navigate }: { patientId: string; navigate: (p: string) => void }) {
  const [, forceUpdate] = useState(0);
  const plans = MOCK_PFLEGEPLANUNGEN.filter(p => p.patientId === patientId);

  const deletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = MOCK_PFLEGEPLANUNGEN.findIndex(p => p.id === id);
    if (idx >= 0) { MOCK_PFLEGEPLANUNGEN.splice(idx, 1); forceUpdate(n => n + 1); toast("Pflegeplanungs-Entwurf gelöscht"); }
  };
  const current = plans.find(p => p.status === "abgeschlossen" || p.status === "validiert") || plans[0];
  const baRef = current?.interRAIAssessmentId ? MOCK_ASSESSMENTS.find(a => a.id === current.interRAIAssessmentId) : null;

  return (
    <div>
      {current ? (
        <>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Aktuelle Pflegeplanung vom {current.erstellDatum}</div>
              {baRef && <button onClick={() => navigate(`/interrai/${baRef.id}`)} className="cursor-pointer" style={{ fontSize: "var(--text-small)", color: "var(--brand-primary)", background: "transparent", border: "none", padding: 0, marginTop: 2 }}>Aus InterRAI vom {baRef.startDatum} →</button>}
              {current.onboardingId && <div style={{ fontSize: "var(--text-micro)", color: "var(--status-info)", marginTop: 2 }}>aus Onboarding</div>}
            </div>
            <AppButton variant="primaer" icon={Plus} onClick={() => navigate(`/pflegeplanung/${current?.id || "neu"}`)}>Neue Planung</AppButton>
          </div>
          {current.pflegediagnosen.filter(d => d.status === "akzeptiert").map(d => (
            <div key={d.id} style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "14px 18px", marginBottom: 8 }}>
              <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", marginBottom: 4 }}>NANDA {d.nandaCode} – {d.titel}</div>
              <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 6 }}>{d.begruendung}</div>
              {current.massnahmen.filter(m => m.bezugDiagnoseId === d.id && m.status === "akzeptiert").map(m => (<div key={m.id} style={{ padding: "5px 10px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", fontSize: "var(--text-small)", marginBottom: 3 }}><span style={{ fontWeight: "var(--weight-medium)" }}>{m.titel}</span> · {m.haeufigkeit}</div>))}
              {current.ziele.filter(z => z.bezugDiagnoseId === d.id && z.status === "akzeptiert").map(z => (<div key={z.id} style={{ padding: "5px 10px", background: "var(--brand-primary-light)", borderRadius: "var(--radius-card)", fontSize: "var(--text-small)", color: "var(--brand-primary)", marginTop: 3 }}>{z.titel} ({z.zeithorizont})</div>))}
            </div>
          ))}
        </>
      ) : (
        <div style={{ padding: "var(--space-8)", textAlign: "center", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Noch keine Pflegeplanung</div>
          <AppButton variant="primaer" icon={Plus} onClick={() => navigate("/pflegeplanung/neu")}>Pflegeplanung starten</AppButton>
        </div>
      )}
      <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12, marginTop: 20 }}>Verlauf</div>
      {plans.length === 0 ? <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Keine Einträge</div> : plans.map(p => (
        <div key={p.id} className="flex items-center" style={{ padding: "10px 14px", borderRadius: "var(--radius-card)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", marginBottom: 6 }}>
          <div className="flex-1 flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{p.erstellDatum}</span>
            <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: p.status === "abgeschlossen" ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: p.status === "abgeschlossen" ? "var(--status-success-text)" : "var(--status-warning-text)" }}>{p.status}</span>
            {p.onboardingId && <span style={{ fontSize: "var(--text-micro)", color: "var(--status-info)" }}>aus Onboarding</span>}
          </div>
          {p.status !== "abgeschlossen" && (
            <button onClick={e => deletePlan(p.id, e)} className="cursor-pointer" title="Entwurf löschen" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 4 }} onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}><Trash2 style={{ width: 14, height: 14 }} /></button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: KLV-VERORDNUNG
   ══════════════════════════════════════════ */
function TabKLV({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const klvs = MOCK_KLV_VERORDNUNGEN.filter(k => k.patientId === patientId);
  const current = klvs.find(k => k.status === "kostengutsprache-erhalten") || klvs[0];
  const daysUntil = current?.endDatum ? (() => { const [d, m, y] = current.endDatum!.split("."); return Math.round((new Date(+y, +m - 1, +d).getTime() - new Date("2026-03-03").getTime()) / 86400000); })() : null;
  const katBg = (k: string) => k === "a" ? "var(--status-info-bg)" : k === "b" ? "var(--status-warning-bg)" : "var(--status-success-bg)";
  const katColor = (k: string) => k === "a" ? "var(--status-info)" : k === "b" ? "var(--status-warning-text)" : "var(--status-success-text)";
  type KlvPos = NonNullable<typeof current>["leistungspositionen"][number];
  const [klvSort, setKlvSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const klvToggle = (key: string) => setKlvSort(s => s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const sortKlv = (list: KlvPos[], key: string, dir: "asc" | "desc") => {
    const f = dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (key) {
        case "kat": return f * a.kategorie.localeCompare(b.kategorie, "de");
        case "nr": return f * a.klvNummer.localeCompare(b.klvNummer, "de");
        case "bezeichnung": return f * a.bezeichnung.localeCompare(b.bezeichnung, "de");
        case "min": return f * (a.zeitMin - b.zeitMin);
        case "haeufigkeit": return f * (a.anzahl - b.anzahl);
        case "hwo": return f * (hProWoche(a) - hProWoche(b));
        default: return 0;
      }
    });
  };
  const klvSpalten: SpalteDef<KlvPos>[] = [
    { id: "kat", label: "Kat.", minCh: 4, maxSpur: "5ch", align: "left", sortierbar: true, ausKarte: true,
      render: lp => <span style={{ padding: "1px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: katBg(lp.kategorie), color: katColor(lp.kategorie) }}>{lp.kategorie}</span> },
    { id: "nr", label: "Nr.", minCh: 5, maxSpur: "8ch", align: "left", sortierbar: true,
      render: lp => <span style={{ fontFamily: "monospace", fontSize: "var(--text-small)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{lp.klvNummer}</span> },
    { id: "bezeichnung", label: "Bezeichnung", minCh: 12, maxSpur: "56ch", align: "left", sortierbar: true, ausKarte: true,
      render: lp => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{lp.bezeichnung}</span> },
    { id: "min", label: "Min.", minCh: 5, maxSpur: "6ch", align: "right", sortierbar: true, abwerfRang: 2,
      render: lp => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{lp.zeitMin}′</span> },
    { id: "haeufigkeit", label: "Häufigkeit", minCh: 10, maxSpur: "14ch", align: "left", sortierbar: true, abwerfRang: 1,
      render: lp => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{lp.anzahl}× {einheitLabel(lp.einheit)}</span> },
    { id: "hwo", label: "h/Wo.", minCh: 5, maxSpur: "6ch", align: "right", sortierbar: true,
      render: lp => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>{hProWoche(lp).toFixed(2)}</span> },
  ];

  const deleteKLV = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = MOCK_KLV_VERORDNUNGEN.findIndex(k => k.id === id);
    if (idx >= 0) { MOCK_KLV_VERORDNUNGEN.splice(idx, 1); forceUpdate(n => n + 1); toast("KLV-Entwurf gelöscht"); }
  };

  const [showNeueKLV, setShowNeueKLV] = useState(false);
  const [neuBeginn, setNeuBeginn] = useState("");
  const [neuEnde, setNeuEnde] = useState("");
  const [neuVorlage, setNeuVorlage] = useState(true);

  const handleCreateKLV = () => {
    const newId = `KLV-${Date.now()}`;
    const patientName = current?.patientName || klvs[0]?.patientName || "Patient";
    const heute = formatAnzeige(new Date());

    // Format dates from ISO to dd.mm.yyyy for display
    const formatDate = (iso: string) => { if (!iso) return null; const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };

    const neueKLV: KLVVerordnung = {
      id: newId,
      onboardingId: null,
      patientId,
      patientName,
      pflegeplanungId: current?.pflegeplanungId || null,
      status: "entwurf",
      erstelltVon: "Maria Keller",
      erstellDatum: heute,
      beginnDatum: neuBeginn ? formatDate(neuBeginn) : null,
      endDatum: neuEnde ? formatDate(neuEnde) : null,
      diagnosen: current && neuVorlage ? current.diagnosen.map(d => ({ ...d, id: `${d.id}-${newId}` })) : [],
      leistungspositionen: current && neuVorlage
        ? current.leistungspositionen.map(lp => ({ ...lp, id: `${lp.id}-${newId}`, validiert: false }))
        : [],
      zielformulierungen: current && neuVorlage ? [...current.zielformulierungen] : [],
      arztAngeordnetAm: null,
      krankenkasseGutspracheAm: null,
      ablehnungsgrund: null,
    };

    // Push into the shared mock array so KLVArbeitsbereich can find it
    MOCK_KLV_VERORDNUNGEN.push(neueKLV);

    const leistungenText = neuVorlage && current ? ` — ${neueKLV.leistungspositionen.length} Leistungen übernommen` : "";
    toast(`Neue KLV erstellt${leistungenText}`);
    setShowNeueKLV(false);
    setNeuBeginn("");
    setNeuEnde("");

    // Navigate to the new KLV Arbeitsbereich
    navigate(`/klv/${newId}`);
  };

  return (
    <div>
      {current ? (
        <>
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Aktuelle KLV vom {current.erstellDatum}</div>
              {current.onboardingId && <div style={{ fontSize: "var(--text-micro)", color: "var(--status-info)", marginTop: 2 }}>aus Onboarding</div>}
            </div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <button onClick={() => navigate(`/klv/${current.id}`)} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>KLV-Arbeitsbereich öffnen</button>
              <AppButton variant="primaer" icon={Plus} onClick={() => setShowNeueKLV(true)}>Neue KLV</AppButton>
            </div>
          </div>

          {/* Neue KLV erstellen — inline dialog */}
          {showNeueKLV && (
            <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--brand-primary)", borderRadius: "var(--radius-card)", marginBottom: 16 }}>
              <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Neue KLV-Verordnung erstellen</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Beginn</label>
                  <input type="date" value={neuBeginn} onChange={e => setNeuBeginn(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "var(--text-small)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Ende</label>
                  <input type="date" value={neuEnde} onChange={e => setNeuEnde(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "var(--text-small)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                </div>
              </div>
              {current && (
                <label className="flex items-center cursor-pointer" style={{ gap: 8, fontSize: "var(--text-small)", color: "var(--text-primary)", marginBottom: 12 }}>
                  <input type="checkbox" checked={neuVorlage} onChange={e => setNeuVorlage(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--brand-primary)" }} />
                  Leistungen aus aktueller KLV ({current.leistungspositionen.length} Positionen, {berechneSummen(current.leistungspositionen).total.toFixed(2)} h/Wo.) übernehmen
                </label>
              )}
              <div className="flex items-center" style={{ gap: 8 }}>
                <AppButton variant="primaer" icon={Plus} onClick={handleCreateKLV}>KLV erstellen</AppButton>
                <button onClick={() => setShowNeueKLV(false)} className="cursor-pointer" style={{ padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Abbrechen</button>
              </div>
            </div>
          )}
          {/* Status tracker */}
          <div style={{ padding: "14px 18px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", marginBottom: 16 }}>
            <div className="flex items-center overflow-x-auto" style={{ gap: 0 }}>
              {KLV_STATUS_PIPELINE.map((step, i) => {
                const isCurrent = current.status === step.status;
                const isPast = KLV_STATUS_PIPELINE.findIndex(s => s.status === current.status) > i;
                return (<div key={step.status} className="flex items-center shrink-0">{i > 0 && <div style={{ width: 16, height: 2, background: isPast ? "var(--brand-primary)" : "var(--border-default)" }} />}
                  <div className="flex flex-col items-center" style={{ gap: 3, minWidth: 56 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "var(--radius-pill)", background: isPast || isCurrent ? "var(--brand-primary)" : "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>{(isPast || isCurrent) && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}</div>
                    <span style={{ fontSize: 9, color: isCurrent ? "var(--brand-primary)" : "var(--text-tertiary)", fontWeight: isCurrent ? "var(--weight-medium)" : "var(--weight-regular)", textAlign: "center", whiteSpace: "nowrap" }}>{step.label}</span>
                  </div></div>);
              })}
            </div>
          </div>
          {current.beginnDatum && <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 12, fontSize: "var(--text-small)" }}>
            <span style={{ padding: "6px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)" }}>Beginn: <b>{current.beginnDatum}</b></span>
            {current.endDatum && <span style={{ padding: "6px 12px", background: daysUntil !== null && daysUntil < 30 ? "var(--status-warning-bg)" : "var(--bg-secondary)", borderRadius: "var(--radius-card)", color: daysUntil !== null && daysUntil < 30 ? "var(--status-warning-text)" : "var(--text-primary)" }}>Ende: <b>{current.endDatum}</b>{daysUntil !== null && daysUntil < 30 && ` (${daysUntil < 0 ? "abgelaufen" : `${daysUntil}d`})`}</span>}
          </div>}
          {current.leistungspositionen.length > 0 && <div style={{ marginBottom: 16 }}>
            <DataTable<KlvPos>
              spalten={klvSpalten}
              zeilen={klvSort ? sortKlv(current.leistungspositionen, klvSort.key, klvSort.dir) : current.leistungspositionen}
              zeilenKey={lp => lp.id}
              sort={klvSort ?? undefined}
              onSort={klvToggle}
              containerHaltepunkte
              karteAbPx={520}
              karteTitel={lp => (
                <span className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                  <span style={{ padding: "1px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: katBg(lp.kategorie), color: katColor(lp.kategorie), flexShrink: 0 }}>{lp.kategorie}</span>
                  <span style={{ minWidth: 0, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{lp.bezeichnung}</span>
                </span>
              )}
              fusszeile={<div className="flex items-center justify-between flex-wrap" style={{ gap: 10, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                <div className="flex flex-wrap" style={{ gap: 10 }}>{(["a", "b", "c"] as const).map(k => { const sum = current.leistungspositionen.filter(l => l.kategorie === k).reduce((s, l) => s + hProWoche(l), 0); return sum > 0 ? <span key={k}><span style={{ padding: "1px 5px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: katBg(k), color: katColor(k), marginRight: 3 }}>{k}</span>{sum.toFixed(2)}h</span> : null; })}</div>
                <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Total: {berechneSummen(current.leistungspositionen).total.toFixed(2)} h/Wo.</span>
              </div>}
            />
          </div>}
        </>
      ) : (
        <div style={{ padding: "var(--space-8)", textAlign: "center", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Noch keine KLV-Verordnung</div>
          <AppButton variant="primaer" icon={Plus} onClick={() => setShowNeueKLV(true)}>KLV erstellen</AppButton>
          {showNeueKLV && (
            <div style={{ padding: "16px 20px", background: "var(--bg-primary)", border: "var(--border-thin) solid var(--brand-primary)", borderRadius: "var(--radius-card)", marginTop: 12, textAlign: "left" }}>
              <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Neue KLV-Verordnung erstellen</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Beginn</label>
                  <input type="date" value={neuBeginn} onChange={e => setNeuBeginn(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "var(--text-small)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Ende</label>
                  <input type="date" value={neuEnde} onChange={e => setNeuEnde(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "var(--text-small)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <AppButton variant="primaer" icon={Plus} onClick={handleCreateKLV}>KLV erstellen</AppButton>
                <button onClick={() => setShowNeueKLV(false)} className="cursor-pointer" style={{ padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Abbrechen</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12, marginTop: 20 }}>Verlauf</div>
      {klvs.length === 0 ? <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Keine Einträge</div> : klvs.map(k => (
        <div key={k.id} onClick={() => navigate(`/klv/${k.id}`)} className="flex items-center cursor-pointer transition-colors" style={{ padding: "10px 14px", borderRadius: "var(--radius-card)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", marginBottom: 6 }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
          <div className="flex-1 flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>{k.beginnDatum || k.erstellDatum}</span>
            <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: k.status === "kostengutsprache-erhalten" ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: k.status === "kostengutsprache-erhalten" ? "var(--status-success-text)" : "var(--status-warning-text)" }}>{k.status}</span>
            {k.onboardingId && <span style={{ fontSize: "var(--text-micro)", color: "var(--status-info)" }}>aus Onboarding</span>}
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{berechneSummen(k.leistungspositionen).total.toFixed(2)} h/Wo.</span>
          </div>
          {k.status !== "kostengutsprache-erhalten" && (
            <button onClick={e => deleteKLV(k.id, e)} className="cursor-pointer" title="Entwurf löschen" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 4, marginRight: 4 }} onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}><Trash2 style={{ width: 14, height: 14 }} /></button>
          )}
        </div>
      ))}
    </div>
  );
}
