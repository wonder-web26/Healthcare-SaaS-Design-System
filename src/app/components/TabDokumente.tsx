import React, { useState, useCallback } from "react";
import {
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Upload,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Inbox,
  Search,
  CloudUpload,
} from "lucide-react";
import type { Patient } from "./patientData";

/* ── Types ────────────────────────────────── */
export interface FolderDoc {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "XLSX" | "JPG" | "PNG";
  version: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DocFolder {
  id: string;
  label: string;
  children?: DocFolder[];
  files: FolderDoc[];
}

/* ── Build folder structure ──────────────── */
function getPatientFolders(): DocFolder[] {
  return [
    {
      id: "personalien",
      label: "Personalien",
      files: [
        { id: "p01", name: "ID_Kopie.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
        { id: "p02", name: "Patientenstammblatt.docx", type: "DOCX", version: "2.1", uploadedAt: "15.01.2026", uploadedBy: "K. Meier" },
        { id: "p03", name: "Foto_Patient.jpg", type: "JPG", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "S. Weber" },
        { id: "p04", name: "AHV_Bestaetigung.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "sozialversicherungen",
      label: "Sozialversicherungen",
      files: [
        { id: "s01", name: "BVG_Bestaetigung.pdf", type: "PDF", version: "1.0", uploadedAt: "05.01.2026", uploadedBy: "HR-Abteilung" },
        { id: "s02", name: "UVG_Police.pdf", type: "PDF", version: "1.0", uploadedAt: "05.01.2026", uploadedBy: "HR-Abteilung" },
        { id: "s03", name: "Quellensteuer_Tarif.pdf", type: "PDF", version: "1.0", uploadedAt: "02.01.2026", uploadedBy: "System" },
        { id: "s04", name: "KTG_Antrag.pdf", type: "PDF", version: "1.0", uploadedAt: "18.02.2026", uploadedBy: "Maria Keller" },
      ],
    },
    {
      id: "verordnungen",
      label: "Verordnungen",
      children: [
        {
          id: "verordnungen_aktuell",
          label: "Aktuell",
          files: [
            { id: "v01", name: "KLV_Verordnung_2026.pdf", type: "PDF", version: "1.0", uploadedAt: "18.01.2026", uploadedBy: "Dr. M. Huber" },
            { id: "v02", name: "Aerztliche_Verordnung_Pflege.pdf", type: "PDF", version: "1.0", uploadedAt: "20.01.2026", uploadedBy: "Dr. M. Huber" },
            { id: "v03", name: "Kostengutsprache_KK.pdf", type: "PDF", version: "1.0", uploadedAt: "20.02.2026", uploadedBy: "System" },
          ],
        },
        {
          id: "verordnungen_archiv",
          label: "Archiv",
          files: [
            { id: "v04", name: "Physiotherapie_Verordnung_2025.pdf", type: "PDF", version: "1.0", uploadedAt: "15.11.2025", uploadedBy: "Dr. R. Schwarz" },
          ],
        },
      ],
      files: [],
    },
    {
      id: "anamnese",
      label: "Anamnese",
      files: [
        { id: "a01", name: "Erstassessment_Bericht.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "S. Weber" },
        { id: "a02", name: "Pflegeanamnese.docx", type: "DOCX", version: "3.0", uploadedAt: "22.02.2026", uploadedBy: "K. Meier" },
        { id: "a03", name: "Vitalzeichen_Protokoll.xlsx", type: "XLSX", version: "1.2", uploadedAt: "25.02.2026", uploadedBy: "S. Weber" },
      ],
    },
    {
      id: "atl_assessments",
      label: "ATL Assessments",
      files: [
        { id: "at01", name: "InterRai_Assessment.pdf", type: "PDF", version: "1.0", uploadedAt: "18.02.2026", uploadedBy: "Laura Brunner" },
        { id: "at02", name: "ATL_Bewertung_Feb.pdf", type: "PDF", version: "2.0", uploadedAt: "20.02.2026", uploadedBy: "S. Weber" },
      ],
    },
    {
      id: "vertraege",
      label: "Verträge",
      files: [
        { id: "vt01", name: "Pflegevertrag_Patient.pdf", type: "PDF", version: "1.0", uploadedAt: "26.02.2026", uploadedBy: "S. Weber" },
        { id: "vt02", name: "Vollmacht_Angehoerige.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
        { id: "vt03", name: "Datenschutzerklaerung.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "medizinische_unterlagen",
      label: "Medizinische Unterlagen",
      children: [
        {
          id: "med_medikamente",
          label: "Medikamente",
          files: [
            { id: "m01", name: "Medikamentenliste.xlsx", type: "XLSX", version: "3.0", uploadedAt: "25.02.2026", uploadedBy: "S. Weber" },
            { id: "m02", name: "Medikamentenplan_Arzt.pdf", type: "PDF", version: "1.0", uploadedAt: "20.01.2026", uploadedBy: "Dr. M. Huber" },
          ],
        },
        {
          id: "med_berichte",
          label: "Berichte",
          files: [
            { id: "m03", name: "Arztbericht_Feb_2026.pdf", type: "PDF", version: "1.0", uploadedAt: "22.02.2026", uploadedBy: "Dr. M. Huber" },
          ],
        },
      ],
      files: [],
    },
    {
      id: "vorsorge",
      label: "Vorsorge",
      files: [
        { id: "vs01", name: "Patientenverfuegung.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
        { id: "vs02", name: "Vorsorgeauftrag.pdf", type: "PDF", version: "1.0", uploadedAt: "12.01.2026", uploadedBy: "System" },
      ],
    },
    {
      id: "sonstige_dokumente",
      label: "Sonstige Dokumente",
      files: [
        { id: "sd01", name: "Schluessel_Quittung.pdf", type: "PDF", version: "1.0", uploadedAt: "10.02.2026", uploadedBy: "K. Meier" },
        { id: "sd02", name: "Brief_Krankenkasse_Feb.pdf", type: "PDF", version: "1.0", uploadedAt: "18.02.2026", uploadedBy: "Maria Keller" },
      ],
    },
  ];
}

/* ── Helpers ──────────────────────────────── */
function countFiles(folder: DocFolder): number {
  let count = folder.files.length;
  if (folder.children) {
    for (const child of folder.children) {
      count += countFiles(child);
    }
  }
  return count;
}

function countAllFiles(folders: DocFolder[]): number {
  return folders.reduce((sum, f) => sum + countFiles(f), 0);
}

function getFilesForFolder(folders: DocFolder[], folderId: string): FolderDoc[] {
  for (const folder of folders) {
    if (folder.id === folderId) return folder.files;
    if (folder.children) {
      const result = getFilesForFolder(folder.children, folderId);
      if (result.length > 0 || folder.children.some(c => c.id === folderId)) {
        const exact = folder.children.find(c => c.id === folderId);
        if (exact) return exact.files;
        return result;
      }
    }
  }
  return [];
}

function getFolderLabel(folders: DocFolder[], folderId: string): string {
  for (const folder of folders) {
    if (folder.id === folderId) return folder.label;
    if (folder.children) {
      const result = getFolderLabel(folder.children, folderId);
      if (result) return result;
    }
  }
  return "";
}

function fileIcon(type: string) {
  switch (type) {
    case "PDF":
      return { Icon: FileText, bg: "bg-error-light", color: "text-error" };
    case "DOCX":
      return { Icon: File, bg: "bg-info-light", color: "text-info" };
    case "XLSX":
      return { Icon: FileSpreadsheet, bg: "bg-success-light", color: "text-success" };
    case "JPG":
    case "PNG":
      return { Icon: ImageIcon, bg: "bg-warning-light", color: "text-warning" };
    default:
      return { Icon: FileText, bg: "bg-muted", color: "text-muted-foreground" };
  }
}

/* ── Folder Tree Item ────────────────────── */
function FolderTreeItem({
  folder,
  activeFolder,
  setActiveFolder,
  depth = 0,
}: {
  folder: DocFolder;
  activeFolder: string;
  setActiveFolder: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isActive = activeFolder === folder.id;
  const fileCount = countFiles(folder);

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
      // If folder itself has no files but has children, select first child
      if (folder.files.length === 0 && folder.children && folder.children.length > 0 && !expanded) {
        setActiveFolder(folder.children[0].id);
      } else {
        setActiveFolder(folder.id);
      }
    } else {
      setActiveFolder(folder.id);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-xl text-left transition-all ${
          isActive
            ? "bg-primary-light ring-1 ring-primary/15"
            : "hover:bg-muted/40"
        }`}
        style={{ paddingLeft: `${depth * 16 + 10}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {isActive ? (
          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
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
          className={`text-[10px] px-[5px] py-[1px] rounded-md shrink-0 ${
            isActive
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
          style={{ fontWeight: 600 }}
        >
          {fileCount}
        </span>
      </button>
      {expanded && hasChildren && (
        <div className="mt-0.5 space-y-0.5">
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              activeFolder={activeFolder}
              setActiveFolder={setActiveFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: DOKUMENTE (SharePoint File Manager)
   ══════════════════════════════════════════ */
export function TabDokumente({ patient }: { patient: Patient }) {
  const folders = getPatientFolders();
  const totalFiles = countAllFiles(folders);
  const [activeFolder, setActiveFolder] = useState(folders[0]?.id ?? "");
  const [expandedRoot, setExpandedRoot] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const files = getFilesForFolder(folders, activeFolder);
  const folderLabel = getFolderLabel(folders, activeFolder);

  const filteredFiles = searchQuery
    ? files.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Drop handling would go here
  }, []);

  return (
    <div className="space-y-0">
      {/* ── Header Bar ───────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
            <CloudUpload className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h5 className="text-foreground">Dokumentenablage</h5>
            <p className="text-[11px] text-muted-foreground">
              {totalFiles} Dateien · {folders.length} Ordner
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Upload className="w-3.5 h-3.5" />
          Dokument hochladen
        </button>
      </div>

      {/* ── Split layout ─────────────────── */}
      <div className="flex gap-4 items-start">
        {/* ── Left: Folder tree ──────── */}
        <div className="w-[260px] shrink-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light bg-muted/20">
              <span
                className="text-[11px] text-muted-foreground uppercase tracking-wider"
                style={{ fontWeight: 500 }}
              >
                Ordnerstruktur
              </span>
            </div>
            <div className="p-2">
              {/* Root folder */}
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
                <span
                  className="text-[13px] text-foreground truncate"
                  style={{ fontWeight: 500 }}
                >
                  {patient.nachname}_{patient.vorname}
                </span>
              </button>

              {/* Subfolders */}
              {expandedRoot && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {folders.map((folder) => (
                    <FolderTreeItem
                      key={folder.id}
                      folder={folder}
                      activeFolder={activeFolder}
                      setActiveFolder={setActiveFolder}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: File list ───────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Folder header with search */}
            <div className="px-5 py-3 border-b border-border-light bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                  {folderLabel || "—"}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {filteredFiles.length} Datei{filteredFiles.length !== 1 ? "en" : ""}
                </span>
              </div>
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suchen…"
                  className="pl-8 pr-3 py-[5px] text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all w-[180px]"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>

            {/* Drag & drop area or table */}
            {filteredFiles.length === 0 ? (
              <div
                className={`px-5 py-14 text-center transition-colors ${
                  dragOver ? "bg-primary/[0.03]" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`w-full py-10 rounded-xl border-2 border-dashed transition-colors ${
                  dragOver ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    {searchQuery ? "Keine Ergebnisse" : "Noch keine Dokumente vorhanden"}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 max-w-[300px] mx-auto">
                    {searchQuery
                      ? "Passen Sie Ihre Suche an oder wählen Sie einen anderen Ordner."
                      : "Ziehen Sie Dateien hierher oder nutzen Sie den Upload-Button."}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`relative transition-colors ${
                  dragOver ? "bg-primary/[0.02]" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Drag overlay */}
                {dragOver && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/[0.04] border-2 border-dashed border-primary/30 rounded-xl m-2 pointer-events-none">
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-primary mx-auto mb-1.5" />
                      <p className="text-[13px] text-primary" style={{ fontWeight: 500 }}>
                        Datei hier ablegen
                      </p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/20">
                        {["Dokumentname", "Version", "Hochgeladen am", "Hochgeladen von", "Aktion"].map(
                          (col) => (
                            <th key={col} className={`px-4 py-2.5 text-left ${col === "Aktion" ? "w-[80px]" : ""}`}>
                              <span
                                className="text-[10.5px] text-muted-foreground uppercase tracking-wider"
                                style={{ fontWeight: 500 }}
                              >
                                {col}
                              </span>
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const fi = fileIcon(file.type);
                        return (
                          <tr
                            key={file.id}
                            className="border-t border-border-light hover:bg-primary/[0.02] transition-colors group"
                          >
                            {/* Dokumentname */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fi.bg}`}
                                >
                                  <fi.Icon className={`w-4 h-4 ${fi.color}`} />
                                </div>
                                <div className="min-w-0">
                                  <span
                                    className="text-[13px] text-foreground group-hover:text-primary transition-colors truncate block"
                                    style={{ fontWeight: 450 }}
                                  >
                                    {file.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase">
                                    {file.type}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Version */}
                            <td className="px-4 py-3">
                              <span
                                className="text-[12px] text-muted-foreground"
                              >
                                v{file.version}
                              </span>
                            </td>

                            {/* Hochgeladen am */}
                            <td className="px-4 py-3 text-[12px] text-muted-foreground">
                              {file.uploadedAt}
                            </td>

                            {/* Hochgeladen von */}
                            <td className="px-4 py-3 text-[12px] text-muted-foreground">
                              {file.uploadedBy}
                            </td>

                            {/* Aktion */}
                            <td className="px-4 py-3">
                              <button
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-primary hover:bg-primary-light transition-colors opacity-0 group-hover:opacity-100"
                                style={{ fontWeight: 500 }}
                                title="Herunterladen"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Drag & drop hint */}
          {filteredFiles.length > 0 && (
            <div className="mt-3 text-center">
              <p className="text-[11px] text-muted-foreground/60">
                Dateien per Drag &amp; Drop in diesen Ordner hochladen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GENERIC VERSION — reusable for any entity
   ══════════════════════════════════════════ */
export function TabDokumenteGeneric({
  rootLabel,
  folders: foldersProp,
}: {
  rootLabel: string;
  folders: DocFolder[];
}) {
  const folders = foldersProp;
  const totalFiles = countAllFiles(folders);
  const [activeFolder, setActiveFolder] = useState(folders[0]?.id ?? "");
  const [expandedRoot, setExpandedRoot] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const files = getFilesForFolder(folders, activeFolder);
  const folderLabel = getFolderLabel(folders, activeFolder);

  const filteredFiles = searchQuery
    ? files.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
            <CloudUpload className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h5 className="text-foreground">Dokumentenablage</h5>
            <p className="text-[11px] text-muted-foreground">
              {totalFiles} Dateien · {folders.length} Ordner
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Upload className="w-3.5 h-3.5" />
          Dokument hochladen
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="w-[260px] shrink-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Ordnerstruktur
              </span>
            </div>
            <div className="p-2">
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
                  {rootLabel}
                </span>
              </button>
              {expandedRoot && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {folders.map((folder) => (
                    <FolderTreeItem
                      key={folder.id}
                      folder={folder}
                      activeFolder={activeFolder}
                      setActiveFolder={setActiveFolder}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border-light bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                  {folderLabel || "—"}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {filteredFiles.length} Datei{filteredFiles.length !== 1 ? "en" : ""}
                </span>
              </div>
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suchen…"
                  className="pl-8 pr-3 py-[5px] text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all w-[180px]"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div
                className={`px-5 py-14 text-center transition-colors ${dragOver ? "bg-primary/[0.03]" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`w-full py-10 rounded-xl border-2 border-dashed transition-colors ${dragOver ? "border-primary/40 bg-primary/[0.02]" : "border-border"}`}>
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    {searchQuery ? "Keine Ergebnisse" : "Noch keine Dokumente vorhanden"}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 max-w-[300px] mx-auto">
                    {searchQuery
                      ? "Passen Sie Ihre Suche an oder wählen Sie einen anderen Ordner."
                      : "Ziehen Sie Dateien hierher oder nutzen Sie den Upload-Button."}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`relative transition-colors ${dragOver ? "bg-primary/[0.02]" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {dragOver && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/[0.04] border-2 border-dashed border-primary/30 rounded-xl m-2 pointer-events-none">
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-primary mx-auto mb-1.5" />
                      <p className="text-[13px] text-primary" style={{ fontWeight: 500 }}>Datei hier ablegen</p>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/20">
                        {["Dokumentname", "Version", "Hochgeladen am", "Hochgeladen von", "Aktion"].map((col) => (
                          <th key={col} className={`px-4 py-2.5 text-left ${col === "Aktion" ? "w-[80px]" : ""}`}>
                            <span className="text-[10.5px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const fi = fileIcon(file.type);
                        return (
                          <tr key={file.id} className="border-t border-border-light hover:bg-primary/[0.02] transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fi.bg}`}>
                                  <fi.Icon className={`w-4 h-4 ${fi.color}`} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[13px] text-foreground group-hover:text-primary transition-colors truncate block" style={{ fontWeight: 450 }}>{file.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{file.type}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><span className="text-[12px] text-muted-foreground">v{file.version}</span></td>
                            <td className="px-4 py-3 text-[12px] text-muted-foreground">{file.uploadedAt}</td>
                            <td className="px-4 py-3 text-[12px] text-muted-foreground">{file.uploadedBy}</td>
                            <td className="px-4 py-3">
                              <button className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-primary hover:bg-primary-light transition-colors opacity-0 group-hover:opacity-100" style={{ fontWeight: 500 }} title="Herunterladen">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {filteredFiles.length > 0 && (
            <div className="mt-3 text-center">
              <p className="text-[11px] text-muted-foreground/60">
                Dateien per Drag &amp; Drop in diesen Ordner hochladen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}