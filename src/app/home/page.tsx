"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/route-guard";
import StoryGeneratorForm from "@/components/story-generator-form";
import SavedStoriesList from "@/components/saved-stories-list";
import type { Story } from "@/lib/types";
import { useDatabaseStoryStore as useStoryStore } from "@/hooks/use-database-story-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SparklesText } from "@/components/ui/sparkles-text";
import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text";

/**
 * Componente principal de la página de inicio de la aplicación Story Sparks.
 * Permite a los usuarios generar nuevas historias, ver historias guardadas,
 * gestionar el almacenamiento local y alternar el tema de la aplicación.
 * @returns {JSX.Element} El componente de la página de inicio.
 */
export default function HomePage() {
    const { toast } = useToast();
    const {
        stories,
        loading,
        error,
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

    /**
     * Hook de efecto para gestionar las estadísticas de almacenamiento y los eventos de cuota excedida.
     * Se ejecuta cuando cambian las historias o la función `getStorageStats`.
     */
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

    /**
     * Manejador para el evento de historia generada.
     * La historia ya se crea en la base de datos a través de generateStoryAction,
     * y el hook useDatabaseStoryStore se actualizará automáticamente.
     * Solo necesitamos redirigir al usuario a la nueva historia.
     * @param {Story} story - La historia generada con ID ya asignado.
     */
    const handleStoryGenerated = (story: Story) => {
        // Redirigir a la página de la nueva historia
        router.push(`/stories/${story.id}`);
    };

    /**
     * Maneja la acción de compartir el enlace de la aplicación.
     * Copia la URL actual al portapapeles y notifica al usuario.
     */
    const handleShareApp = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Enlace copiado",
                description:
                    "El enlace de la aplicación ha sido copiado al portapapeles.",
            });
        } catch (err) {
            console.error("Error al copiar el enlace: ", err);
            toast({
                title: "Error al copiar",
                description: "No se pudo copiar el enlace al portapapeles.",
                variant: "destructive",
            });
        }
    };

    const isStorageFull =
        storageStats.storageUsed.includes("100%") ||
        (storageStats.sizeInKB > 0 && storageStats.sizeInKB >= 81920); // Asumiendo un límite de 80MB para localStorage

    return (
        <RouteGuard requireAuth={true}>
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
                    <div className="flex justify-center mt-4">
                        <ThemeToggle />
                    </div>
                </header>
                <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
                    <div className="flex justify-center">
                        <div className="space-y-4 animate-slide-in-left max-w-2xl w-full">
                            <div className="text-center">
                                <SparklesText
                                    text="Crea Cuentos Mágicos en Segundos"
                                    className="text-3xl font-headline font-bold text-foreground"
                                />
                                <p className="text-lg text-black mt-2">
                                    Elige un tema, crea un personaje y deja que
                                    nuestra IA dé vida a tu imaginación.
                                    ¡Perfecto para cuentos antes de dormir y
                                    jóvenes lectores!
                                </p>
                            </div>
                        {error && (
                            <Alert variant="destructive">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <AlertTitle>
                                    Error al cargar historias
                                </AlertTitle>
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                        {isStorageFull && (
                            <Alert variant="destructive">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <AlertTitle>
                                    ¡Límite de historias alcanzado!
                                </AlertTitle>
                                <AlertDescription>
                                    Has alcanzado el límite de historias guardadas.
                                    Por favor, elimina algunas historias antiguas
                                    para crear nuevas.
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
                        onShareApp={handleShareApp}
                        toast={toast}
                    />
                </main>
                <footer className="text-center py-4 text-black text-sm">
                    <VaporizeTextCycle
                        texts={["✨ Hecho con magia e IA ✨"]}
                        font={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "20px",
                            fontWeight: 400,
                        }}
                        color="rgb(0, 0, 0)"
                        spread={3}
                        density={3}
                        animation={{
                            vaporizeDuration: 2,
                            fadeInDuration: 1,
                            waitDuration: 0.5,
                        }}
                        direction="left-to-right"
                        alignment="center"
                        tag={Tag.P}
                    />
                </footer>
            </div>
        </RouteGuard>
    );
}
