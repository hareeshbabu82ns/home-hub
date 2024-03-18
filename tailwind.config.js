import animatePlugin from "tailwindcss-animate";
import containerQueries from "@tailwindcss/container-queries";
import colors from "tailwindcss/colors";

import tinycolor from "tinycolor2";

import { twThemeGen } from "./src/lib/themes/tw-theme-gen-plugin";
import { setTinyColorLuminance } from "./src/lib/themes/utils";

const twThemeGenPlugin = twThemeGen({
  primary: setTinyColorLuminance(tinycolor(colors.fuchsia[500]), 0.5),
  // secondary,
  // tertiary,
});

const twThemeGenRainforestPlugin = twThemeGen({
  scope: "rainforest",
  primary: tinycolor({ h: 111, s: 0.5, l: 0.5 }),
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  plugins: [
    animatePlugin,
    containerQueries,
    twThemeGenPlugin,
    twThemeGenRainforestPlugin,
  ],
};
