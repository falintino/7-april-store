import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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