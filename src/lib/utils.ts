/**
 * @module utils
 * @description Este módulo contiene funciones de utilidad generales utilizadas en toda la aplicación.
 * Incluye funciones para la manipulación de clases CSS y la limpieza de texto.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases CSS utilizando clsx y tailwind-merge.
 * Esto permite una gestión de clases más robusta, especialmente con Tailwind CSS.
 * @param {ClassValue[]} inputs - Un array de valores de clase que pueden ser strings, objetos o arrays.
 * @returns {string} Una cadena de clases CSS combinadas.
 */
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
    return text.replace(/[#\*\-]/g, "");
}
