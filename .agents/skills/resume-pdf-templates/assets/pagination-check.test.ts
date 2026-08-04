// Pagination check harness — TEMPORARY, do not commit.
//
// Copy to src/templates/__pagination-check.test.ts, run it, then delete it:
//
//   npx vitest run src/templates/__pagination-check.test.ts --reporter=verbose
//
// It renders every template with the mock resume, padding the profile summary a
// line at a time so every page break slides down the page, and reports per
// render: page count, how far each page fills, whether the font embedded, any
// section heading stranded as the last line on its page, any entry squashed
// into the bottom margin, and any stranded bullet marker. It needs network
// access to fetch fonts, which is why it is not a committed test — the
// pre-commit hook runs `npm test` on every commit.
import { createElement } from 'react';

import { renderToBuffer } from '@react-pdf/renderer';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { test } from 'vitest';

import { resumeMock } from '../mocks/resume.mock';
import {
  getSectionTitle,
  resolveSectionOrder,
  SectionTypes,
} from '../types/resume.model';

import { accents } from './accents';
import { templates } from './index';

interface Line {
  page: number;
  text: string;
  raw: string;
  y: number;
}

/**
 * letterSpacing makes pdfjs emit one item per glyph run, so a title like
 * "PROJECTS" comes back as "P R O J E C T S" across many items. Rebuild whole
 * lines by grouping items that share a baseline, or title matching silently
 * fails and the check reports a false pass.
 */
const linesOf = async (
  buffer: Buffer
): Promise<{ lines: Line[]; pageHeight: number }> => {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;
  const lines: Line[] = [];
  let pageHeight = 0;
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    pageHeight = page.view[3];
    const content = await page.getTextContent();
    const byBaseline = new Map<number, string[]>();
    for (const item of content.items as {
      str: string;
      transform: number[];
    }[]) {
      if (!item.str.trim()) continue;
      const key = Math.round(item.transform[5]);
      byBaseline.set(key, [...(byBaseline.get(key) ?? []), item.str]);
    }
    for (const [y, parts] of byBaseline) {
      const raw = parts.join('').trim();
      lines.push({
        page: p,
        y,
        raw,
        text: raw.replace(/\s+/g, '').toLowerCase(),
      });
    }
  }
  return {
    lines: lines.sort((a, b) => a.page - b.page || b.y - a.y),
    pageHeight,
  };
};

// If a font fails to load react-pdf silently falls back to Helvetica, every
// height changes, and the whole run is meaningless — so check it explicitly.
const EMBEDDED_FONT: Record<string, string> = {
  duo: 'Poppins',
  linea: 'Spectral',
  aria: 'Lato',
  mono: 'FiraSans',
};

/**
 * The worst pagination bugs only fire when a section boundary lands within a
 * glued box's height of the page foot, so one render of one layout proves
 * almost nothing — the default resume can be clean while a one-line edit is
 * broken. Sweep instead: pad the profile summary a line at a time to slide
 * every break down the page, and check each position.
 *
 * A single filler sentence is about one line wide in every template, so the
 * sweep steps the whole document down in ~16pt increments and each section
 * boundary passes through the danger zone. Verified to catch the first-entry
 * squash described in references/pagination-internals.md — when you change
 * this harness, re-check it against a known-bad build the same way.
 */
const FILLER =
  'Contributed to a broad range of open source projects across the industry, ' +
  'reviewing patches and mentoring new maintainers along the way.';

const variants = () =>
  Array.from({ length: 8 }, (_, i) => ({
    label: i === 0 ? 'baseline' : `+${i} summary line(s)`,
    resume: {
      ...resumeMock,
      basics: {
        ...resumeMock.basics,
        summary: [resumeMock.basics?.summary, ...Array(i).fill(FILLER)]
          .filter(Boolean)
          .join(' '),
      },
    },
  }));

