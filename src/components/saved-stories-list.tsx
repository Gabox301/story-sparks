"use client";

import Link from "next/link";
import { cleanStoryText } from "@/lib/utils";
import { BookOpen, Trash2, Download, Star, Share2 } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import GradientButton from "@/components/ui/gradient-button";
import type { Story } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useStoryStore } from "@/hooks/use-story-store";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * @typedef {Object} SavedStoriesListProps
 * @property {Story[]} stories - Array de objetos de cuentos guardados.
 * @property {(id: string) => void} onDelete - Función para manejar la eliminación de un cuento.
 * @property {() => void} [onClearAll] - Función opcional para limpiar todos los cuentos.
 * @property {() => void} [onExport] - Función opcional para exportar cuentos.
 * @property {(id: string) => void} [onToggleFavorite] - Función opcional para alternar el estado de favorito de un cuento.
 */
type SavedStoriesListProps = {
    stories: Story[];
    onDelete: (id: string) => void;
    onClearAll?: () => void;
    onExport?: () => void;
    /**
     * Maneja la acción de compartir el enlace de la aplicación.
     * Copia la URL actual al portapapeles y notifica al usuario.
     */
    onShareApp?: () => void;
    onToggleFavorite?: (id: string) => void;
    toast: ReturnType<typeof import("@/hooks/use-toast").useToast>["toast"];
};

/**
 * Componente que muestra una lista de cuentos guardados.
 * Permite eliminar cuentos, limpiar todos los cuentos, exportar (próximamente) y marcar/desmarcar como favorito.
 * También muestra el estado actual del almacenamiento de cuentos.
 * @param {SavedStoriesListProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El componente de la lista de cuentos guardados.
 */
export default function SavedStoriesList({
    stories,
    onDelete,
    onClearAll,
    onExport,
    onToggleFavorite,
    onShareApp,
    toast,
}: SavedStoriesListProps) {
    const { getStorageStats, removeStory, toggleFavorite, MAX_STORIES } =
        useStoryStore();
    const [storageStats, setStorageStats] = useState<{
        storyCount: number;
        sizeInKB: number;
        maxStories: number;
        storageUsed: string;
    } | null>(null);

    useEffect(() => {
        const fetchStorageStats = async () => {
            const stats = await getStorageStats();
            setStorageStats({ ...stats, maxStories: MAX_STORIES });
        };
        fetchStorageStats();
    }, [getStorageStats, MAX_STORIES, stories]);
    if (stories.length === 0) {
        return (
            <div className="text-center py-16 px-8 mt-12 bg-card rounded-lg shadow-inner border-dashed border-2">
                <h3 className="text-2xl font-bold font-headline text-foreground">
                    Tu Libro de Cuentos está Vacío
                </h3>
                <p className="mt-2 text-muted-foreground">
                    ¡Crea tu primer cuento para verlo aquí!
                </p>
            </div>
        );
    }

    return (
        <div className="mt-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <SparklesText
                    text="Mis Cuentos Guardados"
                    className="text-3xl font-bold font-headline text-foreground"
                />

                {stories.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            <span
                                className={
                                    storageStats &&
                                    storageStats.storyCount >=
                                        storageStats.maxStories
                                        ? "text-red-500"
                                        : ""
                                }
                            >
                                {storageStats?.storyCount || 0}
                            </span>
                            /{storageStats?.maxStories || 0} cuentos
                        </div>
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onShareApp}
                                    className="flex items-center gap-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Compartir
                                </Button>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        disabled={!onClearAll}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Limpiar Todo
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            ¿Estás seguro de limpiar todos los
                                            cuentos?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción eliminará
                                            permanentemente todos tus cuentos
                                            guardados. Esta acción no se puede
                                            deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={onClearAll}
                                            className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                                        >
                                            Limpiar Todo
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                    <Card
                        key={story.id}
                        className="flex flex-col hover:shadow-xl transition-shadow duration-300"
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    {/* Ajuste para títulos largos: permite que el texto se ajuste y rompa palabras si es necesario. */}
                                    <CardTitle className="font-headline text-xl text-wrap break-words">
                                        {story.title}
                                    </CardTitle>
                                    <CardDescription>
                                        Un cuento de {story.theme.toLowerCase()}{" "}
                                        sobre {story.mainCharacterName}.
                                    </CardDescription>
                                </div>
                                {story.favorite && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                        Favorito
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground line-clamp-3">
                                {cleanStoryText(story.content || "")}
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center pt-4">
                            <Link href={`/stories/${story.id}`}>
                                <GradientButton
                                    title="Leer"
                                    icon={<BookOpen className="h-4 w-4" />}
                                    gradientFrom="#a955ff"
                                    gradientTo="#ea51ff"
                                />
                            </Link>
                            <div className="flex gap-2">
                                <GradientButton
                                    title="Descargar"
                                    icon={<Download className="h-4 w-4" />}
                                    gradientFrom="#66F863"
                                    gradientTo="#0DC809"
                                    onClick={() =>
                                        toast({
                                            title: "Magia en estudio",
                                            description:
                                                "Esta magia está siendo estudiada, próximamente podremos usar el hechizo correcto.",
                                        })
                                    }
                                />
                                <GradientButton
                                    title="Favorito"
                                    icon={
                                        <Star
                                            className={
                                                story.favorite
                                                    ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                                                    : "h-4 w-4 text-muted-foreground"
                                            }
                                        />
                                    }
                                    gradientFrom="#F3F863"
                                    gradientTo="#ECF40B"
                                    onClick={() =>
                                        onToggleFavorite &&
                                        onToggleFavorite(story.id)
                                    }
                                />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <GradientButton
                                            title="Eliminar"
                                            icon={
                                                <Trash2 className="h-4 w-4" />
                                            }
                                            gradientFrom="#F86363"
                                            gradientTo="#F40B0B"
                                        />
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                ¿Estás seguro de eliminar este
                                                cuento?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará
                                                permanentemente este cuento
                                                guardado. Esta acción no se
                                                puede deshacer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancelar
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    removeStory(story.id)
                                                }
                                                className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                                            >
                                                Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
