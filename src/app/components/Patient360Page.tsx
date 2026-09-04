import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { InlineSelect } from "./ui/InlineSelect";
import { FormFeld } from "./ui/FormFeld";
import { KontaktWahl } from "./ui/KontaktWahl";
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
import { isoZuAnzeige, anzeigeZuIso, formatAnzeige, formatDatumZeit, jetztAnzeige } from "../../lib/datum";
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
  LogOut,
  MapPin,
  Users,
  X,
  Pencil,
  Eye,
  EyeOff,
  Info,
  MessageSquare,
  Mic,
  Trash2,
  HeartPulse,
  ChevronLeft,
  Lock,
  ClipboardCheck,
  FolderOpen,
  Building2,
  Home,
  Landmark,
  Search,
} from "lucide-react";
import { VitaldatenTab } from "./vitaldaten/VitaldatenTab";
import {
  statusConfig,
  schweregradConfig,
  abrechnungsStatusConfig,
  patientAdresse,
  adresseAnzeige,
  patientGemeinde,
  type Patient,
} from "./patientData";
import { NeuePendenzDialog } from "./pendenzen/NeuePendenzDialog";
import { usePatienten, getPatient, aktualisierePatient, pflegeAdresse, tageBisReAssessment,
  austrittErfassen, AUSTRITT_FEHLERTEXT, type AustrittFehler } from "../../lib/patienten/store";
import { KANTON_OPTIONS } from "../../lib/stammdaten/kantone";
import { AdressBlock } from "./ui/AdressBlock";
import { ENTLASSUNG_NACH, ENTLASSUNG_SONSTIGES, entlassungNachLabel } from "../../lib/stammdaten/entlassung";
import { austrittVon, austrittText, monatNachAustritt, austrittsMonat } from "../../lib/patienten/austritt";
import { GEGENWART, gegenwart } from "../../lib/gegenwart";
import { StatusModal } from "./StatusModal";
import { DetailNavigation } from "./DetailNavigation";
import { MOCK_ASSESSMENTS, MOCK_PFLEGEPLANUNGEN, STEINER_ALT_DIAGNOSEN, STEINER_ALT_MASSNAHMEN, STEINER_ALT_ZIELE } from "../../lib/mocks/klinische-artefakte-mock";
import {
  useKlvVerordnungen, verordnungAnlegen, verordnungEntfernen,
  statusWechseln, neueVersionErstellen, istGesperrt, sperrGrund,
} from "../../lib/klv/store";
import { wartetSeitTagen } from "../../lib/klv/warten";
import { abgleichen, stunden } from "../../lib/klv/abgleich";
import {
  abweichungNachRichtung, einsatzDauer,
  aktuelleFassung, fruehereFassungen,
  hatAbweichung, WOCHENTAGE, WOCHENTAGE_LANG, MONATE,
  type Einsatz, type EinsatzUrheber, type ErbrachteLeistung, type Monatstag,
  type Berichtfassung,
} from "../../lib/einsaetze/einsaetze";
import {
  useEinsaetze, useErbrachteLeistungen, einsatzBestaetigen, einsatzRueckfrage, berichtSchreiben,
  EINSATZ_BEZUGSMONAT,
} from "../../lib/einsaetze/store";
import { getArtefaktContainer, type KLVVerordnung, type KLVStatus, type KLVLeistung, type AerztlicheDiagnose, type ArztDiagnoseStatus, type VorschlagStatus } from "../../types/klinische-artefakte";
import { TAKT_MINUTEN, MINDESTWERT_EINSATZ, type Monatsabrechnung } from "../../lib/abrechnung/leistungsarten";
import { monatsKennzahlen } from "../../lib/einsaetze/kontrolle";
import { lagebild, NICHT_BEURTEILBAR, GEPRUEFT_WURDE } from "../../lib/lagebild/lagebild";
import {
  pruefbereitschaft, zeitraumMonate, zeitraumText, zaehleVollstaendig,
  NICHT_BEURTEILBAR_CONTROLLING, type Zustand, type Zeitraum,
} from "../../lib/controlling/pruefbereitschaft";
import { useAlleNotizen } from "../../lib/notizen/store";
import { useAngehoerige } from "../../lib/angehoerige/store";
import { sichtbareNotizen } from "../../lib/notizen/notizen";
import { unifiedEntries } from "../../lib/mocks/service-desk-unified";
import { useDokumente } from "../../lib/dokumente/store";
import { useBeziehungen, beziehungBeenden, beziehungSichern } from "../../lib/beziehungen/store";
import { useKontakte } from "../../lib/kontakte/store";
import { kontaktName, type Kontakt } from "../../lib/kontakte/kontakte";
import { KONTAKTTYP_OPTIONS, kontakttypLabel } from "../../lib/stammdaten/kontakttypen";
import {
  istAktiv as beziehungAktiv, personName, rolleLabel, rolleSeite, kategorieFuerRolle, artLabel,
  DIAGRAMM_MAX,
  BEZIEHUNGSROLLE, BEZIEHUNGSART,
  zugehoerigkeitLabel, type Beziehung, type PersonBezug,
} from "../../lib/beziehungen/beziehungen";
import {
  useVorgeschichte, aufenthaltSichern, eingriffSichern, tageZwischen,
  type Spitalaufenthalt, type FruehererEingriff,
} from "../../lib/patienten/vorgeschichte";
import { patientfeldLabel } from "../../lib/stammdaten/patientfelder";
import {
  useArztDiagnosen, usePflegediagnosen, arztDiagnoseSichern, pflegediagnoseSichern,
  type PflegediagnoseEintrag,
} from "../../lib/diagnosen/store";
import {
  dokumenteVon, ordnerStand, ordnerZustand, ordnerDes, pflichtluecken,
  geprueftePflichttypen, gueltigBisText, istAbgelaufen, HERKUNFT_TEXT,
  type Dokument, type DokumentReferenz, type OrdnerStand,
} from "../../lib/dokumente/dokumente";
import { dokumenttyp, ordnerFuer, type DokumentKontext } from "../../lib/stammdaten/dokumenttypen";
import { useAbschluesse } from "../../lib/abschluss/store";
import { pruefzustandLabel } from "../../lib/stammdaten/einsatz";
import { LPB_ABLAUF, lpbStatusLabel, lpbAmZug, lpbNaechster, lpbRang } from "../../lib/stammdaten/lpb-status";
import {
  hProWoche, berechneSummen, einheitLabel,
  istTaeglich, haeufigkeitText, istPeriodisch, erwarteteAnzahlImMonat,
} from "../../lib/klv/berechnung";
import { toast } from "sonner";
import { useRecording } from "../recording/RecordingContext";
import { getPersonByPatientId } from "../../lib/interrai/store";
import { AssessmentStatusView } from "./interrai-neu/AssessmentStatusView";
import { VersicherungenAbschnitt } from "./versicherung/VersicherungenAbschnitt";
import { BezugsteamAbschnitt } from "./beziehungen/BezugsteamAbschnitt";
import { DateField } from "./form/DateField";
import { TabHeader, HeaderMeta } from "./ui/TabHeader";
import { ItemRow } from "./ui/ItemRow";
import { RhythmusTimeline } from "./rhythmus/RhythmusTimeline";
import { getTicketsFuerSubjekt } from "../../lib/rhythmus/engine";
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
    { schluessel: "austritt", label: "Austritt" },
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
    /* „Pflegebericht" ist, was erfasst wird — zwei Wörter für dieselbe
       Sache erzeugen zwei Vorstellungen davon, was hineingehört. */
    { schluessel: "pflegeberichte", label: "Pflegeberichte" },
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
    { schluessel: "pflegekontrolle", label: "Pflegekontrolle" },
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

  const doneCount = patientStatus === "aktiv" ? 12
    : patientStatus === "gekuendigt" || patientStatus === "ausgetreten" ? 15
    : 7;
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
    { id: "SD-2026-0391", subject: "Kostengutsprache abgelaufen — Erneuerung nötig", status: "offen", priority: "hoch", created: "28.07.2026", assignedTo: "Maria Keller", category: "Abrechnung" },
    { id: "SD-2026-0378", subject: "Medikamentenplan aktualisieren nach Arztbesuch", status: "in_bearbeitung", priority: "mittel", created: "24.07.2026", assignedTo: "Sandra Weber", category: "Pflege" },
    { id: "SD-2026-0355", subject: "Angehörigen-Zugang zu Patientenportal einrichten", status: "erledigt", priority: "niedrig", created: "19.07.2026", assignedTo: "System", category: "IT" },
    { id: "SD-2026-0342", subject: "Schlüsselübergabe dokumentieren", status: "erledigt", priority: "niedrig", created: "14.07.2026", assignedTo: "K. Meier", category: "Administration" },
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
    { id: "h1", date: "30.07.2026", time: "14:32", user: "Sandra Weber", action: "Dokument hochgeladen", detail: "Pflegevertrag – digital signiert", type: "dokument" },
    { id: "h2", date: "30.07.2026", time: "11:15", user: "System", action: "MedLink Synchronisation", detail: "Daten erfolgreich synchronisiert", type: "system" },
    { id: "h3", date: "29.07.2026", time: "16:40", user: "Sandra Weber", action: "Besuch dokumentiert", detail: "Regelmässiger Pflegebesuch — Vitalzeichen erfasst", type: "workflow" },
    { id: "h4", date: "28.07.2026", time: "09:20", user: "Maria Keller", action: "Ticket erstellt", detail: "SD-2026-0391: Kostengutsprache abgelaufen", type: "ticket" },
    { id: "h5", date: "26.07.2026", time: "13:55", user: "Kathrin Meier", action: "Pflegeplan aktualisiert", detail: "Version 3 erstellt und gespeichert", type: "dokument" },
    { id: "h6", date: "24.07.2026", time: "10:30", user: "Sandra Weber", action: "Workflow-Schritt abgeschlossen", detail: "Schritt 12: Medikamente erfasst", type: "workflow" },
    { id: "h7", date: "22.07.2026", time: "14:10", user: "Laura Brunner", action: "InterRai Assessment", detail: "Assessment durchgeführt und dokumentiert", type: "workflow" },
    { id: "h8", date: "19.07.2026", time: "09:00", user: "System", action: "Status geändert", detail: "Status → Aktiv (Abrechenbar)", type: "status" },
    { id: "h9", date: "16.07.2026", time: "16:20", user: "Sandra Weber", action: "Abrechnungsstatus aktualisiert", detail: "Kostengutsprache bestätigt durch KK", type: "abrechnung" },
    { id: "h10", date: "14.07.2026", time: "11:45", user: "K. Meier", action: "Ticket geschlossen", detail: "SD-2026-0342: Schlüsselübergabe", type: "ticket" },
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
    /* Die Höhe geht zusätzlich als CSS-Variable hinaus: eine Ansicht mit
       eigener klebender Leiste muss wissen, wo der Dossierkopf endet, und
       eine Eigenschaft erspart es, die Zahl durch dreissig Ansichten zu
       reichen, die sie nicht brauchen. */
    const messen = () => {
      const h = el.getBoundingClientRect().height;
      setKopfHoehe(h);
      document.documentElement.style.setProperty("--dossier-kopf", `${h}px`);
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--dossier-kopf");
    };
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

  /* Hier entsteht nichts. Der Betreuungsrhythmus wird beim Abschluss des
     Onboardings angelegt (lib/onboarding/konvertierung.ts), der Startbestand
     im Seed (lib/rhythmus/seed.ts). Das Dossier liest nur — sonst hinge die
     Zahl der Pendenzen davon ab, wer welches Dossier zuletzt geöffnet hat. */

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
              {/* Status/Abrechnung/Schweregrad: Information (nicht bedienbar), je Zustand mit Symbol.
                  Der Abrechnungsstatus wird aus dem Status abgeleitet und
                  lautet bei „Nicht abrechenbar" gleich. Zweimal dasselbe Wort
                  nebeneinander liest sich wie zwei Befunde, ist aber einer —
                  die abgeleitete Marke entfällt dann. */}
              <StatusMarke label={st.label} variante={bgZuVariante(st.bg)} />
              {ast.label !== st.label && <StatusMarke label={ast.label} variante={bgZuVariante(ast.bg)} />}
              {sg && <StatusMarke label={sg.label} variante={bgZuVariante(sg.bg)} />}
            </div>
            <div className="flex items-center flex-wrap" style={{ gap: "var(--space-3)", marginTop: 6, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              <MaskedAhv ahv={patient.ahvNummer} />
              <span className="hidden md:inline">·</span>
              <span>Geb.: {patient.geburtsdatum}</span>
              <span className="hidden md:inline">·</span>
              <span>{patientAdresse(patient) || "—"}</span>
              {patient.pflegeortAbweichend && (
                <span className="inline-flex items-center" style={{ gap: 4, color: "var(--status-warning-text)", fontWeight: "var(--weight-medium)" }}>
                  <AlertTriangle style={{ width: 12, height: 12 }} /> Pflege an: {adresseAnzeige(patient.pflegeortStrasse, patient.pflegeortPlz, patient.pflegeortOrt) || "—"}
                </span>
              )}
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
  pflegekontrolle: true, dokumente: true, pendenzen: true, verlauf: true, controlling: true,
  ordnerstruktur: true, pflichtluecken: true,
  stammdaten: true, vorgeschichte: true, diagnosen: true, pflegeberichte: true,
  austritt: true,
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
          <div style={{ marginBottom: 20 }}><AnnaLagebild patient={patient} /></div>
          <TabUeberblick patient={patient} />
        </>
      );
    case "stammdaten": return <AnsichtStammdaten patient={patient} />;
    case "austritt": return <AnsichtAustritt patient={patient} />;
    case "beziehungen": return <AnsichtBeziehungenNeu patient={patient} />;
    case "vorgeschichte": return <AnsichtVorgeschichte patient={patient} />;
    case "diagnosen": return <AnsichtDiagnosen patient={patient} />;
    case "mandate": return <AnsichtMandate patient={patient} />;
    case "interrai-hc": return <TabInterRAI patientId={patient.id} patientName={`${patient.nachname}, ${patient.vorname}`} navigate={navigate} />;
    case "atl": return <TabATL patient={patient} />;
    case "anamnese": return <TabAnamnese patient={patient} />;
    case "pflegeplan": return <TabPflegeplanung patientId={patient.id} navigate={navigate} />;
    case "vitalwerte": return <VitaldatenTab patientId={patient.id} />;
    case "betreuungsrhythmus": return <TabWorkflow patient={patient} />;
    case "leistungsplanungsblatt": return <TabKLV patientId={patient.id} />;
    case "verordnung-und-kostengutsprache": return <AnsichtVerordnung patient={patient} />;
    case "pflegekontrolle": return <AnsichtPflegekontrolle patient={patient} />;
    case "pflegeberichte": return <AnsichtPflegeberichte patient={patient} />;
    case "controlling": return <AnsichtControlling patient={patient} />;
    case "ordnerstruktur": return <AnsichtOrdnerstruktur patient={patient} />;
    case "dokumente": return <AnsichtDokumente patient={patient} />;
    case "pflichtluecken": return <AnsichtPflichtluecken patient={patient} />;
    case "pendenzen": return <TabTickets tickets={tickets} navigate={navigate} personBezug={{ art: "patient", kennung: patient.id }} />;
    case "verlauf": return <TabHistorie patient={patient} />;
    default:
      return ANSICHT_UMFANG[schluessel]
        ? <NochNichtVerfuegbar titel={label} umfang={ANSICHT_UMFANG[schluessel]} />
        : <NochNichtDefiniert titel={label} />;
  }
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

