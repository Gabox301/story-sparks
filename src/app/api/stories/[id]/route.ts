/**
 * @module storyIdAPI
 * @description Este módulo define la API para la gestión de cuentos individuales por ID.
 * Proporciona endpoints para obtener, actualizar y eliminar un cuento específico.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { getStoryById, updateStory, deleteStory } from "@/lib/story-service";
import { rejectIfTokenRevoked } from "@/lib/reject-revoked-token";

/**
 * @typedef {object} UpdateStorySchema
 * @property {string} [content] - El nuevo contenido del cuento.
 * @property {string} [imageUrl] - La nueva URL de la imagen del cuento. Puede ser una cadena vacía para eliminar la imagen.
 * @property {string} [audioUrl] - La nueva URL del audio del cuento. Puede ser una cadena vacía para eliminar el audio.
 * @property {number} [extendedCount] - El número de veces que el cuento ha sido extendido.
 * @property {boolean} [favorite] - Indica si el cuento es favorito.
 */
/**
 * @description Esquema de validación para la actualización de un cuento, utilizando Zod.
 */
const updateStorySchema = z.object({
    content: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    audioUrl: z.string().url().optional().or(z.literal("")),
    extendedCount: z.number().int().min(0).optional(),
    favorite: z.boolean().optional(),
});

