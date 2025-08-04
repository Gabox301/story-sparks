"use client";

import { useState, useEffect, useCallback } from "react";
import type { Story } from "@/lib/types";
import { deleteAudioCacheAction } from "@/app/actions";
import { createHash } from "crypto";

const STORY_STORAGE_KEY = "story-spark-stories";

/**
 * @summary Define la estructura para las actualizaciones parciales de una historia.
 * @property {string} [content] - Nuevo contenido de la historia.
 * @property {string} [imageUrl] - Nueva URL de la imagen de la historia.
 * @property {number} [extendedCount] - Número de veces que la historia ha sido extendida.
 * @property {boolean} [isGeneratingSpeech] - Indica si se está generando el audio de la historia.
 * @property {string | null} [audioSrc] - La fuente del audio de la historia (puede ser un URI de datos o una URL pública).
 * @property {string} [audioUrl] - La URL pública del audio cacheado, utilizada internamente para actualizar `audioSrc`.
 */
type StoryUpdate = {
    content?: string;
    imageUrl?: string;
    extendedCount?: number;
    isGeneratingSpeech?: boolean;
    audioSrc?: string | null;
    audioUrl?: string;
};

/**
 * @summary Hook personalizado para gestionar el estado y la persistencia de las historias en el almacenamiento local.
 * @description Proporciona funciones para añadir, actualizar, eliminar, y recuperar historias,
 * así como para gestionar el almacenamiento de audio y las estadísticas de uso de la cuota.
 * @returns {object} Un objeto que contiene el estado de las historias y varias funciones para interactuar con ellas.
 */
