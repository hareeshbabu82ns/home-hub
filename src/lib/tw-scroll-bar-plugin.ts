// ref - https://github.com/gradints/tailwindcss-scrollbar/blob/main/README.md
import plugin, { type PluginAPI } from "tailwindcss/plugin";

type CSSRuleObject = Record<string, unknown>;
type DarkModeConfig = "media" | "class" | ["class", string];

interface StyleOptions {
  background?: string;
  darkBackground?: string;
}
interface PluginOptions {
  size?: string;
  track?: StyleOptions;
  thumb?: StyleOptions;
  hover?: StyleOptions;
}

const themeKey = "scrollbar"; // theme.scrollbar
const darkClass = "dark";

const omit = (key: string, { [key]: _, ...obj }: Record<string, unknown>) =>
  obj;

/**
 * Handle plugin.withOptions and theme.scrollbar.DEFAULT
 */
const getDefaultStyle = (options: PluginOptions, pluginAPI: PluginAPI) => {
  const { theme, config } = pluginAPI;

  const getSize = () => {
    return (
      options?.size ?? (theme(`${themeKey}.DEFAULT.size`, "5px") as string)
    );
  };
  const getStyleTrack = () => {
    const background = "#f1f1f1"; // default
    const fromConfig =
      (theme(`${themeKey}.DEFAULT.track`, {}) as Record<string, unknown>) || {}; // with tailwind.config.js
    const fromOptions = options?.track ?? {}; // with plugin options

    const finalConfig = { background, ...fromConfig, ...fromOptions };

    if (!finalConfig.darkBackground) {
      finalConfig.darkBackground = finalConfig.background;
    }

    return finalConfig;
  };
  const getStyleThumb = () => {
    const background = "#c1c1c1";
    const fromConfig =
      (theme(`${themeKey}.DEFAULT.thumb`, {}) as Record<string, unknown>) || {}; // with tailwind.config.js
    const fromOptions = options?.thumb ?? {}; // with plugin options

    const finalConfig = { background, ...fromConfig, ...fromOptions };

    return finalConfig;
  };
  const getStyleThumbHover = () => {
    const background = "#a8a8a8";
    const fromConfig =
      (theme(`${themeKey}.DEFAULT.hover`, {}) as Record<string, unknown>) || {}; // with tailwind.config.js
    const fromOptions = options?.hover ?? {}; // with plugin options

    const finalConfig = { background, ...fromConfig, ...fromOptions };

    return finalConfig;
  };

  const size = getSize();
  const track = getStyleTrack();
  const thumb = getStyleThumb();
  const hover = getStyleThumbHover();

  const styles: CSSRuleObject[] = [
    {
      "::-webkit-scrollbar": {
        width: size,
        height: size,
      },
      "::-webkit-scrollbar-track": omit("darkBackground", track),
      "::-webkit-scrollbar-thumb": omit("darkBackground", thumb),
      "::-webkit-scrollbar-thumb:hover": omit("darkBackground", hover),
    },
  ];

  const dark = {
    "::-webkit-scrollbar-track": {
      background: track.darkBackground ?? track.background,
    },
    "::-webkit-scrollbar-thumb": {
      background: thumb.darkBackground ?? thumb.background,
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: hover.darkBackground ?? hover.background,
    },
  };
  const light = {
    "::-webkit-scrollbar-track": {
      background: track.background,
    },
    "::-webkit-scrollbar-thumb": {
      background: thumb.background,
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: hover.background,
    },
  };

  const darkModeConfig = config(
    "darkMode",
  ) as unknown as Partial<DarkModeConfig>;
  if (darkModeConfig === "media") {
    styles.push({
      "@media (prefers-color-scheme: dark)": dark,
      "@media (prefers-color-scheme: light)": light,
    });
  } else {
    styles.push({
      [`.${darkClass}`]: dark,
    });
  }

  return styles;
};

/**
 * Handle theme.scrollbar.<any key>
 */
