import { withAuth } from "next-auth/middleware";

export default withAuth(
    {
        callbacks: {
            authorized: ({ token }) => {
                // Si hay un token, el usuario está autenticado
                return !!token;
            },
        },
        pages: {
            signIn: "/login", // Redirigir a login si no está autenticado
        },
    }
);

// Configurar qué rutas deben ser protegidas
export const config = {
    matcher: [
        // Proteger rutas específicas en lugar de usar exclusión negativa
        "/dashboard/:path*",
        "/stories/:path*",
        "/profile/:path*",
        "/settings/:path*",
        "/api/stories/:path*",
        "/api/users/:path*",
    ],
};
