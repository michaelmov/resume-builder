import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { HiCheck, HiChevronDown, HiOutlineTemplate } from 'react-icons/hi';

import { templates } from '../../templates';

interface TemplateMenuProps {
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
}

const TemplateMenu = ({
  selectedTemplateId,
  onTemplateChange,
}: TemplateMenuProps) => {
  const selected =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button size="sm" colorPalette="gray" variant="subtle">
          <HiOutlineTemplate size={18} />
          {selected.name}
          <HiChevronDown size={18} />
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
