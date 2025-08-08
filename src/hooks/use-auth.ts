import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Hook personalizado para manejar la autenticación global
 * Proporciona funciones y estado para gestionar la sesión del usuario
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
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            if (result?.ok) {
                // Redirigir a home después del login exitoso
                router.push("/home");
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
            // Forzar redirección en caso de error
            router.push("/");
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
