/**
 * @module StoryGeneratorFormModule
 * @description Este módulo contiene el componente `StoryGeneratorForm` que permite a los usuarios
 * generar nuevas historias proporcionando un tema, el nombre del personaje principal y sus rasgos.
 * Incluye validación de formulario, manejo de estados de carga y límites de generación,
 * así como un sistema de "cooldown" para controlar la frecuencia de generación de historias.
 */

"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, AlertCircle } from "lucide-react";
import StoryProgress from "@/components/story-progress";
import AnimatedButton from "@/components/animated-button";
import { Input } from "@/components/ui/input";
import { InputWithTags } from "@/components/ui/input-with-tags";
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
    "Animales 🐾",
    "Aventura 🗺️",
    "Ciencia Ficción 🚀",
    "Cuento de Hadas 🧚🏻‍♀️",
    "Deportes 🏅",
    "Dragones 🐉",
    "Duendes 🍀",
    "Familia 👨🏻‍👩🏻‍👧🏻‍👦🏻",
    "Fantasía ✨",
    "Magia 🪄",
    "Misterio 🕵🏻",
    "Mitos 🏛️",
    "Princesas 👸🏻",
    "Superheroes 🦸🏻‍♂️",
    "Valores ❤️",
    "Viajes ✈️",
];

const formSchema = z.object({
    theme: z.string().min(1, "Por favor selecciona un tema."),
    mainCharacterName: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres.")
        .max(30, "El nombre no puede exceder los 30 caracteres."),
    mainCharacterTraits: z
        .array(
            z
                .string()
                .min(2, "Cada rasgo debe tener al menos 2 caracteres.")
                .max(20, "Máximo 20 caracteres por rasgo.")
        )
        .min(1, "Agrega al menos un rasgo.")
        .max(5, "Máximo 5 rasgos permitidos."),
});

type StoryGeneratorFormProps = {
    onStoryGenerated: (story: Story) => void;
    storyCount: number;
    maxStories: number;
    cooldownDuration?: number; // Duración del cooldown en segundos
};

export default function StoryGeneratorForm({
    onStoryGenerated,
    storyCount,
    maxStories,
    cooldownDuration = 180, // Por defecto 3 minutos (180 segundos)
}: StoryGeneratorFormProps) {
    // Detectar si el tema es princesa o príncipe para coherencia visual
    const [isLoading, setIsLoading] = useState(false);
    const hasReachedLimit = storyCount >= maxStories;
    // const [storageWarning, setStorageWarning] = useState(false); // Legacy: almacenamiento local
    const [cooldownActive, setCooldownActive] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    /**
     * @function startCooldown
     * @description Inicia el temporizador de cooldown (sin almacenamiento local, legacy removido).
     * @param {number} duration Duración del cooldown en segundos.
     */
    const startCooldown = (duration: number) => {
        const endTime = Date.now() + duration * 1000;
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
            } else {
                setCooldownRemaining(remaining);
            }
        }, 1000);
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            theme: "",
            mainCharacterName: "",
            mainCharacterTraits: [],
        },
    });
    // Detectar el tema seleccionado
    const themeValue = form.watch("theme");
    // Definir clases especiales para princesa/príncipe o azul para el otro tema
    let tagInputThemeClass = "blue";
    if (
        themeValue &&
        (themeValue.toLowerCase().includes("princesa") ||
            themeValue.toLowerCase().includes("príncipe") ||
            themeValue.toLowerCase().includes("principe"))
    ) {
        tagInputThemeClass = "pink";
    }

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
                    "Has llegado al límite de 5 cuentos. Por favor, elimina uno o más cuentos para poder generar nuevos.",
                duration: 5000,
            });
            return;
        }

        setIsLoading(true);
        startCooldown(cooldownDuration); // Iniciar el cooldown al enviar el formulario

        // Simulación de progreso más realista
        // No se pasa el prop 'messages' a StoryProgress aquí, por lo que usará los mensajes por defecto para la generación de cuentos.
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Convert mainCharacterTraits array to comma-separated string for backend compatibility
        const result = await generateStoryAction({
            ...values,
            mainCharacterTraits: values.mainCharacterTraits.join(", "),
        });
        setIsLoading(false);

        if (result.success && result.data) {
            toast({
                title: "¡Cuento Creado!",
                description: "Tu nueva aventura te espera.",
                className: "animate-fade-in-down",
            });
            // La historia ya fue creada en la base de datos por generateStoryAction
            // Emitir evento personalizado para que otros componentes se actualicen
            window.dispatchEvent(
                new CustomEvent("storyCreated", {
                    detail: { storyId: result.data.id },
                })
            );

            // Pasamos la historia completa con ID y datos
            onStoryGenerated({
                id: result.data.id,
                theme: values.theme,
                mainCharacterName: values.mainCharacterName,
                mainCharacterTraits: values.mainCharacterTraits.join(", "),
                title: result.data.title,
                content: result.data.content,
                imageUrl: result.data.imageUrl,
                createdAt: new Date().toISOString(),
                audioSrc: undefined,
                favorite: false,
                extendedCount: 0,
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
                <CardTitle className="font-headline text-2xl text-center">
                    Comienza Tu Cuento
                </CardTitle>
                <CardDescription className="text-center">
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
                                        <SelectContent
                                            position="popper"
                                            className="max-h-48 overflow-y-auto"
                                        >
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
                            render={({ field }) => {
                                const maxLength = 31;
                                return (
                                    <FormItem>
                                        <FormLabel>
                                            Nombre del Personaje
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: Leo el León Valiente"
                                                maxLength={maxLength}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <FormField
                            control={form.control}
                            name="mainCharacterTraits"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rasgos del Personaje</FormLabel>
                                    <FormControl>
                                        <InputWithTags
                                            key={tagInputThemeClass}
                                            placeholder="Ej: Curioso, amable, explorador, valiente, soñador"
                                            className={
                                                tagInputThemeClass === "pink"
                                                    ? "bg-pink-50 border-pink-300 focus-visible:ring-pink-400"
                                                    : "bg-blue-50 border-blue-300 focus-visible:ring-blue-400"
                                            }
                                            tagThemeClass={tagInputThemeClass}
                                            value={field.value}
                                            onChange={field.onChange}
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
