import { create } from "zustand";
import type { DashaEntry } from "../core/DashaBhuktiEngine";
import type { KundliInput, KundliOutput } from "../core/AstroTypes";

/** In-memory session so the chart survives tab switches until the user closes it. */
export type KundliViewerSession = {
  result: KundliOutput;
  input: KundliInput;
  birthDateYmd: string;
  birthTimeHm: string;
  homePlaceName: string;
  placeLabel: string;
  dasha: DashaEntry[];
  dailyPrediction: string;
};

type KundliViewerState = {
  session: KundliViewerSession | null;
  setSession: (s: KundliViewerSession) => void;
  clearSession: () => void;
};

export const useKundliViewerStore = create<KundliViewerState>((set) => ({
  session: null,
  setSession: (s) => set({ session: s }),
  clearSession: () => set({ session: null })
}));
