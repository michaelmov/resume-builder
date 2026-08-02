// Pagination check harness — TEMPORARY, do not commit.
//
// Copy to src/templates/__pagination-check.test.ts, run it, then delete it:
//
//   npx vitest run src/templates/__pagination-check.test.ts --reporter=verbose
//
// It renders every template with the mock resume and reports, per template:
// page count, how far each page fills, whether the font embedded, any section
// heading stranded as the last line on its page, and any stranded bullet
// marker. It needs network access to fetch fonts, which is why it is not a
// committed test — the pre-commit hook runs `npm test` on every commit.
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
const linesOf = async (buffer: Buffer): Promise<Line[]> => {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;
  const lines: Line[] = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const content = await (await doc.getPage(p)).getTextContent();
    const byBaseline = new Map<number, string[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!item.str.trim()) continue;
      const key = Math.round(item.transform[5]);
      byBaseline.set(key, [...(byBaseline.get(key) ?? []), item.str]);
    }
    for (const [y, parts] of byBaseline) {
      const raw = parts.join('').trim();
      lines.push({ page: p, y, raw, text: raw.replace(/\s+/g, '').toLowerCase() });
    }
  }
  return lines.sort((a, b) => a.page - b.page || b.y - a.y);
};

// If a font fails to load react-pdf silently falls back to Helvetica, every
// height changes, and the whole run is meaningless — so check it explicitly.
const EMBEDDED_FONT: Record<string, string> = {
  duo: 'Poppins',
  linea: 'Spectral',
  aria: 'Lato',
  mono: 'FiraSans',
};

test('pagination check', { timeout: 300_000 }, async () => {
  const order = resolveSectionOrder(resumeMock.sectionOrder);
  const titles = order.map((type) =>
    getSectionTitle(type as SectionTypes, resumeMock.sectionTitles)
  );
  const problems: string[] = [];

  for (const template of templates) {
    const buffer = await renderToBuffer(
      createElement(template.Component, {
        resume: resumeMock,
        accent:
          accents.find((a) => a.id === template.defaultAccentId) ?? accents[0],
        marginScale: 1,
      }) as Parameters<typeof renderToBuffer>[0]
    );

    const expected = EMBEDDED_FONT[template.id];
    const fontOk = expected
      ? buffer.toString('latin1').includes(expected)
      : true;
    const lines = await linesOf(buffer);
    const pages = Math.max(...lines.map((l) => l.page));

    const fill = Array.from({ length: pages }, (_, i) => {
      const onPage = lines.filter((l) => l.page === i + 1);
      return `p${i + 1}→y=${Math.min(...onPage.map((l) => l.y)).toFixed(0)}`;
    }).join('  ');

    console.info(
      `\n${template.name}: ${pages} page(s) | fill ${fill} | font ${fontOk ? 'embedded' : 'MISSING — results are meaningless'}`
    );
    if (!fontOk) problems.push(`${template.name}: font "${expected}" not embedded`);

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
        problems.push(`${template.name}: could not locate heading "${title}"`);
        continue;
      }
      // Content at or below the heading on the same page counts — a template
      // may render its title on the same baseline as the first entry.
      const below = lines.filter(
        (l) => l.page === hit.page && l !== hit && l.y <= hit.y + 2
      );
      if (below.length === 0) {
        problems.push(
          `${template.name}: heading "${title}" is STRANDED — last line on page ${hit.page}/${pages}`
        );
      }
    }

    // A bullet row that split leaves its marker alone on a line.
    for (const line of lines) {
      if (/^[-–—•]$/.test(line.raw)) {
        problems.push(
          `${template.name}: stranded bullet marker "${line.raw}" on page ${line.page}`
        );
      }
    }
  }

  if (problems.length > 0) {
    console.info(`\n${problems.length} problem(s):`);
    for (const p of problems) console.info(`  ✗ ${p}`);
    throw new Error(`${problems.length} pagination problem(s) — see above`);
  }
  console.info('\nNo stranded headings or bullet markers.');
});
