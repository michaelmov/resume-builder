import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // `brand` is the single source of truth for the app's accent color.
        // These are concrete hex values (an indigo ramp) so the UI reads as one
        // restrained accent rather than a saturated highlight. NOTE: the
        // non-semantic `tokens` layer does NOT resolve `{...}` references —
        // only concrete values work here (references are a `semanticTokens`
        // feature). To rebrand, replace these hexes; the semantic tokens below
        // reference this ramp, so they follow automatically.
        brand: {
          50: { value: '#eef2ff' },
          100: { value: '#e0e7ff' },
          200: { value: '#c7d2fe' },
          300: { value: '#a5b4fc' },
          400: { value: '#818cf8' },
          500: { value: '#6366f1' },
          600: { value: '#4f46e5' },
          700: { value: '#4338ca' },
          800: { value: '#3730a3' },
          900: { value: '#312e81' },
          950: { value: '#1e1b4b' },
        },
        // `gray` is the **light** mode's neutral, retuned from Chakra's default
        // (zinc) to a cool slate ramp so the chrome reads crisp next to the
        // indigo accent. This single override retunes every light neutral:
        // Chakra's own semantic tokens (`bg.subtle`, `bg.emphasized`,
        // `fg.muted`, `border`, …) and the whole `gray` colorPalette are all
        // defined as `{colors.gray.N}` references, so built-in component
        // defaults follow this ramp too. Prefer the semantic names
        // (`bg.panel`, `fg.muted`, `border`) in components over reaching for
        // `gray.N` directly.
        gray: {
          50: { value: '#f8fafc' },
          100: { value: '#f1f5f9' },
          200: { value: '#e2e8f0' },
          300: { value: '#cbd5e1' },
          400: { value: '#94a3b8' },
          500: { value: '#64748b' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1e293b' },
          900: { value: '#0f172a' },
          950: { value: '#020617' },
        },
        // `zinc` is the **dark** mode's neutral. Slate is a blue-tinted gray:
        // pleasantly crisp as light chrome, but across the large dark surfaces
        // it reads as a blue cast rather than as "dark gray". So the `_dark`
        // condition of every neutral token below points at this near-neutral
        // ramp instead, leaving indigo as the only color in the dark UI. It is
        // the ramp Chakra ships as its default `gray` (this app overrode that
        // slot with slate), with a slightly deeper 950. NOTE: nothing consumes
        // `zinc.N` directly — it exists only to feed the `_dark` side of the
        // semantic tokens, so components keep styling by semantic name and
        // stay mode-agnostic.
        zinc: {
          50: { value: '#fafafa' },
          100: { value: '#f4f4f5' },
          200: { value: '#e4e4e7' },
          300: { value: '#d4d4d8' },
          400: { value: '#a1a1aa' },
          500: { value: '#71717a' },
          600: { value: '#52525b' },
          700: { value: '#3f3f46' },
          800: { value: '#27272a' },
          900: { value: '#18181b' },
          950: { value: '#09090b' },
        },
      },
      sizes: {
        sm: { value: 'sm' },
      },
    },
    semanticTokens: {
      colors: {
        // Map onto the raw `brand` ramp so `colorPalette="brand"` behaves like
        // any first-party palette. The tinted slots (`subtle`/`muted`/
        // `emphasized`/`border`) sit one step lighter than Chakra's built-in
        // mapping — accent-tinted fills (dropzone hover, outline-button hover)
        // stay a wash rather than a block of color. These must reference the
        // raw ramp (not other semantic tokens like `{colors.brand.solid}`) — a
        // semantic→semantic reference won't flatten into the colorPalette
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
              _light: '{colors.brand.50}',
              _dark: '{colors.brand.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.brand.100}',
              _dark: '{colors.brand.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.brand.200}',
              _dark: '{colors.brand.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.brand.600}',
              _dark: '{colors.brand.500}',
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
              _light: '{colors.brand.400}',
              _dark: '{colors.brand.400}',
            },
          },
        },
        // Dark-mode surface ladder — the `_dark` half of every neutral token,
        // pointed at `zinc` (see the ramp above) so dark chrome reads as gray
        // rather than blue.
        //
        // The steps are also re-pitched, because Chakra's stock dark values
        // collapse this app's chrome: `bg.subtle` (the editor panel) and
        // `bg.panel` (the cards, menus and dialogs sitting on it) are both the
        // 950 step, so the two levels read as one flat sheet. This restores the
        // hierarchy the light theme has —
        //   rail (950) → editor panel / PDF canvas (900) → panels (800)
        //   → hover (700) → emphasized (600)
        // — which also keeps hovers *lighter* than what they sit on. The
        // `_light` values are Chakra's own defaults, restated because a
        // semantic token has to define every condition it takes part in.
        bg: {
          DEFAULT: {
            value: { _light: '{colors.white}', _dark: '{colors.zinc.900}' },
          },
          subtle: {
            value: { _light: '{colors.gray.50}', _dark: '{colors.zinc.900}' },
          },
          muted: {
            value: { _light: '{colors.gray.100}', _dark: '{colors.zinc.700}' },
          },
          emphasized: {
            value: { _light: '{colors.gray.200}', _dark: '{colors.zinc.600}' },
          },
          panel: {
            value: { _light: '{colors.white}', _dark: '{colors.zinc.800}' },
          },
        },
        // Text. Only the `_dark` side moves off slate; `_light` restates
        // Chakra's defaults.
        fg: {
          DEFAULT: {
            value: { _light: '{colors.black}', _dark: '{colors.zinc.50}' },
          },
          muted: {
            value: { _light: '{colors.gray.600}', _dark: '{colors.zinc.400}' },
          },
          subtle: {
            value: { _light: '{colors.gray.400}', _dark: '{colors.zinc.500}' },
          },
        },
        border: {
          DEFAULT: {
            value: { _light: '{colors.gray.200}', _dark: '{colors.zinc.700}' },
          },
          muted: {
            value: { _light: '{colors.gray.100}', _dark: '{colors.zinc.800}' },
          },
          emphasized: {
            value: { _light: '{colors.gray.300}', _dark: '{colors.zinc.600}' },
          },
          // Unused by the app today, but Chakra's own recipes reach for them —
          // repointed so nothing can reintroduce a slate edge in dark mode.
          subtle: {
            value: { _light: '{colors.gray.50}', _dark: '{colors.zinc.950}' },
          },
          inverted: {
            value: { _light: '{colors.gray.800}', _dark: '{colors.zinc.200}' },
          },
        },
        // The `gray` colorPalette drives the default (palette-less) component
        // states — ghost/outline button hovers are `colorPalette.subtle`, an
        // unstyled button's label is `colorPalette.fg`. Its dark slots are
        // shifted to match the ladder above so a hover lifts off the `bg.panel`
        // surface instead of sinking below it.
        gray: {
          fg: {
            value: { _light: '{colors.gray.800}', _dark: '{colors.zinc.200}' },
          },
          subtle: {
            value: { _light: '{colors.gray.100}', _dark: '{colors.zinc.700}' },
          },
          muted: {
            value: { _light: '{colors.gray.200}', _dark: '{colors.zinc.600}' },
          },
          emphasized: {
            value: { _light: '{colors.gray.300}', _dark: '{colors.zinc.500}' },
          },
          border: {
            value: { _light: '{colors.gray.200}', _dark: '{colors.zinc.800}' },
          },
          focusRing: {
            value: { _light: '{colors.gray.400}', _dark: '{colors.zinc.400}' },
          },
        },
        // Surfaces specific to the app's three-pane chrome. Chakra's built-in
        // `bg.*` tokens cover the editor panel (`bg.subtle`) and the cards
        // inside it (`bg.panel`); these name the two roles it has no token
        // for, so components describe the surface instead of hardcoding a step
        // on the ramp.
        app: {
          // The narrow icon rail pinned to the left edge of the window. It is
          // dark chrome in *both* modes, so its icons stay light throughout —
          // hence `railFg`, which the light `fg.*` tokens can't express.
          rail: {
            value: { _light: '{colors.gray.800}', _dark: '{colors.zinc.950}' },
          },
          railHover: {
            value: { _light: '{colors.gray.700}', _dark: '{colors.zinc.800}' },
          },
          railFg: {
            value: { _light: '{colors.gray.400}', _dark: '{colors.zinc.400}' },
          },
          // The backdrop the rendered PDF pages float on — dark enough that the
          // (always white) pages read as paper, but deliberately one step
          // *lighter* than the rail: collapsing the editor slides its right
          // border away too, leaving the rail and the canvas edge to edge with
          // nothing between them, so they must not resolve to the same value.
          // It shares the editor panel's step instead, and those two are always
          // separated by that border.
          canvas: {
            value: { _light: '{colors.gray.200}', _dark: '{colors.zinc.900}' },
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
