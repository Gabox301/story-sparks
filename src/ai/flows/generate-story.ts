"use server";

/**
 * @fileOverview Generates unique children's stories based on selected themes and characters.
 *
 * - generateUniqueStory - A function that generates a unique story.
 * - GenerateUniqueStoryInput - The input type for the generateUniqueStory function.
 * - GenerateUniqueStoryOutput - The return type for the generateUniqueStory function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateUniqueStoryInputSchema = z.object({
    theme: z
        .string()
        .describe("El tema del cuento (p. ej., aventura, misterio, fantasía)."),
    mainCharacterName: z
        .string()
        .describe("El nombre del personaje principal."),
    mainCharacterTraits: z
        .string()
        .describe(
            "Los rasgos del personaje principal (p. ej., valiente, amable, divertido)."
        ),
});
export type GenerateUniqueStoryInput = z.infer<
    typeof GenerateUniqueStoryInputSchema
>;

const GenerateUniqueStoryOutputSchema = z.object({
    title: z.string().describe("El título del cuento generado."),
    story: z.string().describe("El cuento generado."),
});
export type GenerateUniqueStoryOutput = z.infer<
    typeof GenerateUniqueStoryOutputSchema
>;

export async function generateUniqueStory(
    input: GenerateUniqueStoryInput
): Promise<GenerateUniqueStoryOutput> {
    return generateUniqueStoryFlow(input);
}

const storyPrompt = ai.definePrompt({
    name: "storyPrompt",
    input: { schema: GenerateUniqueStoryInputSchema },
    output: { schema: GenerateUniqueStoryOutputSchema },
    prompt: `Eres un escritor de cuentos para niños. Genera un cuento único basado en el tema y los personajes dados. **ES CRÍTICO QUE TODO EL CUENTO SE ESCRIBA EN ESPAÑOL.**

Tema: {{{theme}}}
Nombre del Personaje Principal: {{{mainCharacterName}}}
Rasgos del Personaje Principal: {{{mainCharacterTraits}}}

Escribe un cuento con un título, capítulos cortos y una redacción clara para los primeros lectores. Todo el contenido debe estar en español.`,
});

const generateUniqueStoryFlow = ai.defineFlow(
    {
        name: "generateUniqueStoryFlow",
        inputSchema: GenerateUniqueStoryInputSchema,
        outputSchema: GenerateUniqueStoryOutputSchema,
    },
    async (input) => {
        const { output } = await storyPrompt(input);
        return output!;
    }
);
