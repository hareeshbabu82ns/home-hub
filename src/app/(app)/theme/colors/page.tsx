import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import ColorPaletteGenerator from "./color-palette-generator";
import { COLOR_GOLD_YELLOW, paletteColorKeys } from "@/lib/colors";
import { THEME_COLOR_PALETTES } from "../../../../../tailwind.config";

const page = () => {
  return (
    <main className="my-4 space-y-4 @container/palette-page">
      <h1 className="text-xl font-semibold @lg/palette-page:text-2xl">
        Color Palette
      </h1>

      <div>
        <ColorPaletteGenerator initColor={COLOR_GOLD_YELLOW.hex()} />
      </div>

      <ColorPaletteCard title="Default Palette" />
      {Object.keys(THEME_COLOR_PALETTES).map((key) => (
        <ColorPaletteCard
          key={key}
          title={THEME_COLOR_PALETTES[key].name}
          themeName={key}
        />
      ))}
    </main>
  );
};

export default page;

const ColorPaletteCard = ({
  title,
  themeName,
}: {
  title: string;
  themeName?: string;
}) => {
  return (
    <Card data-theme={themeName}>
      <CardHeader className="text-xl @lg/palette-page:text-2xl">
        {title} {themeName ? `[data-theme=\"${themeName}\"]` : ""}
      </CardHeader>
      <CardContent className="flex justify-center gap-2 p-2 pb-4">
        <ul style={{ width: "200px" }}>
          {paletteColorKeys.map((variant) => (
            <li
              className={`bg-primary-${variant} text-primary-foreground-${variant} px-3 py-2`}
              key={variant}
            >
              {variant}
            </li>
          ))}
        </ul>
        <ul style={{ width: "200px" }}>
          {paletteColorKeys.map((variant) => (
            <li
              className={`bg-secondary-${variant} text-secondary-foreground-${variant} px-3 py-2`}
              key={variant}
            >
              {variant}
            </li>
          ))}
        </ul>
        <ul style={{ width: "200px" }}>
          {paletteColorKeys.map((variant) => (
            <li
              className={`bg-tertiary-${variant} text-tertiary-foreground-${variant} px-3 py-2`}
              key={variant}
            >
              {variant}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
