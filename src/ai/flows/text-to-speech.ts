"use server";

/**
 * @fileOverview Converts text to speech.
 *
 * - textToSpeech - A function that converts text to speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { initializeEasySpeech, selectVoice, speakText } from "@/lib/tts-utils";

let ttsInitialized = false;
let selectedVoice: SpeechSynthesisVoice | undefined;

const TextToSpeechInputSchema = z.object({
    text: z.string().describe("The text to convert to speech."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
    audioDataUri: z
        .string()
        .describe(
            "A data URI of the audio. Expected format: 'data:audio/wav;base64,<encoded_data>'."
        ),
});

export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
    input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
    return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
    {
        name: "textToSpeechFlow",
        inputSchema: TextToSpeechInputSchema,
        outputSchema: TextToSpeechOutputSchema,
    },
    async ({ text }) => {
        if (!ttsInitialized) {
            const voices = await initializeEasySpeech();
            selectedVoice = selectVoice(voices);
            ttsInitialized = true;
        }

        if (!selectedVoice) {
            throw new Error(
                "No se pudo seleccionar una voz para la síntesis de voz."
            );
        }

        // EasySpeech no devuelve un URI de datos de audio directamente, solo reproduce el audio.
        // Para mantener la compatibilidad con el tipo de retorno, devolveremos un URI de datos vacío
        // o un marcador de posición, ya que la reproducción se maneja en el cliente.
        // Si se necesita el audio real, se requeriría una implementación de grabación del lado del cliente.
        await speakText(text, selectedVoice);

        // Devolver un URI de datos vacío o un marcador de posición.
        // En una aplicación real, si el audio se reproduce en el cliente, es posible que no necesites
        // devolver un URI de datos desde el servidor para esta implementación específica.
        const audioDataUri = "data:audio/wav;base64,";

        return { audioDataUri };
    }
);
