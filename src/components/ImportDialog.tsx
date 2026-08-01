import {
  Alert,
  Box,
  Button,
  Clipboard,
  FileUpload,
  Icon,
  Link,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FC, useCallback } from 'react';
import {
  HiOutlineExternalLink,
  HiOutlineSparkles,
  HiOutlineUpload,
} from 'react-icons/hi';

import { useJsonImport } from '../hooks/useJsonImport';
import { HANDOFF_PROMPT } from '../utils/handoff-prompt';

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from './ui/Dialog';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Matched against both the MIME type and the file extension. */
const ACCEPTED_FILE_TYPES = { 'application/json': ['.json'] };

/**
 * The dropzone imports on pick and never holds onto a file, so its accepted
 * list is pinned to a stable empty array. Letting it retain the file instead
 * would make re-picking that same file after a failed import get rejected as a
 * duplicate rather than re-running the import.
 */
const NO_ACCEPTED_FILES: File[] = [];

/**
 * The route for resumes that aren't JSON Resume files yet. Converting a PDF or
 * Word document is left to an LLM rather than parsed here: the user runs this
 * prompt with their resume attached, then drops the JSON it returns onto the
 * dropzone above — the ordinary import path, unchanged.
 */
const HandoffSection: FC = () => (
  <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
    <Stack gap={3}>
      <Stack gap={1}>
        <Text fontWeight="medium" display="flex" alignItems="center" gap={2}>
          <Icon as={HiOutlineSparkles} color="brand.fg" />
          Have another format?
        </Text>
        <Text fontSize="sm" color="fg.muted">
          A PDF or Word resume can be converted in one step by an LLM. Copy the
          prompt below, paste it into the assistant of your choice, and attach
          your resume. Download the <code>resume.json</code> it returns — or
          save its reply as a <code>.json</code> file — then drop it above.
        </Text>
      </Stack>

      <Clipboard.Root value={HANDOFF_PROMPT}>
        <Clipboard.Trigger asChild>
          <Button variant="surface" size="sm" alignSelf="flex-start">
            <Clipboard.Indicator />
            Copy LLM prompt
          </Button>
        </Clipboard.Trigger>
      </Clipboard.Root>
    </Stack>
  </Box>
);

export const ImportDialog: FC<ImportDialogProps> = ({ open, onOpenChange }) => {
  const {
    importFile,
    isImporting,
    importError,
    showImportError,
    clearImportError,
  } = useJsonImport();

  const handleFileAccept = useCallback(
    async ({ files }: FileUpload.FileAcceptDetails) => {
      const file = files[0];
      if (!file) return;

      if (await importFile(file)) onOpenChange(false);
    },
    [importFile, onOpenChange]
  );

  const handleFileReject = useCallback(
    ({ files }: FileUpload.FileRejectDetails) => {
      const rejected = files[0];
      if (!rejected) return;

      showImportError({
        message: rejected.errors.includes('FILE_INVALID_TYPE')
          ? // Don't dead-end them — the section below is exactly the fix.
            `"${rejected.file.name}" isn't a .json file. Convert it first using the prompt below, then import the JSON.`
          : `"${rejected.file.name}" couldn't be opened. Try picking the file again.`,
      });
    },
    [showImportError]
  );

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => {
        // Reopening should always start from a clean dropzone.
        if (!details.open) clearImportError();
        onOpenChange(details.open);
      }}
      placement="center"
      size="md"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import resume</DialogTitle>
        </DialogHeader>
        <DialogBody pb={6}>
          <Stack gap={4}>
            <Text fontSize="sm" color="fg.muted">
              Your file needs to follow the{' '}
              <Link
                href="https://jsonresume.org/"
                target="_blank"
                rel="noreferrer"
                color="brand.fg"
                fontWeight="medium"
                textDecoration="underline"
              >
                JSON Resume
                <Icon as={HiOutlineExternalLink} />
              </Link>{' '}
              schema — the open standard this builder exports to. Importing
              replaces everything currently in the editor.
            </Text>

            {/*
              Kept inside the dialog body so its state unmounts on close — a
              store hoisted out here would outlive the dialog and reject an
              already-imported file as a duplicate the next time it's opened.
            */}
            <FileUpload.Root
              accept={ACCEPTED_FILE_TYPES}
              acceptedFiles={NO_ACCEPTED_FILES}
              maxFiles={1}
              disabled={isImporting}
              onFileAccept={handleFileAccept}
              onFileReject={handleFileReject}
              alignItems="stretch"
            >
              <FileUpload.HiddenInput />
              <FileUpload.Dropzone
                width="full"
                minH={40}
                borderStyle="dashed"
                _hover={{ borderColor: 'brand.border', bg: 'brand.subtle' }}
              >
                {isImporting ? (
                  <Spinner size="lg" color="brand.fg" />
                ) : (
                  <Icon as={HiOutlineUpload} boxSize={7} color="fg.muted" />
                )}
                <FileUpload.DropzoneContent>
                  <Box fontWeight="medium">
                    {isImporting
                      ? 'Importing…'
                      : 'Drag and drop your resume here'}
                  </Box>
                  <Box color="fg.muted" fontSize="sm">
                    or click to browse — .json files only
                  </Box>
                </FileUpload.DropzoneContent>
              </FileUpload.Dropzone>
            </FileUpload.Root>

            {importError && (
              <Alert.Root status="error" alignItems="flex-start">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Couldn&apos;t import resume</Alert.Title>
                  <Alert.Description>
                    {importError.message}
                    {importError.detail && (
                      <Box
                        as="pre"
                        mt={2}
                        px={2}
                        py={1}
                        bg="colorPalette.subtle"
                        borderWidth="1px"
                        borderColor="colorPalette.muted"
                        rounded="md"
                        fontFamily="mono"
                        fontSize="xs"
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                        maxH="32"
                        overflowY="auto"
                      >
                        {importError.detail}
                      </Box>
                    )}
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <HandoffSection />
          </Stack>
        </DialogBody>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};
