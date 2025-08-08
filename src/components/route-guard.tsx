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
 * Componente que protege rutas basándose en el estado de autenticación
 * Redirige automáticamente según las reglas de autenticación
 */
export function RouteGuard({ 
    children, 
    requireAuth = true, 
    redirectTo 
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

    // Si la ruta requiere autenticación y el usuario no está autenticado, no mostrar nada
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    // Si la ruta no requiere autenticación y el usuario está autenticado, no mostrar nada
    if (!requireAuth && isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
