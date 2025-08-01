'use client';

import Link from 'next/link';
import { BookOpen, Trash2 } from 'lucide-react';
import type { Story } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SavedStoriesListProps = {
  stories: Story[];
  onDelete: (id: string) => void;
};

export default function SavedStoriesList({ stories, onDelete }: SavedStoriesListProps) {
  if (stories.length === 0) {
    return (
      <div className="text-center py-16 px-8 mt-12 bg-card rounded-lg shadow-inner border-dashed border-2">
        <h3 className="text-2xl font-bold font-headline text-foreground">Tu Libro de Cuentos está Vacío</h3>
        <p className="mt-2 text-muted-foreground">¡Crea tu primer cuento para verlo aquí!</p>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold font-headline text-center mb-8 text-foreground">
        Mis Cuentos Guardados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <Card key={story.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="font-headline truncate">{story.title}</CardTitle>
              <CardDescription>Un cuento de {story.theme.toLowerCase()} sobre {story.mainCharacterName}.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground line-clamp-3">{story.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="outline">
                <Link href={`/stories/${story.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Leer Cuento
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto eliminará permanentemente "{story.title}". Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(story.id)} className="bg-destructive hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
