import { Center, Spinner } from '@chakra-ui/react';
import React, {
  createContext,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ResumeDocument,
  ResumeSettings,
  ResumeSummary,
} from '../../types/resume-library';
import {
  CreateResumeOptions,
  createResume as storeCreateResume,
  deleteResume as storeDeleteResume,
  duplicateResume as storeDuplicateResume,
  initDatabase,
  renameResume as storeRenameResume,
  ResumeStorageError,
  saveDefaultSettings,
  saveDocument,
  subscribeToResumes,
} from '../../utils/resume-repository';

export type { CreateResumeOptions };

/**
 * Shown when the browser refuses to give the app a database — private-mode
 * Safari does, and so do some embedded webviews. The session still works
 * against in-memory storage; it just won't survive a reload.
 */
const BLOCKED_STORAGE_MESSAGE =
  "This browser is blocking storage, so your resumes can't be saved here. Anything you write will be lost when you close this tab.";

export interface ResumeLibraryValue {
  /** Every resume, most recently edited first. */
  resumes: ResumeSummary[];
  createResume: (
    options?: CreateResumeOptions
  ) => Promise<ResumeSummary | null>;
  duplicateResume: (id: string) => Promise<ResumeSummary | null>;
  renameResume: (id: string, name: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  /** Persist a resume's content and count it as an edit. */
  saveResume: (id: string, document: ResumeDocument) => Promise<void>;
  /** Remember a look so the next new resume inherits it. Best-effort. */
  rememberSettings: (settings: ResumeSettings) => void;
  /** Set when a write failed — surfaced as a banner, since edits were lost. */
  saveError: string | null;
  dismissSaveError: () => void;
}

const noop = () => {};
const asyncNoop = async () => {};

export const resumeLibraryContext = createContext<ResumeLibraryValue>({
  resumes: [],
  createResume: async () => null,
  duplicateResume: async () => null,
  renameResume: asyncNoop,
  deleteResume: asyncNoop,
  saveResume: asyncNoop,
  rememberSettings: noop,
  saveError: null,
  dismissSaveError: noop,
});

/**
 * Opens the database and owns the resume list — names, timestamps, and every
 * operation that changes them. It sits above the router so the list screen and
 * the editor share one copy: renaming a resume from the editor's title bar
 * updates the card behind it without a reload.
 *
 * Nothing renders until the database is open and the first list has arrived, so
 * no screen below this has to distinguish "still loading" from "no resumes".
 * The list itself is a live subscription, which is why there is no manual state
 * to keep in step and no refresh-on-focus hack: a change made in another tab
 * simply arrives.
 *
 * Resume *content* is deliberately not held here. Each document is loaded by
 * the editor route for the one id it is showing.
 */
export const ResumeLibraryProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // `null` means the library hasn't been read yet, which is not the same as an
  // empty one. Distinguishing them is what stops the list flashing its empty
  // state on the way in.
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stop = () => {};

    void (async () => {
      try {
        const mode = await initDatabase();
        if (cancelled) return;
        if (mode === 'memory') setStorageWarning(BLOCKED_STORAGE_MESSAGE);
        stop = subscribeToResumes(setResumes);
      } catch (error) {
        // Even the in-memory fallback failed. Let the app render so the user
        // can at least read and export what's on screen.
        console.error('Could not open the resume library:', error);
        if (cancelled) return;
        setStorageWarning(BLOCKED_STORAGE_MESSAGE);
        setResumes([]);
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  /**
   * Run a mutation that touches storage, surfacing a failed write instead of
   * letting it pass silently — a dropped write means the user loses the change
   * at their next reload, and nothing else in the app would ever tell them.
   */
  const attempt = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      try {
        const result = await action();
        setSaveError(null);
        return result;
      } catch (error) {
        if (error instanceof ResumeStorageError) {
          setSaveError(error.message);
          return null;
        }
        throw error;
      }
    },
    []
  );

  const createResume = useCallback(
    (options: CreateResumeOptions = {}) =>
      attempt(() => storeCreateResume(options)),
    [attempt]
  );

  const duplicateResume = useCallback(
    async (id: string) =>
      (await attempt(() => storeDuplicateResume(id))) ?? null,
    [attempt]
  );

  const renameResume = useCallback(
    async (id: string, name: string) => {
      await attempt(() => storeRenameResume(id, name));
    },
    [attempt]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      await attempt(() => storeDeleteResume(id));
    },
    [attempt]
  );

  const saveResume = useCallback(
    async (id: string, document: ResumeDocument) => {
      await attempt(() => saveDocument(id, document));
    },
    [attempt]
  );

  const rememberSettings = useCallback((settings: ResumeSettings) => {
    // Only affects what the *next* new resume starts as. Not worth a banner.
    void saveDefaultSettings(settings).catch((error) => {
      console.error('Could not remember the default resume settings:', error);
    });
  }, []);

  const dismissSaveError = useCallback(() => {
    setSaveError(null);
    setStorageWarning(null);
  }, []);

  const value = useMemo(
    () => ({
      resumes: resumes ?? [],
      createResume,
      duplicateResume,
      renameResume,
      deleteResume,
      saveResume,
      rememberSettings,
      // A blocked-storage warning outlives any single write, so it stands in
      // whenever there's no fresher failure to report.
      saveError: saveError ?? storageWarning,
      dismissSaveError,
    }),
    [
      resumes,
      createResume,
      duplicateResume,
      renameResume,
      deleteResume,
      saveResume,
      rememberSettings,
      saveError,
      storageWarning,
      dismissSaveError,
    ]
  );

  if (resumes === null) {
    return (
      <Center height="100dvh" bg="app.canvas">
        <Spinner size="lg" color="brand.fg" />
      </Center>
    );
  }

  return (
    <resumeLibraryContext.Provider value={value}>
      {children}
    </resumeLibraryContext.Provider>
  );
};
