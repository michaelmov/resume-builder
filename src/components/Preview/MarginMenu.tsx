import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { HiCheck, HiChevronDown } from 'react-icons/hi';
import { TbBoxMargin } from 'react-icons/tb';

import { margins } from '../../templates/margins';

interface MarginMenuProps {
  selectedMarginId: string;
  onMarginChange: (marginId: string) => void;
  /** Drop the label and chevron — the mobile header has no room for them. */
  compact?: boolean;
}

const MarginMenu = ({
  selectedMarginId,
  onMarginChange,
  compact = false,
}: MarginMenuProps) => {
  const selected =
    margins.find((margin) => margin.id === selectedMarginId) ?? margins[0];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          colorPalette="gray"
          variant="subtle"
          px={compact ? 2 : undefined}
          aria-label={compact ? `Margins: ${selected.name}` : undefined}
          title={compact ? `Margins: ${selected.name}` : undefined}
        >
          <TbBoxMargin size={18} />
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
