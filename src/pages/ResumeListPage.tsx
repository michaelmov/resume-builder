import {
  Alert,
  Box,
  Button,
  CloseButton,
  EmptyState,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { DragEvent, FC, useCallback, useState } from 'react';
import {
  HiOutlineDocumentAdd,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineUpload,
} from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';

import { Footer } from '../components/Footer';
import { ImportDialog } from '../components/ImportDialog';
import { Navbar } from '../components/Navbar';
import { DeleteResumeDialog } from '../components/ResumeList/DeleteResumeDialog';
import { ResumeCard } from '../components/ResumeList/ResumeCard';
import { SaveErrorBanner } from '../components/SaveErrorBanner';
import {
  ImportedResume,
  nameForImport,
  useJsonImport,
} from '../hooks/useJsonImport';
import { useResumeLibrary } from '../hooks/useResumeLibrary';
import { ResumeSummary } from '../types/resume-library';

import { EditorLocationState } from './EditorPage';

/** Router state set when the editor bounces an id it couldn't find. */
interface ListLocationState {
  missingResume?: boolean;
}

export const ResumeListPage: FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: ListLocationState | null };
  const { resumes, createResume, duplicateResume, renameResume, deleteResume } =
    useResumeLibrary();

  // The dialog owns the button path; this instance is only for files dropped
  // straight onto the grid, so its errors render above the grid that took them.
  const { readResumeFile, importError, showImportError, clearImportError } =
    useJsonImport();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ResumeSummary | null>(
    null
  );
  const [showMissingNotice, setShowMissingNotice] = useState(
    state?.missingResume ?? false
  );

  /** Land in the editor with the title bar open, so naming is the first act. */
  const openNew = useCallback(
    (summary: ResumeSummary | null, focusName: boolean) => {
      if (!summary) return;
      navigate(`/editor/${summary.id}`, {
        state: { focusName } satisfies EditorLocationState,
      });
    },
    [navigate]
  );

  const handleCreate = useCallback(
    async () => openNew(await createResume(), true),
    [createResume, openNew]
  );

  const handleImport = useCallback(
    async (imported: ImportedResume) => {
      openNew(
        await createResume({
          name: nameForImport(imported),
          resume: imported.resume,
          settings: imported.meta.settings,
        }),
        false
      );
    },
    [createResume, openNew]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDropTarget(false);

      const file = event.dataTransfer.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.json')) {
        showImportError({
          message: `"${file.name}" isn't a .json file. Use Import to convert another format first.`,
        });
        return;
      }

      const imported = await readResumeFile(file);
      if (imported) await handleImport(imported);
    },
    [handleImport, readResumeFile, showImportError]
  );

  const confirmDelete = useCallback(() => {
    if (pendingDelete) void deleteResume(pendingDelete.id);
    setPendingDelete(null);
  }, [deleteResume, pendingDelete]);

  return (
    <Flex height="100dvh" maxHeight="100dvh" overflow="hidden">
      <Box flexShrink={0} zIndex="banner">
        <Navbar>
          {/* Uncolored on purpose: it inherits the rail's `app.railFg`, the
              same color the theme and repo icons below it resolve to. */}
          <Icon as={HiOutlineDocumentText} boxSize={6} my={2} aria-hidden />
        </Navbar>
      </Box>

      <Box
        flex={1}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        bg="bg.subtle"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDropTarget(true);
        }}
        onDragLeave={(event) => {
          // Only when the pointer leaves the region entirely — dragging across
          // a child fires dragleave for the child on the way past.
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDropTarget(false);
          }
        }}
        onDrop={handleDrop}
        outline={isDropTarget ? '2px dashed' : undefined}
        outlineColor="brand.solid"
        outlineOffset="-8px"
      >
        {/* Flexes so the footer below it is pushed to the foot of the window
            when the grid is short, rather than floating under the cards. */}
        <Box
          flex={1}
          width="100%"
          maxWidth="80rem"
          mx="auto"
          px={{ base: 4, md: 8 }}
          py={8}
        >
          <Flex align="center" justify="space-between" gap={4} mb={6}>
            <Heading size="lg">Resumes</Heading>
            <Flex gap={2}>
              <Button
                variant="surface"
                colorPalette="gray"
                onClick={() => setIsImportOpen(true)}
              >
                <HiOutlineUpload />
                Import
              </Button>
              <Button colorPalette="brand" onClick={handleCreate}>
                <HiOutlinePlus />
                New resume
              </Button>
            </Flex>
          </Flex>

          {showMissingNotice && (
            <Alert.Root status="info" mb={6} alignItems="flex-start">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  That resume isn&apos;t in this browser — it may have been
                  deleted, or saved in a different browser. Resumes are stored
                  on this device only.
                </Alert.Description>
              </Alert.Content>
              <CloseButton
                size="sm"
                variant="ghost"
                aria-label="Dismiss"
                onClick={() => setShowMissingNotice(false)}
              />
            </Alert.Root>
          )}

          {importError && (
            <Alert.Root status="error" mb={6} alignItems="flex-start">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Couldn&apos;t import resume</Alert.Title>
                <Alert.Description>{importError.message}</Alert.Description>
              </Alert.Content>
              <CloseButton
                size="sm"
                variant="ghost"
                aria-label="Dismiss"
                onClick={clearImportError}
              />
            </Alert.Root>
          )}

          {resumes.length === 0 ? (
            <EmptyState.Root size="lg" py={16}>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <HiOutlineDocumentAdd />
                </EmptyState.Indicator>
                <EmptyState.Title>No resumes yet</EmptyState.Title>
                <EmptyState.Description>
                  Start a new resume, or bring in one you already have as a JSON
                  Resume file.
                </EmptyState.Description>
                <Flex gap={2} mt={4}>
                  <Button colorPalette="brand" onClick={handleCreate}>
                    <HiOutlinePlus />
                    New resume
                  </Button>
                  <Button
                    variant="surface"
                    colorPalette="gray"
                    onClick={() => setIsImportOpen(true)}
                  >
                    <HiOutlineUpload />
                    Import JSON
                  </Button>
                </Flex>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={6}>
              {resumes.map((summary) => (
                <ResumeCard
                  key={summary.id}
                  summary={summary}
                  onRename={(name) => renameResume(summary.id, name)}
                  onDuplicate={() => duplicateResume(summary.id)}
                  onDelete={() => setPendingDelete(summary)}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Footer />
      </Box>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
      />
      <DeleteResumeDialog
        resume={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <SaveErrorBanner />
    </Flex>
  );
};
