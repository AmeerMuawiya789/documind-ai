import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers for every response (see also middleware for auth).
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
        ],
      },
    ];
  },
  // Keep server-only libs out of the client bundle.
  serverExternalPackages: ["unpdf", "mammoth"],
};

export default nextConfig;
