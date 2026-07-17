import type { TemplateResult } from 'lit';
import type { DiagramConfig } from './diagram';
import type { Stage } from './stages';

/* A page is this descriptor, rendered by <page-scaffold> (see
   components/page-scaffold.ts, which owns the header/rail/diagram shell and
   the StageRouter controller that used to be wired up by a mountPage()
   here). eyebrow/heading are TemplateResults rather than plain strings so
   authored inline markup (<b>, <em>) survives -- Lit escapes interpolated
   strings, so a plain string couldn't carry it. */
export interface Page {
  eyebrow: TemplateResult;
  heading: TemplateResult;
  config: DiagramConfig;
  stages: Stage[];
}
