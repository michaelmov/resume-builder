import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // `brand` is the single source of truth for the app's accent color.
        // These are concrete hex values (copied from Chakra's built-in `purple`
        // ramp) so the UI is visually unchanged. NOTE: the non-semantic
        // `tokens` layer does NOT resolve `{...}` references — only concrete
        // values work here (references are a `semanticTokens` feature). To
        // rebrand, replace these hexes; the semantic tokens below reference
        // this ramp, so they follow automatically.
        brand: {
          50: { value: '#faf5ff' },
          100: { value: '#f3e8ff' },
          200: { value: '#e9d5ff' },
          300: { value: '#d8b4fe' },
          400: { value: '#c084fc' },
          500: { value: '#a855f7' },
          600: { value: '#9333ea' },
          700: { value: '#641ba3' },
          800: { value: '#4a1772' },
          900: { value: '#2f0553' },
          950: { value: '#1a032e' },
        },
      },
      sizes: {
        sm: { value: 'sm' },
      },
    },
    semanticTokens: {
      colors: {
        // Map onto the raw `brand` ramp using the exact same numeric mapping
        // Chakra uses for `purple`, so `colorPalette="brand"` renders
        // identically to the old `colorPalette="purple"`. These must reference
        // the raw ramp (not other semantic tokens like `{colors.purple.solid}`)
        // — a semantic→semantic reference won't flatten into the colorPalette
        // slots, which left the selected date/etc. rendering black. Retuning
        // the raw ramp above flows through all of these automatically.
        brand: {
          contrast: { value: { _light: 'white', _dark: 'white' } },
          fg: {
            value: {
              _light: '{colors.brand.700}',
              _dark: '{colors.brand.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.brand.100}',
              _dark: '{colors.brand.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.brand.200}',
              _dark: '{colors.brand.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.brand.300}',
              _dark: '{colors.brand.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.brand.600}',
              _dark: '{colors.brand.600}',
            },
          },
          focusRing: {
            value: {
              _light: '{colors.brand.500}',
              _dark: '{colors.brand.500}',
            },
          },
          border: {
            value: {
              _light: '{colors.brand.500}',
              _dark: '{colors.brand.400}',
            },
          },
        },
      },
      sizes: {
        inputDefault: { value: 'sm' },
        textareaDefault: { value: 'sm' },
        selectDefault: { value: 'sm' },
      },
    },
    recipes: {
      // Give regular text inputs/textareas a brand focus ring. Both recipes
      // drive their focus ring from the `--focus-color` var, which defaults to
      // `colors.colorPalette.focusRing` (i.e. gray, since inputs set no
      // colorPalette). Repointing it at `brand.focusRing` brands every field
      // without touching each usage. Partial recipes deep-merge with Chakra's
      // defaults, so variants/sizes are preserved.
      input: {
        base: {
          '--focus-color': 'colors.brand.focusRing',
        },
      },
      textarea: {
        base: {
          '--focus-color': 'colors.brand.focusRing',
        },
        // Unlike the input recipe, the default textarea variants set up the
        // ring geometry (`focusVisibleRing: "inside"`) but never wire the ring
        // *color* to `--focus-color`, so it stayed gray. Add it to match.
        variants: {
          variant: {
            outline: { focusRingColor: 'var(--focus-color)' },
            subtle: { focusRingColor: 'var(--focus-color)' },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
