import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "Chispas de Historias",
    description: "Genera cuentos infantiles personalizados con IA",
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <link rel="manifest" href="/site.webmanifest" />
            </head>
            <body className="font-body antialiased">
                {children}
                <Toaster />
            </body>
        </html>
    );
}
