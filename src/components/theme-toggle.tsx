"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_COLOR_PALETTES } from "../../tailwind.config";

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  const handleSetCustomThemeToHtml = (themeName: string) => {
    if (["light", "dark", "system"].includes(themeName)) {
      setTheme(themeName);
      document.documentElement.dataset.theme = undefined;
    } else {
      document.documentElement.dataset.theme = themeName;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="scrollbar-none max-h-[500px] overflow-auto"
      >
        <DropdownMenuItem onClick={() => handleSetCustomThemeToHtml("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetCustomThemeToHtml("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSetCustomThemeToHtml("system")}>
          System
        </DropdownMenuItem>

        {Object.keys(THEME_COLOR_PALETTES).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleSetCustomThemeToHtml(key)}
          >
            {THEME_COLOR_PALETTES[key].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
