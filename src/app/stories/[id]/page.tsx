"use client";

import React, { useState, useEffect, useRef } from "react";
import StoryProgress from "@/components/story-progress";
import { cleanStoryText } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wand2, PlayCircle, PauseCircle } from "lucide-react";
import StorySkeleton from "@/components/story-skeleton";
import { useStoryStore } from "@/hooks/use-story-store";
import type { Story } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MemoryGame from "@/components/memory-game";
import { extendStoryAction, textToSpeechAction } from "@/app/actions";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function StoryPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { getStory, updateStory } = useStoryStore();
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasExtended, setHasExtended] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [extensionPrompt, setExtensionPrompt] = useState("");
    const [isNarrating, setIsNarrating] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [isSpeechGenerationFinished, setIsSpeechGenerationFinished] =
        useState(false);
    const [showMemoryGame, setShowMemoryGame] = useState(false);
    const [isAudioForExtendedStory, setIsAudioForExtendedStory] =
        useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [lastSpeechGenerationTime, setLastSpeechGenerationTime] =
        useState<number>(0);
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
    const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showCooldownModal, setShowCooldownModal] = useState(false);
    const [previousStoryContent, setPreviousStoryContent] = useState<
        string | null
    >(null);
    const [showImageModal, setShowImageModal] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    // Función para cargar el cuento desde la API cuando no está en el store local
    const fetchStoryFromAPI = async (storyId: string) => {
        try {
            console.log(`🌐 Cargando cuento ${storyId} desde la API...`);

            const response = await fetch(`/api/stories/${storyId}`);

            if (response.ok) {
                const data = await response.json();

                if (data.success && data.data.story) {
                    console.log("✅ Cuento cargado desde la API");
                    const apiStory = data.data.story;

                    // Convertir el formato de API al formato del store local
                    const storyForStore: Story = {
                        id: apiStory.id,
                        title: apiStory.title,
                        content: apiStory.content,
                        theme: apiStory.theme,
                        mainCharacterName: apiStory.mainCharacterName,
                        mainCharacterTraits: apiStory.mainCharacterTraits,
                        imageUrl: apiStory.imageUrl,
                        createdAt: apiStory.createdAt,
                        favorite: apiStory.favorite || false,
                        extendedCount: apiStory.extendedCount || 0,
                        isGeneratingSpeech: false,
                        audioSrc: apiStory.audioUrl || null,
                    };

                    setStory(storyForStore);
                    setHasExtended(
                        !!storyForStore.extendedCount &&
                            storyForStore.extendedCount >= 1
                    );
                } else {
                    console.error("❌ Respuesta de API inválida:", data);
                    throw new Error("Respuesta inválida del servidor");
                }
            } else if (response.status === 404) {
                console.error("❌ Cuento no encontrado (404)");
                toast({
                    variant: "destructive",
                    title: "Cuento no encontrado",
                    description:
                        "El cuento que buscas no existe o no tienes permisos para verlo.",
                });
                router.push("/");
                return;
            } else {
                throw new Error(`Error HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error("❌ Error cargando cuento desde API:", error);
            toast({
                variant: "destructive",
                title: "Error al cargar el cuento",
                description:
                    "No se pudo cargar el cuento. Por favor, inténtalo de nuevo.",
            });
            router.push("/");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedTime = localStorage.getItem("lastSpeechGenerationTime");
        if (storedTime) {
            setLastSpeechGenerationTime(parseInt(storedTime, 10));
        }
    }, []);

    useEffect(() => {
        if (id) {
            const foundStory = getStory(id);
            if (foundStory) {
                setStory(foundStory);
                setHasExtended(
                    !!foundStory.extendedCount && foundStory.extendedCount >= 1
                );
                setIsLoading(false);
            } else {
                // Si no está en el store local, intentar cargarlo desde la API
                console.log(
                    "🔍 Cuento no encontrado en store local, buscando en API..."
                );
                fetchStoryFromAPI(id);
            }
        }
    }, [id, getStory, router]);

    // Efecto para sincronizar el estado local con los cambios del store
    useEffect(() => {
        if (id && story) {
            const foundStory = getStory(id);
            if (foundStory && foundStory !== story) {
                setStory(foundStory);
            }
        }
    }, [id, getStory, story]);

    const handleExtendStory = async () => {
        if (!story || !extensionPrompt.trim() || hasExtended) return;
        setIsExtending(true);
        const oldStoryContent = story.content;
        setPreviousStoryContent(oldStoryContent);
        const result = await extendStoryAction({
            existingStory: oldStoryContent,
            userInput: extensionPrompt,
            storyId: story.id,
        });
        setIsExtending(false);

        if (result.success && result.data) {
            const newStorySection = result.data.newStorySection;
            const updatedContent = `${story.content}\n\n${newStorySection}`;
            const newExtendedCount = (story.extendedCount || 0) + 1;
            updateStory(story.id, {
                content: updatedContent,
                extendedCount: newExtendedCount,
                audioSrc: null,
                isGeneratingSpeech: false,
            });
            setStory((prev) =>
                prev
                    ? {
                          ...prev,
                          content: updatedContent,
                          extendedCount: newExtendedCount,
                          audioSrc: null,
                          isGeneratingSpeech: false,
                      }
                    : null
            );
            setExtensionPrompt("");
            setIsAudioForExtendedStory(true);
            setHasExtended(true);
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

    /**
     * @function handleToggleNarration
     * @description Maneja la reproducción y pausa de la narración de la historia.
     *              Si el audio ya está reproduciéndose, lo pausa. Si está pausado, lo reanuda.
     *              Si no hay audio generado, inicia el proceso de generación y luego lo reproduce.
     */
    const handleToggleNarration = async () => {
        if (!story) return;

        // 🔒 PROTECCIÓN: Evitar múltiples peticiones de generación simultáneas
        if (story.isGeneratingSpeech) {
            console.log("⚠️ Generación ya en progreso, abriendo modal...");
            setShowProcessingModal(true);
            return;
        }

        if (audioRef.current) {
            if (!audioRef.current.paused && !audioRef.current.ended) {
                // Si está reproduciendo, pausar
                audioRef.current.pause();
                setIsNarrating(false);
                return;
            } else if (
                audioRef.current.src === story.audioSrc &&
                audioRef.current.currentTime > 0 &&
                !audioRef.current.ended
            ) {
                // Si está pausado, continuar desde donde quedó
                try {
                    await audioRef.current.play();
                    setIsNarrating(true);
                } catch (error) {
                    console.error("Error al reanudar el audio:", error);
                    toast({
                        variant: "destructive",
                        title: "Error de reproducción",
                        description:
                            "No se pudo reanudar el audio. Por favor, inténtalo de nuevo.",
                    });
                }
                return;
            }
        }

        // Si no hay audio reproduciéndose o pausado, intentar generar/reproducir
        if (story.audioSrc && audioRef.current) {
            // Si hay audio ya generado, reproducirlo desde el inicio
            audioRef.current.src = story.audioSrc;
            audioRef.current.currentTime = 0;
            try {
                await audioRef.current.play();
                setIsNarrating(true);
            } catch (error) {
                console.error(
                    "Error al reproducir el audio desde el inicio:",
                    error
                );
                toast({
                    variant: "destructive",
                    title: "Error de reproducción",
                    description:
                        "No se pudo reproducir el audio. Por favor, inténtalo de nuevo.",
                });
            }
            return;
        }

        // Si no hay audio generado, iniciar el proceso de generación
        updateStory(story.id, { isGeneratingSpeech: true });
        setShowProcessingModal(true);
        setIsSpeechGenerationFinished(false);
        setShowMemoryGame(true); // Mostrar el juego de memoria al iniciar la generación

        // Mostrar toast indicando que se está generando el audio
        toast({
            title: "🎵 Generando audio",
            description:
                "Estamos creando la narración de tu historia. Esto puede tardar unos momentos...",
        });

        // Cuando se genera un nuevo audio (ej. después de extender la historia),
        // se pasa `previousStoryContent` para que `textToSpeechAction` elimine el audio antiguo.
        console.log("🎵 Generando audio para cuento:", story.id);
        const result = await textToSpeechAction({
            text: story.content,
            previousText: previousStoryContent || undefined,
            storyId: story.id,
        });

        if (result.success && result.data) {
            updateStory(story.id, {
                audioSrc: result.data.audioUrl || result.data.audioDataUri,
                isGeneratingSpeech: false,
            });
            // No establecer isNarrating en true aquí, ya que la reproducción no ha comenzado automáticamente.
            setIsSpeechGenerationFinished(true);

            // Mostrar toast de éxito
            toast({
                title: "✅ ¡Audio listo!",
                description:
                    "La narración de tu historia se ha generado exitosamente. Presiona el botón de escuchar para sumergirte en tu aventura.",
            });
        } else if (!result.success) {
            toast({
                variant: "destructive",
                title: "❌ Error en la narración",
                description:
                    result.error ||
                    "No se pudo generar el audio. Por favor, inténtalo de nuevo más tarde.",
            });
            updateStory(story.id, { isGeneratingSpeech: false });
            setIsSpeechGenerationFinished(false);
        }

        // Solo cerrar el modal automáticamente si la generación fue exitosa
        // El mini-juego permanece disponible hasta que el usuario decida cerrarlo manualmente
        if (result.success) {
            setShowProcessingModal(false);
        }
        setIsAudioForExtendedStory(false);
        setPreviousStoryContent(null);
        // No ocultamos el mini-juego automáticamente - el usuario puede seguir jugando
    };

    // Eliminar reproducción automática al cargar el cuento
    /**
     * @function useEffect
     * @description Actualiza la fuente del audio cuando `story.audioSrc` cambia.
     *              También añade un listener para resetear el estado de narración cuando el audio termina.
     */
    useEffect(() => {
        const audio = audioRef.current;
        if (story?.audioSrc && audio) {
            audio.src = story.audioSrc;
        }

        if (audio) {
            const handleAudioEnded = () => {
                setIsNarrating(false);
            };
            audio.addEventListener("ended", handleAudioEnded);
            return () => {
                audio.removeEventListener("ended", handleAudioEnded);
            };
        }
    }, [story?.audioSrc]);

    useEffect(() => {
        if (cooldownRemaining > 0) {
            cooldownTimerRef.current = setInterval(() => {
                setCooldownRemaining((prev) => {
                    if (prev <= 1000) {
                        clearInterval(cooldownTimerRef.current!);
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
        } else if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
        }

        return () => {
            if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current);
            }
        };
    }, [cooldownRemaining]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

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

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Button asChild variant="ghost" className="mb-8">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Inicio
                    </Link>
                </Button>

                <article className="bg-card p-6 sm:p-8 lg:p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">
                            {story!.title}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Un cuento épico de {story!.theme.toLowerCase()}
                        </p>
                    </header>

                    <div className="relative w-full">
                        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/7] lg:aspect-[16/6] my-8">
                            <Image
                                src={
                                    story!.imageUrl ||
                                    "https://placehold.co/1200x675.png"
                                }
                                alt={`Ilustración para ${story!.title}`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw"
                                data-ai-hint={
                                    !story!.imageUrl
                                        ? `${story!.theme} fantasía`
                                        : undefined
                                }
                                className="rounded-md object-cover"
                                priority
                                id="story-image"
                            />
                            <Button
                                onClick={() => setShowImageModal(true)}
                                size="lg"
                                className="absolute left-2 bottom-2 sm:left-4 sm:bottom-4 rounded-full shadow-lg text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                                aria-label="Ver portada en pantalla completa"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                </svg>
                                <span className="ml-1">Ver Imagen</span>
                            </Button>
                        </div>

                        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
                            {/* Botón dinámico: Pausar, Reanudar o Escuchar */}
                            {story!.isGeneratingSpeech ? (
                                <Button
                                    onClick={() => {
                                        setShowProcessingModal(true);
                                        // El mini-juego se mantiene visible durante toda la generación
                                    }}
                                    size="lg"
                                    className="rounded-full shadow-lg text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                                    disabled={false}
                                >
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent mr-2"></div>
                                        <span>Generando...</span>
                                    </div>
                                </Button>
                            ) : audioRef.current &&
                              audioRef.current.paused &&
                              audioRef.current.currentTime > 0 &&
                              !audioRef.current.ended ? (
                                <Button
                                    onClick={() => {
                                        audioRef.current?.play();
                                        setIsNarrating(true);
                                    }}
                                    size="lg"
                                    className="rounded-full shadow-lg text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                                >
                                    <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="ml-1">Reanudar</span>
                                </Button>
                            ) : isNarrating ? (
                                <Button
                                    onClick={handleToggleNarration}
                                    size="lg"
                                    className="rounded-full shadow-lg text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                                >
                                    <PauseCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="ml-1">Pausar</span>
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleToggleNarration}
                                    size="lg"
                                    className="rounded-full shadow-lg text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                                >
                                    <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="ml-1">Escuchar</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {story!.audioSrc && (
                        <audio
                            ref={audioRef}
                            src={story!.audioSrc}
                            onEnded={() => setIsNarrating(false)}
                        />
                    )}

                    <div className="prose prose-lg max-w-none text-foreground text-xl leading-relaxed whitespace-pre-wrap font-body">
                        {cleanStoryText(story!.content || "")}
                    </div>

                    <Separator className="my-12" />

                    <section className="mt-12">
                        <h2 className="text-3xl font-bold font-headline text-center mb-4">
                            ¡Continúa la Aventura!
                        </h2>
                        <p className="text-center text-muted-foreground mb-6">
                            ¿Qué debería pasar ahora en la historia?
                        </p>
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <Textarea
                                placeholder={`Ej: "Aparece un dragón amigable..."`}
                                value={extensionPrompt}
                                onChange={(e) =>
                                    setExtensionPrompt(e.target.value)
                                }
                                className="min-h-[100px] text-base"
                            />
                            {hasExtended ? (
                                <p className="text-center text-sm text-red-500 mt-4">
                                    Ya has extendido este cuento una vez.
                                    ¡Disfruta de la aventura!
                                </p>
                            ) : (
                                <Button
                                    onClick={handleExtendStory}
                                    disabled={isExtending}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isExtending ? (
                                        <>Añadiendo un nuevo capítulo...</>
                                    ) : (
                                        <>
                                            <Wand2 />
                                            Extender Cuento
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </section>
                </article>
            </div>

            <Dialog
                open={showProcessingModal}
                onOpenChange={(open) => {
                    setShowProcessingModal(open);
                    // Solo permitir cerrar el modal si la generación ha terminado o si hay un error
                    if (
                        !open &&
                        story?.isGeneratingSpeech &&
                        !isSpeechGenerationFinished
                    ) {
                        // Si se intenta cerrar durante la generación, mantener el mini-juego visible
                        // pero permitir cerrar el modal
                        return;
                    }
                    // Si se cierra el modal después de que termine la generación, ocultar el mini-juego
                    if (
                        !open &&
                        (isSpeechGenerationFinished ||
                            !story?.isGeneratingSpeech)
                    ) {
                        setShowMemoryGame(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold text-foreground">
                            {showMemoryGame
                                ? "¡Mientras el hechizo de Audiomancia hace efecto, diviértete y encuentra los pares de cartas!"
                                : isSpeechGenerationFinished
                                ? "¡Audio listo!"
                                : "Generando audio..."}
                        </DialogTitle>
                        <DialogDescription className="text-center text-black">

                        </DialogDescription>
                        {(showMemoryGame || story?.isGeneratingSpeech) && (
                            <div className="mt-4">
                                <MemoryGame />
                            </div>
                        )}
                    </DialogHeader>
                    <StoryProgress
                        isLoading={story?.isGeneratingSpeech || false}
                        isFinished={isSpeechGenerationFinished}
                        messages={[
                            "Iniciando la síntesis de voz...",
                            "Procesando el texto...",
                            "Ajustando el tono y la entonación...",
                            "Generando las ondas de sonido...",
                            "Finalizando la narración...",
                        ]}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={showCooldownModal}
                onOpenChange={setShowCooldownModal}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-headline">
                            ¡Espera un momento!
                        </DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Para generar otro audio, por favor espera:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-4xl font-bold text-primary">
                            {formatTime(cooldownRemaining)}
                        </p>
                        <p className="mt-4 text-sm text-muted-foreground text-center">
                            Podrás generar un nuevo audio pronto.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="sr-only">
                            Imagen de la Historia
                        </DialogTitle>
                    </DialogHeader>
                    <Image
                        src={
                            story!.imageUrl ||
                            "https://placehold.co/1200x675.png"
                        }
                        alt={`Ilustración para ${story!.title}`}
                        width={1200}
                        height={675}
                        className="w-full h-auto object-contain"
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
