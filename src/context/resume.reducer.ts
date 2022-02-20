import { Basics, Resume } from '../models/resume.model';

export enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
  udpateBasics = 'UPDATE_BASICS',
}

export type ACTIONTYPE = {
  type: ACTIONS;
  payload: Resume | Basics;
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
    default:
      throw new Error('No action provided');
  }
};
