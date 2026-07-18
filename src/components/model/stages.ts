import type { Level } from './model';
import type { DiagramConfig } from './diagram';
import { gapIds } from './diagram';

export type Dir = 'down' | 'up';

/* Gap and tier ids used to be fixed unions ('g0'|'g1'|'g2', 'self-high'|...)
   when the diagram had exactly four hardcoded tiers. Now that a page supplies
   its own DiagramConfig (see diagram.ts), they're just strings, checked
   against that config at dev time by validateStage() below instead of by the
   type system. */
export type Gap = string;
export type Tier = string;

/* Each of a diagram's gaps carries a `down` stream (predictions, blue) and an
   `up` stream (prediction error, orange). A stage assigns each an intensity
   level; clicking the rail tweens between stages. `intake` covers the bottom
   region below the last layer: an `in` stream (sensory inflow, up, err) and
   an `out` stream (outward action, down, pred), each carrying its own level. */
export interface Flow {
  down: Level;
  up: Level;
}
export interface IntakeFlow {
  in: Level;
  out: Level;
}

/* Per-stage annotations. An entry anchors one of two ways:
     gap-anchored  — a gloss on a loop, floating beside a stream:
       gap:  one of the diagram's gap ids, or 'intake'
       side: 'right' (err / sensory-inflow side, the default) | 'left' (pred / action side)
     tier-anchored — a terse readout docked onto a layer's right, over its
       text (which returns in stages without the note):
       tier: one of the diagram's layer ids
       icon: optional emoji, rendered upright in its own column beside
         the (italic) body so it never inherits the slant and multi-line
         bodies stay flush past it, not indented under the glyph.
   Add, drop, or move entries freely — count and placement can differ per stage.
   `faded` is how a stage carries an older comment forward as backdrop rather
   than dropping it: repeat the same entry (or one with adjusted body) in the
   next stage's list with `faded: true` so it visibly recedes while a new,
   un-faded comment introduces what's changed -- a running commentary instead
   of a clean swap. */
export interface CommentBase {
  faded?: boolean;
}
export interface GapComment extends CommentBase {
  gap: Gap | 'intake';
  side?: 'left' | 'right';
  tag: string;
  body: string;
}
export interface TierComment extends CommentBase {
  tier: Tier;
  icon?: string;
  body: string;
}
export type Comment = GapComment | TierComment;

export interface Stage {
  short: string;
  streams: Record<Gap, Flow>;
  intake: IntakeFlow;
  jit: number;
  spd: number;
  comments: Comment[];
}

/* Dev-time check that a stage's gap/tier references actually match the
   diagram it's authored for -- the price of Gap/Tier being plain strings
   instead of a compile-time-checked union. Throws with a stage-named,
   specific message instead of leaving a silently dead stream or an unplaced
   comment. Call from page bootstrap under import.meta.env.DEV; dead-code
   eliminated from production builds. */
export function validateStage(config: DiagramConfig, stage: Stage): void {
  const gaps = gapIds(config);
  const tierIds = new Set(config.layers.map(l => l.id));
  const name = `Stage "${stage.short}"`;

  for (const g of gaps) {
    if (!(g in stage.streams)) throw new Error(`${name}: missing streams for gap "${g}"`);
  }
  for (const g of Object.keys(stage.streams)) {
    if (!gaps.includes(g)) throw new Error(`${name}: streams reference unknown gap "${g}"`);
  }
  for (const c of stage.comments) {
    if ('tier' in c) {
      if (!tierIds.has(c.tier)) throw new Error(`${name}: comment references unknown tier "${c.tier}"`);
    } else if (c.gap !== 'intake' && !gaps.includes(c.gap)) {
      throw new Error(`${name}: comment references unknown gap "${c.gap}"`);
    }
  }
}