/**
 * @function GET
 * @description Maneja las solicitudes GET para obtener un cuento específico por su ID.
 * Requiere autenticación y devuelve los detalles del cuento si el usuario es el propietario.
 * @param {NextRequest} request - La solicitud HTTP entrante.
 * @param {object} context - El contexto de la solicitud, que contiene los parámetros dinámicos.
 * @param {Promise<{ id: string }>} context.params - Los parámetros de la ruta, incluyendo el ID del cuento.
 * @returns {NextResponse} Una respuesta JSON con el cuento o un mensaje de error.
 * @throws {NextResponse} Retorna un error 401 si el usuario no está autorizado (sesión no iniciada o inválida). Retorna un error 400 si el ID del cuento no es proporcionado. Retorna un error 404 si el cuento no es encontrado. Retorna un error 500 si ocurre un error interno del servidor.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Validar si el token está revocado
    const revokedResponse = await rejectIfTokenRevoked(request);
    if (revokedResponse) return revokedResponse;
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session) {
            return NextResponse.json(
                { error: "No autorizado: Sesión no iniciada" },
                { status: 401 }
            );
        }
        if (!session.user?.id) {
            return NextResponse.json(
                { error: "No autorizado: Sesión inválida" },
                { status: 401 }
            );
        }

        const params = await context.params;
        const storyId = params.id;

        if (!storyId) {
            return NextResponse.json(
                { error: "ID de cuento requerido" },
                { status: 400 }
            );
        }

        // Obtener el cuento
        const story = await getStoryById(storyId, session.user.id);

        if (!story) {
            return NextResponse.json(
                { error: "Cuento no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { story },
        });
    } catch (error) {
        console.error("Error in GET /api/stories/[id]:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error al obtener el cuento",
            },
            { status: 500 }
        );
    }
}

/**
 * @function PUT
 * @description Maneja las solicitudes PUT para actualizar un cuento específico por su ID.
 * Requiere autenticación y valida los datos de entrada antes de actualizar el cuento en la base de datos.
 * @param {NextRequest} request - La solicitud HTTP entrante, que debe contener el cuerpo JSON con los datos a actualizar.
 * @param {object} context - El contexto de la solicitud, que contiene los parámetros dinámicos.
 * @param {Promise<{ id: string }>} context.params - Los parámetros de la ruta, incluyendo el ID del cuento.
 * @returns {NextResponse} Una respuesta JSON con el cuento actualizado o un mensaje de error.
 * @throws {NextResponse} Retorna un error 401 si el usuario no está autorizado (sesión no iniciada o inválida). Retorna un error 400 si el ID del cuento no es proporcionado o si los datos de entrada son inválidos. Retorna un error 404 si el cuento no es encontrado. Retorna un error 500 si ocurre un error interno del servidor.
 * @property {UpdateStorySchema} request.body - Los datos para actualizar el cuento.
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Validar si el token está revocado
    const revokedResponse = await rejectIfTokenRevoked(request);
    if (revokedResponse) return revokedResponse;
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session) {
            return NextResponse.json(
                { error: "No autorizado: Sesión no iniciada" },
                { status: 401 }
            );
        }
        if (!session.user?.id || !session.user?.email) {
            return NextResponse.json(
                { error: "No autorizado: Sesión inválida" },
                { status: 401 }
            );
        }

        const params = await context.params;
        const storyId = params.id;

        if (!storyId) {
            return NextResponse.json(
                { error: "ID de cuento requerido" },
                { status: 400 }
            );
        }

        // Validar datos de entrada
        const body = await request.json();

        try {
            const validatedData = updateStorySchema.parse(body);

            // Verificar que el cuento existe y pertenece al usuario
            const existingStory = await getStoryById(storyId, session.user.id);
            if (!existingStory) {
                return NextResponse.json(
                    { error: "Cuento no encontrado" },
                    { status: 404 }
                );
            }

            // Actualizar el cuento
            const updatedStory = await updateStory({
                id: storyId,
                ...validatedData,
                userId: session.user.id,
                userEmail: session.user.email,
            });

            return NextResponse.json({
                success: true,
                data: { story: updatedStory },
            });
        } catch (validationError) {
            if (validationError instanceof z.ZodError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Datos de entrada inválidos",
                        details: validationError.errors,
                    },
                    { status: 400 }
                );
            }
            throw validationError;
        }
    } catch (error) {
        console.error("Error in PUT /api/stories/[id]:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error al actualizar el cuento",
            },
            { status: 500 }
        );
    }
}

/**
 * @function DELETE
 * @description Maneja las solicitudes DELETE para eliminar un cuento específico por su ID.
 * Requiere autenticación y elimina el cuento si el usuario es el propietario.
 * @param {NextRequest} request - La solicitud HTTP entrante.
 * @param {object} context - El contexto de la solicitud, que contiene los parámetros dinámicos.
 * @param {Promise<{ id: string }>} context.params - Los parámetros de la ruta, incluyendo el ID del cuento.
 * @returns {NextResponse} Una respuesta JSON indicando el éxito de la eliminación o un mensaje de error.
 * @throws {NextResponse} Retorna un error 401 si el usuario no está autorizado (sesión no iniciada o inválida). Retorna un error 400 si el ID del cuento no es proporcionado. Retorna un error 404 si el cuento no es encontrado. Retorna un error 500 si ocurre un error interno del servidor.
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Validar si el token está revocado
    const revokedResponse = await rejectIfTokenRevoked(request);
    if (revokedResponse) return revokedResponse;
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session) {
            return NextResponse.json(
                { error: "No autorizado: Sesión no iniciada" },
                { status: 401 }
            );
        }
        if (!session.user?.id) {
            return NextResponse.json(
                { error: "No autorizado: Sesión inválida" },
                { status: 401 }
            );
        }

        const params = await context.params;
        const storyId = params.id;

        if (!storyId) {
            return NextResponse.json(
                { error: "ID de cuento requerido" },
                { status: 400 }
            );
        }

        // Verificar que el cuento existe y pertenece al usuario
        const existingStory = await getStoryById(storyId, session.user.id);
        if (!existingStory) {
            return NextResponse.json(
                { error: "Cuento no encontrado" },
                { status: 404 }
            );
        }

        // Eliminar el cuento
        await deleteStory(storyId, session.user.id);

        return NextResponse.json({
            success: true,
            message: "Cuento eliminado correctamente",
        });
    } catch (error) {
        console.error("Error in DELETE /api/stories/[id]:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error al eliminar el cuento",
            },
            { status: 500 }
        );
    }
}
