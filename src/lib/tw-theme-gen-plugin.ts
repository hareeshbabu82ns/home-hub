import plugin from "tailwindcss/plugin";
import { fontFamily } from "tailwindcss/defaultTheme";

import { Config } from "tailwindcss";
import {
  genTailwindThemeBase,
  genTWColorPaletteVariables,
  withOpacity,
} from "./utils";
import { triadColors as triad } from "./colors";
import { type Color } from "chroma-js";

// shades gen ref - https://javisperez.github.io/tailwindcolorshades
// shades gen repo - https://github.com/javisperez/tailwindcolorshades

export const updateBrowserTwThemeVariables = (color: Color) => {
  const root = document.documentElement;

  const triadColors = triad(color);

  const primaryCalc = triadColors[0];
  const secondaryCalc = triadColors[1];
  const tertiaryCalc = triadColors[2];

  const theme: Record<string, Record<string, string>> = genTailwindThemeBase({
    primary: primaryCalc,
    secondary: secondaryCalc,
    tertiary: tertiaryCalc,
  });

  const styleSheets = document.styleSheets;
  // console.log("styleSheets", styleSheets.length);
  for (let i = 0; i < styleSheets.length; i++) {
    const styleSheet = styleSheets[i];
    // console.log("styleSheet", styleSheet.href);
    if (styleSheet.href && styleSheet.href.includes("layout.css")) {
      const cssRules = styleSheet.cssRules || styleSheet.rules;
      // console.log("cssRules", cssRules.length);
      for (let j = 0; j < cssRules.length; j++) {
        const rule = cssRules[j] as CSSStyleRule;
        if (rule.selectorText === ":root") {
          // console.log(rule.cssText);
          Object.entries(theme[":root"]).forEach(([key, value]) => {
            rule.style.setProperty(key, value);
          });
        }
        if (rule.selectorText === ".dark") {
          // console.log(rule.cssText);
          Object.entries(theme[".dark"]).forEach(([key, value]) => {
            rule.style.setProperty(key, value);
          });
        }
      }
    }
  }
};

interface TwThemeGenPluginOptions {
  primary: Color;
  secondary?: Color;
  tertiary?: Color;
  prefix?: string;
  darkMode?: "class" | "media";
  scopeAttr?: string;
  scope?: string; // can be used as `[${scopeAttr}="${scope}"]` on html elements
}
const twThemeGenPluginCreator = ({
  primary,
  secondary,
  tertiary,
  prefix = "",
  darkMode = "class",
  scopeAttr = "data-theme",
  scope,
}: TwThemeGenPluginOptions) => {
  const triadColors = triad(primary);

  const primaryCalc = triadColors[0];
  const secondaryCalc = secondary || triadColors[1];
  const tertiaryCalc = tertiary || triadColors[2];

  const paletteColors = ["primary", "secondary", "tertiary"].reduce(
    (acc, paletteName) => {
      return {
        ...acc,
        [paletteName]: genTWColorPaletteVariables(paletteName),
      };
    },
    {},
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
    // add css variable definitions to the base layer
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
        }),
      );
      addBase({
        [scope ? `[${scopeAttr}="${scope}"] *` : "*"]: {
          "@apply border-border": {},
        },
        [scope ? `[${scopeAttr}="${scope}"]` : "body"]: {
          "@apply bg-background text-foreground": {},
        },

        // /* width */
        // [scope
        //   ? `[${scopeAttr}="${scope}"]::-webkit-scrollbar`
        //   : "::-webkit-scrollbar"]: {
        //   width: "5px",
        // },

        // /* Track */
        // ::-webkit-scrollbar-track {
        //   background: #888;
        //   border-radius: 5px;
        // }

        // /* Handle */
        // ::-webkit-scrollbar-thumb {
        //   background: #000;
        //   border-radius: 5px;
        // }

        // /* Handle on hover */
        // ::-webkit-scrollbar-thumb:hover {
        //   background: #555;
        // }
      });
    },
    // extend tailwind theme with themable utilities
    scope
      ? undefined
      : ({
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
              fontFamily: {
                sans: ["var(--font-sans)", ...fontFamily.sans],
              },
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
        } as Partial<Config>),
  );
};

export default twThemeGenPluginCreator;
