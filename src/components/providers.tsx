"use client";

import * as React from "react";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toastVariants } from "./custom-toast";

export const queryClient = new QueryClient();

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider {...props}>
          <TooltipProvider delayDuration={1000}>
            <ShadcnToaster />
            <Toaster
              position="top-center"
              className="toast border-border bg-background text-foreground group w-full max-w-xl shadow-lg"
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast: cn(toastVariants({ variant: "default" })),
                  error: cn(toastVariants({ variant: "destructive" })),
                  success: cn(toastVariants({ variant: "success" })),
                  warning: cn(toastVariants({ variant: "warning" })),
                  info: cn(toastVariants({ variant: "default" })),
                  closeButton: "left-1 top-1",
                },
              }}
            />
            {children}
          </TooltipProvider>
        </NextThemesProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
