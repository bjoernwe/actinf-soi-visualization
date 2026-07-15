import { MAX_BREADTH } from './model';
import type { Comment } from './stages';

/* how far the pred/err streams sit from a gap's center, as a fraction of tier
   width. Smaller = streams hug the center, leaving side room for comment slots. */
const STREAM_OFF = 0.05;
/* a docked tier comment covers the right slice of its layer box; the label
   survives on the left up to this fraction of the tier width. DOCK_PAD is the
   breathing room the card leaves inside the layer's edges. */
const DOCK_START = 0.45;
const DOCK_PAD = 9;

interface Box { top: number; bot: number; left: number; right: number; }

// Inline emphasis for comment bodies: *word* -> a stressed span. The body is
// set in italic serif, so .stress reads by standing upright (see CSS), the
// inverse of markdown's usual italic. Split on '*' and alternate plain text /
// emphasis (odd fragments are inside a pair); each fragment is written as a
// text node, so an authored string can never inject markup.
function fillBody(p: HTMLParagraphElement, text: string): void {
  text.split('*').forEach((frag, i) => {
    if (!frag) return;
    if (i % 2) {
      const em = document.createElement('em');
      em.className = 'stress';
      em.textContent = frag;
      p.appendChild(em);
    } else {
      p.appendChild(document.createTextNode(frag));
    }
  });
}

/* Builds and positions a stage's comment boxes inside a diagram's comment
   layer. Two anchor modes (see stages.ts's GapComment/TierComment):
     tier-anchored — dock onto the right slice of a layer box, over its text,
       full box height; the inward rule (pin-left) divides label from note.
     gap-anchored  — pin beside a stream. The accent edge always faces inward,
       toward the stream: a box on the right gets pin-left, one on the left
       pin-right. Clear the widest a high-intensity band can reach so a broad
       stream never overlaps it. All tiers share one horizontal box, so
       tiers[0] suffices. */
export class CommentLayer {
  private active: { def: Comment; box: HTMLElement }[] = [];

  constructor(
    private container: HTMLElement,
    private diagram: HTMLElement,
    private tiers: HTMLElement[],
    private tierIndex: Record<string, number>,
    private getHeight: () => number,
  ) {}

  private tierBox(t: HTMLElement): Box {
    const dRect = this.diagram.getBoundingClientRect();
    const b = t.getBoundingClientRect();
    return { top: b.top - dRect.top, bot: b.bottom - dRect.top, left: b.left - dRect.left, right: b.right - dRect.left };
  }

  // Vertical center (diagram coords) of a gap or the intake region.
  private regionCenterY(gap: string): number {
    if (gap === 'intake') {
      const s = this.tierBox(this.tiers[this.tiers.length - 1]);
      return (s.bot + (this.getHeight() - 26)) / 2;
    }
    const i = +gap[1];
    return (this.tierBox(this.tiers[i]).bot + this.tierBox(this.tiers[i + 1]).top) / 2;
  }

  private place(box: HTMLElement, def: Comment): void {
    box.classList.remove('pin-left', 'pin-right');
    if ('tier' in def) {
      const t = this.tierBox(this.tiers[this.tierIndex[def.tier]]);
      const left = t.left + (t.right - t.left) * DOCK_START + DOCK_PAD;
      box.style.left = left + 'px';
      box.style.width = (t.right - DOCK_PAD - left) + 'px';
      // Size to content, then centre in the layer so the inset reads on every
      // side. Width is set first so offsetHeight reflects the wrapped body.
      box.style.height = '';
      box.style.top = ((t.top + t.bot) / 2 - box.offsetHeight / 2) + 'px';
      return;
    }
    const { gap, side } = def;
    const t = this.tierBox(this.tiers[0]);
    const cx = (t.left + t.right) / 2, w = t.right - t.left;
    box.style.top = this.regionCenterY(gap) + 'px';
    if (side === 'left') {
      const right = cx - w * STREAM_OFF - MAX_BREADTH - 20;
      box.classList.add('pin-right'); // box left of stream: accent faces right, inward
      box.style.left = t.left + 'px';
      box.style.width = (right - t.left) + 'px';
    } else {
      const left = cx + w * STREAM_OFF + MAX_BREADTH + 20;
      box.classList.add('pin-left'); // box right of stream: accent faces left, inward
      box.style.left = left + 'px';
      box.style.width = (t.right - left) + 'px';
    }
  }

  // Re-position the current stage's comment boxes (on stage change + resize).
  layout(): void {
    for (const { def, box } of this.active) this.place(box, def);
  }

  // Build and place the comment boxes for a stage. Rebuilt on each stage
  // change, so text, count, and placement can all differ from stage to stage.
  render(comments: Comment[]): void {
    this.container.innerHTML = '';
    this.active = comments.map(def => {
      const box = document.createElement('aside');
      box.className = 'tier' in def ? 'comment dock' : 'comment';
      // Gap comments carry a tag; a dock gives its whole box to the body.
      if (!('tier' in def)) {
        const tag = document.createElement('div');
        tag.className = 'comment-tag';
        tag.textContent = def.tag;
        box.appendChild(tag);
      }
      // A dock's icon gets its own upright column beside the (italic) body,
      // so it never inherits the slant and multi-line text stays flush past it.
      if ('tier' in def && def.icon) {
        const icon = document.createElement('span');
        icon.className = 'comment-icon';
        icon.textContent = def.icon;
        box.appendChild(icon);
      }
      const p = document.createElement('p');
      fillBody(p, def.body);
      box.appendChild(p);
      this.container.appendChild(box);
      return { def, box };
    });
    this.layout();
  }
}