test('pagination check', { timeout: 600_000 }, async () => {
  const problems: string[] = [];
  const order = resolveSectionOrder(resumeMock.sectionOrder);
  const titles = order.map((type) =>
    getSectionTitle(type as SectionTypes, resumeMock.sectionTitles)
  );

  for (const { label, resume } of variants()) {
    for (const template of templates) {
      const buffer = await renderToBuffer(
        createElement(template.Component, {
          resume,
          accent:
            accents.find((a) => a.id === template.defaultAccentId) ??
            accents[0],
          marginScale: 1,
        }) as Parameters<typeof renderToBuffer>[0]
      );

      const expected = EMBEDDED_FONT[template.id];
      const fontOk = expected
        ? buffer.toString('latin1').includes(expected)
        : true;
      const { lines, pageHeight } = await linesOf(buffer);
      const pages = Math.max(...lines.map((l) => l.page));
      const where = `${template.name} [${label}]`;

      const fill = Array.from({ length: pages }, (_, i) => {
        const onPage = lines.filter((l) => l.page === i + 1);
        return `p${i + 1}→y=${Math.min(...onPage.map((l) => l.y)).toFixed(0)}`;
      }).join('  ');

      console.info(
        `\n${where}: ${pages} page(s) | fill ${fill} | font ${fontOk ? 'embedded' : 'MISSING — results are meaningless'}`
      );
      if (!fontOk) problems.push(`${where}: font "${expected}" not embedded`);

      // Text below the bottom margin means an entry was squashed into a page with
      // no room for it — react-pdf keeps a section's first entry on the current
      // page and lets Yoga shrink it, drawing every line on top of the next (see
      // references/pagination-internals.md). Calibrate the margin from a
      // continuation page, whose topmost baseline sits one ascender below the top
      // padding; every template uses symmetric vertical page padding.
      //
      // That ascender is a guess (it varies with the font size and leading of
      // whatever line starts page 2), so the floor can land a few points high
      // and clip one legitimate last line. A squash always dumps a whole entry
      // below the margin, so require more than one line and the estimate stops
      // mattering — measured, real squashes put 2–8 lines under the floor while
      // the false positives were always exactly one.
      const continuation = lines.filter((l) => l.page > 1);
      if (continuation.length > 0) {
        const floor =
          pageHeight - Math.max(...continuation.map((l) => l.y)) - 12;
        const spilled = lines.filter((l) => l.y < floor);
        if (spilled.length > 1) {
          problems.push(
            `${where}: ${spilled.length} line(s) SQUASHED into the bottom margin on page ${spilled[0].page} (lowest y=${Math.min(...spilled.map((l) => l.y)).toFixed(0)}, margin ≈ y=${floor.toFixed(0)})`
          );
        }
      }

      for (const title of titles) {
        // Match on how the line STARTS, not on whether it contains the title.
        // A `includes` match happily hits body copy — "...open source projects
        // moving." matches "Projects", sits mid-page with content beneath it, and
        // reports a false pass while the real stranded heading goes unchecked.
        // Headings begin with their title (after any leading index, e.g. Linea's
        // "01"), body copy essentially never does.
        const startsWithTitle = (l: Line, needle: string) =>
          l.text.replace(/^\d+/, '').startsWith(needle);
        const whole = title.replace(/\s+/g, '').toLowerCase();
        // Narrow columns (Aria's rail) wrap a title across lines, so fall back to
        // its last word — "Work Experience" arrives as "Work" / "Experience".
        const lastWord = title.split(/\s+/).pop()!.toLowerCase();
        const hit =
          lines.find((l) => startsWithTitle(l, whole)) ??
          lines.find((l) => startsWithTitle(l, lastWord));

        if (!hit) {
          problems.push(`${where}: could not locate heading "${title}"`);
          continue;
        }
        // Content at or below the heading on the same page counts — a template
        // may render its title on the same baseline as the first entry.
        const below = lines.filter(
          (l) => l.page === hit.page && l !== hit && l.y <= hit.y + 2
        );
        if (below.length === 0) {
          problems.push(
            `${where}: heading "${title}" is STRANDED — last line on page ${hit.page}/${pages}`
          );
        }
      }

      // A bullet row that split leaves its marker alone on a line.
      for (const line of lines) {
        if (/^[-–—•]$/.test(line.raw)) {
          problems.push(
            `${where}: stranded bullet marker "${line.raw}" on page ${line.page}`
          );
        }
      }
    }
  }

  if (problems.length > 0) {
    console.info(`\n${problems.length} problem(s):`);
    for (const p of problems) console.info(`  ✗ ${p}`);
    throw new Error(`${problems.length} pagination problem(s) — see above`);
  }
  console.info('\nNo stranded headings, squashed entries, or bullet markers.');
});
