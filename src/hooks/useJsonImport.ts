import { useCallback, useState } from 'react';

import { Resume } from '../types/resume.model';
import {
  fromJsonResume,
  readResumeDocumentMeta,
  ResumeDocumentMeta,
} from '../utils/jsonresume';

export interface ImportError {
  /** Short, human-readable explanation of what went wrong. */
  message: string;
  /** Raw parser/validation detail, shown separately for troubleshooting. */
  detail?: string;
}

/** A file that parsed cleanly, ready for the caller to do something with. */
export interface ImportedResume {
  resume: Resume;
  /** This app's own name/settings, when the file came from one of its exports. */
  meta: ResumeDocumentMeta;
  /** Without the extension — the last resort for naming a new resume. */
  fileName: string;
}

/**
 * `fromJsonResume` throws messages shaped "summary — detail" (see
 * jsonresume.ts). Split them so the dialog can show the human-readable part
 * and the raw validation detail separately.
 */
const splitErrorMessage = (message: string): ImportError => {
  const [summary, detail] = message.split(' — ');
  return detail ? { message: summary, detail } : { message: summary };
};

const readFileAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const baseName = (fileName: string): string =>
  fileName.replace(/\.json$/i, '').trim();

/**
 * What to call an imported resume: the name this app exported, then the
 * person's own name, then the file it arrived in. A file dropped from another
 * JSON Resume tool has none of the first, so the filename is what stops a card
 * from landing in the list called "Untitled resume".
 */
export const nameForImport = (imported: ImportedResume): string =>
  imported.meta.name?.trim() ||
  imported.resume.basics?.name?.trim() ||
  imported.fileName ||
  'Imported resume';

/**
 * Reads and validates a JSON Resume file. It deliberately stops at "parsed
 * successfully" and hands the result back rather than committing it: the same
 * file means "add a resume" on the list screen and "overwrite this one" in the
 * editor, and only the caller knows which. Errors are surfaced as state rather
 * than thrown so the dialog can render them beside the dropzone that caused
 * them.
 */
export const useJsonImport = () => {
  const [importError, setImportError] = useState<ImportError | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  const showImportError = useCallback((error: ImportError) => {
    setImportError(error);
  }, []);

  /** Resolves the parsed resume, or `null` once an error has been surfaced. */
  const readResumeFile = useCallback(
    async (file: File): Promise<ImportedResume | null> => {
      setImportError(null);
      setIsImporting(true);

      try {
        let contents: string;
        try {
          contents = await readFileAsText(file);
        } catch (error) {
          console.error('Error reading resume file:', error);
          setImportError({
            message: "This file couldn't be read from your device.",
            detail: error instanceof Error ? error.message : undefined,
          });
          return null;
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(contents);
        } catch (error) {
          console.error('Error parsing JSON resume file:', error);
          setImportError({
            message: "This file isn't valid JSON, so it couldn't be imported.",
            detail: error instanceof Error ? error.message : undefined,
          });
          return null;
        }

        try {
          // Validate against the JSON Resume schema and normalize into the
          // app's internal model (string lists -> { value }, dates kept as
          // strings, isPresent derived from a missing endDate).
          return {
            resume: fromJsonResume(parsedJson),
            meta: readResumeDocumentMeta(parsedJson),
            fileName: baseName(file.name),
          };
        } catch (error) {
          console.error('Error importing JSON resume:', error);
          setImportError(
            error instanceof Error
              ? splitErrorMessage(error.message)
              : {
                  message: 'This file could not be read as a JSON Resume file.',
                }
          );
          return null;
        }
      } finally {
        setIsImporting(false);
      }
    },
    []
  );

  return {
    readResumeFile,
    isImporting,
    importError,
    showImportError,
    clearImportError,
  };
};
