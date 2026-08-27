import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { HiCheck, HiChevronDown } from 'react-icons/hi';

import { accents, getAccent } from '../../templates/accents';

interface AccentMenuProps {
  /** Explicit accent id, or null when following the template default ("Auto"). */
  selectedAccentId: string | null;
  /** The accent actually in effect (resolves "Auto" to a concrete palette). */
  resolvedAccentId: string;
  onAccentChange: (accentId: string | null) => void;
  /** Disabled for monochrome templates that have no secondary color. */
  disabled?: boolean;
  /** Drop the label and chevron — the mobile header has no room for them. */
  compact?: boolean;
}

const Dot = ({ color }: { color: string }) => (
  <Box
    width="14px"
    height="14px"
    borderRadius="full"
    backgroundColor={color}
    borderWidth="1px"
    borderColor="border.emphasized"
    flexShrink={0}
  />
);

const AccentMenu = ({
  selectedAccentId,
  resolvedAccentId,
  onAccentChange,
  disabled = false,
  compact = false,
}: AccentMenuProps) => {
  const resolved = getAccent(resolvedAccentId);

  const label = disabled || selectedAccentId === null ? 'Auto' : resolved.name;

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          colorPalette="gray"
          variant="subtle"
          disabled={disabled}
          px={compact ? 2 : undefined}
          aria-label={compact ? `Accent color: ${label}` : undefined}
          title={
            disabled
              ? 'This template is monochrome — no accent color'
              : compact
                ? `Accent color: ${label}`
                : undefined
          }
        >
          <Dot color={disabled ? 'fg.subtle' : resolved.swatch} />
          {!compact && (
            <>
              {label}
              <HiChevronDown size={18} />
            </>
          )}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="auto" onClick={() => onAccentChange(null)}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Dot color={resolved.swatch} />
                Auto
                {selectedAccentId === null && (
                  <Box as="span" marginLeft="auto" display="flex">
                    <HiCheck size={16} />
                  </Box>
                )}
              </Box>
            </Menu.Item>
            {accents.map((accent) => (
              <Menu.Item
                key={accent.id}
                value={accent.id}
                onClick={() => onAccentChange(accent.id)}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Dot color={accent.swatch} />
                  {accent.name}
                  {accent.id === selectedAccentId && (
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

export default AccentMenu;
