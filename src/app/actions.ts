'use server';

import { z } from 'zod';
import { generateUniqueStory } from '@/ai/flows/generate-story';
import { generateStoryImage } from '@/ai/flows/generate-story-image';
import { extendStory } from '@/ai/flows/extend-story';
import { textToSpeech } from '@/ai/flows/text-to-speech';

const generateStorySchema = z.object({
  theme: z.string(),
  mainCharacterName: z.string(),
  mainCharacterTraits: z.string(),
});

export async function generateStoryAction(input: z.infer<typeof generateStorySchema>) {
  const validatedInput = generateStorySchema.parse(input);
  try {
    const storyOutput = await generateUniqueStory(validatedInput);
    
    let imageUrl: string | undefined;
    try {
        const imageOutput = await generateStoryImage({ title: storyOutput.title, theme: validatedInput.theme });
        imageUrl = imageOutput.imageUrl;
    } catch(imageError) {
        console.error("Error al generar la imagen:", imageError);
        // No fallar si solo la imagen falla, continuar con una imagen de reemplazo
    }

    return { success: true, data: { ...storyOutput, imageUrl } };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'No se pudo generar el cuento. Por favor, inténtalo de nuevo.' };
  }
}


const extendStorySchema = z.object({
  existingStory: z.string(),
  userInput: z.string(),
});

export async function extendStoryAction(input: z.infer<typeof extendStorySchema>) {
  const validatedInput = extendStorySchema.parse(input);
  try {
    const output = await extendStory(validatedInput);
    return { success: true, data: output };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'No se pudo extender el cuento. Por favor, inténtalo de nuevo.' };
  }
}

const textToSpeechSchema = z.object({
  text: z.string(),
});

export async function textToSpeechAction(input: z.infer<typeof textToSpeechSchema>) {
    const validatedInput = textToSpeechSchema.parse(input);
    try {
        const output = await textToSpeech(validatedInput);
        return { success: true, data: output };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'No se pudo generar el audio. Por favor, inténtalo de nuevo.' };
    }
}
