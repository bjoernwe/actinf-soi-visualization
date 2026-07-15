import type { DiagramConfig } from '../diagram';
import type { Stage } from '../stages';

/* A minimal three-layer constellation -- placeholder content, not an
   authored model page. It exists to prove the component library (stage-rail
   / flow-diagram / FlowEngine / CommentLayer) works for a layer count and
   flow pattern other than the four-tier walkthrough in
   content/insight-inference.ts, without asserting anything about the actual
   S/O model. */
export const DEMO_DIAGRAM: DiagramConfig = {
  layers: [
    { id: 'top', title: 'Layer A', sub: 'placeholder — top layer' },
    { id: 'mid', title: 'Layer B', sub: 'placeholder — middle layer' },
    { id: 'bot', title: 'Layer C', sub: 'placeholder — bottom layer' },
  ],
};

export const DEMO_STAGES: Stage[] = [
  {
    short: 'Calm',
    streams: {
      g0: { down: 'low', up: 'low' },
      g1: { down: 'low', up: 'low' },
    },
    intake: { in: 'low', out: 'low' }, jit: 1, spd: 1,
    comments: [
      { gap: 'g0', tag: 'Three Layers, Two Gaps', body: 'A different constellation than the walkthrough\'s four tiers -- same components, same engine, just a different DiagramConfig.' },
    ],
  },
  {
    short: 'Turbulent',
    streams: {
      g0: { down: 'high', up: 'high' },
      g1: { down: 'high', up: 'high' },
    },
    intake: { in: 'high', out: 'high' }, jit: 3, spd: 1.8,
    comments: [
      { tier: 'mid', icon: '⚡', body: 'Higher intensities, faster flow -- proving the tween and particle system generalize too.' },
    ],
  },
];
