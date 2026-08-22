import { Alert, Box, CloseButton } from '@chakra-ui/react';
import { FC } from 'react';

import { useResumeLibrary } from '../hooks/useResumeLibrary';

/**
 * Surfaces a failed write. Everything in this app auto-saves with no Save
 * button, so a write that fails silently is invisible until the user reloads
 * and finds their work gone — this is the only thing that ever tells them.
 *
 * Floats over both pages rather than occupying layout, and stays until it is
 * dismissed: the next successful save clears it on its own.
 */
export const SaveErrorBanner: FC = () => {
  const { saveError, dismissSaveError } = useResumeLibrary();

  if (!saveError) return null;

  return (
    <Box
      position="fixed"
      bottom={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex="toast"
      maxWidth="32rem"
      width="calc(100% - 2rem)"
    >
      <Alert.Root status="error" alignItems="flex-start" shadow="lg">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Changes weren&apos;t saved</Alert.Title>
          <Alert.Description>{saveError}</Alert.Description>
        </Alert.Content>
        <CloseButton
          size="sm"
          variant="ghost"
          aria-label="Dismiss"
          onClick={dismissSaveError}
        />
      </Alert.Root>
    </Box>
  );
};
