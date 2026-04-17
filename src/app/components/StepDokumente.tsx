import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FileText,
  Upload,
  Folder,
  FolderOpen,
  CloudUpload,
  Download,
  Inbox,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES  (kept for OnboardingPage compat)
   ══════════════════════════════════════════ */
interface ScannedDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  capturedAt: string;
  pdfStatus: "converting" | "saved" | "synced";
  sharePointPath: string;
}

export interface DokumenteFormData {
  documents: Record<string, ScannedDocument | null>;
  sharePointSynced: boolean;
  folderStructureConfirmed: boolean;
}

export const emptyDokumenteForm: DokumenteFormData = {
  documents: {
    aerztliche_verordnung: null,
    kostengutsprache: null,
    pflegevertrag: null,
    patientenverfuegung: null,
    ausweis_patient: null,
    ausweis_angehoeriger: null,
    vollmacht: null,
    krankenkassenkarte: null,
    versicherungsnachweis: null,
    lohnabtretung: null,
    sozialamt_gutsprache: null,
  },
  sharePointSynced: false,
  folderStructureConfirmed: false,
};

/* ══════════════════════════════════════════
   FOLDER / DOCUMENT DEFINITIONS
   ══════════════════════════════════════════ */
interface DocEntry {
  id: string;
  label: string;
  pflicht: boolean;
  status: "fehlend" | "ausstehend" | "hochgeladen";
  dateiname: string;
  groesse: string;
}

interface FolderDef {
  id: string;
  label: string;
  docs: DocEntry[];
}

