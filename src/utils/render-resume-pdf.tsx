import { pdf } from '@react-pdf/renderer';

import { templates } from '../templates';
import { getAccent } from '../templates/accents';
import { getMarginScale } from '../templates/margins';
import { ResumeDocument } from '../types/resume-library';

/**
 * Render a stored resume to a PDF blob outside the editor — for the list's
 * thumbnails and for downloading a resume without opening it. Both are cases
 * where there is no live `usePDF` instance to borrow a blob from.
 *
 * Mirrors how `Preview` resolves a template: an accent of `null` means "Auto",
 * which takes the template's own signature color.
 */
export const renderResumePdf = (document: ResumeDocument): Promise<Blob> => {
  const definition =
    templates.find(
      (template) => template.id === document.settings.templateId
    ) ?? templates[0];
  const Template = definition.Component;

  return pdf(
    <Template
      resume={document.resume}
      accent={getAccent(
        document.settings.accentId ?? definition.defaultAccentId
      )}
      marginScale={getMarginScale(document.settings.marginId)}
    />
  ).toBlob();
};
