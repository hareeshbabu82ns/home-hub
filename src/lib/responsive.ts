/**
 * Mobile-first responsive design utilities and constants
 */

// Breakpoints (matching Tailwind's default breakpoints)
export const BREAKPOINTS = {
  sm: 640, // Small devices (phones)
  md: 768, // Medium devices (tablets)
  lg: 1024, // Large devices (desktops)
  xl: 1280, // Extra large devices
  "2xl": 1536, // Extra extra large devices
} as const;

// Mobile breakpoint for consistency
export const MOBILE_BREAKPOINT = BREAKPOINTS.lg; // 1024px

/**
 * Common responsive class patterns for mobile-first design
 */
export const RESPONSIVE_CLASSES = {
  // Layout containers
  container: "container mx-auto px-4 sm:px-6 lg:px-8",

  // Padding patterns
  padding: {
    page: "p-4 sm:p-6 lg:p-8",
    section: "p-3 sm:p-4 lg:p-6",
    card: "p-4 sm:p-5 lg:p-6",
  },

  // Text sizing (mobile-first)
  text: {
    title: "text-xl sm:text-2xl lg:text-3xl",
    subtitle: "text-lg sm:text-xl lg:text-2xl",
    body: "text-sm sm:text-base",
    caption: "text-xs sm:text-sm",
  },

  // Grid patterns
  grid: {
    cards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    twoCol: "grid grid-cols-1 lg:grid-cols-2",
    sidebar: "grid grid-cols-1 lg:grid-cols-[260px_1fr]",
  },

  // Spacing
  gap: {
    items: "gap-3 sm:gap-4 lg:gap-6",
    sections: "gap-6 sm:gap-8 lg:gap-12",
  },

  // Navigation
  nav: {
    height: "h-14", // Consistent nav height
    sidebar: "w-64", // Consistent sidebar width
  },
} as const;

/**
 * Helper function to check if current screen size is mobile
 * Note: This should be used in client components only
 */
export const isMobileScreen = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Responsive visibility classes
 */
export const VISIBILITY = {
  mobileOnly: "block lg:hidden",
  desktopOnly: "hidden lg:block",
  tabletUp: "hidden sm:block",
  desktopUp: "hidden lg:block",
} as const;
