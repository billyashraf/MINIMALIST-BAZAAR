import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Minimalist Bazaar",
    default: "Minimalist Bazaar",
  },
  description: "Curated products from the best online stores — minimal design, quality picks.",
  openGraph: {
    type: "website",
    siteName: "Minimalist Bazaar",
    title: "Minimalist Bazaar",
    description: "Curated products from the best online stores.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minimalist Bazaar",
    description: "Curated products from the best online stores.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
