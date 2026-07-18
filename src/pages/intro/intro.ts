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
    short: 'Priors & Errors',
    streams: {
      g0: { down: 'high', up: 'med' },
    },
    intake: { in: 'high', out: 'med' }, jit: 3, spd: 1,
    comments: [
      { gap: 'g0', side: 'left', tag: 'Predicting input', body: 'Predictions flow downwards as *priors*.' },
      { gap: 'g0', side: 'right', tag: 'Residual errors', body: 'Errors reflect how much of *Layer 1*\'s input can\'t be predicted.' },
    ],
  },
  {
    short: 'Attention',
    streams: {
      g0: { down: 'med', up: 'med' },
    },
    intake: { in: 'high', out: 'med' }, jit: 3, spd: 1,
    comments: [
      { gap: 'g0', side: 'left', tag: '🧘 Attention', body: 'Priors cal also be interpreted as *mental action*, namely *attention*.' },
    ],
  },
  {
    short: 'Attention (low)',
    streams: {
      g0: { down: 'med', up: 'low' },
    },
    intake: { in: 'high', out: 'low' }, jit: 3, spd: 1,
    comments: [
      { gap: 'g0', side: 'left', tag: '🧘 Attention', body: 'Priors cal also be interpreted as *mental action*, namely *attention*.', faded: true },
      { gap: 'g0', side: 'right', tag: 'Low Precision', body: 'Attention can *decrease precision*, leading to *fewer errors* on mismatch ...' },
      { tier: 'bot', icon: '🧘', body: '*Low* precision' },
    ],
  },
  {
    short: 'Attention (high)',
    streams: {
      g0: { down: 'med', up: 'high' },
    },
    intake: { in: 'high', out: 'high' }, jit: 3, spd: 1,
    comments: [
      { gap: 'g0', side: 'left', tag: '🧘 Attention', body: 'Priors cal also be interpreted as *mental action*, namely *attention*.', faded: true },
      { gap: 'g0', side: 'right', tag: 'High Precision', body: '... or *increase precision*, leading to *more errors* on mismatch.' },
      { tier: 'bot', icon: '🧘', body: '*High* precision *➡️* more pressure to resolve error *🥵*' },
    ],
  },
  {
    short: 'Error (fixing)',
    streams: {
      g0: { down: 'med', up: 'low' },
    },
    intake: { in: 'high', out: 'high' }, jit: 3, spd: 1,
    comments: [
      { tier: 'bot', icon: '🥵', body: 'When prior and evidence don\'t match, first error handling strategy is to push back (downwards) ...' },
      { gap: 'intake', side: 'left', tag: '💪 Fix problem', body: '... trying to fix the circumstances.' },
    ],
  },
  {
    short: 'Error (escalating)',
    streams: {
      g0: { down: 'med', up: 'high' },
    },
    intake: { in: 'high', out: 'low' }, jit: 3, spd: 1,
    comments: [
      { tier: 'bot', icon: '🥵', body: 'When prior and evidence don\'t match, first error handling strategy is to push back (downwards)', faded: true },
      { gap: 'intake', side: 'left', tag: '🧘 Seated Meditation', body: 'But when we\'re sitting still, *action* on the environment is forced to be *minimal* ...' },
      { gap: 'g0', side: 'right', tag: 'Escalating Error', body: '... forcing the error to be propagated upwards.' },
    ],
  },
  {
    short: 'Error (ongoing...)',
    streams: {
      g0: { down: 'med', up: 'high' },
    },
    intake: { in: 'high', out: 'low' }, jit: 3, spd: 1,
    comments: [
      { tier: 'bot', icon: '🥵', body: 'When prior and evidence don\'t match, first error handling strategy is to push back (downwards)', faded: true },
      { gap: 'intake', side: 'left', tag: '🧘 Seated Meditation', body: 'But when we\'re sitting still, *action* on the environment is forced to be *minimal* ...', faded: true },
      { gap: 'g0', side: 'right', tag: 'Escalating Error', body: '... forcing the error to be propagated upwards.', faded: true },
      { tier: 'top', icon: '🥵', body: '*Now the pressure is up here!* — Just because we were sitting still and put attention to sensory details. What would happen if we continue to do so...?', link: { label: 'Stages of Insight', url: 'stages-of-insight.html' } },
    ],
  },
];

export const PAGE: Page = {
  eyebrow: html`Active Inference`,
  heading: html`Modeling <em>meditation</em>`,
  config: DIAGRAM,
  stages: STAGES,
};
