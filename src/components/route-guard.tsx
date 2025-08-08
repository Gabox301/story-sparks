/**
 * @module RouteGuardModule
 * @description Este módulo contiene el componente `RouteGuard` que se encarga de proteger rutas
 * basándose en el estado de autenticación del usuario. Redirige a los usuarios no autorizados
 * y muestra un indicador de carga mientras se verifica la autenticación.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface RouteGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

/**
 * @interface RouteGuardProps
 * @description Define las propiedades para el componente `RouteGuard`.
 * @property {React.ReactNode} children - Los elementos hijos que el `RouteGuard` protegerá.
 * @property {boolean} [requireAuth=true] - Indica si la ruta requiere autenticación. Por defecto es `true`.
 * @property {string} [redirectTo] - La ruta a la que se redirigirá si el usuario no está autenticado y `requireAuth` es `true`.
 *                                  Si no se especifica, redirige a la raíz (`/`).
 */

/**
 * @function RouteGuard
 * @description Componente de React que implementa un sistema de protección de rutas basado en el estado de autenticación del usuario.
 * Utiliza `useAuth` para determinar si el usuario está autenticado y `next/navigation` para las redirecciones.
 * Muestra un indicador de carga mientras se verifica el estado de autenticación.
 * @param {RouteGuardProps} props - Las propiedades para el componente `RouteGuard`.
 * @returns {JSX.Element | null} Los elementos hijos si el usuario está autorizado, un indicador de carga, o `null` si se está redirigiendo.
 */
export function RouteGuard({
    children,
    requireAuth = true,
    redirectTo,
}: RouteGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Esperar hasta que la autenticación esté inicializada
        if (isLoading) return;

        // Si la ruta requiere autenticación y el usuario no está autenticado
        if (requireAuth && !isAuthenticated) {
            router.push(redirectTo || "/");
            return;
        }

        // Si la ruta no requiere autenticación y el usuario está autenticado
        // (útil para páginas de login)
        if (!requireAuth && isAuthenticated) {
            router.push("/home");
            return;
        }
    }, [isAuthenticated, isLoading, requireAuth, router, redirectTo]);

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }
    return <>{children}</>;
}
