/**
 * @module UseErrorHandler
 * @description Hook para manejar errores de autenticación y API de manera centralizada.
 * Evita bucles de redirección y gestiona los errores de sesión de forma robusta.
 */

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook para manejar errores de autenticación y API
 * @returns Objeto con funciones para manejar errores
 */
export function useErrorHandler() {
    const router = useRouter();
    const { status, isAuthenticated, refreshSession } = useAuth();
    const redirectingRef = useRef(false);
    const lastRedirectTime = useRef(0);
    
    // Tiempo mínimo entre redirecciones para evitar bucles
    const MIN_REDIRECT_INTERVAL = 5000; // 5 segundos

    /**
     * Maneja errores de autenticación (401)
     * @param error - Error recibido
     * @param context - Contexto donde ocurrió el error
     */
    const handleAuthError = useCallback(async (error: any, context: string = 'unknown') => {
        console.warn(`Auth error in ${context}:`, error);
        
        // Si ya estamos redirigiendo, no hacer nada
        const now = Date.now();
        if (redirectingRef.current || (now - lastRedirectTime.current) < MIN_REDIRECT_INTERVAL) {
            return;
        }

        // Si el status indica que no hay sesión, redirigir
        if (status === 'unauthenticated') {
            redirectingRef.current = true;
            lastRedirectTime.current = now;
            
            setTimeout(() => {
                redirectingRef.current = false;
            }, MIN_REDIRECT_INTERVAL);

            router.push('/');
            return;
        }

        // Si hay sesión pero el error persiste, intentar refrescar
        if (isAuthenticated) {
            try {
                await refreshSession();
            } catch (refreshError) {
                console.error('Error refreshing session:', refreshError);
                // Si el refresh falla, redirigir después de un delay
                setTimeout(() => {
                    if (!redirectingRef.current) {
                        redirectingRef.current = true;
                        lastRedirectTime.current = Date.now();
                        router.push('/');
                        
                        setTimeout(() => {
                            redirectingRef.current = false;
                        }, MIN_REDIRECT_INTERVAL);
                    }
                }, 1000);
            }
        }
    }, [status, isAuthenticated, refreshSession, router]);

    /**
     * Maneja respuestas de API con errores
     * @param response - Respuesta de la API
     * @param context - Contexto donde ocurrió el error
     * @returns true si se debe abortar la operación, false si se puede continuar
     */
    const handleApiResponse = useCallback(async (response: Response, context: string = 'api') => {
        if (response.status === 401) {
            await handleAuthError(new Error('Unauthorized'), context);
            return true; // Abortar operación
        }
        return false; // Continuar con la operación
    }, [handleAuthError]);

    /**
     * Maneja errores generales de la aplicación
     * @param error - Error ocurrido
     * @param context - Contexto donde ocurrió el error
     */
    const handleError = useCallback((error: any, context: string = 'app') => {
        console.error(`Error in ${context}:`, error);
        
        // Si es un error de autenticación, manejarlo específicamente
        if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            handleAuthError(error, context);
            return;
        }

        // Para otros errores, solo loguear (se pueden agregar más manejadores aquí)
    }, [handleAuthError]);

    return {
        handleAuthError,
        handleApiResponse,
        handleError,
        isRedirecting: redirectingRef.current,
    };
}
