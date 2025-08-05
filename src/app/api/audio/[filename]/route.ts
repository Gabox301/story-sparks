import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

/**
 * @summary Maneja las solicitudes GET para archivos de audio.
 * @description Esta función lee un archivo de audio del directorio `public/audio-cache`
 * y lo devuelve como una respuesta de tipo `audio/wav`.
 * @param {NextRequest} request - El objeto de solicitud de Next.js.
 * @param {{ params: { filename: string } }} { params } - Los parámetros de la ruta, incluyendo el nombre del archivo.
 * @returns {Promise<NextResponse>} Una promesa que resuelve a una respuesta de Next.js con el archivo de audio o un error.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const { filename } = params;
        const audioFilePath = path.join(
            process.cwd(),
            'public', 'audio-cache', filename
        );

        // Verificar si el archivo existe
        try {
            await fs.access(audioFilePath);
        } catch (error) {
            console.error(`Archivo de audio no encontrado: ${audioFilePath}`, error);
            return new NextResponse('Archivo de audio no encontrado', { status: 404 });
        }

        const audioBuffer = await fs.readFile(audioFilePath);

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Disposition': `attachment; filename="${filename}"`, // Opcional: para forzar descarga
            },
        });
    } catch (error) {
        console.error('Error al servir el archivo de audio:', error);
        return new NextResponse('Error interno del servidor', { status: 500 });
    }
}