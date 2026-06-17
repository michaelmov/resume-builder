import { ComponentType } from 'react';

import { Resume } from '../types/resume.model';

import DuoTemplate from './Duo';
import LineaTemplate from './Linea';

export interface TemplateDefinition {
  id: string;
  name: string;
  Component: ComponentType<{ resume: Resume }>;
}

export const templates: TemplateDefinition[] = [
  { id: 'duo', name: 'Duo', Component: DuoTemplate },
  { id: 'linea', name: 'Linea', Component: LineaTemplate },
];

export const DEFAULT_TEMPLATE_ID = templates[0].id;
