/**
 * Prisma warm-up utility for serverless environments
 * This helps reduce cold start times by pre-connecting to the database
 */

import prisma from './prisma';

let isWarmedUp = false;

export async function warmupPrisma() {
    if (isWarmedUp) {
        return;
    }

    try {
        // Execute a simple query to warm up the connection
        await prisma.$queryRaw`SELECT 1`;
        isWarmedUp = true;
        console.log('✅ Prisma warmed up successfully');
    } catch (error) {
        console.error('⚠️ Failed to warm up Prisma:', error);
        // Don't throw - allow the request to continue
    }
}

// Reset warm-up status periodically (for long-running processes)
if (typeof window === 'undefined') {
    setInterval(() => {
        isWarmedUp = false;
    }, 5 * 60 * 1000); // Reset every 5 minutes
}
