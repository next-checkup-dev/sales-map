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
  // Google Sheets API 관련 Node.js 모듈을 클라이언트에서 제외
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
      }
    }
    return config
  },
}

module.exports = nextConfig 