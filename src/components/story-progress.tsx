"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

// Mensajes por defecto para la generación de cuentos
const defaultProgressMessages = [
    "Creando a tu personaje...",
    "Imaginando la aventura...",
    "Añadiendo magia...",
    "Ilustrando tu cuento...",
    "Preparando la sorpresa final...",
];

interface StoryProgressProps {
    isLoading: boolean;
    isFinished?: boolean; // Nuevo prop para indicar si el proceso real ha terminado
    messages?: string[]; // Nuevo prop para mensajes de progreso personalizados
    className?: string;
}

export default function StoryProgress({
    isLoading,
    isFinished = false,
    messages,
    className,
}: StoryProgressProps) {
    const currentMessages = messages || defaultProgressMessages; // Usar mensajes personalizados o los por defecto
    const [progress, setProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(currentMessages[0]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        if (!isLoading) {
            // Resetear el estado cuando no está cargando
            setProgress(0);
            setCurrentMessage(currentMessages[0]);
            if (intervalRef.current) clearInterval(intervalRef.current);
            timeoutRefs.current.forEach(clearTimeout);
            return;
        }

        const totalSimulatedDuration = 15000; // Duración simulada más larga para la generación de audio
        const messageInterval = totalSimulatedDuration / currentMessages.length;

        // Limpiar intervalos y timeouts anteriores antes de iniciar nuevos
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRefs.current.forEach(clearTimeout);
        timeoutRefs.current = [];

        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                // Si el proceso real ha terminado, forzar el 100%
                if (isFinished) {
                    if (prev < 100) return 100; // Asegurar que llegue a 100
                    return prev;
                }
                // Simular progreso hasta un 95% si no ha terminado
                const newProgress = prev + 95 / (totalSimulatedDuration / 100);
                return newProgress >= 95 ? 95 : newProgress; // Limitar a 95% si no ha terminado
            });
        }, 100);

        currentMessages.forEach((message, index) => {
            if (index > 0) {
                const timeout = setTimeout(() => {
                    setCurrentMessage(message);
                }, messageInterval * index);
                timeoutRefs.current.push(timeout);
            }
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            timeoutRefs.current.forEach(clearTimeout);
        };
    }, [isLoading, isFinished, messages]);

    if (!isLoading) return null;

    return (
        <div className={cn("w-full space-y-3", className)}>
            <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-2 animate-pulse">
                    {currentMessage}
                </p>
            </div>
            <div className="relative w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </div>
            </div>
            <div className="text-center">
                <span className="text-xs text-muted-foreground">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
}
