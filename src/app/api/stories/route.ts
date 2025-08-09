/**
 * @module /api/stories/route
 * @description Este módulo define las rutas API para la gestión de cuentos (historias) en la aplicación.
 * Permite a los usuarios autenticados crear, obtener y buscar sus cuentos.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import {
    createStory,
    getUserStories,
    deleteAllUserStories,
    searchUserStories,
    getUserStoriesStats,
} from "@/lib/story-service";
import { rejectIfTokenRevoked } from "@/lib/reject-revoked-token";

/**
 * @const createStorySchema
 * @description Esquema de validación para la creación de un cuento, utilizando Zod.
 * @property {string} theme - El tema del cuento (requerido).
 * @property {string} mainCharacterName - El nombre del personaje principal (requerido).
 * @property {string} mainCharacterTraits - Los rasgos del personaje principal (requerido).
 * @property {string} title - El título del cuento (requerido).
 * @property {string} content - El contenido del cuento (requerido).
 * @property {string} [imageUrl] - La URL de la imagen asociada al cuento (opcional, debe ser una URL válida).
 */
const createStorySchema = z.object({
    theme: z.string().min(1, "El tema es requerido"),
    mainCharacterName: z
        .string()
        .min(1, "El nombre del personaje es requerido"),
    mainCharacterTraits: z
        .string()
        .min(1, "Los rasgos del personaje son requeridos"),
    title: z.string().min(1, "El título es requerido"),
    content: z.string().min(1, "El contenido es requerido"),
    imageUrl: z.string().url().optional(),
});

/**
 * @const searchStoriesSchema
 * @description Esquema de validación para la búsqueda de cuentos, utilizando Zod.
 * @property {string} search - El texto de búsqueda (requerido).
 */
const searchStoriesSchema = z.object({
    search: z.string().min(1, "El texto de búsqueda es requerido"),
});

/**
 * @function GET
 * @description Manejador para las solicitudes GET a `/api/stories`.
 * Obtiene todos los cuentos del usuario autenticado o busca cuentos si se proporciona un parámetro de búsqueda.
 * Opcionalmente, puede incluir estadísticas de cuentos.
 * @param {NextRequest} request - La solicitud Next.js entrante.
 * @returns {NextResponse} Una respuesta JSON con los cuentos del usuario y, opcionalmente, estadísticas.
 * @throws {NextResponse} Retorna un error 401 si el usuario no está autorizado (sesión no iniciada o inválida) o un error 500 si ocurre un problema en el servidor.
 */
export async function GET(request: NextRequest) {
    // Verificar si el token está revocado
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

        const url = new URL(request.url);
        const search = url.searchParams.get("search");
        const includeStats = url.searchParams.get("includeStats") === "true";

        let stories;
        if (search && search.trim()) {
            // Buscar cuentos por texto
            stories = await searchUserStories(session.user.id, search.trim());
        } else {
            // Obtener todos los cuentos
            stories = await getUserStories(session.user.id);
        }

        const responseData: any = { stories };

        // Incluir estadísticas si se solicita
        if (includeStats) {
            const stats = await getUserStoriesStats(session.user.id);
            responseData.stats = stats;
        }

        return NextResponse.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error("Error in DELETE /api/stories:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error al eliminar los cuentos",
            },
            { status: 500 }
        );
    }
}

// Asegura que este endpoint use el runtime Node.js (no edge)

//
export async function POST(request: NextRequest) {
    // Verificar si el token está revocado
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

        // Validar datos de entrada
        const body = await request.json();

        try {
            const validatedData = createStorySchema.parse(body);

            // Crear el cuento
            const story = await createStory({
                ...validatedData,
                userId: session.user.id,
                userEmail: session.user.email,
            });

            return NextResponse.json(
                {
                    success: true,
                    data: { story },
                },
                { status: 201 }
            );
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
        console.error("Error in POST /api/stories:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error al crear el cuento",
            },
            { status: 500 }
        );
    }
}

// DELETE /api/stories
// Elimina todos los cuentos del usuario autenticado
export async function DELETE(request: NextRequest) {
    // Verificar si el token está revocado
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

        // Eliminar todos los cuentos del usuario
        await deleteAllUserStories(session.user.id);

        return NextResponse.json({
            success: true,
            message: "Todos los cuentos han sido eliminados",
        });
    } catch (error) {
        console.error("Error in DELETE /api/stories:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error al eliminar los cuentos",
            },
            { status: 500 }
        );
    }
}

// Asegura que este endpoint use el runtime Node.js (no edge)
export const runtime = "nodejs";
