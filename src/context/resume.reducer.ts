import { Basics, Resume, Skill } from '../models/resume.model';

export enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
  udpateBasics = 'UPDATE_BASICS',
  updateSkills = 'UPDATE_SKILLS',
}

export type ACTIONTYPE = {
  type: ACTIONS;
  payload: Resume | Basics | Skill[];
};

export const resumeReducer = (state: Resume, action: ACTIONTYPE): Resume => {
  const { type, payload } = action;

  switch (type) {
    case ACTIONS.updateResume:
      return payload as Resume;
    case ACTIONS.udpateBasics:
      const udpatedPayload = payload as Basics;
      return {
        ...state,
        basics: udpatedPayload,
      };
    case ACTIONS.updateSkills:
      const updatedPayload = payload as Skill[];
      return {
        ...state,
        skills: updatedPayload,
      };
    default:
      throw new Error('No action provided');
  }
};
