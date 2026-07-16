import { mountPage } from '../page';
import { DEMO_DIAGRAM, DEMO_STAGES } from '../content/demo';

const diagram = document.querySelector('flow-diagram')!;
diagram.content = { config: DEMO_DIAGRAM, stage: DEMO_STAGES[0] };

mountPage(diagram, DEMO_STAGES);
