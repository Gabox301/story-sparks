"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { StoryWithFiles } from "@/lib/story-service";
import type { Story } from "@/lib/types";

interface StoryStats {
    totalStories: number;
    favoriteStories: number;
}

/**
 * Hook para manejar el estado de los cuentos usando la API de base de datos
 */
export function useDatabaseStoryStore() {
    const { isAuthenticated, user } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StoryStats>({ totalStories: 0, favoriteStories: 0 });

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

    // Cargar cuentos desde la API
    const loadStories = useCallback(async () => {
        if (!isAuthenticated) {
            setStories([]);
            setStats({ totalStories: 0, favoriteStories: 0 });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

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

            const result = await response.json();

            if (result.success) {
                // Manejar el caso donde stories puede ser undefined o null
                const stories = result.data.stories || [];
                const convertedStories = stories.map(convertStoryWithFilesToStory);
                setStories(convertedStories);
                
                // Manejar stats, con valores por defecto si no existen
                const stats = result.data.stats || { totalStories: 0, favoriteStories: 0 };
                setStats(stats);
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
        }
    }, [isAuthenticated, convertStoryWithFilesToStory]);

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
                return newStory;
            } else {
                throw new Error(result.error || "Error al crear el cuento");
            }
        } catch (err) {
            console.error("Error creating story:", err);
            throw err;
        }
    }, [convertStoryWithFilesToStory]);

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
                return updatedStory;
            } else {
                throw new Error(result.error || "Error al actualizar el cuento");
            }
        } catch (err) {
            console.error("Error updating story:", err);
            throw err;
        }
    }, [convertStoryWithFilesToStory]);

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
            } else {
                throw new Error(result.error || "Error al eliminar el cuento");
            }
        } catch (err) {
            console.error("Error removing story:", err);
            throw err;
        }
    }, []);

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
        loadStories();
    }, [loadStories]);

    // Escuchar eventos personalizados para recargar cuentos
    useEffect(() => {
        const handleStoryCreated = () => {
            loadStories();
        };

        const handleStoryUpdated = () => {
            loadStories();
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
        refreshStories: loadStories,
        MAX_STORIES: 5,
    };
}
