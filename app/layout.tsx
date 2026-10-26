import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";

const siteUrl = "https://store.falintino.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "7 April Store × Store Falintino – Top Up Game",
    template: "%s | 7 April Store × Store Falintino",
  },
  description:
    "7 April Store × Store Falintino menyediakan layanan top up game dan produk digital secara online dengan pembayaran QRIS.",
  keywords: [
    "7 April Store",
    "top up Free Fire",
    "top up FF",
    "top up Free Fire murah",
    "Diamond Free Fire",
    "beli Diamond Free Fire",
    "top up FF murah",
    "top up FF QRIS",
    "top up game",
  ],
  applicationName: "7 April Store × Store Falintino",
  category: "games",
  creator: "7 April Store × Store Falintino",
  publisher: "7 April Store × Store Falintino",
  alternates: { canonical: siteUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "7 April Store × Store Falintino – Top Up Game",
    description:
      "Top up game secara online di 7 April Store × Store Falintino dengan harga transparan dan pembayaran QRIS.",
    url: siteUrl,
    siteName: "7 April Store × Store Falintino",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/cover.png",
        width: 1200,
        height: 630,
        alt: "7 April Store – Top Up Free Fire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "7 April Store × Store Falintino – Top Up Game",
    description:
      "Top up game secara online di 7 April Store × Store Falintino.",
    images: ["/cover.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "7 April Store × Store Falintino",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  email: "falintino10@gmail.com",
  telephone: "+62895704041437",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "7 April Store × Store Falintino",
  url: siteUrl,
  inLanguage: "id-ID",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#030712] text-white antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
