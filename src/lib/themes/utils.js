// ref: https://mayashavin.com/articles/build-palette-color-mix-css-tailwindcss
// https://uicolors.app/create

import colors from "tailwindcss/colors";
import tinycolor from "tinycolor2";

const tintVariants = {
  50: 10, //% color tint
  100: 20,
  200: 30,
  300: 50,
  400: 70,
};
const tintForegroundVariants = {
  50: 90, //% black text
  100: 85,
  200: 85,
  300: 80,
  400: 80,
};

function prepareTintVariantColors(color, colorForeground) {
  return Object.keys(tintVariants).reduce((acc, key) => {
    return {
      ...acc,
      [key]: ({ opacityValue }) =>
        opacityValue
          ? `color-mix(in srgb, hsla(var(${color}), ${opacityValue}) ${tintVariants[key]}%, white)`
          : `color-mix(in srgb, hsl(var(${color})) ${tintVariants[key]}%, white)`,
      [`foreground-${key}`]: ({ opacityValue }) =>
        opacityValue
          ? `color-mix(in srgb, hsla(var(${colorForeground}), ${opacityValue}) , black ${tintForegroundVariants[key]}%)`
          : `color-mix(in srgb, hsl(var(${colorForeground})) , black ${tintForegroundVariants[key]}%)`,
    };
  }, {});
}

const shadeVariants = {
  600: 15, //% black shade
  700: 30,
  800: 50,
  900: 70,
  950: 85,
};
const shadeForegroundVariants = {
  600: 95, //% white text
  700: 90,
  800: 85,
  900: 80,
  950: 75,
};

function prepareShadeVariantColors(color, colorForeground) {
  return Object.keys(shadeVariants).reduce((acc, key) => {
    return {
      ...acc,
      [key]: ({ opacityValue }) =>
        opacityValue
          ? `color-mix(in srgb, hsla(var(${color}), ${opacityValue}), black ${shadeVariants[key]}% )`
          : `color-mix(in srgb, hsl(var(${color})), black ${shadeVariants[key]}% )`,
      [`foreground-${key}`]: ({ opacityValue }) =>
        opacityValue
          ? `color-mix(in srgb, hsla(var(${colorForeground}), ${opacityValue}) , white ${shadeVariants[key]}%)`
          : `color-mix(in srgb, hsl(var(${colorForeground})) , white ${shadeVariants[key]}%)`,
    };
  }, {});
}

// const ascentVariants = {
//   A100: 95, //% white ascent
//   A200: 90,
//   A400: 80,
//   A700: 70,
// };
// const ascentForegroundVariants = {
//   A100: 95, //% black text
//   A200: 90,
//   A400: 80,
//   A700: 70,
// };

// function prepareAscentVariantColors(color, colorForeground) {
//   return Object.keys(ascentVariants).reduce((acc, key) => {
//     return {
//       ...acc,
//       [key]: `color-mix(in srgb, ${color} , white  ${ascentVariants[key]}%)`,
//       [`foreground-${key}`]: `color-mix(in srgb, ${colorForeground}, black ${ascentForegroundVariants[key]}%)`,
//     };
//   }, {});
// }

