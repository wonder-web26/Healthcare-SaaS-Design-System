/**
 * Anamnese — Biometrie, Hilfsmittel und die Anamnese-Einträge eines Patienten.
 *
 * Die Werte standen bis hierher als lokaler Zustand im Seitencode: bei jedem
 * Patienten dieselben 172 cm und 84 kg, dieselben drei Hilfsmittel, derselbe
 * Anamnesetext — und beim Ansichtswechsel verloren.
 *
 * Gebaut nach dem Vorbild von lib/wunden/store.ts, dem jüngsten der drei
 * Bestandsmuster im Baum: ein Bestand-Objekt mit mehreren Listen, ein
 * Abonnement für alles, Kennungen aus der einen Gegenwart.
 *
 * ALLERGIEN GEHÖREN NICHT HIERHER. Sie stehen im Unverträglichkeitsbestand
 * (lib/medikation/store.ts), weil sie auch dann gelten, wenn kein Arzneimittel
 * verordnet ist. Ein zweiter Ort dafür wäre ein zweiter Wahrheitsanspruch.
 *
 * KEIN LÖSCHWEG FÜR ANAMNESE-EINTRÄGE. Ein Eintrag, der falsch ist, wird
 * durch einen neuen richtiggestellt; sein Verschwinden aus einer Anamnese
 * wäre selbst eine Aussage, und zwar eine falsche — dieselbe Überlegung wie
 * bei der Vorgeschichte. Hilfsmittel dürfen weg: dass ein Rollator nicht mehr
 * gebraucht wird, ist keine Aussage über die Vergangenheit.
 */
import { useSyncExternalStore } from "react";
import { GEGENWART } from "../gegenwart";

export interface Biometrie {
  id: string;
  patientId: string;
  /** Zentimeter; 0 heisst nicht erfasst. */
  groesse: number;
  /** Kilogramm; 0 heisst nicht erfasst. */
  gewicht: number;
}

export interface Hilfsmittel {
  id: string;
  patientId: string;
  bezeichnung: string;
  detail: string;
}

export interface Anamneseeintrag {
  id: string;
  patientId: string;
  text: string;
  /** TT.MM.JJJJ, aus GEGENWART gesetzt. */
  datum: string;
  autor: string;
}

interface Bestand {
  biometrie: Biometrie[];
  hilfsmittel: Hilfsmittel[];
  eintraege: Anamneseeintrag[];
}

/**
 * Startbestand — nur Herr Steiner, wie die Vorgeschichte es hält.
 *
 * Übernommen sind die Werte, die im Seitencode standen. NICHT übernommen ist
 * der Anamnesetext: er war eine Vorlage mit dem fest eingesetzten Geburtsjahr
 * 1958 und hätte Herrn Steiner (geboren 1948) als 68-Jährigen ausgewiesen.
 * Ein erfundenes Alter in eine Anamnese zu schreiben wäre schlimmer, als
 * keine zu haben.
 */
let bestand: Bestand = {
  biometrie: [
    { id: "AN-2026-0001", patientId: "P-2026-0041", groesse: 172, gewicht: 84 },
  ],
  hilfsmittel: [
    { id: "AN-2026-0002", patientId: "P-2026-0041", bezeichnung: "Brille", detail: "Lesen & Fernsicht" },
    { id: "AN-2026-0003", patientId: "P-2026-0041", bezeichnung: "Hörgerät rechts", detail: "Seit 2021" },
    { id: "AN-2026-0004", patientId: "P-2026-0041", bezeichnung: "Rollator", detail: "Innenbereich" },
  ],
  eintraege: [],
};

const hoerer = new Set<() => void>();

function setzeBestand(neu: Bestand): void {
  bestand = neu;
  hoerer.forEach(l => l());
}

function abonnieren(l: () => void): () => void {
  hoerer.add(l);
  return () => { hoerer.delete(l); };
}

const schnappschuss = () => bestand;

/** Alles zu einem Patienten auf einmal — die Ansicht braucht alle drei Listen. */
export function useAnamnese(patientId: string): {
  biometrie: Biometrie | null;
  hilfsmittel: Hilfsmittel[];
  eintraege: Anamneseeintrag[];
} {
  const b = useSyncExternalStore(abonnieren, schnappschuss, schnappschuss);
  return {
    biometrie: b.biometrie.find(x => x.patientId === patientId) ?? null,
    hilfsmittel: b.hilfsmittel.filter(x => x.patientId === patientId),
    /* Jüngster Eintrag zuoberst — die Ansicht zeigt ihn ausgeklappt. */
    eintraege: b.eintraege.filter(x => x.patientId === patientId),
  };
}

/**
 * AN-JJJJ-NNNN, fortlaufend über alle drei Listen.
 *
 * Eine Zählung und nicht drei: die Kennung trägt kein Merkmal der Liste, also
 * dürfen sich zwei Einträge verschiedener Listen keine teilen.
 */
function naechsteKennung(b: Bestand): string {
  const jahr = GEGENWART.getFullYear();
  const alle = [...b.biometrie, ...b.hilfsmittel, ...b.eintraege];
  const hoechste = alle.reduce((max, e) => {
    const m = new RegExp(`^AN-${jahr}-(\\d+)$`).exec(e.id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `AN-${jahr}-${String(hoechste + 1).padStart(4, "0")}`;
}

/** Das Datum, mit dem ein Eintrag entsteht — aus der einen Gegenwart. */
export function anamneseDatum(): string {
  const zz = (n: number) => String(n).padStart(2, "0");
  return `${zz(GEGENWART.getDate())}.${zz(GEGENWART.getMonth() + 1)}.${GEGENWART.getFullYear()}`;
}

/** Grösse und Gewicht setzen; legt den Datensatz an, wo noch keiner besteht. */
export function biometrieSichern(patientId: string, groesse: number, gewicht: number): void {
  const vorhanden = bestand.biometrie.find(x => x.patientId === patientId);
  setzeBestand({
    ...bestand,
    biometrie: vorhanden
      ? bestand.biometrie.map(x => (x.patientId === patientId ? { ...x, groesse, gewicht } : x))
      : [...bestand.biometrie, { id: naechsteKennung(bestand), patientId, groesse, gewicht }],
  });
}

/** Anlegen bei leerer Kennung, sonst ändern. */
export function hilfsmittelSichern(eingabe: Hilfsmittel): void {
  setzeBestand({
    ...bestand,
    hilfsmittel: eingabe.id
      ? bestand.hilfsmittel.map(x => (x.id === eingabe.id ? eingabe : x))
      : [...bestand.hilfsmittel, { ...eingabe, id: naechsteKennung(bestand) }],
  });
}

export function hilfsmittelEntfernen(id: string): void {
  setzeBestand({ ...bestand, hilfsmittel: bestand.hilfsmittel.filter(x => x.id !== id) });
}

/**
 * Einen Anamnese-Eintrag anlegen oder seinen Text richtigstellen.
 *
 * Datum und Autor entstehen beim Anlegen und bleiben danach stehen: sie sagen,
 * wer wann erhoben hat, nicht wer zuletzt getippt hat.
 */
export function anamneseeintragSichern(eingabe: Anamneseeintrag): void {
  setzeBestand({
    ...bestand,
    eintraege: eingabe.id
      ? bestand.eintraege.map(x => (x.id === eingabe.id ? eingabe : x))
      : [{ ...eingabe, id: naechsteKennung(bestand) }, ...bestand.eintraege],
  });
}
