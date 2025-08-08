import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getUserStories, getUserStoriesStats } from "@/lib/story-service";

/**
 * GET /api/users/by-email
 * Busca un usuario por email y devuelve sus datos junto con sus cuentos
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

        // Obtener email del query parameter
        const url = new URL(request.url);
        const email = url.searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "El parámetro 'email' es requerido" },
                { status: 400 }
            );
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "El formato del email no es válido" },
                { status: 400 }
            );
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                isEmailVerified: true,
                emailVerifiedAt: true,
                // No incluir información sensible como password o tokens
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        // Obtener las historias del usuario
        const [stories, stats] = await Promise.all([
            getUserStories(user.id),
            getUserStoriesStats(user.id),
        ]);

        // Preparar respuesta
        const responseData = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                isEmailVerified: user.isEmailVerified,
                emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
            },
            stories: stories.map(story => ({
                id: story.id,
                title: story.title,
                theme: story.theme,
                mainCharacterName: story.mainCharacterName,
                mainCharacterTraits: story.mainCharacterTraits,
                content: story.content,
                favorite: story.favorite,
                extendedCount: story.extendedCount,
                createdAt: story.createdAt,
                imageUrl: story.imageUrl,
                audioUrl: story.audioUrl,
                textFileUrl: story.textFileUrl,
            })),
            stats: {
                totalStories: stats.totalStories,
                favoriteStories: stats.favoriteStories,
            },
        };

        return NextResponse.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error("Error in GET /api/users/by-email:", error);
        return NextResponse.json(
            { 
                success: false,
                error: "Error interno del servidor" 
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/users/by-email
 * Alternativa usando POST para buscar usuario por email (más seguro para información sensible)
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        // Obtener datos del body
        const body = await request.json();
        const { email, includeStories = true, includeStats = true } = body;

        if (!email) {
            return NextResponse.json(
                { error: "El campo 'email' es requerido" },
                { status: 400 }
            );
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "El formato del email no es válido" },
                { status: 400 }
            );
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                isEmailVerified: true,
                emailVerifiedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        // Preparar datos base del usuario
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            isEmailVerified: user.isEmailVerified,
            emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
        };

        const responseData: any = { user: userData };

        // Obtener historias si se solicita
        if (includeStories) {
            const stories = await getUserStories(user.id);
            responseData.stories = stories.map(story => ({
                id: story.id,
                title: story.title,
                theme: story.theme,
                mainCharacterName: story.mainCharacterName,
                mainCharacterTraits: story.mainCharacterTraits,
                content: story.content,
                favorite: story.favorite,
                extendedCount: story.extendedCount,
                createdAt: story.createdAt,
                imageUrl: story.imageUrl,
                audioUrl: story.audioUrl,
                textFileUrl: story.textFileUrl,
            }));
        }

        // Obtener estadísticas si se solicita
        if (includeStats) {
            const stats = await getUserStoriesStats(user.id);
            responseData.stats = {
                totalStories: stats.totalStories,
                favoriteStories: stats.favoriteStories,
            };
        }

        return NextResponse.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error("Error in POST /api/users/by-email:", error);
        return NextResponse.json(
            { 
                success: false,
                error: "Error interno del servidor" 
            },
            { status: 500 }
        );
    }
}
