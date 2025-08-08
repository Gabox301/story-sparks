import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Ensure Prisma binaries are included
            config.externals.push({
                '@prisma/client': 'commonjs @prisma/client',
                '../generated/prisma': 'commonjs ../generated/prisma'
            });
        }
        return config;
    },
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "assets.vercel.com",
            },
            {
                protocol: "https",
                hostname: "dtnvdwcwie5leie5.public.blob.vercel-storage.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.public.blob.vercel-storage.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
    transpilePackages: ["lucide-react", "class-variance-authority", "next-auth"],
};

export default nextConfig;
