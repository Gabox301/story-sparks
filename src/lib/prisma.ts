/**
 * @module prismaClient
 * @description Este módulo inicializa y exporta una instancia de PrismaClient.
 * Configura el registro de consultas, errores y advertencias en entornos de desarrollo
 * y solo errores en producción para optimizar el rendimiento y la verbosidad.
 * Utiliza un enfoque global para asegurar que solo haya una instancia de PrismaClient
 * en Next.js, evitando múltiples conexiones a la base de datos en el hot-reloading.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
