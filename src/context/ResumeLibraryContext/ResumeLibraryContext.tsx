import React, {
  createContext,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ResumeDocument,
  ResumeSettings,
  ResumeSummary,
} from '../../types/resume-library';
import { Resume } from '../../types/resume.model';
import {
  createDocument,
  createResumeId,
  loadLibrary,
  readDocument,
  removeDocument,
  ResumeStorageError,
  saveDefaultSettings,
  saveDocument,
  saveIndex,
  sortByRecency,
} from '../../utils/resume-storage';
import { copyThumbnail, deleteThumbnail } from '../../utils/thumbnails';

export const UNTITLED_RESUME_NAME = 'Untitled resume';

export interface CreateResumeOptions {
  name?: string;
  /** Content for the new resume; a blank one when omitted. */
  resume?: Resume;
  /** Look for the new resume; the last-used default when omitted. */
  settings?: ResumeSettings;
}

export interface ResumeLibraryValue {
  /** Every resume, most recently edited first. */
  resumes: ResumeSummary[];
  createResume: (options?: CreateResumeOptions) => ResumeSummary | null;
  duplicateResume: (id: string) => ResumeSummary | null;
  renameResume: (id: string, name: string) => void;
  deleteResume: (id: string) => void;
  /** Persist a resume's content and count it as an edit. */
  saveResume: (id: string, document: ResumeDocument) => void;
  /** Remember a look so the next new resume inherits it. Best-effort. */
  rememberSettings: (settings: ResumeSettings) => void;
  /** Set when a write failed — surfaced as a banner, since edits were lost. */
  saveError: string | null;
  dismissSaveError: () => void;
}

const noop = () => {};

export const resumeLibraryContext = createContext<ResumeLibraryValue>({
  resumes: [],
  createResume: () => null,
  duplicateResume: () => null,
  renameResume: noop,
  deleteResume: noop,
  saveResume: noop,
  rememberSettings: noop,
  saveError: null,
  dismissSaveError: noop,
});

/** "Senior PM" → "Senior PM (copy)" → "Senior PM (copy 2)" → … */
const nextCopyName = (name: string, taken: Set<string>): string => {
  const first = `${name} (copy)`;
  if (!taken.has(first)) return first;

  for (let n = 2; n < taken.size + 3; n += 1) {
    const candidate = `${name} (copy ${n})`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${name} (copy ${Date.now()})`;
};

/**
 * Owns the resume index — the list of resumes plus their names and timestamps —
 * and every operation that changes it. It sits above the router so the list
 * screen and the editor share one copy: renaming a resume from the editor's
 * title bar updates the card behind it without a reload.
 *
 * Resume *content* is deliberately not held here. Each document is loaded by
 * the editor route for the one id it is showing, which keeps a keystroke's
 * write scoped to a single storage key instead of re-serializing the library.
 */
export const ResumeLibraryProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [resumes, setResumes] = useState<ResumeSummary[]>(() => loadLibrary());
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Every operation below reads the list through this ref rather than closing
   * over `resumes`, which keeps them all reference-stable. That matters most
   * for `saveResume`: the editor auto-saves from an effect, and a `saveResume`
   * whose identity changed on each of its own index writes would re-trigger
   * that effect and save in a loop. Keeping the ref in step inside
   * `commitIndex` (not just on render) also makes two mutations in one tick
   * compose correctly.
   */
  const resumesRef = useRef(resumes);

  /**
   * Run a mutation that touches storage, surfacing a failed write instead of
   * letting it pass silently — a dropped write means the user loses the change
   * at their next reload, and nothing else in the app would ever tell them.
   */
  const attempt = useCallback(<T,>(action: () => T): T | null => {
    try {
      const result = action();
      setSaveError(null);
      return result;
    } catch (error) {
      if (error instanceof ResumeStorageError) {
        setSaveError(error.message);
        return null;
      }
      throw error;
    }
  }, []);

  /** Write the index and mirror it into state, keeping the list's sort order. */
  const commitIndex = useCallback((next: ResumeSummary[]): ResumeSummary[] => {
    saveIndex(next);
    const sorted = sortByRecency(next);
    resumesRef.current = sorted;
    setResumes(sorted);
    return sorted;
  }, []);

  // A second tab may have added or deleted a resume while this one sat idle.
  // Re-reading on focus is not live sync, but it stops the list from showing a
  // resume that is no longer there.
  useEffect(() => {
    const refresh = () => {
      const fresh = loadLibrary();
      resumesRef.current = fresh;
      setResumes(fresh);
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const createResume = useCallback(
    (options: CreateResumeOptions = {}): ResumeSummary | null =>
      attempt(() => {
        const now = Date.now();
        const summary: ResumeSummary = {
          id: createResumeId(),
          name: options.name?.trim() || UNTITLED_RESUME_NAME,
          createdAt: now,
          updatedAt: now,
        };

        const base = createDocument(options.settings);
        saveDocument(summary.id, {
          resume: options.resume ?? base.resume,
          settings: options.settings ?? base.settings,
        });
        commitIndex([...resumesRef.current, summary]);

        return summary;
      }),
    [attempt, commitIndex]
  );

  const duplicateResume = useCallback(
    (id: string): ResumeSummary | null =>
      attempt(() => {
        const current = resumesRef.current;
        const source = current.find((resume) => resume.id === id);
        const document = readDocument(id);
        if (!source || !document) return null;

        const now = Date.now();
        const summary: ResumeSummary = {
          id: createResumeId(),
          name: nextCopyName(
            source.name,
            new Set(current.map((resume) => resume.name))
          ),
          createdAt: now,
          updatedAt: now,
        };

        saveDocument(summary.id, document);
        commitIndex([...current, summary]);
        // The copy renders identically, so hand it the original's thumbnail
        // rather than making its card sit blank while a duplicate re-renders.
        void copyThumbnail(id, summary.id);

        return summary;
      }),
    [attempt, commitIndex]
  );

  const renameResume = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      // An empty title reverts rather than committing a nameless card.
      if (!trimmed) return;

      attempt(() =>
        commitIndex(
          resumesRef.current.map((resume) =>
            resume.id === id
              ? { ...resume, name: trimmed, updatedAt: Date.now() }
              : resume
          )
        )
      );
    },
    [attempt, commitIndex]
  );

  const deleteResume = useCallback(
    (id: string) => {
      attempt(() => {
        commitIndex(resumesRef.current.filter((resume) => resume.id !== id));
        removeDocument(id);
        void deleteThumbnail(id);
      });
    },
    [attempt, commitIndex]
  );

  const saveResume = useCallback(
    (id: string, document: ResumeDocument) => {
      attempt(() => {
        saveDocument(id, document);
        commitIndex(
          resumesRef.current.map((resume) =>
            resume.id === id ? { ...resume, updatedAt: Date.now() } : resume
          )
        );
      });
    },
    [attempt, commitIndex]
  );

  const rememberSettings = useCallback((settings: ResumeSettings) => {
    try {
      saveDefaultSettings(settings);
    } catch (error) {
      // Only affects what the *next* new resume starts as. Not worth a banner.
      console.error('Could not remember the default resume settings:', error);
    }
  }, []);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  const value = useMemo(
    () => ({
      resumes,
      createResume,
      duplicateResume,
      renameResume,
      deleteResume,
      saveResume,
      rememberSettings,
      saveError,
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
      dismissSaveError,
    ]
  );

  return (
    <resumeLibraryContext.Provider value={value}>
      {children}
    </resumeLibraryContext.Provider>
  );
};
