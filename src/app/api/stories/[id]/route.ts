import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { 
    getStoryById, 
    updateStory, 
    deleteStory 
} from "@/lib/story-service";

// Schema para actualizar un cuento
const updateStorySchema = z.object({
    content: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    audioUrl: z.string().url().optional().or(z.literal("")),
    extendedCount: z.number().int().min(0).optional(),
    favorite: z.boolean().optional(),
});

/**
 * GET /api/stories/[id]
 * Obtiene un cuento específico por ID
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
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
                error: "Error al obtener el cuento" 
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/stories/[id]
 * Actualiza un cuento específico
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json(
                { error: "No autorizado" },
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
                        details: validationError.errors 
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
                error: "Error al actualizar el cuento" 
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/stories/[id]
 * Elimina un cuento específico
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
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
                error: "Error al eliminar el cuento" 
            },
            { status: 500 }
        );
    }
}