export function useStoryStore() {
    const [stories, setStories] = useState<Story[]>([]);
    const MAX_STORIES = 4; // Límite máximo de historias para evitar problemas de almacenamiento

    /**
     * @summary Efecto que se ejecuta una vez al montar el componente para cargar las historias desde el almacenamiento local.
     * @description Carga las historias guardadas, las limita al `MAX_STORIES` definido y asegura la inicialización de nuevas propiedades.
     * Maneja errores de carga y actualiza el almacenamiento si se excede el límite.
     */
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const storedStories = localStorage.getItem(STORY_STORAGE_KEY);
            if (storedStories) {
                const parsedStories = JSON.parse(storedStories);
                // Limitar historias al cargar y asegurar que las nuevas propiedades se inicialicen si no existen
                const limitedStories = parsedStories
                    .slice(0, MAX_STORIES)
                    .map((story: Story) => ({
                        ...story,
                        isGeneratingSpeech: story.isGeneratingSpeech || false,
                        audioSrc: story.audioSrc || null,
                    }));
                setStories(limitedStories);

                // Si había más historias, actualizar el almacenamiento
                if (parsedStories.length > MAX_STORIES) {
                    localStorage.setItem(
                        STORY_STORAGE_KEY,
                        JSON.stringify(limitedStories)
                    );
                }
            }
        } catch (error) {
            console.error("Failed to load stories from localStorage", error);
        }
    }, []);

    /**
     * @summary Guarda un array de historias en el estado y en el almacenamiento local.
     * @description Ordena las historias (favoritas primero, luego por fecha) y las guarda.
     * Implementa una lógica de manejo de errores para `QuotaExceededError`, intentando reducir el número de historias
     * o limpiando completamente el almacenamiento si es necesario.
     * @param {Story[]} newStories - El array de historias a guardar.
     */
    const saveStories = (newStories: Story[]) => {
        try {
            // Ordenar historias: favoritos primero, luego por fecha (más recientes primero)
            const sortedStories = [...newStories].sort((a, b) => {
                // Primero por estado de favorito (true primero)
                if (a.favorite && !b.favorite) return -1;
                if (!a.favorite && b.favorite) return 1;
                // Luego por fecha de creación (más recientes primero)
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            });

            setStories(sortedStories);
            if (typeof window !== "undefined") {
                localStorage.setItem(
                    STORY_STORAGE_KEY,
                    JSON.stringify(sortedStories)
                );
            }
        } catch (error) {
            console.error("Failed to save stories to localStorage", error);

            // Si el error es por cuota excedida, intentar con menos historias
            if (
                error instanceof DOMException &&
                error.name === "QuotaExceededError"
            ) {
                console.warn(
                    "Storage quota exceeded, attempting to reduce stored stories"
                );

                // Eliminar historias antiguas hasta que quepan
                const maxStories = Math.max(
                    1,
                    Math.floor(newStories.length * 0.7)
                );
                const reducedStories = newStories.slice(0, maxStories);

                try {
                    if (typeof window !== "undefined") {
                        localStorage.setItem(
                            STORY_STORAGE_KEY,
                            JSON.stringify(reducedStories)
                        );
                    }
                    setStories(reducedStories);
                    console.log(
                        `Reduced stories from ${newStories.length} to ${reducedStories.length}`
                    );
                } catch (secondError) {
                    console.error(
                        "Failed to save even reduced stories",
                        secondError
                    );

                    // Si aún falla, limpiar todo el almacenamiento
                    if (typeof window !== "undefined") {
                        localStorage.removeItem(STORY_STORAGE_KEY);
                    }
                    setStories([]);

                    // Notificar al usuario
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(
                            new CustomEvent("storageQuotaExceeded")
                        );
                    }
                }
            }
        }
    };

    /**
     * @summary Añade una nueva historia al estado y al almacenamiento local.
     * @description Genera un ID único y una fecha de creación para la nueva historia,
     * y la añade al principio de la lista, manteniendo el límite `MAX_STORIES`.
     * @param {Omit<Story, "id" | "createdAt">} storyData - Los datos de la nueva historia, excluyendo `id` y `createdAt`.
     * @returns {Story} La historia completa recién añadida.
     */
    const addStory = useCallback(
        (storyData: Omit<Story, "id" | "createdAt">) => {
            const newStory: Story = {
                ...storyData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                isGeneratingSpeech: false, // Inicializar al añadir una nueva historia
                audioSrc: null, // Inicializar al añadir una nueva historia
            };

            // Mantener solo las historias más recientes dentro del límite
            const updatedStories = [newStory, ...stories].slice(0, MAX_STORIES);
            saveStories(updatedStories);
            return newStory;
        },
        [stories]
    );

    /**
     * @summary Actualiza una historia existente por su ID con los datos proporcionados.
     * @description Busca la historia por `storyId` y aplica las actualizaciones. Si `audioUrl` está presente en las actualizaciones,
     * lo usa para establecer `audioSrc` y luego lo elimina de las actualizaciones para evitar guardarlo directamente.
     * @param {string} storyId - El ID de la historia a actualizar.
     * @param {StoryUpdate} updates - Un objeto con las propiedades de la historia a actualizar.
     */
    const updateStory = useCallback(
        (storyId: string, updates: StoryUpdate) => {
            if (updates.audioUrl) {
                updates.audioSrc = updates.audioUrl;
                delete updates.audioUrl;
            }
            const updatedStories = stories.map((story) =>
                story.id === storyId ? { ...story, ...updates } : story
            );
            saveStories(updatedStories);
        },
        [stories]
    );

    /**
     * @summary Elimina una historia por su ID del estado y del almacenamiento local.
     * @description Antes de eliminar la historia, intenta eliminar el audio cacheado asociado a su contenido.
     * @param {string} storyId - El ID de la historia a eliminar.
     */
    const removeStory = useCallback(
        async (storyId: string) => {
            const storyToRemove = stories.find((story) => story.id === storyId);
            if (storyToRemove && storyToRemove.content) {
                const audioHash = createHash("sha256")
                    .update(storyToRemove.content)
                    .digest("hex");
                await deleteAudioCacheAction(audioHash);
            }
            const updatedStories = stories.filter(
                (story) => story.id !== storyId
            );
            saveStories(updatedStories);
        },
        [stories]
    );

    /**
     * @summary Recupera una historia por su ID.
     * @param {string} storyId - El ID de la historia a recuperar.
     * @returns {Story | undefined} La historia encontrada o `undefined` si no existe.
     */
    const getStory = useCallback(
        (storyId: string) => {
            return stories.find((story) => story.id === storyId);
        },
        [stories]
    );

    /**
     * @summary Elimina todas las historias del estado y del almacenamiento local.
     * @description También intenta eliminar todos los audios cacheado asociados a las historias antes de limpiarlas.
     */
    const clearAllStories = useCallback(async () => {
        try {
            if (typeof window !== "undefined") {
                // Eliminar audios del caché antes de limpiar las historias
                for (const story of stories) {
                    if (story.content) {
                        const audioHash = createHash("sha256")
                            .update(story.content)
                            .digest("hex");
                        await deleteAudioCacheAction(audioHash);
                    }
                }
                localStorage.removeItem(STORY_STORAGE_KEY);
            }
            setStories([]);
        } catch (error) {
            console.error("Failed to clear stories from localStorage", error);
        }
    }, [stories]);

    /**
     * @summary Calcula y devuelve estadísticas sobre el uso del almacenamiento local para las historias.
     * @description Proporciona el número de historias, el tamaño total en KB, el límite máximo de historias
     * y un porcentaje estimado de uso de la cuota de almacenamiento.
     * @returns {Promise<{storyCount: number, sizeInKB: number, maxStories: number, storageUsed: string}>} Estadísticas de almacenamiento.
     */
    const getStorageStats = useCallback(async () => {
        try {
            if (typeof window === "undefined") {
                return {
                    storyCount: stories.length,
                    sizeInKB: 0,
                    maxStories: MAX_STORIES,
                    storageUsed: "N/A",
                };
            }

            const storedStories = localStorage.getItem(STORY_STORAGE_KEY);
            const sizeInBytes = storedStories
                ? new TextEncoder().encode(storedStories).length
                : 0;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);

            // Calcular el porcentaje de uso si es posible
            let storageUsed = "";
            try {
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    if (estimate.quota) {
                        const percentage = (sizeInBytes / estimate.quota) * 100;
                        storageUsed = `${percentage.toFixed(2)}%`;
                    }
                }
            } catch (error) {
                console.error("Failed to estimate storage quota:", error);
            }

            return {
                storyCount: stories.length,
                sizeInKB: parseFloat(sizeInKB),
                maxStories: MAX_STORIES,
                storageUsed: storageUsed,
            };
        } catch (error) {
            console.error("Failed to get storage stats:", error);
            return {
                storyCount: stories.length,
                sizeInKB: 0,
                maxStories: MAX_STORIES,
                storageUsed: "",
            };
        }
    }, [stories]);

    /**
     * @summary Alterna el estado de favorito de una historia específica.
     * @description Busca la historia por `storyId` y cambia su propiedad `favorite`.
     * @param {string} storyId - El ID de la historia cuyo estado de favorito se desea alternar.
     */
    const toggleFavorite = useCallback(
        (storyId: string) => {
            const updatedStories = stories.map((story) =>
                story.id === storyId
                    ? { ...story, favorite: !story.favorite }
                    : story
            );
            saveStories(updatedStories);
        },
        [stories]
    );

    const getFavoriteStories = useCallback(() => {
        return stories.filter((story) => story.favorite);
    }, [stories]);

    /**
     * @summary Exporta todas las historias guardadas como un archivo JSON descargable.
     * @description Crea un Blob con los datos de las historias y genera una URL para su descarga.
     */
    const exportStories = useCallback(() => {
        try {
            if (typeof window === "undefined") return;

            const dataStr = JSON.stringify(stories, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `story-sparks-backup-${
                new Date().toISOString().split("T")[0]
            }.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export stories", error);
        }
    }, [stories]);

    return {
        stories,
        addStory,
        updateStory,
        removeStory,
        getStory,
        clearAllStories,
        getStorageStats,
        exportStories,
        toggleFavorite,
        getFavoriteStories,
        MAX_STORIES,
    };
}
