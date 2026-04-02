import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { LegacyServiceWorkerCleanup } from "@/components/system/LegacyServiceWorkerCleanup";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Golf Charity - Score, Win, Give Back",
  description:
    "Track golf scores, participate in monthly draws, and support charities.",
  keywords: ["golf", "charity", "subscription", "draws", "prizes"],
  authors: [{ name: "Golf Charity Team" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-background text-foreground">
        <LegacyServiceWorkerCleanup />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
