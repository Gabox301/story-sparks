# Guía de Migración a Base de Datos

Esta guía te ayudará a migrar tu aplicación Story Sparks de almacenamiento local a base de datos PostgreSQL con Prisma.

## Pasos de Migración

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env.local`:

```bash
# Base de datos
BBDD_DATABASE_URL="postgresql://usuario:password@localhost:5432/story_sparks"

# NextAuth
NEXTAUTH_SECRET="tu_secret_muy_seguro_aqui"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob (para archivos multimedia)
BLOB_READ_WRITE_TOKEN="tu_vercel_blob_token"
```

### 2. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 3. Ejecutar Migraciones

```bash
# Crear y aplicar la migración
npx prisma migrate dev --name init

# O si ya tienes una base de datos existente
npx prisma db push
```

### 4. Verificar la Base de Datos

```bash
# Abrir Prisma Studio para ver las tablas
npx prisma studio
```

## Nuevas Funcionalidades

### Estructura de Archivos en Blob Storage

Los archivos se organizan por usuario:
```
email_usuario@example_com/
├── texts/
│   ├── story-id-1_titulo-cuento.txt
│   └── story-id-2_otro-titulo.txt
├── images/
│   ├── story-id-1_image.jpg
│   └── story-id-2_image.png
└── audios/
    ├── story-id-1_hash123.wav
    └── story-id-2_hash456.wav
```

### API Endpoints Disponibles

1. **GET/POST /api/users/by-email** - Buscar usuario por email
2. **GET/POST/DELETE /api/stories** - Gestionar cuentos del usuario
3. **GET/PUT/DELETE /api/stories/[id]** - Operaciones en cuento específico

### Nuevos Hooks

- `useDatabaseStoryStore` - Reemplaza al `useStoryStore` anterior
- `useAuth` - Manejo centralizado de autenticación

## Migración de Datos Existentes

Si tienes datos en localStorage, puedes crear un script de migración:

```typescript
// scripts/migrate-local-storage.ts
import { createStory } from "@/lib/story-service";

async function migrateFromLocalStorage(userId: string, userEmail: string) {
    const localStories = localStorage.getItem('story-spark-stories');
    
    if (localStories) {
        const stories = JSON.parse(localStories);
        
        for (const story of stories) {
            try {
                await createStory({
                    theme: story.theme,
                    mainCharacterName: story.mainCharacterName,
                    mainCharacterTraits: story.mainCharacterTraits,
                    title: story.title,
                    content: story.content,
                    imageUrl: story.imageUrl,
                    userId,
                    userEmail,
                });
            } catch (error) {
                console.error('Error migrating story:', error);
            }
        }
    }
}
```

## Características Mejoradas

### 1. Persistencia Real
- Los cuentos se guardan en PostgreSQL
- No se pierden al limpiar el navegador
- Acceso desde cualquier dispositivo

### 2. Archivos Multimedia Organizados
- Estructura de carpetas por usuario
- URLs permanentes para archivos
- Mejor gestión de almacenamiento

### 3. API RESTful Completa
- Endpoints estándar para todas las operaciones
- Validación de datos con Zod
- Manejo de errores mejorado

### 4. Autenticación Robusta
- Sesiones de 30 días
- Middleware de protección automática
- Gestión centralizada de auth

### 5. Búsqueda Avanzada
- Búsqueda en título, contenido, tema y personajes
- Consultas insensibles a mayúsculas/minúsculas
- Resultados indexados para mejor rendimiento

## Verificación Post-Migración

1. **Crear un cuento nuevo** - Debería guardarse en la base de datos
2. **Generar audio** - Debería guardarse en la estructura de carpetas
3. **Buscar por email** - Usar el endpoint para verificar datos
4. **Cerrar sesión y volver a entrar** - Los cuentos deben persistir

## Rollback

Si necesitas volver atrás:

1. Cambiar el import en `src/app/home/page.tsx`:
```typescript
// De:
import { useDatabaseStoryStore as useStoryStore } from "@/hooks/use-database-story-store";

// A:
import { useStoryStore } from "@/hooks/use-story-store";
```

2. Comentar el middleware de autenticación temporalmente.

## Soporte

Si encuentras problemas:

1. Verifica las variables de entorno
2. Asegúrate de que PostgreSQL esté corriendo
3. Revisa los logs de la consola del navegador
4. Verifica las conexiones de red en las dev tools
