import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.KARSAAZ_BACKEND_URL || "http://localhost:3030";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3030",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.18.61",
        port: "3030",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.18.118",
        port: "3030",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.18.97",
        port: "3030",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.100.25",
        port: "3030",
        pathname: "/**",
      },
    ],
  },
  env: {
    KARSAAZ_BACKEND_URL: BACKEND_URL,
  },
};

export default nextConfig;
