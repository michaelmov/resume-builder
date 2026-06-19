import React, { useRef, useCallback } from 'react';

import { fromJsonResume } from '../utils/jsonresume';

import { useResume } from './useResume';

export const useJsonImport = () => {
  const { updateResume } = useResume();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonContent = e.target?.result as string;
            // Validate against the JSON Resume schema and normalize into the
            // app's internal model (string lists -> { value }, dates kept as
            // strings, isPresent derived from a missing endDate).
            const resumeData = fromJsonResume(JSON.parse(jsonContent));
            updateResume(resumeData);
          } catch (error) {
            console.error('Error importing JSON resume:', error);
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
  };
};
