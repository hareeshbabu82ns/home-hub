import type { Config } from "tailwindcss";
// import { fontFamily } from "tailwindcss/defaultTheme";
import animatePlugin from "tailwindcss-animate";
import twScrollbarPluginWithOptions from "./src/lib/tw-scroll-bar-plugin";
import twThemeGenPluginCreator from "./src/lib/tw-theme-gen-plugin";
import containerQueryPlugin from "@tailwindcss/container-queries";
import { COLOR_CHALK_BOARD_GREEN, COLOR_GOLD_YELLOW } from "./src/lib/colors";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";

const twScrollbarPlugin = twScrollbarPluginWithOptions({
  track: {
    background: "hsl(var(--primary-100))",
    darkBackground: "hsl(var(--primary-900))",
  },
  thumb: {
    background: "hsl(var(--tertiary-200))",
    darkBackground: "hsl(var(--tertiary-800))",
  },
});

// app theme generate
const twThemeGenPlugin = twThemeGenPluginCreator({
  primary: chroma(COLOR_GOLD_YELLOW),
  // primary: chroma(colors.fuchsia[500]).set("hsl.l", 0.3),
  // secondary: "#334244",
  // tertiary: "#514414",
});

// generate extra themes accessable from [data-theme] attribute
export const THEME_COLOR_PALETTES: Record<
  string,
  { name: string; primary: chroma.Color }
> = {
  CHALK_BOARD: {
    name: "Chalk Board Green",
    primary: chroma(COLOR_CHALK_BOARD_GREEN),
  },
  COLOR_GOLD_YELLOW: {
    name: "Gold Yellow",
    primary: chroma(COLOR_GOLD_YELLOW),
  },
};

Object.keys(colors).forEach((colorName) => {
  const color = colors[colorName as keyof typeof colors];
  if (typeof color === "string") {
    return;
  }
  const primary = chroma(color[500]);
  THEME_COLOR_PALETTES[colorName] = {
    name: colorName,
    primary,
  };
});

const twColorThemePlugins = Object.entries(THEME_COLOR_PALETTES).map(
  ([key, value]) => {
    return twThemeGenPluginCreator({
      primary: chroma(value.primary),
      // secondary: "#334244",
      // tertiary: "#514414",
      scope: key,
    });
  },
);

const config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],

  plugins: [
    animatePlugin,
    containerQueryPlugin,
    twScrollbarPlugin,
    twThemeGenPlugin,
    ...twColorThemePlugins,
  ],
} satisfies Config;
export default config;

// const config = {
//   darkMode: "class",
//   content: [
//     "./pages/**/*.{ts,tsx}",
//     "./components/**/*.{ts,tsx}",
//     "./app/**/*.{ts,tsx}",
//     "./src/**/*.{ts,tsx}",
//   ],
//   prefix: "",
//   theme: {
//     container: {
//       center: true,
//       padding: "2rem",
//       screens: {
//         "2xl": "1400px",
//       },
//     },
//     extend: {
//       fontFamily: {
//         sans: ["var(--font-sans)", ...fontFamily.sans],
//       },
//       colors: {
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: "0" },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: "0" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//       },
//     },
//   },
//   // safelist: [
//   //   {
//   //     pattern:
//   //       /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
//   //     variants: ['hover', 'ui-selected'],
//   //   },
//   //   {
//   //     pattern:
//   //       /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
//   //     variants: ['hover', 'ui-selected'],
//   //   },
//   //   {
//   //     pattern:
//   //       /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
//   //     variants: ['hover', 'ui-selected'],
//   //   },
//   //   {
//   //     pattern:
//   //       /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
//   //   },
//   //   {
//   //     pattern:
//   //       /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
//   //   },
//   //   {
//   //     pattern:
//   //       /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
//   //   },
//   // ],
//   plugins: [animatePlugin, twThemeGenPlugin],
// } satisfies Config;
