import { DEFAULT_TEMPLATE_ID, templates } from '../templates';
import { accents } from '../templates/accents';
import { DEFAULT_MARGIN_ID, margins } from '../templates/margins';
import { ResumeSettings } from '../types/resume-library';

/**
 * How a resume is rendered — template, accent, and page margins — and the rules
 * for coercing a stored value back into something renderable.
 *
 * Kept apart from the repository on purpose: these are pure functions of the
 * template registries, and several modules that have no business knowing how
 * resumes are persisted (the editor's `ResumeContext`, the JSON import layer)
 * need them.
 */

export const DEFAULT_SETTINGS: ResumeSettings = {
  templateId: DEFAULT_TEMPLATE_ID,
  accentId: null,
  marginId: DEFAULT_MARGIN_ID,
};

/**
 * Coerce stored settings back into something renderable. A template or margin
 * id that no longer exists — retired between releases, or hand-edited storage —
 * falls back to the default instead of leaving the preview with no component to
 * render. `accentId: null` is meaningful ("Auto"), not a missing value.
 */
export const resolveSettings = (raw: unknown): ResumeSettings => {
  const value = (raw ?? {}) as Partial<ResumeSettings>;

  return {
    templateId: templates.some((template) => template.id === value.templateId)
      ? (value.templateId as string)
      : DEFAULT_TEMPLATE_ID,
    accentId: accents.some((accent) => accent.id === value.accentId)
      ? (value.accentId as string)
      : null,
    marginId: margins.some((margin) => margin.id === value.marginId)
      ? (value.marginId as string)
      : DEFAULT_MARGIN_ID,
  };
};
