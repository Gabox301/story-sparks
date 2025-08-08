import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * @module useAuth
 * @description Este módulo proporciona un hook personalizado para gestionar el estado de autenticación del usuario
 * en una aplicación Next.js, utilizando `next-auth` para la gestión de sesiones y `next/navigation` para las redirecciones.
 */

/**
 * @function useAuth
 * @description Hook personalizado que encapsula la lógica de autenticación, proporcionando el estado de la sesión
 * del usuario, funciones para iniciar y cerrar sesión, y utilidades para refrescar la sesión.
 * @returns {object} Un objeto que contiene el estado de autenticación y funciones relacionadas:
 * @property {object | null} user - El objeto de usuario de la sesión, o `null` si no hay sesión activa.
 * @property {object | null} session - El objeto de sesión completo de `next-auth`.
 * @property {boolean} isAuthenticated - `true` si el usuario está autenticado, `false` en caso contrario.
 * @property {boolean} isLoading - `true` si el estado de autenticación está cargando, `false` en caso contrario.
 * @property {boolean} isInitialized - `true` si el hook ha terminado de inicializar el estado de autenticación.
 * @property {function(string, string): Promise<object>} login - Función para iniciar sesión con credenciales (email y contraseña).
 * @property {function(): Promise<void>} logout - Función para cerrar la sesión del usuario.
 * @property {function(): Promise<void>} refreshSession - Función para refrescar la sesión del usuario.
 * @property {string} status - El estado actual de la sesión (`'loading'`, `'authenticated'`, `'unauthenticated'`).
 */
export function useAuth() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [isInitialized, setIsInitialized] = useState(false);

    // Marcar como inicializado cuando el estado de la sesión esté listo
    useEffect(() => {
        if (status !== "loading") {
            setIsInitialized(true);
        }
    }, [status]);

    // Función para iniciar sesión
    const login = async (email: string, password: string) => {
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: true,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            if (result?.ok) {
                return { success: true };
            }
        } catch (error) {
            console.error("Error durante el login:", error);
            throw error;
        }
    };

    // Función para cerrar sesión
    const logout = async () => {
        try {
            await signOut({
                callbackUrl: "/",
                redirect: true,
            });
        } catch (error) {
            console.error("Error durante el logout:", error);
        }
    };

    // Función para refrescar la sesión
    const refreshSession = async () => {
        try {
            await update();
        } catch (error) {
            console.error("Error al refrescar la sesión:", error);
        }
    };

    // Función para verificar si el usuario está autenticado
    const isAuthenticated = status === "authenticated" && !!session?.user;

    // Función para verificar si la autenticación está cargando
    const isLoading = status === "loading" || !isInitialized;

    // Función para obtener datos del usuario
    const user = session?.user || null;

    return {
        user,
        session,
        isAuthenticated,
        isLoading,
        isInitialized,
        login,
        logout,
        refreshSession,
        status,
    };
}
