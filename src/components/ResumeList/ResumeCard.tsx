import {
  Box,
  chakra,
  Flex,
  IconButton,
  Menu,
  Portal,
  Text,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { BsFiletypeJson, BsFiletypePdf, BsFiletypeTxt } from 'react-icons/bs';
import {
  HiOutlineChevronRight,
  HiOutlineDotsVertical,
  HiOutlineDownload,
  HiOutlineDuplicate,
  HiOutlinePencil,
  HiOutlineTrash,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import { ResumeSummary } from '../../types/resume-library';
import { formatRelativeTime } from '../../utils/date-utilities';
import { downloadBlob, resumeExportFileName } from '../../utils/download';
import { exportResumeAsJson } from '../../utils/json-export';
import { renderResumePdf } from '../../utils/render-resume-pdf';
import { readDocument } from '../../utils/resume-repository';
import { exportResumeAsText } from '../../utils/text-export';

import { ResumeThumbnail } from './ResumeThumbnail';

interface ResumeCardProps {
  summary: ResumeSummary;
  /** Opens the rename dialog; the list page owns it, like the delete one. */
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ResumeCard = ({
  summary,
  onRename,
  onDuplicate,
  onDelete,
}: ResumeCardProps) => {
  const navigate = useNavigate();

  const open = useCallback(
    () => navigate(`/editor/${summary.id}`),
    [navigate, summary.id]
  );

  const download = useCallback(
    async (format: 'pdf' | 'json' | 'txt') => {
      const document = await readDocument(summary.id);
      if (!document) return;

      const fileName = resumeExportFileName(summary.name, document.resume);

      if (format === 'json') {
        exportResumeAsJson(document.resume, fileName, {
          name: summary.name,
          settings: document.settings,
        });
        return;
      }
      if (format === 'txt') {
        exportResumeAsText(document.resume, fileName);
        return;
      }

      try {
        downloadBlob(await renderResumePdf(document), `${fileName}.pdf`);
      } catch (error) {
        console.error('Could not export the resume as a PDF:', error);
      }
    },
    [summary.id, summary.name]
  );

  return (
    <Box
      position="relative"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      rounded="lg"
      overflow="hidden"
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      // The ring goes on the card, not the stretched button, whose own box is
      // only the name row. Keyed to that button alone so focusing the menu
      // trigger doesn't light up the whole card.
      css={{
        '&:has([data-card-open]:focus-visible)': {
          outline: '2px solid',
          outlineColor: 'brand.solid',
          outlineOffset: '2px',
        },
      }}
    >
      <ResumeThumbnail summary={summary} />

      <Flex
        align="center"
        justify="space-between"
        gap={1}
        px={3}
        py={2}
        borderTopWidth="1px"
        borderColor="border"
      >
        {/*
          The whole card opens the resume: this button's `::before` stretches
          over the card, and the menu trigger sits above it on its own layer.
          A button can't wrap the card instead — the menu trigger would be a
          button nested inside a button.
        */}
        <chakra.button
          type="button"
          onClick={open}
          flex={1}
          minWidth={0}
          textAlign="left"
          cursor="pointer"
          outline="none"
          _before={{ content: '""', position: 'absolute', inset: 0 }}
          data-card-open=""
          aria-label={`Open ${summary.name}`}
        >
          <Text
            as="span"
            display="block"
            fontSize="sm"
            fontWeight="medium"
            truncate
          >
            {summary.name}
          </Text>
          <Text as="span" display="block" fontSize="xs" color="fg.muted">
            Edited {formatRelativeTime(summary.updatedAt)}
          </Text>
        </chakra.button>

        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette="gray"
              color="fg.muted"
              position="relative"
              zIndex={1}
              aria-label={`Actions for ${summary.name}`}
            >
              <HiOutlineDotsVertical />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="rename" onClick={onRename}>
                  <HiOutlinePencil />
                  Rename
                </Menu.Item>
                <Menu.Item value="duplicate" onClick={onDuplicate}>
                  <HiOutlineDuplicate />
                  Duplicate
                </Menu.Item>

                {/* Nested so the card menu doesn't grow to six flat items. */}
                <Menu.Root
                  positioning={{ placement: 'right-start', gutter: 2 }}
                >
                  <Menu.TriggerItem>
                    <HiOutlineDownload />
                    Download
                    {/* Chakra styles the item but adds no affordance of its
                        own, so the chevron is what marks it as a submenu. */}
                    <HiOutlineChevronRight
                      style={{ marginInlineStart: 'auto' }}
                    />
                  </Menu.TriggerItem>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item
                          value="download-pdf"
                          onClick={() => download('pdf')}
                        >
                          <BsFiletypePdf />
                          PDF
                        </Menu.Item>
                        <Menu.Item
                          value="download-json"
                          onClick={() => download('json')}
                        >
                          <BsFiletypeJson />
                          JSON
                        </Menu.Item>
                        <Menu.Item
                          value="download-txt"
                          onClick={() => download('txt')}
                        >
                          <BsFiletypeTxt />
                          Plain text
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>

                <Menu.Separator />
                <Menu.Item
                  value="delete"
                  color="fg.error"
                  _hover={{ bg: 'bg.error', color: 'fg.error' }}
                  onClick={onDelete}
                >
                  <HiOutlineTrash />
                  Delete
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>
    </Box>
  );
};
