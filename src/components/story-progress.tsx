"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const progressMessages = [
  "Creando a tu personaje...",
  "Imaginando la aventura...",
  "Añadiendo magia...",
  "Ilustrando tu cuento...",
  "Preparando la sorpresa final..."
];

interface StoryProgressProps {
  isLoading: boolean;
  className?: string;
}

export default function StoryProgress({ isLoading, className }: StoryProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(progressMessages[0]);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setCurrentMessage(progressMessages[0]);
      return;
    }

    const totalDuration = 8000; // 8 segundos
    const messageInterval = totalDuration / progressMessages.length;
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (totalDuration / 100));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    const messageTimeout = setTimeout(() => {
      setCurrentMessage(progressMessages[1]);
    }, messageInterval);

    const messageTimeout2 = setTimeout(() => {
      setCurrentMessage(progressMessages[2]);
    }, messageInterval * 2);

    const messageTimeout3 = setTimeout(() => {
      setCurrentMessage(progressMessages[3]);
    }, messageInterval * 3);

    const messageTimeout4 = setTimeout(() => {
      setCurrentMessage(progressMessages[4]);
    }, messageInterval * 4);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(messageTimeout);
      clearTimeout(messageTimeout2);
      clearTimeout(messageTimeout3);
      clearTimeout(messageTimeout4);
    };
  }, [isLoading]);

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
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
