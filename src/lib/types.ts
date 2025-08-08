/**
 * @module types
 * @description Este módulo define tipos de datos TypeScript utilizados en la aplicación.
 */

/**
 * @typedef {object} Story
 * @description Representa la estructura de un cuento en la aplicación.
 * @property {string} id - El ID único del cuento.
 * @property {string} theme - El tema principal del cuento.
 * @property {string} mainCharacterName - El nombre del personaje principal del cuento.
 * @property {string} mainCharacterTraits - Los rasgos o características del personaje principal.
 * @property {string} title - El título del cuento.
 * @property {string} content - El contenido textual del cuento.
 * @property {string} createdAt - La fecha y hora de creación del cuento en formato ISO string.
 * @property {string} [imageUrl] - La URL de la imagen asociada al cuento (opcional).
 * @property {boolean} [favorite] - Indica si el cuento es favorito (opcional).
 * @property {number} [extendedCount] - El número de veces que el cuento ha sido extendido (opcional).
 * @property {boolean} [isGeneratingSpeech] - Indica si el audio del cuento se está generando (opcional).
 * @property {string | null} [audioSrc] - La URL o URI del audio del cuento (opcional, puede ser null).
 */
export type Story = {
    id: string;
    theme: string;
    mainCharacterName: string;
    mainCharacterTraits: string;
    title: string;
    content: string;
    createdAt: string;
    imageUrl?: string;
    favorite?: boolean;
    extendedCount?: number;
    isGeneratingSpeech?: boolean; // Campo para indicar si el audio se está generando
    audioSrc?: string | null; // Campo para almacenar el URI del audio
};
