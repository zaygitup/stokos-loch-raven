import type { NextConfig } from "next";
// @ts-expect-error – next-pwa has no official TS types bundle
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
      },
      {
        protocol: "https",
        hostname: "static.vecteezy.com",
      },
      {
        protocol: "https",
        hostname: "wandercooks.com",
      },
      {
        protocol: "https",
        hostname: "recipesfromapantry.com",
      },
      {
        protocol: "https",
        hostname: "seasonandthyme.com",
      },
      {
        protocol: "https",
        hostname: "www.savingdessert.com",
      },
    ],
  },

  devIndicators: false,
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);