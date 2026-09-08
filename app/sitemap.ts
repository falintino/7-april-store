import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://7aprilstore.com",
      priority: 1,
    },
    {
      url: "https://7aprilstore.com/topup",
    },
    {
      url: "https://7aprilstore.com/jual-akun",
    },
    {
      url: "https://7aprilstore.com/rekber",
    },
    {
      url: "https://7aprilstore.com/rental",
    },
  ];
}