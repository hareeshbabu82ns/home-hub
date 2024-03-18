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
  primaryHue,
  saturation,
  luminance,
  secondaryHue,
  tertiaryHue,
}) => {
  const root = {};
  const dark = {};

  const destructiveHue = tinycolor(colors.red[500]).toHsl().h;
  const successHue = tinycolor(colors.green[500]).toHsl().h;
  const warningHue = tinycolor(colors.amber[500]).toHsl().h;

  root["--background"] = `${primaryHue}, 40%, 90%`;
  dark["--background"] = `${primaryHue}, 80%, 10%`;

  root["--foreground"] = `${primaryHue}, 80%, 10%`;
  dark["--foreground"] = `${primaryHue}, 40%, 90%`;

  root["--card"] = `${primaryHue}, 0%, 100%`;
  dark["--card"] = `${primaryHue}, 80%, 5%`;

  root["--card-foreground"] = `${primaryHue}, 80%, 5%`;
  dark["--card-foreground"] = `${primaryHue}, 40%, 95%`;

  root["--popover"] = `${primaryHue}, 0%, 100%`;
  dark["--popover"] = `${primaryHue}, 80%, 5%`;

  root["--popover-foreground"] = `${primaryHue}, 80%, 5%`;
  dark["--popover-foreground"] = `${primaryHue}, 40%, 95%`;

  root["--primary"] = `${primaryHue}, ${saturation}%, ${luminance}%`;
  dark["--primary"] = `${primaryHue}, ${saturation}%, ${100 - luminance}%`;

  root["--primary-foreground"] = `${primaryHue}, ${saturation}%, 95%`;
  dark["--primary-foreground"] = `${primaryHue}, ${saturation}%, 85%`;

  root["--secondary"] = `${secondaryHue}, 40%, 70%`;
  dark["--secondary"] = `${secondaryHue}, 30%, 30%`;

  root["--secondary-foreground"] = `${secondaryHue}, 50%, 20%`;
  dark["--secondary-foreground"] = `${secondaryHue}, 40%, 90%`;

  root["--tertiary"] = `${tertiaryHue}, 40%, 70%`;
  dark["--tertiary"] = `${tertiaryHue}, 30%, 30%`;

  root["--tertiary-foreground"] = `${tertiaryHue}, 50%, 20%`;
  dark["--tertiary-foreground"] = `${tertiaryHue}, 40%, 90%`;

  root["--muted"] = `${primaryHue}, 40%, 90%`;
  dark["--muted"] = `${primaryHue}, 30%, 20%`;

  root["--muted-foreground"] = `${primaryHue}, 16%, 50%`;
  dark["--muted-foreground"] = `${primaryHue}, 20%, 65%`;

  root["--accent"] = `${primaryHue}, 40%, 95%`;
  dark["--accent"] = `${primaryHue}, 30%, 20%`;

  root["--accent-foreground"] = `${primaryHue}, 50%, 10%`;
  dark["--accent-foreground"] = `${primaryHue}, 40%, 95%`;

  root["--destructive"] = `${destructiveHue}, ${saturation}%, ${luminance}%`;
  dark["--destructive"] = `${destructiveHue}, ${saturation}%, 30%`;

  root["--destructive-foreground"] = `${primaryHue}, 40%, 95%`;
  dark["--destructive-foreground"] = `${primaryHue}, 40%, 95%`;

  root["--success"] = `${successHue}, 100%, 50%`;
  dark["--success"] = `${successHue}, 100%, 50%`;

  root["--success-foreground"] = `${primaryHue}, 80%, 5%`;
  dark["--success-foreground"] = `${primaryHue}, 80%, 5%`;

  root["--warning"] = `${warningHue}, 90%, 50%`;
  dark["--warning"] = `${warningHue}, 90%, 50%`;

  root["--warning-foreground"] = "50, 95%, 90%";
  dark["--warning-foreground"] = "50, 95%, 90%";

  root["--border"] = `${primaryHue}, 30%, 90%`;
  dark["--border"] = `${primaryHue}, 30%, 20%`;

  root["--input"] = `${primaryHue}, 30%, 90%`;
  dark["--input"] = `${primaryHue}, 30%, 20%`;

  root["--ring"] = `${primaryHue}, 80%, 5%`;
  dark["--ring"] = `${primaryHue}, 30%, 80%`;

  root["--radius"] = "0.5rem";

  return {
    ":root": root,
    ".dark": dark,
    // ":root": {
    //   "--background": `${primaryHue} 40% 90%`,
    //   "--foreground": `${primaryHue} 80% 10%`,
    //   "--card": "0 0% 100%",
    //   "--card-foreground": `${primaryHue} 80% 5%`,
    //   "--popover": "0 0% 100%",
    //   "--popover-foreground": `${primaryHue} 80% 5%`,
    //   "--primary": `${primaryHue} ${saturation}% ${luminance}%`,
    //   "--primary-foreground": `${primaryHue} ${saturation}% 95%`,
    //   "--secondary": `${secondaryHue} 40% 70%`,
    //   "--secondary-foreground": `${secondaryHue} 50% 20%`,
    //   "--tertiary": `${tertiaryHue} 40% 70%`,
    //   "--tertiary-foreground": `${tertiaryHue} 50% 20%`,
    //   "--muted": `${primaryHue} 40% 90%`,
    //   "--muted-foreground": `${primaryHue} 16% 50%`,
    //   "--accent": `${primaryHue} 40% 95%`,
    //   "--accent-foreground": `${primaryHue} 50% 10%`,
    //   "--destructive": `0 ${saturation}% ${luminance}%`,
    //   "--destructive-foreground": `${primaryHue} 40% 95%`,
    //   "--success": "120 100% 50%",
    //   "--success-foreground": `${primaryHue} 80% 5%`,
    //   "--warning": "40 90% 50%",
    //   "--warning-foreground": "50 95% 90%",
    //   "--border": `${primaryHue} 30% 90%`,
    //   "--input": `${primaryHue} 30% 90%`,
    //   "--ring": `${primaryHue} 80% 5%`,
    //   "--radius": "0.5rem",
    // },
    // ".dark": {
    //   "--background": `${primaryHue} 80% 10%`,
    //   "--foreground": "210 40% 90%",
    //   "--card": `${primaryHue} 80% 5%`,
    //   "--card-foreground": "210 40% 95%",
    //   "--popover": `${primaryHue} 80% 5%`,
    //   "--popover-foreground": "210 40% 95%",
    //   "--primary": `${primaryHue} ${saturation}% ${100 - luminance}%`,
    //   "--primary-foreground": `${primaryHue} ${saturation}% 85%`,
    //   "--secondary": `${secondaryHue} 30% 30%`,
    //   "--secondary-foreground": `${secondaryHue} 40% 90%`,
    //   "--tertiary": `${tertiaryHue} 30% 30%`,
    //   "--tertiary-foreground": `${tertiaryHue} 40% 90%`,
    //   "--muted": `${primaryHue} 30% 20%`,
    //   "--muted-foreground": "215 20% 65%",
    //   "--accent": `${primaryHue} 30% 20%`,
    //   "--accent-foreground": "210 40% 95%",
    //   "--destructive": "0 60% 30%",
    //   "--destructive-foreground": "210 40% 95%",
    //   "--success": "120 100% 50%",
    //   "--success-foreground": `${primaryHue} 80% 5%`,
    //   "--warning": "40 90% 50%",
    //   "--warning-foreground": "50 95% 90%",
    //   "--border": `${primaryHue} 30% 20%`,
    //   "--input": `${primaryHue} 30% 20%`,
    //   "--ring": `${primaryHue} 30% 80%`,
    // },
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
