'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Story } from '@/lib/types';

const STORY_STORAGE_KEY = 'story-spark-stories';

type StoryUpdate = {
  content?: string;
  imageUrl?: string;
}

export function useStoryStore() {
  const [stories, setStories] = useState<Story[]>([]);
  const MAX_STORIES = 20; // Límite máximo de historias para evitar problemas de almacenamiento

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedStories = localStorage.getItem(STORY_STORAGE_KEY);
      if (storedStories) {
        const parsedStories = JSON.parse(storedStories);
        // Limitar historias al cargar
        const limitedStories = parsedStories.slice(0, MAX_STORIES);
        setStories(limitedStories);
        
        // Si había más historias, actualizar el almacenamiento
        if (parsedStories.length > MAX_STORIES) {
          localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(limitedStories));
        }
      }
    } catch (error) {
      console.error('Failed to load stories from localStorage', error);
    }
  }, []);

  const saveStories = (newStories: Story[]) => {
    try {
      // Ordenar historias: favoritos primero, luego por fecha (más recientes primero)
      const sortedStories = [...newStories].sort((a, b) => {
        // Primero por estado de favorito (true primero)
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        // Luego por fecha de creación (más recientes primero)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setStories(sortedStories);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(sortedStories));
      }
    } catch (error) {
      console.error('Failed to save stories to localStorage', error);
      
      // Si el error es por cuota excedida, intentar con menos historias
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting to reduce stored stories');
        
        // Eliminar historias antiguas hasta que quepan
        const maxStories = Math.max(1, Math.floor(newStories.length * 0.7));
        const reducedStories = newStories.slice(0, maxStories);
        
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(reducedStories));
          }
          setStories(reducedStories);
          console.log(`Reduced stories from ${newStories.length} to ${reducedStories.length}`);
        } catch (secondError) {
          console.error('Failed to save even reduced stories', secondError);
          
          // Si aún falla, limpiar todo el almacenamiento
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORY_STORAGE_KEY);
          }
          setStories([]);
          
          // Notificar al usuario
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('storageQuotaExceeded'));
          }
        }
      }
    }
  };

  const addStory = useCallback((storyData: Omit<Story, 'id' | 'createdAt'>) => {
    const newStory: Story = {
      ...storyData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    // Mantener solo las historias más recientes dentro del límite
    const updatedStories = [newStory, ...stories].slice(0, MAX_STORIES);
    saveStories(updatedStories);
    return newStory;
  }, [stories]);

  const updateStory = useCallback((storyId: string, updates: StoryUpdate) => {
    const updatedStories = stories.map((story) =>
      story.id === storyId ? { ...story, ...updates } : story
    );
    saveStories(updatedStories);
  }, [stories]);

  const removeStory = useCallback((storyId: string) => {
    const updatedStories = stories.filter((story) => story.id !== storyId);
    saveStories(updatedStories);
  }, [stories]);

  const getStory = useCallback((storyId: string) => {
    return stories.find((story) => story.id === storyId);
  }, [stories]);

  const clearAllStories = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORY_STORAGE_KEY);
      }
      setStories([]);
    } catch (error) {
      console.error('Failed to clear stories from localStorage', error);
    }
  }, []);

  const getStorageStats = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        return {
        storyCount: stories.length,
        sizeInKB: 0,
        maxStories: MAX_STORIES,
        storageUsed: ''
      };
      }
      
      const storedStories = localStorage.getItem(STORY_STORAGE_KEY);
      const sizeInBytes = storedStories ? new Blob([storedStories]).size : 0;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      
      return {
        storyCount: stories.length,
        sizeInKB: 0,
        maxStories: MAX_STORIES,
        storageUsed: ''
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        storyCount: stories.length,
        sizeInKB: 0,
        maxStories: MAX_STORIES,
        storageUsed: ''
      };
    }
  }, [stories]);

  const toggleFavorite = useCallback((storyId: string) => {
    const updatedStories = stories.map((story) =>
      story.id === storyId ? { ...story, favorite: !story.favorite } : story
    );
    saveStories(updatedStories);
  }, [stories]);

  const getFavoriteStories = useCallback(() => {
    return stories.filter(story => story.favorite);
  }, [stories]);

  const exportStories = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      
      const dataStr = JSON.stringify(stories, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-sparks-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export stories', error);
    }
  }, [stories]);

  return { 
    stories, 
    addStory, 
    updateStory, 
    removeStory, 
    getStory, 
    clearAllStories, 
    getStorageStats, 
    exportStories,
    toggleFavorite,
    getFavoriteStories
  };
}
