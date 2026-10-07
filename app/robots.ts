import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/login",
        "/daftar",
        "/order/",
        "/payment/",
        "/profil/",
      ],
    },
    sitemap: "https://store.falintino.com/sitemap.xml",
    host: "https://store.falintino.com",
  };
}
