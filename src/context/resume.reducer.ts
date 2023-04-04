import { Basics, Resume, Skill, Work } from '../types/resume.model';

export enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
  updateBasics = 'UPDATE_BASICS',
  updateSkills = 'UPDATE_SKILLS',
  updateWork = 'UPDATE_WORK',
}

export type ACTIONTYPE = {
  type: ACTIONS;
  payload: Resume | Basics | Skill[] | Work[];
};

export const resumeReducer = (state: Resume, action: ACTIONTYPE): Resume => {
  const { type, payload } = action;
  let updatedPayload;

  switch (type) {
    case ACTIONS.updateResume:
      return payload as Resume;
    case ACTIONS.updateBasics:
      updatedPayload = payload as Basics;
      return {
        ...state,
        basics: updatedPayload,
      };
    case ACTIONS.updateSkills:
      updatedPayload = payload as Skill[];
      return {
        ...state,
        skills: updatedPayload,
      };
    case ACTIONS.updateWork:
      updatedPayload = payload as Work[];
      return {
        ...state,
        work: updatedPayload,
      };
    default:
      throw new Error('No action provided');
  }
};
