import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/rekber",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/rental",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/jual-akun",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/id-cantik",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/stok-akun",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/pesanan-akun",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/akun",
        destination: "/topup",
        permanent: true,
      },
      {
        source: "/akun/:path*",
        destination: "/topup",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
