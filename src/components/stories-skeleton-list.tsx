/**
 * @module StoriesSkeletonListModule
 * @description Este módulo contiene el componente `StoriesSkeletonList`,
 * que proporciona un esqueleto de carga visual para la lista de cuentos.
 * Se utiliza para mejorar la experiencia del usuario mostrando un estado de carga
 * mientras se recuperan los datos reales de los cuentos.
 */

"use client";

import { Card } from "@/components/ui/card";

export default function StoriesSkeletonList() {
  return (
    <div className="mt-16">
      <div className="h-8 bg-muted rounded-md animate-pulse w-64 mx-auto mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="flex flex-col animate-pulse">
            <div className="p-6 space-y-3">
              <div className="h-6 bg-muted rounded-md w-3/4" />
              <div className="h-4 bg-muted rounded-md w-full" />
              <div className="h-4 bg-muted rounded-md w-5/6" />
            </div>
            <div className="p-6 pt-0 space-y-2">
              <div className="h-4 bg-muted rounded-md w-full" />
              <div className="h-4 bg-muted rounded-md w-4/5" />
              <div className="h-4 bg-muted rounded-md w-3/5" />
            </div>
            <div className="p-6 pt-0 mt-auto flex justify-between">
              <div className="h-10 bg-muted rounded-md w-28" />
              <div className="h-10 w-10 bg-muted rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
