import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { HiCheck, HiChevronDown, HiOutlineTemplate } from 'react-icons/hi';

import { templates } from '../../templates';

interface TemplateMenuProps {
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  /** Drop the label and chevron — the mobile header has no room for them. */
  compact?: boolean;
}

const TemplateMenu = ({
  selectedTemplateId,
  onTemplateChange,
  compact = false,
}: TemplateMenuProps) => {
  const selected =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          colorPalette="gray"
          variant="subtle"
          px={compact ? 2 : undefined}
          aria-label={compact ? `Template: ${selected.name}` : undefined}
          title={compact ? `Template: ${selected.name}` : undefined}
        >
          <HiOutlineTemplate size={18} />
          {!compact && (
            <>
              {selected.name}
              <HiChevronDown size={18} />
            </>
          )}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {templates.map((template) => (
              <Menu.Item
                key={template.id}
                value={template.id}
                onClick={() => onTemplateChange(template.id)}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {template.name}
                  {template.id === selected.id && (
                    <Box as="span" marginLeft="auto" display="flex">
                      <HiCheck size={16} />
                    </Box>
                  )}
                </Box>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default TemplateMenu;
