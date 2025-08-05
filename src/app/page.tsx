"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StoryGeneratorForm from "@/components/story-generator-form";
import SavedStoriesList from "@/components/saved-stories-list";
import type { Story } from "@/lib/types";
import { useStoryStore } from "@/hooks/use-story-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Image from "next/image";

export default function HomePage() {
    const {
        stories,
        addStory,
        removeStory,
        clearAllStories,
        exportStories,
        toggleFavorite,
        getStorageStats,
        MAX_STORIES,
    } = useStoryStore();
    const router = useRouter();
    const [storageStats, setStorageStats] = useState({
        storyCount: 0,
        sizeInKB: 0,
        maxStories: MAX_STORIES,
        storageUsed: "",
    });

    useEffect(() => {
        const fetchStorageStats = async () => {
            const stats = await getStorageStats();
            setStorageStats(stats);
        };
        fetchStorageStats();

        // Escuchar el evento de cuota excedida
        const handleStorageQuotaExceeded = () => {
            fetchStorageStats(); // Actualizar estadísticas cuando se excede la cuota
        };
        window.addEventListener(
            "storageQuotaExceeded",
            handleStorageQuotaExceeded
        );

        return () => {
            window.removeEventListener(
                "storageQuotaExceeded",
                handleStorageQuotaExceeded
            );
        };
    }, [stories, getStorageStats]);

    const handleStoryGenerated = (story: Omit<Story, "id" | "createdAt">) => {
        const newStory = addStory(story);
        router.push(`/stories/${newStory.id}`);
    };

    const isStorageFull =
        storageStats.storageUsed.includes("100%") ||
        (storageStats.sizeInKB > 0 && storageStats.sizeInKB >= 81920); // Asumiendo un límite de 80MB para localStorage

    return (
        <div className="flex flex-col min-h-screen overflow-hidden">
            <header className="py-6 px-4 md:px-8">
                <div className="container mx-auto flex items-center justify-center gap-2 animate-fade-in-down">
                    <Image
                        src="/logo.png"
                        alt="Chispas de Historias"
                        width={200}
                        height={80}
                        className="h-auto w-auto max-w-[200px] md:max-w-[250px]"
                        priority
                    />
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
                <div className="flex justify-center">
                    <div className="space-y-4 animate-slide-in-left max-w-2xl w-full">
                        <div className="text-center">
                            <h2 className="text-3xl font-headline font-bold text-foreground">
                                Crea Cuentos Mágicos en Segundos
                            </h2>
                            <p className="text-lg text-muted-foreground mt-2">
                                Elige un tema, crea un personaje y deja que
                                nuestra IA dé vida a tu imaginación. ¡Perfecto
                                para cuentos antes de dormir y jóvenes lectores!
                            </p>
                        </div>
                        {isStorageFull && (
                            <Alert variant="destructive">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <AlertTitle>
                                    ¡Almacenamiento casi lleno!
                                </AlertTitle>
                                <AlertDescription>
                                    Has alcanzado el límite de almacenamiento
                                    local para tus historias. Por favor, elimina
                                    algunas historias antiguas o expórtalas para
                                    liberar espacio.
                                    <div className="mt-2">
                                        <Button
                                            onClick={clearAllStories}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Borrar todas las historias
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                        <StoryGeneratorForm
                            onStoryGenerated={handleStoryGenerated}
                            storyCount={stories.length}
                            maxStories={MAX_STORIES}
                        />
                    </div>
                </div>

                <SavedStoriesList
                    stories={stories}
                    onDelete={removeStory}
                    onClearAll={clearAllStories}
                    onExport={exportStories}
                    onToggleFavorite={toggleFavorite}
                />
            </main>
            <footer className="text-center py-4 text-muted-foreground text-sm">
                <p>✨ Hecho con magia e IA ✨</p>
            </footer>
        </div>
    );
}
