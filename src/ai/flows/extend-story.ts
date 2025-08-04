// Extend the existing story based on user input.
"use server";

/**
 * @fileOverview A story extension AI agent.
 *
 * - extendStory - A function that handles the story extension process.
 * - ExtendStoryInput - The input type for the extendStory function.
 * - ExtendStoryOutput - The return type for the extendStory function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ExtendStoryInputSchema = z.object({
    existingStory: z.string().describe("The existing story to extend."),
    userInput: z
        .string()
        .describe("The user input to guide the story extension."),
});
export type ExtendStoryInput = z.infer<typeof ExtendStoryInputSchema>;

const ExtendStoryOutputSchema = z.object({
    newStorySection: z.string().describe("The new section of the story."),
});
export type ExtendStoryOutput = z.infer<typeof ExtendStoryOutputSchema>;

export async function extendStory(
    input: ExtendStoryInput
): Promise<ExtendStoryOutput> {
    return extendStoryFlow(input);
}

const extendStoryPrompt = ai.definePrompt({
    name: "extendStoryPrompt",
    input: { schema: ExtendStoryInputSchema },
    output: { schema: ExtendStoryOutputSchema },
    prompt: `Eres un escritor de cuentos para niños. Continúa la siguiente historia basándote en la entrada del usuario. Asegúrate de que el nuevo contenido no contradiga el contenido anterior. **ES CRÍTICO QUE LA NUEVA SECCIÓN SE ESCRIBA EN ESPAÑOL.**

Historia Existente:
{{{existingStory}}}

Entrada del Usuario:
{{{userInput}}}

Nueva Sección de la Historia (en español):`,
});

const extendStoryFlow = ai.defineFlow(
    {
        name: "extendStoryFlow",
        inputSchema: ExtendStoryInputSchema,
        outputSchema: ExtendStoryOutputSchema,
    },
    async (input) => {
        const { output } = await extendStoryPrompt(input);
        return output!;
    }
);
