import { ComponentType } from 'react';

import { Resume } from '../types/resume.model';

import { AccentPalette } from './accents';
import DuoTemplate from './Duo';
import LineaTemplate from './Linea';

export interface TemplateProps {
  resume: Resume;
  accent: AccentPalette;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  /** Accent used when the user has not picked one explicitly ("Auto"). */
  defaultAccentId: string;
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
];

export const DEFAULT_TEMPLATE_ID = templates[0].id;
