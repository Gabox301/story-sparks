/**
 * @module storyService
 * @description Este módulo proporciona funciones para interactuar con los cuentos en la base de datos
 * y el almacenamiento de blobs, incluyendo la creación, actualización, eliminación y recuperación de cuentos.
 */

import prisma from "@/lib/prisma";
import {
    uploadStoryText,
    uploadStoryAudio,
    deleteStoryFiles,
    type StoryFiles,
} from "@/lib/blob-storage";
import type { Story as StoryType } from "@/lib/types";

/**
 * @interface CreateStoryInput
 * @description Define la estructura de los datos de entrada para crear un nuevo cuento.
 * @property {string} theme - El tema principal del cuento.
 * @property {string} mainCharacterName - El nombre del personaje principal.
 * @property {string} mainCharacterTraits - Las características o rasgos del personaje principal.
 * @property {string} title - El título del cuento.
 * @property {string} content - El contenido textual del cuento.
 * @property {string} [imageUrl] - La URL de la imagen asociada al cuento (opcional).
 * @property {string} userId - El ID del usuario propietario del cuento.
 * @property {string} userEmail - El email del usuario propietario del cuento, utilizado para la organización en el almacenamiento de blobs.
 */
export interface CreateStoryInput {
    theme: string;
    mainCharacterName: string;
    mainCharacterTraits: string;
    title: string;
    content: string;
    imageUrl?: string;
    userId: string;
    userEmail: string;
}

/**
 * @interface UpdateStoryInput
 * @description Define la estructura de los datos de entrada para actualizar un cuento existente.
 * @property {string} id - El ID único del cuento a actualizar.
 * @property {string} [content] - El nuevo contenido textual del cuento (opcional).
 * @property {string} [imageUrl] - La nueva URL de la imagen del cuento (opcional).
 * @property {string} [audioUrl] - La nueva URL del audio del cuento (opcional).
 * @property {number} [extendedCount] - El número de veces que el cuento ha sido extendido (opcional).
 * @property {boolean} [favorite] - Indica si el cuento es favorito (opcional).
 * @property {string} userId - El ID del usuario propietario del cuento.
 * @property {string} userEmail - El email del usuario propietario del cuento, utilizado para la organización en el almacenamiento de blobs.
 */
export interface UpdateStoryInput {
    id: string;
    content?: string;
    imageUrl?: string;
    audioUrl?: string;
    extendedCount?: number;
    favorite?: boolean;
    userId: string;
    userEmail: string;
}

/**
 * @interface StoryWithFiles
 * @description Extiende el tipo `StoryType` para incluir URLs de archivos de texto y audio.
 * Representa un cuento con información adicional sobre sus archivos almacenados.
 * @property {string} [textFileUrl] - La URL del archivo de texto del cuento en el almacenamiento de blobs (opcional).
 * @property {string} [audioUrl] - La URL del archivo de audio del cuento en el almacenamiento de blobs (opcional).
 * @property {string} userId - El ID del usuario propietario del cuento.
 */
export interface StoryWithFiles extends StoryType {
    textFileUrl?: string;
    audioUrl?: string;
    userId: string;
}

/**
 * @function mapPrismaStoryToStory
 * @description Convierte un objeto de historia de Prisma a un formato de aplicación `StoryWithFiles`.
 * @param {any} prismaStory - El objeto de historia recuperado de Prisma.
 * @returns {StoryWithFiles} El objeto de historia mapeado al formato de la aplicación.
 */
function mapPrismaStoryToStory(prismaStory: any): StoryWithFiles {
    return {
        id: prismaStory.id,
        theme: prismaStory.theme,
        mainCharacterName: prismaStory.mainCharacterName,
        mainCharacterTraits: prismaStory.mainCharacterTraits,
        title: prismaStory.title,
        content: prismaStory.content,
        createdAt: prismaStory.createdAt.toISOString(),
        imageUrl: prismaStory.imageUrl,
        audioUrl: prismaStory.audioUrl,
        textFileUrl: prismaStory.textFileUrl,
        favorite: prismaStory.favorite,
        extendedCount: prismaStory.extendedCount,
        userId: prismaStory.userId,
    };
}

