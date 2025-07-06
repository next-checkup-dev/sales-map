/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 라우트를 사용하기 위해 output: 'export' 제거
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Firebase 호스팅을 위한 설정
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
}

module.exports = nextConfig 