export const genColorPalette = ({ paletteName = "primary" }) => {
  const colorVar = `--${paletteName}`;
  const colorForegroundVar = `--${paletteName}-foreground`;
  return {
    DEFAULT: withOpacity(colorVar),
    foreground: withOpacity(colorForegroundVar),
    500: withOpacity(colorVar),
    "foreground-500": withOpacity(colorForegroundVar),
    ...prepareTintVariantColors(colorVar, colorForegroundVar),
    ...prepareShadeVariantColors(colorVar, colorForegroundVar),
    // ...prepareAscentVariantColors(color, colorForeground),
  };
};
// generate theme base color variables
export const genTailwindThemeBase = ({
  theme,
  darkMode = "class",
  scope,
  scopeAttr = "data-theme",
  primary,
  secondary,
  tertiary,
}) => {
  const pHsl = primary.toHsl();
  const sHsl = secondary.toHsl();
  const tHsl = tertiary.toHsl();

  const root = {};
  const dark = {};

  const destructiveHue = tinycolor(colors.red[500]).toHsl().h;
  const successHue = tinycolor(colors.green[500]).toHsl().h;
  const warningHue = tinycolor(colors.amber[500]).toHsl().h;

  // <body />
  root["--background"] = `${pHsl.h}, 30%, 95%`;
  dark["--background"] = `${pHsl.h}, 30%, 5%`;

  root["--foreground"] = `${pHsl.h}, ${pHsl.s * 100}%, 10%`;
  dark["--foreground"] = `${pHsl.h}, ${pHsl.s * 100}%, 90%`;

  // <Card />
  root["--card"] = `${sHsl.h}, 30%, 90%`;
  dark["--card"] = `${sHsl.h}, 30%, 10%`;

  root["--card-foreground"] = `${sHsl.h}, ${sHsl.s * 100}%, 10%`;
  dark["--card-foreground"] = `${sHsl.h}, ${sHsl.s * 100}%, 90%`;

  // <DropdownMenu />, <HoverCard />, <Popover />
  root["--popover"] = `${pHsl.h}, 35%, 95%`;
  dark["--popover"] = `${pHsl.h}, 35%, 5%`;

  root["--popover-foreground"] = `${pHsl.h}, ${pHsl.s * 100}%, 10%`;
  dark["--popover-foreground"] = `${pHsl.h}, ${pHsl.s * 100}%, 90%`;

  root["--primary"] = `${pHsl.h}, ${pHsl.s * 100}%, ${pHsl.l * 100}%`;
  dark["--primary"] = `${pHsl.h}, ${pHsl.s * 100}%, ${100 - pHsl.l * 100}%`;

  root["--primary-foreground"] = `${pHsl.h}, ${pHsl.s * 100}%, 10%`;
  dark["--primary-foreground"] = `${pHsl.h}, ${pHsl.s * 100}%, 90%`;

  root["--secondary"] = `${sHsl.h}, ${sHsl.s * 100}%, ${sHsl.l * 100}%`;
  dark["--secondary"] = `${sHsl.h}, ${sHsl.s * 100}%, ${sHsl.l * 100}%`;

  root["--secondary-foreground"] = `${sHsl.h}, ${sHsl.s * 100}%, 10%`;
  dark["--secondary-foreground"] = `${sHsl.h}, ${sHsl.s * 100}%, 90%`;

  root["--tertiary"] = `${tHsl.h}, ${tHsl.s * 100}%, ${tHsl.l * 100}%`;
  dark["--tertiary"] = `${tHsl.h}, ${tHsl.s * 100}%, ${tHsl.l * 100}%`;

  root["--tertiary-foreground"] = `${tHsl.h}, ${tHsl.s * 100}%, 10%`;
  dark["--tertiary-foreground"] = `${tHsl.h}, ${tHsl.s * 100}%, 90%`;

  // <TabsList />, <Skeleton /> and <Switch />
  root["--muted"] = `${pHsl.h}, 30%, 90%`;
  dark["--muted"] = `${pHsl.h}, 30%, 10%`;

  root["--muted-foreground"] = `${pHsl.h}, 25%, 30%`;
  dark["--muted-foreground"] = `${pHsl.h}, 25%, 75%`;

  // hover effects on <DropdownMenuItem>, <SelectItem>
  root["--accent"] = `${tHsl.h}, ${tHsl.s * 100}%, 10%`;
  dark["--accent"] = `${tHsl.h}, ${tHsl.s * 100}%, 90%`;

  root["--accent-foreground"] = `${tHsl.h}, ${tHsl.s * 100}%, 90%`;
  dark["--accent-foreground"] = `${tHsl.h}, ${tHsl.s * 100}%, 10%`;

  root["--destructive"] = `${destructiveHue}, ${pHsl.s * 100}%, 60%`;
  dark["--destructive"] = `${destructiveHue}, ${pHsl.s * 100}%, 30%`;

  root["--destructive-foreground"] = `${destructiveHue}, 25%, 10%`;
  dark["--destructive-foreground"] = `${destructiveHue}, 25%, 85%`;

  root["--success"] = `${successHue}, ${pHsl.s * 100}%, 50%`;
  dark["--success"] = `${successHue}, ${pHsl.s * 100}%, 30%`;

  root["--success-foreground"] = `${successHue}, 80%, 10%`;
  dark["--success-foreground"] = `${successHue}, 80%, 10%`;

  root["--warning"] = `${warningHue}, ${pHsl.s * 100}%, 50%`;
  dark["--warning"] = `${warningHue}, ${pHsl.s * 100}%, 30%`;

  root["--warning-foreground"] = `${warningHue}, ${pHsl.s * 100}%, 10%`;
  dark["--warning-foreground"] = `${warningHue}, ${pHsl.s * 100}%, 80%`;

  root["--border"] = `${sHsl.h}, 30%, 90%`;
  dark["--border"] = `${sHsl.h}, 30%, 20%`;

  root["--input"] = `${sHsl.h}, 30%, 90%`;
  dark["--input"] = `${sHsl.h}, 30%, 20%`;

  // focus ring
  root["--ring"] = `${tHsl.h}, 80%, 5%`;
  dark["--ring"] = `${tHsl.h}, 30%, 80%`;

  // card, input and buttons
  root["--radius"] = "0.5rem";

  return scope
    ? {
        [`[${scopeAttr}="${scope}"]`]: root,
        [`[${scopeAttr}="${scope}"] .dark`]: dark,
        [`[${darkMode}="dark"] [${scopeAttr}="${scope}"]`]: dark,
      }
    : {
        ":root": root,
        ".dark": dark,
      };
};

