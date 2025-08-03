import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Limpia el texto de un cuento, eliminando caracteres especiales como #, *, -,
 * pero respetando los saltos de línea.
 * @param {string} text - El texto del cuento a limpiar.
 * @returns {string} El texto limpio.
 */
export function cleanStoryText(text: string): string {
  // Elimina caracteres especiales como #, *, -, pero mantiene los saltos de línea.
  // La expresión regular `[#\*\-]` busca los caracteres #, *, o -.
  // La bandera `g` asegura que se reemplacen todas las ocurrencias.
  return text.replace(/[#\*\-]/g, '');
}
