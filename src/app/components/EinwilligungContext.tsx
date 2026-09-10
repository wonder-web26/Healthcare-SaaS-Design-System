/**
 * EinwilligungContext — Single source of truth for the Einwilligungserklärung status.
 *
 * Ein Unterschrift-Dokument hat zwei gleichwertige Wege zum Abschluss:
 *   1. E-Signatur (digital)
 *   2. Scan/Upload der unterschriebenen Papierfassung
 *
 * JE DOKUMENT EIN ZUSTAND. Vorher trug der Kontext genau EINEN Status, weil es
 * genau ein Unterschrift-Dokument gab (die Einwilligung für die Arzt-Anfrage).
 * Mit einem zweiten — der Datenschutz- und Einwilligungserklärung — hätte das
 * Signieren des einen auch das andere als erledigt gezeigt. Der Zustand hängt
 * jetzt am Dokumentcode.
 *
 * `status`, `signDigital` und `signScan` ohne Code meinen weiterhin die
 * Arzt-Einwilligung (`patient_einwilligung`). Der Arzt-Anfrage-Fluss liest sie
 * so und bleibt unverändert.
 *
 * Lead-Conversion-Muster: carries onboardingId + patientId.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type EinwilligungHerkunft = "digital" | "scan";

export interface EinwilligungStatus {
  signiert: boolean;
  herkunft: EinwilligungHerkunft | null;
  datum: string | null;
  /** Lead-Conversion IDs */
  onboardingId: string | null;
  patientId: string | null;
}

/** Der Dokumentcode, den die Arzt-Anfrage meint. */
export const ARZT_EINWILLIGUNG = "patient_einwilligung";

interface EinwilligungContextValue {
  /** Zustand der Arzt-Einwilligung — der bisherige, unveränderte Weg. */
  status: EinwilligungStatus;
  signDigital: (datum: string) => void;
  signScan: (datum: string) => void;
  /** Zustand eines beliebigen Unterschrift-Dokuments. */
  statusVon: (code: string) => EinwilligungStatus;
  signDigitalFuer: (code: string, datum: string) => void;
  signScanFuer: (code: string, datum: string) => void;
}

const EinwilligungCtx = createContext<EinwilligungContextValue | null>(null);

export function useEinwilligung(): EinwilligungContextValue {
  const ctx = useContext(EinwilligungCtx);
  if (!ctx) throw new Error("useEinwilligung must be used within EinwilligungProvider");
  return ctx;
}

export function EinwilligungProvider({
  onboardingId,
  patientId,
  children,
}: {
  onboardingId: string | null;
  patientId: string | null;
  children: ReactNode;
}) {
  const [staende, setStaende] = useState<Record<string, EinwilligungStatus>>({});

  const leer = useCallback((): EinwilligungStatus => ({
    signiert: false, herkunft: null, datum: null, onboardingId, patientId,
  }), [onboardingId, patientId]);

  const statusVon = useCallback(
    (code: string): EinwilligungStatus => staende[code] ?? leer(),
    [staende, leer],
  );

  /* Einmal unterschrieben bleibt unterschrieben — ein zweiter Aufruf ändert
     Herkunft und Datum nicht mehr. Das war schon so und bleibt. */
  const setze = useCallback((code: string, herkunft: EinwilligungHerkunft, datum: string) => {
    setStaende(prev => prev[code]?.signiert
      ? prev
      : { ...prev, [code]: { signiert: true, herkunft, datum, onboardingId, patientId } });
  }, [onboardingId, patientId]);

  const signDigitalFuer = useCallback((code: string, datum: string) => setze(code, "digital", datum), [setze]);
  const signScanFuer = useCallback((code: string, datum: string) => setze(code, "scan", datum), [setze]);

  const signDigital = useCallback((datum: string) => signDigitalFuer(ARZT_EINWILLIGUNG, datum), [signDigitalFuer]);
  const signScan = useCallback((datum: string) => signScanFuer(ARZT_EINWILLIGUNG, datum), [signScanFuer]);

  return (
    <EinwilligungCtx.Provider value={{
      status: statusVon(ARZT_EINWILLIGUNG),
      signDigital, signScan,
      statusVon, signDigitalFuer, signScanFuer,
    }}>
      {children}
    </EinwilligungCtx.Provider>
  );
}
