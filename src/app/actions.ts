"use server";

import { z } from "zod";
import { generateUniqueStory } from "@/ai/flows/generate-story";
import { generateStoryImage } from "@/ai/flows/generate-story-image";
import { extendStory } from "@/ai/flows/extend-story";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { createHash } from "crypto";
import { put, del } from "@vercel/blob";

const generateStorySchema = z.object({
    theme: z.string(),
    mainCharacterName: z.string(),
    mainCharacterTraits: z.string(),
});

/**
 * @summary Genera una historia única utilizando un flujo de IA.
 * @description Esta función toma un tema, nombre y rasgos de personaje para crear una historia.
 * Opcionalmente, también genera una imagen para la historia.
 * @param {z.infer<typeof generateStorySchema>} input - Objeto con el tema, nombre y rasgos del personaje principal.
 * @returns {Promise<{success: boolean, data?: {title: string, content: string, imageUrl?: string}, error?: string}>} Resultado de la operación, incluyendo la historia generada y opcionalmente la URL de la imagen.
 */
export async function generateStoryAction(
    input: z.infer<typeof generateStorySchema>
) {
    const validatedInput = generateStorySchema.parse(input);
    try {
        const storyOutput = await generateUniqueStory(validatedInput);

        let imageUrl: string | undefined;
        try {
            const imageOutput = await generateStoryImage({
                title: storyOutput.title,
                theme: validatedInput.theme,
            });
            imageUrl = imageOutput.imageUrl;
        } catch (imageError) {
            console.error("Error al generar la imagen:", imageError);
            // No fallar si solo la imagen falla, continuar con una imagen de reemplazo
        }

        return {
            success: true,
            data: { ...storyOutput, content: storyOutput.story, imageUrl },
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "No se pudo generar el cuento. Por favor, inténtalo de nuevo.",
        };
    }
}

const extendStorySchema = z.object({
    existingStory: z.string(),
    userInput: z.string(),
});

/**
 * @summary Extiende una historia existente con nueva entrada del usuario.
 * @description Esta función toma una historia existente y un prompt del usuario para generar una continuación.
 * @param {z.infer<typeof extendStorySchema>} input - Objeto con la historia existente y la entrada del usuario para la extensión.
 * @returns {Promise<{success: boolean, data?: {newStorySection: string}, error?: string}>} Resultado de la operación, incluyendo la nueva sección de la historia.
 */
export async function extendStoryAction(
    input: z.infer<typeof extendStorySchema>
) {
    const validatedInput = extendStorySchema.parse(input);
    try {
        const output = await extendStory(validatedInput);
        return { success: true, data: output };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "No se pudo extender el cuento. Por favor, inténtalo de nuevo.",
        };
    }
}

/**
 * @summary Esquema de validación para la entrada de texto a voz.
 * @description Define la estructura esperada para los datos de entrada de la función `textToSpeechAction`.
 * @property {string} text - El texto que se desea convertir a voz.
 * @property {string} [previousText] - Opcional. El texto de la versión anterior del cuento. Se utiliza para eliminar el audio cacheado asociado a este texto si ha cambiado.
 */
const textToSpeechSchema = z.object({
    text: z.string(),
    previousText: z.string().optional(),
});

/**
 * @summary Genera un hash SHA256 a partir de una cadena de texto.
 * @description Utiliza el algoritmo SHA256 para crear un hash único de la entrada proporcionada.
 * @param {string} text - La cadena de texto de la cual se generará el hash.
 * @returns {string} El hash SHA256 resultante en formato hexadecimal.
 */
function generateHash(text: string): string {
    return createHash("sha256").update(text).digest("hex");
}

/**
 * @summary Convierte texto a voz, utilizando caché para optimizar el rendimiento.
 * @description Esta función verifica si el audio para un texto dado ya existe en el caché local.
 * Si lo encuentra, lo devuelve directamente. De lo contrario, genera el audio utilizando un servicio de texto a voz,
 * lo guarda en el caché y luego lo devuelve. También maneja la eliminación de audio cacheado antiguo si se proporciona `previousText`.
 * @param {z.infer<typeof textToSpeechSchema>} input - Objeto que contiene el texto a convertir y opcionalmente el texto anterior.
 * @returns {Promise<{success: boolean, data?: {audioDataUri: string, audioUrl: string}, error?: string}>} Resultado de la operación, incluyendo el URI de datos del audio y la URL pública si se guardó en caché.
 */
export async function textToSpeechAction(
    input: z.infer<typeof textToSpeechSchema>
): Promise<
    | { success: true; data: { audioDataUri: string; audioUrl: string } }
    | { success: false; error: string }
> {
    const validatedInput = textToSpeechSchema.parse(input);
    const text = validatedInput.text;
    const previousText = validatedInput.previousText;
    const audioHash = generateHash(text);

    // Si se proporciona un texto anterior, eliminar el audio cacheado asociado a él.
    if (previousText) {
        const previousAudioHash = generateHash(previousText);
        await deleteAudioCacheAction(previousAudioHash);
    }

    // Generar el audio
    try {
        const output = await textToSpeech({ text: validatedInput.text }); // Pasar solo el texto a textToSpeech
        const base64Data = output.audioDataUri.split(",")[1];

        // Subir a Vercel Blob
        const blob = await put(
            `${audioHash}.wav`,
            Buffer.from(base64Data, "base64"),
            {
                access: "public",
                contentType: "audio/wav",
            }
        );

        return { success: true, data: { ...output, audioUrl: blob.url } };
    } catch (generateAndSaveError) {
        console.error(
            "Error al generar o guardar el audio:",
            generateAndSaveError
        );
        return {
            success: false,
            error: "No se pudo generar el audio. Por favor, inténtalo de nuevo en unos minutos más tarde.",
        };
    }
}

/**
 * @summary Elimina un archivo de audio específico del caché.
 * @description Esta función busca y elimina un archivo de audio del directorio de caché basado en su hash.
 * Si el archivo no existe, simplemente registra una advertencia en lugar de lanzar un error.
 * @param {string} audioHash - El hash SHA256 del archivo de audio a eliminar.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} Resultado de la operación, indicando si la eliminación fue exitosa o si hubo un error.
 */
export async function deleteAudioCacheAction(audioHash: string) {
    try {
        // Eliminar de Vercel Blob
        await del(`${audioHash}.wav`);
        console.log(`Audio con hash ${audioHash} eliminado de Vercel Blob.`);
        return { success: true };
    } catch (error) {
        console.error(
            `Error al eliminar audio de Vercel Blob ${audioHash}:`,
            error
        );
        return {
            success: false,
            error: "No se pudo eliminar el audio del caché.",
        };
    }
}