/**
 * @function createStory
 * @description Crea un nuevo cuento en la base de datos y gestiona la subida de archivos asociados (imagen y texto) al almacenamiento de blobs.
 * @param {CreateStoryInput} input - Los datos de entrada para crear el cuento.
 * @returns {Promise<StoryWithFiles>} Una promesa que resuelve con el cuento creado, incluyendo las URLs de los archivos almacenados.
 * @throws {Error} Si ocurre un error durante la creación del cuento o la subida de archivos.
 */
export async function createStory(
    input: CreateStoryInput
): Promise<StoryWithFiles> {
    try {
        // Crear el cuento en la base de datos
        const story = await prisma.story.create({
            data: {
                theme: input.theme,
                mainCharacterName: input.mainCharacterName,
                mainCharacterTraits: input.mainCharacterTraits,
                title: input.title,
                content: input.content,
                imageUrl: input.imageUrl,
                userId: input.userId,
            },
        });

        // Subir la imagen a blob storage si es un data URI (imagen generada por IA)
        let finalImageUrl = input.imageUrl;
        if (input.imageUrl && input.imageUrl.startsWith("data:image/")) {
            try {
                console.log(
                    "🖼️  Subiendo imagen generada por IA a blob storage..."
                );

                // Extraer datos de la imagen del data URI
                const matches = input.imageUrl.match(
                    /^data:image\/(\w+);base64,(.+)$/
                );
                if (matches) {
                    const [, extension, base64Data] = matches;
                    const imageBuffer = Buffer.from(base64Data, "base64");

                    // Importar y usar la función de subida de imágenes
                    const { uploadStoryImage } = await import(
                        "@/lib/blob-storage"
                    );
                    const imageUploadResult = await uploadStoryImage(
                        input.userEmail,
                        story.id,
                        imageBuffer,
                        `image.${extension}`
                    );

                    finalImageUrl = imageUploadResult.url;
                    console.log("✅ Imagen subida a blob storage");
                } else {
                    console.warn(
                        "⚠️  No se pudo procesar el data URI de la imagen"
                    );
                }
            } catch (imageUploadError) {
                console.error(
                    "❌ Error subiendo imagen a blob storage:",
                    imageUploadError
                );
                // Continuar con la URL original si falla la subida
                console.log("🔄 Usando URL original de la imagen");
            }
        }

        // Subir el contenido de texto a blob storage
        let textFileUrl: string | undefined;
        try {
            const textUploadResult = await uploadStoryText(
                input.userEmail,
                story.id,
                input.content,
                input.title
            );
            textFileUrl = textUploadResult.url;

            console.log("✅ Archivo de texto subido");
        } catch (textUploadError) {
            console.error(
                "❌ Error subiendo archivo de texto:",
                textUploadError
            );
            // Continuar sin el archivo de texto
        }

        // Actualizar la historia con las URLs finales
        const finalStory = await prisma.story.update({
            where: { id: story.id },
            data: {
                imageUrl: finalImageUrl,
                textFileUrl,
            },
        });

        return mapPrismaStoryToStory({
            ...finalStory,
            textFileUrl,
        });
    } catch (error) {
        console.error("Error creating story:", error);
        throw new Error("No se pudo crear el cuento");
    }
}

/**
 * @function getStoryById
 * @description Obtiene un cuento específico de la base de datos por su ID y el ID del usuario.
 * @param {string} id - El ID del cuento a recuperar.
 * @param {string} userId - El ID del usuario propietario del cuento.
 * @returns {Promise<StoryWithFiles | null>} Una promesa que resuelve con el cuento encontrado o `null` si no se encuentra.
 * @throws {Error} Si ocurre un error durante la recuperación del cuento.
 */
