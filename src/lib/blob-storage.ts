import { put, del } from "@vercel/blob";
import { createHash } from "crypto";

/**
 * Servicio para manejar el almacenamiento de archivos en blob storage
 * con estructura de carpetas por usuario
 */

export interface BlobUploadResult {
    url: string;
    pathname: string;
}

export interface StoryFiles {
    textFileUrl?: string;
    imageUrl?: string;
    audioUrl?: string;
}

/**
 * Genera un hash único para el contenido
 */
function generateContentHash(content: string): string {
    return createHash("sha256").update(content).digest("hex").substring(0, 16);
}

/**
 * Normaliza el email para usar como nombre de carpeta
 */
function normalizeEmail(email: string): string {
    return email.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Genera la ruta base para un usuario
 */
function getUserBasePath(email: string): string {
    return normalizeEmail(email);
}

/**
 * Genera las rutas de carpetas para un usuario
 */
export function getUserFolderPaths(email: string) {
    const basePath = getUserBasePath(email);
    return {
        base: basePath,
        texts: `${basePath}/texts`,
        images: `${basePath}/images`, 
        audios: `${basePath}/audios`,
    };
}

/**
 * Sube el contenido de texto de un cuento
 */
export async function uploadStoryText(
    userEmail: string,
    storyId: string,
    content: string,
    title: string
): Promise<BlobUploadResult> {
    const folders = getUserFolderPaths(userEmail);
    const filename = `${storyId}_${title.replace(/[^a-zA-Z0-9._-]/g, "_")}.txt`;
    const filepath = `${folders.texts}/${filename}`;

    try {
        const result = await put(filepath, content, {
            access: "public",
            contentType: "text/plain; charset=utf-8",
            allowOverwrite: true,
        });

        return {
            url: result.url,
            pathname: result.pathname,
        };
    } catch (error) {
        console.error("Error uploading story text:", error);
        throw new Error("No se pudo subir el archivo de texto del cuento");
    }
}

/**
 * Sube una imagen de cuento
 */
export async function uploadStoryImage(
    userEmail: string,
    storyId: string,
    imageBuffer: Buffer,
    originalFilename?: string
): Promise<BlobUploadResult> {
    const folders = getUserFolderPaths(userEmail);
    const extension = originalFilename?.split('.').pop() || 'jpg';
    const filename = `${storyId}_image.${extension}`;
    const filepath = `${folders.images}/${filename}`;

    try {
        const result = await put(filepath, imageBuffer, {
            access: "public",
            contentType: `image/${extension}`,
        });

        return {
            url: result.url,
            pathname: result.pathname,
        };
    } catch (error) {
        console.error("Error uploading story image:", error);
        throw new Error("No se pudo subir la imagen del cuento");
    }
}

/**
 * Sube un archivo de audio de cuento
 */
export async function uploadStoryAudio(
    userEmail: string,
    storyId: string,
    audioBuffer: Buffer,
    contentHash?: string
): Promise<BlobUploadResult> {
    const folders = getUserFolderPaths(userEmail);
    // Usar un nombre consistente por cuento para permitir sobrescritura
    const filename = `${storyId}_audio.wav`;
    const filepath = `${folders.audios}/${filename}`;

    try {
        const result = await put(filepath, audioBuffer, {
            access: "public",
            contentType: "audio/wav",
            allowOverwrite: true,
        });

        return {
            url: result.url,
            pathname: result.pathname,
        };
    } catch (error) {
        console.error("Error uploading story audio:", error);
        throw new Error("No se pudo subir el audio del cuento");
    }
}

/**
 * Elimina un archivo del blob storage
 */
export async function deleteFile(url: string): Promise<void> {
    try {
        await del(url);
        console.log(`Archivo eliminado: ${url}`);
    } catch (error) {
        console.error("Error deleting file:", error);
        // No lanzar error para no interrumpir operaciones principales
    }
}

/**
 * Elimina todos los archivos de un cuento
 */
export async function deleteStoryFiles(files: StoryFiles): Promise<void> {
    const promises = [];

    if (files.textFileUrl) {
        promises.push(deleteFile(files.textFileUrl));
    }
    if (files.imageUrl) {
        promises.push(deleteFile(files.imageUrl));
    }
    if (files.audioUrl) {
        promises.push(deleteFile(files.audioUrl));
    }

    if (promises.length > 0) {
        await Promise.allSettled(promises);
    }
}

/**
 * Crea una URL de descarga directa para un archivo
 */
export function generateDownloadUrl(blobUrl: string, filename: string): string {
    return `${blobUrl}?download=${encodeURIComponent(filename)}`;
}

/**
 * Extrae el pathname de una URL de blob
 */
export function extractBlobPathname(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remover el "/" inicial
    } catch {
        return url;
    }
}
