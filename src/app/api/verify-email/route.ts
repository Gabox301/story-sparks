/**
 * @module verifyEmailAPI
 * @description Este módulo define la API para la verificación de emails de usuario.
 * Proporciona endpoints para verificar un email mediante un token y para reenviar emails de verificación.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

/**
 * @function GET
 * @description Maneja las solicitudes GET para verificar el email de un usuario.
 * Procesa el token de verificación recibido en la URL, actualiza el estado del usuario en la base de datos
 * y redirige al usuario a una página de éxito o error.
 * @param {NextRequest} request - El objeto de solicitud HTTP entrante, que debe contener el token de verificación como parámetro de consulta.
 * @returns {NextResponse} - Una respuesta de redirección a una página de éxito o error, o una respuesta JSON en caso de token faltante.
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
        const successUrl = new URL("/", request.url);
        successUrl.searchParams.set("verified", "true");
        successUrl.searchParams.set(
            "message",
            "¡Email verificado exitosamente! Ya puedes iniciar sesión."
        );

        return NextResponse.redirect(successUrl);
    } catch (error) {
        console.error("Error verificando email:", error);

        // Redirigir al usuario a una página de error
        const errorUrl = new URL("/", request.url);
        errorUrl.searchParams.set("error", "verification_failed");
        errorUrl.searchParams.set(
            "message",
            "Error interno del servidor al verificar el email."
        );

        return NextResponse.redirect(errorUrl);
    }
}

/**
 * @function POST
 * @description Maneja las solicitudes POST para reenviar un email de verificación.
 * Genera un nuevo token de verificación, lo almacena en la base de datos y envía un nuevo email al usuario.
 * @param {NextRequest} request - El objeto de solicitud HTTP entrante, que debe contener el email del usuario en el cuerpo de la solicitud.
 * @returns {NextResponse} Una respuesta JSON indicando el éxito o el fracaso del reenvío del email.
 * @throws {NextResponse} Retorna un error 400 si el email no es proporcionado o si el email ya ha sido verificado. Retorna un error 500 si ocurre un error interno del servidor.
 * @property {string} request.body.email - El email del usuario al que se le reenviará el enlace de verificación.
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
