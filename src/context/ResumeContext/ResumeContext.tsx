import React, {
  createContext,
  Dispatch,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { useResumeLibrary } from '../../hooks/useResumeLibrary';
import { emptyResume } from '../../mocks/empty-resume';
import { ResumeDocument, ResumeSettings } from '../../types/resume-library';
import { Resume } from '../../types/resume.model';
import { DEFAULT_SETTINGS } from '../../utils/resume-storage';

import { ACTIONTYPE, resumeReducer } from './ResumeReducer';

interface ResumeContext {
  state: Resume;
  dispatch: Dispatch<ACTIONTYPE> | null;
  /** How this resume is rendered — template, accent, and page margins. */
  settings: ResumeSettings;
  updateSettings: (patch: Partial<ResumeSettings>) => void;
}

const resumeStoreContext = createContext<ResumeContext>({
  state: emptyResume(),
  dispatch: null,
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});
const { Provider } = resumeStoreContext;

interface ResumeProviderProps {
  /** The resume being edited. Mount this provider keyed by it. */
  id: string;
  /** Already read from storage by the route, so a missing id can redirect. */
  document: ResumeDocument;
  children: React.ReactNode;
}

/**
 * Holds the one resume the editor is showing — its content in a reducer, its
 * appearance in state — and auto-saves both. This lives under `/editor/:id`
 * rather than at the app root so a keystroke rewrites a single storage key
 * instead of re-serializing every resume in the library.
 */
const ResumeProvider: FC<ResumeProviderProps> = ({
  id,
  document,
  children,
}) => {
  const { saveResume, rememberSettings } = useResumeLibrary();

  const [state, dispatch] = useReducer(resumeReducer, document.resume);
  const [settings, setSettings] = useState<ResumeSettings>(document.settings);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const rememberSettingsRef = useRef(rememberSettings);
  rememberSettingsRef.current = rememberSettings;

  const saveResumeRef = useRef(saveResume);
  saveResumeRef.current = saveResume;

  /**
   * Skip the first run. Merely opening a resume must not count as editing it —
   * otherwise every visit would bump `updatedAt` and reshuffle the list, which
   * sorts by most recently edited.
   */
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    // Called through a ref: `saveResume` writes the index it closes over, so
    // depending on its identity here would make this effect retrigger itself.
    saveResumeRef.current(id, { resume: state, settings });
  }, [id, state, settings]);

  const updateSettings = useCallback((patch: Partial<ResumeSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    // A deliberate style choice also becomes what the next new resume starts
    // from, so picking a template is a one-time decision rather than a step in
    // every new resume.
    rememberSettingsRef.current(next);
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, settings, updateSettings }),
    [state, settings, updateSettings]
  );

  return <Provider value={value}>{children}</Provider>;
};

export { resumeStoreContext, ResumeProvider };
