import { type Stage, validateStage } from './stages';
import { MAIN_DIAGRAM, STAGES } from './content/insight-inference';
import { FlowEngine } from './engine';

(() => {
  if (import.meta.env.DEV) STAGES.forEach(s => validateStage(MAIN_DIAGRAM, s));

  const el = (id: string) => document.getElementById(id) as HTMLElement;

  /* ---------------- DOM: rail ---------------- */
  const rail = document.getElementById('rail') as HTMLOListElement;
  STAGES.forEach((s: Stage, i: number) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="stage-link" data-i="${i}">${s.short}</button>`;
    rail.appendChild(li);
  });
  rail.addEventListener('click', e => {
    const b = (e.target as Element).closest('button.stage-link') as HTMLButtonElement | null;
    if (b) setStage(+b.dataset.i!);
  });

  /* prev / next navigation */
  const prevBtn = document.getElementById('prev-stage') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-stage') as HTMLButtonElement;
  prevBtn.addEventListener('click', () => setStage(cur - 1));
  nextBtn.addEventListener('click', () => setStage(cur + 1));
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') setStage(cur - 1);
    else if (e.key === 'ArrowRight') setStage(cur + 1);
  });

  /* ---------------- canvas + comments engine ---------------- */
  const canvas = el('flow') as HTMLCanvasElement;
  const diagram = el('diagram');
  const tiers = MAIN_DIAGRAM.layers.map(l => el('tier-' + l.id));
  const commentLayer = el('comments');
  const engine = new FlowEngine(canvas, diagram, tiers, MAIN_DIAGRAM, STAGES[0], commentLayer);

  /* ---------------- state + hash routing ---------------- */
  let cur = -1;

  /* URL hash <-> stage. Each stage gets a slug (from its `short` name) so the
     current stage survives a refresh and is shareable/bookmarkable. */
  const slug = (s: Stage) => s.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  function stageFromHash(): number {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return STAGES.findIndex(s => slug(s) === h);
  }

  function setStage(i: number): void {
    if (i < 0 || i >= STAGES.length || i === cur) return;
    cur = i;
    engine.setStage(STAGES[i]);
    [...rail.children].forEach((li, j) => li.classList.toggle('active', j === i));
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= STAGES.length - 1;
    location.hash = slug(STAGES[i]);
  }

  // Back/forward and manual hash edits move the stage too.
  window.addEventListener('hashchange', () => {
    const i = stageFromHash();
    if (i >= 0) setStage(i);
  });

  window.addEventListener('resize', () => engine.resize());
  engine.resize();
  // Docks are centred from their measured height, so re-place them once the
  // web font swaps in and line-wrapping (hence height) may have changed.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => engine.comments.layout());

  const initial = stageFromHash();
  setStage(initial >= 0 ? initial : 0);
  engine.start();
})();
