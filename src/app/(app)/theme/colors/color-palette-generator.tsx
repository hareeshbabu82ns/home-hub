"use client";

import React, { useEffect, useState } from "react";
import ColorPickerSimple from "./color-picker-simple";
import {
  ColorPalette,
  genColorPalette,
  genForegroundColorPalette,
  triadColors as triad,
} from "@/lib/colors";
import chroma, { type Color } from "chroma-js";
import { updateBrowserTwThemeVariables } from "@/lib/tw-theme-gen-plugin";

// const initColor = tinycolor.random();
// const initColor = tinycolor.random();
// const initPalette = generatePalette(initColor);

const ColorPaletteGenerator = ({
  initColor = chroma.hsl(111.0, 0.5, 0.5).hex(),
}: {
  initColor?: string;
}) => {
  const [color, setColor] = useState<Color>(chroma(initColor));

  const [palette, setPalette] = useState<ColorPalette>(
    genColorPalette(chroma(initColor)),
  );
  const [paletteForeground, setPaletteForeground] = useState<ColorPalette>(
    genForegroundColorPalette(genColorPalette(chroma(initColor))),
  );

  const handleColorChange = (color: Color) => {
    updateBrowserTwThemeVariables(color);
    setColor(color);
  };

  useEffect(() => {
    // console.log("color changed", color.hsl());
    if (!color) return;
    const palette = genColorPalette(color);
    setPalette(palette);
    setPaletteForeground(genForegroundColorPalette(palette));
  }, [color]);

  return (
    <div className="flex flex-col gap-4">
      <ColorPickerSimple color={color} onColorChange={handleColorChange} />
      <div className="flex flex-col space-y-2 overflow-x-auto rounded-lg md:flex-row md:space-x-1 md:space-y-0">
        {Object.keys(palette.colors).map((key) => {
          return (
            <PaletteColorBlock
              key={key}
              paletteKey={key}
              color={palette.colors[key]}
              foregroundColor={paletteForeground.colors[key]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorPaletteGenerator;

const PaletteColorBlock = ({
  paletteKey: key,
  color,
  foregroundColor,
}: {
  paletteKey: string;
  color: Color;
  foregroundColor: Color;
}) => {
  // console.log("color block", color.hex());
  return (
    <div
      className="flex h-14 w-full flex-col items-center justify-center rounded-lg p-4 md:h-28 md:p-6"
      style={{ backgroundColor: color.hex() }}
    >
      <div className="flex cursor-pointer justify-between px-4 md:mt-auto md:block md:px-0">
        <div style={{ color: foregroundColor.hex() }}>
          <div className="text-center text-sm font-medium">{key}</div>
          <div className="text-center text-xs uppercase opacity-90">
            {color
              .hsl()
              .filter((_, i) => i < 3)
              .map((num, i) => Math.round(i > 0 ? num * 100 : num))
              .join(" ")}
          </div>
          <div className="text-center text-xs uppercase opacity-90">
            {color.hex()}
          </div>
        </div>
      </div>
    </div>
  );
};
