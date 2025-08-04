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
