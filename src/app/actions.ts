"use server";

import { z } from "zod";
import { generateUniqueStory } from "@/ai/flows/generate-story";
import { generateStoryImage } from "@/ai/flows/generate-story-image";
import { extendStory } from "@/ai/flows/extend-story";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { createHash } from "crypto";
import { put, del } from "@vercel/blob";
import { uploadStoryAudio } from "@/lib/blob-storage";
import { updateStory } from "@/lib/story-service";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";

const generateStorySchema = z.object({
    theme: z.string(),
    mainCharacterName: z.string(),
    mainCharacterTraits: z.string(),
});

/**
 * @summary Genera una historia única utilizando un flujo de IA y la guarda en la base de datos.
 * @description Esta función toma un tema, nombre y rasgos de personaje para crear una historia.
 * Opcionalmente, también genera una imagen para la historia. Ahora guarda en la base de datos.
 * @param {z.infer<typeof generateStorySchema>} input - Objeto con el tema, nombre y rasgos del personaje principal.
 * @returns {Promise<{success: boolean, data?: {title: string, content: string, imageUrl?: string, id: string}, error?: string}>} Resultado de la operación, incluyendo la historia generada y opcionalmente la URL de la imagen.
 */
export async function generateStoryAction(
    input: z.infer<typeof generateStorySchema>
) {
    const validatedInput = generateStorySchema.parse(input);
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id || !session?.user?.email) {
            return {
                success: false,
                error: "No autorizado. Debes iniciar sesión.",
            };
        }

        const storyOutput = await generateUniqueStory(validatedInput);

        let imageUrl: string | undefined;
        try {
            console.log(
                "🎨 Iniciando generación de imagen para:",
                storyOutput.title
            );
            const imageOutput = await generateStoryImage({
                title: storyOutput.title,
                theme: validatedInput.theme,
            });
            imageUrl = imageOutput.imageUrl;
            console.log("✅ Imagen generada exitosamente");
        } catch (imageError) {
            console.error("❌ Error al generar la imagen:", imageError);

            // Categorizar el error para mejor debugging
            let errorCategory = "unknown";
            const errorMessage =
                imageError instanceof Error
                    ? imageError.message
                    : String(imageError);

            if (
                errorMessage.includes("API key") ||
                errorMessage.includes("authentication")
            ) {
                errorCategory = "authentication";
                console.error("🔑 Error de autenticación con Google AI");
            } else if (
                errorMessage.includes("quota") ||
                errorMessage.includes("limit")
            ) {
                errorCategory = "quota";
                console.error("📊 Límite de cuota alcanzado");
            } else if (errorMessage.includes("model")) {
                errorCategory = "model";
                console.error("🤖 Error del modelo de IA");
            } else if (
                errorMessage.includes("network") ||
                errorMessage.includes("connection")
            ) {
                errorCategory = "network";
                console.error("🌐 Error de conectividad");
            }

            console.error(`📊 Categoría del error de imagen: ${errorCategory}`);
            console.error("⚠️  Usando imagen de fallback: Sparky");

            // Usar Sparky como imagen de fallback - mascota oficial de Story Sparks
            // Esta imagen es temática, apropiada para cuentos infantiles y mantiene la identidad de marca
            imageUrl = "/sparky-fallback.png";

            console.log("🔄 Imagen de fallback Sparky asignada");
        }

        // Crear el cuento en la base de datos usando el servicio
        const { createStory } = await import("@/lib/story-service");
        const savedStory = await createStory({
            theme: validatedInput.theme,
            mainCharacterName: validatedInput.mainCharacterName,
            mainCharacterTraits: validatedInput.mainCharacterTraits,
            title: storyOutput.title,
            content: storyOutput.story,
            imageUrl,
            userId: session.user.id,
            userEmail: session.user.email,
        });

        return {
            success: true,
            data: {
                id: savedStory.id,
                title: savedStory.title,
                content: savedStory.content,
                imageUrl: savedStory.imageUrl,
                textFileUrl: savedStory.textFileUrl,
            },
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
    input: z.infer<typeof extendStorySchema> & { storyId: string }
) {
    const validatedInput = extendStorySchema.parse(input);
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id || !session?.user?.email) {
            return {
                success: false,
                error: "No autorizado. Debes iniciar sesión.",
            };
        }

        console.log("📚 Extendiendo cuento:", input.storyId);

        // 1. Generar la extensión con IA
        const extensionOutput = await extendStory(validatedInput);
        const extendedContent = `${validatedInput.existingStory}\n\n${extensionOutput.newStorySection}`;

        console.log("✅ Extensión generada con IA");

        // 2. Actualizar el cuento en la base de datos
        const { updateStory } = await import("@/lib/story-service");
        const updatedStory = await updateStory({
            id: input.storyId,
            content: extendedContent,
            extendedCount: undefined, // Será calculado automáticamente en el servicio
            userId: session.user.id,
            userEmail: session.user.email,
        });

        console.log("✅ Cuento actualizado en base de datos");

        return {
            success: true,
            data: {
                ...extensionOutput,
                fullContent: extendedContent,
                storyId: input.storyId,
            },
        };
    } catch (error) {
        console.error("❌ Error al extender cuento:", error);
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
 * @summary Convierte texto a voz y lo almacena en la estructura de blob storage por usuario.
 * @description Esta función genera el audio utilizando un servicio de texto a voz,
 * lo guarda en la estructura de carpetas del usuario en blob storage y actualiza la base de datos.
 * @param {z.infer<typeof textToSpeechSchema> & {storyId: string}} input - Objeto que contiene el texto a convertir, opcionalmente el texto anterior y el ID del cuento.
 * @returns {Promise<{success: boolean, data?: {audioDataUri: string, audioUrl: string}, error?: string}>} Resultado de la operación, incluyendo el URI de datos del audio y la URL pública.
 */
export async function textToSpeechAction(
    input: z.infer<typeof textToSpeechSchema> & { storyId: string }
): Promise<
    | { success: true; data: { audioDataUri: string; audioUrl: string } }
    | { success: false; error: string }
> {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id || !session?.user?.email) {
            return {
                success: false,
                error: "No autorizado. Debes iniciar sesión.",
            };
        }

        const validatedInput = textToSpeechSchema.parse(input);
        const storyId = input.storyId;

        // Generar el audio
        const output = await textToSpeech({ text: validatedInput.text });
        const base64Data = output.audioDataUri.split(",")[1];

        // Subir el audio usando la estructura de carpetas por usuario
        // Con allowOverwrite: true, automáticamente reemplaza el archivo anterior
        const audioResult = await uploadStoryAudio(
            session.user.email,
            storyId,
            Buffer.from(base64Data, "base64")
        );

        // Actualizar el cuento en la base de datos con la URL del audio
        await updateStory({
            id: storyId,
            audioUrl: audioResult.url,
            userId: session.user.id,
            userEmail: session.user.email,
        });

        return {
            success: true,
            data: {
                audioDataUri: output.audioDataUri,
                audioUrl: audioResult.url,
            },
        };
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
        console.log(`Audio con hash ${audioHash} será reemplazado.`);
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