/** Kanton als Auswahl über die 26 Kantone (Textfeld bräche die Tarifzuordnung). */
function KantonFeld({ value, editing, onChange }: { value: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Kanton</div>
      {editing ? (
        <select value={value} onChange={e => onChange(e.target.value)} aria-label="Kanton"
          className="w-full text-[13px] text-foreground bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all">
          <option value="">Bitte wählen</option>
          {KANTON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>{value || "—"}</div>
      )}
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
        {/* Knöpfe nur, wo es Handler gibt. Die Stammdaten führen den
            Bearbeiten-Zustand für die ganze Ansicht und übergeben `editing`
            allein für die Hervorhebung — eine Karte ohne onSave/onCancel
            trägt darum auch keine Knöpfe. Für alle übrigen Verwender, die
            beide Handler übergeben, ändert sich nichts. */}
        {editing && (onSave || onCancel) && (
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


function TabUeberblick({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const prozess = getPatientProzess(patient.status);
  const nextTask = prozess.find((s) => s.status === "active");

  /* ── Track which section is being edited ── */
  const [editingSection, setEditingSection] = useState<string | null>(null);

  /* ── Editable fields: Adresse & Mandat (strukturiert) ── */
  const [strasse, setStrasse] = useState(patient.strasse);
  const [plz, setPlz] = useState(patient.plz);
  const [ort, setOrt] = useState(patient.ort);
  const [gemeinde, setGemeinde] = useState(patient.gemeinde);
  const [bfsNummer, setBfsNummer] = useState(patient.bfsNummer);
  const [land, setLand] = useState(patient.land);
  const [kanton, setKanton] = useState(patient.kanton);
  const [leistungsart, setLeistungsart] = useState(patient.leistungsart);

  /* Versicherungen liegen als eigene Versicherungsverhältnisse vor und werden
     über die geteilte Versicherungsliste erfasst (VersicherungenAbschnitt),
     nicht mehr als Patientenfelder hier.
     Der Hausarzt steht nicht mehr am Patienten, sondern als Beziehung mit
     Rolle „hausarzt" auf einen Kontakt. Hier wird er nur gelesen; erfasst
     und geändert wird er unter Beziehungen. */
  const alleBeziehungen = useBeziehungen();
  const alleKontakte = useKontakte();
  const hausarztKontakt = (() => {
    const b = alleBeziehungen.find(x => x.patientId === patient.id && x.rolle === "hausarzt" && beziehungAktiv(x));
    const person = b?.person;
    if (!person || person.art !== "kontakt") return null;
    return alleKontakte.find(k => k.id === person.kennung) ?? null;
  })();

  /* ── Snapshot for cancel/revert ── */
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});

  const startEdit = (section: string) => {
    // Snapshot current values for the section
    if (section === "adresse") {
      setSnapshot({ strasse, plz, ort, gemeinde, bfsNummer, land, kanton, leistungsart });
    }
    setEditingSection(section);
  };

  const cancelEdit = (section: string) => {
    // Revert to snapshot
    if (section === "adresse") {
      setStrasse(snapshot.strasse ?? strasse);
      setPlz(snapshot.plz ?? plz);
      setOrt(snapshot.ort ?? ort);
      setGemeinde(snapshot.gemeinde ?? gemeinde);
      setBfsNummer(snapshot.bfsNummer ?? bfsNummer);
      setLand(snapshot.land ?? land);
      setKanton(snapshot.kanton ?? kanton);
      setLeistungsart(snapshot.leistungsart ?? leistungsart);
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
        strasse, plz, ort, gemeinde, bfsNummer, land, kanton, leistungsart,
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
          {/* Adresse über die geteilte Komponente: im Bearbeiten AdressBlock,
              im Lesemodus der zusammengesetzte String. Keine Strasse/PLZ/Ort-
              Felder ausserhalb von AdressBlock (§3). */}
          {editingSection === "adresse" && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              {/* Voll-Variante: Gemeinde, BFS-Nummer und Kanton stehen im Block
                  (Erfassung + Suchauflösung an EINER Stelle, kein separates Kantonfeld). */}
              <AdressBlock
                variante="voll"
                wert={{ strasse, plz, ort, land, gemeinde, bfsNummer, kanton }}
                onChange={patch => {
                  if (patch.strasse !== undefined) setStrasse(patch.strasse);
                  if (patch.plz !== undefined) setPlz(patch.plz);
                  if (patch.ort !== undefined) setOrt(patch.ort);
                  if (patch.land !== undefined) setLand(patch.land);
                  if (patch.gemeinde !== undefined) setGemeinde(patch.gemeinde);
                  if (patch.bfsNummer !== undefined) setBfsNummer(patch.bfsNummer);
                  if (patch.kanton !== undefined) setKanton(patch.kanton);
                }} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editingSection !== "adresse" && (
              <PEditableField label="Adresse" value={patientAdresse(patient)} editing={false} onChange={() => {}} />
            )}
            {/* Gemeinde und Kanton stehen im Lesemodus als Anzeige; im Bearbeiten
                sind sie Teil des AdressBlock (voll), nicht doppelt. */}
            {editingSection !== "adresse" && (
              <PEditableField label="Politische Gemeinde" value={patientGemeinde(patient)} editing={false} onChange={() => {}} />
            )}
            {editingSection !== "adresse" && (
              <KantonFeld value={kanton} editing={false} onChange={setKanton} />
            )}
            {patient.pflegeortAbweichend && (
              <PEditableField label="Pflegeort" value={adresseAnzeige(patient.pflegeortStrasse, patient.pflegeortPlz, patient.pflegeortOrt)} editing={false} onChange={() => {}} />
            )}
            {/* Quelle ist BB13 im Reiter Personalien — hier nur Anzeige. */}
            <PEditableField label="Sprache" value={patient.sprache} editing={false} onChange={() => {}} />
            <PEditableField label="Leistungsart" value={leistungsart} editing={editingSection === "adresse"} onChange={setLeistungsart} />
            {/* Quelle ist AA2 im Reiter Anmeldung — hier nur Anzeige, nicht bearbeitbar. */}
            {/* Aufnahmedatum, letzter Besuch und Bezugsperson stehen in der
                Kopfzeile darüber — hier standen sie ein zweites Mal. */}
          </div>
        </PSectionCard>

        {/* Versicherungen & Arzt — dieselbe Versicherungsliste wie im Reiter Personalien */}
        <PSectionCard title="Versicherungen & Arzt" icon={Shield}>
          <div className="space-y-3">
            <VersicherungenAbschnitt patientId={patient.id} />

            <div className="border-t border-border-light pt-3" />

              <div className="flex items-center gap-3 min-h-[32px]">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>Hausarzt</div>
                  {hausarztKontakt ? (
                    <div className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>
                      {kontaktName(hausarztKontakt)}
                      {hausarztKontakt.zugehoerigkeit && <span className="text-muted-foreground ml-2 text-[11px]">{hausarztKontakt.zugehoerigkeit}</span>}
                    </div>
                  ) : (
                    /* Erklärter Leerzustand statt eines Telefonsymbols ohne
                       Nummer: ohne Hausarzt lässt sich keine Verordnung
                       einholen, und ohne Verordnung darf nicht abgerechnet
                       werden. Das ist keine Nebensache, sondern der Anfang
                       der Kette. */
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", maxWidth: "62ch", lineHeight: 1.5 }}>
                      Kein Hausarzt erfasst. Ohne ihn kann keine ärztliche Verordnung eingeholt werden.
                    </div>
                  )}
                </div>
                {hausarztKontakt?.telefon.trim() && (
                  <a href={`tel:${hausarztKontakt.telefon}`} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors shrink-0" style={{ fontWeight: 400 }}>
                    <Phone className="w-3 h-3" />
                    {hausarztKontakt.telefon}
                  </a>
                )}
              </div>
            </div>
        </PSectionCard>
      </div>

      {/* ═══ RIGHT COLUMN ═══ */}
      <div className="xl:col-span-1 space-y-4">

        <NotizKarte patient={patient} />

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

/** Liegt das Datum vor der Gegenwart? */
function isOverdue(iso: string): boolean {
  return new Date(iso) < GEGENWART;
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

        {/* Karte 3 „Stationärer Verlauf" ist nach Patient › Vorgeschichte
            gewandert: die Anamnese ist eine Erhebung zum Aufnahmezeitpunkt,
            ein Spitalaufenthalt ein Ereignis der Vorgeschichte. Allergien und
            Hilfsmittel bleiben hier — sie sind Teil der Erhebung. */}
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
    /* Nach einem Austritt ist kein Mandat mehr anzulegen — es gäbe nichts
       mehr abzurechnen. Die beendeten bleiben sichtbar: eine Kasse kann
       rückwirkend prüfen. */
    const austritt = austrittVon(patient);
    return (
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Mandate</h3>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 6, maxWidth: 560 }}>
          {austritt
            ? `Die Betreuung ist beendet — ${austrittText(austritt)}. Ein neues Mandat entsteht hier nicht mehr.`
            : "Noch kein Mandat erfasst. Ohne Abrechnungsbeziehung lässt sich weder eine Finanzierung noch eine Verordnung zuordnen."}
        </p>
        {!austritt && (
          <div style={{ marginTop: 14 }}>
            <AppButton variant="primaer" icon={Plus}>Mandat erfassen</AppButton>
          </div>
        )}
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
            <MandatAuswahl label="Versicherer *" wert={entwurf.versichererId} optionen={KRANKENKASSEN_OPTIONS}
              anzeige={getKrankenkasseLabel(entwurf.versichererId)} bearbeitet={bearbeitet}
              fehler={fehlend.includes("versicherer") ? "Bei einer Versichertenleistung erforderlich." : undefined}
              onChange={v => setzeFeld("versichererId", v)} />
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
        <MandatFeld label="Versicherer" wert={getKrankenkasseLabel(mandat.versichererId)} />
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
   ANSICHT: Einsätze › Pflegekontrolle

   Die angehörige Person erfasst täglich in einer eigenen mobilen Anwendung;
   hier prüft die diplomierte Pflegefachperson. Der Zeitraum ist der Monat,
   nicht die Woche: ein Wochentag, der regelmässig ausfällt, zeigt sich erst
   über vier Vorkommen. Der Monatskalender rastert deshalb nach Wochentagen —
   ein Muster steht dann untereinander in einer Spalte.
   ══════════════════════════════════════════ */

/** Anzeigename des Urhebers — Mitarbeitende tragen ihren Namen, Angehörige eine Kennung. */
function urheberName(u: EinsatzUrheber): string {
  if (u.art === "mitarbeitende") return u.name;
  const a = getAngehoerige().find(x => x.id === u.kennung);
  return a ? `${a.vorname} ${a.nachname}` : u.kennung;
}

/* Zahlwörter mit Beugung. „An ein Tag" liest sich falsch, und ein Text, der
   falsch klingt, wird nicht geglaubt — auch wenn die Zahl darin stimmt. */
const ANZAHL_WORT = ["kein", "ein", "zwei", "drei", "vier", "fünf", "sechs",
  "sieben", "acht", "neun", "zehn", "elf", "zwölf"];

/** „ein" bis „zwölf", darüber die Ziffer. */
function anzahlWort(n: number): string {
  return n < ANZAHL_WORT.length ? ANZAHL_WORT[n] : String(n);
}

/** Dativ mit Nomen: „an einem Tag" / „an drei Tagen". */
function anTagen(n: number): string {
  return n === 1 ? "an einem Tag" : `an ${anzahlWort(n)} Tagen`;
}

/** „Zwei Mandate" — Zahlwort gross, weil es einen Satz beginnt. */
function mandateWort(n: number): string {
  const w = anzahlWort(n);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)} Mandate`;
}

/** Nominativ ohne Nomen: „einer" / „drei" — für „davon … ohne Begründung". */
function davon(n: number): string {
  return n === 1 ? "einer" : anzahlWort(n);
}

/* Wer im Cockpit angemeldet ist. Dieselbe Person wie in den übrigen
   Schreibwegen — für den Prototyp fest, nicht erfunden je Aufrufstelle. */
const AKTUELLE_FACHPERSON = "Maria Keller";

/** Farbgebung einer Tageskachel nach Richtung der Abweichung. */
function tagesFarbe(t: Monatstag): { bg: string; text: string; rand: string } {
  if (t.fehlt) return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", rand: "var(--status-warning-text)" };
  if (t.einsaetze.length === 0) return { bg: "transparent", text: "var(--text-tertiary)", rand: "transparent" };
  if (t.abweichung < 0) return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", rand: "transparent" };
  if (t.abweichung > 0) return { bg: "var(--status-info-bg)", text: "var(--status-info)", rand: "transparent" };
  return { bg: "var(--bg-secondary)", text: "var(--text-primary)", rand: "transparent" };
}

function AnsichtPflegekontrolle({ patient }: { patient: Patient }) {
  const nav = useNavigate();
  const alleEinsaetze = useEinsaetze();
  const alleLeistungen = useErbrachteLeistungen();
  const klvs = useKlvVerordnungen().filter(k => k.patientId === patient.id);
  const alleMandate = useMandate();
  const alleVerordnungen = useVerordnungen();
  const blatt = [...klvs].filter(k => k.status !== "ersetzt").sort((a, b) => b.version - a.version)[0] || null;
  const [meldung, setMeldung] = useState("");
  /* Zeitraum als Jahr/Monat, nicht als Datum: die Schaltung bewegt sich in
     Monatsschritten, ein Tag im Zustand liesse Zwischenstände zu, die es nicht
     gibt. Startwert ist der Monat der Bezugswoche. */
  /* Kommt der Aufruf aus der Kontrollliste, trägt die Adresse den dort
     gewählten Monat (?monat=JJJJ-MM). Ohne ihn zeigte diese Ansicht ihren
     eigenen Startmonat und damit andere Zahlen als die Zeile, die hierher
     verwiesen hat. Einmalig gelesen — danach schaltet der Benutzer. */
  const [zeitraum, setZeitraum] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("monat");
    const m = p && /^(\d{4})-(\d{2})$/.exec(p);
    return m
      ? { jahr: Number(m[1]), monat: Number(m[2]) - 1 }
      : { jahr: EINSATZ_BEZUGSMONAT.getFullYear(), monat: EINSATZ_BEZUGSMONAT.getMonth() };
  });
  const [gewaehlterTag, setGewaehlterTag] = useState<string | null>(null);
  /* Der Zeitpunkt der Einordnung wird einmal genommen und bleibt stehen, bis
     jemand neu erzeugen lässt — sonst wanderte er bei jedem Neuzeichnen. */
  const [erzeugtAm, setErzeugtAm] = useState(() => jetztAnzeige());

  const leistungenVon = (id: string) => alleLeistungen.filter(l => l.einsatzId === id);
  const positionVon = (positionId: string) =>
    blatt?.leistungspositionen.find(p => p.id === positionId) ?? null;

  /* Eine Rechnung für zwei Orte: dieselbe Funktion speist die Liste unter
     /kontrolle. Zwei Rechnungen liefen auseinander, und dann stünde dort eine
     andere Zahl als hier. */
  const k = monatsKennzahlen(patient.id, zeitraum.jahr, zeitraum.monat, {
    einsaetze: alleEinsaetze, leistungen: alleLeistungen,
    klvs, mandate: alleMandate, verordnungen: alleVerordnungen,
  });
  const { tage, muster, abrechnung, gemeldet, verordnung: gueltigeVerordnung, sollProTag } = k;
  /* Ist der Monat abgeschlossen, sind alle Schreibwege gesperrt — das steht
     im Kopf, damit niemand vergeblich auf „Bestätigen" drückt. */
  const alleAbschluesse = useAbschluesse();
  const abgeschlossen = alleAbschluesse.find(a =>
    a.patientId === patient.id && a.jahr === zeitraum.jahr && a.monat === zeitraum.monat) ?? null;
  const bilanz = abweichungNachRichtung(tage);

  const positionen = blatt?.leistungspositionen ?? [];
  const taeglicheIds = new Set(positionen.filter(istTaeglich).map(p => p.id));
  const istTaeglichePosition = (id: string) => taeglicheIds.has(id);

  const tagVon = (datum: string) => tage.find(t => t.datum === datum) ?? null;
  const gewaehlt = gewaehlterTag ? tagVon(gewaehlterTag) : null;

  const monatWechseln = (schritt: number) => {
    setGewaehlterTag(null);
    setZeitraum(z => {
      const d = new Date(z.jahr, z.monat + schritt, 1);
      return { jahr: d.getFullYear(), monat: d.getMonth() };
    });
  };

  /* Blättern nur über Tage, die etwas zeigen — leere Tage ohne Soll wären ein
     Klick ins Nichts. */
  const blaetterbar = tage.filter(t => t.einsaetze.length > 0 || t.fehlt);
  const nachbartag = (schritt: number): Monatstag | null => {
    if (!gewaehlt) return null;
    const i = blaetterbar.findIndex(t => t.datum === gewaehlt.datum);
    return i < 0 ? null : blaetterbar[i + schritt] ?? null;
  };

  const offeneImMonat = tage.flatMap(t => t.einsaetze).filter(e => e.pruefzustand !== "geprueft");

  /* Nach dem Austritt gibt es keine Monate mehr, nur noch Kalender. Der
     Austrittsmonat selbst zählt nicht dazu — an seinen Tagen wurde gepflegt. */
  const austritt = austrittVon(patient);
  const monatBeendet = austritt !== null && monatNachAustritt(austritt, zeitraum.jahr, zeitraum.monat);

  const alleStimmigenBestaetigen = () => {
    const stimmig = tage
      .filter(t => !t.fehlt && t.abweichung === 0)
      .flatMap(t => t.einsaetze)
      .filter(e => e.pruefzustand === "zu_pruefen" && !hatAbweichung(leistungenVon(e.id)));
    stimmig.forEach(e => einsatzBestaetigen(e.id));
    setMeldung(`${stimmig.length} Einsätze ohne Abweichung bestätigt.`);
  };

  const rueckfrageStellen = (e: Einsatz) => {
    const text = `Rückfrage zum Einsatz vom ${e.datum} bei ${patient.nachname}, ${patient.vorname}`;
    einsatzRueckfrage(e.id, text);
    setMeldung(`Pendenz erstellt: „${text}". Der Einsatz bleibt offen.`);
  };

  const min = (n: number) => `${Math.round(n)} min`;

  /* ── Annas Einordnung: ausschliesslich gerechnet ──────────────────────────
     Jeder Satz zählt etwas ab, das im Kalender darüber sichtbar ist. Nichts
     wird geschätzt, nichts geraten, und kein Berichtsinhalt wird gelesen —
     Anna sagt, was zu prüfen ist, nicht was jemand geschrieben hat. */
  const einordnung: string[] = [];
  if (blatt) {
    if (muster.wochentag !== null && muster.tage.length >= 2) {
      einordnung.push(`Alle ${anzahlWort(muster.tage.length)} Tage ohne Erfassung fallen auf einen ${WOCHENTAGE_LANG[muster.wochentag]} — zusammen ${min(bilanz.ausgefallen)}. Das ist ein Muster, keine Reihe von Zufällen.`);
    } else if (muster.tage.length > 0) {
      einordnung.push(`${anTagen(muster.tage.length).replace(/^an /, "An ")} ist kein Einsatz erfasst, obwohl ein Tagessoll besteht. Ein gemeinsamer Wochentag ist nicht erkennbar.`);
    }
    const zuVielTage = tage.filter(t => t.abweichung > 0 && !t.fehlt);
    const zuWenigTage = tage.filter(t => t.abweichung < 0 && !t.fehlt);
    if (zuVielTage.length > 0) {
      const ohneGrund = zuVielTage.filter(t =>
        !t.einsaetze.some(e => leistungenVon(e.id).some(l => l.grund.trim() !== "")));
      einordnung.push(`${anTagen(zuVielTage.length).replace(/^an /, "An ")} wurde mehr gestempelt als verordnet, zusammen ${min(bilanz.zuViel)}${ohneGrund.length > 0 ? ` — davon ${davon(ohneGrund.length)} ohne Begründung` : ""}. Mehr als verordnet fällt bei der Kasse auf.`);
    }
    if (zuWenigTage.length > 0) {
      einordnung.push(`${anTagen(zuWenigTage.length).replace(/^an /, "An ")} blieb die gestempelte Zeit unter dem Tagessoll, zusammen ${min(bilanz.zuWenigErbracht)}.`);
    }
    const mitBericht = tage.filter(t => t.hatBericht).length;
    const mitEinsatz = tage.filter(t => t.einsaetze.length > 0).length;
    if (mitEinsatz > 0) {
      einordnung.push(`An ${mitBericht} von ${mitEinsatz} Tagen mit Einsatz liegt ein Pflegebericht vor.`);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Kopfzeile: Zeitraum und Tagessoll ── */}
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "14px 18px" }}>
        <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 2 }}>
            <button type="button" onClick={() => monatWechseln(-1)} aria-label="Vorheriger Monat"
              className="ui-fokusring cursor-pointer flex items-center justify-center"
              style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", color: "var(--text-secondary)" }}>
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", minWidth: 132, textAlign: "center" }}>
              {MONATE[zeitraum.monat]} {zeitraum.jahr}
            </span>
            <button type="button" onClick={() => monatWechseln(1)} aria-label="Nächster Monat"
              className="ui-fokusring cursor-pointer flex items-center justify-center"
              style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", color: "var(--text-secondary)" }}>
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <span style={{ marginLeft: "auto", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
            {blatt ? `Tagessoll ${min(sollProTag)} · Blatt ${blatt.id} · V${blatt.version}` : "Kein aktives Blatt"}
          </span>
          {/* Der Abschluss geschieht auf dem Monatsabschluss über alle
              Patienten — dort steht, ob der Monat überhaupt reif ist, und
              dort wird bestätigt. Hier führt nur der Weg dorthin. */}
          {abgeschlossen ? (
            <span className="inline-flex items-center" style={{ gap: 6, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)" }}>
              <Lock style={{ width: 11, height: 11 }} />
              Abgeschlossen am {abgeschlossen.zeitpunkt} durch {abgeschlossen.person}
            </span>
          ) : monatBeendet ? (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
              Nach dem Austritt
            </span>
          ) : (
            <button type="button" onClick={() => nav(`/abschluss?monat=${zeitraum.jahr}-${String(zeitraum.monat + 1).padStart(2, "0")}`)}
              className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
              Monat abschliessen
            </button>
          )}
        </div>
      </div>

      {monatBeendet && austritt ? (
        /* Der Kopf mit der Monatsschaltung bleibt stehen — von hier führt der
           Weg zurück in die Monate, in denen gepflegt wurde. */
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "16px 18px" }}>
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
            Der Patient ist {austrittText(austritt)}. In diesem Monat wurde nicht mehr gepflegt —
            es gibt nichts zu prüfen und nichts abzurechnen. Die Monate bis zum Austritt sind
            unverändert bedienbar.
          </p>
        </div>
      ) : (<>
      {/* ── Abrechenbare Minuten gegen die Bedarfsmeldung ──
          Nicht mehr vier gleich grosse Zahlen ohne Rangfolge. Was zählt, ist
          die abrechenbare Menge je Leistungsart gegen das Gemeldete; alles
          andere beschreibt Pflegequalität und steht im Kalender. */}
      <Abrechnungsleiste
        abrechnung={abrechnung} tage={tage} monat={zeitraum.monat}
        verordnung={gueltigeVerordnung} hatMeldung={gemeldet !== null} muster={muster}
        onVerordnung={() => nav(ansichtPfad(patient.id, "verordnung"))}
      />

      {meldung && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--status-info-bg)", fontSize: "var(--text-meta)", color: "var(--status-info)" }}>{meldung}</div>
      )}

      {/* ── Kalender ── */}
      <PSectionCard title="Monat im Überblick" icon={Clock}>
        <Monatskalender
          tage={tage} jahr={zeitraum.jahr} monat={zeitraum.monat}
          gewaehlt={gewaehlterTag} hatSoll={!!blatt}
          onWaehlen={d => setGewaehlterTag(v => (v === d ? null : d))}
        />
      </PSectionCard>

      {/* ── Tagesansicht unter dem Kalender, über die volle Breite ──
          Nicht als Seitenspalte: ein Pflegebericht ist mehrere Absätze lang,
          und in 360 px passen keine 45 Zeichen je Zeile. Nicht als Dialog:
          der Vergleich mit dem Kalender darüber soll bestehen bleiben. */}
      {gewaehlt && (
        <Tagesansicht
          gesperrt={abgeschlossen !== null}
          tag={gewaehlt} monat={zeitraum.monat}
          positionVon={positionVon} leistungenVon={leistungenVon}
          hatSoll={!!blatt} istTaeglichePosition={istTaeglichePosition}
          vorheriger={nachbartag(-1)} naechster={nachbartag(1)}
          onBlaettern={setGewaehlterTag}
          onSchliessen={() => setGewaehlterTag(null)}
          onBestaetigen={einsatzBestaetigen} onRueckfrage={rueckfrageStellen}
          onBericht={(id, text) => { berichtSchreiben(id, text, AKTUELLE_FACHPERSON, jetztAnzeige()); setMeldung(""); }}
        />
      )}

      {/* ── Ein Abschnitt zum Prüfen ──
          Vorher standen Annas Befunde und die Tagesliste getrennt und sagten
          dasselbe: vier fehlende Sonntage hier, dieselben vier Tage dort. Wer
          handeln will, liest es zweimal und scrollt dann. Jetzt steht die
          Einordnung über den Gruppen, in denen gehandelt wird. */}
      <ZuPruefen
        gesperrt={abgeschlossen !== null}
        tage={tage} monat={zeitraum.monat} offen={offeneImMonat.length}
        einordnung={einordnung} erzeugtAm={erzeugtAm}
        gewaehlt={gewaehlterTag} leistungenVon={leistungenVon}
        onOeffnen={setGewaehlterTag}
        onBestaetigen={einsatzBestaetigen} onRueckfrage={rueckfrageStellen}
        onAlleStimmigen={alleStimmigenBestaetigen}
        onFehlende={art => setMeldung(art === "nachtragen"
          ? "Nachtragen geschieht in der Erfassung der angehörigen Person — hier lässt sich kein Einsatz anlegen, den niemand geleistet hat."
          : "Rückfrage vermerkt. Für Tage ohne Erfassung entsteht die Pendenz an der Betreuung, nicht am Einsatz — es gibt keinen.")}
        onNeuErzeugen={() => setErzeugtAm(jetztAnzeige())}
        onStimmtNicht={() => setMeldung("Vermerkt. Die Einordnung wird gerechnet, nicht erzeugt — eine Rückmeldung ändert die Zahlen nicht, sondern die Regel dahinter.")}
      />
      </>)}
    </div>
  );
}


/* ══════════════════════════════════════════
   GRUPPE PATIENT — Stammdaten, Beziehungen, Vorgeschichte, Diagnosen
   ══════════════════════════════════════════ */

/**
 * Stammdaten — lesen, dann ausdrücklich bearbeiten.
 *
 * Vorher sahen alle Felder immer wie Eingaben aus und schrieben beim
 * Verlassen des Feldes. In einem Dossier, das bei einer Kassenkontrolle
 * geprüft wird, darf eine Änderung nicht beiläufig entstehen: sie braucht
 * einen Klick, der sie will, und einen zweiten, der sie bestätigt.
 */
