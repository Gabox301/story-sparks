"use client";

import { useState, useEffect, useRef } from "react";
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
    storyCount: number;
    maxStories: number;
    cooldownDuration?: number; // Duración del cooldown en segundos, por defecto 30
};

export default function StoryGeneratorForm({
    onStoryGenerated,
    storyCount,
    maxStories,
    cooldownDuration = 120, // Por defecto 2 minutos (120 segundos)
}: StoryGeneratorFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const hasReachedLimit = storyCount >= maxStories;
    const [storageWarning, setStorageWarning] = useState(false);
    const [cooldownActive, setCooldownActive] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    /**
     * @function startCooldown
     * @description Inicia el temporizador de cooldown y guarda la marca de tiempo en localStorage.
     * @param {number} duration Duración del cooldown en segundos.
     */
    const startCooldown = (duration: number) => {
        const endTime = Date.now() + duration * 1000;
        localStorage.setItem("storyGenCooldownEndTime", endTime.toString());
        setCooldownActive(true);
        setCooldownRemaining(duration);

        if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
        }

        cooldownTimerRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.round((endTime - now) / 1000);
            if (remaining <= 0) {
                clearInterval(cooldownTimerRef.current!);
                setCooldownActive(false);
                setCooldownRemaining(0);
                localStorage.removeItem("storyGenCooldownEndTime");
            } else {
                setCooldownRemaining(remaining);
            }
        }, 1000);
    };

    useEffect(() => {
        // Cargar el estado del cooldown desde localStorage al montar el componente
        const storedEndTime = localStorage.getItem("storyGenCooldownEndTime");
        if (storedEndTime) {
            const endTime = parseInt(storedEndTime, 10);
            const now = Date.now();
            const remaining = Math.round((endTime - now) / 1000);
            if (remaining > 0) {
                startCooldown(remaining);
            } else {
                localStorage.removeItem("storyGenCooldownEndTime");
            }
        }

        // Limpiar el temporizador al desmontar el componente
        return () => {
            if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current);
            }
        };
    }, []); // Se ejecuta solo una vez al montar el componente

    useEffect(() => {
        const handleStorageQuotaExceeded = () => {
            setStorageWarning(true);
            toast({
                variant: "destructive",
                title: "Almacenamiento Lleno",
                description:
                    "Has alcanzado el límite de almacenamiento. Las historias antiguas se eliminarán automáticamente para hacer espacio.",
                duration: 5000,
            });

            // Ocultar advertencia después de 5 segundos
            setTimeout(() => setStorageWarning(false), 5000);
        };

        window.addEventListener(
            "storageQuotaExceeded",
            handleStorageQuotaExceeded
        );

        return () => {
            window.removeEventListener(
                "storageQuotaExceeded",
                handleStorageQuotaExceeded
            );
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

    /**
     * @function onSubmit
     * @description Maneja el envío del formulario para generar una historia.
     * @param {z.infer<typeof formSchema>} values Los valores del formulario.
     */
    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (hasReachedLimit) {
            toast({
                variant: "destructive",
                title: "¡Límite de Cuentos Alcanzado!",
                description:
                    "Has llegado al límite de 4 cuentos. Por favor, elimina uno o más cuentos para generar nuevos.",
                duration: 5000,
            });
            return;
        }

        setIsLoading(true);
        startCooldown(cooldownDuration); // Iniciar el cooldown al enviar el formulario

        // Simulación de progreso más realista
        // No se pasa el prop 'messages' a StoryProgress aquí, por lo que usará los mensajes por defecto para la generación de cuentos.
        await new Promise((resolve) => setTimeout(resolve, 100));

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
                        {hasReachedLimit && (
                            <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                                <AlertCircle className="h-5 w-5" />
                                <span>
                                    Has alcanzado el límite de {maxStories}{" "}
                                    cuentos. Elimina uno para crear más.
                                </span>
                            </div>
                        )}
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
                        {storageWarning && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                    Almacenamiento casi lleno. Las historias
                                    antiguas se eliminarán automáticamente.
                                </span>
                            </div>
                        )}
                        <StoryProgress isLoading={isLoading} />
                        <AnimatedButton
                            type="submit"
                            isLoading={isLoading || cooldownActive}
                            loadingText={
                                isLoading
                                    ? "Tejiendo Magia..."
                                    : cooldownActive
                                    ? `Acumulando Magia (${Math.round(
                                          ((cooldownDuration -
                                              cooldownRemaining) /
                                              cooldownDuration) *
                                              100
                                      )}%)`
                                    : "Generar Cuento"
                            }
                            icon={<Wand2 className="h-5 w-5" />}
                            className="w-full"
                            size="lg"
                            disabled={
                                isLoading || hasReachedLimit || cooldownActive
                            }
                        >
                            Generar Cuento
                        </AnimatedButton>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
