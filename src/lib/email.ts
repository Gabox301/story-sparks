/**
 * @module emailService
 * @description Este módulo proporciona funciones para el envío de correos electrónicos transaccionales,
 * como la verificación de email y el restablecimiento de contraseña, utilizando Nodemailer.
 */

import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * @function sendVerificationEmail
 * @description Envía un email de verificación al usuario con un enlace para verificar su cuenta.
 * @param {string} email - El email del usuario.
 * @param {string} name - El nombre del usuario.
 * @param {string} token - El token de verificación sin hashear.
 */
export async function sendVerificationEmail(
    email: string,
    name: string,
    token: string
) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verifica tu cuenta en Chispas de Historias",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="padding: 30px; background: linear-gradient(135deg, #2A309B 0%, #7C57C7 50%, #ED53AF 100%); border-radius: 15px; margin: 20px 0;">
                    <h1 style="text-align: center; color: #4A5568; font-size: 28px; margin-bottom: 20px;">¡Te damos la bienvenida a Chispas de Historias!</h1>
                    <p style="margin-bottom: 20px; font-size: 16px;">Hola <strong>${name}</strong>,</p>
                    <p style="margin-bottom: 20px; font-size: 16px;">¡Qué emocionante que te hayas unido a nuestra comunidad de creadores de historias! Para comenzar tu aventura y acceder a todas las características mágicas de Chispas de Historias, necesitas verificar tu dirección de correo electrónico.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #B1AEE5 0%, #E7D8AC 100%); color: #4A5568; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(177, 174, 229, 0.3);">
                            ✨ Verificar mi cuenta ✨
                        </a>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #B1AEE5;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            <strong>¿No puedes hacer clic en el botón?</strong><br>
                            Copia y pega este enlace en tu navegador:<br>
                            <a href="${verificationUrl}" style="color: #B1AEE5; word-break: break-all;">${verificationUrl}</a>
                        </p>
                    </div>
                    <div style="background: #FFF8DC; padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #E7D8AC;">
                        <p style="margin: 0; font-size: 14px; color: #8B4513;">
                            <strong>⏰ ¡Importante!</strong> Este enlace expirará en 24 horas por razones de seguridad.
                        </p>
                    </div>
                    <p style="margin-bottom: 15px; font-size: 16px;">Una vez verificada tu cuenta, podrás:</p>
                    <ul style="padding-left: 20px; font-size: 16px;">
                        <li>🎭 Crear historias personalizadas con temas únicos</li>
                        <li>🦊 Diseñar personajes con personalidades especiales</li>
                        <li>💾 Guardar tus historias favoritas</li>
                        <li>🌟 Compartir tus creaciones con otros</li>
                    </ul>
                    <p style="margin: 20px 0; font-size: 16px;">Si no creaste esta cuenta, puedes ignorar este email de forma segura.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #777; font-size: 14px;">
                    <p>Con cariño,<br><strong>El equipo de Chispas de Historias</strong></p>
                    <p style="margin-top: 20px;">
                        <em>📚✨ ¡Donde cada historia cobra vida! ✨📚</em>
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

/**
 * @function sendPasswordResetEmail
 * @description Envía un email de restablecimiento de contraseña con un formato consistente con el email de verificación.
 * @param {string} email - El email del usuario.
 * @param {string} name - El nombre del usuario.
 * @param {string} token - El token de restablecimiento sin hashear.
 */
export async function sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Restablece tu contraseña en Chispas de Historias",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="padding: 30px; background: linear-gradient(135deg, #2A309B 0%, #7C57C7 50%, #ED53AF 100%); border-radius: 15px; margin: 20px 0;">
                    <h1 style="text-align: center; color: #4A5568; font-size: 28px; margin-bottom: 20px;">🔐 Restablece tu contraseña</h1>
                    <p style="margin-bottom: 20px; font-size: 16px;">Hola <strong>${name}</strong>,</p>
                    <p style="margin-bottom: 20px; font-size: 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Chispas de Historias. No te preocupes, ¡esto puede pasar a cualquiera!</p>
                    <p style="margin-bottom: 20px; font-size: 16px;">Para crear una nueva contraseña segura, simplemente haz clic en el botón de abajo:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #B1AEE5 0%, #E7D8AC 100%); color: #4A5568; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(177, 174, 229, 0.3);">
                            🔑 Restablecer mi contraseña 🔑
                        </a>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #B1AEE5;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            <strong>¿No puedes hacer clic en el botón?</strong><br>
                            Copia y pega este enlace en tu navegador:<br>
                            <a href="${resetUrl}" style="color: #B1AEE5; word-break: break-all;">${resetUrl}</a>
                        </p>
                    </div>
                    <div style="background: #FFE4E1; padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #FF6B6B;">
                        <p style="margin: 0; font-size: 14px; color: #D32F2F;">
                            <strong>⏰ ¡Importante!</strong> Este enlace expirará en 1 hora por razones de seguridad.
                        </p>
                    </div>
                    <div style="background: #FFF3CD; padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #FFC107;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            <strong>🔒 Consejos de seguridad:</strong><br>
                            • Elige una contraseña única y fuerte<br>
                            • Usa una combinación de letras, números y símbolos<br>
                            • No compartas tu contraseña con nadie
                        </p>
                    </div>
                    <p style="margin: 20px 0; font-size: 16px;">Si no solicitaste este restablecimiento de contraseña, puedes ignorar este email de forma segura. Tu cuenta permanecerá protegida.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #777; font-size: 14px;">
                    <p>Con cariño,<br><strong>El equipo de Chispas de Historias</strong></p>
                    <p style="margin-top: 20px;">
                        <em>📚✨ ¡Donde cada historia cobra vida! ✨📚</em>
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}
