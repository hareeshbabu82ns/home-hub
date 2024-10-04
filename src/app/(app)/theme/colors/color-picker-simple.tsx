import { Input } from "@/components/ui/input";
import useDebouncedCallback from "@/lib/hooks/useDebouncedCallback";
import { colorHslCss, colorHslPercent, colorHslRounded } from "@/lib/colors";
import chroma, { type Color } from "chroma-js";
import React from "react";

const ColorPickerSimple = ( {
  color,
  onColorChange,
}: {
  color: Color;
  onColorChange?: ( color: Color ) => void;
} ) => {
  const [ colorSpace, setColorSpace ] = React.useState<"hsl" | "rgb">( "hsl" );
  const handleColorSliderChange = (
    value: number,
    slider: "h" | "s" | "l" | "r" | "g" | "b",
  ) => {
    if ( [ "r", "g", "b" ].includes( slider ) ) {
      const [ r, g, b ] = color.rgb();
      const newColor = chroma.rgb(
        slider === "r" ? value : r,
        slider === "g" ? value : g,
        slider === "b" ? value : b,
      );
      onColorChange && onColorChange( newColor );
    } else {
      const [ h, s, l ] = color.hsl();
      const newColor = chroma.hsl(
        slider === "h" ? value : isNaN( h ) ? 0 : h,
        slider === "s" ? value * 0.01 : s,
        slider === "l" ? value * 0.01 : l,
      );
      const roundedColor = colorHslRounded( newColor );
      // console.log("color changing", [h, s, l], value, slider, roundedColor.hsl());
      onColorChange && onColorChange( roundedColor );
    }
  };
  const debouncedColorChange = useDebouncedCallback(
    handleColorSliderChange,
    100,
  );

  return (
    <div className="bg-muted flex flex-col items-center justify-center gap-4 p-4">
      {/* <div className="w-full @xl/palette-page:w-1/3">
        <Input
          type="text"
          placeholder="color in hex"
          name="baseColor"
          // defaultValue={color ? colorHslCss({ color, rounded: true }) : ""}
          value={color ? colorHslCss({ color, rounded: true }) : ""}
          onChange={(e) => {
            // console.log("color changing", color);
            if (!chroma.valid(e.target.value)) return;
            const newColor = chroma(e.target.value);
            onColorChange &&
              onColorChange(chroma(colorHslPercent(newColor, true), "hsl"));
            // onColorChange(chroma.hsl([...newColor.hsl().map(Math.round))]);
          }}
        />
      </div> */}

      <div className="@xl/palette-page:w-1/2 mx-auto">
        {colorSpace === "rgb" && (
          <div>
            <div
              className="form-control border-color fixed inset-x-4 bottom-6 z-40 h-14 overflow-hidden rounded-full border md:relative md:inset-0"
              style={{
                boxShadow: `rgb(0 0 0 / 8%) 0px 1px 2px, rgb(0 0 0 / 5%) 0px 4px 12px`,
              }}
            >
              <input
                type="text"
                value={color.hex()}
                onChange={( e ) => {
                  onColorChange && onColorChange( chroma( e.target.value ) );
                }}
                placeholder="Hexcode"
                className="size-full rounded-full bg-transparent px-6 pl-14 font-medium"
              />
              <input
                type="color"
                value={color.hex()}
                onChange={( e ) => {
                  onColorChange && onColorChange( chroma( e.target.value ) );
                }}
                className="absolute left-4 top-1/2 size-7 -translate-y-1/2 cursor-pointer appearance-none rounded-full border-none"
              />
              <button className="form-control absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border px-3 py-1.5 md:hidden">
                Random
              </button>
              <button
                className="absolute right-3 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center gap-1 px-3 py-1.5 text-sm font-medium md:flex"
                onClick={() =>
                  setColorSpace( colorSpace === "rgb" ? "hsl" : "rgb" )
                }
              >
                HEX
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                  ></path>
                </svg>
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="255"
              value={color.get( "rgb.r" )}
              className="mt-12 h-3 w-full appearance-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${color.set( "rgb.r", 0 ).css()} 0%, ${color.set( "rgb.r", 255 ).css()} 100%)`,
              }}
              onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "r" )}
            />
            <input
              type="range"
              min="0"
              max="255"
              className="mt-8 h-3 w-full appearance-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${color.set( "rgb.g", 0 ).css()} 0%, ${color.set( "rgb.g", 255 ).css()} 100%)`,
              }}
              value={color.get( "rgb.g" )}
              onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "g" )}
            />
            <input
              type="range"
              min="0"
              max="255"
              className="mt-8 h-3 w-full appearance-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${color.set( "rgb.b", 0 ).css()} 0%, ${color.set( "rgb.b", 255 ).css()} 100%)`,
              }}
              value={color.get( "rgb.b" )}
              onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "b" )}
            />
          </div>
        )}

        {colorSpace === "hsl" && (
          <div>
            <div
              className="form-control border-color relative flex h-14 rounded-full border shadow-md"
              style={{
                boxShadow: `rgba(0, 0, 0, 0.08) 0px 1px 2px, rgba(0, 0, 0, 0.05) 0px 4px 12px`,
              }}
            >
              <input
                type="color"
                className="absolute left-4 top-1/2 size-7 -translate-y-1/2 cursor-pointer appearance-none rounded-full border-none"
                value={color.hex()}
                onChange={( e ) => {
                  console.log( e.target.value );
                  onColorChange && onColorChange( chroma( e.target.value ) );
                }}
              />

              <div className="absolute inset-y-0 left-10 right-24 flex -space-x-px">
                <div className="relative w-1/3 min-w-0 flex-1">
                  <div className="text-color-muted-extra absolute left-4 top-1/2 -translate-y-1/2">
                    H
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={isNaN( color.get( "hsl.h" ) ) ? 0 : color.get( "hsl.h" )}
                    onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "h" )}
                    className="border-color relative block size-full border-r bg-transparent px-6 pl-10 pr-3 font-medium focus:z-10 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative w-1/3 min-w-0 flex-1">
                  <div className="text-color-muted-extra absolute left-4 top-1/2 -translate-y-1/2">
                    S
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      isNaN( color.get( "hsl.s" ) ) ? 0 : color.get( "hsl.s" ) * 100
                    }
                    onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "s" )}
                    className="border-color relative block size-full border-r bg-transparent px-6 pl-10 pr-3 font-medium focus:z-10 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative min-w-0 flex-1">
                  <div className="text-color-muted-extra absolute left-4 top-1/2 -translate-y-1/2">
                    L
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      isNaN( color.get( "hsl.l" ) ) ? 0 : color.get( "hsl.l" ) * 100
                    }
                    onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "l" )}
                    className="border-color relative block size-full rounded-none border-r bg-transparent px-6 pl-10 pr-3 font-medium focus:z-10 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center gap-1 px-3 py-1.5 text-sm font-medium"
                onClick={() =>
                  setColorSpace( colorSpace === "hsl" ? "rgb" : "hsl" )
                }
              >
                {colorSpace === "hsl" ? "HSL" : "RGB"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                  ></path>
                </svg>
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={isNaN( color.get( "hsl.h" ) ) ? 0 : color.get( "hsl.h" )}
              className="mt-12 h-3 w-full appearance-none"
              style={{
                backgroundImage: `linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red)`,
              }}
              onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "h" )}
            />
            <input
              type="range"
              min="0"
              max="100"
              className="mt-8 h-3 w-full appearance-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${color.set( "hsl.s", 0 ).css()} 0%, ${color.set( "hsl.s", 1 ).css()} 100%)`,
              }}
              value={isNaN( color.get( "hsl.s" ) ) ? 0 : color.get( "hsl.s" ) * 100}
              onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "s" )}
            />
            <input
              type="range"
              min="0"
              max="100"
              className="mt-8 h-3 w-full appearance-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${color.set( "hsl.l", 0 ).css()} 0%, ${color.css()} 50%, ${color.set( "hsl.l", 1 ).css()} 100%)`,
              }}
              value={isNaN( color.get( "hsl.l" ) ) ? 0 : color.get( "hsl.l" ) * 100}
              onChange={( e ) => debouncedColorChange( e.target.valueAsNumber, "l" )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPickerSimple;
