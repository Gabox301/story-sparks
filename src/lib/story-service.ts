import prisma from "@/lib/prisma";
import {
    uploadStoryText,
    uploadStoryAudio,
    deleteStoryFiles,
    type StoryFiles,
} from "@/lib/blob-storage";
import type { Story as StoryType } from "@/lib/types";

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

export interface StoryWithFiles extends StoryType {
    textFileUrl?: string;
    audioUrl?: string;
    userId: string;
}

/**
 * Convierte una historia de Prisma al formato de la aplicación
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
 * Crear un nuevo cuento en la base de datos
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
 * Obtener un cuento por ID
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
 * Obtener todos los cuentos de un usuario
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
 * Actualizar un cuento
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
 * Eliminar un cuento
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
        const deletePromises = stories.map((story) => {
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
