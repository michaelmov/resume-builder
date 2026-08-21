import { AspectRatio, Box, Icon, Image, Skeleton } from '@chakra-ui/react';
import { FC, useEffect, useRef, useState } from 'react';
import { HiOutlineDocumentText } from 'react-icons/hi';

import { ResumeSummary } from '../../types/resume-library';
import { renderResumePdf } from '../../utils/render-resume-pdf';
import { readDocument } from '../../utils/resume-storage';
import {
  getThumbnail,
  putThumbnail,
  renderPdfThumbnail,
} from '../../utils/thumbnails';

/**
 * A4 (595.28 × 841.89pt). Every template renders `<Page size="A4">`, so the
 * card can commit to that shape — get this wrong and the thumbnail is letter-
 * boxed or cropped inside its frame.
 */
export const PAGE_ASPECT_RATIO = 595.28 / 841.89;

/**
 * Rendering a PDF is CPU-heavy and blocks the main thread in bursts, so cards
 * that miss the cache queue behind one another rather than rendering the whole
 * list at once and freezing the page on arrival.
 */
let renderQueue: Promise<unknown> = Promise.resolve();

const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
  const result = renderQueue.then(task, task);
  renderQueue = result.catch(() => undefined);
  return result;
};

/**
 * A resume's first page. Normally this is just an image the editor already
 * captured; it only renders a PDF itself when a resume has never been opened
 * since thumbnails existed, or was edited in another tab.
 */
export const ResumeThumbnail: FC<{ summary: ResumeSummary }> = ({
  summary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Only the cards actually on screen are worth rendering.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let cancelled = false;
    const objectUrls: string[] = [];

    const show = (png: Blob) => {
      if (cancelled) return;
      const url = URL.createObjectURL(png);
      objectUrls.push(url);
      setSrc(url);
      setFailed(false);
    };

    void (async () => {
      const cached = await getThumbnail(summary.id);
      if (cancelled) return;

      if (cached?.stamp === summary.updatedAt) {
        show(cached.png);
        return;
      }

      // A stale image still shows the right resume, so paint it immediately
      // rather than holding a skeleton while the fresh one renders behind it.
      if (cached) show(cached.png);

      try {
        const png = await enqueue(async () => {
          const document = readDocument(summary.id);
          if (!document) return null;
          return renderPdfThumbnail(await renderResumePdf(document));
        });

        if (!png) {
          if (!cached && !cancelled) setFailed(true);
          return;
        }
        show(png);
        await putThumbnail(summary.id, { png, stamp: summary.updatedAt });
      } catch (error) {
        console.error('Could not render a resume thumbnail:', error);
        if (!cached && !cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [inView, summary.id, summary.updatedAt]);

  return (
    <AspectRatio ref={containerRef} ratio={PAGE_ASPECT_RATIO} width="100%">
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="border"
        rounded="md"
        overflow="hidden"
      >
        {src ? (
          <Image
            src={src}
            alt=""
            width="100%"
            height="100%"
            objectFit="cover"
            objectPosition="top"
          />
        ) : failed ? (
          // Not an error state worth explaining — the card still opens, and the
          // editor will re-capture a thumbnail the moment it renders.
          <Icon as={HiOutlineDocumentText} boxSize={10} color="gray.400" />
        ) : (
          <Skeleton width="100%" height="100%" />
        )}
      </Box>
    </AspectRatio>
  );
};
