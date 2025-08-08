/**
 * @file src/app/api/reset-password/route.ts
 * @description Este archivo define la API para restablecer la contraseña de un usuario.
 * Verifica el token de restablecimiento y actualiza la contraseña del usuario en la base de datos.
 */
// src/app/api/reset-password/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * @function POST
 * @description Maneja las solicitudes POST para restablecer la contraseña de un usuario.
 * Verifica el token de restablecimiento y actualiza la contraseña del usuario en la base de datos.
 * @param {Request} request - La solicitud HTTP entrante, que debe contener un cuerpo JSON con `token` y `newPassword`.
 * @returns {NextResponse} Una respuesta JSON indicando el éxito o el fracaso de la operación.
 * @throws {NextResponse} Retorna un error 400 si el token o la nueva contraseña no son proporcionados, o si el token es inválido o ha expirado. Retorna un error 500 si ocurre un error interno del servidor.
 * @property {string} request.body.token - El token de restablecimiento de contraseña recibido por el usuario.
 * @property {string} request.body.newPassword - La nueva contraseña que el usuario desea establecer.
 */
export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: "Token y nueva contraseña son requeridos." }, { status: 400 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Token inválido o expirado." }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y limpiar los campos de restablecimiento
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ message: "Contraseña restablecida exitosamente." }, { status: 200 });
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}