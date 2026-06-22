import { Box, Button, Menu, Portal, Text } from '@chakra-ui/react';
import { FC, useMemo } from 'react';
import { HiPlus } from 'react-icons/hi';

import {
  SECTION_CATEGORIES,
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
  SectionTypes,
} from '../../types/resume.model';

import { useOpenSection } from './OpenSectionContext';

interface AddSectionMenuProps {
  /** Section types already on the resume — hidden from the picker. */
  activeSections: SectionTypes[];
  /** Stage adding a section type to the resume. */
  onAdd: (section: SectionTypes) => void;
}

export const AddSectionMenu: FC<AddSectionMenuProps> = ({
  activeSections,
  onAdd,
}) => {
  const openSection = useOpenSection();

  // Only offer categories that still have at least one un-added section.
  const availableCategories = useMemo(() => {
    const active = new Set(activeSections);
    return SECTION_CATEGORIES.map((category) => ({
      label: category.label,
      sections: category.sections.filter((section) => !active.has(section)),
    })).filter((category) => category.sections.length > 0);
  }, [activeSections]);

  const allAdded = availableCategories.length === 0;

  const handleSelect = (section: SectionTypes) => {
    onAdd(section);
    // Expand the freshly added section so it's ready to fill in.
    openSection(section);
  };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          width="100%"
          size="sm"
          variant="outline"
          colorPalette="purple"
          disabled={allAdded}
          borderStyle="dashed"
        >
          <HiPlus />
          {allAdded ? 'All sections added' : 'Add Section'}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="16rem" maxH="70vh" overflowY="auto">
            {availableCategories.map((category, index) => (
              <Menu.ItemGroup key={category.label}>
                <Menu.ItemGroupLabel
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="gray.500"
                >
                  {category.label}
                </Menu.ItemGroupLabel>
                {category.sections.map((section) => (
                  <Menu.Item
                    key={section}
                    value={section}
                    onClick={() => handleSelect(section)}
                    py={2}
                  >
                    <Box>
                      <Text fontWeight="medium">
                        {SECTION_TITLES[section]}
                      </Text>
                      {SECTION_DESCRIPTIONS[section] && (
                        <Text fontSize="xs" color="gray.500">
                          {SECTION_DESCRIPTIONS[section]}
                        </Text>
                      )}
                    </Box>
                  </Menu.Item>
                ))}
                {index < availableCategories.length - 1 && <Menu.Separator />}
              </Menu.ItemGroup>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
