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
import {
    extendStoryAction,
    textToSpeechAction,
    deleteAudioCacheAction,
} from "@/app/actions";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function StoryPage({
    params: paramsProp,
}: {
    params: { id: string };
}) {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { getStory, updateStory } = useStoryStore();
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasExtended, setHasExtended] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [extensionPrompt, setExtensionPrompt] = useState("");
    const [isNarrating, setIsNarrating] = useState(false);
    const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [isSpeechGenerationFinished, setIsSpeechGenerationFinished] =
        useState(false);
    const [isAudioForExtendedStory, setIsAudioForExtendedStory] =
        useState(false);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [lastSpeechGenerationTime, setLastSpeechGenerationTime] =
        useState<number>(0);
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
    const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showCooldownModal, setShowCooldownModal] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

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
            } else {
                const timer = setTimeout(() => {
                    if (!getStory(id)) {
                        router.push("/");
                    }
                }, 500);
                return () => clearTimeout(timer);
            }
            setIsLoading(false);
        }
    }, [id, getStory, router]);

    const handleExtendStory = async () => {
        if (!story || !extensionPrompt.trim() || hasExtended) return;
        setIsExtending(true);
        const oldStoryContent = story.content; // Capturar el contenido original antes de la extensión
        const result = await extendStoryAction({
            existingStory: oldStoryContent,
            userInput: extensionPrompt,
        });
        setIsExtending(false);

        if (result.success && result.data) {
            const newStorySection = result.data.newStorySection;
            const updatedContent = `${story.content}\n\n${newStorySection}`;
            const newExtendedCount = (story.extendedCount || 0) + 1;
            updateStory(story.id, {
                content: updatedContent,
                extendedCount: newExtendedCount,
            });
            setStory((prev) =>
                prev
                    ? {
                          ...prev,
                          content: updatedContent,
                          extendedCount: newExtendedCount,
                      }
                    : null
            );
            setExtensionPrompt("");
            setAudioSrc(null);
            setIsAudioForExtendedStory(true); // Marcar que el audio es para un cuento extendido
            setHasExtended(true);
            // Eliminar el audio anterior del caché si existía
            if (oldStoryContent) {
                await deleteAudioCacheAction(oldStoryContent);
            }
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

    const handleToggleNarration = async () => {
        if (!story) return;

        if (isNarrating && audioRef.current) {
            audioRef.current.pause();
            setIsNarrating(false);
            return;
        }

        if (audioSrc && audioRef.current) {
            audioRef.current.play();
            setIsNarrating(true);
            return;
        }

        setIsGeneratingSpeech(true);
        setShowProcessingModal(true);
        setIsSpeechGenerationFinished(false); // Reiniciar el estado de finalización

        const result = await textToSpeechAction({ text: story.content });

        if (result.success && result.data) {
            setAudioSrc(result.data.audioDataUri);
            setIsNarrating(true);
            setIsSpeechGenerationFinished(true); // Marcar como finalizado solo si es exitoso
        } else {
            toast({
                variant: "destructive",
                title: "Error en la narración",
                description: result.error,
            });
            setIsSpeechGenerationFinished(false); // Asegurarse de que no se marque como finalizado si hay error
        }

        setIsGeneratingSpeech(false);
        setShowProcessingModal(false);
        setIsAudioForExtendedStory(false); // Resetear el estado después de la generación
    };

    useEffect(() => {
        if (audioSrc && audioRef.current) {
            audioRef.current.play();
        }
    }, [audioSrc]);

    useEffect(() => {
        if (cooldownRemaining > 0) {
            cooldownTimerRef.current = setInterval(() => {
                setCooldownRemaining((prev) => {
                    if (prev <= 1000) {
                        clearInterval(cooldownTimerRef.current!); // Clear interval when cooldown ends
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

    if (!story) {
        return null;
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
                            {story.title}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Un cuento épico de {story.theme.toLowerCase()}
                        </p>
                    </header>

                    <div className="relative w-full">
                        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/7] lg:aspect-[16/6] my-8">
                            <Image
                                src={
                                    story.imageUrl ||
                                    `https://placehold.co/1200x675.png`
                                }
                                alt={`Ilustración para ${story.title}`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw"
                                data-ai-hint={
                                    !story.imageUrl
                                        ? `${story.theme} fantasía`
                                        : undefined
                                }
                                className="rounded-md object-cover"
                                priority
                            />
                        </div>
                        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
                            <Button
                                onClick={handleToggleNarration}
                                disabled={isGeneratingSpeech}
                                size="lg"
                                className="rounded-full shadow-lg text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                            >
                                {isGeneratingSpeech ? (
                                    <>
                                        <span className="ml-1">
                                            Preparando...
                                        </span>
                                    </>
                                ) : isNarrating ? (
                                    <>
                                        <PauseCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="ml-1">Pausar</span>
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="ml-1">Escuchar</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {audioSrc && (
                        <audio
                            ref={audioRef}
                            src={audioSrc}
                            onEnded={() => setIsNarrating(false)}
                        />
                    )}

                    <div className="prose prose-lg max-w-none text-foreground text-xl leading-relaxed whitespace-pre-wrap font-body">
                        {cleanStoryText(story.content)}
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
                                <p className="text-center text-sm text-muted-foreground mt-4">
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
                onOpenChange={setShowProcessingModal}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isAudioForExtendedStory
                                ? "Generando audio para cuento extendido..."
                                : "Generando audio..."}
                        </DialogTitle>
                        <DialogDescription>
                            {isAudioForExtendedStory
                                ? "Estamos creando la narración para la nueva sección de tu cuento. Esto puede tardar un momento."
                                : "Estamos creando la narración de tu cuento. Esto puede tardar un momento."}
                        </DialogDescription>
                    </DialogHeader>
                    <StoryProgress
                        isLoading={isGeneratingSpeech}
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
        </div>
    );
}
