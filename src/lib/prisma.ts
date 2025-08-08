import { PrismaClient } from "../generated/prisma";

// Extiende el objeto global para incluir la instancia de PrismaClient
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Inicializa la instancia de PrismaClient o usa la existente en el objeto global
// Esto asegura que solo haya una instancia de PrismaClient en desarrollo
// para evitar problemas con el hot-reloading de Next.js.
const prisma = global.prisma || new PrismaClient();

// En entorno de desarrollo, asigna la instancia de Prisma al objeto global
// para que se preserve entre recargas de módulos.
if (process.env.NODE_ENV === "development") {
    global.prisma = prisma;
}

// Exporta la instancia de PrismaClient para ser utilizada en toda la aplicación.
export default prisma;
