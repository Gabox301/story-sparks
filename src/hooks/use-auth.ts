import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { forceCookieSync } from "@/lib/cookie-sync";

export function useAuth() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [isInitialized, setIsInitialized] = useState(false);

    // Marcamos inicializado cuando el estado deja de estar en loading
    useEffect(() => {
        if (status !== "loading") {
            setIsInitialized(true);
        }
    }, [status]);

    /**
     * 🔹 Sincroniza la cookie de sesión y refresca datos de next-auth.
     */
    const syncCookieAndSession = async () => {
        const synced = await forceCookieSync();
        if (synced) {
            console.log("[Auth] Cookie sincronizada correctamente");
            await update(); // Refrescar datos de sesión
            await new Promise((res) => setTimeout(res, 500)); // Espera breve para que el navegador propague cookie
        } else {
            console.warn("[Auth] No se pudo sincronizar la cookie");
        }
    };

    /**
     * 🔹 Login con sincronización de cookie antes de redirigir
     */
    const login = async (email: string, password: string) => {
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false, // No redirigir automáticamente
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            if (result?.ok) {
                console.log("[Auth] Login exitoso, sincronizando cookie...");
                await syncCookieAndSession();
                router.push("/"); // Redirigimos solo cuando la cookie y sesión están listas
                return { success: true };
            }
        } catch (error) {
            console.error("Error durante el login:", error);
            throw error;
        }
    };

    /**
     * 🔹 Logout con revocación de token en backend
     */
    const logout = async () => {
        try {
            await fetch("/api/auth/revoke-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            await signOut({
                callbackUrl: "/",
                redirect: true,
            });
        } catch (error) {
            console.error("Error durante el logout:", error);
        }
    };

    /**
     * 🔹 Refrescar manualmente la sesión
     */
    const refreshSession = async () => {
        try {
            await update();
        } catch (error) {
            console.error("Error al refrescar la sesión:", error);
        }
    };

    const isAuthenticated = status === "authenticated" && !!session?.user;
    const isLoading = status === "loading" || !isInitialized;
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
