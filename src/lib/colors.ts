import chroma, { type Color } from "chroma-js";

export type ColorPalette = {
  name: string;
  colors: {
    [key: string]: Color;
  };
};

export const COLOR_CHALK_BOARD_GREEN = chroma.hsl(166.29, 0.3153, 0.2176); //"#264941";
export const COLOR_GOLD_YELLOW = chroma.hsl(50.59, 1, 0.5); //"#264941";

export const paletteColorKeys: string[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

export const colorHslRounded = (color: Color) => {
  const [h, s, l] = color.hsl();
  const [rH, rS, rL] = [
    Math.round(isNaN(h) ? 0 : h),
    Math.round(s * 100) * 0.01,
    Math.round(l * 100) * 0.01,
  ];
  return chroma.hsl(rH, rS, rL);
};

export const colorHslCss = ({
  color,
  rounded = false,
  onlyColors = false,
}: {
  color: Color;
  rounded?: Boolean;
  onlyColors?: Boolean;
}) => {
  const [h, s, l] = color.hsl();
  const [rH, rS, rL] = [
    rounded ? Math.round(h) : h,
    rounded ? Math.round(s * 100) : s * 100,
    rounded ? Math.round(l * 100) : l * 100,
  ];
  return onlyColors
    ? `${isNaN(rH) ? 0 : rH}, ${rS}%, ${rL}%`
    : `hsl( ${isNaN(rH) ? 0 : rH}, ${rS}%, ${rL}% )`;
};

export const colorHslPercent = (color: Color, rounded: Boolean = false) => {
  const [h, s, l] = color.hsl();
  return [
    rounded ? Math.round(h) : h,
    rounded ? Math.round(s * 100) : s * 100,
    rounded ? Math.round(l * 100) : l * 100,
  ];
};

export const genColorPalette = (
  base: Color,
  useBezier: Boolean = true,
): ColorPalette => {
  // console.log("generatePalette for: ", base.hex(), base.hsl());
  const palette: Record<string, Color> = {};

  const col = chroma(base.hex());
  useBezier
    ? chroma
        // .bezier([col.luminance(0.95).hex(), col.hex(), col.luminance(0.01).hex()])
        .bezier([
          col.set("hsl.l", "0.95").desaturate(0.2).hex(),
          col.hex(),
          col.set("hsl.l", "0.05").saturate(0.2).hex(),
        ])
        .scale()
        .colors(11, "hex")
        .forEach((c, i) => {
          palette[paletteColorKeys[i]] = chroma(c);
        })
    : chroma
        .scale([
          col.set("hsl.l", "0.95").desaturate(0.1).hex(),
          col.hex(),
          col.set("hsl.l", "0.05").saturate(0.1).hex(),
        ])
        .colors(11, "hex")
        .forEach((c, i) => {
          palette[paletteColorKeys[i]] = chroma(c);
        });
  return { name: "", colors: palette };
};

const genSafePalette = (base: Color): ColorPalette => {
  const palette = genColorPalette(
    base.get("hsl.l") < 5 ? base.set("hsl.l", 10) : base,
  ).colors;

  const latestWhite = Object.keys(palette)
    .reverse()
    .find((key) => {
      return palette[key].get("hsl.l") >= 100;
    });
  if (latestWhite && latestWhite !== "50") {
    const whiteIndex = paletteColorKeys.indexOf(latestWhite);
    const halfIndex = Math.round(paletteColorKeys.length / 2);
    const newIndex = halfIndex + whiteIndex;
    // console.log("latestWhite", latestWhite, whiteIndex, newIndex);
    return genColorPalette(base.darken(whiteIndex * 0.15));
  }

  return { name: "", colors: palette };
};

export function negateColor(color: Color) {
  const rgb = color.rgb();
  for (let i = 0; i < 3; i++) {
    rgb[i] = 255 - rgb[i];
  }
  return chroma(rgb);
}

export function complementColor(color: Color) {
  var [h, s, l] = color.hsl();
  h = (h + 180) % 360;
  return chroma.hsl(h, s, l);
}

export function splitcomplementColors(color: Color) {
  var [h, s, l] = color.hsl();
  var h = h;
  return [
    color,
    chroma.hsl((h + 72) % 360, s, l),
    chroma.hsl((h + 216) % 360, s, l),
  ];
}
export function analogousColors(
  color: Color,
  results?: number,
  slices?: number,
) {
  results = results || 6;
  slices = slices || 30;
  var [h, s, l] = color.hsl();
  var part = 360 / slices;
  var ret = [color];
  for (h = (h - ((part * results) >> 1) + 720) % 360; --results; ) {
    h = (h + part) % 360;
    ret.push(chroma.hsl(h, s, l));
  }
  return ret;
}

export function triadColors(color: Color, number: number = 3) {
  if (isNaN(number) || number <= 0) {
    throw new Error("Argument to polyad must be a positive number");
  }
  var [h, s, l] = color.hsl();
  var result = [color];
  var step = 360 / number;
  for (var i = 1; i < number; i++) {
    result.push(chroma.hsl((h + i * step) % 360, s, l));
  }
  return result;
}

export const genForegroundColor = (color: Color) => {
  const negated = negateColor(color).set("hsl.h", color.get("hsl.h"));
  const luminance = Math.round(color.luminance() * 100);
  // console.log("genForegroundColor", color.css("hsl"), luminance);

  let c = chroma.contrast(negated, color);
  let ncol = chroma(negated);

  if (luminance > 45) {
    for (let i = 0.1; i < 1.0; i += 0.05) {
      if (c > 4.5) return ncol;
      // console.log("contrast darkening", Math.round(c * 10), ncol.css("hsl"));
      ncol = ncol.darken(i);
      c = chroma.contrast(ncol, color);
    }
    return ncol.darken(2);
    // return negated.darken(5);
  } else {
    for (let i = 0.1; i < 1.0; i += 0.05) {
      if (c > 3.5) return ncol;
      // console.log("contrast lightining", Math.round(c * 10), ncol.css("hsl"));
      ncol = ncol.brighten(i);
      c = chroma.contrast(ncol, color);
    }
    return ncol.brighten(2);
  }
  // return chroma("red");
};

export const genForegroundColorPalette = (
  palette: ColorPalette,
): ColorPalette => {
  const fgPalette: Record<string, Color> = {};
  Object.keys(palette.colors).forEach((key) => {
    fgPalette[key] = genForegroundColor(palette.colors[key]);
  });
  return { name: "", colors: fgPalette };
};
