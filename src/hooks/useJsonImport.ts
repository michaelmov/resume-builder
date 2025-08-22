import React, { useRef, useCallback } from 'react';

import { Resume } from '../types/resume.model';

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
        reader.onload = e => {
          try {
            const jsonContent = e.target?.result as string;
            const resumeData: Resume = JSON.parse(jsonContent);
            updateResume(resumeData);
          } catch (error) {
            console.error('Error parsing JSON file:', error);
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
