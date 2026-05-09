/**
 * Fixed South Indian rasi chart: signs occupy constant cells around a 2x2 center.
 * Clockwise from Mesha at (row=0,col=1): Mesha..Kanya around; Meena completes at (0,0).
 * Visual grid lines live in `src/assets/south-indian-kundli-frame.svg` (same m/cell numbers).
 */
export type GridCell = { row: number; col: number };

const RASHI_TO_CELL: GridCell[] = [
  { row: 0, col: 1 }, // 0 Mesha
  { row: 0, col: 2 }, // 1 Vrishabha
  { row: 0, col: 3 }, // 2 Mithuna
  { row: 1, col: 3 }, // 3 Karka
  { row: 2, col: 3 }, // 4 Simha
  { row: 3, col: 3 }, // 5 Kanya
  { row: 3, col: 2 }, // 6 Tula
  { row: 3, col: 1 }, // 7 Vrischika
  { row: 3, col: 0 }, // 8 Dhanu
  { row: 2, col: 0 }, // 9 Makara
  { row: 1, col: 0 }, // 10 Kumbha
  { row: 0, col: 0 } // 11 Meena
];

export const getCellForRashiIndex = (rashiIndex: number): GridCell => {
  const idx = ((rashiIndex % 12) + 12) % 12;
  return RASHI_TO_CELL[idx]!;
};

/** Cell size and origin for 4x4 grid with merged center (rows 1-2, cols 1-2). */
export const CHART_LAYOUT = {
  cell: 78,
  margin: 28,
  stroke: "#b91c1c",
  frameStroke: "#991b1b",
  innerPad: 4
} as const;

export const cellOrigin = (cell: GridCell): { x: number; y: number } => {
  const { cell: w, margin: m } = CHART_LAYOUT;
  return { x: m + cell.col * w, y: m + cell.row * w };
};

export const centerRect = (): { x: number; y: number; width: number; height: number } => {
  const { cell: w, margin: m } = CHART_LAYOUT;
  return { x: m + w, y: m + w, width: w * 2, height: w * 2 };
};

export const chartViewSize = (): number => {
  const { cell: w, margin: m } = CHART_LAYOUT;
  return m * 2 + w * 4;
};

/** Bhāva 1–12 for a fixed-rāśi South chart: Lagna sign is house 1. */
export const houseForSign = (lagnaSignIndex: number, signIndex: number): number => {
  const lag = ((lagnaSignIndex % 12) + 12) % 12;
  const s = ((signIndex % 12) + 12) % 12;
  return ((s - lag + 12) % 12) + 1;
};
