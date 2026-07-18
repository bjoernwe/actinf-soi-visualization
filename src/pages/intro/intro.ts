import { html } from 'lit';
import type { DiagramConfig } from '../../components/model/diagram';
import type { Stage } from '../../components/model/stages';
import type { Page } from '../../components/model/page';

export const DIAGRAM: DiagramConfig = {
  layers: [
    { id: 'top', title: 'Layer 0 (priors)', sub: 'sending predictions / expectations downwards' },
    { id: 'bot', title: 'Layer 1', sub: 'consolidating priors & evidence' },
  ],
};

export const STAGES: Stage[] = [
  {
    short: 'Input Prediction',
    streams: {
      g0: { down: 'med', up: 'low' },
    },
    intake: { in: 'high', out: 'low' }, jit: 3, spd: 1,
    comments: [
      { gap: 'g0', side: 'right', tag: 'Predicting input', body: 'To the degree that *Layer 1*\'s input can be predicted, few prediction errors are sent upwards.' },
    ],
  },
  {
    short: 'Sitting Still',
    streams: {
      g0: { down: 'med', up: 'low' },
    },
    intake: { in: 'high', out: 'low' }, jit: 3, spd: 1,
    comments: [
      { gap: 'intake', side: 'left', tag: 'Sitting Still', body: 'During seated meditation, *actions* on the environment are *minimal* — leaving only (passive) inference to minimize prediction errors.' },
    ],
  },
];

export const PAGE: Page = {
  eyebrow: html`intro`,
  heading: html`Title with <em>emphasis</em>`,
  config: DIAGRAM,
  stages: STAGES,
};
