/**
 * @module NextAuthTypes
 * @description Este módulo extiende los tipos de NextAuth para incluir propiedades personalizadas
 * en los objetos `Session`, `User` y `JWT`.
 * Esto permite una tipificación segura de los datos de usuario y sesión en toda la aplicación.
 */

import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
    }
}
