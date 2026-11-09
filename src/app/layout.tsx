import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the standalone app draw under the notch / home indicator; the
  // layout pads itself with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9f2f0" },
    { media: "(prefers-color-scheme: dark)", color: "#13201d" },
  ],
};

export const metadata: Metadata = {
  title: { default: "HomeHub", template: "%s · HomeHub" },
  applicationName: "HomeHub",
  description: "A home for your home - Smart home management and automation",
  manifest: "/manifest.json",
  keywords: ["home", "smart home", "automation", "dashboard", "hub"],
  authors: [{ name: "HomeHub Team" }],
  creator: "HomeHub",
  publisher: "HomeHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HomeHub",
    description: "A home for your home - Smart home management and automation",
    url: "/",
    siteName: "HomeHub",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "HomeHub Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeHub",
    description: "A home for your home - Smart home management and automation",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-180.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HomeHub",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="mask-icon" href="/logo.svg" color="#0ea5e9" />
      </head>
      <body
        className={cn(
          "bg-background min-h-dvh font-sans antialiased",
          fontSans.variable,
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="homehub-theme"
        >
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
