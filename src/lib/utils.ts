import { type ClassValue, clsx } from "clsx";
import colors from "tailwindcss/colors";
import chroma, { type Color } from "chroma-js";
import { twMerge } from "tailwind-merge";
import {
  colorHslCss,
  colorHslPercent,
  ColorPalette,
  genColorPalette,
  genForegroundColorPalette,
  paletteColorKeys,
} from "./colors";

// import { getColorPalette, Palette } from "./colors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;
}

export type Action = "create" | "update" | "delete";

export type OptimisticAction<T> = {
  action: Action;
  data: T;
};

export function genTWColorPaletteVariables(paletteName: string) {
  const colorVar = `--${paletteName}`;
  const colorForegroundVar = `--${paletteName}-foreground`;
  return paletteColorKeys.reduce(
    (acc, key) => {
      acc[key] = withOpacity(`${colorVar}-${key}`);
      acc[`foreground-${key}`] = withOpacity(`${colorForegroundVar}-${key}`);
      return acc;
    },
    {
      ["DEFAULT"]: withOpacity(colorVar),
      foreground: withOpacity(colorForegroundVar),
    } as Record<string, any>,
  );
}

export const genTWColorPalette = ({
  paletteName: paletteNameParam,
  palette,
  foregroundPalette: foregroundPaletteParam,
}: {
  paletteName?: string;
  palette: ColorPalette;
  foregroundPalette?: ColorPalette;
}): Record<string, string> => {
  const paletteName = paletteNameParam || palette.name;
  const colorVar = `--${paletteName}`;
  const colorForegroundVar = `--${paletteName}-foreground`;

  const foregroundPalette = foregroundPaletteParam
    ? foregroundPaletteParam.colors
    : genForegroundColorPalette(palette).colors;

  return Object.entries(palette.colors).reduce((acc: any, [key, value]) => {
    acc[`${colorVar}-${key}`] = colorHslCss({
      color: value,
      rounded: true,
      onlyColors: true,
    });
    acc[`${colorForegroundVar}-${key}`] = colorHslCss({
      color: foregroundPalette[key],
      rounded: true,
      onlyColors: true,
    });
    // const [h, s, l] = colorHslPercent(value, true);
    // const [hF, sF, lF] = colorHslPercent(foregroundPalette[key], true);
    // acc[`${colorVar}-${key}`] = `${h}, ${s}%, ${l}%`;
    // acc[`${colorForegroundVar}-${key}`] = `${hF}, ${sF}%, ${lF}%`;
    return acc;
  }, {});
};

export type TwThemeGenBaseOptions = {
  theme?: any;
  darkMode?: "class" | "media";
  scope?: string;
  scopeAttr?: string;
  primary: Color;
  secondary: Color;
  tertiary: Color;
};

const adjustHslColor = (color: string, idx: number, adjustTo: string) =>
  color
    .split(",")
    .map((n, i) => (i === idx ? adjustTo : n))
    .join(",");

