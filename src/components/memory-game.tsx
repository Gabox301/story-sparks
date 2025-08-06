/**
 * @fileoverview Componente para el mini juego de memoria.
 * Este componente mostrará un juego de memoria simple para entretener al usuario
 * mientras se genera el audio de la historia.
 */

import React, { useState, useEffect } from "react";

/**
 * @interface Card
 * @description Define la estructura de una carta individual en el juego de memoria.
 * @property {number} id - Identificador único de la carta.
 * @property {string} value - El valor o símbolo de la carta (ej. '🍎').
 * @property {boolean} isFlipped - Indica si la carta está volteada boca arriba.
 * @property {boolean} isMatched - Indica si la carta ya ha sido emparejada.
 */
interface Card {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
}

/**
 * @interface MemoryGameProps
 * @description Define las propiedades del componente MemoryGame.
 * @property {function} [onGameComplete] - Función opcional que se ejecuta cuando el juego se completa.
 */
interface MemoryGameProps {
    onGameComplete?: () => void;
}

const initialCards: string[] = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍍"];

/**
 * @function shuffleArray
 * @description Mezcla aleatoriamente los elementos de un array (algoritmo de Fisher-Yates).
 * @param {any[]} array - El array a mezclar.
 * @returns {any[]} El array mezclado.
 */
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const MemoryGame: React.FC<MemoryGameProps> = ({ onGameComplete }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matches, setMatches] = useState<number>(0);
    const [canFlip, setCanFlip] = useState<boolean>(true);

    useEffect(() => {
        initializeGame();
    }, []);

    /**
     * @description Efecto que se ejecuta cuando el número de cartas emparejadas cambia.
     * Si todas las cartas han sido emparejadas (el número de `matches` es igual al número de valores únicos en `initialCards`),
     * se invoca la función `onGameComplete` si está definida.
     */
    useEffect(() => {
        // El juego se completa cuando el número de pares encontrados (matches) es igual al número de cartas únicas iniciales.
        // Esto se debe a que `initialCards` contiene los valores únicos, y cada valor tiene un par.
        if (matches === initialCards.length) {
            if (onGameComplete) {
                onGameComplete();
            }
        }
    }, [matches, onGameComplete]);

    /**
     * @function initializeGame
     * @description Inicializa el estado del juego, creando y mezclando las cartas.
     * Duplica las cartas iniciales para formar pares, asigna IDs únicos y reinicia los estados de volteo y emparejamiento.
     */
    const initializeGame = () => {
        const duplicatedCards = [...initialCards, ...initialCards].map(
            (value, index) => ({
                id: index,
                value,
                isFlipped: false,
                isMatched: false,
            })
        );
        setCards(shuffleArray(duplicatedCards));
        setFlippedCards([]);
        setMatches(0);
        setCanFlip(true);
    };

    /**
     * @function handleCardClick
     * @description Maneja el evento de clic en una carta.
     * Voltea la carta si es posible (no hay dos cartas ya volteadas y no está ya volteada o emparejada).
     * @param {number} id - El ID de la carta en la que se hizo clic.
     */
    const handleCardClick = (id: number) => {
        // Evita voltear cartas si no se puede (ej. esperando a que se oculten las cartas no emparejadas) o si ya hay dos cartas volteadas.
        if (!canFlip || flippedCards.length === 2) return;

        setCards((prevCards) =>
            prevCards.map((card) =>
                card.id === id ? { ...card, isFlipped: true } : card
            )
        );

        setFlippedCards((prev) => [...prev, id]);
    };

    useEffect(() => {
        if (flippedCards.length === 2) {
            setCanFlip(false);
            const [firstCardId, secondCardId] = flippedCards;
            const firstCard = cards.find((card) => card.id === firstCardId);
            const secondCard = cards.find((card) => card.id === secondCardId);

            if (
                firstCard &&
                secondCard &&
                firstCard.value === secondCard.value
            ) {
                setCards((prevCards) =>
                    prevCards.map((card) =>
                        card.id === firstCardId || card.id === secondCardId
                            ? { ...card, isMatched: true }
                            : card
                    )
                );
                setMatches((prev) => prev + 1);
                setFlippedCards([]);
                setCanFlip(true);
            } else {
                setTimeout(() => {
                    setCards((prevCards) =>
                        prevCards.map((card) =>
                            card.id === firstCardId || card.id === secondCardId
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                    setFlippedCards([]);
                    setCanFlip(true);
                }, 1000);
            }
        }
    }, [flippedCards, cards]);

    return (
        <div className="flex flex-col items-center justify-center px-4 pt-1">
            <div className="grid grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className={`w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-4xl cursor-pointer
              ${
                  card.isFlipped || card.isMatched
                      ? "bg-blue-300"
                      : "bg-gray-400"
              }
              ${card.isMatched ? "opacity-50 cursor-not-allowed" : ""}
            `}
                        onClick={() =>
                            !card.isFlipped &&
                            !card.isMatched &&
                            handleCardClick(card.id)
                        }
                    >
                        {card.isFlipped || card.isMatched ? card.value : "?"}
                    </div>
                ))}
            </div>
            {matches === initialCards.length && (
                <div className="mt-4 flex flex-col items-center">
                    <p className="text-lg font-semibold mb-2">
                        ¡Juego Completado!
                    </p>
                    <button
                        onClick={initializeGame}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Volver a Jugar
                    </button>
                </div>
            )}
        </div>
    );
};

export default MemoryGame;
