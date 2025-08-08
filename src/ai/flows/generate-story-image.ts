"use server";

/**
 * @fileOverview Generates an image for a story.
 *
 * - generateStoryImage - A function that generates an image for a story.
 * - GenerateStoryImageInput - The input type for the generateStoryImage function.
 * - GenerateStoryImageOutput - The return type for the generateStoryImage function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateStoryImageInputSchema = z.object({
    title: z.string().describe("The title of the story."),
    theme: z.string().describe("The theme of the story."),
});
export type GenerateStoryImageInput = z.infer<
    typeof GenerateStoryImageInputSchema
>;

const GenerateStoryImageOutputSchema = z.object({
    imageUrl: z
        .string()
        .describe(
            "A data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."
        ),
});
export type GenerateStoryImageOutput = z.infer<
    typeof GenerateStoryImageOutputSchema
>;

export async function generateStoryImage(
    input: GenerateStoryImageInput
): Promise<GenerateStoryImageOutput> {
    const MAX_RETRIES = 1;
    const TIMEOUT_MS = 30000; // 30 segundos
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🖼️  Intento ${attempt}/${MAX_RETRIES} de generación de imagen`);
            
            // Crear una promesa con timeout
            const imagePromise = generateStoryImageFlow(input);
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout al generar imagen')), TIMEOUT_MS);
            });
            
            const result = await Promise.race([imagePromise, timeoutPromise]);
            
            console.log(`✅ Imagen generada en intento ${attempt}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Intento ${attempt} falló:`, error);
            
            if (attempt === MAX_RETRIES) {
                console.error('⚠️  Todos los intentos de generación de imagen fallaron');
                throw error;
            }
            
            // Esperar antes del siguiente intento (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw new Error('No se pudo generar la imagen después de todos los intentos');
}

const generateStoryImageFlow = ai.defineFlow(
    {
        name: "generateStoryImageFlow",
        inputSchema: GenerateStoryImageInputSchema,
        outputSchema: GenerateStoryImageOutputSchema,
    },
    async ({ title, theme }) => {
        const { media } = await ai.generate({
            model: "googleai/gemini-2.0-flash-preview-image-generation",
            prompt: `Crea una ilustración para un cuento infantil en español con el título "${title}". El estilo debe ser caricaturesco, colorido y amigable para los niños. El tema del cuento es "${theme}". La imagen debe ser horizontal y adecuada para una portada de cuento.`,
            config: {
                responseModalities: ["TEXT", "IMAGE"],
            },
        });

        if (!media?.url) {
            throw new Error("No se pudo generar la imagen.");
        }

        return { imageUrl: media.url };
    }
);