export function withOpacity(cssVariable) {
  return ({ opacityValue }) =>
    opacityValue
      ? `hsla(var(${cssVariable}), ${opacityValue})`
      : `hsl(var(${cssVariable}))`;
}

export const getBackgroundColor = (color, isDark) =>
  isDark ? tinycolor(color).darken(70) : tinycolor(color).lighten(70);

export const getHoverBackgroundColor = (color, isDark) =>
  isDark
    ? tinycolor(color).darken(color, 60)
    : tinycolor(color).lighten(color, 60);

export const getSelectedBackgroundColor = (color, isDark) =>
  isDark
    ? tinycolor(color).darken(color, 50)
    : tinycolor(color).lighten(color, 50);

export const getSelectedHoverBackgroundColor = (color, isDark) =>
  isDark
    ? tinycolor(color).darken(color, 40)
    : tinycolor(color).lighten(color, 40);

export const toneByMode = (color, toDark, { darkBy, lightBy }) => {
  const funcMode = toDark ? tinycolor(color).darken : tinycolor(color).lighten;
  return funcMode(toDark ? darkBy : lightBy);
};

export const reverseColorPalette = ({
  colorPalette,
  isDark = false,
  by = 0,
}) => {
  // const funcMode = isDark ? darken : lighten;

  const res = {
    ...colorPalette,
    DEFAULT: colorPalette["500"],
    50: colorPalette["950"],
    100: colorPalette["900"],
    200: colorPalette["800"],
    300: colorPalette["700"],
    400: colorPalette["600"],
    500: colorPalette["500"],
    600: colorPalette["400"],
    700: colorPalette["300"],
    800: colorPalette["200"],
    900: colorPalette["100"],
    950: colorPalette["50"],
  };
  return res;
};

export function setTinyColorLuminance(color, l) {
  const hsla = color.toHsl();
  return tinycolor({ ...hsla, l });
}

export function setTinyColorSaturation(color, s) {
  const hsla = color.toHsl();
  return tinycolor({ ...hsla, s });
}
