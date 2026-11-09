/** Build-time app details (set in next.config.ts). */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;
export const NODE_VERSION = process.env.NEXT_PUBLIC_NODE_VERSION ?? null;
