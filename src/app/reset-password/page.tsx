/**
 * @module ResetPasswordPageModule
 * @description Este módulo define el componente de la página de restablecimiento de contraseña.
 * Proporciona la interfaz para que los usuarios puedan establecer una nueva contraseña
 * utilizando un token de restablecimiento.
 */

"use client";

import { ResetPasswordForm } from "./form";
import { Compare } from "@/components/ui/compare";
import { RouteGuard } from "@/components/route-guard";

/**
 * Página de restablecimiento de contraseña.
 * Renderiza la interfaz de usuario para que los usuarios puedan crear una nueva contraseña
 * utilizando un token de restablecimiento recibido por email.
 */
export default function ResetPasswordPage() {
    return (
        <RouteGuard requireAuth={false}>
            <div className="relative min-h-screen flex-col items-center justify-center flex lg:px-0 overflow-hidden w-full">
                <Compare
                    firstImage="/princess.png"
                    secondImage="/prince.png"
                    autoplay={true}
                />
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                    <div className="lg:p-8 w-full flex justify-center">
                        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                            <ResetPasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </RouteGuard>
    );
}
