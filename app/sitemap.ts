import type { MetadataRoute } from "next";

const baseUrl = "https://store.falintino.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/topup`, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/topup/free-fire`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tentang-kami`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/jual-akun`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/rekber`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/id-cantik`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/rental`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/syarat-ketentuan`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/kebijakan-privasi`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/kebijakan-refund`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/kebijakan-pengiriman`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
