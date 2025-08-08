/**
 * @file src/app/api/forgot-password/route.ts
 * @description Este archivo define la API para iniciar el proceso de recuperación de contraseña.
 * Permite a los usuarios solicitar un restablecimiento de contraseña, generando un token
 * y enviando un correo electrónico con un enlace para restablecerla.
 */
// src/app/api/forgot-password/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * @function POST
 * @description Maneja las solicitudes POST para iniciar el proceso de recuperación de contraseña.
 * Genera un token de restablecimiento, lo guarda en la base de datos y envía un correo electrónico al usuario.
 * @param {Request} request - La solicitud HTTP entrante, que debe contener un cuerpo JSON con la propiedad `email`.
 * @returns {NextResponse} Una respuesta JSON indicando el éxito o el fracaso de la operación.
 * @throws {NextResponse} Retorna un error 400 si el email no es proporcionado, o un error 500 si ocurre un error interno del servidor.
 * @property {string} request.body.email - La dirección de correo electrónico del usuario que solicita el restablecimiento de contraseña.
 */
export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: "El email es requerido." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // No revelar si el usuario existe o no por razones de seguridad
            return NextResponse.json(
                {
                    message:
                        "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
                },
                { status: 200 }
            );
        }

        // Generar un token de restablecimiento de contraseña
        const resetToken = crypto.randomBytes(32).toString("hex");
        const passwordResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetExpires,
            },
        });

        // Enviar el email con el enlace de restablecimiento usando la función centralizada
        await sendPasswordResetEmail(user.email, user.name || "Usuario", resetToken);

        return NextResponse.json(
            {
                message:
                    "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Error al solicitar restablecimiento de contraseña:",
            error
        );
        return NextResponse.json(
            { message: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
