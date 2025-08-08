/**
 * @module authConfig
 * @description Este módulo configura la autenticación para Next.js utilizando NextAuth.js.
 * Incluye la configuración de proveedores de credenciales, manejo de sesiones JWT, y callbacks.
 * También implementa un sistema básico de rate limiting para proteger las rutas de autenticación.
 */

import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { JWT } from "next-auth/jwt";
import NextAuth, { NextAuthOptions } from "next-auth";

/**
 * @constant {Map<string, { count: number; timestamp: number }>} rateLimitMap
 * @description Mapa utilizado para el rate limiting simple basado en la dirección IP.
 * Almacena el conteo de solicitudes y la marca de tiempo del último intento para cada IP.
 */
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

/**
 * @function setInterval
 * @description Limpia periódicamente las entradas expiradas del `rateLimitMap`.
 * Esto previene el crecimiento ilimitado del mapa y asegura que el rate limiting se resetee con el tiempo.
 * Se ejecuta cada minuto, eliminando entradas que tienen más de 5 minutos de antigüedad.
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now - entry.timestamp > 5 * 60 * 1000) { // 5 minutos
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 1000); // Ejecutar cada minuto

/**
 * @function rateLimit
 * @description Implementa un sistema básico de rate limiting por dirección IP.
 * Limita el número de solicitudes permitidas desde una IP dentro de una ventana de tiempo definida.
 * @param {string} ip - La dirección IP del cliente que realiza la solicitud.
 * @param {number} [limit=5] - El número máximo de solicitudes permitidas dentro de la ventana de tiempo.
 * @param {number} [windowMs=60000] - La ventana de tiempo en milisegundos (por defecto 60 segundos).
 * @returns {boolean} - `true` si la solicitud es permitida (dentro del límite), `false` si se excede el límite.
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

    if (now - entry.timestamp > windowMs) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (entry.count < limit) {
        entry.count++;
        return true;
    }

    return false; // Límite de solicitudes excedido
}

/**
 * @function getClientIP
 * @description Extrae la dirección IP del cliente de la solicitud de Next.js.
 * Prioriza las cabeceras `x-forwarded-for`, `x-real-ip` y `cf-connecting-ip` (para Cloudflare).
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {string} - La dirección IP del cliente o 'unknown' si no se puede determinar.
 */
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        "unknown"
    );
}

/**
 * @constant {NextAuthOptions} authConfig
 * @description Objeto de configuración principal para NextAuth.js.
 * Define los proveedores de autenticación, estrategias de sesión, callbacks y páginas personalizadas.
 */
export const authConfig: NextAuthOptions = {
    /**
     * @property {Provider[]} providers - Array de proveedores de autenticación configurados.
     * Actualmente, solo se utiliza `CredentialsProvider` para la autenticación basada en email y contraseña.
     */
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            /**
             * @function authorize
             * @description Función asíncrona para autorizar las credenciales del usuario.
             * Realiza validaciones de email, compara contraseñas y verifica el estado de verificación del email.
             * También aplica rate limiting para prevenir ataques de fuerza bruta.
             * @param {Record<string, string> | undefined} credentials - Las credenciales proporcionadas por el usuario (email y contraseña).
             * @param {any} req - El objeto de solicitud, utilizado para extraer la IP del cliente.
             * @returns {Promise<User | null>} - El objeto de usuario si la autenticación es exitosa, o lanza un error.
             * @throws {Error} Si las credenciales son inválidas, el email no está verificado, o se excede el rate limit.
             */
            async authorize(credentials, req: any) {
                const request = new Request(req.url || "http://localhost", {
                    headers: req.headers,
                });
                const nextReq = new NextRequest(request);
                const ip = getClientIP(nextReq);

                if (!rateLimit(ip, 5, 60000)) {
                    console.error(`Rate limit exceeded for IP: ${ip}`);
                    throw new Error(
                        "Demasiadas solicitudes de inicio de sesión. Por favor, inténtelo de nuevo más tarde."
                    );
                }

                if (!credentials?.email || !credentials?.password) {
                    console.warn("Login attempt with missing credentials");
                    throw new Error(
                        "Por favor, introduce tu email y contraseña."
                    );
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(credentials.email)) {
                    console.warn(
                        `Login attempt with invalid email format: ${credentials.email}`
                    );
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
                        throw new Error(
                            "Credenciales inválidas. Por favor, verifica tu email y contraseña."
                        );
                    }

                    if (!user.isEmailVerified) {
                        console.warn(
                            `Login attempt with unverified email: ${credentials.email}`
                        );
                        throw new Error(
                            "Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada y haz clic en el enlace de verificación."
                        );
                    }

                    console.log(`Successful login for user: ${user.email}`);
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
                    throw new Error(
                        "Error interno del servidor. Por favor, intenta más tarde."
                    );
                }
            },
        }),
    ],
    /**
     * @property {object} session - Configuración de la sesión.
     * Utiliza la estrategia `jwt` para manejar las sesiones.
     */
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // Duración máxima de la sesión: 30 días
        updateAge: 24 * 60 * 60, // Frecuencia de actualización de la sesión: cada 24 horas
    },
    /**
     * @property {object} jwt - Configuración específica para JSON Web Tokens (JWT).
     */
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // Duración máxima del JWT: 30 días
    },
    /**
     * @property {object} cookies - Configuración de las cookies de sesión.
     */
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60, // Duración máxima de la cookie de sesión: 30 días
            },
        },
    },
    /**
     * @property {object} pages - Rutas personalizadas para las páginas de autenticación.
     */
    pages: {
        signIn: "/home", // Redirige a /home después de un inicio de sesión exitoso
        error: "/auth/error", // Página para errores de autenticación
    },
    /**
     * @property {object} callbacks - Funciones de callback para personalizar el comportamiento de NextAuth.js.
     */
    callbacks: {
        /**
         * @function jwt
         * @description Callback que se ejecuta cuando se crea o actualiza un JWT.
         * Añade el ID del usuario al token JWT.
         * @param {object} params - Parámetros del callback.
         * @param {JWT} params.token - El token JWT actual.
         * @param {any} params.user - El objeto de usuario (presente solo en el primer inicio de sesión).
         * @returns {Promise<JWT>} El token JWT modificado.
         */
        async jwt({ token, user }: { token: JWT; user: any }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        /**
         * @function session
         * @description Callback que se ejecuta cuando se crea una sesión.
         * Añade el ID del usuario a la sesión.
         * @param {object} params - Parámetros del callback.
         * @param {any} params.session - El objeto de sesión actual.
         * @param {JWT} params.token - El token JWT asociado a la sesión.
         * @returns {Promise<any>} El objeto de sesión modificado.
         */
        async session({ session, token }: { session: any; token: JWT }) {
            if (token.id && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    /**
     * @property {boolean} debug - Habilita el modo de depuración en entornos de desarrollo.
     */
    debug: process.env.NODE_ENV === "development",
};

/**
 * @constant {NextAuthHandler} handler
 * @description El manejador de NextAuth.js que procesa las solicitudes de autenticación.
 */
const handler = NextAuth(authConfig);

/**
 * @exports GET
 * @exports POST
 * @description Exporta el manejador de NextAuth para las solicitudes GET y POST.
 * Esto permite que NextAuth.js gestione las rutas de API de autenticación.
 */
export { handler as GET, handler as POST };
