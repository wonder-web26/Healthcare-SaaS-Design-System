/**
 * Ordneransicht der Dokumente einer Person — Patient wie Angehörige.
 *
 * Die Ablage ist eine Organisationsvorgabe, kein Ablagebelieben: es gibt genau
 * die Ordner, für die es Dokumenttypen gibt (`ORDNER_REIHENFOLGE` in
 * stammdaten/dokumenttypen), und keine frei anlegbaren. Genau diese Struktur
 * soll die SharePoint-Ablage tragen, die beim Abschluss eines Onboardings je
 * Person angelegt wird.
 *
 * Warum diese Datei existiert: die Explorer-Oberfläche (`TabDokumenteGeneric`)
 * gab es schon, aber sie wurde bisher aus `getPatientFolders()` und
 * `getAngehoerigeFolders()` gespeist — zwei fest verdrahtete Listen, die für
 * JEDE Person dieselben erfundenen Dateien zurückgaben und weder Pflicht noch
 * Gültigkeit kannten. Die Oberfläche bleibt, die Quelle wechselt: hier kommen
 * die tatsächlich abgelegten Dokumente der Person aus dem geteilten
 * Dokumentbestand.
 *
 * Im Onboarding wird hochgeladen und gescannt; im Dossier wird nur noch
 * geblättert. Deshalb trägt diese Ansicht keine Erfassung.
 */
import { TabDokumenteGeneric, type DocFolder, type FolderDoc } from "../TabDokumente";
import { useDokumente } from "../../../lib/dokumente/store";
import { ordnerStand, type Dokument, type DokumentReferenz } from "../../../lib/dokumente/dokumente";
import { type DokumentKontext } from "../../../lib/stammdaten/dokumenttypen";

/**
 * Dateiart aus der Endung der Bezeichnung. Der Dokumentbestand führt keine
 * Dateiart — er beschreibt das Schriftstück, nicht seine Datei. Ohne erkennbare
 * Endung gilt PDF, weil eingescannte Unterlagen so abgelegt werden.
 */
function dateiArt(bezeichnung: string): FolderDoc["type"] {
  const endung = bezeichnung.split(".").pop()?.toLowerCase() ?? "";
  switch (endung) {
    case "docx": case "doc": return "DOCX";
    case "xlsx": case "xls": return "XLSX";
    case "jpg": case "jpeg": return "JPG";
    case "png": return "PNG";
    default: return "PDF";
  }
}

/** Ein abgelegtes Dokument in der Darstellung des Explorers. */
function alsDatei(d: Dokument): FolderDoc {
  return {
    id: d.id,
    name: d.bezeichnung,
    type: dateiArt(d.bezeichnung),
    // Der Bestand führt keine Fassungen; eine erfundene Nummer wäre eine
    // Behauptung. Der Strich sagt: nicht geführt.
    version: "—",
    uploadedAt: d.erfasstAm,
    uploadedBy: d.erfasstVon,
  };
}

export interface PersonDokumenteOrdnerProps {
  /** Person, deren Ablage gezeigt wird. */
  referenz: DokumentReferenz;
  /** Bestimmt, welche Dokumenttypen als Pflicht gelten. */
  kontext: DokumentKontext;
  /** Stichtag für die Gültigkeitsprüfung. */
  stichtag: Date;
  /** Wurzelordner — die Namenskonvention der Ablage, z. B. `Steiner_Hans-Rudolf`. */
  wurzel: string;
}

export function PersonDokumenteOrdner({ referenz, kontext, stichtag, wurzel }: PersonDokumenteOrdnerProps) {
  const alle = useDokumente();

  /* Jeder Ordner der Vorgabe erscheint, auch der leere — die Struktur ist der
     Punkt, nicht die Füllung. Ein Ordner, der erst auftaucht, wenn etwas darin
     liegt, verschwiege gerade das Fehlende. */
  const ordner: DocFolder[] = ordnerStand(alle, referenz, kontext, stichtag).map(o => ({
    id: o.ordner,
    label: o.ordner,
    files: o.dokumente.map(alsDatei),
  }));

  return <TabDokumenteGeneric rootLabel={wurzel} folders={ordner} nurLesen />;
}
