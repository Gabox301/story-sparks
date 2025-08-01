"use client";

import { cn } from "@/lib/utils";

interface StorySkeletonProps {
  className?: string;
}

export default function StorySkeleton({ className }: StorySkeletonProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Skeleton para el título */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded-md animate-pulse w-3/4 mx-auto" />
        <div className="h-4 bg-muted rounded-md animate-pulse w-1/2 mx-auto" />
      </div>
      
      {/* Skeleton para la imagen */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/7] lg:aspect-[16/6] my-8">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30 rounded-md animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse mx-auto" />
            <div className="h-3 bg-muted rounded animate-pulse w-24 mx-auto" />
            <div className="h-3 bg-muted rounded animate-pulse w-32 mx-auto" />
          </div>
        </div>
      </div>
      
      {/* Skeleton para el contenido */}
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}
