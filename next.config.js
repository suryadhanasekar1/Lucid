/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // yahoo-finance2 ships Deno-only test helpers that webpack can't resolve.
    // The market client is server-only (called from /api/market/prices), so we
    // tell Next to leave it as a runtime require.
    serverComponentsExternalPackages: ["yahoo-finance2"],
  },
};

module.exports = nextConfig;
