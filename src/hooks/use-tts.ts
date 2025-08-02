import { useState, useEffect, useCallback } from "react";
import { initializeEasySpeech, selectVoice, speakText, cancelSpeech, pauseSpeech, resumeSpeech } from "@/lib/tts-utils";

/**
 * Hook personalizado para manejar la síntesis de voz (TTS)
 * Utiliza la Web Speech API a través de Easy Speech
 *
 * @returns Objeto con funciones y estados para controlar TTS
 */
export const useTTS = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const availableVoices = await initializeEasySpeech();
                setVoices(availableVoices);

                const selected = selectVoice(availableVoices);
                setCurrentVoice(selected);
                setIsInitialized(true);
                setError(null);
            } catch (err: any) {
                console.error("Error al inicializar TTS en useTTS:", err);
                setError(err.message);
                setIsInitialized(false);
            }
        };

        init();
    }, []);

    /**
     * Función para reproducir texto
     * @param text - Texto a reproducir
     * @param voice - Voz específica (opcional)
     */
    const speak = useCallback(
        async (text: string, voice?: SpeechSynthesisVoice) => {
            if (!isInitialized || !currentVoice) {
                console.error("TTS no está inicializado o no hay voz seleccionada.");
                return;
            }

            if (!text || !text.trim()) {
                console.error("El texto para reproducir está vacío.");
                return;
            }

            setIsSpeaking(true);
            setIsPaused(false);
            try {
                await speakText(
                    text,
                    voice || currentVoice,
                    () => {
                        // onStart callback
                        setIsSpeaking(true);
                        setIsPaused(false);
                    },
                    () => {
                        // onEnd callback
                        setIsSpeaking(false);
                        setIsPaused(false);
                    }
                );
            } catch (err: any) {
                console.error("Error al reproducir texto:", err);
                setError(err.message);
                setIsSpeaking(false);
                setIsPaused(false);
            }
        },
        [isInitialized, currentVoice]
    );

    const pause = useCallback(() => {
        if (isSpeaking) {
            pauseSpeech();
            setIsPaused(true);
        }
    }, [isSpeaking]);

    const resume = useCallback(() => {
        if (isPaused) {
            resumeSpeech();
            setIsPaused(false);
        }
    }, [isPaused]);

    return {
        isInitialized,
        isSpeaking,
        isPaused,
        voices,
        currentVoice,
        error,
        speak,
        setCurrentVoice,
        cancelSpeech,
        pause,
        resume,
    };
};
