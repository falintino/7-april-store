import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://store.falintino.com"),

  title: {
    default: "7 April Store",
    template: "%s | 7 April Store",
  },

  description:
    "Top up game dan berbagai layanan gaming terpercaya.",

  keywords: [
    "Top Up Free Fire",
    "Top Up ML",
    "Top Up PUBG",
    "Top Up Honor of Kings",
    "Rekber",
    "7 April Store",
  ],

  openGraph: {
    title: "7 April Store",
    description: "Layanan Produk Digital Game Indonesia",
    url: "https://store.falintino.com",
    siteName: "7 April Store",
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 April Store",
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