/**
 * @module RootLayout
 * @description Este módulo define el componente de layout raíz de la aplicación.
 * Proporciona una estructura global que incluye metadatos, fuentes, temas, manejo de sesiones
 * y componentes de utilidad como tostadas y análisis de rendimiento.
 */

"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

/**
 * Componente de layout raíz de la aplicación.
 * Envuelve toda la aplicación y proporciona elementos globales como metadatos, fuentes, temas y componentes de utilidad.
 * @param {Readonly<{ children: React.ReactNode; }>} { children } - Los componentes hijos a renderizar dentro del layout.
 * @returns {JSX.Element} El layout raíz de la aplicación.
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useEffect(() => {}, []);
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
                <SessionProvider>
                    <ThemeProvider defaultTheme="princesa">
                        {children}
                        <Toaster />
                    </ThemeProvider>
                    <SpeedInsights />
                </SessionProvider>
                <Analytics />
            </body>
        </html>
    );
}