// generate theme base color variables
export const genTailwindThemeBase = ({
  theme,
  darkMode = "class",
  scope,
  scopeAttr = "data-theme",
  primary,
  secondary,
  tertiary,
}: TwThemeGenBaseOptions) => {
  const [pH, pS, pL] = colorHslPercent(primary, true);
  const [sH, sS, sL] = colorHslPercent(secondary, true);
  const [tH, tS, tL] = colorHslPercent(tertiary, true);

  const root: Record<string, string> = {};
  const dark: Record<string, string> = {};

  const destructiveHue = colorHslPercent(chroma(colors.red[500]), true)[0];
  const successHue = colorHslPercent(chroma(colors.green[500]), true)[0];
  const warningHue = colorHslPercent(chroma(colors.amber[500]), true)[0];

  const primaryPalette = genColorPalette(primary);
  const twPrimaryPalette = genTWColorPalette({
    paletteName: "primary",
    palette: primaryPalette,
  });
  Object.entries(twPrimaryPalette).forEach(([key, value]) => {
    root[key] = value;
  });

  const secondaryPalette = genColorPalette(secondary);
  const twSecondaryPalette = genTWColorPalette({
    paletteName: "secondary",
    palette: secondaryPalette,
  });
  Object.entries(twSecondaryPalette).forEach(([key, value]) => {
    root[key] = value;
  });

  const tertiaryPalette = genColorPalette(tertiary);
  const twTertiaryPalette = genTWColorPalette({
    paletteName: "tertiary",
    palette: tertiaryPalette,
  });
  Object.entries(twTertiaryPalette).forEach(([key, value]) => {
    root[key] = value;
  });

  // <body />
  root["--background"] = root["--primary-50"];
  dark["--background"] = root["--primary-950"];
  // root["--background"] = `${pHsl.h}, 30%, 95%`;
  // dark["--background"] = `${pHsl.h}, 30%, 5%`;

  root["--foreground"] = root["--primary-foreground-50"];
  dark["--foreground"] = root["--primary-foreground-950"];
  // root["--foreground"] = `${pHsl.h}, ${pS}%, 10%`;
  // dark["--foreground"] = `${pHsl.h}, ${pS}%, 90%`;

  // <Card />
  root["--card"] = adjustHslColor(root["--secondary-100"], 1, "20%");
  dark["--card"] = adjustHslColor(root["--secondary-900"], 1, "20%");
  // root["--card"] = `${sHsl.h}, 30%, 90%`;
  // dark["--card"] = `${sHsl.h}, 30%, 10%`;

  root["--card-foreground"] = root["--secondary-foreground-100"];
  dark["--card-foreground"] = root["--secondary-foreground-900"];
  // root["--card-foreground"] = `${sHsl.h}, ${sHsl.s}%, 10%`;
  // dark["--card-foreground"] = `${sHsl.h}, ${sHsl.s}%, 90%`;

  // <DropdownMenu />, <HoverCard />, <Popover />
  root["--popover"] = root["--primary-50"];
  dark["--popover"] = root["--primary-950"];
  // root["--popover"] = `${pHsl.h}, 35%, 95%`;
  // dark["--popover"] = `${pHsl.h}, 35%, 5%`;

  root["--popover-foreground"] = root["--primary-foreground-50"];
  dark["--popover-foreground"] = root["--primary-foreground-950"];
  // root["--popover-foreground"] = `${pHsl.h}, ${pS}%, 10%`;
  // dark["--popover-foreground"] = `${pHsl.h}, ${pS}%, 90%`;

  root["--primary"] = root["--primary-500"];
  dark["--primary"] = root["--primary-800"];
  // root["--primary"] = `${pHsl.h}, ${pS}%, ${pHsl.l}%`;
  // dark["--primary"] = `${pHsl.h}, ${pS}%, ${100 - pHsl.l}%`;

  root["--primary-foreground"] = root["--primary-foreground-500"];
  dark["--primary-foreground"] = root["--primary-foreground-800"];
  // root["--primary-foreground"] = `${pHsl.h}, ${pS}%, 10%`;
  // dark["--primary-foreground"] = `${pHsl.h}, ${pS}%, 90%`;

  root["--secondary"] = root["--secondary-500"];
  dark["--secondary"] = root["--secondary-800"];
  // root["--secondary"] = `${sHsl.h}, ${sHsl.s}%, ${sHsl.l}%`;
  // dark["--secondary"] = `${sHsl.h}, ${sHsl.s}%, ${sHsl.l}%`;

  root["--secondary-foreground"] = root["--secondary-foreground-500"];
  dark["--secondary-foreground"] = root["--secondary-foreground-800"];
  // root["--secondary-foreground"] = `${sHsl.h}, ${sHsl.s}%, 10%`;
  // dark["--secondary-foreground"] = `${sHsl.h}, ${sHsl.s}%, 90%`;

  root["--tertiary"] = root["--tertiary-500"];
  dark["--tertiary"] = root["--tertiary-800"];
  // root["--tertiary"] = `${tHsl.h}, ${tHsl.s}%, ${tHsl.l}%`;
  // dark["--tertiary"] = `${tHsl.h}, ${tHsl.s}%, ${tHsl.l}%`;

  root["--tertiary-foreground"] = root["--tertiary-foreground-500"];
  dark["--tertiary-foreground"] = root["--tertiary-foreground-800"];
  // root["--tertiary-foreground"] = `${tHsl.h}, ${tHsl.s}%, 10%`;
  // dark["--tertiary-foreground"] = `${tHsl.h}, ${tHsl.s}%, 90%`;

  // <TabsList />, <Skeleton /> and <Switch />
  root["--muted"] = adjustHslColor(root["--primary-100"], 1, "30%");
  dark["--muted"] = adjustHslColor(root["--primary-900"], 1, "30%");
  // root["--muted"] = `${pHsl.h}, 30%, 90%`;
  // dark["--muted"] = `${pHsl.h}, 30%, 10%`;

  root["--muted-foreground"] = root["--primary-foreground-100"];
  dark["--muted-foreground"] = root["--primary-foreground-900"];
  // root["--muted-foreground"] = `${pHsl.h}, 25%, 30%`;
  // dark["--muted-foreground"] = `${pHsl.h}, 25%, 75%`;

  // hover effects on <DropdownMenuItem>, <SelectItem>
  root["--accent"] = root["--tertiary-200"];
  dark["--accent"] = root["--tertiary-800"];
  // root["--accent"] = `${tHsl.h}, ${tHsl.s}%, 10%`;
  // dark["--accent"] = `${tHsl.h}, ${tHsl.s}%, 90%`;

  root["--accent-foreground"] = root["--tertiary-foreground-200"];
  dark["--accent-foreground"] = root["--tertiary-foreground-800"];
  // root["--accent-foreground"] = `${tHsl.h}, ${tHsl.s}%, 90%`;
  // dark["--accent-foreground"] = `${tHsl.h}, ${tHsl.s}%, 10%`;

  root["--destructive"] = `${destructiveHue}, ${pS}%, 60%`;
  dark["--destructive"] = `${destructiveHue}, ${pS}%, 30%`;

  root["--destructive-foreground"] = `${destructiveHue}, 25%, 10%`;
  dark["--destructive-foreground"] = `${destructiveHue}, 25%, 85%`;

  root["--success"] = `${successHue}, ${pS}%, 50%`;
  dark["--success"] = `${successHue}, ${pS}%, 30%`;

  root["--success-foreground"] = `${successHue}, 80%, 10%`;
  dark["--success-foreground"] = `${successHue}, 80%, 10%`;

  root["--warning"] = `${warningHue}, ${pS}%, 50%`;
  dark["--warning"] = `${warningHue}, ${pS}%, 30%`;

  root["--warning-foreground"] = `${warningHue}, ${pS}%, 10%`;
  dark["--warning-foreground"] = `${warningHue}, ${pS}%, 80%`;

  root["--border"] = root["--secondary-200"];
  dark["--border"] = root["--secondary-900"];
  // root["--border"] = `${sHsl.h}, 30%, 90%`;
  // dark["--border"] = `${sHsl.h}, 30%, 20%`;

  root["--input"] = root["--secondary-200"];
  dark["--input"] = root["--secondary-800"];
  // root["--input"] = `${sHsl.h}, 30%, 90%`;
  // dark["--input"] = `${sHsl.h}, 30%, 20%`;

  // focus ring
  root["--ring"] = root["--tertiary-950"];
  dark["--ring"] = root["--tertiary-800"];
  // root["--ring"] = `${tHsl.h}, 80%, 5%`;
  // dark["--ring"] = `${tHsl.h}, 30%, 80%`;

  // card, input and buttons
  root["--radius"] = "0.5rem";

  // console.log(root, dark);

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

export function withOpacity(cssVariable: string) {
  return ({ opacityValue }: { opacityValue: string }) =>
    opacityValue
      ? `hsla(var(${cssVariable}), ${opacityValue})`
      : `hsl(var(${cssVariable}))`;
}
