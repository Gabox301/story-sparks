"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    LoaderCircle,
    Wand2,
    PlayCircle,
    PauseCircle,
} from "lucide-react";
import StorySkeleton from "@/components/story-skeleton";

import { useStoryStore } from "@/hooks/use-story-store";
import type { Story } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { extendStoryAction } from "@/app/actions";
import { useTTS } from "@/hooks/use-tts";

import Image from "next/image";

/**
 * Componente de página para mostrar los detalles de una historia.
 * Permite visualizar el contenido de una historia, extenderla y escuchar una narración de audio.
 */
export default function StoryPage() {
    // Extrae el ID de los parámetros de la URL.
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // Hooks personalizados para la gestión del estado de la historia y la síntesis de voz.
    const { getStory, updateStory } = useStoryStore();
    const [story, setStory] = useState<Story | null>(null);

    // Estados para la interfaz de usuario y la lógica de la aplicación.
    const [isLoading, setIsLoading] = useState(true);
    const [isExtending, setIsExtending] = useState(false);
    const [extensionPrompt, setExtensionPrompt] = useState("");




    // Hook para la generación y control de la síntesis de voz.
    const { isSpeaking, isPaused, speak, cancelSpeech, pause, resume } = useTTS();

    // Hooks de Next.js para la navegación y las notificaciones toast.
    const router = useRouter();
    const { toast } = useToast();

    /**
     * Carga la historia cuando el ID de la URL cambia.
     */
    useEffect(() => {
        if (!id) return;

        const foundStory = getStory(id);
        if (foundStory) {
            setStory(foundStory);
            setIsLoading(false);
        } else {
            // Si la historia no se encuentra, espera un poco y luego redirige.
            const timer = setTimeout(() => {
                if (!getStory(id)) {
                    router.push("/");
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [id, getStory, router]);

    /**
     * Maneja el inicio y la detención de la narración de audio.
     * Si el audio está reproduciéndose, lo cancela.
     * Si no hay audio reproduciéndose, inicia la generación y reproducción del audio del contenido del cuento.
     * Muestra un modal de procesamiento mientras se genera el audio y maneja los errores con notificaciones toast.
     */
    const handleToggleNarration = async () => {
        if (!story || !story.content.trim()) return;

        if (isSpeaking && !isPaused) {
            pause();
        } else if (isSpeaking && isPaused) {
            resume();
        } else {
            try {
                await speak(cleanStoryContent(story.content));
            } catch (error) {
                console.error("Error al generar el audio:", error);
                toast({
                    variant: "destructive",
                    title: "Error de audio",
                    description: "No se pudo generar el audio del cuento.",
                });
            }
        }
    };

    /**
     * Gestiona el proceso de extensión de la historia.
     */
    const handleExtendStory = async () => {
        if (!story || !extensionPrompt.trim()) return;

        setIsExtending(true);
        const result = await extendStoryAction({
            existingStory: story.content,
            userInput: extensionPrompt,
        });
        setIsExtending(false);

        if (result.success && result.data) {
            const newStorySection = result.data.newStorySection;
            const updatedContent = `${story.content}\n\n${newStorySection}`;
            updateStory(story.id, { content: updatedContent });
            setStory((prev) =>
                prev ? { ...prev, content: updatedContent } : null
            );
            setExtensionPrompt("");
            toast({
                title: "¡Cuento extendido!",
                description: "¡La aventura continúa!",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error al extender el cuento",
                description: result.error,
            });
        }
    };

    // Muestra un esqueleto de carga mientras la historia se está cargando.
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <Button asChild variant="ghost" className="mb-8">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Inicio
                        </Link>
                    </Button>
                    <div className="bg-card p-6 sm:p-8 lg:p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
                        <StorySkeleton />
                    </div>
                </div>
            </div>
        );
    }

    // Si no se encuentra la historia después de la carga, no renderiza nada.
    if (!story) {
        return null;
    }

    /**
     * Limpia el contenido del cuento eliminando caracteres especiales como # y *.
     * @param content El contenido original del cuento.
     * @returns El contenido del cuento limpio.
     */
    const cleanStoryContent = (content: string) => {
        return content.replace(/[#*]/g, "");
    };

    // Renderiza el contenido de la historia una vez cargada.
    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Botón para volver a la página de inicio */}
                <Button asChild variant="ghost" className="mb-8">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Inicio
                    </Link>
                </Button>

                {/* Contenedor principal de la historia */}
                <article className="bg-card p-6 sm:p-8 lg:p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
                    {/* Encabezado de la historia */}
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">
                            {story.title}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Un cuento épico de {story.theme.toLowerCase()}
                        </p>
                    </header>

                    {/* Sección de la imagen de la historia */}
                    <div className="relative w-full">
                        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/7] lg:aspect-[16/6] my-8">
                            <Image
                                src={
                                    story.imageUrl ||
                                    "https://placehold.co/1200x675.png"
                                }
                                alt={`Ilustración para ${story.title}`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw"
                                className="rounded-md object-cover"
                                priority
                            />
                            {/* Botón para escuchar el cuento superpuesto en la imagen */}
                            <div className="absolute bottom-4 right-4">
                                <Button
                                    onClick={handleToggleNarration}
                                    disabled={!story.content.trim()}
                                    className="text-lg px-6 py-3"
                                >
                                    {isSpeaking && !isPaused ? (
                                        <PauseCircle className="mr-2 h-5 w-5" />
                                    ) : (
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                    )}
                                    {isSpeaking && !isPaused
                                         ? "Pausar"
                                         : isSpeaking && isPaused
                                         ? "Reanudar"
                                         : "Escuchar"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Contenido del cuento */}
                    <div className="prose prose-lg dark:prose-invert max-w-none text-justify leading-relaxed whitespace-pre-wrap">
                        {cleanStoryContent(story.content)}
                    </div>



                    {/* Sección para extender el cuento */}
                    <section className="mt-8">
                        <h2 className="text-2xl font-bold mb-4 text-center">
                            Extender el Cuento
                        </h2>
                        <Textarea
                            placeholder="¿Qué debería pasar después? Por ejemplo: 'La rana René encuentra un mapa del tesoro.'"
                            value={extensionPrompt}
                            onChange={(e) => setExtensionPrompt(e.target.value)}
                            rows={4}
                            className="mb-4"
                        />
                        <div className="flex justify-center">
                            <Button
                                onClick={handleExtendStory}
                                disabled={isExtending || !extensionPrompt.trim()}
                                className="w-full sm:w-auto"
                            >
                                {isExtending ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                Extender Cuento
                            </Button>
                        </div>
                    </section>


                </article>


            </div>
        </div>
    );
}
