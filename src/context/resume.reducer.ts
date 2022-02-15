import { Resume } from '../models/resume.model';

export enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
}

export type ACTIONTYPE = {
  type: ACTIONS;
  payload: Resume;
};

export const resumeReducer = (state: Resume, action: ACTIONTYPE): Resume => {
  const { type, payload } = action;

  switch (type) {
    case ACTIONS.updateResume:
      return payload;
    default:
      throw new Error('No action provided');
  }
};
