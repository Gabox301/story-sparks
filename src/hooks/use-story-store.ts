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

  useEffect(() => {
    try {
      const storedStories = localStorage.getItem(STORY_STORAGE_KEY);
      if (storedStories) {
        setStories(JSON.parse(storedStories));
      }
    } catch (error) {
      console.error('Failed to load stories from localStorage', error);
    }
  }, []);

  const saveStories = (newStories: Story[]) => {
    try {
      setStories(newStories);
      localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(newStories));
    } catch (error) {
      console.error('Failed to save stories to localStorage', error);
    }
  };

  const addStory = useCallback((storyData: Omit<Story, 'id' | 'createdAt'>) => {
    const newStory: Story = {
      ...storyData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updatedStories = [newStory, ...stories];
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

  return { stories, addStory, updateStory, removeStory, getStory };
}
