/* ---------------- intensity system ----------------
   A stream's intensity reads on three channels at once, so the level is
   legible in a still frame and even in grayscale:
     breadth  – how wide the band of bubbles spreads (the primary cue)
     rate     – bubbles spawned per second
     alpha    – colour strength
     size     – bubble radius
   Everything downstream speaks in 'low' | 'med' | 'high'. */
export type Level = 'low' | 'med' | 'high';

export interface IntensityValues {
  breadth: number;
  rate: number;
  alpha: number;
  size: number;
}

export const INTENSITY: Record<Level, IntensityValues> = {
  low:  { breadth:  5, rate:  3.2, alpha: 0.42, size: 1.9 },
  med:  { breadth: 12, rate:  7.0, alpha: 0.68, size: 2.3 },
  high: { breadth: 21, rate: 12.5, alpha: 0.92, size: 2.7 },
};
export const MAX_BREADTH = INTENSITY.high.breadth;

/* ---------------- colors ---------------- */
export type RGB = [number, number, number];
export const COLORS: { pred: RGB; err: RGB } = { pred: [139, 158, 232], err: [232, 140, 74] };
