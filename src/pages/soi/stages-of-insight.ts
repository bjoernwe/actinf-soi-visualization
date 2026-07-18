import { html } from 'lit';
import type { DiagramConfig } from '../../components/model/diagram';
import type { Stage } from '../../components/model/stages';
import type { Page } from '../../components/model/page';

export const MAIN_DIAGRAM: DiagramConfig = {
  layers: [
    { id: 'self-high', title: 'Self layer (deep)', sub: 'deep preferences and conditioning · deeper perceptual structures like space and time' },
    { id: 'self-low', title: 'Self layer (every-day)', sub: 'reactions · will · object relations' },
    { id: 'object', title: 'Object layer', sub: 'common things & scenes to act on & relate to' },
    { id: 'sense', title: 'Sensory layer', sub: 'sensory details · texture · vibration' },
  ],
};

/* Baseline is authored to match the comment slots' narrative:
     g0  deeper self ↔ low self : auto-pilot, relaxed        → low / low
     g1  low self ↔ object      : object-related selfing loop → high / high
     g2  object ↔ sensory       : details predicted away      → high / low   */
export const STAGES: Stage[] = [
  {
    short: 'Baseline',
    streams: {
      g0: { down: 'med', up: 'low'  },
      g1: { down: 'high', up: 'med' },
      g2: { down: 'med', up: 'low'  },
    },
    intake: { in: 'med', out: 'med' }, jit: 1.5, spd: 1,
    comments: [
      { gap: 'g0', tag: 'Deeper Self Auto-Pilot', body: 'During every-day baseline, deeper self structures are semi-relaxed, slightly re-confirming and rarely updating.' },
      { gap: 'g1', side: 'left', tag: '🖐️️ High Object-Related Selfing', body: 'The tightest inference loop happens between self layer and everyday objects.' },
      { gap: 'g2', side: 'right', tag: 'Details Predicted Away', body: 'Most sensory details are predicted away.' },
      { gap: 'intake', side: 'left', tag: 'Outward Actions', body: 'Actions are modeled as active inference on the outside.' },
    ],
  },
  {
    short: 'Entry',
    streams: {
      g0: { down: 'med', up: 'low'  },
      g1: { down: 'med', up: 'med'  },
      g2: { down: 'med', up: 'high'  },
    },
    intake: { in: 'med', out: 'low' }, jit: 1.3, spd: 1,
    comments: [
      { tier: 'self-low', icon: '🧘', body: 'The meditator has (some) meta-cognitive awareness about what they are doing.' },
      { gap: 'g1', side: 'left', tag: '🧘 Cultivated Equanimity', body: 'Relaxing preferences around how objects *should* be.' },
      { tier: 'object', icon: '💡', body: 'Objects start to become more fluid and interesting.' },
      { gap: 'g2', side: 'left', tag: 'Perceived Details (2)', body: 'Object layer adjusts to predict sensory input in more detail.' },
      { gap: 'g2', side: 'right', tag: '🔥 Perceived Details (1)', body: 'Increased prediction error due to attention. This will become a *driving force*.' },
      { tier: 'sense', icon: '🧘', body: 'Attention (i.e., increased precision) is placed on sensory input.' },
      { gap: 'intake', side: 'left', tag: '🧘 Seated Meditation',  body: 'Sitting still minimizes active inference (i.e., action) on the environment.' },
    ],
  },
  {
    short: 'A&P',
    streams: {
      g0: { down: 'med', up: 'low' },
      g1: { down: 'med', up: 'med' },
      g2: { down: 'high', up: 'high' },
    },
    intake: { in: 'med', out: 'low' }, jit: 2, spd: 1.35,
    comments: [
      { tier: 'self-low', icon: '🧘', body: 'Self is still stable enough to not escalate upwards. Instead, it stabilizes downwards by grasping for the pleasant (but unstable) objects.' },
      { gap: 'g1', side: 'right', tag: 'Upwards Error Propagation', body: 'Since objects are fluid now, update pressure on self increases.' },
      { tier: 'object', icon: '💡', body: 'Unlike every-day objects, these are now extremely fluid and rich in detail' },
      { gap: 'g2', side: 'left', tag: 'Adjusted Object Predictions', body: 'Since object layer is still constraint by self-preferences, it grabs a local minima - which are *pleasant*.' },
      { gap: 'g2', side: 'right', tag: 'Constant Destabilization', body: 'The constant error stream has destabilized the object layer.' },
    ],
  },
  {
    short: 'Dissolution',
    streams: {
      g0: { down: 'med', up: 'med' },
      g1: { down: 'high', up: 'high' },
      g2: { down: 'high', up: 'high' },
    },
    intake: { in: 'med', out: 'low' }, jit: 2.4, spd: 1.6,
    comments: [
      { tier: 'self-high', icon: '🧘', body: 'If lucky, the meditator has (some) meta-cognitive awareness about the dissolution process.' },
      { gap: 'g0', side: 'right', tag: 'Objects Lost', body: 'Deeper self layers start to get update pressure as well. May start to get uncomfortable.' },
      { gap: 'g1', side: 'left', tag: 'Objects Lost', body: 'Attempt to stabilize, but object layer is already fluid.' },
      { gap: 'g1', side: 'right', tag: 'Self Under Pressure', body: 'Continuous updates (i.e., dissolution) to object layer increase pressure on self.' },
    ],
  },
  {
    short: 'Dark Night',
    streams: {
      g0: { down: 'high', up: 'high' },
      g1: { down: 'high', up: 'high' },
      g2: { down: 'high', up: 'high' },
    },
    intake: { in: 'med', out: 'low' }, jit: 2.4, spd: 1.6,
    comments: [
      { tier: 'self-high', icon: '💡', body: 'As deeper structures destabilize, meta-cognitive awareness is harder to maintain.' },
      { tier: 'self-low', icon: '🧘', body: 'The practitioner has to keep going, although things such and the sense of control is gone.' },
      { gap: 'g0', side: 'left', tag: 'Unsuccessful Stabilization', body: 'Attempts for active stabilization. They don\'t work because the lower layers are already unstable.' },
      { gap: 'g0', side: 'right', tag: 'Deep Self Structures Destabilized', body: 'Increasingly deep layers of self are under pressure. Like Fear, Misery, Disgust. Very unpleasant.' },
    ],
  },
  {
    short: 'Re-Observation',
    streams: {
      g0: { down: 'high', up: 'high' },
      g1: { down: 'med', up: 'high' },
      g2: { down: 'med', up: 'med' },
    },
    intake: { in: 'med', out: 'low' }, jit: 2.4, spd: 1.6,
    comments: [
      { tier: 'self-high', icon: '💡', body: 'Under constant update pressure, the deeper layers sometimes manage to re-establish new (and deep) meta-cognitive predictions about what\'s going on.' },
      { tier: 'self-low', icon: '🧘', body: 'The practitioner has to relax despite the discomfort.' },
      { tier: 'sense', icon: '🧘', body: 'The practitioner has to maintain a focus on sensory details to keep the error stream going.' },
    ],
  },
];

export const PAGE: Page = {
  eyebrow: html`Active Inference`,
  heading: html`Modeling <em>Stages of Insight</em>`,
  config: MAIN_DIAGRAM,
  stages: STAGES,
};