const folderDefs: FolderDef[] = [
  {
    id: "01",
    label: "01_Identitaet",
    docs: [
      { id: "d01", label: "Pass oder ID", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d02", label: "Ausländerausweis", pflicht: false, status: "ausstehend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "02",
    label: "02_Vereinbarung",
    docs: [
      { id: "d03", label: "Pflegevertrag", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d04", label: "Leistungsvereinbarung", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d05", label: "Datenschutzerklärung", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d06", label: "Vollmacht / Vertretung", pflicht: false, status: "ausstehend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "03",
    label: "03_Medikamente_Mittel",
    docs: [
      { id: "d07", label: "Medikamentenliste", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d08", label: "Ärztliche Verordnung", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "04",
    label: "04_Schluessel",
    docs: [
      { id: "d09", label: "Schlüsselquittung", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "05",
    label: "05_Verfuegbarkeit",
    docs: [
      { id: "d10", label: "Einsatzplanung", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d11", label: "Kostengutsprache", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "06",
    label: "06_Aufsicht_Beschwerde",
    docs: [
      { id: "d12", label: "Aufsichtsprotokoll", pflicht: false, status: "ausstehend", dateiname: "—", groesse: "—" },
      { id: "d13", label: "Beschwerdeformular", pflicht: false, status: "ausstehend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "07",
    label: "07_Einwilligung",
    docs: [
      { id: "d14", label: "Einwilligung Datenverarbeitung", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d15", label: "Patientenverfügung", pflicht: false, status: "ausstehend", dateiname: "—", groesse: "—" },
    ],
  },
  {
    id: "08",
    label: "08_Sonstiges",
    docs: [
      { id: "d16", label: "Krankenkassenkarte", pflicht: true, status: "fehlend", dateiname: "—", groesse: "—" },
      { id: "d17", label: "Zusatzversicherungsnachweis", pflicht: false, status: "ausstehend", dateiname: "—", groesse: "—" },
    ],
  },
];

const totalDocs = folderDefs.reduce((s, f) => s + f.docs.length, 0);

/* ══════════════════════════════════════════
   STATUS / PFLICHT CHIPS
   ══════════════════════════════════════════ */
function StatusChip({ status }: { status: DocEntry["status"] }) {
  const map = {
    fehlend: { label: "Fehlend", cls: "bg-error-light text-error-foreground" },
    ausstehend: { label: "Ausstehend", cls: "bg-warning-light text-warning-foreground" },
    hochgeladen: { label: "Hochgeladen", cls: "bg-success-light text-success-foreground" },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-[2px] rounded-md text-[10.5px] ${s.cls}`}
      style={{ fontWeight: 500 }}
    >
      {s.label}
    </span>
  );
}

function PflichtChip({ pflicht }: { pflicht: boolean }) {
  return pflicht ? (
    <span
      className="inline-flex items-center px-2 py-[2px] rounded-md text-[10.5px] bg-primary-light text-primary"
      style={{ fontWeight: 500 }}
    >
      Pflicht
    </span>
  ) : (
    <span
      className="inline-flex items-center px-2 py-[2px] rounded-md text-[10.5px] bg-muted text-muted-foreground"
      style={{ fontWeight: 500 }}
    >
      Optional
    </span>
  );
}

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */
interface StepDokumenteProps {
  data: DokumenteFormData;
  onChange: (data: DokumenteFormData) => void;
  onValidityChange?: (isValid: boolean) => void;
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StepDokumente({ data, onChange, onValidityChange }: StepDokumenteProps) {
  const [activeFolder, setActiveFolder] = useState(folderDefs[0].id);
  const [expandedRoot, setExpandedRoot] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  /* Track which docs have been "uploaded" via local state overlay */
  const [uploaded, setUploaded] = useState<Set<string>>(new Set());

  const uploadedCount = uploaded.size;

  /* Validity: all Pflicht docs uploaded */
  const pflichtIds = folderDefs.flatMap((f) => f.docs.filter((d) => d.pflicht).map((d) => d.id));
  const allPflichtDone = pflichtIds.every((id) => uploaded.has(id));

  useEffect(() => {
    onValidityChange?.(allPflichtDone);
  }, [allPflichtDone, onValidityChange]);

  const currentFolder = folderDefs.find((f) => f.id === activeFolder)!;

  /* Resolve effective status for a doc (local upload overrides) */
  const effectiveStatus = useCallback(
    (doc: DocEntry): DocEntry["status"] => {
      if (uploaded.has(doc.id)) return "hochgeladen";
      return doc.status;
    },
    [uploaded]
  );

  /* Count uploaded per folder */
  const folderUploadCount = (f: FolderDef) => f.docs.filter((d) => uploaded.has(d.id)).length;

  /* Simulate uploading a single doc */
  const simulateUpload = (docId: string) => {
    setUploaded((prev) => new Set(prev).add(docId));
  };

  /* Drag & drop handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      /* Simulate: mark first fehlend doc in current folder as uploaded */
      const first = currentFolder.docs.find((d) => !uploaded.has(d.id));
      if (first) simulateUpload(first.id);
    },
    [currentFolder, uploaded]
  );

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                allPflichtDone ? "bg-success-light" : "bg-primary-light"
              }`}
            >
              {allPflichtDone ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <CloudUpload className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-foreground">SharePoint Dokumentenablage</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {uploadedCount} von {totalDocs} Dokumenten hochgeladen · {folderDefs.length} Ordner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[12px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground"
              style={{ fontWeight: 500 }}
            >
              Schritt 3
            </span>
            <span
              className={`text-[12px] px-2.5 py-1 rounded-lg tabular-nums ${
                allPflichtDone
                  ? "bg-success-light text-success-foreground"
                  : "bg-primary-light text-primary"
              }`}
              style={{ fontWeight: 600 }}
            >
              {uploadedCount}/{totalDocs}
            </span>
          </div>
        </div>
      </div>

      {/* ── Split Layout ─────────────────── */}
      <div className="flex gap-4 items-start">
        {/* ── Left: Folder Tree ──────── */}
        <div className="w-[260px] shrink-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light bg-muted/20">
              <span
                className="text-[10.5px] text-muted-foreground uppercase tracking-wider"
                style={{ fontWeight: 500 }}
              >
                Ordnerstruktur
              </span>
            </div>

            <div className="p-2">
              {/* Root */}
              <button
                onClick={() => setExpandedRoot(!expandedRoot)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left"
              >
                {expandedRoot ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                  Patient_Neu
                </span>
              </button>

              {/* Subfolders */}
              {expandedRoot && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {folderDefs.map((folder) => {
                    const isActive = activeFolder === folder.id;
                    const upCount = folderUploadCount(folder);
                    const total = folder.docs.length;
                    const allDone = upCount === total;

                    return (
                      <button
                        key={folder.id}
                        onClick={() => setActiveFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-xl text-left transition-all ${
                          isActive
                            ? "bg-primary-light ring-1 ring-primary/15"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {isActive ? (
                          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Folder
                            className={`w-4 h-4 shrink-0 ${
                              allDone ? "text-success" : "text-muted-foreground"
                            }`}
                          />
                        )}
                        <span
                          className={`text-[12px] truncate flex-1 ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                          style={{ fontWeight: isActive ? 500 : 400 }}
                        >
                          {folder.label}
                        </span>
                        <span
                          className={`text-[10px] px-[6px] py-[2px] rounded-md tabular-nums shrink-0 ${
                            allDone
                              ? "bg-success-light text-success-foreground"
                              : isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {upCount}/{total}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Content Panel ───── */}
        <div className="flex-1 min-w-0">
          <div
            className={`bg-card rounded-2xl border overflow-hidden transition-colors ${
              dragOver ? "border-primary/40" : "border-border"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Folder header */}
            <div className="px-5 py-3 border-b border-border-light bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  {currentFolder.label}
                </span>
                <span
                  className="text-[10px] px-1.5 py-[2px] rounded-md bg-primary-light text-primary shrink-0"
                  style={{ fontWeight: 500 }}
                >
                  SharePoint
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-muted-foreground">
                  {folderUploadCount(currentFolder)} von {currentFolder.docs.length} hochgeladen
                </span>
                <button
                  onClick={() => {
                    const first = currentFolder.docs.find((d) => !uploaded.has(d.id));
                    if (first) simulateUpload(first.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-[5px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Dokument hochladen
                </button>
              </div>
            </div>

            {/* Drag overlay */}
            {dragOver && (
              <div className="px-5 py-6 text-center border-b border-primary/20 bg-primary/[0.03]">
                <Upload className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-[12px] text-primary" style={{ fontWeight: 500 }}>
                  Datei hier ablegen zum Hochladen
                </p>
              </div>
            )}

            {/* Table */}
            {currentFolder.docs.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  Keine Dokumente in diesem Ordner
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/20">
                      {["Dokument", "Pflicht", "Status", "Dateiname", "Grösse"].map((col) => (
                        <th key={col} className="px-4 py-2.5 text-left">
                          <span
                            className="text-[10.5px] text-muted-foreground uppercase tracking-wider"
                            style={{ fontWeight: 500 }}
                          >
                            {col}
                          </span>
                        </th>
                      ))}
                      <th className="w-[60px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {currentFolder.docs.map((doc) => {
                      const status = effectiveStatus(doc);
                      const isUploaded = status === "hochgeladen";

                      return (
                        <tr
                          key={doc.id}
                          className="border-t border-border-light hover:bg-primary/[0.015] transition-colors group"
                        >
                          {/* Dokument */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isUploaded ? "bg-success-light" : "bg-muted"
                                }`}
                              >
                                <FileText
                                  className={`w-4 h-4 ${
                                    isUploaded ? "text-success" : "text-muted-foreground"
                                  }`}
                                />
                              </div>
                              <span
                                className="text-[13px] text-foreground"
                                style={{ fontWeight: 450 }}
                              >
                                {doc.label}
                              </span>
                            </div>
                          </td>

                          {/* Pflicht */}
                          <td className="px-4 py-3">
                            <PflichtChip pflicht={doc.pflicht} />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <StatusChip status={status} />
                          </td>

                          {/* Dateiname */}
                          <td className="px-4 py-3 text-[12px] text-muted-foreground">
                            {isUploaded ? (
                              <span className="text-foreground" style={{ fontWeight: 450 }}>
                                {doc.label.replace(/[\s\/]/g, "_")}.pdf
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Grösse */}
                          <td className="px-4 py-3 text-[12px] text-muted-foreground">
                            {isUploaded ? `${(Math.random() * 2 + 0.3).toFixed(1)} MB` : "—"}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3">
                            {isUploaded ? (
                              <button
                                className="p-1.5 rounded-lg hover:bg-primary-light transition-colors opacity-0 group-hover:opacity-100"
                                title="Herunterladen"
                              >
                                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            ) : (
                              <button
                                onClick={() => simulateUpload(doc.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-primary hover:bg-primary-light transition-colors opacity-0 group-hover:opacity-100"
                                style={{ fontWeight: 500 }}
                              >
                                <Upload className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Drag hint */}
          <div className="mt-2.5 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              Dateien per Drag &amp; Drop in diesen Ordner hochladen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
