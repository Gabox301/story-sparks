/**
 * @module UseDatabaseStoryStoreModule
 * @description Este módulo contiene el hook `useDatabaseStoryStore`,
 * que gestiona el estado y la persistencia de las historias utilizando una API de base de datos.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { forceCookieSync } from "@/lib/cookie-sync";
import type { StoryWithFiles } from "@/lib/story-service";
import type { Story } from "@/lib/types";

interface StoryStats {
    totalStories: number;
    favoriteStories: number;
}

interface CacheEntry {
    data: any;
    timestamp: number;
}

// Tiempo de vida del caché en milisegundos (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

// Tiempo mínimo entre peticiones (2 segundos)
const MIN_REQUEST_INTERVAL = 2000;

/**
 * Hook para manejar el estado de los cuentos usando la API de base de datos
 */
export function useDatabaseStoryStore() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StoryStats>({
        totalStories: 0,
        favoriteStories: 0,
    });

    // Referencias para caché y control de peticiones
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const lastRequestTimeRef = useRef<number>(0);
    const loadingPromiseRef = useRef<Promise<void> | null>(null);

    // Convertir StoryWithFiles a Story para compatibilidad
    const convertStoryWithFilesToStory = useCallback(
        (storyWithFiles: StoryWithFiles): Story => ({
            id: storyWithFiles.id,
            theme: storyWithFiles.theme,
            mainCharacterName: storyWithFiles.mainCharacterName,
            mainCharacterTraits: storyWithFiles.mainCharacterTraits,
            title: storyWithFiles.title,
            content: storyWithFiles.content,
            createdAt: storyWithFiles.createdAt,
            imageUrl: storyWithFiles.imageUrl,
            audioSrc: storyWithFiles.audioUrl,
            favorite: storyWithFiles.favorite,
            extendedCount: storyWithFiles.extendedCount,
        }),
        []
    );

    // Función auxiliar para verificar si el caché es válido
    const isCacheValid = useCallback((key: string): boolean => {
        const entry = cacheRef.current.get(key);
        return !!entry && Date.now() - entry.timestamp < CACHE_TTL;
    }, []);

    // Función auxiliar para obtener datos del caché
    const getCachedData = useCallback(
        (key: string) =>
            isCacheValid(key) ? cacheRef.current.get(key)?.data || null : null,
        [isCacheValid]
    );

    // Función auxiliar para guardar en caché
    const setCachedData = useCallback((key: string, data: any) => {
        cacheRef.current.set(key, { data, timestamp: Date.now() });
    }, []);

    // Nueva función: simplemente intenta sincronizar cookies si es necesario, pero no depende de document.cookie
    const ensureSessionSync = async (): Promise<boolean> => {
        if (typeof window === "undefined") return false;
        // Solo intenta forzar sincronización si hay un problema de autenticación (401), no por visibilidad de cookies
        // Aquí siempre retornamos true para no bloquear la carga
        return true;
    };

    // Cargar cuentos desde la API con mejor manejo de sesión
    const loadStories = useCallback(
        async (forceRefresh: boolean = false) => {
            if (!isAuthenticated) {
                setStories([]);
                setStats({ totalStories: 0, favoriteStories: 0 });
                setLoading(false);
                return;
            }

            // Si ya hay una petición en curso, esperar a que termine
            if (loadingPromiseRef.current && !forceRefresh) {
                return loadingPromiseRef.current;
            }

            // Verificar caché si no es una actualización forzada
            const cacheKey = `stories_${user?.id || "anonymous"}`;
            if (!forceRefresh) {
                const cachedData = getCachedData(cacheKey);
                if (cachedData) {
                    setStories(cachedData.stories);
                    setStats(cachedData.stats);
                    setLoading(false);
                    return;
                }
            }

            // Implementar throttling para evitar peticiones excesivas
            const now = Date.now();
            if (
                now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL &&
                !forceRefresh
            ) {
                return;
            }

            // Crear nueva promesa de carga
            const loadPromise = (async () => {
                try {
                    setLoading(true);
                    setError(null);
                    lastRequestTimeRef.current = Date.now();

                    const skipSync =
                        typeof window !== "undefined" &&
                        sessionStorage.getItem("justLoggedIn") === "true";
                    if (!skipSync) {
                        const syncSuccess = await ensureSessionSync();
                        if (!syncSuccess) {
                            console.warn(
                                "[Session] No se pudo sincronizar, intentando de todas formas..."
                            );
                        }
                    } else {
                        console.log(
                            "[Session] Sincronización omitida: login reciente"
                        );
                        sessionStorage.removeItem("justLoggedIn");
                    }

                    const response = await api.get(
                        "/api/stories?includeStats=true"
                    );

                    if (!response.ok) {
                        if (response.status === 401) {
                            console.warn(
                                "[Session] 401 recibido, intentando resincronizar..."
                            );

                            // Intentar resincronizar y reintentar
                            const retrySync = await forceCookieSync();
                            if (retrySync) {
                                const retryResponse = await api.get(
                                    "/api/stories?includeStats=true"
                                );
                                if (retryResponse.ok) {
                                    return await processStoriesResponse(
                                        retryResponse
                                    );
                                }
                            }
                            setError(
                                "Sesión expirada. Por favor, inicia sesión de nuevo."
                            );
                            setStories([]);
                            setStats({ totalStories: 0, favoriteStories: 0 });
                            return;
                        }
                        throw new Error(`Error HTTP: ${response.status}`);
                    }
                    await processStoriesResponse(response);
                } catch (err) {
                    console.error("Error loading stories:", err);
                    if (
                        err instanceof Error &&
                        !err.message.includes("no encontrado")
                    ) {
                        setError(err.message);
                    }
                    setStories([]);
                    setStats({ totalStories: 0, favoriteStories: 0 });
                } finally {
                    setLoading(false);
                    loadingPromiseRef.current = null;
                }
            })();

            loadingPromiseRef.current = loadPromise;
            return loadPromise;
        },
        [
            isAuthenticated,
            user?.id,
            getCachedData,
            setCachedData,
            convertStoryWithFilesToStory,
        ]
    );

    // Función auxiliar para procesar la respuesta de cuentos
    const processStoriesResponse = async (response: Response) => {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            setStories([]);
            setStats({ totalStories: 0, favoriteStories: 0 });
            setLoading(false);
            return;
        }

        const result = await response.json();
        if (result.success) {
            const convertedStories = result.data.stories.map(
                convertStoryWithFilesToStory
            );
            setStories(convertedStories);
            setStats(
                result.data.stats || { totalStories: 0, favoriteStories: 0 }
            );

            const cacheKey = `stories_${user?.id || "anonymous"}`;
            setCachedData(cacheKey, {
                stories: convertedStories,
                stats: result.data.stats,
            });
        } else {
            setStories([]);
            setStats({ totalStories: 0, favoriteStories: 0 });
        }
    };

    // Resto de las funciones permanecen igual...
    const addStory = useCallback(
        async (storyData: Omit<Story, "id" | "createdAt">): Promise<Story> => {
            try {
                const response = await api.post("/api/stories", storyData);

                const result = await response.json();

                if (result.success) {
                    const newStory = convertStoryWithFilesToStory(
                        result.data.story
                    );
                    setStories((prevStories) => [newStory, ...prevStories]);
                    setStats((prevStats) => ({
                        ...prevStats,
                        totalStories: prevStats.totalStories + 1,
                    }));

                    const cacheKey = `stories_${user?.id || "anonymous"}`;
                    cacheRef.current.delete(cacheKey);

                    return newStory;
                } else {
                    throw new Error(result.error || "Error al crear el cuento");
                }
            } catch (err) {
                console.error("Error creating story:", err);
                throw err;
            }
        },
        [convertStoryWithFilesToStory, user?.id]
    );

    const updateStory = useCallback(
        async (
            storyId: string,
            updates: Partial<
                Pick<
                    Story,
                    | "content"
                    | "imageUrl"
                    | "audioSrc"
                    | "favorite"
                    | "extendedCount"
                >
            >
        ): Promise<Story> => {
            try {
                const apiUpdates: any = { ...updates };
                if (updates.audioSrc !== undefined) {
                    apiUpdates.audioUrl = updates.audioSrc;
                    delete apiUpdates.audioSrc;
                }

                const response = await api.put(
                    `/api/stories/${storyId}`,
                    apiUpdates
                );

                const result = await response.json();

                if (result.success) {
                    const updatedStory = convertStoryWithFilesToStory(
                        result.data.story
                    );
                    setStories((prevStories) =>
                        prevStories.map((story) =>
                            story.id === storyId ? updatedStory : story
                        )
                    );

                    const cacheKey = `stories_${user?.id || "anonymous"}`;
                    cacheRef.current.delete(cacheKey);

                    return updatedStory;
                } else {
                    throw new Error(
                        result.error || "Error al actualizar el cuento"
                    );
                }
            } catch (err) {
                console.error("Error updating story:", err);
                throw err;
            }
        },
        [convertStoryWithFilesToStory, user?.id]
    );

    const removeStory = useCallback(
        async (storyId: string): Promise<void> => {
            try {
                const response = await api.delete(`/api/stories/${storyId}`);

                const result = await response.json();

                if (result.success) {
                    setStories((prevStories) =>
                        prevStories.filter((story) => story.id !== storyId)
                    );
                    setStats((prevStats) => ({
                        ...prevStats,
                        totalStories: Math.max(0, prevStats.totalStories - 1),
                    }));

                    const cacheKey = `stories_${user?.id || "anonymous"}`;
                    cacheRef.current.delete(cacheKey);
                } else {
                    throw new Error(
                        result.error || "Error al eliminar el cuento"
                    );
                }
            } catch (err) {
                console.error("Error removing story:", err);
                throw err;
            }
        },
        [user?.id]
    );

    const toggleFavorite = useCallback(
        async (storyId: string): Promise<void> => {
            const story = stories.find((s) => s.id === storyId);
            if (!story) return;

            try {
                const newFavoriteStatus = !story.favorite;
                await updateStory(storyId, { favorite: newFavoriteStatus });

                setStats((prevStats) => ({
                    ...prevStats,
                    favoriteStories: newFavoriteStatus
                        ? prevStats.favoriteStories + 1
                        : Math.max(0, prevStats.favoriteStories - 1),
                }));
            } catch (err) {
                console.error("Error toggling favorite:", err);
                throw err;
            }
        },
        [stories, updateStory]
    );

    const clearAllStories = useCallback(async (): Promise<void> => {
        try {
            const response = await api.delete("/api/stories");

            const result = await response.json();

            if (result.success) {
                setStories([]);
                setStats({ totalStories: 0, favoriteStories: 0 });
                cacheRef.current.clear();
            } else {
                throw new Error(
                    result.error || "Error al eliminar todos los cuentos"
                );
            }
        } catch (err) {
            console.error("Error clearing all stories:", err);
            throw err;
        }
    }, []);

    const searchStories = useCallback(
        async (searchText: string): Promise<Story[]> => {
            if (!searchText.trim()) {
                return stories;
            }

            try {
                const response = await api.get(
                    `/api/stories?search=${encodeURIComponent(
                        searchText.trim()
                    )}`
                );
                const result = await response.json();

                if (result.success) {
                    return result.data.stories.map(
                        convertStoryWithFilesToStory
                    );
                } else {
                    throw new Error(result.error || "Error al buscar cuentos");
                }
            } catch (err) {
                console.error("Error searching stories:", err);
                return [];
            }
        },
        [stories, convertStoryWithFilesToStory]
    );

    const getStorageStats = useCallback(async () => {
        return {
            storyCount: stats.totalStories,
            sizeInKB: 0,
            maxStories: 5,
            storageUsed: `${((stats.totalStories / 5) * 100).toFixed(1)}%`,
        };
    }, [stats.totalStories]);

    const exportStories = useCallback(() => {
        console.log("Export functionality to be implemented");
    }, []);

    // Cargar cuentos cuando el usuario esté autenticado con mejor sincronización
    useEffect(() => {
        const initializeStories = async () => {
            if (isAuthenticated && user?.id) {
                console.log(
                    "[Session] Usuario autenticado detectado, cargando cuentos..."
                );

                // Esperar a que la sesión esté completamente establecida
                const maxRetries = 3;
                let retries = 0;

                while (retries < maxRetries) {
                    const syncSuccess = await ensureSessionSync();
                    if (syncSuccess) {
                        await loadStories(false);
                        break;
                    }

                    retries++;
                    if (retries < maxRetries) {
                        console.log(
                            `[Session] Reintento ${retries}/${maxRetries} en 1 segundo...`
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                    }
                }

                if (retries === maxRetries) {
                    console.error(
                        "[Session] Falló la sincronización después de varios intentos"
                    );
                    setError("No se pudo sincronizar con el servidor");
                    setLoading(false);
                }
            }
        };

        initializeStories();
    }, [isAuthenticated, user?.id]);

    // Escuchar eventos personalizados para recargar cuentos
    useEffect(() => {
        const handleStoryCreated = () => {
            loadStories(true);
        };

        const handleStoryUpdated = () => {
            loadStories(true);
        };

        window.addEventListener("storyCreated", handleStoryCreated);
        window.addEventListener("storyUpdated", handleStoryUpdated);

        return () => {
            window.removeEventListener("storyCreated", handleStoryCreated);
            window.removeEventListener("storyUpdated", handleStoryUpdated);
        };
    }, [loadStories]);

    return {
        stories,
        loading,
        error,
        stats,
        addStory,
        updateStory,
        removeStory,
        toggleFavorite,
        clearAllStories,
        searchStories,
        exportStories,
        getStorageStats,
        refreshStories: () => loadStories(true),
        MAX_STORIES: 5,
    };
}
