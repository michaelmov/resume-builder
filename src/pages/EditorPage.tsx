import { Box, Center, Flex, IconButton, Spinner } from '@chakra-ui/react';
import { FC, useCallback, useEffect, useState } from 'react';
import { HiOutlineViewGrid } from 'react-icons/hi';
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { Editor } from '../components/Editor/Editor';
import { Navbar, railButtonProps } from '../components/Navbar';
import { Preview } from '../components/Preview/Preview';
import { SaveErrorBanner } from '../components/SaveErrorBanner';
import { Tooltip } from '../components/ui/Tooltip';
import { ResumeProvider } from '../context/ResumeContext/ResumeContext';
import { useResumeLibrary } from '../hooks/useResumeLibrary';
import { ResumeDocument, ResumeSummary } from '../types/resume-library';
import { readDocument } from '../utils/resume-repository';

/** Router state set by the list when it creates a resume and navigates here. */
export interface EditorLocationState {
  /** Open the title bar in edit mode — a new resume is named, not left blank. */
  focusName?: boolean;
}

const EditorLayout: FC<{ summary: ResumeSummary; focusName: boolean }> = ({
  summary,
  focusName,
}) => {
  const navigate = useNavigate();
  const { renameResume } = useResumeLibrary();

  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  const handleRename = useCallback(
    (name: string) => renameResume(summary.id, name),
    [renameResume, summary.id]
  );

  return (
    <Flex height="100dvh" maxHeight="100dvh" overflow="hidden">
      {/* Navbar — remains while the editor slides */}
      <Box flexShrink={0} zIndex="banner">
        <Navbar>
          <Tooltip content="All resumes">
            <IconButton
              {...railButtonProps}
              aria-label="All resumes"
              onClick={() => navigate('/')}
            >
              <HiOutlineViewGrid />
            </IconButton>
          </Tooltip>
        </Navbar>
      </Box>

      {/* Editor Panel — slides out (keeping its width) when collapsed */}
      <Box
        width="600px"
        bg="bg.subtle"
        borderRightWidth="1px"
        borderColor="border"
        height="100%"
        maxHeight="100%"
        overflow="auto"
        transition="all 0.3s ease-in-out"
        transform={isEditorCollapsed ? 'translateX(-100%)' : 'translateX(0)'}
        marginRight={isEditorCollapsed ? '-600px' : '0'}
        flexShrink={0}
      >
        <Editor />
      </Box>

      {/* Preview Panel */}
      <Box
        flex={1}
        overflow="hidden"
        height="100%"
        maxHeight="100%"
        position="relative"
      >
        <Preview
          summary={summary}
          onRename={handleRename}
          focusName={focusName}
          onEditorCollapseChange={setIsEditorCollapsed}
          isEditorCollapsed={isEditorCollapsed}
        />
      </Box>

      <SaveErrorBanner />
    </Flex>
  );
};

/**
 * The `/editor/:id` route. It resolves the id to a stored resume before
 * mounting the provider, so a stale bookmark or a resume deleted in another tab
 * lands back on the list with an explanation rather than on a broken editor.
 */
export const EditorPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { resumes } = useResumeLibrary();
  const { state } = useLocation() as { state: EditorLocationState | null };

  /**
   * Three states, not two. Reading a resume is asynchronous, so "no document
   * yet" is the normal first render — treating that as "not found", the way a
   * synchronous read could, would bounce every visit straight back to the list.
   * `undefined` is still loading; `null` is genuinely missing.
   */
  const [document, setDocument] = useState<ResumeDocument | null | undefined>(
    undefined
  );

  // Read once per id — from here on the provider owns this resume's content.
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setDocument(undefined);

    void readDocument(id).then(
      (found) => {
        if (!cancelled) setDocument(found ?? null);
      },
      (error) => {
        console.error('Could not open the resume:', error);
        if (!cancelled) setDocument(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [id]);

  const summary = resumes.find((resume) => resume.id === id);

  if (!id || document === null) {
    return <Navigate to="/" replace state={{ missingResume: true }} />;
  }

  // A resume that exists but has no summary yet is the list subscription
  // lagging a just-created resume, not a missing one — wait rather than bounce.
  if (document === undefined || !summary) {
    return (
      <Center height="100dvh" bg="app.canvas">
        <Spinner size="lg" color="brand.fg" />
      </Center>
    );
  }

  return (
    // Keyed by id so switching resumes remounts the store rather than trying to
    // reconcile one resume's reducer state onto another's.
    <ResumeProvider key={id} id={id} document={document}>
      <EditorLayout summary={summary} focusName={state?.focusName ?? false} />
    </ResumeProvider>
  );
};
