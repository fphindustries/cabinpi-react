/** @type {import('next').NextConfig} */

const nextConfig = {
    experimental: {
        //instrumentationHook: true,
        serverComponentsExternalPackages: ['@iiot2k/gpiox'],
    },
};

export default nextConfig;
