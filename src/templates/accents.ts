/**
 * Accent palettes for resume templates.
 *
 * Each palette is a small tonal ramp built around a single pleasant, pastel
 * hue. Templates consume the shade that fits their design:
 *   - `soft`   very light fill painted behind dark text (e.g. Duo underlines)
 *   - `muted`  slightly deeper tint for borders and small marks
 *   - `strong` saturated tone for thin rules and small colored text (e.g. Linea)
 *   - `swatch` a mid tone used purely for the picker dots
 */
export interface AccentPalette {
  id: string;
  name: string;
  swatch: string;
  soft: string;
  muted: string;
  strong: string;
}

export const accents: AccentPalette[] = [
  {
    id: 'sky',
    name: 'Sky',
    swatch: '#7fa9f2',
    soft: '#dbeafe',
    muted: '#bfdbfe',
    strong: '#2f6fe0',
  },
  {
    id: 'sage',
    name: 'Sage',
    swatch: '#74b78d',
    soft: '#dcefe1',
    muted: '#c0e2cb',
    strong: '#2f8559',
  },
  {
    id: 'honey',
    name: 'Honey',
    swatch: '#e3ad3e',
    soft: '#fcefcd',
    muted: '#f6dfa3',
    strong: '#b0780c',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    swatch: '#a08ee8',
    soft: '#ece8fb',
    muted: '#d8cff6',
    strong: '#6a4bd0',
  },
  {
    id: 'blush',
    name: 'Blush',
    swatch: '#ee8aa0',
    soft: '#fde2e8',
    muted: '#f8c7d1',
    strong: '#c83a5b',
  },
  {
    id: 'clay',
    name: 'Clay',
    swatch: '#c8765f',
    soft: '#f6e1d9',
    muted: '#edc7b8',
    strong: '#9c3a26',
  },
];

export const DEFAULT_ACCENT_ID = accents[0].id;

export const getAccent = (id: string | undefined | null): AccentPalette =>
  accents.find((accent) => accent.id === id) ?? accents[0];
