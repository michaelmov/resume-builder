import { Basics, Resume, Skill, Work, Education, Project } from '../types/resume.model';

export enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
  updateBasics = 'UPDATE_BASICS',
  updateSkills = 'UPDATE_SKILLS',
  updateWork = 'UPDATE_WORK',
  updateEducation = 'UPDATE_EDUCATION',
  updateProjects = 'UPDATE_PROJECTS',
}

export type ACTIONTYPE = {
  type: ACTIONS;
  payload: Resume | Basics | Skill[] | Work[] | Education[] | Project[];
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
    case ACTIONS.updateEducation:
      updatedPayload = payload as Education[];
      return {
        ...state,
        education: updatedPayload,
      };
    case ACTIONS.updateProjects:
      updatedPayload = payload as Project[];
      return {
        ...state,
        projects: updatedPayload,
      };
    default:
      throw new Error('No action provided');
  }
};