export async function getStoryById(
    id: string,
    userId: string
): Promise<StoryWithFiles | null> {
    try {
        const story = await prisma.story.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!story) return null;

        return mapPrismaStoryToStory(story);
    } catch (error) {
        console.error("Error getting story by ID:", error);
        throw new Error("No se pudo obtener el cuento");
    }
}

/**
 * @function getUserStories
 * @description Obtiene todos los cuentos asociados a un usuario específico.
 * @param {string} userId - El ID del usuario cuyos cuentos se desean recuperar.
 * @returns {Promise<StoryWithFiles[]>} Una promesa que resuelve con un array de cuentos del usuario.
 * @throws {Error} Si ocurre un error durante la recuperación de los cuentos.
 */
export async function getUserStories(
    userId: string
): Promise<StoryWithFiles[]> {
    try {
        const stories = await prisma.story.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return stories.map(mapPrismaStoryToStory);
    } catch (error) {
        console.error("Error getting user stories:", error);
        throw new Error("No se pudieron obtener los cuentos del usuario");
    }
}

/**
 * @function updateStory
 * @description Actualiza un cuento existente en la base de datos.
 * @param {UpdateStoryInput} input - Los datos de entrada para actualizar el cuento.
 * @returns {Promise<StoryWithFiles>} Una promesa que resuelve con el cuento actualizado.
 * @throws {Error} Si ocurre un error durante la actualización del cuento.
 */
export async function updateStory(
    input: UpdateStoryInput
): Promise<StoryWithFiles> {
    try {
        const updateData: any = {};
        
        if (input.content !== undefined) updateData.content = input.content;
        if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
        if (input.audioUrl !== undefined) updateData.audioUrl = input.audioUrl;
        if (input.extendedCount !== undefined) updateData.extendedCount = input.extendedCount;
        if (input.favorite !== undefined) updateData.favorite = input.favorite;

        // Obtener el cuento existente para comparaciones y operaciones
        const existingStory = await prisma.story.findFirst({
            where: { id: input.id, userId: input.userId },
        });

        if (!existingStory) {
            throw new Error(`Cuento con ID ${input.id} no encontrado para el usuario`);
        }

        // Si se actualiza el contenido (extensión de cuento)
        if (input.content && input.content !== existingStory.content) {
            console.log('📝 Actualizando contenido del cuento:', input.id);
            
            // Incrementar automáticamente el extendedCount si no se especificó
            if (input.extendedCount === undefined) {
                updateData.extendedCount = (existingStory.extendedCount || 0) + 1;
                console.log(`🔢 ExtendedCount incrementado a: ${updateData.extendedCount}`);
            }
            
            // Actualizar el archivo de texto en blob storage (reemplazar el anterior)
            try {
                console.log('📄 Actualizando archivo de texto en blob storage...');
                const textUploadResult = await uploadStoryText(
                    input.userEmail,
                    input.id,
                    input.content,
                    existingStory.title
                );
                updateData.textFileUrl = textUploadResult.url;
                console.log('✅ Archivo de texto actualizado en blob storage');
            } catch (textUploadError) {
                console.error('❌ Error actualizando archivo de texto:', textUploadError);
                // Continuar sin fallar la operación completa
            }
            
            // Si había audio anterior, invalidarlo para forzar regeneración
            if (existingStory.audioUrl) {
                console.log('🔄 Invalidando audio anterior debido a extensión de contenido');
                updateData.audioUrl = null; // Se regenerará cuando el usuario solicite audio
            }
        }

        // Si se actualiza el audioUrl (nueva generación de audio exitosa)
        if (input.audioUrl && input.audioUrl !== existingStory.audioUrl) {
            console.log('🎵 Actualizando URL de audio en base de datos');
            // El archivo anterior se sobrescribe automáticamente con allowOverwrite: true
        }

        // Actualizar el registro en la base de datos
        const updatedStory = await prisma.story.update({
            where: { id: input.id },
            data: {
                ...updateData,
                updatedAt: new Date(), // Actualizar timestamp explícitamente
            },
        });

        console.log('✅ Cuento actualizado exitosamente en base de datos');
        return mapPrismaStoryToStory(updatedStory);
    } catch (error) {
        console.error('❌ Error updating story:', error);
        throw new Error("No se pudo actualizar el cuento");
    }
}

