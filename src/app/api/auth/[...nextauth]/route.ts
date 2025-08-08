import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { JWT } from "next-auth/jwt";

// Rate limiting simple sin dependencias externas para Next.js 15
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

/**
 * @description Limpia el mapa de rate limiting periódicamente.
 * Elimina las entradas que han expirado para evitar el crecimiento ilimitado del mapa.
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        // Eliminar entradas si han pasado 5 minutos desde el último intento
        if (now - entry.timestamp > 5 * 60 * 1000) {
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 1000); // Ejecutar cada minuto

/**
 * @description Implementa un sistema de rate limiting básico por dirección IP.
 * Limita el número de solicitudes permitidas desde una IP dentro de una ventana de tiempo.
 * @param {string} ip - La dirección IP del cliente.
 * @param {number} limit - El número máximo de solicitudes permitidas.
 * @param {number} windowMs - La ventana de tiempo en milisegundos para el rate limiting.
 * @returns {boolean} - `true` si la solicitud es permitida, `false` si se excede el límite.
 */
function rateLimit(
    ip: string,
    limit: number = 5,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    // Si ha pasado la ventana de tiempo, resetear
    if (now - entry.timestamp > windowMs) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    // Si está dentro de la ventana, incrementar contador
    if (entry.count < limit) {
        entry.count++;
        return true;
    }

    return false; // Rate limit exceeded
}

/**
 * @description Extrae la dirección IP del cliente de la solicitud Next.js.
 * Intenta obtener la IP de varias cabeceras comunes (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`).
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {string} - La dirección IP del cliente o 'unknown' si no se puede determinar.
 */
// Función helper para extraer IP
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") || // Cloudflare
        "unknown"
    );
}

/**
 * @description Manejador de autenticación para NextAuth.js con Next.js 15
 */
export const authConfig: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            /**
             * @description Función para autorizar las credenciales del usuario.
             * Implementa rate limiting nativo y validaciones de seguridad.
             */
            async authorize(credentials, req: any) {
                // Rate limiting - convertir req a NextRequest para obtener IP
                const request = new Request(req.url || "http://localhost", {
                    headers: req.headers,
                });
                const nextReq = new NextRequest(request);
                const ip = getClientIP(nextReq);

                // Manejo de rate limiting por IP
                if (!rateLimit(ip, 5, 60000)) {
                    console.error(`Rate limit exceeded for IP: ${ip}`);
                    // Lanzar un error con un mensaje específico para el toast
                    throw new Error(
                        "Demasiadas solicitudes de inicio de sesión. Por favor, inténtelo de nuevo más tarde."
                    );
                }

                // Validar que las credenciales no estén vacías
                if (!credentials?.email || !credentials?.password) {
                    console.warn("Login attempt with missing credentials");
                    // Devolver un objeto con un mensaje de error para el toast
                    throw new Error(
                        "Por favor, introduce tu email y contraseña."
                    );
                }

                // Validar formato de email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(credentials.email)) {
                    console.warn(
                        `Login attempt with invalid email format: ${credentials.email}`
                    );
                    // Devolver un objeto con un mensaje de error para el toast
                    throw new Error("El formato del email no es válido.");
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email.toLowerCase(),
                        },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            password: true,
                            isEmailVerified: true,
                            emailVerifiedAt: true,
                            // Agrega otros campos que necesites, pero sin información sensible
                        },
                    });

                    if (
                        !user ||
                        !(await bcrypt.compare(
                            credentials.password,
                            user.password
                        ))
                    ) {
                        console.warn(
                            `Failed login attempt for email: ${credentials.email}`
                        );
                        // Devolver un objeto con un mensaje de error para el toast
                        throw new Error(
                            "Credenciales inválidas. Por favor, verifica tu email y contraseña."
                        );
                    }

                    // Verificar si el email ha sido verificado
                    if (!user.isEmailVerified) {
                        console.warn(
                            `Login attempt with unverified email: ${credentials.email}`
                        );
                        throw new Error(
                            "Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada y haz clic en el enlace de verificación."
                        );
                    }

                    console.log(`Successful login for user: ${user.email}`);
                    // Devolver el usuario y un mensaje de éxito para el toast
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        isEmailVerified: user.isEmailVerified,
                        message: "Inicio de sesión exitoso.",
                    };
                } catch (dbError) {
                    console.error(
                        "Database error during authentication:",
                        dbError
                    );
                    // Lanzar un error con un mensaje específico para el toast
                    throw new Error(
                        "Error interno del servidor. Por favor, intenta más tarde."
                    );
                }
            },
        }),
    ],
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 días
        updateAge: 24 * 60 * 60, // 24 horas - actualizar la sesión cada día
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 días
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60, // 30 días
            },
        },
    },
    pages: {
        signIn: "/",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user }: { token: JWT; user: any }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: JWT }) {
            if (token.id && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
