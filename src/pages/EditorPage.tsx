import { Box, Flex, IconButton } from '@chakra-ui/react';
import { FC, useCallback, useMemo, useState } from 'react';
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
import { ResumeSummary } from '../types/resume-library';
import { readDocument } from '../utils/resume-storage';

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
        width={{ base: '300px', xl: '450px', '2xl': '600px' }}
        maxWidth="600px"
        bg="bg.subtle"
        borderRightWidth="1px"
        borderColor="border"
        height="100%"
        maxHeight="100%"
        overflow="auto"
        transition="all 0.3s ease-in-out"
        transform={isEditorCollapsed ? 'translateX(-100%)' : 'translateX(0)'}
        marginRight={
          isEditorCollapsed
            ? { base: '-300px', xl: '-450px', '2xl': '-600px' }
            : '0'
        }
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

  // Read once per id — from here on the provider owns this resume's content.
  const document = useMemo(() => (id ? readDocument(id) : undefined), [id]);
  const summary = resumes.find((resume) => resume.id === id);

  if (!id || !document || !summary) {
    return <Navigate to="/" replace state={{ missingResume: true }} />;
  }

  return (
    // Keyed by id so switching resumes remounts the store rather than trying to
    // reconcile one resume's reducer state onto another's.
    <ResumeProvider key={id} id={id} document={document}>
      <EditorLayout summary={summary} focusName={state?.focusName ?? false} />
    </ResumeProvider>
  );
};
