"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function Page() {
  const { setTheme } = useTheme();
  return (
    <div>
      <h1 className="my-4 text-2xl font-semibold">Settings</h1>
      <div className="my-4 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Appearance</h3>
          <p className="text-muted-foreground text-sm">
            Customize the appearance of the app. Automatically switch between
            day and night themes.
          </p>
        </div>
        <Button
          asChild
          variant={"ghost"}
          className="size-fit"
          onClick={() => setTheme("light")}
        >
          <div className="flex flex-col">
            <div className="border-muted hover:border-accent items-center rounded-md border-2 p-1">
              <div className="bg-muted space-y-2 rounded-sm p-2">
                <div className="bg-card space-y-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted h-2 w-[80px] rounded-lg" />
                  <div className="bg-muted h-2 w-[100px] rounded-lg" />
                </div>
                <div className="bg-card flex items-center space-x-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted size-4 rounded-full" />
                  <div className="bg-muted h-2 w-[100px] rounded-lg" />
                </div>
                <div className="bg-card flex items-center space-x-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted size-4 rounded-full" />
                  <div className="bg-muted h-2 w-[100px] rounded-lg" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              Light
            </span>
          </div>
        </Button>
        <Button
          asChild
          variant={"ghost"}
          onClick={() => setTheme("dark")}
          className="size-fit"
        >
          <div className="flex flex-col">
            <div className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground items-center rounded-md border-2 p-1">
              <div className="bg-background space-y-2 rounded-sm p-2">
                <div className="bg-card space-y-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted h-2 w-[80px] rounded-lg" />
                  <div className="bg-muted h-2 w-[100px] rounded-lg" />
                </div>
                <div className="bg-card flex items-center space-x-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted size-4 rounded-full" />
                  <div className="bg-muted h-2 w-[100px] rounded-lg" />
                </div>
                <div className="bg-card flex items-center space-x-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted size-4 rounded-full" />
                  <div className="bg-muted h-2 w-[100px] rounded-lg" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              Dark
            </span>
          </div>
        </Button>
        <Button
          asChild
          variant={"ghost"}
          onClick={() => setTheme("system")}
          className="size-fit"
        >
          <div className="flex flex-col">
            <div className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground items-center rounded-md border-2 p-1">
              <div className="bg-muted space-y-2 rounded-sm p-2">
                <div className="bg-card space-y-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted-foreground h-2 w-[80px] rounded-lg" />
                  <div className="bg-muted-foreground h-2 w-[100px] rounded-lg" />
                </div>
                <div className="bg-card flex items-center space-x-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted-foreground size-4 rounded-full" />
                  <div className="bg-muted-foreground h-2 w-[100px] rounded-lg" />
                </div>
                <div className="bg-card flex items-center space-x-2 rounded-md p-2 shadow-sm">
                  <div className="bg-muted-foreground size-4 rounded-full" />
                  <div className="bg-muted-foreground h-2 w-[100px] rounded-lg" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              System
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}
