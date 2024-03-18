import plugin from "tailwindcss/plugin";
import { genColorPalette, genTailwindThemeBase, withOpacity } from "./utils";

// const primaryHue = 222;
// const saturation = "30";
// const luminance = "50";

// const secondaryHue = (primaryHue + 60) % 360;
// const tertiaryHue = (secondaryHue + 180) % 360;

export const twThemeGen = ({
  primaryHue = 0,
  saturation = 50,
  luminance = 50,
  secondaryHue,
  tertiaryHue,
  prefix = "",
  darkMode = ["class"],
}) => {
  const secondaryHueCalc = secondaryHue || (primaryHue + 60) % 360;
  const tertiaryHueCalc = tertiaryHue || (secondaryHueCalc + 180) % 360;

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
          primaryHue,
          saturation,
          luminance,
          secondaryHue: secondaryHueCalc,
          tertiaryHue: tertiaryHueCalc,
        })
      );

      addBase({
        "*": { "@apply border-border": true },
        body: { "@apply bg-background text-foreground": true },
      });
    },
    // extend theme with "themable" utilities
    {
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
