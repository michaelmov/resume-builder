import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { HiCheck, HiChevronDown } from 'react-icons/hi';
import { TbBoxMargin } from 'react-icons/tb';

import { margins } from '../../templates/margins';

interface MarginMenuProps {
  selectedMarginId: string;
  onMarginChange: (marginId: string) => void;
}

const MarginMenu = ({ selectedMarginId, onMarginChange }: MarginMenuProps) => {
  const selected =
    margins.find((margin) => margin.id === selectedMarginId) ?? margins[0];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button size="sm" colorPalette="gray" variant="subtle">
          <TbBoxMargin size={18} />
          {selected.name}
          <HiChevronDown size={18} />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {margins.map((margin) => (
              <Menu.Item
                key={margin.id}
                value={margin.id}
                onClick={() => onMarginChange(margin.id)}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {margin.name}
                  {margin.id === selected.id && (
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

export default MarginMenu;
