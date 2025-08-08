import type { Metadata } from 'next';

/**
 * Metadatos globales de la aplicación.
 * Define el título, descripción, Open Graph y los iconos para la aplicación "Chispas de Historias".
 */
export const metadata: Metadata = {
    title: "Chispas de Historias",
    description: "Genera cuentos infantiles personalizados con IA",
    openGraph: {
        title: "Chispas de Historias",
        description: "Genera cuentos infantiles personalizados con IA",
        url: "https://story-sparks.vercel.app/",
        siteName: "Chispas de Historias",
        images: [
            {
                url: "https://story-sparks.vercel.app/logo.png",
                width: 800,
                height: 600,
                alt: "Logo de Chispas de Historias",
            },
        ],
        locale: "es_ES",
        type: "website",
    },
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon.ico", sizes: "any" },
        ],
        apple: [
            {
                url: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
        other: [
            {
                rel: "android-chrome",
                url: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                rel: "android-chrome",
                url: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    },
};