const getCustomStyles = (pluginAPI: PluginAPI) => {
  const { theme, config } = pluginAPI;

  const styles = Object.entries(theme(themeKey, {}))
    .filter(([key]) => key !== "DEFAULT")
    .map(([key, val]) => {
      const className = `.${themeKey}-${key}`;

      const { size, track, thumb, hover } = val as PluginOptions;

      if (!size) {
        throw new Error(
          `[@gradin/tailwindcss-scrollbar] theme.${themeKey}.${key} should have property [size].`,
        );
      }
      if (!track) {
        throw new Error(
          `[@gradin/tailwindcss-scrollbar] theme.${themeKey}.${key} should have property [size].`,
        );
      }
      if (!thumb) {
        throw new Error(
          `[@gradin/tailwindcss-scrollbar] theme.${themeKey}.${key} should have property [size].`,
        );
      }
      if (!hover) {
        throw new Error(
          `[@gradin/tailwindcss-scrollbar] theme.${themeKey}.${key} should have property [size].`,
        );
      }

      return {
        [`${className}::-webkit-scrollbar`]: {
          width: size,
          height: size,
        },
        [`${className}::-webkit-scrollbar-track`]: omit(
          "darkBackground",
          track as Record<string, unknown>,
        ),
        [`${className}::-webkit-scrollbar-thumb`]: omit(
          "darkBackground",
          thumb as Record<string, unknown>,
        ),
        [`${className}::-webkit-scrollbar-thumb:hover`]: omit(
          "darkBackground",
          hover as Record<string, unknown>,
        ),
      } as CSSRuleObject;
    });

  const dark = Object.entries(theme(themeKey, {}))
    .filter(([key]) => key !== "DEFAULT")
    .map(([key, val]) => {
      const className = `.${themeKey}-${key}`;
      const value = val as PluginOptions;
      const track = value.track ?? {};
      const thumb = value.thumb ?? {};
      const hover = value.hover ?? {};

      return {
        [`${className}::-webkit-scrollbar-track`]: {
          background: track.darkBackground ?? track.background,
        },
        [`${className}::-webkit-scrollbar-thumb`]: {
          background: thumb.darkBackground ?? thumb.background,
        },
        [`${className}::-webkit-scrollbar-thumb:hover`]: {
          background: hover.darkBackground ?? hover.background,
        },
      };
    });
  const light = Object.entries(theme(themeKey, {}))
    .filter(([key]) => key !== "DEFAULT")
    .map(([key, val]) => {
      const className = `.${themeKey}-${key}`;
      const value = val as PluginOptions;
      const track = value.track ?? {};
      const thumb = value.thumb ?? {};
      const hover = value.hover ?? {};

      return {
        [`${className}::-webkit-scrollbar-track`]: {
          background: track.background,
        },
        [`${className}::-webkit-scrollbar-thumb`]: {
          background: thumb.background,
        },
        [`${className}::-webkit-scrollbar-thumb:hover`]: {
          background: hover.background,
        },
      };
    });

  const darkModeConfig2 = config(
    "darkMode",
  ) as unknown as Partial<DarkModeConfig>;
  if (darkModeConfig2 === "media") {
    styles.push({
      "@media (prefers-color-scheme: dark)": dark,
      "@media (prefers-color-scheme: light)": light,
    } as unknown as CSSRuleObject);
  } else {
    dark.forEach((s) => {
      styles.push({
        [`.${darkClass}`]: s,
      } as unknown as CSSRuleObject);
    });
  }

  return styles;
};

const scrollbarNoneStyle: CSSRuleObject[] = [
  {
    [`.${themeKey}-none`]: {
      "-ms-overflow-style": "none" /* IE and Edge */,
      "scrollbar-width": "none" /* Firefox */,
    },
  },
  {
    [`.${themeKey}-none::-webkit-scrollbar`]: {
      display: "none" /* Chrome, Safari, Opera */,
    },
  },
];

export default plugin.withOptions<PluginOptions>((options = {}) => {
  return (pluginAPI): void => {
    const { addBase, addUtilities } = pluginAPI;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addBase(getDefaultStyle(options, pluginAPI as any) as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addUtilities(getCustomStyles(pluginAPI as any) as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addUtilities(scrollbarNoneStyle as any);
  };
});
