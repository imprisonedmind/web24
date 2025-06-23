// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/*",
      },
      {
        protocol: "https",
        hostname: "media0.giphy.com",
        port: "",
        pathname: "/**",
      }, {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/**"
      }
    ],
  },
};

module.exports = nextConfig;
