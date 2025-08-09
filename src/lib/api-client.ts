/**
 * @module ApiClient
 * @description Cliente para realizar peticiones HTTP autenticadas a la API.
 * Asegura que las cookies de sesión se envíen correctamente con cada petición.
 */

import {
    forceCookieSync,
    detectCookieSyncIssue,
    cleanupDuplicateCookies,
} from "./cookie-sync";

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Función para obtener todas las cookies del documento
 */
function getAllCookies(): string {
    if (typeof document !== "undefined") {
        return document.cookie;
    }
    return "";
}

/**
 * Función para verificar si existe una cookie de sesión
 */
function hasSessionCookie(): boolean {
    const cookies = getAllCookies();
    return (
        cookies.includes("next-auth.session-token") ||
        cookies.includes("__Secure-next-auth.session-token")
    );
}

/**
 * Cliente para peticiones autenticadas a la API
 * @param url - URL de la API (puede ser relativa)
 * @param options - Opciones de fetch
 * @returns Promise con la respuesta
 */
export async function apiClient(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    // Logging para diagnosticar problemas de cookies
    const hasCookie = hasSessionCookie();
    console.log(`[API Client] Request to ${url}`);
    console.log(`[API Client] Has session cookie: ${hasCookie}`);

    if (process.env.NODE_ENV === "development") {
        console.log(
            `[API Client] All cookies (before request): ${getAllCookies()}`
        );
    }

    const defaultOptions: FetchOptions = {
        credentials: "include",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    const mergedOptions: FetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        console.log(
            `[API Client] Making request with credentials: ${mergedOptions.credentials}`
        );
        const response = await fetch(url, mergedOptions);
        console.log(`[API Client] Response status: ${response.status}`);

        // Si recibimos un 401, intentar refrescar la sesión
        if (response.status === 401) {
            console.warn(
                "[API Client] Received 401, attempting session refresh"
            );

            // Verificar si es un reintento para evitar bucles infinitos
            if (!options.headers || !options.headers["X-Retry-Auth"]) {
                try {
                    // Detectar y limpiar cookies duplicadas
                    if (detectCookieSyncIssue()) {
                        console.warn(
                            "[API Client] Cookie sync issue detected, cleaning up..."
                        );
                        cleanupDuplicateCookies();
                    }

                    // Intentar sincronizar cookies
                    console.log(
                        "[API Client] Attempting cookie synchronization..."
                    );
                    const syncSuccess = await forceCookieSync();

                    if (syncSuccess) {
                        console.log(
                            "[API Client] Cookie sync successful, retrying original request"
                        );

                        if (process.env.NODE_ENV === "development") {
                            console.log(
                                `[API Client] All cookies (after sync, before retry): ${getAllCookies()}`
                            );
                        }

                        // Reintentar con marca de reintento
                        const retryOptions = {
                            ...mergedOptions,
                            headers: {
                                ...mergedOptions.headers,
                                "X-Retry-Auth": "true",
                            },
                        };

                        const retryResponse = await fetch(url, retryOptions);
                        console.log(
                            `[API Client] Retry response status: ${retryResponse.status}`
                        );

                        if (retryResponse.status === 401) {
                            console.error(
                                "[API Client] Persistent 401 after cookie sync"
                            );
                            if (process.env.NODE_ENV === "development") {
                                console.error(
                                    "PERSISTENT 401: Session may be expired or invalid"
                                );
                            }
                        }

                        return retryResponse;
                    } else {
                        console.warn("[API Client] Cookie sync failed");
                    }
                } catch (error) {
                    console.error(
                        "[API Client] Error during cookie sync:",
                        error
                    );
                }
            } else {
                console.warn(
                    "[API Client] Skipping cookie sync - already retried"
                );
            }
        }

        return response;
    } catch (error) {
        console.error("[API Client] Request failed:", error);
        throw error;
    }
}

/**
 * Helpers para métodos HTTP comunes
 */
export const api = {
    get: (url: string, options?: Omit<FetchOptions, "method">) =>
        apiClient(url, { ...options, method: "GET" }),

    post: (
        url: string,
        data?: any,
        options?: Omit<FetchOptions, "method" | "body">
    ) =>
        apiClient(url, {
            ...options,
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: (
        url: string,
        data?: any,
        options?: Omit<FetchOptions, "method" | "body">
    ) =>
        apiClient(url, {
            ...options,
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: (url: string, options?: Omit<FetchOptions, "method">) =>
        apiClient(url, { ...options, method: "DELETE" }),
};
