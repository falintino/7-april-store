import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://store.falintino.com"),

  title: {
    default: "7 April Store – Top Up Game",
    template: "%s | 7 April Store",
  },

  description:
    "7 April Store menyediakan layanan top up game dan pembelian Diamond Free Fire secara online.",

  keywords: [
    "7 April Store",
    "Top Up Game",
    "Top Up Free Fire",
    "Diamond Free Fire",
    "Top Up Game Indonesia",
  ],

  openGraph: {
    title: "7 April Store – Top Up Game",
    description:
      "Layanan top up game dan pembelian Diamond Free Fire secara online.",
    url: "https://store.falintino.com",
    siteName: "7 April Store",
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 April Store – Top Up Game",
    description:
      "Layanan top up game dan pembelian Diamond Free Fire secara online.",
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
    <html lang="id">
      <body className="bg-[#030712] text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}