import { ComponentType } from 'react';

import { Resume } from '../types/resume.model';

import { AccentPalette } from './accents';
import AriaTemplate from './Aria';
import DuoTemplate from './Duo';
import LineaTemplate from './Linea';
import MonoTemplate from './Mono';

export interface TemplateProps {
  resume: Resume;
  accent: AccentPalette;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  /** Accent used when the user has not picked one explicitly ("Auto"). */
  defaultAccentId: string;
  /**
   * Whether the template renders a secondary accent color. Monochrome
   * templates set this to `false` so the accent picker is disabled while they
   * are active. Defaults to `true` when omitted.
   */
  supportsAccent?: boolean;
  Component: ComponentType<TemplateProps>;
}

export const templates: TemplateDefinition[] = [
  {
    id: 'duo',
    name: 'Duo',
    defaultAccentId: 'sky',
    Component: DuoTemplate,
  },
  {
    id: 'linea',
    name: 'Linea',
    defaultAccentId: 'clay',
    Component: LineaTemplate,
  },
  {
    id: 'aria',
    name: 'Aria',
    defaultAccentId: 'sage',
    Component: AriaTemplate,
  },
  {
    // Monochrome by design — it has no secondary color, so the accent picker is
    // disabled while this template is active.
    id: 'mono',
    name: 'Mono',
    defaultAccentId: 'sky',
    supportsAccent: false,
    Component: MonoTemplate,
  },
];

export const DEFAULT_TEMPLATE_ID = templates[0].id;
