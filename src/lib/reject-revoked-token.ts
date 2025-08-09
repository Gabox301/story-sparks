import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

/**
 * Verifica si el token JWT de la request está revocado.
 * Si está revocado, retorna un NextResponse de error; si no, retorna null.
 */
export async function rejectIfTokenRevoked(request: NextRequest) {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });
        if (token && typeof token.jti === "string") {
            const revoked = await prisma.revokedToken.findUnique({
                where: { token: token.jti },
            });
            if (revoked) {
                return NextResponse.json(
                    {
                        error: "Token revocado. Debes iniciar sesión de nuevo.",
                        success: false,
                    },
                    { status: 401 }
                );
            }
        }
        return null;
    } catch (error) {
        console.error("Error verificando token revocado:", error);
        return NextResponse.json(
            { error: "Error interno de autenticación", success: false },
            { status: 500 }
        );
    }
}
