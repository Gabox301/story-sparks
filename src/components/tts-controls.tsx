"use client";

import { useTTS } from "@/hooks/use-tts";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TTSControlsProps {
    /** Texto a reproducir */
    text: string;
    /** Clases CSS adicionales */
    className?: string;
    /** Tamaño de los iconos */
    iconSize?: number;
    /** Mostrar selector de voz */
    showVoiceSelector?: boolean;
    /** Variante del botón */
    variant?: "default" | "outline" | "ghost" | "secondary";
    /** Tamaño del botón */
    size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Componente de controles TTS para reproducir texto
 * Incluye botón play/pause y selector de voz
 */
export default function TTSControls({
    text,
    className,
    iconSize = 16,
    showVoiceSelector = false,
    variant = "outline",
    size = "sm",
}: TTSControlsProps) {
    const { speak, isInitialized, isSpeaking, isPaused, pause, resume, voices, currentVoice, error } =
        useTTS();

    const [isHovered, setIsHovered] = useState(false);

    const handlePlayPause = () => {
        if (isSpeaking && !isPaused) {
            pause();
        } else if (isSpeaking && isPaused) {
            resume();
        } else {
            speak(text);
        }
    };

    if (!isInitialized) {
        return (
            <Button
                variant={variant}
                size={size}
                disabled
                className={cn("opacity-50", className)}
                title="Síntesis de voz no disponible"
            >
                <Volume2 className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant={variant}
                size={size}
                onClick={handlePlayPause}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={!isInitialized || !text.trim() || !!error}
                className={cn(
                    "transition-all duration-200",
                    isSpeaking &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    isHovered && "scale-105"
                )}
                title={isSpeaking && !isPaused ? "Pausar lectura" : isSpeaking && isPaused ? "Reanudar lectura" : "Escuchar cuento"}
            >
                {isSpeaking && !isPaused ? (
                    <Pause className={`h-${iconSize} w-${iconSize}`} />
                ) : (
                    <Play className={`h-${iconSize} w-${iconSize}`} />
                )}
            </Button>

            {error && (
                <div className="text-sm text-red-500" title={error}>
                    ⚠️ Error TTS
                </div>
            )}

            {!isInitialized && !error && (
                <div className="text-sm text-gray-500">🔄 Inicializando...</div>
            )}
        </div>
    );
}
