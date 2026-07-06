import React, { useRef, useCallback, useState } from 'react';

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

export const useJsonImport = () => {
  const { updateResume } = useResume();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<ImportError | null>(null);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset so re-selecting the same file still fires onChange.
      event.target.value = '';
      if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const jsonContent = e.target?.result as string;
          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(jsonContent);
          } catch (error) {
            console.error('Error parsing JSON resume file:', error);
            setImportError({
              message: "This file isn't valid JSON, so it couldn't be imported.",
              detail: error instanceof Error ? error.message : undefined,
            });
            return;
          }

          try {
            // Validate against the JSON Resume schema and normalize into the
            // app's internal model (string lists -> { value }, dates kept as
            // strings, isPresent derived from a missing endDate).
            const resumeData = fromJsonResume(parsedJson);
            updateResume(resumeData);
          } catch (error) {
            console.error('Error importing JSON resume:', error);
            setImportError(
              error instanceof Error
                ? splitErrorMessage(error.message)
                : { message: 'This file could not be read as a JSON Resume file.' }
            );
          }
        };
        reader.readAsText(file);
      }
    },
    [updateResume]
  );

  return {
    fileInputRef,
    triggerFileInput,
    handleFileChange,
    importError,
    clearImportError,
  };
};
