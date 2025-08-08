import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
    function middleware(req: NextRequest) {
        // ✅ Excluir site.webmanifest del challenge/firewall
        if (req.nextUrl.pathname === "/site.webmanifest") {
            return NextResponse.next();
        }

        // Para rutas API, devolver error JSON en lugar de redirigir
        if (req.nextUrl.pathname.startsWith("/api/")) {
            // Si llega aquí, significa que no está autorizado
            // withAuth solo llama a esta función si authorized() devuelve false
            return NextResponse.json(
                { error: "No autorizado", success: false },
                { status: 401 }
            );
        }
        // Para otras rutas, permitir la redirección normal
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Si hay un token, el usuario está autenticado
                return !!token;
            },
        },
        pages: {
            signIn: "/", // Redirigir a la página principal donde está el formulario de login
        },
    }
);

// Configurar qué rutas deben ser protegidas
export const config = {
    matcher: [
        // Proteger rutas específicas en lugar de usar exclusión negativa
        "/stories/:path*",
        "/api/stories/:path*",
        "/api/users/:path*",
        "/api/audio/:path*",
    ],
};
