"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, LoaderCircle, AlertCircle } from "lucide-react";
import StoryProgress from "@/components/story-progress";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import AnimatedButton from "@/components/animated-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateStoryAction } from "@/app/actions";
import type { Story } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const themes = [
    "Aventura",
    "Misterio",
    "Fantasía",
    "Ciencia Ficción",
    "Cuento de Hadas",
    "Princesas",
    "Duendes",
];

const formSchema = z.object({
    theme: z.string().min(1, "Por favor selecciona un tema."),
    mainCharacterName: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres.")
        .max(50),
    mainCharacterTraits: z
        .string()
        .min(10, "Describe al personaje en al menos 10 caracteres.")
        .max(200),
});

type StoryGeneratorFormProps = {
    onStoryGenerated: (story: Omit<Story, "id" | "createdAt">) => void;
    storageStats: {
        storyCount: number;
        sizeInKB: number;
        maxStories: number;
        storageUsed: string;
    };
};

export default function StoryGeneratorForm({
    onStoryGenerated,
    storageStats,
}: StoryGeneratorFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showLimitReachedDialog, setShowLimitReachedDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (storageStats.storyCount >= storageStats.maxStories) {
            setShowLimitReachedDialog(true);
        }
    }, [storageStats]);

    useEffect(() => {
        const handleStorageQuotaExceeded = () => {
            toast({
                variant: "destructive",
                title: "Almacenamiento Lleno",
                description: "Has alcanzado el límite de almacenamiento. Las historias antiguas se eliminarán automáticamente para hacer espacio.",
                duration: 5000,
            });
        };

        window.addEventListener('storageQuotaExceeded', handleStorageQuotaExceeded);
        
        return () => {
            window.removeEventListener('storageQuotaExceeded', handleStorageQuotaExceeded);
        };
    }, [toast]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            theme: "",
            mainCharacterName: "",
            mainCharacterTraits: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (storageStats.storyCount >= storageStats.maxStories) {
            setShowLimitReachedDialog(true);
            return;
        }

        setIsLoading(true);
        
        // Simulación de progreso más realista
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const result = await generateStoryAction(values);
        setIsLoading(false);

        if (result.success && result.data) {
            toast({
                title: "¡Cuento Creado!",
                description: "Tu nueva aventura te espera.",
                className: "animate-fade-in-down",
            });
            onStoryGenerated({
                ...values,
                title: result.data.title,
                content: result.data.story,
                imageUrl: result.data.imageUrl,
            });
        } else {
            toast({
                variant: "destructive",
                title: "¡Oh no! Algo salió mal.",
                description: result.error,
            });
        }
    }

    return (
        <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">
                    Comienza Tu Cuento
                </CardTitle>
                <CardDescription>
                    Rellena los detalles a continuación para crear un relato
                    único.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <AlertDialog open={showLimitReachedDialog} onOpenChange={setShowLimitReachedDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center text-red-500">
                                        <AlertCircle className="mr-2" /> Límite de Cuentos Alcanzado
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Has alcanzado el límite máximo de {storageStats.maxStories} cuentos. Para crear uno nuevo, por favor elimina uno o más cuentos existentes.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogAction onClick={() => setShowLimitReachedDialog(false)}>Entendido</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <FormField
                            control={form.control}
                            name="theme"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tema</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tema para tu cuento" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {themes.map((theme) => (
                                                <SelectItem
                                                    key={theme}
                                                    value={theme}
                                                >
                                                    {theme}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mainCharacterName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Personaje</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Leo el León Valiente"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mainCharacterTraits"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rasgos del Personaje</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ej: Curioso, amable y le encanta explorar ruinas antiguas."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-3">

                        <StoryProgress isLoading={isLoading} />
                        <AnimatedButton
                            type="submit"
                            isLoading={isLoading}
                            loadingText="Tejiendo Magia..."
                            icon={<Wand2 className="h-5 w-5" />}
                            className="w-full"
                            size="lg"
                        >
                            Generar Cuento
                        </AnimatedButton>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
