import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 90 para fotos de productos y portada (con 75, el valor por defecto, se ven
    // borrosas porque la foto ya viene comprimida desde Cloudinary). 75 para el resto.
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
