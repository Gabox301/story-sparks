import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    serverExternalPackages: ['@prisma/client', 'prisma'],
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
    transpilePackages: [
        "lucide-react",
        "class-variance-authority",
        "next-auth",
    ],
    // Configuración de headers para caché de recursos estáticos
    async headers() {
        return [
            {
                // Configuración específica para el webmanifest
                source: "/site.webmanifest",
                headers: [
                    { key: "Content-Type", value: "application/manifest+json" },
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                // Aplicar a todos los archivos estáticos de imágenes
                source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
                locale: false,
                headers: [
                    {
                        key: 'Cache-Control',
                        // Caché de 1 año para imágenes
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Caché para fuentes
                source: '/:all*(woff|woff2|ttf|otf)',
                locale: false,
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Configuración para todas las rutas API
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        // No cachear respuestas de API por defecto
                        value: 'no-store, max-age=0',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