function AnsichtStammdaten({ patient }: { patient: Patient }) {
  /* Ein Modus für die ganze Ansicht. Vorher trug jede Karte ihren eigenen
     Knopf und es durfte nur eine offen sein; wer Angaben aus drei Karten
     nachführte, klickte neunmal. Der Umfang ungesicherter Änderungen ist
     jetzt die Ansicht — das übliche Mass für ein Formular. */
  const [bearbeiten, setBearbeiten] = useState(false);
  const [entwurf, setEntwurf] = useState<Record<string, string>>({});
  const [protokoll, setProtokoll] = useState<{ feld: string; wert: string; wann: string }[]>([]);
  const [frage, setFrage] = useState<string | null>(null);

  const wert = (k: keyof Patient) => String(patient[k] ?? "");
  const feld = (k: keyof Patient) => entwurf[k] ?? wert(k);

  /* Sechs Karten statt drei — der Zuschnitt folgt dem, was das
     Abklärungsgespräch erhebt. „Sozialversicherung und Steuern" steht nicht
     im ursprünglichen Rahmen: die Bezüge beschreiben die Person, nicht ihre
     Versicherung, und zehn Felder in einer Karte wären keine Übersicht mehr.
     Eine Karte „Vertretung" fehlt, weil Vorsorgeauftrag, Beistandschaft und
     Patientenverfügung im Gespräch nicht erhoben werden — drei leere Felder
     wären eine Behauptung. */
  const KARTEN: Record<string, { k: keyof Patient; label: string; anzeige?: (v: string) => string; optionen?: { value: string; label: string }[] }[]> = {
    kontakt: [
      // Adresse (Strasse/PLZ/Ort) läuft über AdressBlock in der Kontakt-Karte, nicht als Einzelfelder.
      // Politische Gemeinde: abgeleitet (patientGemeinde), nicht direkt editierbar — Erfassung im Onboarding.
      { k: "bfsNummer", label: "BFS-Nummer" },
      { k: "kanton", label: "Kanton", optionen: KANTON_OPTIONS },
      { k: "telefon", label: "Telefon (Festnetz)" },
      { k: "mobil", label: "Mobil" },
      { k: "email", label: "E-Mail" },
      { k: "sprache", label: "Sprache" },
      { k: "spracheAndere", label: "Sprache, andere" },
      { k: "uebersetzerNotwendig", label: "Übersetzer notwendig", anzeige: patientfeldLabel.jaNein },
    ],
    wohnsituation: [
      { k: "wohnsituation", label: "Wohnform", anzeige: patientfeldLabel.wohnsituation },
      { k: "formZusammenleben", label: "Zusammenleben", anzeige: patientfeldLabel.zusammenleben },
      { k: "neuZusammenlebend", label: "Neu zusammenlebend", anzeige: patientfeldLabel.jaNein },
      { k: "etage", label: "Etage" },
      { k: "liftVorhanden", label: "Lift", anzeige: patientfeldLabel.jaNein },
      { k: "treppen", label: "Treppen" },
      { k: "personenImHaushalt", label: "Personen im Haushalt" },
    ],
    // Versicherungen kommen aus der geteilten Versicherungsliste, nicht aus
    // Patientenfeldern — die Karte rendert VersicherungenAbschnitt (siehe karte()).
    versicherung: [],
    // Hausarzt und Spezialärzte sind Beziehungen (Bezugs- und Pflegeteam),
    // keine Patientenfelder mehr — die Arztkarte trägt nur noch den Verweis.
    arzt: [],
    sozial: [
      { k: "ivBezug", label: "IV-Bezug" },
      { k: "ivBezugProzent", label: "IV-Grad" },
      { k: "hilflosenentschaedigung", label: "Hilflosenentschädigung" },
      { k: "hilflosenentschaedigungGrad", label: "Grad" },
      { k: "assistenzbeitrag", label: "Assistenzbeitrag" },
      { k: "quellensteuerHinweise", label: "Hinweise zur Quellensteuer" },
    ],
  };

  /* Eine Karte, in der kein einziges Feld erhoben ist, sagt im Lesezustand
     nichts — und die Felder stehen bei den bestehenden Patienten alle leer,
     weil die Übernahme erst für neue Abschlüsse greift.
     Im Bearbeiten-Modus erscheint sie trotzdem: sonst wären ihre Felder über
     die Oberfläche nie erreichbar, und eine leere Karte liesse sich nie
     füllen. */
  const zeigen = (id: string) => bearbeiten || KARTEN[id].some(f => wert(f.k).trim() !== "");

  const geaendert = Object.entries(entwurf).some(([k, v]) => v !== wert(k as keyof Patient));

  /* Ein Zug über alle Karten. Je geändertem Feld ein Protokolleintrag —
     dieselbe Körnung wie vorher, nur nicht mehr je Karte getrennt. */
  const sichern = () => {
    const neu: Partial<Patient> = {};
    const eintraege: typeof protokoll = [];
    const jetzt = jetztAnzeige();
    for (const felder of Object.values(KARTEN)) {
      for (const f of felder) {
        const v = entwurf[f.k];
        if (v !== undefined && v !== wert(f.k)) {
          (neu as Record<string, string>)[f.k] = v;
          eintraege.push({ feld: f.label, wert: v, wann: jetzt });
        }
      }
    }
    if (Object.keys(neu).length > 0) {
      aktualisierePatient(patient.id, neu);
      setProtokoll(p => [...eintraege, ...p].slice(0, 8));
    }
    setEntwurf({});
    setBearbeiten(false);
  };

  const abbrechen = () => { setEntwurf({}); setBearbeiten(false); setFrage(null); };

  /* Wer die Ansicht mit offenen Änderungen verlässt, wird gefragt — sonst
     verschwände die Arbeit ohne Hinweis. Zwei Wege hinaus: die Navigation
     (abgefangen am Klick weiter unten) und das Schliessen des Fensters. */
  useEffect(() => {
    if (!bearbeiten || !geaendert) return;
    const warnen = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    /* Die Seitennavigation liegt ausserhalb dieser Ansicht — der Listener
       muss deshalb am Dokument hängen und in der Erfassungsphase greifen,
       bevor der Router die Ansicht wechselt. */
    const abfangen = (e: MouseEvent) => {
      const ziel = (e.target as HTMLElement | null)?.closest("a,button");
      /* Die Karten selbst und der Frage-Dialog sind ausgenommen — sonst
         liesse sich der Dialog nicht mehr schliessen, den er auslöst. */
      if (!ziel || ziel.closest("[data-stammkarte]") || ziel.closest("[data-verlassen-frage]")) return;
      e.preventDefault();
      e.stopPropagation();
      setFrage("Ansicht wechseln");
    };
    window.addEventListener("beforeunload", warnen);
    document.addEventListener("click", abfangen, true);
    return () => {
      window.removeEventListener("beforeunload", warnen);
      document.removeEventListener("click", abfangen, true);
    };
  }, [bearbeiten, geaendert]);

  /* Die Karte trägt keinen Knopf mehr — der Modus gehört der Ansicht. */
  const karte = (id: string, titel: string, icon: React.ElementType) => {
    // Versicherungen: geteilte Liste statt Patientenfelder — dieselbe Komponente
    // wie im Reiter Personalien, mit eigenem Hinzufügen/Bearbeiten.
    if (id === "versicherung") {
      return (
        <PSectionCard title={titel} icon={icon}>
          <VersicherungenAbschnitt patientId={patient.id} />
        </PSectionCard>
      );
    }
    return (
    <PSectionCard title={titel} icon={icon} editing={bearbeiten}>
      {/* Kontakt-Karte: die Adresse über den geteilten AdressBlock, nicht über
          einzelne Strasse/PLZ/Ort-Felder (§3). Im Lesemodus zusammengesetzt. */}
      {id === "kontakt" && (
        bearbeiten ? (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <AdressBlock
              wert={{ strasse: feld("strasse"), plz: feld("plz"), ort: feld("ort") }}
              onChange={patch => setEntwurf(e => ({ ...e, ...patch }))} />
          </div>
        ) : (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <StammFeld label="Adresse" wert={adresseAnzeige(feld("strasse"), feld("plz"), feld("ort"))} bearbeiten={false} onAendern={() => {}} />
          </div>
        )
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--space-4)" }}>
        {KARTEN[id].map(f => (
          <StammFeld key={String(f.k)} label={f.label} wert={feld(f.k)} bearbeiten={bearbeiten}
            anzeige={f.anzeige} optionen={f.optionen} onAendern={v => setEntwurf(e => ({ ...e, [f.k]: v }))} />
        ))}
      </div>
      {id === "arzt" && (
        <div style={{ marginTop: 12, fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "74ch", lineHeight: 1.55 }}>
          Der Hausarzt steht unter Beziehungen: er ist ein Kontakt und kann mehrere Patienten
          betreuen. Ohne ihn kann keine ärztliche Verordnung eingeholt werden.
        </div>
      )}
    </PSectionCard>
    );
  };

  return (
    <div className="space-y-4" data-stammkarte>
      {/* ── Kopf der Ansicht: ein Knopf für alle Karten ──
          Klebend nur im Bearbeiten-Modus: die Ansicht ist sechs Karten hoch,
          und wer unten etwas ändert, muss Speichern erreichen, ohne nach oben
          zu rollen. Im Lesezustand hat eine mitlaufende Leiste keinen Zweck
          und nähme nur Platz. Der Versatz kommt aus der Höhe des
          Dossierkopfs, der seinerseits stehen bleibt. */}
      <div style={{
        position: bearbeiten ? "sticky" : "static",
        top: bearbeiten ? "var(--dossier-kopf, 0px)" : undefined,
        zIndex: 15,
        background: "var(--bg-elevated)",
        border: "var(--border-thin) solid var(--border-default)",
        borderRadius: "var(--radius-card)",
        padding: "10px 18px",
      }}>
        <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
          <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Stammdaten
          </h3>
          {bearbeiten && (
            <span style={{ fontSize: "var(--text-meta)", color: "var(--status-info)", maxWidth: "62ch", lineHeight: 1.5 }}>
              Wird bearbeitet. Änderungen werden erst beim Sichern übernommen und mit Person und
              Zeitpunkt protokolliert.
            </span>
          )}
          <div className="flex items-center" style={{ gap: 10, marginLeft: "auto" }}>
            {bearbeiten ? (
              <>
                <button type="button" onClick={abbrechen} className="ui-fokusring cursor-pointer inline-flex items-center"
                  style={{ gap: 5, background: "none", border: "none", padding: "4px 8px", fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                  <X style={{ width: 13, height: 13 }} /> Abbrechen
                </button>
                <AppButton variant="sekundaer" icon={Check} onClick={sichern}>Speichern</AppButton>
              </>
            ) : (
              <button type="button" onClick={() => { setBearbeiten(true); setEntwurf({}); }}
                className="ui-fokusring cursor-pointer inline-flex items-center"
                style={{ gap: 5, background: "none", border: "none", padding: "4px 8px", fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)" }}>
                <Pencil style={{ width: 13, height: 13 }} /> Bearbeiten
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3" style={{ gap: "var(--space-4)" }}>
      <div className="xl:col-span-2 space-y-4">
        {/* Identität bleibt gesperrt: sie beschreibt den Zustand bei Eintritt
            und wurde im Abklärungsgespräch erhoben. */}
        <PSectionCard title="Identität" icon={Users}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 11px", borderRadius: 10, background: "var(--bg-secondary)", marginBottom: 12 }}>
            <Lock style={{ width: 13, height: 13, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "74ch", lineHeight: 1.55 }}>
              Aus dem abgeschlossenen Abklärungsgespräch übernommen. Diese Angaben beschreiben den
              Zeitpunkt des Eintritts und sind hier nicht änderbar.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--space-4)" }}>
            <PDataField label="Nachname" value={patient.nachname} />
            <PDataField label="Vorname" value={patient.vorname} />
            <PDataField label="Geburtsdatum" value={patient.geburtsdatum} />
            <PDataField label="AHV-Nummer" value={<MaskedAhv ahv={patient.ahvNummer} />} />
            <PDataField label="Geschlecht" value={patientfeldLabel.geschlecht(patient.geschlecht) || "nicht erfasst"} />
            <PDataField label="Zivilstand" value={patientfeldLabel.zivilstand(patient.zivilstand) || "nicht erfasst"} />
            <PDataField label="Staatsangehörigkeit" value={patientfeldLabel.staatsangehoerigkeit(patient.staatsangehoerigkeit) || "nicht erfasst"} />
            <PDataField label="Heimatort" value={patient.heimatort || "nicht erfasst"} />
            <PDataField label="Aufenthaltsstatus" value={patientfeldLabel.aufenthaltsstatus(patient.aufenthaltsstatus) || "nicht erfasst"} />
            {/* Bei Sterbebegleitung und Ernährung fachlich erheblich — ein im
                Gespräch erfragtes Feld, das danach verschwindet, ist schlimmer
                als eines ohne Auswertung. */}
            <PDataField label="Konfession" value={patientfeldLabel.konfession(patient.konfession) || "nicht erfasst"} />
            <PDataField label="Aufnahmedatum" value={patient.aufnahmeDatum} />
            <PDataField label="Kennung" value={patient.id} mono />
          </div>
        </PSectionCard>

        {karte("kontakt", "Kontakt", MapPin)}
        {zeigen("wohnsituation") && karte("wohnsituation", "Wohnsituation", Home)}
        {karte("versicherung", "Versicherung", Shield)}
        {karte("arzt", "Ärztliche Betreuung", Stethoscope)}
        {zeigen("sozial") && karte("sozial", "Sozialversicherung und Steuern", Landmark)}
      </div>

      <div className="xl:col-span-1">
        <PSectionCard title="Letzte Änderungen" icon={Clock}>
          {protokoll.length === 0 ? (
            <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0 }}>
              In dieser Sitzung wurde noch kein Feld geändert.
            </p>
          ) : (
            <div className="flex flex-col" style={{ gap: 7 }}>
              {protokoll.map((e, i) => (
                <div key={i}>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>{e.feld}: {e.wert || "—"}</div>
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{e.wann} · {AKTUELLE_FACHPERSON}</div>
                </div>
              ))}
            </div>
          )}
        </PSectionCard>
      </div>
      </div>

      {frage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--text-primary) 40%, transparent)", padding: 16 }}
          role="dialog" aria-modal="true" aria-label="Änderungen verwerfen" data-verlassen-frage>
          <div style={{ width: "100%", maxWidth: 420, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", padding: "var(--space-6)" }}>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-semibold)", marginBottom: 8 }}>Änderungen verwerfen?</div>
            <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
              In dieser Ansicht sind Änderungen offen, die noch nicht gesichert wurden. Verlassen
              Sie sie, gehen sie verloren.
            </p>
            <div className="flex items-center justify-end" style={{ gap: 10 }}>
              <button type="button" onClick={() => setFrage(null)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: "6px 10px", fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                Weiter bearbeiten
              </button>
              <AppButton variant="sekundaer" onClick={abbrechen}>Verwerfen</AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ein Feld — im Lesezustand Text, im Bearbeitenzustand Eingabe. */
function StammFeld({ label, wert, bearbeiten, anzeige, optionen, onAendern }: {
  label: string; wert: string; bearbeiten: boolean;
  /** Löst einen Code in Klartext auf; fehlt sie, steht der Wert selbst da. */
  anzeige?: (v: string) => string;
  /** Wenn gesetzt: Auswahl statt Textfeld (z. B. Kanton). */
  optionen?: { value: string; label: string }[];
  onAendern: (v: string) => void;
}) {
  const feldStil: React.CSSProperties = {
    width: "100%", padding: "5px 8px", borderRadius: 8, fontFamily: "inherit", fontSize: "var(--text-small)",
    color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  };
  if (!bearbeiten) {
    const text = anzeige ? anzeige(wert) : wert;
    return (
      <div>
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: "var(--text-small)", color: text.trim() ? "var(--text-primary)" : "var(--text-tertiary)", minHeight: 19 }}>
          {text.trim() || "nicht erfasst"}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
      {optionen ? (
        <select value={wert} onChange={e => onAendern(e.target.value)} aria-label={label} className="ui-fokusring" style={feldStil}>
          <option value="">Bitte wählen</option>
          {optionen.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input value={wert} onChange={e => onAendern(e.target.value)} aria-label={label} className="ui-fokusring" style={feldStil} />
      )}
    </div>
  );
}

/* ── Beziehungen ─────────────────────────────────────────────────────────── */

function AnsichtBeziehungenNeu({ patient }: { patient: Patient }) {
  const alle = useBeziehungen();
  const angehoerige = useAngehoerige();
  const mandate = useMandate();
  const einsaetze = useEinsaetze();
  const [beendetOffen, setBeendetOffen] = useState(false);
  const [meldung, setMeldung] = useState("");
  /* "" = neu, Kennung = ändern, null = geschlossen. */
  const [formular, setFormular] = useState<string | null>(null);

  const eigene = alle.filter(b => b.patientId === patient.id);
  const aktive = eigene.filter(beziehungAktiv);
  const beendete = eigene.filter(b => !beziehungAktiv(b));
  const nameVon = (k: string) => {
    const a = angehoerige.find(x => x.id === k);
    return a ? `${a.vorname} ${a.nachname}` : k;
  };
  /* Dritte Personen stehen im Kontaktbestand; die Beziehung trägt nur die
     Kennung. Ändert sich der Name dort, ändert er sich hier mit. */
  const kontakte = useKontakte();
  const kontaktVon = (k: string) => {
    const t = kontakte.find(x => x.id === k);
    return t ? kontaktName(t) : k;
  };
  const kontaktZu = (b: Beziehung): Kontakt | null => {
    const p = b.person;
    return p.art === "kontakt" ? kontakte.find(x => x.id === p.kennung) ?? null : null;
  };

  /* Zur Auswahl stehen alle Personen mit Datensatz: angehörige Personen aus
     dem Bestand, Mitarbeitende aus den bereits erfassten Beziehungen. Alles
     Übrige wird als Name ohne Datensatz erfasst. */
  const personen = [
    ...angehoerige.map(a => ({ wert: `a:${a.id}`, label: `${a.vorname} ${a.nachname}` })),
    ...[...new Set(alle.filter(b => b.person.art === "mitarbeitende")
      .map(b => (b.person as { name: string }).name))]
      .sort().map(n => ({ wert: `m:${n}`, label: `${n} (Spitex)` })),
  ];

  /* Die abgerechnete Person steht am Mandat, nicht an der Beziehung. Hier
     wird nur nachgeschlagen, um die Zeile zu kennzeichnen. */
  const abgerechnet = new Set(mandate.filter(m => m.patientId === patient.id)
    .map(m => m.abgerechneteAngehoerige).filter(Boolean));
  const stundenJeWoche = (kennung: string) => {
    const min = einsaetze
      .filter(e => e.patientId === patient.id && e.zustand === "erbracht"
        && e.erbrachtDurch.art === "angehoeriger" && e.erbrachtDurch.kennung === kennung)
      .reduce((s, e) => s + einsatzDauer(e), 0);
    /* Über den Bezugsmonat gemittelt — eine Wochenzahl aus einem Monat, nicht
       aus einer beliebigen Spanne. */
    return min / 60 / (31 / 7);
  };

  /* Trägt das Mandat eine Person ohne aktive Beziehung, ist eines von beiden
     nicht gepflegt worden. Das blockiert nichts, aber es gehört gesagt. */
  const ohneBeziehung = [...abgerechnet].filter(k =>
    !aktive.some(b => b.person.art === "angehoeriger" && b.person.kennung === k));

  /* Zwei Seiten des Netzes über die Kategorie (nicht rolleSeite): links der
     persönliche Kreis (Bezugsperson — Angehörige, Beistand, Sozialdienst,
     weitere), rechts das medizinische Fachpersonal und die Spitex-Rollen. */
  const privat = aktive.filter(b => kategorieFuerRolle(b.rolle) === "bezugsperson");
  const rechts = aktive.filter(b => kategorieFuerRolle(b.rolle) !== "bezugsperson");

  return (
    <div className="space-y-4">
      {aktive.length > 0 && (
        <PSectionCard title="Betreuungsnetz" icon={Users}>
          <Netzdiagramm patient={patient} privat={privat} rechts={rechts}
            nameVon={nameVon} kontaktVon={kontaktVon}
            zugehoerigkeitVon={b => kontaktZu(b)?.zugehoerigkeit ?? ""}
            abgerechnet={abgerechnet} stundenJeWoche={stundenJeWoche} />
        </PSectionCard>
      )}

      {ohneBeziehung.length > 0 && (
        <div className="flex items-start" style={{ gap: 8, padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)" }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", maxWidth: "74ch", lineHeight: 1.55 }}>
            Über {ohneBeziehung.map(nameVon).join(", ")} wird abgerechnet, ohne dass eine aktive
            Beziehung besteht. Entweder fehlt die Beziehung oder das Mandat verweist auf die falsche Person.
          </span>
        </div>
      )}

      {/* Die Liste, der Dialog und die Lücken-Hinweise stammen aus der geteilten
          Komponente — dieselbe wie im Onboarding-Reiter Personalien. */}
      <PSectionCard title="Bezugs- und Pflegeteam" icon={Users}>
        <BezugsteamAbschnitt patientId={patient.id} />
      </PSectionCard>
    </div>
  );
}

/**
 * Das Betreuungsnetz als Diagramm.
 *
 * Festes Raster aus drei Spalten: privates Umfeld links, der Patient in der
 * Mitte, Spitex und Behandelnde rechts. Die Trennung ist die Aussage — wer
 * gehört zur Familie, wer zum System.
 *
 * Die Linien laufen von Knotenkante zu Knotenkante, nicht als Stummel neben
 * dem Knoten: eine Linie, die im Leerraum endet, verbindet nichts und
 * behauptet trotzdem eine Verbindung. Gezeichnet wird deshalb in einem SVG
 * über dem Raster, dessen Koordinaten aus denselben Konstanten stammen wie
 * die Kästen.
 */

/* Ein Raster statt gemessener Positionen: die Höhen stehen fest, damit die
   Linien sie kennen, ohne das Layout auszumessen. */
const NETZ = {
  spalte: 210,
  mitte: 190,
  knotenH: 46,
  abstand: 16,
  luecke: 84,
} as const;

function Netzdiagramm({ patient, privat, rechts, nameVon, kontaktVon, zugehoerigkeitVon, abgerechnet, stundenJeWoche }: {
  patient: Patient;
  privat: Beziehung[]; rechts: Beziehung[];
  nameVon: (k: string) => string;
  kontaktVon: (k: string) => string;
  /** Die Zugehörigkeit steht am Kontakt; das Diagramm bekommt sie gereicht. */
  zugehoerigkeitVon: (b: Beziehung) => string;
  abgerechnet: Set<string>;
  stundenJeWoche: (k: string) => number;
}) {
  /* Ab acht aktiven Beziehungen wird zusammengefasst — darüber kreuzen sich
     die Linien, und die kräftige zur abgerechneten Person geht darin unter.
     Zusammengefasst werden die nicht pflegenden und die externen; die
     pflegende Person bleibt immer einzeln sichtbar. */
  const gesamt = privat.length + rechts.length;
  const kuerzen = (liste: Beziehung[], behalten: (b: Beziehung) => boolean) => {
    if (gesamt <= DIAGRAMM_MAX) return { gezeigt: liste, rest: 0 };
    const fest = liste.filter(behalten);
    return { gezeigt: fest, rest: liste.length - fest.length };
  };
  const l = kuerzen(privat, b => b.rolle === "pflegende_angehoerige");
  const r = kuerzen(rechts, b => kategorieFuerRolle(b.rolle) === "benutzer");

  const zeilen = Math.max(l.gezeigt.length + (l.rest > 0 ? 1 : 0), r.gezeigt.length + (r.rest > 0 ? 1 : 0), 1);
  /* Die Höhe folgt der Knotenzahl. Der Rand oben und unten trägt die
     Linienbeschriftung, die über den obersten Knoten hinausragen kann —
     ohne ihn schnitte das SVG sie ab, und mit `overflow: visible` zeichnete
     sie über die Kartengrenze hinaus. Genau das war der Fehler: das SVG war
     46 px hoch, die Knoten standen bei y = 23 bis 131, und die Karte mass
     nur das SVG. */
  const rand = 14;
  const hoehe = zeilen * NETZ.knotenH + (zeilen - 1) * NETZ.abstand + rand * 2;
  const breite = NETZ.spalte * 2 + NETZ.mitte + NETZ.luecke * 2;

  /* Je Spalte um die Patientenzeile zentriert: bei zwei Knoten stehen sie
     ober- und unterhalb, bei einem auf gleicher Höhe. */
  const mittelY = (hoehe - NETZ.knotenH) / 2;
  const yVon = (i: number, n: number) =>
    mittelY - ((n - 1) / 2) * (NETZ.knotenH + NETZ.abstand) + i * (NETZ.knotenH + NETZ.abstand);

  const linksX = 0;
  const mitteX = NETZ.spalte + NETZ.luecke;
  const rechtsX = mitteX + NETZ.mitte + NETZ.luecke;

  const kasten = (b: Beziehung, x: number, y: number, seite: "links" | "rechts") => {
    const istAbg = b.person.art === "angehoeriger" && abgerechnet.has(b.person.kennung);
    return (
      <foreignObject key={b.id} x={x} y={y} width={NETZ.spalte} height={NETZ.knotenH}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "5px 10px", borderRadius: 10, background: "var(--bg-elevated)", boxSizing: "border-box",
          border: istAbg ? "2px solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
          textAlign: seite === "links" ? "right" : "left" }}>
          <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {personName(b, nameVon, kontaktVon)}
          </div>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {rolleLabel(b.rolle)}
            {/* Bei privaten Rollen gehört die Verwandtschaft dazu; fehlt sie,
                wird das gesagt statt eine leere Stelle zu lassen. */}
            {rolleSeite(b.rolle) === "privat" && ` · ${b.art ? artLabel(b.art) : "Verwandtschaft nicht erfasst"}`}
            {/* Bei den externen steht dort, wo die Person hingehört, sofern
                erfasst — „Hausarzt" allein sagt weniger als „Hausarzt ·
                Kardiologie". Fehlt die Angabe, entfällt die Ergänzung; ein
                leeres Feld behauptete, es sei nichts zu sagen. */}
            {rolleSeite(b.rolle) === "extern" && zugehoerigkeitVon(b) && ` · ${zugehoerigkeitVon(b)}`}
          </div>
        </div>
      </foreignObject>
    );
  };

  const linie = (b: Beziehung, y: number, seite: "links" | "rechts") => {
    const istAbg = b.person.art === "angehoeriger" && abgerechnet.has(b.person.kennung);
    const extern = rolleSeite(b.rolle) === "extern";
    const [x1, x2] = seite === "links"
      ? [linksX + NETZ.spalte, mitteX]
      : [mitteX + NETZ.mitte, rechtsX];
    const yM = y + NETZ.knotenH / 2;
    const std = istAbg && b.person.art === "angehoeriger" ? stundenJeWoche(b.person.kennung) : 0;
    return (
      <g key={`l-${b.id}`}>
        <line x1={x1} y1={yM} x2={x2} y2={mittelY + NETZ.knotenH / 2}
          stroke={istAbg ? "var(--brand-primary)" : "var(--border-default)"}
          strokeWidth={istAbg ? 2 : 1}
          strokeDasharray={extern ? "4 3" : undefined} />
        {istAbg && (
          <text x={(x1 + x2) / 2} y={(yM + mittelY + NETZ.knotenH / 2) / 2 - 5} textAnchor="middle"
            style={{ fontSize: 10, fill: "var(--brand-primary)", fontWeight: 500 }}>
            {std.toFixed(1).replace(".", ",")} Std./Wo.
          </text>
        )}
      </g>
    );
  };

  const restknoten = (x: number, y: number, anzahl: number, seite: "links" | "rechts") => (
    <g key={`rest-${seite}`}>
      <line x1={seite === "links" ? x + NETZ.spalte : x} y1={y + NETZ.knotenH / 2}
        x2={seite === "links" ? mitteX : mitteX + NETZ.mitte} y2={mittelY + NETZ.knotenH / 2}
        stroke="var(--border-default)" strokeWidth={1} strokeDasharray="4 3" />
      <foreignObject x={x} y={y} width={NETZ.spalte} height={NETZ.knotenH}>
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: seite === "links" ? "flex-end" : "flex-start",
          padding: "5px 10px", borderRadius: 10, background: "var(--bg-secondary)", boxSizing: "border-box",
          fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
          {anzahl} weitere Beteiligte
        </div>
      </foreignObject>
    </g>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Überschriften über den Bereichen — ohne sie bräuchte es eine Legende. */}
      <div style={{ display: "grid", gridTemplateColumns: `${NETZ.spalte}px ${NETZ.luecke}px ${NETZ.mitte}px ${NETZ.luecke}px ${NETZ.spalte}px`, width: breite, marginBottom: 6 }}>
        <div style={{ fontSize: "var(--text-micro)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)", textAlign: "right" }}>
          {privat.length > 0 ? "Privates Umfeld" : ""}
        </div>
        <div /><div /><div />
        <div style={{ fontSize: "var(--text-micro)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)" }}>
          {rechts.length > 0 ? "Spitex und Behandelnde" : ""}
        </div>
      </div>
      <svg width={breite} height={hoehe} style={{ display: "block" }} role="img"
        aria-label={`Betreuungsnetz mit ${gesamt} aktiven Beziehungen`}>
        {l.gezeigt.map((b, i) => linie(b, yVon(i, l.gezeigt.length + (l.rest > 0 ? 1 : 0)), "links"))}
        {r.gezeigt.map((b, i) => linie(b, yVon(i, r.gezeigt.length + (r.rest > 0 ? 1 : 0)), "rechts"))}
        {l.gezeigt.map((b, i) => kasten(b, linksX, yVon(i, l.gezeigt.length + (l.rest > 0 ? 1 : 0)), "links"))}
        {r.gezeigt.map((b, i) => kasten(b, rechtsX, yVon(i, r.gezeigt.length + (r.rest > 0 ? 1 : 0)), "rechts"))}
        {l.rest > 0 && restknoten(linksX, yVon(l.gezeigt.length, l.gezeigt.length + 1), l.rest, "links")}
        {r.rest > 0 && restknoten(rechtsX, yVon(r.gezeigt.length, r.gezeigt.length + 1), r.rest, "rechts")}
        {/* Der Patient als einzige dunkle Fläche — die Mitte ist keine Rolle
            unter anderen. */}
        <foreignObject x={mitteX} y={mittelY} width={NETZ.mitte} height={NETZ.knotenH}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            padding: "5px 10px", borderRadius: 12, background: "var(--brand-primary)", boxSizing: "border-box" }}>
            <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
              {patient.nachname}, {patient.vorname}
            </div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-on-dark)", opacity: 0.85 }}>Patient</div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

