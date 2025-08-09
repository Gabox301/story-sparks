/**
 * @module CookieSync
 * @description Utilidades para forzar la sincronización de cookies NextAuth
 * y solucionar problemas de desincronización entre el cliente y servidor
 */

/**
 * Fuerza la sincronización de cookies haciendo una petición al endpoint de sesión
 * y esperando a que las cookies se propaguen correctamente
 */
export async function forceCookieSync(): Promise<boolean> {
    try {
        console.log(
            "[CookieSync] Forzando sincronización de cookie de sesión..."
        );

        // Llamada al endpoint para obtener sesión y que el servidor envíe la cookie
        const response = await fetch("/api/auth/session", {
            method: "GET",
            credentials: "include", // 🔹 Muy importante para que el navegador guarde la cookie
            headers: {
                "Cache-Control": "no-cache",
            },
        });

        if (!response.ok) {
            console.warn(
                "[CookieSync] No se pudo obtener la sesión:",
                response.status
            );
            return false;
        }

        // Verificar si la cookie está presente después de la llamada
        const cookies = document.cookie;
        const hasSessionCookie =
            cookies.includes("next-auth.session-token") ||
            cookies.includes("__Secure-next-auth.session-token");

        if (hasSessionCookie) {
            console.log("[CookieSync] Cookie detectada y sincronizada");
            return true;
        } else {
            console.warn(
                "[CookieSync] No se encontró la cookie después de sincronizar"
            );
            return false;
        }
    } catch (error) {
        console.error("[CookieSync] Error durante la sincronización:", error);
        return false;
    }
}

/**
 * Detecta si hay un problema de sincronización de cookies comparando
 * las cookies del navegador con la respuesta del servidor
 */
export function detectCookieSyncIssue(): boolean {
    if (typeof document === "undefined") return false;

    const cookies = document.cookie;
    const sessionTokens = cookies
        .split(";")
        .filter((cookie) => cookie.includes("next-auth.session-token"))
        .map((cookie) => cookie.trim());

    // Si hay múltiples tokens de sesión, puede haber un problema
    if (sessionTokens.length > 1) {
        console.warn(
            "[Cookie Sync] Multiple session tokens detected:",
            sessionTokens
        );
        return true;
    }

    // Si no hay tokens de sesión pero deberíamos tenerlos
    if (sessionTokens.length === 0) {
        console.warn("[Cookie Sync] No session tokens found");
        return true;
    }

    return false;
}

/**
 * Limpia todas las cookies duplicadas de NextAuth manteniendo solo la más reciente
 */
export function cleanupDuplicateCookies(): void {
    if (typeof document === "undefined") return;

    const cookies = document.cookie.split(";");
    const sessionCookies = cookies.filter((cookie) =>
        cookie.includes("next-auth.session-token")
    );

    if (sessionCookies.length > 1) {
        console.log("[Cookie Sync] Cleaning up duplicate cookies...");

        // Eliminar todas las cookies de sesión
        sessionCookies.forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        });

        console.log("[Cookie Sync] Duplicate cookies cleaned up");
    }
}
