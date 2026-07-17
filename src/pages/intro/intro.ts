import { html } from 'lit';
import type { DiagramConfig } from '../../components/model/diagram';
import type { Stage } from '../../components/model/stages';
import type { Page } from '../../components/model/page';

export const DIAGRAM: DiagramConfig = {
  layers: [
    { id: 'top', title: 'Layer A', sub: 'placeholder — top layer' },
    { id: 'bot', title: 'Layer B', sub: 'placeholder — bottom layer' },
  ],
};

export const STAGES: Stage[] = [
  {
    short: 'Calm',
    streams: {
      g0: { down: 'low', up: 'low' },
    },
    intake: { in: 'low', out: 'low' }, jit: 1, spd: 1,
    comments: [
      { gap: 'g0', tag: 'Two Layers, One Gap', body: 'A different constellation than the walkthrough\'s four tiers -- same components, same engine, just a different DiagramConfig.' },
    ],
  },
  {
    short: 'Turbulent',
    streams: {
      g0: { down: 'high', up: 'high' },
    },
    intake: { in: 'high', out: 'high' }, jit: 3, spd: 1.8,
    comments: [
      { tier: 'bot', icon: '⚡', body: 'Higher intensities, faster flow -- proving the tween and particle system generalize too.' },
    ],
  },
];

export const PAGE: Page = {
  eyebrow: html`component demo · not authored model content`,
  heading: html`A two-layer <em>constellation</em>`,
  config: DIAGRAM,
  stages: STAGES,
};