/**
 * @function deleteStory
 * @description Elimina un cuento existente de la base de datos y sus archivos asociados del almacenamiento de blobs.
 * @param {string} storyId - El ID del cuento a eliminar.
 * @param {string} userId - El ID del usuario propietario del cuento.
 * @returns {Promise<void>} Una promesa que resuelve cuando el cuento ha sido eliminado.
 * @throws {Error} Si ocurre un error durante la eliminación del cuento o sus archivos.
 */
export async function deleteStory(id: string, userId: string): Promise<void> {
    try {
        // Obtener la historia para acceder a las URLs de archivos
        const story = await prisma.story.findFirst({
            where: { id, userId },
            select: {
                textFileUrl: true,
                imageUrl: true,
                audioUrl: true,
            },
        });

        if (!story) {
            throw new Error("Cuento no encontrado");
        }

        // Eliminar archivos del blob storage
        const storyFiles: StoryFiles = {
            textFileUrl: story.textFileUrl || undefined,
            imageUrl: story.imageUrl || undefined,
            audioUrl: story.audioUrl || undefined,
        };

        // Eliminar de la base de datos primero
        await prisma.story.delete({
            where: { id },
        });

        // Luego eliminar archivos (no bloquear si falla)
        await deleteStoryFiles(storyFiles);
    } catch (error) {
        console.error("Error deleting story:", error);
        throw new Error("No se pudo eliminar el cuento");
    }
}

/**
 * Eliminar todos los cuentos de un usuario
 */
export async function deleteAllUserStories(userId: string): Promise<void> {
    try {
        // Obtener todas las historias del usuario con sus archivos
        const stories = await prisma.story.findMany({
            where: { userId },
            select: {
                id: true,
                textFileUrl: true,
                imageUrl: true,
                audioUrl: true,
            },
        });

        // Eliminar de la base de datos
        await prisma.story.deleteMany({
            where: { userId },
        });

        // Eliminar archivos en paralelo (no bloquear si fallan)
        const deletePromises = stories.map((story: Pick<StoryWithFiles, 'id' | 'textFileUrl' | 'imageUrl' | 'audioUrl'>) => {
            const storyFiles: StoryFiles = {
                textFileUrl: story.textFileUrl || undefined,
                imageUrl: story.imageUrl || undefined,
                audioUrl: story.audioUrl || undefined,
            };
            return deleteStoryFiles(storyFiles);
        });

        await Promise.allSettled(deletePromises);
    } catch (error) {
        console.error("Error deleting all user stories:", error);
        throw new Error("No se pudieron eliminar todos los cuentos");
    }
}

/**
 * Obtener estadísticas de cuentos de un usuario
 */
export async function getUserStoriesStats(userId: string) {
    try {
        const [totalStories, favoriteStories] = await Promise.all([
            prisma.story.count({ where: { userId } }),
            prisma.story.count({ where: { userId, favorite: true } }),
        ]);

        return {
            totalStories,
            favoriteStories,
        };
    } catch (error) {
        console.error("Error getting user stories stats:", error);
        throw new Error("No se pudieron obtener las estadísticas");
    }
}

/**
 * Buscar cuentos de un usuario por texto
 */
export async function searchUserStories(
    userId: string,
    searchText: string
): Promise<StoryWithFiles[]> {
    try {
        const stories = await prisma.story.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: searchText, mode: "insensitive" } },
                    { content: { contains: searchText, mode: "insensitive" } },
                    { theme: { contains: searchText, mode: "insensitive" } },
                    {
                        mainCharacterName: {
                            contains: searchText,
                            mode: "insensitive",
                        },
                    },
                ],
            },
            orderBy: { createdAt: "desc" },
        });

        return stories.map(mapPrismaStoryToStory);
    } catch (error) {
        console.error("Error searching user stories:", error);
        throw new Error("No se pudieron buscar los cuentos");
    }
}
