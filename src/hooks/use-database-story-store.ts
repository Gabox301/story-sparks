"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
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
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StoryStats>({ totalStories: 0, favoriteStories: 0 });
    
    // Referencias para caché y control de peticiones
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const lastRequestTimeRef = useRef<number>(0);
    const loadingPromiseRef = useRef<Promise<void> | null>(null);

    // Convertir StoryWithFiles a Story para compatibilidad
    const convertStoryWithFilesToStory = useCallback((storyWithFiles: StoryWithFiles): Story => {
        return {
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
        };
    }, []);

    // Función auxiliar para verificar si el caché es válido
    const isCacheValid = useCallback((key: string): boolean => {
        const entry = cacheRef.current.get(key);
        if (!entry) return false;
        return Date.now() - entry.timestamp < CACHE_TTL;
    }, []);

    // Función auxiliar para obtener datos del caché
    const getCachedData = useCallback((key: string): any | null => {
        if (isCacheValid(key)) {
            return cacheRef.current.get(key)?.data || null;
        }
        return null;
    }, [isCacheValid]);

    // Función auxiliar para guardar en caché
    const setCachedData = useCallback((key: string, data: any) => {
        cacheRef.current.set(key, {
            data,
            timestamp: Date.now()
        });
    }, []);

    // Cargar cuentos desde la API con caché y throttling
    const loadStories = useCallback(async (forceRefresh: boolean = false) => {
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
        const cacheKey = `stories_${user?.id || 'anonymous'}`;
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
        const timeSinceLastRequest = now - lastRequestTimeRef.current;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && !forceRefresh) {
            // Si la última petición fue muy reciente, no hacer nada
            return;
        }

        // Crear nueva promesa de carga
        const loadPromise = (async () => {
            try {
                setLoading(true);
                setError(null);
                lastRequestTimeRef.current = Date.now();

                const response = await fetch("/api/stories?includeStats=true");
            
            if (!response.ok) {
                // Si es un error 401 (no autorizado), no mostrar error
                if (response.status === 401) {
                    setStories([]);
                    setStats({ totalStories: 0, favoriteStories: 0 });
                    setLoading(false);
                    return;
                }
                // Para cuentas nuevas, un error 500 puede significar que no hay datos iniciales
                // No mostrar error en este caso
                if (response.status === 500) {
                    setStories([]);
                    setStats({ totalStories: 0, favoriteStories: 0 });
                    setLoading(false);
                    return;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            // Verificar que la respuesta sea JSON válido
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("La respuesta no es JSON. Content-Type:", contentType);
                // Si recibimos HTML en lugar de JSON, probablemente es un problema de autenticación
                // o redirección. No mostrar error al usuario, solo cargar lista vacía.
                setStories([]);
                setStats({ totalStories: 0, favoriteStories: 0 });
                setLoading(false);
                return;
            }

            const result = await response.json();

                if (result.success) {
                    // Manejar el caso donde stories puede ser undefined o null
                    const stories = result.data.stories || [];
                    const convertedStories = stories.map(convertStoryWithFilesToStory);
                    setStories(convertedStories);
                    
                    // Manejar stats, con valores por defecto si no existen
                    const statsData = result.data.stats || { totalStories: 0, favoriteStories: 0 };
                    setStats(statsData);
                    
                    // Guardar en caché
                    setCachedData(cacheKey, {
                        stories: convertedStories,
                        stats: statsData
                    });
                } else {
                // Solo mostrar error si realmente hay un problema, no si simplemente no hay cuentos
                if (result.error && !result.error.includes('no encontrado')) {
                    throw new Error(result.error);
                } else {
                    // Caso de cuenta nueva sin cuentos - no es un error
                    setStories([]);
                    setStats({ totalStories: 0, favoriteStories: 0 });
                }
            }
        } catch (err) {
            console.error("Error loading stories:", err);
            // Para cuentas nuevas, no mostrar errores como problemas críticos
            // Solo mostrar errores para problemas reales de red o autenticación
            if (err instanceof Error && 
                !err.message.includes('no encontrado') && 
                !err.message.includes('Error HTTP: 500')) {
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
    }, [isAuthenticated, user?.id, convertStoryWithFilesToStory, getCachedData, setCachedData]);

    // Crear un nuevo cuento
    const addStory = useCallback(async (storyData: Omit<Story, "id" | "createdAt">): Promise<Story> => {
        try {
            const response = await fetch("/api/stories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(storyData),
            });

            const result = await response.json();

            if (result.success) {
                const newStory = convertStoryWithFilesToStory(result.data.story);
                setStories(prevStories => [newStory, ...prevStories]);
                setStats(prevStats => ({
                    ...prevStats,
                    totalStories: prevStats.totalStories + 1,
                }));
                
                // Invalidar caché después de crear una historia
                const cacheKey = `stories_${user?.id || 'anonymous'}`;
                cacheRef.current.delete(cacheKey);
                
                return newStory;
            } else {
                throw new Error(result.error || "Error al crear el cuento");
            }
        } catch (err) {
            console.error("Error creating story:", err);
            throw err;
        }
    }, [convertStoryWithFilesToStory, user?.id]);

    // Actualizar un cuento
    const updateStory = useCallback(async (
        storyId: string, 
        updates: Partial<Pick<Story, "content" | "imageUrl" | "audioSrc" | "favorite" | "extendedCount">>
    ): Promise<Story> => {
        try {
            // Mapear audioSrc a audioUrl para la API
            const apiUpdates: any = { ...updates };
            if (updates.audioSrc !== undefined) {
                apiUpdates.audioUrl = updates.audioSrc;
                delete apiUpdates.audioSrc;
            }

            const response = await fetch(`/api/stories/${storyId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(apiUpdates),
            });

            const result = await response.json();

            if (result.success) {
                const updatedStory = convertStoryWithFilesToStory(result.data.story);
                setStories(prevStories => 
                    prevStories.map(story => 
                        story.id === storyId ? updatedStory : story
                    )
                );
                
                // Invalidar caché después de actualizar
                const cacheKey = `stories_${user?.id || 'anonymous'}`;
                cacheRef.current.delete(cacheKey);
                
                return updatedStory;
            } else {
                throw new Error(result.error || "Error al actualizar el cuento");
            }
        } catch (err) {
            console.error("Error updating story:", err);
            throw err;
        }
    }, [convertStoryWithFilesToStory, user?.id]);

    // Eliminar un cuento
    const removeStory = useCallback(async (storyId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/stories/${storyId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                setStories(prevStories => prevStories.filter(story => story.id !== storyId));
                setStats(prevStats => ({
                    ...prevStats,
                    totalStories: Math.max(0, prevStats.totalStories - 1),
                }));
                
                // Invalidar caché después de eliminar
                const cacheKey = `stories_${user?.id || 'anonymous'}`;
                cacheRef.current.delete(cacheKey);
            } else {
                throw new Error(result.error || "Error al eliminar el cuento");
            }
        } catch (err) {
            console.error("Error removing story:", err);
            throw err;
        }
    }, [user?.id]);

    // Alternar favorito
    const toggleFavorite = useCallback(async (storyId: string): Promise<void> => {
        const story = stories.find(s => s.id === storyId);
        if (!story) return;

        try {
            const newFavoriteStatus = !story.favorite;
            await updateStory(storyId, { favorite: newFavoriteStatus });
            
            // Actualizar stats localmente
            setStats(prevStats => ({
                ...prevStats,
                favoriteStories: newFavoriteStatus 
                    ? prevStats.favoriteStories + 1 
                    : Math.max(0, prevStats.favoriteStories - 1),
            }));
        } catch (err) {
            console.error("Error toggling favorite:", err);
            throw err;
        }
    }, [stories, updateStory]);

    // Limpiar todos los cuentos
    const clearAllStories = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch("/api/stories", {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                setStories([]);
                setStats({ totalStories: 0, favoriteStories: 0 });
                
                // Limpiar todo el caché
                cacheRef.current.clear();
            } else {
                throw new Error(result.error || "Error al eliminar todos los cuentos");
            }
        } catch (err) {
            console.error("Error clearing all stories:", err);
            throw err;
        }
    }, []);

    // Buscar cuentos
    const searchStories = useCallback(async (searchText: string): Promise<Story[]> => {
        if (!searchText.trim()) {
            return stories;
        }

        try {
            const response = await fetch(`/api/stories?search=${encodeURIComponent(searchText.trim())}`);
            const result = await response.json();

            if (result.success) {
                return result.data.stories.map(convertStoryWithFilesToStory);
            } else {
                throw new Error(result.error || "Error al buscar cuentos");
            }
        } catch (err) {
            console.error("Error searching stories:", err);
            return [];
        }
    }, [stories, convertStoryWithFilesToStory]);

    // Obtener estadísticas de almacenamiento (compatibilidad con el hook anterior)
    const getStorageStats = useCallback(async () => {
        return {
            storyCount: stats.totalStories,
            sizeInKB: 0, // No aplicable para base de datos
            maxStories: 5, // Límite por defecto para usuarios
            storageUsed: `${((stats.totalStories / 5) * 100).toFixed(1)}%`,
        };
    }, [stats.totalStories]);

    // Exportar cuentos (funcionalidad a implementar)
    const exportStories = useCallback(() => {
        console.log("Export functionality to be implemented");
        // TODO: Implementar exportación desde base de datos
    }, []);

    // Cargar cuentos cuando el usuario esté autenticado
    useEffect(() => {
        // Solo cargar si hay autenticación y el usuario está definido
        if (isAuthenticated && user?.id) {
            // Pequeño delay para asegurar que la sesión esté completamente propagada
            const timer = setTimeout(() => {
                loadStories(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user?.id]); // Incluimos user?.id para asegurar que tengamos la sesión completa

    // Escuchar eventos personalizados para recargar cuentos
    useEffect(() => {
        const handleStoryCreated = () => {
            // Forzar actualización cuando se crea una nueva historia
            loadStories(true);
        };

        const handleStoryUpdated = () => {
            // Forzar actualización cuando se actualiza una historia
            loadStories(true);
        };

        window.addEventListener('storyCreated', handleStoryCreated);
        window.addEventListener('storyUpdated', handleStoryUpdated);

        return () => {
            window.removeEventListener('storyCreated', handleStoryCreated);
            window.removeEventListener('storyUpdated', handleStoryUpdated);
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
        refreshStories: () => loadStories(true), // Siempre forzar actualización en refresh manual
        MAX_STORIES: 5,
    };
}
