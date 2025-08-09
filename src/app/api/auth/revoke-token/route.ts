import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

/**
 * Endpoint para revocar el token JWT actual.
 * El frontend debe llamar a este endpoint al cerrar sesión.
 */
export async function POST(req: NextRequest) {
    try {
        // Obtener el token JWT de la request
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });
        if (
            !token ||
            typeof token.jti !== "string" ||
            typeof token.exp !== "number"
        ) {
            return NextResponse.json(
                { error: "Token inválido o no proporcionado." },
                { status: 400 }
            );
        }

        // Guardar el JTI en la tabla de tokens revocados
        await prisma.revokedToken.upsert({
            where: { token: token.jti },
            update: {},
            create: {
                token: token.jti,
                expiresAt: new Date(Number(token.exp) * 1000),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API] Error al revocar token:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
