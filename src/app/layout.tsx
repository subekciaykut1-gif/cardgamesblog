import type { Metadata } from "next";
import "./globals.css";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";

export const metadata: Metadata = {
  title: {
    default: "Card Games Blog | CardGamesHub.io",
    template: "%s | CardGamesHub.io",
  },
  description:
    "Expert card game guides, Cribbage tips, Solitaire strategies, and more — updated daily by the CardGamesHub team.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://cardgameshub.io"
  ),
};

import { ThemeProvider } from "@/components/blog/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <BlogHeader />
          <main>{children}</main>
          <BlogFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
