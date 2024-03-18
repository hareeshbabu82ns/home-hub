import plugin from "tailwindcss/plugin";
import tinycolor from "tinycolor2";

import { genColorPalette, genTailwindThemeBase, withOpacity } from "./utils";

export const twThemeGen = ({
  primary,
  secondary,
  tertiary,
  prefix = "",
  darkMode = "class",
  scopeAttr = "data-theme",
  scope, // can be used as `[${scopeAttr}="${scope}"]` on html elements
}) => {
  const triadColors = primary.triad();

  const primaryCalc = triadColors[0];
  const secondaryCalc = secondary || triadColors[1];
  const tertiaryCalc = tertiary || triadColors[2];

  const paletteColors = ["primary", "secondary", "tertiary"].reduce(
    (acc, paletteName) => {
      return {
        ...acc,
        [paletteName]: genColorPalette({ paletteName }),
      };
    },
    {}
  );
  const simpleColors = [
    "destructive",
    "muted",
    "accent",
    "popover",
    "card",
    "success",
    "warning",
  ].reduce((acc, paletteName) => {
    return {
      ...acc,
      [paletteName]: {
        DEFAULT: withOpacity(`--${paletteName}`),
        foreground: withOpacity(`--${paletteName}-foreground`),
        // DEFAULT: `hsl(var(--${paletteName}))`,
        // foreground: `hsl(var(--${paletteName}-foreground))`,
      },
    };
  }, {});

  return plugin(
    // add css variable definitions
    function ({ addBase, theme }) {
      addBase(
        genTailwindThemeBase({
          theme,
          scope,
          scopeAttr,
          darkMode,
          primary: primaryCalc,
          secondary: secondaryCalc,
          tertiary: tertiaryCalc,
        })
      );
      addBase({
        [scope ? `[${scopeAttr}="${scope}"] *` : "*"]: {
          "@apply border-border": true,
        },
        [scope ? `[${scopeAttr}="${scope}"]` : "body"]: {
          "@apply bg-background text-foreground": true,
        },
      });
    },
    // extend theme with "themable" utilities
    scope
      ? undefined
      : {
          prefix,
          darkMode,
          theme: {
            container: {
              center: true,
              padding: "2rem",
              screens: {
                "2xl": "1400px",
              },
            },
            extend: {
              colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                ...paletteColors,
                ...simpleColors,
              },
              borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
              },
              keyframes: {
                "accordion-down": {
                  from: { height: "0" },
                  to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                  from: { height: "var(--radix-accordion-content-height)" },
                  to: { height: "0" },
                },
              },
              animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
              },
            },
          },
          safelist: [
            {
              pattern: /\-primary\-/,
            },
            {
              pattern: /\-secondary\-/,
            },
            {
              pattern: /\-tertiary\-/,
            },
          ],
        }
  );
};
