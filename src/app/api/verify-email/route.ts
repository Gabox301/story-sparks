/**
 * @file src/app/api/verify-email/route.ts
 * @description Este archivo define la API para verificar el email de un usuario.
 * Permite a los usuarios verificar su dirección de correo electrónico mediante un token único.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

/**
 * @description Maneja las solicitudes GET para verificar el email de un usuario.
 * Verifica el token, actualiza el estado de verificación del usuario y maneja la expiración del token.
 * @param {NextRequest} request - La solicitud HTTP entrante con el token como parámetro de consulta.
 * @returns {NextResponse} - Una respuesta JSON indicando el éxito o el fracaso de la verificación.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Token de verificación requerido.",
                },
                { status: 400 }
            );
        }

        // Hashear el token para comparar con el almacenado en la base de datos
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Buscar el usuario con el token de verificación válido
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: hashedToken,
                emailVerificationExpires: {
                    gt: new Date(), // Token no expirado
                },
                isEmailVerified: false, // Email aún no verificado
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Token de verificación inválido o expirado. Por favor, solicita un nuevo enlace de verificación.",
                },
                { status: 400 }
            );
        }

        // Actualizar el usuario para marcarlo como verificado
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                emailVerificationToken: null, // Limpiar el token usado
                emailVerificationExpires: null,
            },
        });

        console.log(`Email verified successfully for user: ${user.email}`);

        // Redirigir al usuario a una página de éxito con parámetros de consulta
        const successUrl = new URL("/login", request.url);
        successUrl.searchParams.set("verified", "true");
        successUrl.searchParams.set(
            "message",
            "¡Email verificado exitosamente! Ya puedes iniciar sesión."
        );

        return NextResponse.redirect(successUrl);
    } catch (error) {
        console.error("Error verificando email:", error);

        // Redirigir al usuario a una página de error
        const errorUrl = new URL("/login", request.url);
        errorUrl.searchParams.set("error", "verification_failed");
        errorUrl.searchParams.set(
            "message",
            "Error interno del servidor al verificar el email."
        );

        return NextResponse.redirect(errorUrl);
    }
}

/**
 * @description Maneja las solicitudes POST para reenviar email de verificación.
 * Genera un nuevo token y reenvía el email de verificación.
 * @param {NextRequest} request - La solicitud HTTP con el email del usuario.
 * @returns {NextResponse} - Una respuesta JSON indicando el éxito o el fracaso del reenvío.
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email requerido." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // No revelar si el usuario existe por razones de seguridad
            return NextResponse.json(
                {
                    message:
                        "Si el email está registrado, recibirás un nuevo enlace de verificación.",
                },
                { status: 200 }
            );
        }

        if (user.isEmailVerified) {
            return NextResponse.json(
                { message: "Este email ya ha sido verificado." },
                { status: 400 }
            );
        }

        // Generar nuevo token de verificación
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Actualizar usuario con nuevo token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: hashedToken,
                emailVerificationExpires: expirationTime,
            },
        });

        // Enviar email de verificación (reutilizamos la función del registro)
        await sendVerificationEmail(
            user.email,
            user.name || "Usuario",
            verificationToken
        );

        console.log(`Verification email resent to: ${user.email}`);

        return NextResponse.json(
            {
                message:
                    "Si el email está registrado, recibirás un nuevo enlace de verificación.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error reenviando email de verificación:", error);
        return NextResponse.json(
            { message: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
