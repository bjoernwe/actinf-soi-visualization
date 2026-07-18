import { css } from 'lit';

/* Recurring style fragments for the diagram subtree's Shadow DOM components
   (flow-section, tier-layer, comment-note) -- imported into each component's
   own `static styles`, since a shadow root can't inherit rules from a
   document-level stylesheet the way the light-DOM page chrome does. */

/* The small-caps mono label voice: tier subtitles, comment tags, the intake
   stream label. Color/size are left to the caller since they vary per use. */
export const monoLabel = css`
  font-family: "Spline Sans Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
`;

/* The commentary voice: italic serif, distinct from a tier's roman-serif
   title. */
export const commentVoice = css`
  font-family: "Fraunces", serif;
  font-style: italic;
  font-weight: 340;
`;
