/**
 * @module middleware
 * @description Este módulo configura el middleware de Next.js para la autenticación y protección de rutas.
 * Utiliza `next-auth/middleware` para gestionar el acceso a diferentes partes de la aplicación.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * @function middleware
 * @description Función principal del middleware que se ejecuta en cada solicitud.
 * Gestiona la exclusión de ciertas rutas y la respuesta para rutas API no autorizadas.
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {NextResponse} La respuesta de Next.js, permitiendo o denegando el acceso.
 */
export default withAuth(
    function middleware(req: NextRequest) {
        // Excluir el archivo site.webmanifest del proceso de autenticación/firewall.
        // Este archivo es necesario para la configuración PWA y no requiere autenticación.
        if (req.nextUrl.pathname === "/site.webmanifest") {
            return NextResponse.next();
        }

        // Para las rutas de la API, si la solicitud no está autorizada, se devuelve un error JSON.
        // `withAuth` solo invoca esta función si la devolución de llamada `authorized` retorna `false`.
        if (req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "No autorizado", success: false },
                { status: 401 }
            );
        }
        // Para todas las demás rutas, se permite la redirección normal o el acceso si está autorizado.
        return NextResponse.next();
    },
    {
        /**
         * @property {object} callbacks - Configuraciones para las devoluciones de llamada de autenticación.
         */
        callbacks: {
            /**
             * @function authorized
             * @description Determina si el usuario está autorizado basándose en la existencia de un token.
             * @param {object} params - Parámetros que incluyen el token de sesión y la solicitud.
             * @param {object} params.token - El token de autenticación del usuario.
             * @returns {boolean} `true` si el usuario está autenticado (tiene un token), `false` en caso contrario.
             */
            authorized: ({ token }) => {
                return !!token;
            },
        },
        /**
         * @property {object} pages - Configuraciones para las páginas de autenticación.
         */
        pages: {
            /**
             * @property {string} signIn - La ruta a la que se redirige a los usuarios no autenticados.
             * Redirige a la página principal (`/`) donde se encuentra el formulario de inicio de sesión.
             */
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
