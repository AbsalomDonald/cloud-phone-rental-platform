/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 1,
    workerThreads: true
  },
  reactStrictMode: true
};

export default nextConfig;
