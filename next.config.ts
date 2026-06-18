import type { NextConfig } from "next";

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

export default nextConfig;