/* ── Vorgeschichte ───────────────────────────────────────────────────────── */

function AnsichtVorgeschichte({ patient }: { patient: Patient }) {
  const { aufenthalte, eingriffe } = useVorgeschichte(patient.id);
  /* Eine Kennung, die gerade bearbeitet wird — "" heisst „neu", null heisst
     „nichts offen". Nur ein Formular gleichzeitig je Abschnitt. */
  const [aOffen, setAOffen] = useState<string | null>(null);
  const [eOffen, setEOffen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PSectionCard title="Spitalaufenthalte" icon={Building2}>
        {aOffen === null && (
          <button type="button" onClick={() => setAOffen("")} className="ui-fokusring cursor-pointer inline-flex items-center"
            style={{ gap: 5, marginBottom: 12, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)" }}>
            <Plus style={{ width: 13, height: 13 }} /> Aufenthalt erfassen
          </button>
        )}
        {aOffen === "" && (
          <AufenthaltFormular patientId={patient.id} eintrag={null} onFertig={() => setAOffen(null)} />
        )}
        {aufenthalte.length === 0 && aOffen === null ? (
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
            Kein Spitalaufenthalt erfasst. Hier wird festgehalten, wann und weshalb der Patient
            stationär behandelt wurde — bei einer Verlaufsbeurteilung ist das der erste Blick.
          </p>
        ) : (
          <div className="flex flex-col" style={{ gap: 2 }}>
            {aufenthalte.map(s => aOffen === s.id ? (
              <div key={s.id} style={{ paddingTop: 8, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <AufenthaltFormular patientId={patient.id} eintrag={s} onFertig={() => setAOffen(null)} />
              </div>
            ) : (
              <div key={s.id} className="flex items-baseline flex-wrap" style={{ gap: 10, padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <span style={{ width: 176, fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{s.von} – {s.bis}</span>
                <span style={{ width: 60, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{s.tage} Tage</span>
                <span style={{ width: 220, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{s.einrichtung}</span>
                <span style={{ flex: 1, minWidth: 160, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{s.grund}</span>
                <button type="button" onClick={() => setAOffen(s.id)} className="ui-fokusring cursor-pointer"
                  style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
                  Bearbeiten
                </button>
              </div>
            ))}
          </div>
        )}
      </PSectionCard>

      <PSectionCard title="Frühere Behandlungen" icon={Stethoscope}>
        {eOffen === null && (
          <button type="button" onClick={() => setEOffen("")} className="ui-fokusring cursor-pointer inline-flex items-center"
            style={{ gap: 5, marginBottom: 12, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)" }}>
            <Plus style={{ width: 13, height: 13 }} /> Behandlung erfassen
          </button>
        )}
        {eOffen === "" && <EingriffFormular patientId={patient.id} eintrag={null} onFertig={() => setEOffen(null)} />}
        {eingriffe.length === 0 && eOffen === null ? (
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch" }}>
            Keine frühere Behandlung erfasst.
          </p>
        ) : (
          <div className="flex flex-col" style={{ gap: 2 }}>
            {eingriffe.map(o => eOffen === o.id ? (
              <div key={o.id} style={{ paddingTop: 8, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <EingriffFormular patientId={patient.id} eintrag={o} onFertig={() => setEOffen(null)} />
              </div>
            ) : (
              <div key={o.id} className="flex items-baseline" style={{ gap: 10, padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <span style={{ width: 100, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{o.datum}</span>
                <span style={{ flex: 1, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{o.eingriff}</span>
                <button type="button" onClick={() => setEOffen(o.id)} className="ui-fokusring cursor-pointer"
                  style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
                  Bearbeiten
                </button>
              </div>
            ))}
          </div>
        )}
      </PSectionCard>
    </div>
  );
}

/** Das Formular erscheint an Ort — kein Dialog, damit der Zusammenhang bleibt. */
function AufenthaltFormular({ patientId, eintrag, onFertig }: {
  patientId: string; eintrag: Spitalaufenthalt | null; onFertig: () => void;
}) {
  const [von, setVon] = useState(eintrag?.von ?? "");
  const [bis, setBis] = useState(eintrag?.bis ?? "");
  const [klinik, setKlinik] = useState(eintrag?.einrichtung ?? "");
  const [grund, setGrund] = useState(eintrag?.grund ?? "");
  const vollstaendig = von.trim() && bis.trim() && klinik.trim();
  /* Ein Bis vor dem Von ist kein Zeitraum. Der Datumsbaustein prüft jedes
     Feld für sich; ihre Reihenfolge kann nur die Aufrufstelle prüfen. */
  const reihenfolgeFalsch = von.trim() !== "" && bis.trim() !== "" && tageZwischen(von, bis) === 0
    && von !== bis;

  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-secondary)", marginBottom: 12 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 10 }}>
        {/* Der bestehende Baustein prüft die Eingabe und nimmt „09102020"
            nicht an. `wertFormat="display"` lässt die Speicherform des
            Bestands unverändert — ein Eingriff quer durch alle Module wäre
            für vier Felder nicht verhältnismässig. */}
        <DateField label="Von" value={von} wertFormat="display" bereich="past"
          onChange={v => setVon(typeof v === "string" ? v : "")} />
        <DateField label="Bis" value={bis} wertFormat="display" bereich="past"
          onChange={v => setBis(typeof v === "string" ? v : "")} />
        <div className="sm:col-span-2">
          <FormFeld label="Klinik" wert={klinik} platzhalter="z. B. Kantonsspital Winterthur" onAendern={setKlinik} />
        </div>
      </div>
      <FormFeld label="Grund und Verlauf" wert={grund} platzhalter="Weshalb der Aufenthalt, wie er verlief" onAendern={setGrund} />
      {reihenfolgeFalsch && (
        <div style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 6 }}>
          Das Bis-Datum liegt vor dem Von-Datum.
        </div>
      )}
      {von.trim() && bis.trim() && !reihenfolgeFalsch && (
        <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
          {/* Die Dauer wird gerechnet, nicht erfasst — zwei Angaben, die
              einander widersprechen können, sind eine zu viel. */}
          Dauer: {tageZwischen(von, bis)} Tage
        </div>
      )}
      <div className="flex items-center" style={{ gap: 12, marginTop: 12 }}>
        <AppButton variant="sekundaer" onClick={() => {
          if (!vollstaendig || reihenfolgeFalsch) return;
          aufenthaltSichern(patientId, { id: eintrag?.id ?? "", einrichtung: klinik, grund, von, bis });
          onFertig();
        }}>Sichern</AppButton>
        <button type="button" onClick={onFertig} className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function EingriffFormular({ patientId, eintrag, onFertig }: {
  patientId: string; eintrag: FruehererEingriff | null; onFertig: () => void;
}) {
  const [datum, setDatum] = useState(eintrag?.datum ?? "");
  const [text, setText] = useState(eintrag?.eingriff ?? "");
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-secondary)", marginBottom: 12 }}>
      <div className="grid grid-cols-1 sm:grid-cols-4" style={{ gap: 12 }}>
        <DateField label="Datum" value={datum} wertFormat="display" bereich="past"
          onChange={v => setDatum(typeof v === "string" ? v : "")} />
        <div className="sm:col-span-3">
          <FormFeld label="Bezeichnung" wert={text} platzhalter="z. B. Hüft-TEP links" onAendern={setText} />
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 12, marginTop: 12 }}>
        <AppButton variant="sekundaer" onClick={() => {
          if (!datum.trim() || !text.trim()) return;
          eingriffSichern(patientId, { id: eintrag?.id ?? "", datum, eingriff: text });
          onFertig();
        }}>Sichern</AppButton>
        <button type="button" onClick={onFertig} className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}


/* ── Austritt ────────────────────────────────────────────────────────────── */

/**
 * Bereich Z des Standardkatalogs.
 *
 * Der Austritt ist der einzige Vorgang am Patienten, der nicht nur etwas
 * festhält, sondern etwas beendet: den Zustand, die laufenden Mandate und die
 * Anwesenheit in der Arbeitsliste. Darum steht er in einer eigenen Ansicht und
 * nicht als Karte zwischen den Stammdaten, und darum verlangt er eine
 * Bestätigung, die die Folgen benennt statt sie anzudeuten.
 */
function AnsichtAustritt({ patient }: { patient: Patient }) {
  const mandate = useMandate().filter(m => m.patientId === patient.id);
  const laufende = mandate.filter(m => !m.ende.trim());
  /* Der Rhythmus wird gelesen, nicht gerechnet — es steht dort, was die
     Engine tatsächlich getan hat. */
  const rhythmusTickets = getTicketsFuerSubjekt("patient", patient.id);
  const entfallen = rhythmusTickets.filter(t => t.status === "entfallen").length;
  const erledigt = rhythmusTickets.filter(t => t.status === "erledigt").length;

  const [datum, setDatum] = useState("");
  const [nach, setNach] = useState("");
  const [andere, setAndere] = useState("");
  const [praezisierungen, setPraezisierungen] = useState("");
  const [fehler, setFehler] = useState<AustrittFehler | null>(null);
  const [frage, setFrage] = useState(false);

  if (patient.status === "ausgetreten") {
    return (
      <div className="space-y-4">
        <PSectionCard title="Austritt" icon={LogOut}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
            <PDataField label="Austrittsdatum" value={patient.austrittDatum} />
            <PDataField
              label="Danach"
              value={patient.austrittNach === ENTLASSUNG_SONSTIGES && patient.austrittNachAndere
                ? `${entlassungNachLabel(patient.austrittNach)}: ${patient.austrittNachAndere}`
                : entlassungNachLabel(patient.austrittNach)}
            />
            <PDataField label="Erfasst" value={patient.austrittErfasstVon ? `${patient.austrittErfasstVon}, ${patient.austrittErfasstAm}` : "—"} />
          </div>
          {patient.austrittPraezisierungen && (
            <div style={{ marginTop: 16 }}>
              <PDataField label="Individuelle Präzisierungen" value={patient.austrittPraezisierungen} />
            </div>
          )}
          {/* Der Katalog sieht an dieser Stelle eine Unterschrift vor. Das
              Produkt kennt keine; wie bei BB17 wird stattdessen protokolliert,
              wer kodiert hat und wann. Abweichung, bewusst und benannt. */}
          <p style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", margin: "14px 0 0", maxWidth: "74ch", lineHeight: 1.6 }}>
            Der Standardkatalog verlangt in Bereich Z eine Unterschrift. Erfasst wird hier stattdessen,
            wer den Austritt kodiert hat — eine Unterschrift wird nicht nachgebildet.
          </p>
        </PSectionCard>

        <PSectionCard title="Was der Austritt bewirkt hat" icon={Info}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "74ch" }}>
            <li>Der Patient erscheint nicht mehr in der Arbeitsliste. Über „Ausgetretene einblenden" bleibt er erreichbar.</li>
            <li>{mandate.length === 0
              ? "Es bestand kein Mandat."
              : mandate.length === 1
              ? `Das Mandat endet auf den ${patient.austrittDatum}.`
              : `${mandateWort(mandate.length)} enden auf den ${patient.austrittDatum}.`}</li>
            <li>{rhythmusTickets.length === 0
              ? "Es bestand kein Betreuungsrhythmus."
              : `Der Betreuungsrhythmus ist beendet: ${entfallen} ${entfallen === 1 ? "offener Schritt ist" : "offene Schritte sind"} entfallen, ${erledigt} erledigte ${erledigt === 1 ? "bleibt" : "bleiben"} als Nachweis stehen.`}</li>
            <li>Bereits erfasste Einsätze, Berichte und Abschlüsse bleiben unverändert — sie sind Vergangenheit, nicht Planung.</li>
          </ul>
          <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "14px 0 0", maxWidth: "74ch", lineHeight: 1.6 }}>
            Ein Austritt lässt sich hier nicht zurücknehmen. Kehrt die Person zurück, ist das eine neue Aufnahme.
          </p>
        </PSectionCard>
      </div>
    );
  }

  const speichern = () => {
    const f = austrittErfassen(patient.id, {
      datum, nach, nachAndere: andere, praezisierungen, erfasstVon: AKTUELLE_FACHPERSON,
    });
    setFehler(f);
    if (!f) setFrage(false);
  };

  return (
    <div className="space-y-4">
      <PSectionCard title="Austritt erfassen" icon={LogOut}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: "0 0 16px", maxWidth: "74ch", lineHeight: 1.6 }}>
          Der Austritt hält fest, wann die Person zuletzt Leistungen bezogen hat und wie sie danach lebt.
          Er beendet die laufenden Mandate und nimmt den Patienten aus der Arbeitsliste.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>
          <DateField label="Austrittsdatum" value={datum} wertFormat="display" bereich="past"
            onChange={v => { setDatum(typeof v === "string" ? v : ""); setFehler(null); setFrage(false); }} />
          <div className="sm:col-span-1">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>Danach</div>
            <InlineSelect
              value={nach}
              onChange={v => { setNach(v); setFehler(null); setFrage(false); }}
              options={ENTLASSUNG_NACH.map(w => ({ value: w.code, label: w.label }))}
              platzhalter="Bitte wählen"
            />
          </div>
          {/* Freitext nur, wo der Katalog ihn vorsieht. */}
          {nach === ENTLASSUNG_SONSTIGES && (
            <FormFeld label="Sonstiges — welche" wert={andere} platzhalter="Lebensumstände nach dem Austritt"
              onAendern={v => { setAndere(v); setFehler(null); setFrage(false); }} />
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <FormFeld label="Individuelle Präzisierungen" wert={praezisierungen} platzhalter="Freiwillig — was zum Austritt festzuhalten ist"
            onAendern={v => { setPraezisierungen(v); setFrage(false); }} />
        </div>

        <p style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", margin: "10px 0 0" }}>
          Erfasst wird auf {AKTUELLE_FACHPERSON}. Der Standardkatalog verlangt hier eine Unterschrift;
          festgehalten wird stattdessen, wer kodiert hat.
        </p>

        {fehler && (
          <div role="alert" style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 12, maxWidth: "74ch" }}>
            {AUSTRITT_FEHLERTEXT[fehler]}
          </div>
        )}

        {!frage ? (
          <div style={{ marginTop: 16 }}>
            <AppButton variant="sekundaer" onClick={() => { setFehler(null); setFrage(true); }}>Austritt erfassen</AppButton>
          </div>
        ) : (
          /* Zweiter Schritt: die Folgen stehen da, bevor sie eintreten. */
          <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
            <p style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", margin: "0 0 8px" }}>
              Austritt von {patient.vorname} {patient.nachname} bestätigen?
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-meta)", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "74ch" }}>
              <li>Der Zustand wechselt auf „Ausgetreten"; abgerechnet wird nichts mehr.</li>
              <li>{laufende.length === 0
                ? "Es läuft kein Mandat, das zu beenden wäre."
                : laufende.length === 1
                ? `Ein laufendes Mandat endet auf den ${datum || "das Austrittsdatum"}.`
                : `${mandateWort(laufende.length)} enden auf den ${datum || "das Austrittsdatum"}.`}</li>
              <li>Der Patient verschwindet aus der Arbeitsliste und ist nur noch über „Ausgetretene einblenden" zu finden.</li>
              <li>Der Betreuungsrhythmus endet; offene Schritte entfallen mit Grund, erledigte bleiben als Nachweis.</li>
              <li>Zurücknehmen lässt sich das hier nicht.</li>
            </ul>
            <div className="flex items-center" style={{ gap: 12, marginTop: 14 }}>
              <AppButton variant="sekundaer" onClick={speichern}>Austritt bestätigen</AppButton>
              <button type="button" onClick={() => setFrage(false)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </PSectionCard>

      <PSectionCard title="Nicht dasselbe wie ein Einsatzabbruch" icon={Info}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
          Der Standardkatalog unterscheidet den Austritt vom Einsatzabbruch — bei einem Abbruch wird
          kein Formular Entlassung ausgefüllt. Das Cockpit kennt den Einsatzabbruch nicht als eigenen
          Vorgang. Wer einen Abbruch festhalten will, findet dafür hier bewusst keinen Weg;
          die Lücke ist bekannt und wird nicht durch dieses Formular überdeckt.
        </p>
      </PSectionCard>
    </div>
  );
}

/* ── Diagnosen ───────────────────────────────────────────────────────────── */

function AnsichtDiagnosen({ patient }: { patient: Patient }) {
  const arzt = useArztDiagnosen().filter(d => d.patientId === patient.id);
  const pflege = usePflegediagnosen().filter(d => d.patientId === patient.id);
  const plan = MOCK_PFLEGEPLANUNGEN.find(p => p.patientId === patient.id) ?? null;
  const [aOffen, setAOffen] = useState<string | null>(null);
  const [pOffen, setPOffen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Getrennt, weil sie verschiedenen Systemen folgen: die ärztliche
          Diagnose kommt aus dem ICD und von der Ärztin, die Pflegediagnose
          aus NANDA und aus der Pflegeplanung. */}
      <PSectionCard title="Ärztliche Diagnosen" icon={Stethoscope}>
        {aOffen === null && (
          <button type="button" onClick={() => setAOffen("")} className="ui-fokusring cursor-pointer inline-flex items-center"
            style={{ gap: 5, marginBottom: 12, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)" }}>
            <Plus style={{ width: 13, height: 13 }} /> Diagnose erfassen
          </button>
        )}
        {aOffen === "" && <ArztDiagnoseFormular patientId={patient.id} eintrag={null} onFertig={() => setAOffen(null)} />}
        {arzt.length === 0 && aOffen === null ? (
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch" }}>
            Keine ärztliche Diagnose erfasst. Sie entstehen aus der Antwort der Ärztin auf die
            Diagnoseanfrage — hier lassen sie sich auch von Hand nachtragen.
          </p>
        ) : (
          <div className="flex flex-col" style={{ gap: 2 }}>
            {arzt.map(d => aOffen === d.id ? (
              <div key={d.id} style={{ paddingTop: 8, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <ArztDiagnoseFormular patientId={patient.id} eintrag={d} onFertig={() => setAOffen(null)} />
              </div>
            ) : (
              <div key={d.id} className="flex items-baseline flex-wrap" style={{ gap: 10, padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <span style={{ width: 74, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{d.icdCode || "—"}</span>
                <span style={{ flex: 1, minWidth: 180, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{d.bezeichnung}</span>
                <span style={{ width: 230, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{d.quelle}</span>
                <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap",
                  background: d.status === "bestaetigt" ? "var(--status-success-bg)" : "var(--bg-secondary)",
                  color: d.status === "bestaetigt" ? "var(--status-success-text)" : "var(--text-secondary)" }}>
                  {d.status === "bestaetigt" ? "Bestätigt" : "Entwurf"}
                </span>
                <button type="button" onClick={() => setAOffen(d.id)} className="ui-fokusring cursor-pointer"
                  style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
                  Bearbeiten
                </button>
              </div>
            ))}
          </div>
        )}
      </PSectionCard>

      <PSectionCard title="Pflegediagnosen" icon={ClipboardList}>
        {pOffen === null && (
          <button type="button" onClick={() => setPOffen("")} className="ui-fokusring cursor-pointer inline-flex items-center"
            style={{ gap: 5, marginBottom: 12, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)" }}>
            <Plus style={{ width: 13, height: 13 }} /> Diagnose erfassen
          </button>
        )}
        {pOffen === "" && <PflegediagnoseFormular patientId={patient.id} eintrag={null} hatPlan={plan !== null} onFertig={() => setPOffen(null)} />}
        {pflege.length === 0 && pOffen === null ? (
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch" }}>
            {plan
              ? "Der Pflegeplan besteht, trägt aber keine Pflegediagnose."
              : "Kein Pflegeplan angelegt — Pflegediagnosen entstehen dort."}
          </p>
        ) : (
          <div className="flex flex-col" style={{ gap: 2 }}>
            {pflege.map(d => pOffen === d.id ? (
              <div key={d.id} style={{ paddingTop: 8, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <PflegediagnoseFormular patientId={patient.id} eintrag={d} hatPlan={plan !== null} onFertig={() => setPOffen(null)} />
              </div>
            ) : (
              <div key={d.id} style={{ padding: "9px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <div className="flex items-baseline flex-wrap" style={{ gap: 10 }}>
                  <span style={{ width: 74, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{d.nandaCode || "—"}</span>
                  <span style={{ flex: 1, minWidth: 180, fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{d.titel}</span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                    {d.ohnePlanVermerk || (plan ? `Pflegeplan ${plan.id}` : "")}
                  </span>
                  <button type="button" onClick={() => setPOffen(d.id)} className="ui-fokusring cursor-pointer"
                    style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
                    Bearbeiten
                  </button>
                </div>
                {d.begruendung && (
                  <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "4px 0 0", maxWidth: "74ch", lineHeight: 1.55 }}>{d.begruendung}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </PSectionCard>
    </div>
  );
}

function ArztDiagnoseFormular({ patientId, eintrag, onFertig }: {
  patientId: string; eintrag: AerztlicheDiagnose | null; onFertig: () => void;
}) {
  const [bez, setBez] = useState(eintrag?.bezeichnung ?? "");
  const [icd, setIcd] = useState(eintrag?.icdCode ?? "");
  const [datum, setDatum] = useState("");
  const [aerztin, setAerztin] = useState(eintrag?.quelle ?? "");
  const [status, setStatus] = useState<ArztDiagnoseStatus>(eintrag?.status ?? "entwurf");

  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-secondary)", marginBottom: 12 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 10 }}>
        <div className="sm:col-span-2">
          <FormFeld label="Bezeichnung" wert={bez} platzhalter="z. B. Arterielle Hypertonie" onAendern={setBez} />
        </div>
        <FormFeld label="ICD-Code" wert={icd} platzhalter="z. B. I10" onAendern={setIcd} />
        <DateField label="Diagnosedatum" value={datum} wertFormat="display" bereich="past"
          onChange={v => setDatum(typeof v === "string" ? v : "")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
        <FormFeld label="Verordnende Ärztin" wert={aerztin} platzhalter="z. B. Dr. med. Peter Frei" onAendern={setAerztin} />
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>Status</div>
          <div className="flex items-center" style={{ gap: 6 }}>
            {(["entwurf", "bestaetigt"] as ArztDiagnoseStatus[]).map(w => (
              <button key={w} type="button" onClick={() => setStatus(w)} className="ui-fokusring cursor-pointer"
                style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                  background: status === w ? "var(--brand-primary-light)" : "var(--bg-elevated)",
                  border: status === w ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
                  color: status === w ? "var(--brand-primary)" : "var(--text-primary)" }}>
                {w === "entwurf" ? "Entwurf" : "Bestätigt"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 12, marginTop: 12 }}>
        <AppButton variant="sekundaer" onClick={() => {
          if (!bez.trim()) return;
          /* Die Herkunft hält fest, wer und wann — sonst liesse sich später
             nicht sagen, ob die Diagnose von der Ärztin kam oder hier
             nachgetragen wurde. */
          const quelle = eintrag && aerztin === eintrag.quelle
            ? eintrag.quelle
            : `${aerztin.trim() || "Ohne Ärztin"}${datum.trim() ? `, ${datum}` : ""} · nachgetragen von ${AKTUELLE_FACHPERSON}`;
          arztDiagnoseSichern(patientId, {
            id: eintrag?.id ?? "", icdCode: icd, bezeichnung: bez, quelle, status,
          });
          onFertig();
        }}>Sichern</AppButton>
        <button type="button" onClick={onFertig} className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function PflegediagnoseFormular({ patientId, eintrag, hatPlan, onFertig }: {
  patientId: string; eintrag: PflegediagnoseEintrag | null; hatPlan: boolean; onFertig: () => void;
}) {
  const [nanda, setNanda] = useState(eintrag?.nandaCode ?? "");
  const [titel, setTitel] = useState(eintrag?.titel ?? "");
  const [begruendung, setBegruendung] = useState(eintrag?.begruendung ?? "");
  const [status, setStatus] = useState<VorschlagStatus>(eintrag?.status ?? "vorschlag");

  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-secondary)", marginBottom: 12 }}>
      {/* Die Pflegediagnose entsteht eigentlich im Pflegeplan. Ohne Plan wird
          sie trotzdem erfasst — mit einem Vermerk, damit später erkennbar
          bleibt, dass sie ausserhalb entstanden ist. */}
      {!hatPlan && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 11px", borderRadius: 10, background: "var(--status-warning-bg)", marginBottom: 10 }}>
          <AlertTriangle style={{ width: 13, height: 13, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", maxWidth: "74ch", lineHeight: 1.55 }}>
            Für diesen Patienten besteht kein Pflegeplan. Pflegediagnosen entstehen dort — diese
            wird trotzdem erfasst und trägt den Vermerk „ausserhalb des Pflegeplans erfasst".
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4" style={{ gap: 12, marginBottom: 10 }}>
        <FormFeld label="NANDA-Nummer" wert={nanda} platzhalter="z. B. 00155" onAendern={setNanda} />
        <div className="sm:col-span-3">
          <FormFeld label="Bezeichnung" wert={titel} platzhalter="z. B. Sturzgefahr" onAendern={setTitel} />
        </div>
      </div>
      <FormFeld label="Begründung" wert={begruendung} platzhalter="Woran die Diagnose festgemacht wird" onAendern={setBegruendung} />
      <div style={{ marginTop: 10 }}>
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>Status</div>
        <div className="flex items-center" style={{ gap: 6 }}>
          {(["vorschlag", "akzeptiert", "abgelehnt"] as VorschlagStatus[]).map(w => (
            <button key={w} type="button" onClick={() => setStatus(w)} className="ui-fokusring cursor-pointer"
              style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                background: status === w ? "var(--brand-primary-light)" : "var(--bg-elevated)",
                border: status === w ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
                color: status === w ? "var(--brand-primary)" : "var(--text-primary)" }}>
              {w === "vorschlag" ? "Vorschlag" : w === "akzeptiert" ? "Akzeptiert" : "Abgelehnt"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 12, marginTop: 12 }}>
        <AppButton variant="sekundaer" onClick={() => {
          if (!titel.trim()) return;
          pflegediagnoseSichern(patientId, {
            id: eintrag?.id ?? "", nandaCode: nanda, titel, begruendung, status,
            bezugCap: eintrag?.bezugCap ?? null, icdIds: eintrag?.icdIds ?? [],
            ohnePlanVermerk: eintrag?.ohnePlanVermerk || (hatPlan ? "" : "Ausserhalb des Pflegeplans erfasst"),
          });
          onFertig();
        }}>Sichern</AppButton>
        <button type="button" onClick={onFertig} className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GRUPPE DOSSIER — Ordnerstruktur, Dokumente, Pflichtlücken

   Ein Modell für Patienten und Angehörige: der Typkatalog führt, der Ordner
   folgt aus der Kategorie des Typs. Die früheren `getPatientFolders()` und
   `getAngehoerigeFolders()` gaben für jede Person dieselben erfundenen
   Dateien zurück und kannten weder Pflicht noch Gültigkeit.
   ══════════════════════════════════════════ */

/**
 * Der Dokumentkontext eines Patienten.
 *
 * Alle Bedingungen ausser IMMER betreffen Angehörigentypen — beim Patienten
 * gibt es weder Partner noch Kinderzulagen im Dokumentsinn. Sie stehen
 * trotzdem hier, damit die Prüfung dieselbe Funktion nutzt wie bei den
 * Angehörigen und nicht eine zweite mit anderer Auslassung.
 */
const PATIENT_DOK_KONTEXT_360: DokumentKontext = {
  partnerErforderlich: false, hatKinder: false, kinderzulagenUeberSpitex: false,
  unterhaltspflicht: false, zertifikatDeutschVorhanden: false,
  srkZertifikatVorhanden: false, assistenzbeitragJa: false,
};

const DOK_REF = (patientId: string): DokumentReferenz => ({ art: "patient", kennung: patientId });

function AnsichtOrdnerstruktur({ patient }: { patient: Patient }) {
  const alle = useDokumente();
  const staende = ordnerStand(alle, DOK_REF(patient.id), PATIENT_DOK_KONTEXT_360, MANDAT_STICHTAG);
  const gesamt = staende.reduce((s, o) => s + o.dokumente.length, 0);

  const marke = (o: OrdnerStand) => {
    const z = ordnerZustand(o);
    if (z === "abgelaufen") return { text: `${o.abgelaufen.length} abgelaufen`, bg: "var(--status-warning-bg)", fg: "var(--status-warning-text)" };
    if (z === "pflicht_fehlt") return { text: `${o.fehlend.length} Pflichtdokument${o.fehlend.length === 1 ? " fehlt" : "e fehlen"}`, bg: "var(--status-warning-bg)", fg: "var(--status-warning-text)" };
    if (z === "leer") return { text: "leer", bg: "var(--bg-secondary)", fg: "var(--text-tertiary)" };
    return { text: "vollständig", bg: "var(--status-success-bg)", fg: "var(--status-success-text)" };
  };

  return (
    <PSectionCard title="Ordnerstruktur" icon={FolderOpen}>
      <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "0 0 12px", maxWidth: "74ch", lineHeight: 1.55 }}>
        Die Ordner folgen den Dokumenttypen und sind nicht frei anlegbar — die Struktur ist eine
        Vorgabe der Organisation. {gesamt === 0
          ? "Für diesen Patienten liegt bisher kein Dokument ab."
          : `${gesamt} ${gesamt === 1 ? "Dokument" : "Dokumente"} abgelegt.`}
      </p>
      <div className="flex flex-col" style={{ gap: 2 }}>
        {staende.map(o => {
          const m = marke(o);
          return (
            <div key={o.ordner} className="flex items-center flex-wrap" style={{ gap: 10, padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <FolderOpen style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <span style={{ width: 150, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{o.ordner}</span>
              <span style={{ width: 70, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                {o.dokumente.length} {o.dokumente.length === 1 ? "Dokument" : "Dokumente"}
              </span>
              <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: m.bg, color: m.fg, whiteSpace: "nowrap" }}>
                {m.text}
              </span>
              {o.fehlend.length > 0 && (
                <span style={{ flex: 1, minWidth: 200, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{o.fehlend.join(", ")}</span>
              )}
            </div>
          );
        })}
      </div>
    </PSectionCard>
  );
}

function AnsichtDokumente({ patient }: { patient: Patient }) {
  const alle = useDokumente();
  const eigene = dokumenteVon(alle, DOK_REF(patient.id));
  const [ordner, setOrdner] = useState<string | null>(null);
  const ordnerListe = ordnerFuer("patient");
  const gezeigt = ordner ? eigene.filter(d => ordnerDes(d) === ordner) : eigene;

  return (
    <PSectionCard title="Dokumente" icon={FileText}>
      {eigene.length === 0 ? (
        /* Keine leere Tabelle: ein Kopf über nichts sähe aus wie ein Fehler.
           Und es liegt tatsächlich nichts ab — im Onboarding wurde für diesen
           Patienten kein Dokument erfasst. */
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
          Für diesen Patienten liegt kein Dokument ab. Erfasst wird im Onboarding; was dort
          hochgeladen wird, erscheint hier.
        </p>
      ) : (
        <>
          <div className="flex items-center flex-wrap" style={{ gap: 6, marginBottom: 12 }}>
            <DokFilterChip aktiv={ordner === null} label="Alle" anzahl={eigene.length} onClick={() => setOrdner(null)} />
            {ordnerListe.map(o => (
              <DokFilterChip key={o} aktiv={ordner === o} label={o}
                anzahl={eigene.filter(d => ordnerDes(d) === o).length} onClick={() => setOrdner(o)} />
            ))}
          </div>
          <div className="flex flex-col" style={{ gap: 2 }}>
            {gezeigt.map(d => <DokumentZeile key={d.id} dokument={d} />)}
          </div>
        </>
      )}
    </PSectionCard>
  );
}

function DokFilterChip({ aktiv, label, anzahl, onClick }: { aktiv: boolean; label: string; anzahl: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ui-fokusring cursor-pointer inline-flex items-center"
      style={{ gap: 6, padding: "4px 11px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
        background: aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)",
        border: aktiv ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
        color: aktiv ? "var(--brand-primary)" : "var(--text-primary)" }}>
      {label}
      <span style={{ fontVariantNumeric: "tabular-nums", color: aktiv ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{anzahl}</span>
    </button>
  );
}

/** Eine Dokumentzeile — für Patienten und Angehörige dieselbe. */
function DokumentZeile({ dokument: d }: { dokument: Dokument }) {
  const typ = dokumenttyp(d.typCode);
  const bis = gueltigBisText(d);
  const abgelaufen = istAbgelaufen(d, MANDAT_STICHTAG);
  return (
    <div className="flex items-baseline flex-wrap" style={{ gap: 10, padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
      <span style={{ width: 190, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{typ?.label ?? d.typCode}</span>
      <span style={{ flex: 1, minWidth: 180, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{d.bezeichnung}</span>
      <span style={{ width: 86, fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{d.ausgestelltAm}</span>
      <span style={{ width: 110, fontSize: "var(--text-meta)", fontVariantNumeric: "tabular-nums", color: abgelaufen ? "var(--status-warning-text)" : "var(--text-tertiary)" }}>
        {/* Ohne hinterlegte Gültigkeitsdauer steht dort nichts — keine
            Behauptung über eine Gültigkeit, die niemand kennt. */}
        {bis ? (abgelaufen ? `abgelaufen ${bis}` : `gültig bis ${bis}`) : "ohne Ablauf"}
      </span>
      <span style={{ width: 170, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{HERKUNFT_TEXT[d.herkunft]}</span>
      <span style={{ width: 90, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{d.erfasstVon}</span>
    </div>
  );
}

function AnsichtPflichtluecken({ patient }: { patient: Patient }) {
  const nav = useNavigate();
  const alle = useDokumente();
  const luecken = pflichtluecken(alle, DOK_REF(patient.id), PATIENT_DOK_KONTEXT_360, MANDAT_STICHTAG);
  const geprueft = geprueftePflichttypen(PATIENT_DOK_KONTEXT_360, "patient");

  return (
    <PSectionCard title="Pflichtlücken" icon={AlertTriangle}>
      {luecken.length === 0 ? (
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
          Kein Pflichtdokument fehlt. Geprüft wurden: {geprueft.join(", ")}.
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 2 }}>
          {luecken.map(l => (
            <div key={l.typCode} className="flex items-baseline flex-wrap" style={{ gap: 10, padding: "9px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <span style={{ width: 190, fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{l.label}</span>
              <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>
                {l.abgelaufenSeit ? `abgelaufen ${l.abgelaufenSeit}` : "fehlt"}
              </span>
              <span style={{ flex: 1, minWidth: 200, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{l.begruendung}</span>
              <span style={{ width: 110, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Ordner {l.ordner}</span>
              {/* Erfasst wird im Onboarding — dorthin führt der Verweis, nicht
                  in eine Ablage, in der nichts entstehen kann. */}
              <button type="button" onClick={() => nav("/onboarding")}
                className="ui-fokusring cursor-pointer inline-flex items-center"
                style={{ gap: 4, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
                Onboarding <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </PSectionCard>
  );
}

/* ══════════════════════════════════════════
   ANSICHT: Pflege › Pflegeberichte

   KEIN NEUES OBJEKT. Was die angehörige Person täglich schreibt, hängt als
   Fassung am Einsatz. Ein zweites Dokumentationsobjekt wäre eine parallele
   Variante desselben Inhalts — genau das Muster, das im Produkt mehrfach
   aufgeräumt wurde. Diese Ansicht liest `berichtFassungen` und schreibt
   nichts.

   Der Kalender der Pflegekontrolle zeigt, OB ein Bericht existiert. Hier
   steht, was darin steht — im Volltext, weil das der Ort ist, an dem Prosa
   gelesen wird. Bei einer Kassenkontrolle werden die Verlaufsberichte der
   letzten drei Monate verlangt.
   ══════════════════════════════════════════ */

const BERICHT_ZEITRAEUME = [3, 6, 12];

interface Berichtszeile {
  art: "bericht";
  einsatz: Einsatz;
  tag: Monatstag;
  fassung: Berichtfassung;
}

interface Lueckenzeile {
  art: "luecke";
  von: Monatstag;
  bis: Monatstag;
  anzahl: number;
}

function AnsichtPflegeberichte({ patient }: { patient: Patient }) {
  const nav = useNavigate();
  const einsaetze = useEinsaetze();
  const leistungen = useErbrachteLeistungen();
  const klvs = useKlvVerordnungen();
  const mandate = useMandate();
  const verordnungen = useVerordnungen();
  const [monate, setMonate] = useState(3);
  const [urheber, setUrheber] = useState<string | null>(null);
  const [suche, setSuche] = useState("");
  const [nurAbweichung, setNurAbweichung] = useState(false);

  /* Der Verlauf endet beim Austritt, wie das Controlling: nach ihm wurde
     nicht mehr gepflegt, und ein Zeitraum, der Monate ohne Pflege einschliesst,
     verwässert die Zahl darunter („N Berichte an M Tagen mit Einsatz"). */
  const austritt = austrittVon(patient);
  const ende = (austritt && austrittsMonat(austritt))
    ?? { jahr: EINSATZ_BEZUGSMONAT.getFullYear(), monat: EINSATZ_BEZUGSMONAT.getMonth() };
  const zeitraum = zeitraumMonate(ende.jahr, ende.monat, monate);
  const quellen = { einsaetze, leistungen, klvs, mandate, verordnungen };
  /* Dieselbe Rechnung wie in Pflegekontrolle, Überblick und Controlling —
     die Abweichung eines Tages stammt nicht aus einer zweiten Quelle. */
  const jeMonat = zeitraum.monate.map(m => monatsKennzahlen(patient.id, m.jahr, m.monat, quellen));
  const alleTage = jeMonat.flatMap(k => k.tage);

  /* Neueste zuerst. Ein Tag kann mehrere Einsätze tragen; jeder mit Bericht
     ist ein eigener Eintrag. */
  const mitBericht: Berichtszeile[] = [...alleTage].reverse().flatMap(t =>
    t.einsaetze
      .map(e => ({ e, f: aktuelleFassung(e) }))
      .filter((x): x is { e: Einsatz; f: Berichtfassung } => x.f !== null)
      .map(x => ({ art: "bericht" as const, einsatz: x.e, tag: t, fassung: x.f })));

  const urheberListe = [...new Set(mitBericht.map(b => b.fassung.von))];
  const suchtext = suche.trim().toLowerCase();

  const gefiltert = mitBericht.filter(b => {
    if (urheber && b.fassung.von !== urheber) return false;
    if (nurAbweichung && b.tag.abweichung === 0) return false;
    if (suchtext && !b.fassung.text.toLowerCase().includes(suchtext)) return false;
    return true;
  });
  const filterAktiv = urheber !== null || nurAbweichung || suchtext !== "";

  /* Lückenzeilen nur im vollständigen Verlauf: gefiltert bezögen sie sich auf
     eine Auswahl und behaupteten Lücken, die keine sind. */
  const zeilen: (Berichtszeile | Lueckenzeile)[] = [];
  if (!filterAktiv) {
    /* Nur Tage MIT Einsatz. Ein Tag ohne Einsatz ist keine Berichtslücke,
       sondern ein fehlender Einsatz — der gehört in die Pflegekontrolle. */
    const chronologisch = alleTage.filter(t => t.einsaetze.length > 0);
    let lauf: Monatstag[] = [];
    const schliessen = () => {
      if (lauf.length > 0) zeilen.push({ art: "luecke", von: lauf[0], bis: lauf[lauf.length - 1], anzahl: lauf.length });
      lauf = [];
    };
    /* Rückwärts durchlaufen, damit die Reihenfolge der neuesten zuerst
       entspricht; die Spannen werden dabei vorwärts benannt. */
    for (let i = chronologisch.length - 1; i >= 0; i--) {
      const t = chronologisch[i];
      if (t.hatBericht) {
        schliessen();
        t.einsaetze.forEach(e => {
          const f = aktuelleFassung(e);
          if (f) zeilen.push({ art: "bericht", einsatz: e, tag: t, fassung: f });
        });
      } else {
        lauf.unshift(t);
      }
    }
    schliessen();
  } else {
    zeilen.push(...gefiltert);
  }

  const tageMitEinsatz = alleTage.filter(t => t.einsaetze.length > 0).length;
  const zuruecksetzen = () => { setUrheber(null); setSuche(""); setNurAbweichung(false); };

  return (
    <div className="space-y-4">
      {/* ── Kopfzeile ── */}
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "12px 18px" }}>
        <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Zeitraum</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>{zeitraumText(zeitraum)}</div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              {mitBericht.length} {mitBericht.length === 1 ? "Bericht" : "Berichte"} an {tageMitEinsatz} Tagen mit Einsatz
            </div>
            {austritt && (
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                Betreuung beendet — {austrittText(austritt)}
              </div>
            )}
          </div>
          <div className="flex items-center" style={{ gap: 6, marginLeft: "auto" }}>
            {BERICHT_ZEITRAEUME.map(n => (
              <button key={n} type="button" onClick={() => setMonate(n)} className="ui-fokusring cursor-pointer"
                style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)",
                  background: monate === n ? "var(--brand-primary-light)" : "var(--bg-elevated)",
                  border: monate === n ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
                  color: monate === n ? "var(--brand-primary)" : "var(--text-primary)" }}>
                {n} Monate
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter ── */}
      {mitBericht.length > 0 && (
        <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
          <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
            <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input value={suche} onChange={e => setSuche(e.target.value)} placeholder="Im Berichtstext suchen"
              aria-label="Im Berichtstext suchen" className="flex-1 bg-transparent outline-none"
              style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
            {suche && (
              <button onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }} aria-label="Suche leeren">
                <X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} />
              </button>
            )}
          </div>
          <BerichtChip aktiv={urheber === null} label="Alle Urheber" onClick={() => setUrheber(null)} />
          {urheberListe.map(u => (
            <BerichtChip key={u} aktiv={urheber === u} label={urheberName2(u)}
              anzahl={mitBericht.filter(b => b.fassung.von === u).length} onClick={() => setUrheber(u)} />
          ))}
          <BerichtChip aktiv={nurAbweichung} label="Nur mit Abweichung"
            anzahl={mitBericht.filter(b => b.tag.abweichung !== 0).length}
            onClick={() => setNurAbweichung(v => !v)} />
        </div>
      )}

      {/* ── Verlauf ── */}
      {tageMitEinsatz === 0 ? (
        <PSectionCard title="Pflegeberichte" icon={FileText}>
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
            Im Zeitraum ist kein Einsatz erfasst. Ohne Einsatz entsteht kein Bericht — geschrieben
            wird er bei der Erfassung durch die pflegende Person.
          </p>
        </PSectionCard>
      ) : mitBericht.length === 0 ? (
        <PSectionCard title="Pflegeberichte" icon={FileText}>
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
            An {tageMitEinsatz} {tageMitEinsatz === 1 ? "Tag" : "Tagen"} mit Einsatz liegt kein Bericht vor.
            Der Verlauf ist damit für diesen Zeitraum leer.
          </p>
        </PSectionCard>
      ) : filterAktiv && gefiltert.length === 0 ? (
        <PSectionCard title="Pflegeberichte" icon={FileText}>
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: "0 0 10px", maxWidth: "74ch" }}>
            Kein Bericht entspricht der Auswahl
            {suchtext && ` — gesucht nach „${suche.trim()}"`}
            {urheber && ` — Urheber ${urheberName2(urheber)}`}
            {nurAbweichung && " — nur Tage mit Abweichung"}.
          </p>
          <button type="button" onClick={zuruecksetzen} className="ui-fokusring cursor-pointer"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)" }}>
            Filter zurücksetzen
          </button>
        </PSectionCard>
      ) : (
        <Verlauf zeilen={zeilen} suchtext={suchtext} patientId={patient.id} nav={nav} />
      )}
    </div>
  );
}

function BerichtChip({ aktiv, label, anzahl, onClick }: { aktiv: boolean; label: string; anzahl?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ui-fokusring cursor-pointer inline-flex items-center"
      style={{ gap: 6, padding: "6px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)",
        background: aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)",
        border: aktiv ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
        color: aktiv ? "var(--brand-primary)" : "var(--text-primary)", whiteSpace: "nowrap" }}>
      {label}
      {anzahl !== undefined && <span style={{ fontVariantNumeric: "tabular-nums", color: aktiv ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{anzahl}</span>}
    </button>
  );
}

/** Kennung oder Name des Urhebers auflösen — Angehörige tragen eine Kennung. */
function urheberName2(v: string): string {
  const a = getAngehoerige().find(x => x.id === v);
  return a ? `${a.vorname} ${a.nachname}` : v;
}

function Verlauf({ zeilen, suchtext, patientId, nav }: {
  zeilen: (Berichtszeile | Lueckenzeile)[]; suchtext: string; patientId: string;
  nav: (p: string) => void;
}) {
  /* Nach Monat gruppiert: ein Verlauf über drei Monate ohne Zwischenüberschrift
     liest sich als eine einzige Strecke. */
  const gruppen: { monat: string; zeilen: (Berichtszeile | Lueckenzeile)[] }[] = [];
  for (const z of zeilen) {
    const t = z.art === "bericht" ? z.tag : z.bis;
    const m = `${MONATE[monatVon(t.datum)]} ${jahrVon(t.datum)}`;
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.monat === m) letzte.zeilen.push(z);
    else gruppen.push({ monat: m, zeilen: [z] });
  }

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {gruppen.map(g => (
        <div key={g.monat}>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 8 }}>{g.monat}</div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {g.zeilen.map((z, i) => z.art === "luecke" ? (
              /* Ohne diese Zeilen läse sich der Verlauf durchgehend, obwohl er
                 es nicht ist — und genau das prüft eine Kasse. */
              <div key={`l-${i}`} className="flex items-center" style={{ gap: 8, padding: "6px 14px", borderRadius: 10, background: "var(--bg-secondary)" }}>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                  {z.anzahl === 1
                    ? `${z.von.nummer}. ${MONATE[monatVon(z.von.datum)]}`
                    : `${z.von.nummer}. bis ${z.bis.nummer}. ${MONATE[monatVon(z.bis.datum)]}`}
                  {" · "}kein Bericht
                  {z.anzahl > 1 && ` (${z.anzahl} Tage)`}
                </span>
              </div>
            ) : (
              <BerichtKarte key={z.einsatz.id} z={z} suchtext={suchtext} patientId={patientId} nav={nav} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function monatVon(datum: string): number { return Number(datum.slice(3, 5)) - 1; }
function jahrVon(datum: string): number { return Number(datum.slice(6)); }

function BerichtKarte({ z, suchtext, patientId, nav }: {
  z: Berichtszeile; suchtext: string; patientId: string; nav: (p: string) => void;
}) {
  const [fassungenOffen, setFassungenOffen] = useState(false);
  const frueher = fruehereFassungen(z.einsatz);
  const monat = `${jahrVon(z.tag.datum)}-${String(monatVon(z.tag.datum) + 1).padStart(2, "0")}`;

  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "12px 16px" }}>
      <div className="flex items-baseline flex-wrap" style={{ gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>
          {z.tag.nummer}. {MONATE[monatVon(z.tag.datum)]}
        </span>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{WOCHENTAGE_LANG[z.tag.wochentag]}</span>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{urheberName2(z.fassung.von)}</span>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{z.fassung.am}</span>
        {/* Die Abweichung des Tages steht daneben, nicht im Text: sie ist
            gerechnet, der Text ist geschrieben. */}
        {z.tag.abweichung !== 0 && (
          <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap",
            background: z.tag.abweichung > 0 ? "var(--status-info-bg)" : "var(--status-warning-bg)",
            color: z.tag.abweichung > 0 ? "var(--status-info)" : "var(--status-warning-text)" }}>
            {z.tag.abweichung > 0 ? "+" : "−"}{Math.abs(Math.round(z.tag.abweichung))} Min.
          </span>
        )}
        <button type="button" onClick={() => nav(`${ansichtPfad(patientId, "pflegekontrolle")}?monat=${monat}`)}
          className="ui-fokusring cursor-pointer inline-flex items-center"
          style={{ gap: 4, marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit",
            fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
          Zum Tag <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {/* Volltext, kein Abschneiden — das ist der Ort, an dem Prosa gelesen
          wird. Lesespalte auf 74 Zeichen begrenzt. */}
      <div style={{ maxWidth: "74ch" }}>
        {z.fassung.text.split("\n").filter(a => a.trim()).map((absatz, i) => (
          <p key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", lineHeight: 1.65, margin: i === 0 ? 0 : "8px 0 0" }}>
            {hervorheben(absatz, suchtext)}
          </p>
        ))}
      </div>

      {frueher.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            Zuletzt geändert am {z.fassung.am} durch {urheberName2(z.fassung.von)}
          </div>
          <button type="button" onClick={() => setFassungenOffen(o => !o)} className="ui-fokusring cursor-pointer"
            style={{ background: "none", border: "none", padding: 0, marginTop: 4, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
            {fassungenOffen ? "Frühere Fassungen ausblenden" : `${frueher.length} frühere ${frueher.length === 1 ? "Fassung" : "Fassungen"} anzeigen`}
          </button>
          {fassungenOffen && (
            <div className="flex flex-col" style={{ gap: 8, marginTop: 8 }}>
              {frueher.map((f, i) => <FruehereFassung key={i} fassung={f} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Treffer im Text sichtbar machen, ohne den Text zu verändern. */
function hervorheben(text: string, suchtext: string): React.ReactNode {
  if (!suchtext) return text;
  const teile: React.ReactNode[] = [];
  const unten = text.toLowerCase();
  let i = 0, n = 0;
  while (i < text.length) {
    const treffer = unten.indexOf(suchtext, i);
    if (treffer < 0) { teile.push(text.slice(i)); break; }
    if (treffer > i) teile.push(text.slice(i, treffer));
    teile.push(
      <mark key={n++} style={{ background: "var(--brand-primary-light)", color: "var(--text-primary)", borderRadius: 3, padding: "0 1px" }}>
        {text.slice(treffer, treffer + suchtext.length)}
      </mark>,
    );
    i = treffer + suchtext.length;
  }
  return teile;
}

/* ══════════════════════════════════════════
   ANSICHT: Controlling — hält das Dossier einer Kontrolle stand?

   Bei einer Kassenkontrolle verlangt der Versicherer die Unterlagen der
   letzten drei Monate; bei Kaufmann sind das rund neunzig Berichte und ein
   bis zwei Wochen Arbeit, nachträglich zusammengesucht. Diese Ansicht
   beantwortet die Frage vorher.
   ══════════════════════════════════════════ */

const CONTROLLING_ZEITRAEUME = [3, 6, 12];

function AnsichtControlling({ patient }: { patient: Patient }) {
  const nav = useNavigate();
  const einsaetze = useEinsaetze();
  const leistungen = useErbrachteLeistungen();
  const klvs = useKlvVerordnungen();
  const mandate = useMandate();
  const verordnungen = useVerordnungen();
  const kgs = useKostengutsprachen();
  const angehoerige = useAngehoerige();
  const alleDokumente = useDokumente();
  const [monate, setMonate] = useState(3);

  /* Eine Kassenkontrolle kann rückwirkend kommen — geprüft wird deshalb der
     Zeitraum, in dem gepflegt wurde. Monate nach dem Austritt gehören nicht
     dazu: dort gab es keine Leistung, die zu belegen wäre. */
  const austritt = austrittVon(patient);
  const ende = (austritt && austrittsMonat(austritt))
    ?? { jahr: EINSATZ_BEZUGSMONAT.getFullYear(), monat: EINSATZ_BEZUGSMONAT.getMonth() };
  const zeitraum: Zeitraum = zeitraumMonate(ende.jahr, ende.monat, monate);
  const mandatIds = mandate.filter(m => m.patientId === patient.id).map(m => m.id);
  const blatt = [...klvs].filter(k => k.patientId === patient.id && k.status !== "ersetzt")
    .sort((a, b) => b.version - a.version)[0] ?? null;

  /* Eine Rechnung, drei Orte: dieselbe Funktion speist Pflegekontrolle,
     Überblick und diese Ansicht. */
  const quellen = { einsaetze, leistungen, klvs, mandate, verordnungen };
  const jeMonat = zeitraum.monate.map(m => monatsKennzahlen(patient.id, m.jahr, m.monat, quellen));

  /* Über wen wurde im Zeitraum abgerechnet? Die Einsätze sagen es — sie
     tragen die Kennung der angehörigen Person, die geleistet hat. */
  const kennungen = new Set(
    jeMonat.flatMap(k => k.tage).flatMap(t => t.einsaetze)
      .map(e => (e.erbrachtDurch.art === "angehoeriger" ? e.erbrachtDurch.kennung : ""))
      .filter(Boolean));
  const abgerechnete = angehoerige.filter(a => kennungen.has(a.id));

  /* Rhythmusschritte der abgerechneten Angehörigen, fällig im Zeitraum. */
  const rhythmusEintraege = unifiedEntries.filter(e =>
    e.quelle === "rhythmus" && e.personBezug.art === "angehoeriger" && kennungen.has(e.personBezug.kennung)
    && e.faellig !== null && (() => {
      const d = ausAnzeigedatum(isoZuAnzeige(e.faellig!));
      return d !== null && d >= zeitraum.von && d <= zeitraum.bis;
    })());
  const rhythmus = {
    faellig: rhythmusEintraege.length,
    ueberfaellig: rhythmusEintraege.filter(e => {
      if (e.status === "erledigt") return false;
      const d = ausAnzeigedatum(isoZuAnzeige(e.faellig!));
      return d !== null && d < MANDAT_STICHTAG;
    }).length,
  };

  const plan = MOCK_PFLEGEPLANUNGEN.find(p => p.patientId === patient.id) ?? null;
  const zeilen = pruefbereitschaft({
    patientId: patient.id, zeitraum, blatt,
    verordnungen: verordnungen.filter(v => mandatIds.includes(v.mandatId)),
    kostengutsprachen: kgs.filter(k => mandatIds.includes(k.mandatId)),
    pflegediagnosen: plan ? plan.pflegediagnosen.length : null,
    jeMonat, abgerechnete, rhythmus,
    dokumentluecken: {
      fehlend: pflichtluecken(alleDokumente, DOK_REF(patient.id), PATIENT_DOK_KONTEXT_360, MANDAT_STICHTAG).map(l => l.label),
      abgelegt: dokumenteVon(alleDokumente, DOK_REF(patient.id)).length,
    },
  });

  /* ── Teil 2: Massnahme gegen Dokumentation ──
     Erwartete Anzahl im Zeitraum aus der verordneten Häufigkeit; erbrachte
     aus den erfassten Leistungen. */
  const positionen = (blatt?.leistungspositionen ?? []).filter(istPeriodisch);
  const alleLeistungen = jeMonat.flatMap(k => k.tage).flatMap(t => t.einsaetze)
    .filter(e => e.zustand === "erbracht")
    .flatMap(e => leistungen.filter(l => l.einsatzId === e.id && l.erbracht));
  const abgleich = positionen.map(pos => {
    const erwartet = zeitraum.monate.reduce(
      (s, m) => s + erwarteteAnzahlImMonat(pos, new Date(m.jahr, m.monat + 1, 0).getDate()), 0);
    const erbracht = alleLeistungen.filter(l => l.positionId === pos.id).length;
    return { pos, erwartet, erbracht, fehlend: Math.max(0, erwartet - erbracht) };
  });
  const einsaetzeImZeitraum = jeMonat.reduce((s, k) => s + k.einsaetzeGesamt, 0);
  const leereMonate = jeMonat
    .map((k, i) => ({ k, m: zeitraum.monate[i] }))
    .filter(x => x.k.einsaetzeGesamt === 0)
    .map(x => `${MONATE[x.m.monat]} ${x.m.jahr}`);

  const vollstaendig = zaehleVollstaendig(zeilen);
  const farbe = (z: Zustand) => z === "vollstaendig"
    ? { bg: "var(--status-success-bg)", fg: "var(--status-success-text)", text: "vollständig" }
    : z === "lueckenhaft"
      ? { bg: "var(--status-warning-bg)", fg: "var(--status-warning-text)", text: "lückenhaft" }
      : { bg: "var(--status-danger-bg)", fg: "var(--status-danger)", text: "fehlt" };

  /* Ohne Mandat oder ohne Blatt fehlt die Abrechnungsgrundlage — dann sieben
     rote Zeilen zu zeigen, behauptete Versäumnisse, wo nur nichts angelegt
     ist. Eine Kasse prüft, was abgerechnet wurde; ohne Grundlage wurde
     nichts abgerechnet. */
  if (mandatIds.length === 0 || !blatt) {
    return (
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "16px 18px" }}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch", lineHeight: 1.6 }}>
          {mandatIds.length === 0
            ? "Für diesen Patienten besteht kein Mandat. "
            : "Für diesen Patienten besteht kein aktives Leistungsplanungsblatt. "}
          Ohne Abrechnungsgrundlage gibt es nichts, was eine Kasse prüfen könnte — und nichts, was
          hier als fehlend zu melden wäre.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Kopfzeile: Zeitraum ── */}
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "12px 18px" }}>
        <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Geprüfter Zeitraum</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>{zeitraumText(zeitraum)}</div>
            {austritt && (
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>
                Betreuung beendet — {austrittText(austritt)}
              </div>
            )}
          </div>
          <div className="flex items-center" style={{ gap: 6, marginLeft: "auto" }}>
            {CONTROLLING_ZEITRAEUME.map(n => (
              <button key={n} type="button" onClick={() => setMonate(n)}
                className="ui-fokusring cursor-pointer"
                style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)",
                  background: monate === n ? "var(--brand-primary-light)" : "var(--bg-elevated)",
                  border: monate === n ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
                  color: monate === n ? "var(--brand-primary)" : "var(--text-primary)" }}>
                {n} Monate
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Teil 1: Prüfbereitschaft ── */}
      <PSectionCard title="Prüfbereitschaft" icon={ClipboardCheck}>
        {/* Kein Punktesystem: eine Kontrolle bestehen heisst nicht achtzig
            Prozent, sondern dass jede verlangte Unterlage vorliegt. */}
        <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", marginBottom: 10 }}>
          {vollstaendig} von {zeilen.length} Unterlagen vollständig
        </div>
        {austritt && (
          <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "0 0 12px", maxWidth: "74ch", lineHeight: 1.55 }}>
            Die Betreuung ist beendet. Die Unterlagen bleiben massgebend — eine Kasse kann bis zu
            fünf Jahre rückwirkend prüfen. Nachzubeschaffen ist nichts mehr.
          </p>
        )}
        <div className="flex flex-col" style={{ gap: 2 }}>
          {zeilen.map(z => {
            const f = farbe(z.zustand);
            return (
              <div key={z.id} className="flex items-start flex-wrap" style={{ gap: 10, padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <span style={{ width: 250, flexShrink: 0, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{z.unterlage}</span>
                <span style={{ flexShrink: 0, padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap", background: f.bg, color: f.fg }}>
                  {f.text}
                </span>
                <span style={{ flex: 1, minWidth: 220, fontSize: "var(--text-meta)", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  {z.befund}
                </span>
                {/* Nach dem Austritt bleibt der Zustand stehen — eine
                    Kassenkontrolle kann rückwirkend kommen. Was entfällt, ist
                    die Aufforderung, Fehlendes jetzt noch zu beschaffen. */}
                {!austritt && (
                  <button type="button" onClick={() => nav(ansichtPfad(patient.id, z.ansicht))}
                    className="ui-fokusring cursor-pointer inline-flex items-center"
                    style={{ gap: 4, flexShrink: 0, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
                    {z.verweis} <ChevronRight style={{ width: 11, height: 11 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PSectionCard>

      {/* ── Teil 2: Massnahme gegen Dokumentation ── */}
      <PSectionCard title="Verordnet gegen dokumentiert" icon={ListChecks}>
        <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "0 0 12px", maxWidth: "74ch", lineHeight: 1.55 }}>
          Das ist der Abgleich, den die Kasse maschinell macht: eine verordnete und nie erbrachte
          Position ist der Befund, der eine Rückforderung auslöst. Geprüft wird die Anzahl im
          Zeitraum, nicht der einzelne Tag — das Blatt verordnet Häufigkeiten und keinen
          Wochentagsplan.
        </p>
        {!blatt ? (
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0 }}>
            Kein aktives Leistungsplanungsblatt — es gibt keine verordnete Position, gegen die sich
            etwas abgleichen liesse.
          </p>
        ) : einsaetzeImZeitraum === 0 ? (
          <p style={{ fontSize: "var(--text-small)", color: "var(--status-warning-text)", margin: 0, maxWidth: "74ch" }}>
            Im Zeitraum ist kein einziger Einsatz erfasst. Damit ist keine der {positionen.length} verordneten
            Positionen dokumentiert — das ist ein Befund über die Erfassung, nicht über einzelne Positionen.
          </p>
        ) : (
          <div className="flex flex-col" style={{ gap: 2 }}>
            {/* Monate ganz ohne Erfassung erklären die Unterschreitungen
                darunter — ohne diesen Satz läse sich jede Zeile als Lücke in
                der einzelnen Position statt als fehlende Erfassung. */}
            {leereMonate.length > 0 && (
              <p style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", margin: "0 0 10px", maxWidth: "74ch", lineHeight: 1.55 }}>
                In {leereMonate.join(", ")} ist kein Einsatz erfasst. Die Unterschreitungen unten
                folgen daraus und betreffen nicht die einzelne Position.
              </p>
            )}
            <div className="flex items-baseline" style={{ gap: 10, paddingBottom: 5 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Position</span>
              <span style={{ width: 92, textAlign: "right", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Verordnet</span>
              <span style={{ width: 68, textAlign: "right", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Erwartet</span>
              <span style={{ width: 68, textAlign: "right", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Erbracht</span>
              <span style={{ width: 140, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Zustand</span>
            </div>
            {abgleich.map(a => (
              <div key={a.pos.id} className="flex items-baseline flex-wrap" style={{ gap: 10, padding: "7px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <span style={{ flex: 1, minWidth: 200, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", marginRight: 7 }}>{a.pos.klvNummer}</span>
                  {a.pos.bezeichnung}
                </span>
                <span style={{ width: 92, textAlign: "right", fontSize: "var(--text-meta)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{haeufigkeitText(a.pos)}</span>
                <span style={{ width: 68, textAlign: "right", fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{a.erwartet}</span>
                <span style={{ width: 68, textAlign: "right", fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums" }}>{a.erbracht}</span>
                <span style={{ width: 140, fontSize: "var(--text-meta)", color: a.fehlend > 0 ? "var(--status-warning-text)" : "var(--status-success-text)", whiteSpace: "nowrap" }}>
                  {a.fehlend > 0 ? `unterschritten um ${a.fehlend}` : "gedeckt"}
                </span>
              </div>
            ))}
          </div>
        )}
      </PSectionCard>

      {/* ── Teil 3: Was nicht beurteilbar ist ── */}
      <PSectionCard title="Nicht beurteilbar" icon={Info}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {NICHT_BEURTEILBAR_CONTROLLING.map((t, i) => (
            <li key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "74ch", marginBottom: 4 }}>{t}</li>
          ))}
        </ul>
      </PSectionCard>
    </div>
  );
}

/* ══════════════════════════════════════════
   Annas Lagebild

   Ersetzt die frühere Zusammenfassung, die Name, Alter, Schweregrad und
   Bezugsperson wiederholte — alles vier stand schon in der Kopfzeile
   darüber. Hier steht, was offen ist, und jede Aussage nennt die Stelle, an
   der sie nachprüfbar ist.
   ══════════════════════════════════════════ */

function AnnaLagebild({ patient }: { patient: Patient }) {
  const nav = useNavigate();
  const einsaetze = useEinsaetze();
  const leistungen = useErbrachteLeistungen();
  const klvs = useKlvVerordnungen();
  const mandate = useMandate();
  const verordnungen = useVerordnungen();
  const kgs = useKostengutsprachen();
  const [erzeugtAm, setErzeugtAm] = useState(() => jetztAnzeige());
  const [meldung, setMeldung] = useState("");

  const monat = { jahr: EINSATZ_BEZUGSMONAT.getFullYear(), monat: EINSATZ_BEZUGSMONAT.getMonth() };
  const mandatIds = mandate.filter(m => m.patientId === patient.id).map(m => m.id);
  const kennzahlen = monatsKennzahlen(patient.id, monat.jahr, monat.monat, {
    einsaetze, leistungen, klvs, mandate, verordnungen,
  });
  /* Pendenzen der Person aus dem gemeinsamen Bestand — dieselbe Quelle, die
     der Service Desk liest. */
  const eigenePendenzen = unifiedEntries.filter(e =>
    e.personBezug.art === "patient" && e.personBezug.kennung === patient.id && e.status !== "erledigt");
  const pendenzen = {
    offen: eigenePendenzen.length,
    ueberfaellig: eigenePendenzen.filter(e => {
      const f = e.faellig ? isoZuAnzeige(e.faellig) : "";
      const d = f ? ausAnzeigedatum(f) : null;
      return d !== null && d < MANDAT_STICHTAG;
    }).length,
  };

  const befunde = lagebild({
    patientId: patient.id, klvs, kostengutsprachen: kgs, mandatIds,
    kennzahlen, monat, pendenzen, stichtag: MANDAT_STICHTAG,
    austritt: austrittVon(patient),
  });

  return (
    <div style={{ background: "var(--anna-bg, var(--status-info-bg))", borderLeft: "3px solid var(--brand-primary)",
      borderRadius: "var(--radius-card)", overflow: "hidden" }}>
      {/* ── Kopf ── */}
      <div className="flex items-center flex-wrap" style={{ gap: 9, padding: "12px 16px 8px" }}>
        <Sparkles style={{ width: 15, height: 15, color: "var(--brand-primary)" }} />
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Annas Lagebild</span>
        <span style={{ padding: "1px 7px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
          Erzeugt
        </span>
        <span style={{ marginLeft: "auto", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{erzeugtAm}</span>
      </div>

      <div style={{ padding: "0 16px 12px" }}>
        <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "0 0 10px", maxWidth: "74ch" }}>
          {befunde.length > 0
            ? "Was bei diesem Patienten offen ist — gezählt aus den Daten des Dossiers, jede Aussage mit Quelle."
            : "Was bei diesem Patienten offen ist — gezählt aus den Daten des Dossiers."}
        </p>

        {befunde.length === 0 ? (
          /* Eine Zeile, kein leerer Block: „nichts offen" ohne Nennung des
             Geprüften wäre wertlos, weil unklar bliebe, worauf es sich bezieht. */
          <div className="flex items-start" style={{ gap: 8, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
            <Check style={{ width: 14, height: 14, color: "var(--status-success)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ maxWidth: "74ch" }}>Nichts offen. Geprüft wurden {GEPRUEFT_WURDE}</span>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 7 }}>
            {befunde.map(b => (
              <div key={b.id} className="flex items-start flex-wrap" style={{ gap: 8 }}>
                <span style={{ flexShrink: 0, padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap",
                  background: b.band === "pruefen" ? "var(--status-warning-bg)" : "var(--bg-elevated)",
                  color: b.band === "pruefen" ? "var(--status-warning-text)" : "var(--text-secondary)" }}>
                  {b.band === "pruefen" ? "Bitte prüfen" : "Belegt"}
                </span>
                <span style={{ flex: 1, minWidth: 240, fontSize: "var(--text-small)", color: "var(--text-primary)", lineHeight: 1.55 }}>
                  {b.text}
                </span>
                <button type="button"
                  onClick={() => nav(`${ansichtPfad(patient.id, b.ansicht)}${b.suchteil ?? ""}`)}
                  className="ui-fokusring cursor-pointer inline-flex items-center"
                  style={{ gap: 4, flexShrink: 0, background: "none", border: "none", padding: 0, fontFamily: "inherit",
                    fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
                  {b.quelle} <ChevronRight style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Was mangels Datenmodell offen bleibt ──
            Damit das Schweigen des Lagebilds nicht als Unbedenklichkeit
            gelesen wird. */}
        <div style={{ marginTop: 12, padding: "9px 11px", borderRadius: 10, background: "var(--bg-elevated)" }}>
          <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>Nicht beurteilbar</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {NICHT_BEURTEILBAR.map((t, i) => (
              <li key={i} style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", lineHeight: 1.55, maxWidth: "74ch" }}>{t}</li>
            ))}
          </ul>
        </div>

        {meldung && (
          <div style={{ marginTop: 8, fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>{meldung}</div>
        )}
      </div>

      {/* ── Fusszeile ── */}
      <div className="flex items-center flex-wrap" style={{ gap: 12, padding: "8px 16px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", maxWidth: "74ch" }}>
          Gerechnet aus Leistungsplanungsblatt, Verordnung, Kostengutsprache, Einsätzen und Pendenzen. Kein Modell im Spiel.
        </span>
        <div className="flex items-center" style={{ gap: 12, marginLeft: "auto" }}>
          <button type="button" onClick={() => setMeldung("Vermerkt. Das Lagebild wird gerechnet — eine Rückmeldung ändert nicht die Zahlen, sondern die Regel dahinter.")}
            className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            Stimmt nicht
          </button>
          <button type="button" onClick={() => { setErzeugtAm(jetztAnzeige()); setMeldung(""); }}
            className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            Neu erzeugen
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Notizen im Überblick — zeigen und verweisen, nicht erfassen.
 *
 * Sie lagen in der linken Spalte des früheren Layouts und haben beim Umbau
 * auf die Seitennavigation keinen Ort bekommen. Der Bestand trägt sie
 * weiterhin; nur sichtbar waren sie nirgends mehr.
 */
function NotizKarte({ patient }: { patient: Patient }) {
  const alle = useAlleNotizen();
  const eigene = sichtbareNotizen(alle, { art: "patient", kennung: patient.id });
  /* Angeheftete zuerst — die Sortierung besorgt `sichtbareNotizen` —, danach
     die beiden neuesten. Mehr gehört in die Notizspur, nicht in den
     Überblick. */
  const gezeigt = eigene.slice(0, 3);

  return (
    <PSectionCard title="Notizen" icon={MessageSquare}>
      {eigene.length === 0 ? (
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch" }}>
          Keine Notiz zu diesem Patienten. Notizen halten fest, was zwischen den Feldern steht —
          Absprachen, Beobachtungen, Zugangswege.
        </p>
      ) : (
        <>
          <div className="flex flex-col" style={{ gap: 9 }}>
            {gezeigt.map(n => (
              <div key={n.id}>
                <div className="flex items-center" style={{ gap: 6, marginBottom: 2 }}>
                  {n.angeheftet && (
                    <span style={{ padding: "0 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                      Angeheftet
                    </span>
                  )}
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                    {n.autor} · {formatDatumZeit(new Date(n.erstelltAm))}
                  </span>
                </div>
                <p style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", margin: 0, lineHeight: 1.55,
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {n.text}
                </p>
              </div>
            ))}
          </div>
          {/* Kein Verweis auf „alle Notizen": eine Notizansicht besteht im
              Dossier nicht, und einen Ort zu erfinden, den es nicht gibt,
              wäre schlimmer als die Zahl allein. */}
          {eigene.length > gezeigt.length && (
            <p style={{ marginTop: 9, marginBottom: 0, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              {eigene.length - gezeigt.length} weitere {eigene.length - gezeigt.length === 1 ? "Notiz" : "Notizen"} zu diesem Patienten.
            </p>
          )}
        </>
      )}
    </PSectionCard>
  );
}

/* ══════════════════════════════════════════
   Abrechnungsleiste

   Abgerechnet wird, was erbracht wurde — getaktet in fünf Minuten je
   Leistungsart, mindestens zehn je Einsatz. Verglichen wird gegen die
   Bedarfsmeldung, die Minuten je Leistungsart und Monat nennt.

   „Zu wenig erbracht" steht hier bewusst nicht: ein Tag mit weniger Pflege
   ist eine Frage der Pflegequalität. Sie gehört in den Kalender und in
   „Zu prüfen", nicht in eine Leiste über die Abrechnung.

   Drei Felder nebeneinander statt untereinander. Was Höhe kostete, ohne eine
   Frage zu beantworten, ist weg: der Balken (bei 99.7 % sieht er voll aus und
   sagt weniger als die Zahl daneben), die Zeile für eine Kategorie, die es
   beim Patienten nicht gibt, und der Erklärabsatz.
   ══════════════════════════════════════════ */

/** Volle Fassung des Ableitungshinweises — sichtbar gekürzt, hier im Wortlaut. */
const ABLEITUNG_HINWEIS =
  "Die Zeit je Leistungsart ist abgeleitet: die gestempelte Gesamtzeit wird im Verhältnis "
  + "der verordneten Zeiten auf die erbrachten Positionen verteilt. Das ist eine Setzung, "
  + "keine Erfassung — gestempelt wird eine Gesamtzeit je Einsatz.";

function Abrechnungsleiste({ abrechnung, tage, monat, verordnung, hatMeldung, muster, onVerordnung }: {
  abrechnung: Monatsabrechnung;
  tage: Monatstag[];
  monat: number;
  verordnung: Verordnung | null;
  hatMeldung: boolean;
  muster: { tage: Monatstag[]; wochentag: number | null };
  onVerordnung: () => void;
}) {
  const rahmen = { background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" } as const;
  const min = (n: number) => `${Math.round(n)} Min.`;

  if (abrechnung.anzahlEinsaetze === 0) {
    return (
      <div style={{ ...rahmen, padding: "12px 18px" }}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", margin: 0, maxWidth: "74ch" }}>
          In diesem Monat ist kein Einsatz erfasst. Ohne erbrachte Leistung gibt es nichts abzurechnen.
        </p>
      </div>
    );
  }

  const gemeldetTotal = abrechnung.jeArt.a.gemeldet + abrechnung.jeArt.b.gemeldet + abrechnung.jeArt.c.gemeldet;
  /* Nur Kategorien, die es bei diesem Patienten gibt. Eine Zeile „0 gemeldet,
     0 abrechenbar, ±0" bestätigt bloss, dass die Kategorie nicht vorkommt. */
  const arten = TARIF_KATEGORIEN.filter(k =>
    abrechnung.jeArt[k.code].gemeldet > 0 || abrechnung.jeArt[k.code].abrechenbar > 0);

  const mitBericht = tage.filter(t => t.hatBericht).length;
  const mitEinsatz = tage.filter(t => t.einsaetze.length > 0).length;
  const alleEinsaetze = tage.flatMap(t => t.einsaetze);
  const geprueft = alleEinsaetze.filter(e => e.pruefzustand === "geprueft").length;
  const trenner = { borderLeft: "var(--border-thin) solid var(--border-default)", paddingLeft: 18 } as const;

  return (
    <div style={rahmen}>
      <div className="flex flex-col lg:flex-row" style={{ padding: "11px 18px", gap: 18 }}>
        {/* ── Feld 1: die Zahl, um die es geht ── */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <LeisteTitel text="Abrechenbar im Monat" />
          <div className="flex items-baseline" style={{ gap: 7 }}>
            <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", lineHeight: 1.25 }}>
              {Math.round(abrechnung.abrechenbar)} Min.
            </span>
            {hatMeldung && (
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                von {Math.round(gemeldetTotal)} gemeldet
              </span>
            )}
          </div>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.35, whiteSpace: "nowrap" }}>
            {min(abrechnung.gestempelt)} gestempelt · + {min(abrechnung.ausRundung)} aus dem {TAKT_MINUTEN}-Minuten-Takt
          </div>
        </div>

        {/* ── Feld 2: je Leistungsart. Ohne Meldung entfällt es ganz — ohne
               Bedarfsmeldung vergütet der Versicherer nichts, und ein
               Vergleich gegen null wäre keiner. ── */}
        {hatMeldung ? (
          <div style={{ flex: 1, minWidth: 0, ...trenner }}>
            {/* Gekürzt, weil im Produkt kein Hinweis-Baustein am Fragezeichen
                besteht; der volle Wortlaut hängt am title-Attribut. Er steht
                an dieser Überschrift und nicht bei der Rundung, weil er genau
                diese Zahlen betrifft — und weil er dort keine Zeile kostet. */}
            <div className="flex items-baseline" style={{ gap: 7 }}>
              <LeisteTitel text="Je Leistungsart" />
              <span title={ABLEITUNG_HINWEIS}
                style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", cursor: "help" }}>
                abgeleitet, nicht erfasst
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 1 }}>
              {arten.map(k => {
                const b = abrechnung.jeArt[k.code];
                const drueber = b.differenz > 0;
                return (
                  <div key={k.code} className="flex items-baseline" style={{ gap: 8, whiteSpace: "nowrap", lineHeight: 1.35 }}>
                    <span style={{ width: 15, flexShrink: 0, fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
                      textAlign: "center", borderRadius: 3, background: "var(--bg-secondary)", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      {k.code}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
                      fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                      {k.label.replace(/^KLV [abc] — /, "")}
                    </span>
                    <span style={{ fontSize: "var(--text-meta)", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                      {Math.round(b.abrechenbar)}
                    </span>
                    <span style={{ width: 54, textAlign: "right", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                      von {Math.round(b.gemeldet)}
                    </span>
                    <span style={{ width: 40, textAlign: "right", fontSize: "var(--text-meta)", fontVariantNumeric: "tabular-nums",
                      fontWeight: drueber ? 500 : 400,
                      color: drueber ? "var(--status-warning-text)" : b.differenz < 0 ? "var(--text-tertiary)" : "var(--text-secondary)" }}>
                      {b.differenz > 0 ? "+" : b.differenz < 0 ? "−" : "±"}{Math.abs(Math.round(b.differenz))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0, ...trenner }}>
            <LeisteTitel text="Kein Vergleich möglich" />
            <div style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", maxWidth: "74ch" }}>
              Keine gültige Bedarfsmeldung — ohne sie vergütet der Versicherer nichts.
            </div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              {verordnung
                ? verordnung.gueltigBis.trim()
                  ? `Verordnung ${verordnung.id} gültig bis ${verordnung.gueltigBis}, ohne gemeldete Minuten je Leistungsart.`
                  : `Verordnung ${verordnung.id} unbefristet, ohne gemeldete Minuten je Leistungsart.`
                : "Keine Verordnung deckt diesen Monat."}
            </div>
          </div>
        )}

        {/* ── Feld 3: was den Monat sonst kennzeichnet ── */}
        <div style={{ width: 268, flexShrink: 0, ...trenner }}>
          <LeisteTitel text="Im Monat" />
          <div className="flex flex-col" style={{ gap: 1 }}>
            <LeisteZeile marke="Tage ohne Einsatz" text={
              muster.tage.length === 0 ? "keine"
                : `${muster.tage.length}${muster.wochentag !== null ? ` · alle am ${WOCHENTAGE_LANG[muster.wochentag]}` : ""}`} />
            <LeisteZeile marke="Pflegeberichte" text={`${mitBericht} von ${mitEinsatz} Tagen`} />
            <LeisteZeile marke="Geprüft" text={`${geprueft} von ${alleEinsaetze.length} Einsätzen`} />
          </div>
        </div>
      </div>

      {/* ── Befundstreifen. Nur bei Überschreitung — ohne sie gibt es nichts
             zu melden, und eine Zeile „alles gedeckt" wäre Höhe für nichts. ── */}
      {abrechnung.nichtGedeckt > 0 && (
        <div className="flex items-center flex-wrap" style={{ gap: 10, padding: "8px 18px",
          borderTop: "var(--border-thin) solid var(--border-default)", background: "var(--status-warning-bg)" }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
            <strong style={{ fontWeight: "var(--weight-medium)" }}>{min(abrechnung.nichtGedeckt)} nicht gedeckt</strong>
            {" — über der Meldung in "}
            {abrechnung.betroffene.length === 1 ? "Leistungsart" : "den Leistungsarten"}
            {" "}{abrechnung.betroffene.map(c => c.toUpperCase()).join(" und ")}.
            {" "}Eine Unterschreitung anderswo gleicht das nicht aus.
          </span>
          <button type="button" onClick={onVerordnung} className="ui-fokusring cursor-pointer"
            style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit",
              fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>
            Bedarfsmeldung prüfen
          </button>
        </div>
      )}

      {abrechnung.unterMindestwert > 0 && (
        <div className="flex items-center" style={{ gap: 10, padding: "8px 18px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
            {abrechnung.unterMindestwert} {abrechnung.unterMindestwert === 1 ? "Einsatz liegt" : "Einsätze liegen"} nach der
            Rundung unter {MINDESTWERT_EINSATZ} Minuten. Welcher Leistungsart die Aufstockung zugeschlagen wird, ist offen.
          </span>
        </div>
      )}
    </div>
  );
}

/** Überschrift eines Leistenfelds — dieselbe Gestaltung wie in den übrigen Leisten. */
function LeisteTitel({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 1 }}>{text}</div>
  );
}

/** Eine Zeile im Feld „Im Monat": Marke links, Aussage rechts. */
function LeisteZeile({ marke, text }: { marke: string; text: string }) {
  return (
    <div className="flex items-baseline" style={{ gap: 8, whiteSpace: "nowrap", lineHeight: 1.35 }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{marke}</span>
      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{text}</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   Abschnitt „Zu prüfen"

   Ein Ort statt zweier. Annas Einordnung sagt, was auffällt; die Gruppen
   darunter enthalten dieselben Tage mit den Aktionen dazu. Vorher stand
   beides getrennt und nannte dieselben Tage — man las es zweimal und
   scrollte dann zum Handeln.
   ══════════════════════════════════════════ */

type PruefGruppe = "fehlt" | "abweichung" | "stimmig";

function ZuPruefen({
  tage, monat, offen, einordnung, erzeugtAm, gewaehlt, leistungenVon, gesperrt,
  onOeffnen, onBestaetigen, onRueckfrage, onAlleStimmigen, onFehlende,
  onNeuErzeugen, onStimmtNicht,
}: {
  tage: Monatstag[]; monat: number; offen: number;
  /** Monat abgeschlossen — dann wird keine Schreibaktion mehr angeboten. */
  gesperrt: boolean;
  einordnung: string[]; erzeugtAm: string;
  gewaehlt: string | null;
  leistungenVon: (einsatzId: string) => ErbrachteLeistung[];
  onOeffnen: (datum: string) => void;
  onBestaetigen: (id: string) => void;
  onRueckfrage: (e: Einsatz) => void;
  onAlleStimmigen: () => void;
  onFehlende: (art: "nachtragen" | "rueckfrage") => void;
  onNeuErzeugen: () => void;
  onStimmtNicht: () => void;
}) {
  const fehlende = tage.filter(t => t.fehlt);
  const abweichende = tage.filter(t => !t.fehlt && t.abweichung !== 0 && t.einsaetze.length > 0);
  /* Stimmig heisst hier: keine Abweichung UND noch offen. Bereits geprüfte
     Tage stehen in keiner Gruppe — es ist nichts mehr an ihnen zu prüfen. */
  const stimmige = tage.filter(t => !t.fehlt && t.abweichung === 0 && t.einsaetze.length > 0 && t.offen);

  if (fehlende.length === 0 && abweichende.length === 0 && stimmige.length === 0) {
    return (
      <PSectionCard title="Zu prüfen" icon={CheckCircle2}>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          In diesem Monat ist nichts offen: kein Tag fehlt, keiner weicht ab, keiner wartet auf Bestätigung.
        </p>
      </PSectionCard>
    );
  }

  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
      {/* ── Kopfzeile ── */}
      <div className="flex items-center" style={{ gap: 10, padding: "13px 18px" }}>
        <CheckCircle2 style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
        <h3 style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", margin: 0 }}>Zu prüfen</h3>
        <span style={{ marginLeft: "auto", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {gesperrt ? "Monat abgeschlossen · gesperrt" : `${offen} ${offen === 1 ? "offener Einsatz" : "offene Einsätze"}`}
        </span>
      </div>

      {/* ── Annas Einordnung ── */}
      {einordnung.length > 0 && (
        <div style={{ margin: "0 18px 14px", padding: "12px 14px", borderRadius: 12, background: "var(--anna-bg, var(--status-info-bg))" }}>
          <div className="flex items-center" style={{ gap: 7, marginBottom: 7 }}>
            <Sparkles style={{ width: 14, height: 14, color: "var(--brand-primary)" }} />
            <span style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)" }}>Annas Einordnung</span>
            <span style={{ padding: "1px 7px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
              Erzeugt
            </span>
          </div>
          <p style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, maxWidth: "74ch" }}>
            {einordnung.join(" ")}
          </p>
        </div>
      )}

      {/* ── Gruppen. Leere entfallen — eine Gruppe mit null Zeilen ist keine
             Information, sondern eine Zeile, die man überliest. ── */}
      {fehlende.length > 0 && (
        <GruppenKopf sorte="fehlt" titel="Kein Einsatz" anzahl={fehlende.length}>
          <div className="flex items-center flex-wrap" style={{ gap: 10, padding: "9px 18px" }}>
            <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", minWidth: 132 }}>
              {tageBenennen(fehlende, monat)}
            </span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
              {anzahlWort(fehlende.length)} {fehlende.length === 1 ? "Tag" : "Tage"} ohne Erfassung, obwohl ein Tagessoll besteht
              {" · "}−{Math.round(fehlende.reduce((s, t) => s + t.soll, 0))} Min.
            </span>
            {!gesperrt && (
              <div className="flex items-center" style={{ gap: 12, marginLeft: "auto" }}>
                <ZeilenAktion text="Nachtragen" betont onClick={() => onFehlende("nachtragen")} />
                <ZeilenAktion text="Rückfrage" onClick={() => onFehlende("rueckfrage")} />
              </div>
            )}
          </div>
        </GruppenKopf>
      )}

      {abweichende.length > 0 && (
        <GruppenKopf sorte="abweichung" titel="Abweichung" anzahl={abweichende.length}>
          {abweichende.map(t => (
            <PruefZeile key={t.datum} tag={t} monat={monat} gewaehlt={t.datum === gewaehlt}
              leistungenVon={leistungenVon} onOeffnen={onOeffnen}>
              <ZeilenAktion text="Öffnen" betont onClick={() => onOeffnen(t.datum)} />
              {!gesperrt && t.offen && t.einsaetze[0] && (
                <>
                  <ZeilenAktion text="Bestätigen" onClick={() => onBestaetigen(t.einsaetze[0].id)} />
                  <ZeilenAktion text="Rückfrage" onClick={() => onRueckfrage(t.einsaetze[0])} />
                </>
              )}
            </PruefZeile>
          ))}
        </GruppenKopf>
      )}

      {stimmige.length > 0 && (
        <GruppenKopf sorte="stimmig" titel="Stimmig" anzahl={stimmige.length}
          aktion={gesperrt ? undefined : <ZeilenAktion text="Alle bestätigen" betont onClick={onAlleStimmigen} />}>
          <div className="flex items-center flex-wrap" style={{ gap: 10, padding: "9px 18px" }}>
            <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", minWidth: 132 }}>
              {stimmige.length} {stimmige.length === 1 ? "Tag" : "Tage"} im {MONATE[monat]}
            </span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              Gestempelte Zeit gleich Tagessoll, alle verordneten Leistungen erbracht
            </span>
            <button type="button" onClick={() => onOeffnen(stimmige[0].datum)} className="ui-fokusring cursor-pointer"
              style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
              Einzeln ansehen
            </button>
          </div>
        </GruppenKopf>
      )}

      {/* ── Fusszeile ── */}
      <div className="flex items-center flex-wrap" style={{ gap: 12, padding: "10px 18px", borderTop: "var(--border-thin) solid var(--border-default)", background: "var(--bg-secondary)" }}>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", maxWidth: "74ch" }}>
          Gerechnet aus den erfassten Einsätzen und dem Leistungsplanungsblatt · {erzeugtAm} ·
          Berichtsinhalte werden nicht ausgewertet.
        </span>
        <div className="flex items-center" style={{ gap: 12, marginLeft: "auto" }}>
          <ZeilenAktion text="Stimmt nicht" onClick={onStimmtNicht} />
          <ZeilenAktion text="Neu erzeugen" onClick={onNeuErzeugen} />
        </div>
      </div>
    </div>
  );
}

/**
 * Tage benennen — einzeln, solange man sie noch lesen kann.
 *
 * Einunddreissig Zahlen hintereinander sind keine Aufzählung mehr, sondern
 * eine Wand. Ab acht Tagen steht deshalb nur noch die Spanne.
 */
function tageBenennen(tage: Monatstag[], monat: number): string {
  if (tage.length === 0) return "";
  if (tage.length <= 8) return `${tage.map(t => `${t.nummer}.`).join(" ")} ${MONATE[monat]}`;
  return `${tage[0].nummer}. bis ${tage[tage.length - 1].nummer}. ${MONATE[monat]}`;
}

/** Kopfzeile einer Gruppe mit Marke, Titel und Zahl. */
function GruppenKopf({ sorte, titel, anzahl, aktion, children }: {
  sorte: PruefGruppe; titel: string; anzahl: number;
  aktion?: React.ReactNode; children: React.ReactNode;
}) {
  const farbe = sorte === "fehlt"
    ? { bg: "var(--status-warning-bg)", fg: "var(--status-warning-text)" }
    : sorte === "abweichung"
      ? { bg: "var(--status-info-bg)", fg: "var(--status-info)" }
      : { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" };
  return (
    <div style={{ borderTop: "var(--border-thin) solid var(--border-default)" }}>
      <div className="flex items-center" style={{ gap: 9, padding: "8px 18px" }}>
        <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: farbe.bg, color: farbe.fg }}>
          {titel}
        </span>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {anzahl} {anzahl === 1 ? "Tag" : "Tage"}
        </span>
        {aktion && <div style={{ marginLeft: "auto" }}>{aktion}</div>}
      </div>
      {children}
    </div>
  );
}

/** Eine Zeile der Gruppe „Abweichung": Datum, Sachverhalt, Vorschau, Aktionen. */
function PruefZeile({ tag, monat, gewaehlt, leistungenVon, onOeffnen, children }: {
  tag: Monatstag; monat: number; gewaehlt: boolean;
  leistungenVon: (einsatzId: string) => ErbrachteLeistung[];
  onOeffnen: (datum: string) => void;
  children: React.ReactNode;
}) {
  const gruende = tag.einsaetze.flatMap(e => leistungenVon(e.id)).map(l => l.grund).filter(g => g.trim());
  const bericht = tag.einsaetze.map(e => aktuelleFassung(e)?.text ?? "").find(t => t.trim()) ?? "";
  return (
    <div className="flex items-start flex-wrap" style={{ gap: 10, padding: "9px 18px", background: gewaehlt ? "var(--bg-secondary)" : "transparent" }}>
      <button type="button" onClick={() => onOeffnen(tag.datum)} className="ui-fokusring cursor-pointer text-left"
        style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", minWidth: 132 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>
          {tag.nummer}. {MONATE[monat]}
        </span>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginLeft: 6 }}>{WOCHENTAGE[tag.wochentag]}</span>
        <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(tag.gestempelt)} Min. gestempelt
        </div>
      </button>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: "var(--text-meta)", color: tag.abweichung > 0 ? "var(--status-info)" : "var(--status-warning-text)", fontVariantNumeric: "tabular-nums" }}>
          {tag.abweichung > 0 ? "Mehr als verordnet" : "Weniger als verordnet"}
          {" · "}{tag.abweichung > 0 ? "+" : "−"}{Math.abs(Math.round(tag.abweichung))} Min.
        </div>
        {gruende.map((g, i) => (
          <div key={i} style={{ fontSize: "var(--text-micro)", color: "var(--status-warning-text)", marginTop: 3 }}>{g}</div>
        ))}
        {/* Vorschau auf zwei Zeilen — mehr ist keine Vorschau mehr, sondern
            der Bericht an der falschen Stelle. */}
        {bericht && (
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {bericht}
          </div>
        )}
      </div>

      <div className="flex items-center" style={{ gap: 12, marginLeft: "auto" }}>{children}</div>
    </div>
  );
}

/** Textaktion in einer Zeile — keine Schaltfläche, damit die Zeile ruhig bleibt. */
function ZeilenAktion({ text, betont, onClick }: { text: string; betont?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ui-fokusring cursor-pointer"
      style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", whiteSpace: "nowrap",
        fontSize: "var(--text-micro)", fontWeight: betont ? 500 : 400,
        color: betont ? "var(--brand-primary)" : "var(--text-secondary)" }}>
      {text}
    </button>
  );
}

/**
 * Monatskalender, nach Wochentagen gerastert.
 *
 * Die Rasterung ist der eigentliche Zweck: fällt jeden Sonntag der Einsatz
 * aus, steht das in einer Spalte untereinander und nicht verteilt in einer
 * Liste.
 *
 * Jede Kachel trägt ihre Aussage im Klartext. Eine Legende unter dem Kalender
 * wäre eine zweite Stelle, an der nachzuschlagen ist — und sie wird übersehen.
 * Farbe verstärkt, was dasteht; sie ersetzt es nicht.
 */
function Monatskalender({ tage, jahr, monat, gewaehlt, hatSoll, onWaehlen }: {
  tage: Monatstag[]; jahr: number; monat: number;
  gewaehlt: string | null; hatSoll: boolean; onWaehlen: (datum: string) => void;
}) {
  const vorlauf = (new Date(jahr, monat, 1).getDay() + 6) % 7;
  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {WOCHENTAGE.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", paddingBottom: 2 }}>
            <abbr title={WOCHENTAGE_LANG[i]} style={{ textDecoration: "none" }}>{w}</abbr>
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: vorlauf }, (_, i) => <div key={`v${i}`} />)}
        {tage.map(t => <Tageskachel key={t.datum} tag={t} monat={monat} hatSoll={hatSoll}
          gewaehlt={t.datum === gewaehlt} onWaehlen={onWaehlen} />)}
      </div>
    </div>
  );
}

/** Die Aussage einer Kachel als Text — dieselbe Formulierung wie im Vorlesen. */
function tagesUrteil(t: Monatstag): string {
  if (t.fehlt) return `nicht erfasst · −${Math.round(t.soll)} Min.`;
  if (t.soll === 0) return t.einsaetze.length ? "erfasst" : "";
  if (t.abweichung === 0) return "wie verordnet";
  return `${t.abweichung < 0 ? "weniger · −" : "mehr · +"}${Math.abs(Math.round(t.abweichung))} Min.`;
}

function Tageskachel({ tag: t, monat, hatSoll, gewaehlt, onWaehlen }: {
  tag: Monatstag; monat: number; hatSoll: boolean; gewaehlt: boolean;
  onWaehlen: (datum: string) => void;
}) {
  const f = tagesFarbe(t);
  const leer = !t.fehlt && t.einsaetze.length === 0;
  const urteil = tagesUrteil(t);
  const bericht = t.einsaetze.length === 0 ? "" : t.hatBericht ? "Bericht" : "kein Bericht";
  /* Die Vorlesefassung sagt dasselbe wie die Kachel, in einem Satz. */
  const vorlesen = [
    `${t.nummer}. ${MONATE[monat]}, ${WOCHENTAGE_LANG[t.wochentag]}`,
    t.fehlt ? "kein Einsatz erfasst" : leer ? "nichts erfasst" : `${Math.round(t.ist)} von ${Math.round(t.soll)} Minuten erbracht`,
    urteil, t.periodisch > 0 ? `zusätzlich ${Math.round(t.periodisch)} Minuten periodisch` : "",
    bericht, t.einsaetze.length === 0 ? "" : t.offen ? "offen" : "geprüft",
  ].filter(Boolean).join(", ");

  return (
    <button
      type="button" onClick={() => onWaehlen(t.datum)} aria-pressed={gewaehlt} aria-label={vorlesen}
      className="ui-fokusring cursor-pointer flex flex-col"
      style={{
        gap: 1, padding: "6px 7px", minHeight: 92, borderRadius: 8, fontFamily: "inherit", textAlign: "left",
        background: f.bg,
        border: `1px solid ${gewaehlt ? "var(--brand-primary)" : f.rand}`,
        boxShadow: gewaehlt ? "0 0 0 1px var(--brand-primary)" : "none",
      }}>
      <div className="flex items-baseline" style={{ gap: 4 }}>
        <span style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: f.text, fontVariantNumeric: "tabular-nums" }}>{t.nummer}</span>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{WOCHENTAGE[t.wochentag]}</span>
        {t.einsaetze.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            {t.offen ? "offen" : "geprüft"}
          </span>
        )}
      </div>
      {leer ? null : (
        <>
          {hatSoll && !t.fehlt && (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(t.ist)} / {Math.round(t.soll)} Min.
            </span>
          )}
          {!hatSoll && !t.fehlt && (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{Math.round(t.ist)} Min.</span>
          )}
          {urteil && (
            <span style={{ fontSize: "var(--text-micro)", color: f.text, fontVariantNumeric: "tabular-nums", fontWeight: t.abweichung === 0 ? 400 : 500 }}>{urteil}</span>
          )}
          {t.periodisch > 0 && (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
              + {Math.round(t.periodisch)} Min. periodisch
            </span>
          )}
          {bericht && (
            <span style={{ fontSize: "var(--text-micro)", color: t.hatBericht ? "var(--text-secondary)" : "var(--text-tertiary)", marginTop: "auto" }}>{bericht}</span>
          )}
        </>
      )}
    </button>
  );
}

/**
 * Ein Tag im Einzelnen, über die volle Breite.
 *
 * Links, was gegen den Plan geprüft wird; rechts, was geschrieben wurde. Die
 * Trennung ist gewollt: Zahlen und Text werden unterschiedlich gelesen, und
 * der Bericht braucht eine Zeilenlänge, in der er lesbar bleibt.
 */
function Tagesansicht({
  tag, monat, positionVon, leistungenVon, hatSoll, istTaeglichePosition, gesperrt,
  vorheriger, naechster, onBlaettern, onSchliessen,
  onBestaetigen, onRueckfrage, onBericht,
}: {
  tag: Monatstag; monat: number;
  /** Monat abgeschlossen — dann wird nichts mehr angeboten, was nicht ginge. */
  gesperrt: boolean;
  positionVon: (id: string) => KLVLeistung | null;
  leistungenVon: (id: string) => ErbrachteLeistung[];
  hatSoll: boolean;
  istTaeglichePosition: (positionId: string) => boolean;
  vorheriger: Monatstag | null; naechster: Monatstag | null;
  onBlaettern: (datum: string) => void;
  onSchliessen: () => void;
  onBestaetigen: (id: string) => void;
  onRueckfrage: (e: Einsatz) => void;
  onBericht: (einsatzId: string, text: string) => void;
}) {
  const min = (n: number) => `${Math.round(n)} min`;
  const einsatz = tag.einsaetze[0] ?? null;
  const geprueft = einsatz?.pruefzustand === "geprueft";
  const urteil = tagesUrteil(tag);

  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
      {/* ── Kopfzeile ── */}
      <div className="flex items-center flex-wrap" style={{ gap: 10, padding: "11px 16px", borderBottom: "var(--border-thin) solid var(--border-default)", background: "var(--bg-secondary)" }}>
        <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>
          {tag.nummer}. {MONATE[monat]} · {WOCHENTAGE_LANG[tag.wochentag]}
        </span>
        {einsatz && (
          <>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{einsatz.von}–{einsatz.bis}</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{urheberName(einsatz.erbrachtDurch)}</span>
          </>
        )}
        {urteil && (
          <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
            background: tag.abweichung === 0 && !tag.fehlt ? "var(--bg-elevated)" : tag.abweichung > 0 ? "var(--status-info-bg)" : "var(--status-warning-bg)",
            color: tag.abweichung === 0 && !tag.fehlt ? "var(--text-secondary)" : tag.abweichung > 0 ? "var(--status-info)" : "var(--status-warning-text)" }}>
            {urteil}
          </span>
        )}
        {einsatz && (
          <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
            background: geprueft ? "var(--status-success-bg)" : "var(--bg-elevated)",
            color: geprueft ? "var(--status-success-text)" : "var(--text-secondary)" }}>
            {pruefzustandLabel(einsatz.pruefzustand)}
          </span>
        )}
        <div className="flex items-center" style={{ gap: 2, marginLeft: "auto" }}>
          <button type="button" disabled={!vorheriger} aria-label="Vorheriger Tag"
            onClick={() => vorheriger && onBlaettern(vorheriger.datum)}
            className="ui-fokusring flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", cursor: vorheriger ? "pointer" : "not-allowed", opacity: vorheriger ? 1 : 0.35, color: "var(--text-secondary)" }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <button type="button" disabled={!naechster} aria-label="Nächster Tag"
            onClick={() => naechster && onBlaettern(naechster.datum)}
            className="ui-fokusring flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", cursor: naechster ? "pointer" : "not-allowed", opacity: naechster ? 1 : 0.35, color: "var(--text-secondary)" }}>
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
          <button type="button" aria-label="Tagesansicht schliessen" onClick={onSchliessen}
            className="ui-fokusring cursor-pointer flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", color: "var(--text-secondary)" }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {!einsatz ? (
        <div style={{ padding: "16px" }}>
          <div className="inline-flex items-center" style={{ gap: 7, fontSize: "var(--text-small)", color: tag.fehlt ? "var(--status-warning-text)" : "var(--text-secondary)" }}>
            {tag.fehlt && <AlertTriangle style={{ width: 14, height: 14 }} />}
            {tag.fehlt ? "Kein Einsatz erfasst, obwohl geplant." : "Für diesen Tag ist nichts erfasst."}
          </div>
          {tag.fehlt && (
            <p style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 8, maxWidth: 620 }}>
              Verordnet waren {min(tag.soll)} aus den täglichen Positionen. Ein fehlender Tag lässt sich
              hier nicht nachtragen — das geschieht in der Erfassung.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* ── Links: erbracht gegen verordnet ── */}
          <div style={{ flex: "1 1 0", minWidth: 0, padding: "14px 16px" }}>
            {/* Drei Zeilen: was die Uhr sagt, was das Blatt sagt, die Differenz. */}
            <div className="flex flex-col" style={{ gap: 4, marginBottom: 14 }}>
              <div className="flex items-baseline" style={{ gap: 8 }}>
                <span style={{ width: 82, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Gestempelt</span>
                <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>
                  {einsatz.von} – {einsatz.bis}
                </span>
                <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                  {min(tag.gestempelt)}
                </span>
              </div>
              {hatSoll && (
                <div className="flex items-baseline" style={{ gap: 8 }}>
                  <span style={{ width: 82, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Verordnet</span>
                  <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums" }}>{min(tag.soll)} Tagessoll</span>
                  {tag.periodisch > 0 && (
                    <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                      + {min(tag.periodisch)} periodisch verordnet
                    </span>
                  )}
                </div>
              )}
              {hatSoll && (
                <div className="flex items-baseline" style={{ gap: 8 }}>
                  <span style={{ width: 82, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Abweichung</span>
                  <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums",
                    background: tag.abweichung === 0 ? "var(--bg-secondary)" : tag.abweichung > 0 ? "var(--status-info-bg)" : "var(--status-warning-bg)",
                    color: tag.abweichung === 0 ? "var(--text-secondary)" : tag.abweichung > 0 ? "var(--status-info)" : "var(--status-warning-text)" }}>
                    {tag.abweichung === 0 ? "± 0 Min." : `${tag.abweichung > 0 ? "+" : "−"}${Math.abs(Math.round(tag.abweichung))} Min.`}
                  </span>
                </div>
              )}
            </div>

            {/* Verordnete Leistungen: abgehakt oder nicht. Keine Minuten je
                Position — gestempelt wird eine Gesamtzeit, nicht je Handgriff. */}
            <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Verordnete Leistungen</div>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {tag.einsaetze.flatMap(e => leistungenVon(e.id)).map(l => {
                const pos = positionVon(l.positionId);
                const taeglich = istTaeglichePosition(l.positionId);
                return (
                  <div key={l.id}>
                    <div className="flex items-baseline" style={{ gap: 8 }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-meta)", color: l.erbracht ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                        {pos ? pos.bezeichnung : l.positionId}
                      </span>
                      {!taeglich && pos && (
                        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                          periodisch · {haeufigkeitText(pos)}
                        </span>
                      )}
                      <span style={{ fontSize: "var(--text-meta)", whiteSpace: "nowrap",
                        color: l.erbracht ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                        {l.erbracht ? "erbracht" : "nicht erbracht"}
                      </span>
                    </div>
                    {!l.erbracht && pos && (
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                        {pos.anzahl * pos.zeitMin} Min. verordnet
                      </div>
                    )}
                    {l.grund.trim() && (
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--status-warning-text)", marginTop: 3, maxWidth: 560 }}>{l.grund}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {tag.einsaetze.some(e => e.bemerkung.trim()) && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 3 }}>Prüfvermerk der Fachperson</div>
                {tag.einsaetze.filter(e => e.bemerkung.trim()).map(e => (
                  <div key={e.id} style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>{e.bemerkung}</div>
                ))}
              </div>
            )}
          </div>

          {/* ── Rechts: der Pflegebericht in einer Lesespalte ── */}
          <div style={{ flex: "1 1 0", minWidth: 0, padding: "14px 16px", borderLeft: "var(--border-thin) solid var(--border-default)", background: "var(--bg-secondary)" }}>
            <Berichtsspalte einsatz={einsatz} gesperrt={gesperrt} onBericht={onBericht} />
          </div>
        </div>
      )}

      {/* ── Fusszeile ── */}
      {einsatz && (
        <div className="flex items-center flex-wrap" style={{ gap: 14, padding: "10px 16px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          {gesperrt ? (
            <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              <Lock style={{ width: 11, height: 11 }} />
              Monat abgeschlossen · nichts an diesem Tag ist mehr änderbar
            </span>
          ) : geprueft ? (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              Geprüft · Leistungsdaten nicht mehr änderbar. Der Pflegebericht bleibt es.
            </span>
          ) : (
            <>
              <AppButton variant="sekundaer" onClick={() => onBestaetigen(einsatz.id)}>Bestätigen</AppButton>
              <button type="button" onClick={() => onRueckfrage(einsatz)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                Rückfrage stellen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Der Pflegebericht: lesen, erfassen, ändern, frühere Fassungen einsehen.
 *
 * Die Lesespalte ist auf 74 Zeichen begrenzt (`max-width: 74ch`). Darüber
 * verliert das Auge beim Zeilenwechsel den Anschluss; darunter zerfällt ein
 * Absatz in Fetzen.
 */
function Berichtsspalte({ einsatz, gesperrt, onBericht }: {
  einsatz: Einsatz;
  gesperrt: boolean;
  onBericht: (einsatzId: string, text: string) => void;
}) {
  const aktuell = aktuelleFassung(einsatz);
  const frueher = fruehereFassungen(einsatz);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [entwurf, setEntwurf] = useState("");
  const [fassungenOffen, setFassungenOffen] = useState(false);

  /* Wechselt der Einsatz unter der offenen Maske, wäre der Entwurf dem
     falschen Tag zugeordnet. Also zurücksetzen. */
  useEffect(() => { setBearbeiten(false); setFassungenOffen(false); }, [einsatz.id]);

  const oeffnen = () => { setEntwurf(aktuell?.text ?? ""); setBearbeiten(true); };
  const sichern = () => {
    if (entwurf.trim() && entwurf.trim() !== (aktuell?.text ?? "")) onBericht(einsatz.id, entwurf);
    setBearbeiten(false);
  };

  if (bearbeiten) {
    return (
      <div style={{ maxWidth: "74ch" }}>
        <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
          {aktuell ? "Pflegebericht ändern" : "Pflegebericht erfassen"}
        </div>
        <textarea
          value={entwurf} onChange={e => setEntwurf(e.target.value)} rows={8} autoFocus
          aria-label={aktuell ? "Pflegebericht ändern" : "Pflegebericht erfassen"}
          className="ui-fokusring"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, resize: "vertical",
            border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)",
            fontFamily: "inherit", fontSize: "var(--text-meta)", lineHeight: 1.6, color: "var(--text-primary)" }}
        />
        <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
          <AppButton variant="sekundaer" onClick={sichern}>Sichern</AppButton>
          <button type="button" onClick={() => setBearbeiten(false)} className="ui-fokusring cursor-pointer"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
            Verwerfen
          </button>
          <span style={{ marginLeft: "auto", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            Frühere Fassungen bleiben erhalten.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "74ch" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
        <FileText style={{ width: 13, height: 13, color: "var(--text-tertiary)" }} />
        <span style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)" }}>Pflegebericht</span>
        {aktuell && (
          <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            {einsatz.berichtFassungen[0].von} · {einsatz.berichtFassungen[0].am}
          </span>
        )}
        {!gesperrt && (
          <button type="button" onClick={oeffnen} className="ui-fokusring cursor-pointer"
            style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
            {aktuell ? "Ändern" : "Bericht erfassen"}
          </button>
        )}
      </div>

      {aktuell ? (
        <>
          {aktuell.text.split("\n").filter(a => a.trim()).map((absatz, i) => (
            <p key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", lineHeight: 1.65, margin: i === 0 ? 0 : "8px 0 0" }}>{absatz}</p>
          ))}
          {/* Nur wenn je geändert wurde — sonst behauptete die Zeile eine
              Bearbeitung, die nie stattfand. */}
          {frueher.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                Zuletzt geändert am {aktuell.am} durch {aktuell.von}
              </div>
              <button type="button" onClick={() => setFassungenOffen(o => !o)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, marginTop: 4, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
                {fassungenOffen ? "Frühere Fassungen ausblenden" : `${frueher.length} frühere ${frueher.length === 1 ? "Fassung" : "Fassungen"} anzeigen`}
              </button>
              {fassungenOffen && (
                <div className="flex flex-col" style={{ gap: 8, marginTop: 8 }}>
                  {frueher.map((f, i) => <FruehereFassung key={i} fassung={f} />)}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", margin: 0, lineHeight: 1.65 }}>
          Für diesen Einsatz wurde kein Bericht geschrieben.
        </p>
      )}
    </div>
  );
}

/** Eine frühere Fassung — lesbar, nicht bearbeitbar. */
function FruehereFassung({ fassung }: { fassung: Berichtfassung }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>
        {fassung.von} · {fassung.am}
      </div>
      {fassung.text.split("\n").filter(a => a.trim()).map((absatz, i) => (
        <p key={i} style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", lineHeight: 1.6, margin: i === 0 ? 0 : "6px 0 0" }}>{absatz}</p>
      ))}
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

function TabTickets({ tickets, navigate, personBezug }: { tickets: Ticket[]; navigate: (path: string) => void; personBezug?: { art: "angehoeriger" | "patient"; kennung: string } }) {
  // Neue Pendenz aus dem Reiter: Person vorbelegt, kein Sprung nach dem Anlegen.
  const [neuOffen, setNeuOffen] = useState(false);
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
            onClick={() => setNeuOffen(true)}
            className="ui-fokusring inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Neue Pendenz
          </button>
          <NeuePendenzDialog
            offen={neuOffen}
            onClose={() => setNeuOffen(false)}
            onErstellt={() => { setNeuOffen(false); toast("Pendenz angelegt — sichtbar in den Pendenzen"); }}
            vorbelegtePerson={personBezug ?? null}
          />
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
      kontext="patient"
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

/* ══════════════════════════════════════════
   Kopf des Leistungsplanungsblatts — Zustandskette, Wartezeit, Sperre.

   Zwei der Zustände warten auf jemanden ausserhalb des Hauses. Wie lange
   schon, steht im Protokoll: der Zeitpunkt des Wechsels IN diesen Zustand.
   ══════════════════════════════════════════ */

const WARTET_AUF: Record<string, string> = { arzt: "der Ärztin", kasse: "der Kasse" };

function LpbKopf({ v, onNeueVersion }: { v: KLVVerordnung; onNeueVersion: () => void }) {
  const gesperrt = istGesperrt(v);
  const naechster = lpbNaechster(v.status);
  const amZug = lpbAmZug(v.status);
  const tage = wartetSeitTagen(v, gegenwart());
  const [meldung, setMeldung] = useState("");

  const weiter = () => {
    if (!naechster) return;
    const grund = statusWechseln(v.id, naechster, "Maria Keller", jetztAnzeige());
    setMeldung(grund);
    if (!grund) toast(`Zustand: ${lpbStatusLabel(naechster)}`);
  };

  return (
    <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "14px 18px", marginBottom: 16 }}>
      <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          Version {v.version}
        </span>
        <span style={{ padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
          {v.art === "erst" ? "Erstabklärung" : "Folgeabklärung"}
        </span>
        <span style={{ padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
          {lpbStatusLabel(v.status)}
        </span>
        {(amZug === "arzt" || amZug === "kasse") && tage !== null && (
          <span className="inline-flex items-center" style={{ gap: 4, padding: "1px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }}>
            <Clock style={{ width: 11, height: 11 }} />
            Seit {tage} {tage === 1 ? "Tag" : "Tagen"} bei {WARTET_AUF[amZug]}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {v.beginnDatum || "—"} – {v.endDatum || "offen"}
        </span>
      </div>

      {/* Zustandskette */}
      <div className="flex items-center overflow-x-auto" style={{ gap: 0, marginBottom: gesperrt || naechster ? 12 : 0 }}>
        {LPB_ABLAUF.map((step, i) => {
          const ist = v.status === step.code;
          const vorbei = lpbRang(v.status) > i;
          return (
            <div key={step.code} className="flex items-center shrink-0">
              {i > 0 && <div style={{ width: 16, height: 2, background: vorbei ? "var(--brand-primary)" : "var(--border-default)" }} />}
              <div className="flex flex-col items-center" style={{ gap: 3, minWidth: 64 }}>
                <div style={{ width: 18, height: 18, borderRadius: "var(--radius-pill)", background: vorbei || ist ? "var(--brand-primary)" : "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(vorbei || ist) && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
                </div>
                <span style={{ fontSize: 9, color: ist ? "var(--brand-primary)" : "var(--text-tertiary)", fontWeight: ist ? "var(--weight-medium)" : "var(--weight-regular)", textAlign: "center" }}>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {gesperrt && (
        <div className="flex items-start" style={{ gap: 8, padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)", marginBottom: naechster ? 10 : 0 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
          <span className="flex-1" style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>{sperrGrund(v)}</span>
          <AppButton variant="sekundaer" icon={Plus} onClick={onNeueVersion}>Neue Version erstellen</AppButton>
        </div>
      )}
      {/* Der Zustand läuft weiter, auch wenn der Inhalt gesperrt ist — sonst
          liesse sich der Entscheid der Kasse nie eintragen. */}
      {naechster && (
        <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
          <AppButton variant="sekundaer" onClick={weiter}>Weiter zu „{lpbStatusLabel(naechster)}“</AppButton>
          {meldung && <span style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)" }}>{meldung}</span>}
        </div>
      )}

      {v.statusProtokoll.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Protokoll</div>
          <div className="flex flex-col" style={{ gap: 3 }}>
            {v.statusProtokoll.map((e, i) => (
              <div key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                {lpbStatusLabel(e.status)} · {e.person} · {e.zeitpunkt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Abgleich geplant gegen bewilligt.

   Das Blatt wird bei einer Kürzung NICHT angepasst — die Differenz bleibt
   stehen und sichtbar. Wer anpasst, erzeugt eine neue Version.
   ══════════════════════════════════════════ */
function LpbAbgleich({ v }: { v: KLVVerordnung }) {
  const kgs = useKostengutsprachen();
  const a = abgleichen(v, kgs, MANDAT_STICHTAG);

  const zeile = (label: string, wert: string, betont = false, farbe?: string) => (
    <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: "var(--text-small)", fontWeight: betont ? "var(--weight-medium)" : "var(--weight-regular)", fontVariantNumeric: "tabular-nums", color: farbe ?? "var(--text-primary)" }}>{wert}</span>
    </div>
  );

  return (
    <PSectionCard title="Geplant gegen bewilligt" icon={Shield}>
      {a.lage === "keine" || a.lage === "abgelaufen" ? (
        <>
          {zeile("Geplant", stunden(a.geplant), true)}
          <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 8, maxWidth: 560 }}>
            {a.lage === "abgelaufen"
              ? `Die Kostengutsprache dieses Mandats war bis ${a.abgelaufenAm} gültig. Ohne gültige Zusicherung gibt es keine bewilligte Menge — verglichen wird deshalb nichts.`
              : "Für dieses Mandat besteht keine gültige Kostengutsprache mit bewilligter Menge. Verglichen wird deshalb nichts."}
          </p>
        </>
      ) : (
        <>
          {zeile("Geplant", stunden(a.geplant), true)}
          {zeile("Bewilligt", stunden(a.bewilligt!), true)}
          <div style={{ borderTop: "var(--border-thin) solid var(--border-default)", marginTop: 4 }} />
          {zeile(
            "Differenz",
            `${a.differenz! >= 0 ? "+" : "−"}${Math.abs(a.differenz!).toFixed(2)} h/Wo.`,
            true,
            a.lage === "ueber" ? "var(--status-warning-text)" : "var(--text-primary)",
          )}
          {a.lage === "ueber" && (
            <div className="flex items-start" style={{ gap: 8, marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)" }}>
              <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
                Das Blatt plant {Math.abs(a.differenz!).toFixed(2)} h/Wo. mehr, als die Kasse bewilligt hat. Diese Zeit zahlt niemand. Das Blatt wird deshalb nicht angepasst — wer es anpasst, erzeugt eine neue Version.
              </span>
            </div>
          )}
        </>
      )}
    </PSectionCard>
  );
}

function TabKLV({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const klvs = useKlvVerordnungen().filter(k => k.patientId === patientId);
  /* Aktiv ist die nicht ersetzte Fassung mit der höchsten Version. */
  const current = [...klvs].filter(k => k.status !== "ersetzt").sort((a, b) => b.version - a.version)[0] || klvs[0];
  const daysUntil = current?.endDatum ? (() => { const [d, m, y] = current.endDatum!.split("."); return Math.round((new Date(+y, +m - 1, +d).getTime() - GEGENWART.getTime()) / 86400000); })() : null;
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
    verordnungEntfernen(id);
    toast("KLV-Entwurf gelöscht");
  };

  const [showNeueKLV, setShowNeueKLV] = useState(false);
  const [neuBeginn, setNeuBeginn] = useState("");
  const [neuEnde, setNeuEnde] = useState("");
  const [neuVorlage, setNeuVorlage] = useState(true);

  const handleCreateKLV = () => {
    const newId = `KLV-${Date.now()}`;
    const patientName = current?.patientName || klvs[0]?.patientName || "Patient";
    const heute = formatAnzeige(gegenwart());

    // Format dates from ISO to dd.mm.yyyy for display
    const formatDate = (iso: string) => { if (!iso) return null; const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };

    const neueKLV: KLVVerordnung = {
      id: newId,
      onboardingId: null,
      patientId,
      // Der Bestand setzt das aktive Mandat des Patienten ein.
      mandatId: null,
      patientName,
      pflegeplanungId: current?.pflegeplanungId || null,
      status: "entwurf",
      version: klvs.reduce((m, k) => Math.max(m, k.version), 0) + 1,
      art: klvs.length === 0 ? "erst" : "folge",
      statusProtokoll: [{ status: "entwurf", person: "Maria Keller", zeitpunkt: jetztAnzeige() }],
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
    verordnungAnlegen(neueKLV);

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
          <LpbKopf v={current} onNeueVersion={() => {
            const neu = neueVersionErstellen(current.id, "Maria Keller", jetztAnzeige());
            if (neu) toast(`Version ${neu.version} als Entwurf erstellt`);
          }} />
          <LpbAbgleich v={current} />
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
            <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: k.status === "entscheid_erhalten" ? "var(--status-success-bg)" : k.status === "ersetzt" ? "var(--bg-secondary)" : "var(--status-warning-bg)", color: k.status === "entscheid_erhalten" ? "var(--status-success-text)" : k.status === "ersetzt" ? "var(--text-tertiary)" : "var(--status-warning-text)" }}>V{k.version} · {lpbStatusLabel(k.status)}</span>
            {k.onboardingId && <span style={{ fontSize: "var(--text-micro)", color: "var(--status-info)" }}>aus Onboarding</span>}
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{berechneSummen(k.leistungspositionen).total.toFixed(2)} h/Wo.</span>
          </div>
          {k.status === "entwurf" && (
            <button onClick={e => deleteKLV(k.id, e)} className="cursor-pointer" title="Entwurf löschen" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 4, marginRight: 4 }} onMouseEnter={e => (e.currentTarget.style.color = "var(--status-danger)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}><Trash2 style={{ width: 14, height: 14 }} /></button>
          )}
        </div>
      ))}
    </div>
  );
}
