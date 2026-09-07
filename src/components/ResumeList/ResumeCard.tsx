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
import { EditableTitle } from '../ui/EditableTitle';

import { ResumeThumbnail } from './ResumeThumbnail';

interface ResumeCardProps {
  summary: ResumeSummary;
  onRename: (name: string) => void;
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
    <Box>
      {/*
        The thumbnail is the click target rather than the whole card: the name
        underneath is an editable field and the menu is a button, so making
        their container navigate would fight both of them.
      */}
      <chakra.button
        type="button"
        onClick={open}
        display="block"
        width="100%"
        textAlign="left"
        rounded="md"
        cursor="pointer"
        transition="transform 0.15s ease, box-shadow 0.15s ease"
        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'brand.solid',
          outlineOffset: '2px',
        }}
        aria-label={`Open ${summary.name}`}
      >
        <ResumeThumbnail summary={summary} />
      </chakra.button>

      <Flex align="center" justify="space-between" mt={2} gap={1}>
        <Box minWidth={0} flex={1}>
          {/* Renaming is the title's own job — click it, or use its pencil.
              A menu item would only be a second way into the same field. */}
          <EditableTitle
            value={summary.name}
            onCommit={onRename}
            label={`Rename ${summary.name}`}
            maxWidth="100%"
          />
          <Text fontSize="xs" color="fg.muted" pl={2}>
            Edited {formatRelativeTime(summary.updatedAt)}
          </Text>
        </Box>

        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette="gray"
              color="fg.muted"
              aria-label={`Actions for ${summary.name}`}
            >
              <HiOutlineDotsVertical />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
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
