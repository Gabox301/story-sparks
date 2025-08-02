import EasySpeech from "easy-speech";

/**
 * Inicializa EasySpeech y carga las voces disponibles.
 * @returns Una promesa que resuelve a un array de SpeechSynthesisVoice si la inicialización es exitosa.
 * @throws Error si la inicialización falla o no hay voces disponibles.
 */
export async function initializeEasySpeech(): Promise<SpeechSynthesisVoice[]> {
    try {
        console.log("Inicializando EasySpeech...");
        await EasySpeech.init({ maxTimeout: 5000, interval: 250 });

        const availableVoices = EasySpeech.voices();
        console.log("Voces disponibles:", availableVoices.length);

        if (availableVoices.length === 0) {
            throw new Error(
                "No hay voces disponibles para la síntesis de voz."
            );
        }

        return availableVoices;
    } catch (error) {
        console.error("Error al inicializar EasySpeech:", error);
        throw new Error(`Error de inicialización de TTS: ${error}`);
    }
}

/**
 * Selecciona una voz adecuada para la síntesis de voz, priorizando las voces en español.
 * La lógica de selección es la siguiente:
 * 1. Voces de Google en español de España (es-ES).
 * 2. Voces de Google en español de Estados Unidos (es-US).
 * 3. Cualquier voz genérica en español de España (es-ES) o Estados Unidos (es-US).
 * 4. Cualquier voz que comience con 'es-'.
 * 5. Si no se encuentra ninguna de las anteriores, se devuelve la primera voz disponible en el sistema.
 * @param voices Array de voces disponibles.
 * @returns La voz seleccionada o `undefined` si no se encuentra ninguna.
 */
export function selectVoice(
    voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
    // Priorizar voces en español de España (es-ES)
    const spanishESVoice = voices.find(
        (voice) => voice.lang === "es-ES" && voice.name.includes("Google")
    );
    if (spanishESVoice) return spanishESVoice;

    // Luego, voces en español de Estados Unidos (es-US)
    const spanishUSVoice = voices.find(
        (voice) => voice.lang === "es-US" && voice.name.includes("Google")
    );
    if (spanishUSVoice) return spanishUSVoice;

    // Si no se encuentran voces de Google específicas, buscar cualquier voz es-ES o es-US
    const genericSpanishVoice = voices.find(
        (voice) => voice.lang === "es-ES" || voice.lang === "es-US"
    );
    if (genericSpanishVoice) return genericSpanishVoice;

    // Como último recurso, buscar cualquier voz que comience con 'es-'
    const anySpanishVoice = voices.find((voice) =>
        voice.lang.startsWith("es-")
    );
    if (anySpanishVoice) return anySpanishVoice;

    // Si no se encuentra ninguna voz en español, devolver la primera voz disponible
    return voices[0];
}

/**
 * Realiza la síntesis de voz de un texto dado.
 * @param text El texto a convertir en voz.
 * @param voice La voz a utilizar para la síntesis.
 * @returns Una promesa que resuelve cuando la síntesis ha terminado.
 * @throws Error si la síntesis falla.
 */
export function speakText(
    text: string,
    voice: SpeechSynthesisVoice,
    onStart?: () => void,
    onEnd?: () => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!text || !text.trim()) {
            return reject(
                new Error("El texto para la síntesis de voz está vacío.")
            );
        }

        EasySpeech.speak({
            text: text,
            voice: voice,
            pitch: 1,
            rate: 1.2,
            volume: 1,
            start: () => {
                onStart?.();
                resolve(); // Resuelve la promesa cuando el audio realmente comienza
            },
            end: () => {
                onEnd?.();
            },
            error: (e: any) => {
                console.error("Error en la síntesis de voz:", e);
                reject(
                    new Error(
                        `Error en la síntesis de voz: ${
                            e.error || "Error desconocido"
                        }`
                    )
                );
            },
        });
    });
}

/**
 * Cancela cualquier síntesis de voz en curso.
 */
export function cancelSpeech(): void {
    EasySpeech.cancel();
}

/**
 * Pausa la síntesis de voz en curso.
 */
export function pauseSpeech(): void {
    EasySpeech.pause();
}

/**
 * Reanuda la síntesis de voz pausada.
 */
export function resumeSpeech(): void {
    EasySpeech.resume();
}
