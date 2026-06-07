/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prototype: don't block the production build on lint. Run `npm run lint` separately.
  eslint: { ignoreDuringBuilds: true },
  // Allow small photo/video uploads through server actions (stored as data URLs in the
  // local MVP; a real upload to private storage swaps in later).
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
