import { PrismaClient } from "../generated/prisma";

// This file provides a more robust Prisma client initialization for edge/serverless environments

let prisma: PrismaClient;

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

// Function to create Prisma client with proper configuration
function createPrismaClient() {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        datasources: {
            db: {
                url: process.env.BBDD_DATABASE_URL || process.env.DATABASE_URL,
            },
        },
    });
}

// Initialize Prisma client
if (process.env.NODE_ENV === "production") {
    // In production, create a new instance for each request
    // This is better for serverless environments
    prisma = createPrismaClient();
} else {
    // In development, use a global variable to prevent
    // exhausting database connections during hot reloading
    if (!global.__prisma) {
        global.__prisma = createPrismaClient();
    }
    prisma = global.__prisma;
}

// Ensure proper cleanup in serverless environments
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    // Set up cleanup for serverless functions
    process.on("beforeExit", async () => {
        await prisma.$disconnect();
    });
}

export default prisma;
