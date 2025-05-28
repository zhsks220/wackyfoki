/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'], // ✅ 이게 실제 URL 도메인입니다
  },
};

export default nextConfig;
