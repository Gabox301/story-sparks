"use client";

import Link from "next/link";
import { cleanStoryText } from "@/lib/utils";
import { BookOpen, Trash2, Download, AlertCircle, Star } from "lucide-react";
import type { Story } from "@/lib/types";

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
    onToggleFavorite?: (id: string) => void;
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
                <h2 className="text-3xl font-bold font-headline text-foreground">
                    Mis Cuentos Guardados
                </h2>

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
                                    onClick={onExport}
                                    className="flex items-center gap-1"
                                    disabled={true}
                                >
                                    <Download className="h-4 w-4" />
                                    Exportar
                                </Button>
                                <span className="text-xs text-muted-foreground mt-1">
                                    Próximamente
                                </span>
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
                                    <CardTitle className="font-headline truncate">
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
                                {cleanStoryText(story.content)}
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button asChild variant="outline">
                                <Link href={`/stories/${story.id}`}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Leer Cuento
                                </Link>
                            </Button>
                            <div className="flex gap-1">
                                {onToggleFavorite && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            onToggleFavorite(story.id)
                                        }
                                        className={
                                            story.favorite
                                                ? "text-yellow-500 hover:text-yellow-600"
                                                : "text-muted-foreground hover:text-yellow-500"
                                        }
                                    >
                                        <Star
                                            className={`h-5 w-5 ${
                                                story.favorite
                                                    ? "fill-current"
                                                    : ""
                                            }`}
                                        />
                                    </Button>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                ¿Estás seguro?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esto eliminará permanentemente "
                                                {story.title}". Esta acción no
                                                se puede deshacer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancelar
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    onDelete(story.id)
                                                }
                                                className="bg-destructive hover:bg-destructive/90"
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
