import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

/**
 * @description Mapa para almacenar el estado de rate limiting por dirección IP.
 * @type {Map<string, { count: number; timestamp: number }>}
 */
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

// Limpieza cada 5 min para evitar crecimiento ilimitado
setInterval(() => {
    const cutoff = Date.now() - 60000;
    for (const [key, value] of rateLimitMap.entries()) {
        if (value.timestamp < cutoff) rateLimitMap.delete(key);
    }
}, 300_000);

/**
 * @description Mapa para almacenar el estado de rate limiting por dirección de correo electrónico.
 * @type {Map<string, { count: number; timestamp: number }>}
 */
const emailAttempts = new Map<string, { count: number; timestamp: number }>();

// Limpieza cada 5 min
setInterval(() => {
    const cutoff = Date.now() - 60000;
    for (const [key, value] of emailAttempts.entries()) {
        if (value.timestamp < cutoff) emailAttempts.delete(key);
    }
}, 300_000);

/**
 * @function rateLimitByIP
 * @description Aplica rate limiting basado en la dirección IP del cliente.
 * @param {string} ip - La dirección IP del cliente.
 * @param {number} [limit=5] - El número máximo de solicitudes permitidas dentro de la ventana de tiempo.
 * @param {number} [windowMs=60000] - La ventana de tiempo en milisegundos (por defecto 60 segundos).
 * @returns {boolean} `true` si la solicitud está permitida, `false` si se excede el límite.
 */
function rateLimitByIP(ip: string, limit = 5, windowMs = 60000): boolean {
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

/**
 * @function rateLimitByEmail
 * @description Aplica rate limiting basado en la dirección de correo electrónico.
 * @param {string} email - La dirección de correo electrónico del usuario.
 * @param {number} [limit=5] - El número máximo de intentos permitidos dentro de la ventana de tiempo.
 * @param {number} [windowMs=60000] - La ventana de tiempo en milisegundos (por defecto 60 segundos).
 * @returns {boolean} `true` si el intento está permitido, `false` si se excede el límite.
 */
function rateLimitByEmail(email: string, limit = 5, windowMs = 60000): boolean {
    const now = Date.now();
    const entry = emailAttempts.get(email);

    if (!entry) {
        emailAttempts.set(email, { count: 1, timestamp: now });
        return true;
    }

    if (now - entry.timestamp > windowMs) {
        emailAttempts.set(email, { count: 1, timestamp: now });
        return true;
    }

    if (entry.count < limit) {
        entry.count++;
        return true;
    }
    return false;
}

// 3) Helpers
/**
 * @function getClientIP
 * @description Obtiene la dirección IP del cliente de la solicitud.
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {string} La dirección IP del cliente o 'unknown' si no se puede determinar.
 */
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        "unknown"
    );
}

/**
 * @function POST
 * @description Manejador de la solicitud POST para el registro de nuevos usuarios.
 * Realiza validaciones, aplica rate limiting y crea un nuevo usuario en la base de datos.
 * @param {NextRequest} req - El objeto de solicitud de Next.js que contiene los datos del usuario (email, password, name).
 * @returns {NextResponse} Una respuesta JSON indicando el éxito o el fracaso del registro.
 */
export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        // 1) Rate-limiting por IP
        const ip = getClientIP(req);
        if (!rateLimitByIP(ip, 5, 60000)) {
            console.warn(`Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                {
                    message:
                        "Demasiadas solicitudes de registro. Por favor, inténtelo más tarde.",
                },
                { status: 429 }
            );
        }

        // 2) Rate-limiting por EMAIL
        if (!rateLimitByEmail(email.toLowerCase(), 5, 60000)) {
            console.warn(
                `Rate limit exceeded for email: ${email.toLowerCase()}`
            );
            return NextResponse.json(
                {
                    message:
                        "Demasiados intentos de registro fallidos para este email. Inténtelo más tarde.",
                },
                { status: 429 }
            );
        }

        // Validaciones básicas
        if (!email || !password || !name) {
            console.warn("Register attempt with missing credentials");
            return NextResponse.json(
                {
                    message:
                        "Por favor, introduce tu nombre, email y contraseña.",
                },
                { status: 400 }
            );
        }

        if (email.length > 254) {
            console.warn("Register attempt with oversized email");
            return NextResponse.json(
                { message: "El email es demasiado largo." },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.warn(
                `Register attempt with invalid email format: ${email}`
            );
            return NextResponse.json(
                { message: "El formato del email no es válido." },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            console.warn(`Registration attempt with existing email: ${email}`);
            return NextResponse.json(
                { message: "Este email ya está registrado." },
                { status: 409 }
            );
        }

        // Generar token de verificación de email
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedVerificationToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name,
                emailVerificationToken: hashedVerificationToken,
                emailVerificationExpires: verificationExpires,
                isEmailVerified: false,
            },
        });

        // Enviar email de verificación
        try {
            await sendVerificationEmail(
                newUser.email,
                newUser.name || "Usuario",
                verificationToken
            );
            console.log(`Verification email sent to: ${newUser.email}`);
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // Nota: No fallamos el registro si el email no se puede enviar
            // El usuario podrá solicitar un reenvío más tarde
        }

        console.log(`Successful registration for user: ${newUser.email}`);
        return NextResponse.json(
            {
                message:
                    "¡Cuenta creada exitosamente! Te hemos enviado un email de verificación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.",
                requiresVerification: true,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error en el registro:", error);
        return NextResponse.json(
            {
                message:
                    "Error interno del servidor. Por favor, inténtelo más tarde.",
            },
            { status: 500 }
        );
    }
}
