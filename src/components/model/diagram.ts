/* A diagram is a stack of N layers with N-1 gaps between them, plus an intake
   region below the last layer. This is what makes the diagram reusable across
   pages: a page authors a DiagramConfig (its own layer constellation) and a
   set of Stage entries (see stages.ts) against that config's gap ids, instead
   of the four hardcoded tiers the first build had. */
export interface Layer {
  id: string;
  title: string;
  sub: string;
}

export interface DiagramConfig {
  layers: Layer[];
  environmentLabel: string;
  /* Captions for the vertical layer axis, read top-to-bottom (e.g. "slow ·
     invariant" at the top layer, "fast · concrete" at the bottom) --
     authored content, so it lives on the diagram's own config rather than
     fixed inside <flow-diagram>. */
  axisLabels: { top: string; bottom: string };
}

/* Gap ids are positional: 'g0' sits between layers[0] and layers[1], etc. --
   this is the one place that convention is defined. */
export function gapIds(config: DiagramConfig): string[] {
  return config.layers.slice(1).map((_, i) => `g${i}`);
}
