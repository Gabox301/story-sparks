/**
 * @module middleware
 * @description Este módulo configura el middleware de Next.js para la autenticación y protección de rutas.
 * Utiliza `next-auth/middleware` para gestionar el acceso a diferentes partes de la aplicación.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * @function middleware
 * @description Función principal del middleware que se ejecuta en cada solicitud.
 * Gestiona la exclusión de ciertas rutas y la respuesta para rutas API no autorizadas.
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {NextResponse} La respuesta de Next.js, permitiendo o denegando el acceso.
 */
export default withAuth(
    async function middleware(req: NextRequest) {
        // Excluir el archivo site.webmanifest del proceso de autenticación/firewall.
        if (req.nextUrl.pathname === "/site.webmanifest") {
            return NextResponse.next();
        }

        // Solo validar la existencia del token, la revocación se valida en los endpoints de API
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // Para las rutas de la API, si la solicitud no está autorizada, se devuelve un error JSON.
        if (!token && req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "No autorizado", success: false },
                { status: 401 }
            );
        }
        // Para todas las demás rutas, se permite la redirección normal o el acceso si está autorizado.
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }: { token: any }) => {
                return !!token;
            },
        },
        pages: {
            signIn: "/",
        },
    }
);

/**
 * @constant {object} config
 * @description Configuración del middleware para especificar qué rutas deben ser protegidas.
 * @property {string[]} matcher - Un array de patrones de ruta que el middleware debe proteger.
 * Las rutas que coincidan con estos patrones requerirán autenticación.
 * - `/stories/:path*`: Protege todas las rutas bajo `/stories`.
 * - `/api/stories/:path*`: Protege todas las rutas de la API bajo `/api/stories`.
 * - `/api/users/:path*`: Protege todas las rutas de la API bajo `/api/users`.
 * - `/api/audio/:path*`: Protege todas las rutas de la API bajo `/api/audio`.
 */
export const config = {
    matcher: [
        // Proteger rutas específicas en lugar de usar exclusión negativa
        "/stories/:path*",
        "/api/stories/:path*",
        "/api/users/:path*",
        "/api/audio/:path*",
    ],
};
