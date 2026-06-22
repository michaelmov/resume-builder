import { ActionBar, Button, Portal } from '@chakra-ui/react';
import { FC } from 'react';
import { HiCheck, HiOutlineX } from 'react-icons/hi';

import { useGlobalForm } from '../context/GlobalFormContext';

export const GlobalActionBar: FC = () => {
  const {
    hasAnyDirtySection,
    saveAllSections,
    discardAllSections,
    getDirtySections,
  } = useGlobalForm();

  if (!hasAnyDirtySection) {
    return null;
  }

  const sectionCount = getDirtySections().length;

  return (
    <ActionBar.Root open={hasAnyDirtySection} portalled={false}>
      <Portal>
        <ActionBar.Positioner zIndex={1000}>
          <ActionBar.Content justifyContent="start">
            <ActionBar.SelectionTrigger>
              {sectionCount} section{sectionCount > 1 ? 's' : ''} with unsaved
              changes
            </ActionBar.SelectionTrigger>
            <ActionBar.Separator />
            <Button
              variant="ghost"
              colorPalette="gray"
              size="sm"
              onClick={discardAllSections}
            >
              <HiOutlineX />
              Discard
            </Button>
            <Button
              variant="solid"
              colorPalette="purple"
              size="sm"
              onClick={saveAllSections}
            >
              <HiCheck />
              Save All Changes
            </Button>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
};
