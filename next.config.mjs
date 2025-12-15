/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,

    // ⭐ thêm mục này để Next cho phép ảnh từ Static OSM
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'staticmap.openstreetmap.de',
        pathname: '/staticmap.php',
      },
      {
        protocol: 'https',
        hostname: 'tile.openstreetmap.org',
      }
    ],
  },

  allowedDevOrigins: [
    'https://travel-safety-backend.onrender.com/',
    'https://travel-safety-frontend.vercel.app',
      'http://localhost:3000', // Port 3000 thường là mặc định của React/Next.js
      'http://127.0.0.1:3000'  ],
}

export default nextConfig
