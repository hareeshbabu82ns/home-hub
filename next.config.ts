import type { NextConfig } from "next";
// import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
};
export default nextConfig;

// const shouldEnablePwa = process.env.NEXT_ENABLE_PWA === "true";

// const pwaConfig = shouldEnablePwa
//   ? withPWA( {
//     dest: "public",
//     register: true,
//     skipWaiting: true,
//     disable: process.env.NODE_ENV === "development",
//     runtimeCaching: [
//       {
//         urlPattern: /^https?.*/,
//         handler: "NetworkFirst",
//         options: {
//           cacheName: "offlineCache",
//           expiration: {
//             maxEntries: 200,
//           },
//         },
//       },
//     ],
//   } )
//   : ( config: NextConfig ) => config;

// export default pwaConfig( nextConfig );
