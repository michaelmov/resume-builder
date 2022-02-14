import { BoxProps, Box } from '@chakra-ui/react';
import { FC, useEffect, useLayoutEffect, useRef } from 'react';
import { Previewer } from 'pagedjs/dist/paged.esm.js';
import styled from '@emotion/styled';
import { useResume } from '../../hooks/resume.hook';

const paged = new Previewer();

interface PaperProps extends BoxProps {
  pagemargin?: number;
}

const StyledRenderer = styled(Box)<PaperProps>`
  // PagedJS styles
  @media screen {
    body {
      background-color: whitesmoke;
    }

    .pagedjs_page {
      background-color: #fdfdfd;
      margin-bottom: 20px;
      flex: none;
      box-shadow: var(--chakra-shadows-xl);
    }

    .pagedjs_pages {
      width: 100%;
      transform-origin: 0 0;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
      align-items: center;
    }
  }
`;

export const Paper: FC<PaperProps> = ({ children, pagemargin = 1 }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const documentRoot = document.documentElement;

  const { resume } = useResume();

  const updatePageMargin = () => {
    documentRoot?.style?.setProperty('--pagedjs-margin-top', `${pagemargin}in`);
    documentRoot?.style?.setProperty(
      '--pagedjs-margin-left',
      `${pagemargin}in`
    );
    documentRoot?.style?.setProperty(
      '--pagedjs-margin-right',
      `${pagemargin}in`
    );
    documentRoot?.style?.setProperty(
      '--pagedjs-margin-bottom',
      `${pagemargin}in`
    );
  };

  useEffect(() => {
    updatePageMargin();
    paged.preview(contentRef.current?.innerHTML, [], renderRef.current);
  }, [resume, pagemargin]);

  return (
    <>
      <Box
        ref={contentRef}
        id="content"
        height="100%"
        overflow="hidden"
        visibility="hidden"
      >
        {children}
      </Box>
      <StyledRenderer
        ref={renderRef}
        id="render"
        position="absolute"
        width="100%"
        pt={24}
      />
    </>
  );
};
