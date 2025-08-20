import { ActionBar, Button, Portal } from '@chakra-ui/react';
import { FC } from 'react';
import { HiCheck } from 'react-icons/hi';
import { useGlobalForm } from '../context/global-form.context';

export const GlobalActionBar: FC = () => {
  const { hasAnyDirtySection, saveAllSections, getDirtySections } =
    useGlobalForm();

  if (!hasAnyDirtySection) {
    return null;
  }

  const dirtySections = getDirtySections();
  const sectionCount = dirtySections.length;

  return (
    <ActionBar.Root open={hasAnyDirtySection}>
      <ActionBar.Positioner>
        <ActionBar.Content>
          <ActionBar.SelectionTrigger>
            {sectionCount} section{sectionCount > 1 ? 's' : ''} with unsaved
            changes
          </ActionBar.SelectionTrigger>
          <ActionBar.Separator />
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
    </ActionBar.Root>
  );
};
