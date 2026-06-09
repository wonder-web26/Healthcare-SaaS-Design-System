/**
 * EinwilligungContext — Single source of truth for the Einwilligungserklärung status.
 *
 * The Einwilligungserklärung (patient consent to share data with the doctor) has
 * two equivalent Zubringer (paths to completion):
 *   1. E-Signatur in VertragsStep (digital signature)
 *   2. Scan/Upload in TabDokumente (paper signature scanned)
 *
 * Both write to the same status object. The ArztFlowSection, TabDokumente, and
 * VertragsStep all read from this single source.
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

interface EinwilligungContextValue {
  status: EinwilligungStatus;
  /** Called when signed via E-Signatur (VertragsStep) */
  signDigital: (datum: string) => void;
  /** Called when uploaded via Scan (TabDokumente) */
  signScan: (datum: string) => void;
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
  const [status, setStatus] = useState<EinwilligungStatus>({
    signiert: false,
    herkunft: null,
    datum: null,
    onboardingId,
    patientId,
  });

  const signDigital = useCallback((datum: string) => {
    setStatus(prev => prev.signiert ? prev : { ...prev, signiert: true, herkunft: "digital", datum });
  }, []);

  const signScan = useCallback((datum: string) => {
    setStatus(prev => prev.signiert ? prev : { ...prev, signiert: true, herkunft: "scan", datum });
  }, []);

  return (
    <EinwilligungCtx.Provider value={{ status, signDigital, signScan }}>
      {children}
    </EinwilligungCtx.Provider>
  );
}
