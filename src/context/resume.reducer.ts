import { Basics, Resume } from '../models/resume.model';

export enum ACTIONS {
  updateBasics = 'UPDATE_BASICS',
}

export type ACTIONTYPE = {
  type: ACTIONS;
  payload: Basics;
};

export const resumeReducer = (state: Resume, action: ACTIONTYPE): Resume => {
  const { type, payload } = action;

  switch (type) {
    case ACTIONS.updateBasics:
      return { ...state, basics: payload };

    default:
      throw new Error('No action provided');
  }
};
