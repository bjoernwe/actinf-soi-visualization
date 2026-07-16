import { MAX_BREADTH } from '../../model';
import type { Comment } from '../../stages';
import type { CommentNote } from './comment-note';

/* how far the pred/err streams sit from a gap's center, as a fraction of tier
   width. Smaller = streams hug the center, leaving side room for comment slots. */
const STREAM_OFF = 0.05;
/* a docked tier comment covers the right slice of its layer box; the label
   survives on the left up to this fraction of the tier width. DOCK_PAD is the
   breathing room the card leaves inside the layer's edges. */
const DOCK_START = 0.45;
const DOCK_PAD = 9;

interface Box { top: number; bot: number; left: number; right: number; }

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
  // <comment-note> renders its own tag/icon/body declaratively (see that
  // component); this class stays responsible for the comment/dock class
  // (applied here, synchronously, since dock sizing below needs it present
  // before Lit's own -- async -- first render of that element lands) and all
  // of the positioning math.
  render(comments: Comment[]): void {
    this.container.innerHTML = '';
    this.active = comments.map(def => {
      const box = document.createElement('comment-note') as CommentNote;
      box.className = 'tier' in def ? 'comment dock' : 'comment';
      box.def = def;
      this.container.appendChild(box);
      return { def, box };
    });
    this.layout();
    // A dock's height comes from its actual (icon + body) content, which
    // <comment-note>'s own render hasn't painted yet on the pass above --
    // Lit's updates are scheduled as a microtask. Re-layout once each note
    // has actually rendered so dock sizing reads real content, not zero.
    void Promise.all(this.active.map(({ box }) => (box as CommentNote).updateComplete)).then(() => this.layout());
  }
}
