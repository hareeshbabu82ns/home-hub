import animatePlugin from "tailwindcss-animate";
import containerQueries from "@tailwindcss/container-queries";
import colors from "tailwindcss/colors";

import tinycolor from "tinycolor2";

import { twThemeGen } from "./src/lib/themes/tw-theme-gen-plugin";

const primaryHsl = tinycolor(colors.orange[500]).toHsl();

const primaryHue = primaryHsl.h;
const saturation = "100"; //primaryHsl.s;
// const luminance = primaryHsl.l;

// const secondaryHue = (primaryHue + 60) % 360;
// const tertiaryHue = (secondaryHue + 180) % 360;

const twThemeGenPlugin = twThemeGen({
  primaryHue,
  // saturation,
  // luminance,
  // secondaryHue,
  // tertiaryHue,
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  plugins: [animatePlugin, containerQueries, twThemeGenPlugin],
};
