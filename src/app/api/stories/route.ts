import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { 
    createStory, 
    getUserStories, 
    deleteAllUserStories,
    searchUserStories,
    getUserStoriesStats 
} from "@/lib/story-service";

// Schema para crear un cuento
const createStorySchema = z.object({
    theme: z.string().min(1, "El tema es requerido"),
    mainCharacterName: z.string().min(1, "El nombre del personaje es requerido"),
    mainCharacterTraits: z.string().min(1, "Los rasgos del personaje son requeridos"),
    title: z.string().min(1, "El título es requerido"),
    content: z.string().min(1, "El contenido es requerido"),
    imageUrl: z.string().url().optional(),
});

// Schema para búsqueda de cuentos
const searchStoriesSchema = z.object({
    search: z.string().min(1, "El texto de búsqueda es requerido"),
});

/**
 * GET /api/stories
 * Obtiene todos los cuentos del usuario autenticado
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
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
        console.error("Error in GET /api/stories:", error);
        return NextResponse.json(
            { 
                success: false,
                error: "Error al obtener los cuentos" 
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/stories
 * Crea un nuevo cuento para el usuario autenticado
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json(
                { error: "No autorizado" },
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

            return NextResponse.json({
                success: true,
                data: { story },
            }, { status: 201 });
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
        console.error("Error in POST /api/stories:", error);
        return NextResponse.json(
            { 
                success: false,
                error: "Error al crear el cuento" 
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/stories
 * Elimina todos los cuentos del usuario autenticado
 */
export async function DELETE(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
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
                error: "Error al eliminar los cuentos" 
            },
            { status: 500 }
        );
    }
}
