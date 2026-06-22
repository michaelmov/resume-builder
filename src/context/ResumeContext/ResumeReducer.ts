import { Resume, SectionTypes } from '../../types/resume.model';

export enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
  updateSection = 'UPDATE_SECTION',
  updateSectionOrder = 'UPDATE_SECTION_ORDER',
}

/** Data payload for a single section — Basics is an object, the rest arrays. */
export type SectionData = Resume[keyof Resume];

export type ACTIONTYPE =
  | { type: ACTIONS.updateResume; payload: Resume }
  | {
      type: ACTIONS.updateSection;
      payload: { section: SectionTypes; data: SectionData };
    }
  | { type: ACTIONS.updateSectionOrder; payload: SectionTypes[] };

export const resumeReducer = (state: Resume, action: ACTIONTYPE): Resume => {
  switch (action.type) {
    case ACTIONS.updateResume:
      return action.payload;
    case ACTIONS.updateSection:
      return {
        ...state,
        [action.payload.section]: action.payload.data,
      };
    case ACTIONS.updateSectionOrder:
      return {
        ...state,
        sectionOrder: action.payload,
      };
    default:
      throw new Error('No action provided');
  }
};
