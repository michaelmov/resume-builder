/**
 * Page-margin presets. Each option is a multiplier applied to a template's own
 * base page padding, so every template keeps its distinct spacing while still
 * responding to the setting. "Normal" is ×1 — i.e. the template's existing
 * padding — so the default preserves each template's original look.
 */
export interface MarginOption {
  id: string;
  name: string;
  scale: number;
}

export const margins: MarginOption[] = [
  { id: 'narrow', name: 'Narrow', scale: 0.7 },
  { id: 'normal', name: 'Normal', scale: 1 },
  { id: 'wide', name: 'Wide', scale: 1.35 },
];

export const DEFAULT_MARGIN_ID = 'normal';

/** Resolve a stored margin id to its scale, falling back to Normal (×1). */
export const getMarginScale = (id: string | null | undefined): number =>
  margins.find((margin) => margin.id === id)?.scale ?? 1;
