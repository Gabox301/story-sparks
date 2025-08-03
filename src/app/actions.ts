'use server';

import { z } from 'zod';
import { generateUniqueStory } from '@/ai/flows/generate-story';
import { generateStoryImage } from '@/ai/flows/generate-story-image';
import { extendStory } from '@/ai/flows/extend-story';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

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

/**
 * @fileoverview Acciones del servidor para la generación y extensión de historias, y conversión de texto a voz.
 */

/**
 * Esquema de validación para la entrada de texto a voz.
 * @typedef {object} TextToSpeechSchema
 * @property {string} text - El texto a convertir en voz.
 */

/**
 * Genera un hash SHA256 para una cadena de texto.
 * @param {string} text - El texto de entrada.
 * @returns {string} El hash SHA256 del texto.
 */
function generateHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Acción del servidor para convertir texto a voz con soporte de caché.
 * Si el audio para el texto dado ya existe en caché, lo devuelve; de lo contrario, lo genera y lo guarda en caché.
 * @param {object} input - El objeto de entrada que contiene el texto.
 * @param {string} input.text - El texto a convertir en voz.
 * @returns {Promise<object>} Un objeto con el estado de éxito y los datos del audio (URI de datos) o un mensaje de error.
 */
export async function textToSpeechAction(input: z.infer<typeof textToSpeechSchema>) {
  const validatedInput = textToSpeechSchema.parse(input);
    const text = validatedInput.text;
    const audioHash = generateHash(text);
    const cacheFilePath = path.join(process.cwd(), 'public', 'audio-cache', `${audioHash}.wav`);

    try {
      // Verificar si el archivo de audio ya existe en caché
      const cachedAudioBase64 = await fs.readFile(cacheFilePath, { encoding: 'base64' });
      console.log('Audio recuperado de la caché.');
      return { success: true, data: { audioDataUri: `data:audio/wav;base64,${cachedAudioBase64}` } };
    } catch (error) {
      // Si el archivo no existe o hay un error al leerlo, generar el audio
      console.log('Audio no encontrado en caché, generando...');
      try {
        const output = await textToSpeech(validatedInput);
        // Extraer solo los datos base64 del URI de datos
        const base64Data = output.audioDataUri.split(',')[1];
        // Guardar el audio generado en caché
        await fs.writeFile(cacheFilePath, base64Data, { encoding: 'base64' });
        console.log('Audio generado y guardado en caché.');
        return { success: true, data: output };
      } catch (generateError) {
        console.error('Error al generar o guardar el audio:', generateError);
        return { success: false, error: 'No se pudo generar el audio. Por favor, inténtalo de nuevo.' };
      }
    }
}

/**
 * Acción del servidor para eliminar un archivo de audio del caché.
 * @param {string} audioHash - El hash del audio a eliminar.
 * @returns {Promise<object>} Un objeto con el estado de éxito o un mensaje de error.
 */
export async function deleteAudioCacheAction(audioHash: string) {
  const cacheFilePath = path.join(process.cwd(), 'public', 'audio-cache', `${audioHash}.wav`);
  try {
    await fs.unlink(cacheFilePath);
    console.log(`Audio con hash ${audioHash} eliminado del caché.`);
    return { success: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Intento de eliminar audio no existente en caché: ${audioHash}`);
      return { success: true, message: 'El archivo de audio no existía en caché.' };
    } else {
      console.error(`Error al eliminar audio del caché ${audioHash}:`, error);
      return { success: false, error: 'No se pudo eliminar el audio del caché.' };
    }
  }
}
