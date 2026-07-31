import { useCallback, useState } from 'react';

import { fromJsonResume } from '../utils/jsonresume';

import { useResume } from './useResume';

export interface ImportError {
  /** Short, human-readable explanation of what went wrong. */
  message: string;
  /** Raw parser/validation detail, shown separately for troubleshooting. */
  detail?: string;
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

/**
 * Reads a JSON Resume file and replaces the whole store with it. Errors are
 * surfaced as state (rather than thrown) so the import dialog can render them
 * next to the dropzone that produced them.
 */
export const useJsonImport = () => {
  const { updateResume } = useResume();
  const [importError, setImportError] = useState<ImportError | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  const showImportError = useCallback((error: ImportError) => {
    setImportError(error);
  }, []);

  /** Resolves `true` when the resume was imported, `false` on any failure. */
  const importFile = useCallback(
    async (file: File): Promise<boolean> => {
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
          return false;
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
          return false;
        }

        try {
          // Validate against the JSON Resume schema and normalize into the
          // app's internal model (string lists -> { value }, dates kept as
          // strings, isPresent derived from a missing endDate).
          updateResume(fromJsonResume(parsedJson));
          return true;
        } catch (error) {
          console.error('Error importing JSON resume:', error);
          setImportError(
            error instanceof Error
              ? splitErrorMessage(error.message)
              : {
                  message: 'This file could not be read as a JSON Resume file.',
                }
          );
          return false;
        }
      } finally {
        setIsImporting(false);
      }
    },
    [updateResume]
  );

  return {
    importFile,
    isImporting,
    importError,
    showImportError,
    clearImportError,
  };
};
