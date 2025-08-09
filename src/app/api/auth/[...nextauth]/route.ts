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
import NextAuth, { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

declare module "next-auth" {
    interface Session {
        user: User & {
            id: string;
            emailVerified: boolean;
        };
    }

    interface User {
        id: string;
        isEmailVerified: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        emailVerified: boolean;
    }
}

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now - entry.timestamp > 5 * 60 * 1000) {
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 1000);

setInterval(async () => {
    try {
        const { count } = await prisma.revokedToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        console.log(
            `[NextAuth] Limpiados ${count} tokens revocados expirados.`
        );
    } catch (error) {
        console.error(
            "[NextAuth] Error al limpiar tokens revocados expirados:",
            error
        );
    }
}, 60 * 60 * 1000);

function rateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
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

    return false;
}

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        "unknown"
    );
}

// Asegura que este endpoint use el runtime Node.js (no edge)
export const runtime = "nodejs";

export const authConfig: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req: any) {
                const request = new Request(req.url || "http://localhost", {
                    headers: req.headers,
                });
                const nextReq = new NextRequest(request);
                const ip = getClientIP(nextReq);

                if (!rateLimit(ip)) {
                    throw new Error(
                        "Demasiadas solicitudes de inicio de sesión. Por favor, inténtelo de nuevo más tarde."
                    );
                }

                if (!credentials?.email || !credentials?.password) {
                    throw new Error(
                        "Por favor, introduce tu email y contraseña."
                    );
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(credentials.email)) {
                    throw new Error("El formato del email no es válido.");
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email.toLowerCase() },
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
                        throw new Error(
                            "Credenciales inválidas. Verifica tu email y contraseña."
                        );
                    }

                    if (!user.isEmailVerified) {
                        throw new Error(
                            "Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada."
                        );
                    }

                    // Generar AccessToken y RefreshToken
                    const accessToken = randomBytes(32).toString("hex");
                    const refreshToken = randomBytes(64).toString("hex");
                    const now = new Date();
                    const accessExpires = new Date(
                        now.getTime() + 15 * 60 * 1000
                    ); // 15 min
                    const refreshExpires = new Date(
                        now.getTime() + 30 * 24 * 60 * 60 * 1000
                    ); // 30 días

                    // Guardar tokens en la base de datos
                    await prisma.accessToken.create({
                        data: {
                            token: accessToken,
                            userId: user.id,
                            expiresAt: accessExpires,
                            ip,
                        },
                    });
                    await prisma.refreshToken.create({
                        data: {
                            token: refreshToken,
                            userId: user.id,
                            expiresAt: refreshExpires,
                            ip,
                        },
                    });

                    // Enviar tokens como cookies httpOnly (Next.js cookies API)
                    const cookieStore = await cookies();
                    cookieStore.set("access_token", accessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        path: "/",
                        expires: accessExpires,
                    });
                    cookieStore.set("refresh_token", refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        path: "/",
                        expires: refreshExpires,
                    });

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        isEmailVerified: user.isEmailVerified,
                    };
                } catch (dbError) {
                    console.error(
                        "Database error during authentication:",
                        dbError
                    );
                    throw new Error(
                        "Error interno del servidor. Intenta más tarde."
                    );
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    cookies: {
        sessionToken: {
            name:
                process.env.NODE_ENV === "production"
                    ? "__Secure-next-auth.session-token"
                    : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.emailVerified = user.isEmailVerified;
            }

            if (
                typeof token.jti === "string" &&
                trigger === "update" &&
                session
            ) {
                const isRevoked = await prisma.revokedToken.findUnique({
                    where: { token: token.jti },
                });
                if (isRevoked) {
                    return { id: "", emailVerified: false };
                }
            }

            // Validar access token en base de datos
            if (token && token.id) {
                const dbToken = await prisma.accessToken.findFirst({
                    where: {
                        userId: token.id,
                        expiresAt: { gt: new Date() },
                        revoked: false,
                    },
                });
                if (!dbToken) {
                    return { id: "", emailVerified: false };
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.emailVerified = token.emailVerified;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    events: {
        async signIn(message) {
            // 🔹 Marcamos en el cliente que acaba de iniciar sesión
            //    Esto se usará en useDatabaseStoryStore para saltar sync extra
            try {
                if (typeof window !== "undefined") {
                    sessionStorage.setItem("justLoggedIn", "true");
                }
            } catch {
                // En server-side no hay sessionStorage, así que no hacemos nada
            }
            // Limpieza de tokens expirados del usuario
            if (message?.user?.id) {
                await prisma.accessToken.deleteMany({
                    where: {
                        userId: message.user.id,
                        expiresAt: { lt: new Date() },
                    },
                });
                await prisma.refreshToken.deleteMany({
                    where: {
                        userId: message.user.id,
                        expiresAt: { lt: new Date() },
                    },
                });
            }
        },
        async signOut(message) {
            // Revocar tokens y limpiar cookies
            if (message?.token?.jti) {
                const tokenValue = String(message.token.jti);
                const exists = await prisma.revokedToken.findUnique({
                    where: { token: tokenValue },
                });
                if (!exists) {
                    await prisma.revokedToken.create({
                        data: {
                            token: tokenValue,
                            expiresAt: new Date(
                                Number(message.token.exp) * 1000
                            ),
                        },
                    });
                }
            }
            if (message?.token?.id) {
                await prisma.accessToken.updateMany({
                    where: { userId: message.token.id },
                    data: { revoked: true },
                });
                await prisma.refreshToken.updateMany({
                    where: { userId: message.token.id },
                    data: { revoked: true },
                });
            }
            // Limpiar cookies (solo server-side)
            try {
                const cookieStore = await cookies();
                cookieStore.set("access_token", "", { maxAge: 0, path: "/" });
                cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" });
            } catch {}
        },
        async createUser(message) {},
        async linkAccount(message) {},
        async session(message) {},
    },
    debug: process.env.NODE_ENV === "development",
};

/**
 * @function isTokenRevoked
 * @description Verifica si un token está en la lista de revocados
 */
export async function isTokenRevoked(tokenValue: string): Promise<boolean> {
    try {
        const revoked = await prisma.revokedToken.findUnique({
            where: { token: tokenValue },
        });
        return !!revoked;
    } catch (error) {
        console.error("[NextAuth] Error al verificar token revocado:", error);
        return false;
    }
}

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
